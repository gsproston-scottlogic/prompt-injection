import { LEVEL_NAMES } from "../../models/level";
import ProjectIconDark from "../MainComponent/ProjectIconDark";
import "./OverlayWelcome.css";

function OverlayWelcome({
  setStartLevel,
}: {
  setStartLevel: (newLevel: LEVEL_NAMES) => void;
}) {
  return (
    <div className="welcome">
      <div className="project-icon">
        <ProjectIconDark />
      </div>
      <h1>Welcome to Spy Logic!</h1>
      <p>
        This is an app we developed to teach you about AI chat system security
        in a playful way. In this game you are playing the role of an industrial
        spy, trying to access secrets using the organisation&apos;s integrated
        AI chatbot system.
      </p>
      <h2>Your mission</h2>
      <p>
        You have joined the popular soft drink producer Scott Bru as a
        developer, but have actually been hired by their largest competitor to
        steal the Scott Bru recipe.
      </p>
      <p>
        <b>But first,</b> are you a beginner spy, and wish to play through the
        levels from the beginning, or are you an expert spy, and would prefer to
        jump straight in at the sandbox?
      </p>

      <div className="start-level-selection-buttons">
        <button
          onClick={() => {
            setStartLevel(LEVEL_NAMES.LEVEL_1);
          }}
        >
          Beginner
        </button>
        <button
          onClick={() => {
            setStartLevel(LEVEL_NAMES.SANDBOX);
          }}
        >
          Expert
        </button>
      </div>
    </div>
  );
}

export default OverlayWelcome;
