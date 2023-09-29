import { Level, LEVEL_NAMES } from "../../models/level";
import { LEVELS } from "../../Levels";

import "./LevelSelectionBox.css";
import CustomButton from "../CustomButton/CustomButton";

function LevelSelectionBox({
  currentLevel,
  numCompletedLevels,
  setNewLevel,
}: {
  currentLevel: LEVEL_NAMES;
  numCompletedLevels: number;
  setNewLevel: (newLevel: number) => void;
}) {
  function handleLevelChange(newLevel: LEVEL_NAMES) {
    if (newLevel !== currentLevel) {
      console.log(`Changing level to ${newLevel}`);
      setNewLevel(newLevel);
    }
  }

  return (
    <span>
      <div id="level-selection-box">
        {LEVELS.map((level: Level, index: number) => {
          return (
            <span className="level-selection-button">
              <CustomButton
                key={level.name}
                text={level.name}
                onClick={() => {
                  handleLevelChange(level.id);
                }}
                isDisabled={
                  index > numCompletedLevels && level.id !== LEVEL_NAMES.SANDBOX
                }
                isSelected={level.id === currentLevel}
              />
            </span>
          );
        })}
      </div>
    </span>
  );
}

export default LevelSelectionBox;
