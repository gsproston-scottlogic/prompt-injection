import { useState } from "react";
import { useEffect } from "react";
import "./App.css";
import AttackBox from "./components/AttackBox/AttackBox";
import ChatBox from "./components/ChatBox/ChatBox";
import DefenceBox from "./components/DefenceBox/DefenceBox";
import EmailBox from "./components/EmailBox/EmailBox";
import ApiKeyBox from "./components/ApiKeyBox/ApiKeyBox";
import PhaseSelectionBox from "./components/PhaseSelectionBox/PhaseSelectionBox";
import Header from "./components/Header";
import ModelSelectionBox from "./components/ModelSelectionBox/ModelSelectionBox";
import { EmailInfo } from "./models/email";
import { CHAT_MESSAGE_TYPE, ChatMessage } from "./models/chat";
import { DefenceInfo } from "./models/defence";
import { getCompletedPhases } from "./service/phaseService";

function App() {
  const [defenceBoxKey, setDefenceBoxKey] = useState<number>(0);
  const [emails, setEmails] = useState<EmailInfo[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [triggeredDefences, setTriggeredDefences] = useState<string[]>([]);

  // start on sandbox mode
  const [currentPhase, setCurrentPhase] = useState<number>(0);
  const [numCompletedPhases, setNumCompletedPhases] = useState<number>(0);

  const updateTriggeredDefences = (defenceDetails: string[]) => {
    // set the new triggered defences
    setTriggeredDefences(defenceDetails);
    // update the key of the defence box to force a re-render
    setDefenceBoxKey(defenceBoxKey + 1);
  };

  // methods to modify messages
  const addChatMessage = (message: ChatMessage) => {
    setMessages((messages: ChatMessage[]) => [...messages, message]);
  };
  const addInfoMessage = (message: string) => {
    addChatMessage({
      message: message,
      type: CHAT_MESSAGE_TYPE.INFO,
      isOriginalMessage: true,
    });
  };
  const clearMessages = () => {
    setMessages([]);
  };

  // methods to be called when defences are (de)activated
  // this adds an info message to the chat
  const defenceActivated = (defenceInfo: DefenceInfo) => {
    const infoMessage = `${defenceInfo.name} defence activated`;
    addInfoMessage(infoMessage.toLowerCase());
  };
  const defenceDeactivated = (defenceInfo: DefenceInfo) => {
    const infoMessage = `${defenceInfo.name} defence deactivated`;
    addInfoMessage(infoMessage.toLowerCase());
  };
  // called on mount
  useEffect(() => {
    getCompletedPhases().then((numCompletedPhases) => {
      setNumCompletedPhases(numCompletedPhases);
    });
  }, []);

  return (
    <span id="main-area">
      <div className="side-bar">
        {/* hide components when in phase 0 */}
        {currentPhase !== 0 && (
          <DefenceBox
            key={defenceBoxKey}
            triggeredDefences={triggeredDefences}
            defenceActivated={defenceActivated}
            defenceDeactivated={defenceDeactivated}
          />
        )}
        {currentPhase !== 0 && <AttackBox />}
        {currentPhase !== 0 && <ApiKeyBox />}
        {currentPhase !== 0 && <ModelSelectionBox />}
      </div>
      <div id="centre-area">
        <Header />
        <ChatBox
          messages={messages}
          currentPhase={currentPhase}
          setNumCompletedPhases={setNumCompletedPhases}
          setEmails={setEmails}
          updateTriggeredDefences={updateTriggeredDefences}
          addChatMessage={addChatMessage}
          clearMessages={clearMessages}
        />
      </div>
      <div className="side-bar">
        <PhaseSelectionBox
          currentPhase={currentPhase}
          numCompletedPhases={numCompletedPhases}
          setCurrentPhase={setCurrentPhase}
        />
        <EmailBox emails={emails} />
      </div>
    </span>
  );
}

export default App;
