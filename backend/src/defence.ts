import { defaultDefences } from './defaultDefences';
import { queryPromptEvaluationModel } from './langchain';
import { ChatDefenceReport, TransformedChatMessage } from './models/chat';
import {
	DEFENCE_ID,
	DefenceConfigItem,
	Defence,
	DEFENCE_CONFIG_ITEM_ID,
} from './models/defence';
import { LEVEL_NAMES } from './models/level';
import {
	systemRoleLevel1,
	systemRoleLevel2,
	systemRoleLevel3,
} from './promptTemplates';

function activateDefence(id: DEFENCE_ID, defences: Defence[]) {
	// return the updated list of defences
	return defences.map((defence) =>
		defence.id === id ? { ...defence, isActive: true } : defence
	);
}

function deactivateDefence(id: DEFENCE_ID, defences: Defence[]) {
	// return the updated list of defences
	return defences.map((defence) =>
		defence.id === id ? { ...defence, isActive: false } : defence
	);
}

function configureDefence(
	id: DEFENCE_ID,
	defences: Defence[],
	config: DefenceConfigItem[]
): Defence[] {
	// return the updated list of defences
	return defences.map((defence) =>
		defence.id === id ? { ...defence, config } : defence
	);
}

function resetDefenceConfig(
	id: DEFENCE_ID,
	configId: DEFENCE_CONFIG_ITEM_ID,
	defences: Defence[]
): Defence[] {
	const defaultValue = getConfigValue(defaultDefences, id, configId);
	return configureDefence(id, defences, [
		{ id: configId, value: defaultValue },
	]);
}

function getConfigValue(
	defences: Defence[],
	defenceId: DEFENCE_ID,
	configId: string
) {
	const config: DefenceConfigItem | undefined = defences
		.find((defence) => defence.id === defenceId)
		?.config.find((config) => config.id === configId);
	if (!config) {
		throw new Error(
			`Config item ${configId} not found for defence ${defenceId} in default defences.`
		);
	}
	return config.value;
}

function getMaxMessageLength(defences: Defence[]) {
	return getConfigValue(
		defences,
		DEFENCE_ID.CHARACTER_LIMIT,
		'MAX_MESSAGE_LENGTH'
	);
}

function getXMLTaggingPrompt(defences: Defence[]) {
	return getConfigValue(defences, DEFENCE_ID.XML_TAGGING, 'PROMPT');
}

function getFilterList(defences: Defence[], type: DEFENCE_ID) {
	return getConfigValue(
		defences,
		type,
		type === DEFENCE_ID.FILTER_USER_INPUT
			? 'FILTER_USER_INPUT'
			: 'FILTER_BOT_OUTPUT'
	);
}
function getSystemRole(
	defences: Defence[],
	// by default, use sandbox
	currentLevel: LEVEL_NAMES = LEVEL_NAMES.SANDBOX
) {
	switch (currentLevel) {
		case LEVEL_NAMES.LEVEL_1:
			return systemRoleLevel1;
		case LEVEL_NAMES.LEVEL_2:
			return systemRoleLevel2;
		case LEVEL_NAMES.LEVEL_3:
			return systemRoleLevel3;
		default:
			return getConfigValue(defences, DEFENCE_ID.SYSTEM_ROLE, 'SYSTEM_ROLE');
	}
}

function getQAPromptFromConfig(defences: Defence[]) {
	return getConfigValue(defences, DEFENCE_ID.QA_LLM, 'PROMPT');
}

function getPromptEvalPromptFromConfig(defences: Defence[]) {
	return getConfigValue(defences, DEFENCE_ID.PROMPT_EVALUATION_LLM, 'PROMPT');
}

function isDefenceActive(id: DEFENCE_ID, defences: Defence[]) {
	return defences.some((defence) => defence.id === id && defence.isActive);
}

