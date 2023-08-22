import { useState } from "react";
import { useEffect } from "react";
import "./App.css";
import AttackBox from "./components/AttackBox/AttackBox";
import ChatBox from "./components/ChatBox/ChatBox";
import DefenceBox from "./components/DefenceBox/DefenceBox";
import EmailBox from "./components/EmailBox/EmailBox";
import PhaseSelectionBox from "./components/PhaseSelectionBox/PhaseSelectionBox";
import Header from "./components/Header";
import ModelSelectionBox from "./components/ModelSelectionBox/ModelSelectionBox";
import ExportPDFLink from "./components/ExportChat/ExportPDFLink";
import { EmailInfo } from "./models/email";
import { CHAT_MESSAGE_TYPE, ChatMessage } from "./models/chat";
import { DefenceInfo } from "./models/defence";
import { getCompletedPhases } from "./service/phaseService";
import { clearEmails } from "./service/emailService";
import { clearChat } from "./service/chatService";
import { resetActiveDefences } from "./service/defenceService";
import { PHASES } from "./Phases";
import { ATTACKS_ALL, ATTACKS_PHASE_1 } from "./Attacks";
import { DEFENCE_DETAILS_ALL, DEFENCE_DETAILS_PHASE } from "./Defences";

function App() {
  const [defenceBoxKey, setDefenceBoxKey] = useState<number>(0);
  const [emails, setEmails] = useState<EmailInfo[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [defencesToShow, setDefencesToShow] =
    useState<DefenceInfo[]>(DEFENCE_DETAILS_ALL);
  const [triggeredDefences, setTriggeredDefences] = useState<string[]>([]);

  // start on sandbox mode
  const [currentPhase, setCurrentPhase] = useState<number>(3);
  const [numCompletedPhases, setNumCompletedPhases] = useState<number>(0);

  const updateTriggeredDefences = (defenceDetails: string[]) => {
    // set the new triggered defences
    setTriggeredDefences(defenceDetails);
    // update the key of the defence box to force a re-render
    setDefenceBoxKey(defenceBoxKey + 1);

    // add a message to the chat
    defenceDetails.forEach((defence) => {
      defenceTriggered(defence);
    });
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

  const addDefenceTriggeredMessage = (message: string) => {
    addChatMessage({
      message: message,
      type: CHAT_MESSAGE_TYPE.DEFENCE_TRIGGERED,
      isOriginalMessage: true,
    });
  };
  const addPhasePreambleMessage = (message: string) => {
    addChatMessage({
      message: message,
      type: CHAT_MESSAGE_TYPE.PHASE_INFO,
      isOriginalMessage: true,
    });
  };

  const clearMessages = () => {
    // resetting the current phase will also reset the messages
    setNewPhase(currentPhase);
  };

  const clearEmailBox = () => {
    setEmails([]);
    clearEmails();
  };

  const setNewPhase = (newPhase: number) => {
    // reset emails and messages from front and backend
    clearChat();
    clearEmailBox();
    // clear frontend messages
    setMessages([]);
    setCurrentPhase(newPhase);

    resetActiveDefences();

    // add the preamble to the chat
    const preambleMessage = PHASES[newPhase].preamble;
    addPhasePreambleMessage(preambleMessage.toLowerCase());

    // choose appropriate defences to display
    newPhase === 2
      ? setDefencesToShow(DEFENCE_DETAILS_PHASE)
      : setDefencesToShow(DEFENCE_DETAILS_ALL);
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

  //a add a message to the chat when a defence is triggered
  const defenceTriggered = (id: String) => {
    const defenceInfo = DEFENCE_DETAILS_ALL.find(
      (defence) => defence.id === id
    )?.name;
    const infoMessage = `${defenceInfo} defence triggered`;
    addDefenceTriggeredMessage(infoMessage.toLowerCase());
  };

  // called on mount
  useEffect(() => {
    getCompletedPhases().then((numCompletedPhases) => {
      setNumCompletedPhases(numCompletedPhases);
    });
    setNewPhase(currentPhase);
  }, []);

  return (
    <span id="main-area">
      <div className="side-bar">
        {/* hide defence box on phases 0 and 1 */}
        {currentPhase >= 2 && (
          <DefenceBox
            key={defenceBoxKey}
            defences={defencesToShow}
            triggeredDefences={triggeredDefences}
            defenceActivated={defenceActivated}
            defenceDeactivated={defenceDeactivated}
          />
        )}
        {/* show reduced set of attacks on phase 1 */}
        {currentPhase === 1 && <AttackBox attacks={ATTACKS_PHASE_1} />}
        {/* show all attacks on phase 2 and sandbox */}
        {currentPhase >= 2 && <AttackBox attacks={ATTACKS_ALL} />}
        {/* hide model selection box on phases 0 and 1 */}
        {currentPhase > 2 && <ModelSelectionBox />}
        <ExportPDFLink
          messages={messages}
          emails={emails}
          currentPhase={currentPhase}
        />
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
          setNewPhase={setNewPhase}
        />
        <EmailBox emails={emails} />
      </div>
    </span>
  );
}

export default App;
