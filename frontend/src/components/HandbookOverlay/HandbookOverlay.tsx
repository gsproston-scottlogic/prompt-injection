import { useEffect, useState } from "react";
import { LEVEL_NAMES } from "../../models/level";
import HandbookAttacks from "./HandbookAttacks";
import HandbookOverlayTabs from "./HandbookOverlayTabs";
import { HANDBOOK_PAGES, handbookPageNames } from "../../models/handbook";
import "./HandbookOverlay.css";
import HandbookGlossary from "./HandbookGlossary";
import HandbookSystemRole from "./HandbookSystemRole";
import { getLevelPrompt } from "../../service/levelService";

function HandbookOverlay({
  currentLevel,
  closeOverlay,
}: {
  currentLevel: LEVEL_NAMES;
  closeOverlay: () => void;
}) {
  const [selectedPage, setSelectedPage] = useState<HANDBOOK_PAGES>(
    HANDBOOK_PAGES.GLOSSARY
  );
  const [levelSystemRole, setLevelSystemRole] = useState<string>("");

  // update system role when currentLevel changes to display in handbook
  useEffect(() => {
    if (
      currentLevel > LEVEL_NAMES.LEVEL_1 &&
      currentLevel < LEVEL_NAMES.SANDBOX
    ) {
      getLevelPrompt(currentLevel - 1)
        .then((prompt) => {
          setLevelSystemRole(prompt);
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }, [currentLevel]);

  const pageContent = {
    [HANDBOOK_PAGES.ATTACKS]: <HandbookAttacks currentLevel={currentLevel} />,
    [HANDBOOK_PAGES.GLOSSARY]: <HandbookGlossary />,
    [HANDBOOK_PAGES.SYSTEM_ROLE]: (
      <HandbookSystemRole level={currentLevel} systemRole={levelSystemRole} />
    ),
  }[selectedPage];

  return (
    <div className="handbook-overlay">
      <section className="spine">
        <HandbookOverlayTabs
          currentLevel={currentLevel}
          currentPage={selectedPage}
          selectPage={setSelectedPage}
        />
      </section>
      <div
        className="content"
        role="tabpanel"
        aria-label={handbookPageNames[selectedPage]}
      >
        {pageContent}
      </div>
    </div>
  );
}

export default HandbookOverlay;