// check message for any words in the filter list
function detectFilterList(message: string, filterList: string) {
	const detectedPhrases = [];
	const cleanedMessage = message.replace(/[^a-zA-Z ]/g, '').toLowerCase();
	const filterListSplit = filterList
		.toLowerCase()
		.split(',')
		.filter((phrase) => phrase.trim() !== '');
	for (const phrase of filterListSplit) {
		// check if original message or cleaned message contains the phrase
		if (
			message.toLowerCase().includes(phrase.trim()) ||
			cleanedMessage.includes(phrase.trim())
		) {
			detectedPhrases.push(phrase);
		}
	}
	return detectedPhrases;
}

// function to escape XML characters in user input to prevent hacking with XML tagging on
function escapeXml(unsafe: string) {
	return unsafe.replace(/[<>&'"]/g, function (c: string): string {
		switch (c) {
			case '<':
				return '&lt;';
			case '>':
				return '&gt;';
			case '&':
				return '&amp;';
			case "'":
				return '&apos;';
			case '"':
			default:
				return '&quot;';
		}
	});
}

// function to detect any XML tags in user input
function containsXMLTags(input: string) {
	const tagRegex = /<\/?[a-zA-Z][\w-]*(?:\b[^>]*\/\s*|[^>]*>|[?]>)/g;
	const foundTags: string[] = input.match(tagRegex) ?? [];
	return foundTags.length > 0;
}

// apply XML tagging defence to input message
function transformXmlTagging(
	message: string,
	defences: Defence[]
): TransformedChatMessage {
	console.debug('XML Tagging defence active.');
	const prompt = getXMLTaggingPrompt(defences);
	const openTag = '<user_input>';
	const closeTag = '</user_input>';
	return {
		preMessage: prompt.concat(openTag),
		message: escapeXml(message),
		postMessage: closeTag,
	};
}

function combineTransformedMessage(transformedMessage: TransformedChatMessage) {
	return (
		transformedMessage.preMessage +
		transformedMessage.message +
		transformedMessage.postMessage
	);
}

//apply defence string transformations to original message
function transformMessage(
	message: string,
	defences: Defence[]
): TransformedChatMessage | null {
	if (isDefenceActive(DEFENCE_ID.XML_TAGGING, defences)) {
		const transformedMessage = transformXmlTagging(message, defences);
		console.debug(
			`Defences applied. Transformed message: ${combineTransformedMessage(
				transformedMessage
			)}`
		);
		return transformedMessage;
	} else {
		console.debug('No defences applied. Message unchanged.');
		return null;
	}
}

// detects triggered defences in original message and blocks the message if necessary
async function detectTriggeredDefences(message: string, defences: Defence[]) {
	const characterLimitDefenceReport = detectCharacterLimit(message, defences);
	const filterUserInputDefenceReport = detectFilterUserInput(message, defences);
	const xmlTaggingDefenceReport = detectXmlTagging(message, defences);
	const evaluationDefenceReport = await detectEvaluationLLM(message, defences);

	return combineDefenceReports([
		characterLimitDefenceReport,
		filterUserInputDefenceReport,
		xmlTaggingDefenceReport,
		evaluationDefenceReport,
	]);
}

function combineDefenceReports(
	defenceReports: ChatDefenceReport[]
): ChatDefenceReport {
	const isBlocked = defenceReports.some((report) => report.isBlocked);
	const blockedReason = defenceReports.every(
		(report) => report.blockedReason === null
	)
		? null
		: defenceReports
				.map((report) => report.blockedReason)
				.filter((reason) => reason !== null)
				.join('\n');
	const alertedDefences = defenceReports
		.map((report) => report.alertedDefences)
		.flat();
	const triggeredDefences = defenceReports
		.map((report) => report.triggeredDefences)
		.flat();

	return {
		isBlocked,
		blockedReason,
		alertedDefences,
		triggeredDefences,
	};
}

function getEmptyChatDefenceReport(): ChatDefenceReport {
	return {
		blockedReason: null,
		isBlocked: false,
		alertedDefences: [],
		triggeredDefences: [],
	};
}

