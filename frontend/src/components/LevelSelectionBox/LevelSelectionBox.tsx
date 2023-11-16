import './LevelSelectionBox.css';

import { LEVELS } from '@src/Levels';
import ThemedButton from '@src/components/ThemedButtons/ThemedButton';
import { LEVEL_NAMES, Level } from '@src/models/level';

export interface LevelSelectionBoxProps {
	currentLevel: LEVEL_NAMES;
	numCompletedLevels: number;
	setCurrentLevel: (newLevel: LEVEL_NAMES) => void;
}

function LevelSelectionBox({
	currentLevel,
	numCompletedLevels,
	setCurrentLevel,
}: LevelSelectionBoxProps) {
	// display levels 1-3
	const displayLevels = LEVELS.filter(
		(level) => level.id !== LEVEL_NAMES.SANDBOX
	);

	function handleLevelChange(newLevel: LEVEL_NAMES) {
		if (newLevel !== currentLevel) {
			setCurrentLevel(newLevel);
		}
	}
	return (
		<div className="level-selection-box">
			{displayLevels.map((level: Level, index: number) => {
				return (
					<ThemedButton
						key={level.name}
						onClick={() => {
							handleLevelChange(level.id);
						}}
						disabled={index > numCompletedLevels}
						selected={level.id === currentLevel}
					>
						{level.name}
					</ThemedButton>
				);
			})}
		</div>
	);
}

export default LevelSelectionBox;
