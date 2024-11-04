import { IDocument } from '@cyntler/react-doc-viewer';
import { useEffect, useRef, useState, JSX } from 'react';

import DocumentViewBox from '@src/components/DocumentViewer/DocumentViewBox';
import HandbookOverlay from '@src/components/HandbookOverlay/HandbookOverlay';
import LevelMissionInfoBanner from '@src/components/LevelMissionInfoBanner/LevelMissionInfoBanner';
import ResetLevelOverlay from '@src/components/Overlay/ResetLevel';
import ResetProgressOverlay from '@src/components/Overlay/ResetProgress';
import { DEFAULT_DEFENCES } from '@src/defences';
import { ChatMessage, ChatModel } from '@src/models/chat';
import {
	DEFENCE_ID,
	DefenceConfigItem,
	Defence,
	DEFENCE_CONFIG_ITEM_ID,
} from '@src/models/defence';
import { EmailInfo } from '@src/models/email';
import { LEVEL_NAMES, LevelSystemRole } from '@src/models/level';
import {
	chatService,
	defenceService,
	levelService,
	resetService,
	startService,
} from '@src/service';

import MainBody from './MainBody';
import MainFooter from './MainFooter';
import MainHeader from './MainHeader';

import './MainComponent.css';

function MainComponent({
	currentLevel,
	numCompletedLevels,
	closeOverlay,
	updateNumCompletedLevels,
	openInformationOverlay,
	openLevelsCompleteOverlay,
	openOverlay,
	openWelcomeOverlay,
	setCurrentLevel,
	resetCompletedLevels,
	setIsNewUser,
}: {
	currentLevel: LEVEL_NAMES;
	numCompletedLevels: number;
	closeOverlay: () => void;
	updateNumCompletedLevels: (level: LEVEL_NAMES) => void;
	openInformationOverlay: () => void;
	openLevelsCompleteOverlay: () => void;
	openOverlay: (overlayComponent: JSX.Element) => void;
	openWelcomeOverlay: () => void;
	setCurrentLevel: (newLevel: LEVEL_NAMES) => void;
	resetCompletedLevels: () => void;
	setIsNewUser: (isNewUser: boolean) => void;
}) {
	const [mainBodyKey, setMainBodyKey] = useState<number>(0);
	const [defences, setDefences] = useState<Defence[]>(DEFAULT_DEFENCES);
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [emails, setEmails] = useState<EmailInfo[]>([]);
	const [chatModels, setChatModels] = useState<string[]>([]);
	const [systemRoles, setSystemRoles] = useState<LevelSystemRole[]>([]);
	const [chatModel, setChatModel] = useState<ChatModel | undefined>();
	const [documents, setDocuments] = useState<IDocument[] | undefined>();
	const isFirstRender = useRef(true);

	// facilitate refresh / first render
	useEffect(() => {
		console.log(
			'Loading initial backend data plus data for level',
			currentLevel
		);
		void loadBackendData();
	}, []);

	// facilitate level change
	useEffect(() => {
		if (!isFirstRender.current) {
			console.log('Loading backend data for level', currentLevel);
			void setNewLevel(currentLevel);
		}
		isFirstRender.current = false;
	}, [currentLevel]);

	async function loadBackendData() {
		try {
			const { availableModels, systemRoles, ...levelData } =
				await startService.start(currentLevel);

			setChatModels(availableModels);
			setSystemRoles(systemRoles);
			processBackendLevelData({
				level: currentLevel,
				...levelData,
			});
		} catch (err) {
			console.warn(err);
			setMessages([
				{
					message: 'Failed to reach the server. Please try again later.',
					type: 'ERROR_MSG',
				},
			]);
		}
	}

	function openResetLevelOverlay() {
		openOverlay(
			<ResetLevelOverlay
				currentLevel={currentLevel}
				resetLevel={async () => {
					await resetLevel();
					closeOverlay();
				}}
				closeOverlay={closeOverlay}
			/>
		);
	}

	function openHandbook() {
		openOverlay(
			<HandbookOverlay
				currentLevel={currentLevel}
				numCompletedLevels={numCompletedLevels}
				systemRoles={systemRoles}
				closeOverlay={closeOverlay}
			/>
		);
	}

	function openDocumentViewer() {
		openOverlay(
			<DocumentViewBox documents={documents} closeOverlay={closeOverlay} />
		);
	}

	// methods to modify messages
	function addChatMessage(message: ChatMessage) {
		setMessages((messages: ChatMessage[]) => [...messages, message]);
	}

	function addSentEmails(newEmails: EmailInfo[]) {
		setEmails(emails.concat(newEmails));
	}

	function resetFrontendState() {
		setMessages([]);
		setEmails([]);
		if (currentLevel !== LEVEL_NAMES.SANDBOX) {
			setMessagesWithWelcome([]);
		}
	}

	async function resetLevel() {
		const chatInfoMessage = await resetService.resetLevelProgress(currentLevel);

		resetFrontendState();
		setMessages((messages: ChatMessage[]) => [chatInfoMessage, ...messages]);
	}

	// for going switching level without clearing progress
	async function setNewLevel(newLevel: LEVEL_NAMES) {
		const levelData = await levelService.loadLevel(newLevel);
		processBackendLevelData({
			level: newLevel,
			...levelData,
		});
	}

	function processBackendLevelData({
		level,
		emails,
		chatHistory,
		defences,
		chatModel,
		documents,
	}: {
		level: LEVEL_NAMES;
		emails: EmailInfo[];
		chatHistory: ChatMessage[];
		defences: Defence[];
		chatModel?: ChatModel;
		documents?: IDocument[];
	}) {
		setEmails(emails);

		// add welcome message for levels only
		level !== LEVEL_NAMES.SANDBOX
			? setMessagesWithWelcome(chatHistory)
			: setMessages(chatHistory);

		setDefences(defences);

		// These will only be defined if level is SANDBOX
		setChatModel(chatModel);
		setDocuments(documents);

		setMainBodyKey((value) => value + 1);
	}

	function addInfoMessage(message: string) {
		addChatMessage({
			message,
			type: 'GENERIC_INFO',
		});
		// asynchronously add message to chat history
		void chatService.addInfoMessageToChatHistory(
			message,
			'GENERIC_INFO',
			currentLevel
		);
	}

	function addConfigUpdateToChat(defenceId: DEFENCE_ID, update: string) {
		const displayedDefenceId = defenceId.replace(/_/g, ' ').toLowerCase();
		addInfoMessage(`${displayedDefenceId} defence ${update}`);
	}

	async function resetDefenceConfiguration(
		defenceId: DEFENCE_ID,
		configItemId: DEFENCE_CONFIG_ITEM_ID
	) {
		const resetDefence = await defenceService.resetDefenceConfigItem(
			defenceId,
			configItemId,
			currentLevel
		);
		if (!resetDefence) {
			addChatMessage({
				message: 'Failed to reset defence configuration. Please try again.',
				type: 'ERROR_MSG',
			});
			return;
		}
		addConfigUpdateToChat(defenceId, 'reset');
		// update state
		const newDefences = defences.map((defence) => {
			if (defence.id === defenceId) {
				defence.config.forEach((config) => {
					if (config.id === configItemId) {
						config.value = resetDefence.value.trim();
					}
				});
			}
			return defence;
		});
		setDefences(newDefences);
	}

	async function setDefenceToggle(defence: Defence) {
		const chatInfoMessage = await defenceService.toggleDefence(
			defence.id,
			defence.isActive,
			currentLevel
		);

		if (chatInfoMessage) {
			addChatMessage(chatInfoMessage);
			const newDefenceDetails = defences.map((defenceDetail) => {
				if (defenceDetail.id === defence.id) {
					defenceDetail.isActive = !defence.isActive;
				}
				return defenceDetail;
			});

			setDefences(newDefenceDetails);
		}
	}

	async function setDefenceConfiguration(
		defenceId: DEFENCE_ID,
		config: DefenceConfigItem[]
	) {
		const resultingChatInfoMessage = await defenceService.configureDefence(
			defenceId,
			config,
			currentLevel
		);
		if (resultingChatInfoMessage) {
			addChatMessage(resultingChatInfoMessage);
			// update state
			const newDefences = defences.map((defence) => {
				if (defence.id === defenceId) {
					defence.config = config;
				}
				return defence;
			});
			setDefences(newDefences);
		}
		return resultingChatInfoMessage !== null;
	}

	function setMessagesWithWelcome(retrievedMessages: ChatMessage[]) {
		const welcomeMessage: ChatMessage = {
			message: `Hello! I'm ScottBrewBot, your personal AI work assistant. You can ask me for information or to help you send emails. What can I do for you?`,
			type: 'BOT',
		};
		// if reset level add welcome into second position, otherwise add to first
		if (retrievedMessages.length === 0) {
			setMessages([welcomeMessage]);
		} else if (retrievedMessages[0].type === 'RESET_LEVEL') {
			retrievedMessages.splice(1, 0, welcomeMessage);
			setMessages(retrievedMessages);
		} else {
			setMessages([welcomeMessage, ...retrievedMessages]);
		}
	}

	function setChatModelId(modelId: ChatModel['id']) {
		if (!chatModel) {
			console.error(
				'You are trying to change the id of the chatModel but it has not been loaded yet'
			);
			return;
		}
		setChatModel({ ...chatModel, id: modelId });
	}

	// reset whole game progress and start from level 1 or Sandbox
	async function resetProgress() {
		const levelData = await resetService.resetAllProgress(currentLevel);
		resetCompletedLevels();

		if (
			currentLevel === LEVEL_NAMES.SANDBOX ||
			currentLevel === LEVEL_NAMES.LEVEL_1
		) {
			// staying on current level, so just update our state
			processBackendLevelData({
				level: currentLevel,
				...levelData,
			});
		} else {
			// new state will be fetched as a result of level change
			setCurrentLevel(LEVEL_NAMES.LEVEL_1);
		}

		// setting as new user causes welcome dialog to open
		setIsNewUser(true);
	}

	function openResetProgressOverlay() {
		openOverlay(
			<ResetProgressOverlay
				resetProgress={resetProgress}
				closeOverlay={closeOverlay}
			/>
		);
	}

	return (
		<div className="main-component">
			<MainHeader
				currentLevel={currentLevel}
				numCompletedLevels={numCompletedLevels}
				openHandbook={openHandbook}
				openResetProgressOverlay={openResetProgressOverlay}
				openWelcome={openWelcomeOverlay}
				setCurrentLevel={setCurrentLevel}
			/>
			{currentLevel !== LEVEL_NAMES.SANDBOX && (
				<LevelMissionInfoBanner
					currentLevel={currentLevel}
					openOverlay={openInformationOverlay}
					openLevelsCompleteOverlay={openLevelsCompleteOverlay}
					numCompletedLevels={numCompletedLevels}
				/>
			)}
			<MainBody
				key={mainBodyKey}
				currentLevel={currentLevel}
				defences={defences}
				chatModel={chatModel}
				setChatModelId={setChatModelId}
				chatModels={chatModels}
				emails={emails}
				messages={messages}
				addChatMessage={addChatMessage}
				addSentEmails={addSentEmails}
				resetDefenceConfiguration={(
					defenceId: DEFENCE_ID,
					configItemId: DEFENCE_CONFIG_ITEM_ID
				) => void resetDefenceConfiguration(defenceId, configItemId)}
				resetLevel={() => void resetLevel()}
				toggleDefence={(defence: Defence) => void setDefenceToggle(defence)}
				setDefenceConfiguration={setDefenceConfiguration}
				updateNumCompletedLevels={updateNumCompletedLevels}
				openDocumentViewer={openDocumentViewer}
				openLevelsCompleteOverlay={openLevelsCompleteOverlay}
				openResetLevelOverlay={openResetLevelOverlay}
			/>
			<MainFooter />
		</div>
	);
}

export default MainComponent;