function detectCharacterLimit(
	message: string,
	defences: Defence[]
): ChatDefenceReport {
	const maxMessageLength = Number(getMaxMessageLength(defences));

	const messageExceedsLimit = message.length > maxMessageLength;
	const defenceActive = isDefenceActive(DEFENCE_ID.CHARACTER_LIMIT, defences);

	if (messageExceedsLimit) console.debug('CHARACTER_LIMIT defence triggered.');

	return messageExceedsLimit && defenceActive
		? {
				blockedReason: 'Message is too long',
				isBlocked: true,
				alertedDefences: [],
				triggeredDefences: [DEFENCE_ID.CHARACTER_LIMIT],
		  }
		: messageExceedsLimit && !defenceActive
		? {
				...getEmptyChatDefenceReport(),
				alertedDefences: [DEFENCE_ID.CHARACTER_LIMIT],
		  }
		: getEmptyChatDefenceReport();
}

function detectFilterUserInput(
	message: string,
	defences: Defence[]
): ChatDefenceReport {
	const detectedPhrases = detectFilterList(
		message,
		getFilterList(defences, DEFENCE_ID.FILTER_USER_INPUT)
	);

	const filterWordsDetected = detectedPhrases.length > 0;
	const defenceActive = isDefenceActive(DEFENCE_ID.FILTER_USER_INPUT, defences);

	if (filterWordsDetected) {
		console.debug(
			`FILTER_USER_INPUT defence triggered. Detected phrases from blocklist: ${detectedPhrases.join(
				', '
			)}`
		);
	}

	return filterWordsDetected && defenceActive
		? {
				blockedReason: `Message blocked - I cannot answer questions about '${detectedPhrases.join(
					"' or '"
				)}'!`,
				isBlocked: true,
				alertedDefences: [],
				triggeredDefences: [DEFENCE_ID.FILTER_USER_INPUT],
		  }
		: filterWordsDetected && !defenceActive
		? {
				...getEmptyChatDefenceReport(),
				alertedDefences: [DEFENCE_ID.FILTER_USER_INPUT],
		  }
		: getEmptyChatDefenceReport();
}

function detectXmlTagging(
	message: string,
	defences: Defence[]
): ChatDefenceReport {
	const containsXML = containsXMLTags(message);
	const defenceActive = isDefenceActive(DEFENCE_ID.XML_TAGGING, defences);

	if (containsXML) {
		console.debug('XML_TAGGING defence triggered.');
	}

	return containsXML && defenceActive
		? {
				...getEmptyChatDefenceReport(),
				triggeredDefences: [DEFENCE_ID.XML_TAGGING],
		  }
		: containsXML && !defenceActive
		? {
				...getEmptyChatDefenceReport(),
				alertedDefences: [DEFENCE_ID.XML_TAGGING],
		  }
		: getEmptyChatDefenceReport();
}

async function detectEvaluationLLM(
	message: string,
	defences: Defence[]
): Promise<ChatDefenceReport> {
	// to save money and processing time, and to reduce risk of rate limiting, we only run if defence is active
	if (isDefenceActive(DEFENCE_ID.PROMPT_EVALUATION_LLM, defences)) {
		const promptEvalLLMPrompt = getPromptEvalPromptFromConfig(defences);

		const evaluationResult = await queryPromptEvaluationModel(
			message,
			promptEvalLLMPrompt
		);

		if (evaluationResult.isMalicious) {
			console.debug('LLM evaluation defence active and prompt is malicious.');

			return {
				triggeredDefences: [DEFENCE_ID.PROMPT_EVALUATION_LLM],
				isBlocked: true,
				blockedReason: `Message blocked by the prompt evaluation LLM.`,
				alertedDefences: [],
			};
		}
	}
	return getEmptyChatDefenceReport();
}

export {
	activateDefence,
	configureDefence,
	deactivateDefence,
	resetDefenceConfig,
	detectTriggeredDefences,
	getQAPromptFromConfig,
	getSystemRole,
	isDefenceActive,
	transformMessage,
	getFilterList,
	detectFilterList,
	combineTransformedMessage,
};
