import { DEFENCE_TYPES, DefenceConfig, DefenceInfo } from './models/defence';

const DEFENCE_DETAILS_LEVEL: DefenceInfo[] = [
	new DefenceInfo(
		DEFENCE_TYPES.CHARACTER_LIMIT,
		'Character Limit',
		'Limit the number of characters in the user input. This is a form of prompt validation.',
		[new DefenceConfig('maxMessageLength', 'max message length', 'number')]
	),
	new DefenceInfo(
		DEFENCE_TYPES.FILTER_USER_INPUT,
		'Input Filtering',
		'Use a block list of words or phrases to check against user input. If a match is found, the message is blocked.',
		[new DefenceConfig('filterUserInput', 'filter list', 'text')]
	),
	new DefenceInfo(
		DEFENCE_TYPES.FILTER_BOT_OUTPUT,
		'Output Filtering',
		'Use a block list of words or phrases to check against bot output. If a match is found, the message is blocked.',
		[new DefenceConfig('filterBotOutput', 'filter list', 'text')]
	),
	new DefenceInfo(
		DEFENCE_TYPES.XML_TAGGING,
		'XML Tagging',
		'Enclose the users prompt between <user_input> tags and escapes xml characters in raw input. This is a form of prompt validation.',
		[new DefenceConfig('prePrompt', 'pre-prompt', 'text')]
	),
	new DefenceInfo(
		DEFENCE_TYPES.EVALUATION_LLM_INSTRUCTIONS,
		'Evaluation LLM instructions',
		'Use an LLM to evaluate the user input for malicious content or prompt injection.',
		[
			new DefenceConfig(
				'prompt-injection-evaluator-prompt',
				'prompt-injection evaluator prompt',
				'text'
			),
			new DefenceConfig(
				'malicious-prompt-evaluator-prompt',
				'malicious-prompt evaluator prompt',
				'text'
			),
		]
	),
];

const DEFENCE_DETAILS_ALL: DefenceInfo[] = [
	...DEFENCE_DETAILS_LEVEL,
	new DefenceInfo(
		DEFENCE_TYPES.SYSTEM_ROLE,
		'System Role',
		'Tell the chat bot to follow a specific role.',
		[new DefenceConfig('systemRole', 'system role', 'text')]
	),
	new DefenceInfo(
		DEFENCE_TYPES.QA_LLM_INSTRUCTIONS,
		'QA LLM instructions',
		'Currently the chatbot speaks to a separate Question/Answering LLM to retrieve information on documents. The QA LLM will reveal all information to the chatbot, who will then decide whether to reveal to the user. This defence adds an instructional pre-prompt to the QA LLM to not reveal certain sensitive information to the chatbot.',
		[new DefenceConfig('prePrompt', 'pre-prompt', 'text')]
	),
];

export { DEFENCE_DETAILS_LEVEL, DEFENCE_DETAILS_ALL };
