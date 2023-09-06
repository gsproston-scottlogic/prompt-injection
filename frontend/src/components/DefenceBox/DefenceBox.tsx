import "../StrategyBox/StrategyBox.css";
import DefenceMechanism from "./DefenceMechanism";
import { DefenceConfig, DefenceInfo } from "../../models/defence";

function DefenceBox({
  defences,
  showConfigurations,
  setDefenceActive,
  setDefenceInactive,
  setDefenceConfiguration,
}: {
  currentPhase: number;
  defences: DefenceInfo[];
  showConfigurations: boolean;
  setDefenceActive: (defenceId: string) => void;
  setDefenceInactive: (defenceId: string) => void;
  setDefenceConfiguration: (
    defenceId: string,
    config: DefenceConfig[]
  ) => Promise<boolean>;
}) {
  return (
    <div id="strategy-box">
      <div className="side-bar-header">Defences</div>
      {defences.map((defence, index) => {
        return (
          <DefenceMechanism
            key={index}
            defenceDetail={defence}
            showConfigurations={showConfigurations}
            setDefenceActive={setDefenceActive}
            setDefenceInactive={setDefenceInactive}
            setDefenceConfiguration={setDefenceConfiguration}
          />
        );
      })}
    </div>
  );
}

export default DefenceBox;
