import { HANDBOOK_PAGES } from "../../models/handbook";
import "./HandbookOverlayTabs.css";

function HandbookOverlayTabs({
  setSelectedPage,
}: {
  setSelectedPage: (page: HANDBOOK_PAGES) => void;
}) {
  const tabs = [
    {id: HANDBOOK_PAGES.MISSION_INFO, label: "Mission Info" },
    { id: HANDBOOK_PAGES.ATTACKS, label: "Attacks" },
    { id: HANDBOOK_PAGES.TOOLS, label: "Tools" },
  ];

  return (
    <div className="tabs">
      {tabs.map((tab) => (
        <div key={tab.id}>
          <input
            type="radio"
            name="tabs"
            id={tab.id}
            defaultChecked={tab.id === HANDBOOK_PAGES.MISSION_INFO}
            onClick={() => {
              setSelectedPage(tab.id);
            }}
          />
          <label htmlFor={tab.id}>{tab.label}</label>
        </div>
      ))}
    </div>
  );
}

export default HandbookOverlayTabs;
