import {
	afterEach,
	beforeEach,
	describe,
	expect,
	jest,
	test,
} from '@jest/globals';
import { CHAT_MESSAGE_TYPE, ChatHistoryMessage } from '@src/models/chat';
import { DEFENCE_ID, Defence } from '@src/models/defence';
import { LEVEL_NAMES } from '@src/models/level';
import { OpenAI } from 'openai';

import {
	getValidModelsFromOpenAI,
	setSystemRoleInChatHistory,
} from '@src/openai';
import { getSystemRole, isDefenceActive } from '@src/defence';

jest.mock('@src/openai', () => {
	const originalModule =
		jest.requireActual<typeof import('@src/openai')>('@src/openai');
	return {
		...originalModule,
		initOpenAi: jest.fn(),
		getOpenAI: jest.fn(),
	};
});

jest.mock('@src/langchain', () => {
	const originalModule =
		jest.requireActual<typeof import('@src/langchain')>('@src/langchain');
	return {
		...originalModule,
		initQAModel: jest.fn(),
		initDocumentVectors: jest.fn(),
	};
});

jest.mock('openai');

describe('unit test getValidModelsFromOpenAI', () => {
	const mockOpenAI = OpenAI as jest.MockedClass<typeof OpenAI>;
	mockOpenAI.prototype = {
		models: {
			list: jest.fn(),
		},
	} as unknown as typeof mockOpenAI.prototype;

	beforeEach(() => {
		process.env = {};
	});

	test('GIVEN the user has an openAI key WHEN getValidModelsFromOpenAI is called THEN it returns only the models that are also in the CHAT_MODELS enum', async () => {
		process.env.OPENAI_API_KEY = 'sk-12345';
		const mockModelList = [
			{ id: 'gpt-3.5-turbo' },
			{ id: 'gpt-3.5-turbo-0613' },
			{ id: 'gpt-4' },
			{ id: 'gpt-4-0613' },
			{ id: 'da-vinci-1' },
			{ id: 'da-vinci-2' },
		];
		const expectedValidModels = [
			'gpt-3.5-turbo',
			'gpt-3.5-turbo-0613',
			'gpt-4',
			'gpt-4-0613',
		];

		mockOpenAI.prototype.models.list.mockResolvedValueOnce({
			data: mockModelList,
		} as OpenAI.ModelsPage);

		const validModels = await getValidModelsFromOpenAI();

		expect(validModels).toEqual(expectedValidModels);
	});
});

const mockSystemRolePrompt =
	'You are a helpful chatbot that answers questions.';
const mockDefencesSystemRoleInactive: Defence[] = [
	{
		id: DEFENCE_ID.SYSTEM_ROLE,
		config: [
			{
				id: 'SYSTEM_ROLE',
				value: mockSystemRolePrompt,
			},
		],
		isActive: false,
		isTriggered: false,
	},
];
const mockDefencesSystemRoleActive = [
	{ ...mockDefencesSystemRoleInactive[0], isActive: true },
];
const mockChatHistoryWithoutSystemRole: ChatHistoryMessage[] = [
	{
		completion: { role: 'user', content: 'What is two plus two?' },
		chatMessageType: CHAT_MESSAGE_TYPE.USER,
	},
	{
		completion: { role: 'assistant', content: 'Two plus two equals four.' },
		chatMessageType: CHAT_MESSAGE_TYPE.BOT,
	},
];

const mockChatHistoryWithSystemRole: ChatHistoryMessage[] = [
	{
		completion: { role: 'system', content: mockSystemRolePrompt },
		chatMessageType: CHAT_MESSAGE_TYPE.SYSTEM,
	},
	...mockChatHistoryWithoutSystemRole,
];

jest.mock('@src/defence');

describe('unit test setSystemRoleInChatHistory', () => {
	const mockIsDefenceActive = isDefenceActive as jest.MockedFunction<
		typeof isDefenceActive
	>;

	const mockGetSystemRole = getSystemRole as jest.MockedFunction<
		typeof getSystemRole
	>;
	mockGetSystemRole.mockImplementation(() => mockSystemRolePrompt);

	afterEach(() => {
		mockIsDefenceActive.mockReset();
		jest.clearAllMocks();
	});

	test('GIVEN level 1 AND system role is not in chat history WHEN setSystemRoleInChatHistory is called THEN it adds the system role to the chat history', () => {
		const chatHistory = setSystemRoleInChatHistory(
			LEVEL_NAMES.LEVEL_1,
			mockDefencesSystemRoleActive,
			mockChatHistoryWithoutSystemRole
		);

		expect(chatHistory).toEqual(mockChatHistoryWithSystemRole);
	});

	test('GIVEN level 1 AND system role is in chat history WHEN setSystemRoleInChatHistory is called THEN no change to the chat history', () => {
		const chatHistory = setSystemRoleInChatHistory(
			LEVEL_NAMES.LEVEL_1,
			mockDefencesSystemRoleActive,
			mockChatHistoryWithSystemRole
		);

		expect(chatHistory).toEqual(mockChatHistoryWithSystemRole);
	});

	test('GIVEN Sandbox AND system role defence active AND system role is not in chat history WHEN setSystemRoleInChatHistory is called THEN it adds the system role to the chat history', () => {
		mockIsDefenceActive.mockImplementation(() => true);
		const chatHistory = setSystemRoleInChatHistory(
			LEVEL_NAMES.SANDBOX,
			mockDefencesSystemRoleActive,
			mockChatHistoryWithoutSystemRole
		);

		expect(chatHistory).toEqual(mockChatHistoryWithSystemRole);
	});

	test('GIVEN Sandbox AND system role defence active AND outdated system role in in chat history WHEN setSystemRoleInChatHistory is called THEN it updates the system role in the chat history', () => {
		mockIsDefenceActive.mockImplementation(() => true);

		const mockChatHistoryWithOutdatedSystemRole: ChatHistoryMessage[] = [
			{
				completion: { role: 'system', content: 'Yer a wizard, Harry.' },
				chatMessageType: CHAT_MESSAGE_TYPE.SYSTEM,
			},
			...mockChatHistoryWithoutSystemRole,
		];

		const chatHistory = setSystemRoleInChatHistory(
			LEVEL_NAMES.SANDBOX,
			mockDefencesSystemRoleActive,
			mockChatHistoryWithOutdatedSystemRole
		);

		expect(chatHistory).toEqual(mockChatHistoryWithSystemRole);
	});

	test('GIVEN Sandbox AND system role defence not active AND system role is in chat history WHEN setSystemRoleInChatHistory is called THEN it removes the system role from the chat history', () => {
		mockIsDefenceActive.mockImplementation(() => false);
		const chatHistory = setSystemRoleInChatHistory(
			LEVEL_NAMES.SANDBOX,
			mockDefencesSystemRoleActive,
			mockChatHistoryWithSystemRole
		);

		expect(chatHistory).toEqual(mockChatHistoryWithoutSystemRole);
	});

	test('GIVEN Sandbox AND system role defence not active AND system role is not in chat history WHEN setSystemRoleInChatHistory is called THEN no change to the chat history', () => {
		mockIsDefenceActive.mockImplementation(() => false);
		const chatHistory = setSystemRoleInChatHistory(
			LEVEL_NAMES.SANDBOX,
			mockDefencesSystemRoleActive,
			mockChatHistoryWithoutSystemRole
		);

		expect(chatHistory).toEqual(mockChatHistoryWithoutSystemRole);
	});
});
