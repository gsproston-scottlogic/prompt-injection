/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/unbound-method */
import { Response } from 'express';

import {
	handleAddToChatHistory,
	handleChatToGPT,
	handleClearChatHistory,
	handleGetChatHistory,
} from '@src/controller/chatController';
import { OpenAiAddHistoryRequest } from '@src/models/api/OpenAiAddHistoryRequest';
import { OpenAiChatRequest } from '@src/models/api/OpenAiChatRequest';
import { OpenAiClearRequest } from '@src/models/api/OpenAiClearRequest';
import { OpenAiGetHistoryRequest } from '@src/models/api/OpenAiGetHistoryRequest';
import {
	CHAT_MESSAGE_TYPE,
	ChatHistoryMessage,
	ChatModel,
} from '@src/models/chat';
import { DEFENCE_ID, Defence } from '@src/models/defence';
import { EmailInfo } from '@src/models/email';
import { LEVEL_NAMES, LevelState } from '@src/models/level';

declare module 'express-session' {
	interface Session {
		initialised: boolean;
		chatModel: ChatModel;
		levelState: LevelState[];
	}
	interface LevelState {
		level: LEVEL_NAMES;
		chatHistory: ChatHistoryMessage[];
		defences: Defence[];
		sentEmails: EmailInfo[];
	}
}

// mock the api call
const mockCreateChatCompletion = jest.fn();
jest.mock('openai', () => ({
	OpenAI: jest.fn().mockImplementation(() => ({
		chat: {
			completions: {
				create: mockCreateChatCompletion,
			},
		},
	})),
}));

function responseMock() {
	return {
		send: jest.fn(),
		status: jest.fn(),
	} as unknown as Response;
}

describe('handleChatToGPT unit tests', () => {
	const testSentEmail: EmailInfo = {
		address: 'bob@example.com',
		body: 'Test body',
		subject: 'Test subject',
	};

	function chatResponseAssistant(content: string) {
		return {
			choices: [
				{
					message: {
						role: 'assistant',
						content,
					},
				},
			],
		};
	}

	function chatSendEmailResponseAssistant() {
		return {
			choices: [
				{
					message: {
						tool_calls: [
							{
								type: 'function',
								id: 'sendEmail',
								function: {
									name: 'sendEmail',
									arguments: JSON.stringify({
										...testSentEmail,
										confirmed: true,
									}),
								},
							},
						],
					},
				},
			],
		};
	}

	function errorResponseMock(
		message: string,
		{
			transformedMessage,
			openAIErrorMessage,
		}: { transformedMessage?: string; openAIErrorMessage?: string }
	) {
		return {
			reply: message,
			defenceReport: {
				blockedReason: message,
				isBlocked: true,
				alertedDefences: [],
				triggeredDefences: [],
			},
			transformedMessage: transformedMessage ?? '',
			wonLevel: false,
			isError: true,
			sentEmails: [],
			openAIErrorMessage: openAIErrorMessage ?? null,
		};
	}

	function openAiChatRequestMock(
		message?: string,
		level?: LEVEL_NAMES,
		chatHistory: ChatHistoryMessage[] = [],
		sentEmails: EmailInfo[] = [],
		defences: Defence[] = []
	): OpenAiChatRequest {
		const emptyLevelStatesUpToChosenLevel = level
			? [0, 1, 2, 3]
					.filter((levelNum) => levelNum < level.valueOf())
					.map(
						(levelNum) =>
							({
								level: levelNum,
								chatHistory: [],
								sentEmails: [],
								defences: [],
							} as LevelState)
					)
			: [];
		return {
			body: {
				currentLevel: level ?? undefined,
				message: message ?? '',
			},
			session: {
				levelState: [
					...emptyLevelStatesUpToChosenLevel,
					{
						level: level ?? undefined,
						chatHistory,
						sentEmails,
						defences,
					},
				],
			},
		} as OpenAiChatRequest;
	}

	test('GIVEN a valid message and level WHEN handleChatToGPT called THEN it should return a text reply', async () => {
		const req = openAiChatRequestMock('Hello chatbot', LEVEL_NAMES.LEVEL_1);
		const res = responseMock();

		mockCreateChatCompletion.mockResolvedValueOnce(
			chatResponseAssistant('Howdy human!')
		);

		await handleChatToGPT(req, res);

		expect(res.send).toHaveBeenCalledWith({
			reply: 'Howdy human!',
			defenceReport: {
				blockedReason: '',
				isBlocked: false,
				alertedDefences: [],
				triggeredDefences: [],
			},
			transformedMessage: 'Hello chatbot',
			wonLevel: false,
			isError: false,
			sentEmails: [],
			openAIErrorMessage: null,
		});
	});

	test('GIVEN a user asks to send an email WHEN an email is sent THEN the sent email is returned', async () => {
		const req = openAiChatRequestMock(
			'send an email to bob@example.com saying hi',
			LEVEL_NAMES.LEVEL_1
		);
		const res = responseMock();

		mockCreateChatCompletion
			.mockResolvedValueOnce(chatSendEmailResponseAssistant())
			.mockResolvedValueOnce(chatResponseAssistant('Email sent'));

		await handleChatToGPT(req, res);

		expect(res.send).toHaveBeenCalledWith({
			reply: 'Email sent',
			defenceReport: {
				blockedReason: '',
				isBlocked: false,
				alertedDefences: [],
				triggeredDefences: [],
			},
			transformedMessage: 'send an email to bob@example.com saying hi',
			wonLevel: false,
			isError: false,
			sentEmails: [testSentEmail],
			openAIErrorMessage: null,
		});
	});

	test('GIVEN a user asks to send an email WHEN an email is sent AND emails have already been sent THEN only the newly sent email is returned', async () => {
		const req = openAiChatRequestMock(
			'send an email to bob@example.com saying hi',
			LEVEL_NAMES.LEVEL_1,
			[],
			[
				{
					address: 'bob@example.com',
					body: 'first email',
					subject: 'first subject',
				},
			]
		);
		const res = responseMock();

		mockCreateChatCompletion
			.mockResolvedValueOnce(chatSendEmailResponseAssistant())
			.mockResolvedValueOnce(chatResponseAssistant('Email sent'));

		await handleChatToGPT(req, res);

		expect(res.send).toHaveBeenCalledWith({
			reply: 'Email sent',
			defenceReport: {
				blockedReason: '',
				isBlocked: false,
				alertedDefences: [],
				triggeredDefences: [],
			},
			transformedMessage: 'send an email to bob@example.com saying hi',
			wonLevel: false,
			isError: false,
			sentEmails: [testSentEmail],
			openAIErrorMessage: null,
		});
	});

	test('GIVEN missing message WHEN handleChatToGPT called THEN it should return 400 and error message', async () => {
		const req = openAiChatRequestMock('', LEVEL_NAMES.LEVEL_1);
		const res = responseMock();
		await handleChatToGPT(req, res);

		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.send).toHaveBeenCalledWith(
			errorResponseMock('Missing or empty message or level', {})
		);
	});

	test('GIVEN an openai error is thrown WHEN handleChatToGPT called THEN it should return 500 and error message', async () => {
		const req = openAiChatRequestMock('hello', LEVEL_NAMES.LEVEL_1);
		const res = responseMock();

		// mock the api call throwing an error
		mockCreateChatCompletion.mockRejectedValueOnce(new Error('OpenAI error'));

		await handleChatToGPT(req, res);

		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.send).toHaveBeenCalledWith(
			errorResponseMock('OpenAI error', {
				transformedMessage: 'hello',
				openAIErrorMessage: 'OpenAI error',
			})
		);
	});

	test('GIVEN an openai rate limiting error is thrown WHEN handleChatToGPT called THEN it should return 500 and error message', async () => {
		const req = openAiChatRequestMock('hello', LEVEL_NAMES.LEVEL_1);
		const res = responseMock();

		// mock the api call throwing an error
		mockCreateChatCompletion.mockRejectedValueOnce(
			new Error(
				'429 OpenAI error. yada yada. Please try again in 20s. blah blah blah.'
			)
		);

		await handleChatToGPT(req, res);

		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.send).toHaveBeenCalledWith(
			errorResponseMock(
				"I'm receiving too many requests. Please try again in 20s. You can upgrade your open AI key to increase the rate limit.",
				{
					transformedMessage: 'hello',
					openAIErrorMessage:
						'429 OpenAI error. yada yada. Please try again in 20s. blah blah blah.',
				}
			)
		);
	});

	test('GIVEN message exceeds input character limit (not a defence) WHEN handleChatToGPT called THEN it should return 400 and error message', async () => {
		const req = openAiChatRequestMock('x'.repeat(16399), 0);
		const res = responseMock();

		await handleChatToGPT(req, res);

		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.send).toHaveBeenCalledWith(
			errorResponseMock('Message exceeds character limit', {})
		);
	});

	test('GIVEN message exceeds character limit defence WHEN handleChatToGPT called THEN it should return 200 and blocked reason', async () => {
		const defences: Defence[] = [
			{
				id: DEFENCE_ID.CHARACTER_LIMIT,
				isActive: true,
				isTriggered: false,
				config: [
					{
						id: 'MAX_MESSAGE_LENGTH',
						value: '2',
					},
				],
			},
			{
				id: DEFENCE_ID.FILTER_USER_INPUT,
				isActive: false,
				isTriggered: false,
				config: [{ id: 'FILTER_USER_INPUT', value: '' }],
			},
		];

		const req = openAiChatRequestMock(
			'hey',
			LEVEL_NAMES.SANDBOX,
			[],
			[],
			defences
		);
		const res = responseMock();

		await handleChatToGPT(req, res);

		expect(res.send).toHaveBeenCalledWith(
			expect.objectContaining({
				defenceReport: {
					alertedDefences: [],
					blockedReason: 'Message is too long',
					isBlocked: true,
					triggeredDefences: ['CHARACTER_LIMIT'],
				},
				reply: '',
			})
		);
	});

	test('GIVEN message has filtered input defence WHEN handleChatToGPT called THEN it should return 200 and blocked reason', async () => {
		const defences: Defence[] = [
			{
				id: DEFENCE_ID.CHARACTER_LIMIT,
				isActive: false,
				isTriggered: false,
				config: [
					{
						id: 'MAX_MESSAGE_LENGTH',
						value: '240',
					},
				],
			},
			{
				id: DEFENCE_ID.FILTER_USER_INPUT,
				isActive: true,
				isTriggered: false,
				config: [{ id: 'FILTER_USER_INPUT', value: 'hey' }],
			},
		];

		const req = openAiChatRequestMock(
			'hey',
			LEVEL_NAMES.SANDBOX,
			[],
			[],
			defences
		);
		const res = responseMock();

		await handleChatToGPT(req, res);

		expect(res.send).toHaveBeenCalledWith(
			expect.objectContaining({
				defenceReport: {
					alertedDefences: [],
					blockedReason:
						"Message blocked - I cannot answer questions about 'hey'!",
					isBlocked: true,
					triggeredDefences: ['FILTER_USER_INPUT'],
				},
				reply: '',
			})
		);
	});
});

describe('handleGetChatHistory', () => {
	function getRequestMock(
		level?: LEVEL_NAMES,
		chatHistory?: ChatHistoryMessage[]
	) {
		return {
			query: {
				level: level ?? undefined,
			},
			session: {
				levelState: [
					{
						chatHistory: chatHistory ?? [],
					},
				],
			},
		} as OpenAiGetHistoryRequest;
	}

	const chatHistory: ChatHistoryMessage[] = [
		{
			completion: { role: 'system', content: 'You are a helpful chatbot' },
			chatMessageType: CHAT_MESSAGE_TYPE.SYSTEM,
		},
		{
			completion: { role: 'assistant', content: 'Hello human' },
			chatMessageType: CHAT_MESSAGE_TYPE.BOT,
		},
		{
			completion: { role: 'user', content: 'How are you?' },
			chatMessageType: CHAT_MESSAGE_TYPE.SYSTEM,
		},
	];
	test('GIVEN a valid level WHEN handleGetChatHistory called THEN return chat history', () => {
		const req = getRequestMock(LEVEL_NAMES.LEVEL_1, chatHistory);
		const res = responseMock();

		handleGetChatHistory(req, res);
		expect(res.send).toHaveBeenCalledWith(chatHistory);
	});

	test('GIVEN undefined level WHEN handleGetChatHistory called THEN return 400', () => {
		const req = getRequestMock();
		const res = responseMock();

		handleGetChatHistory(req, res);

		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.send).toHaveBeenCalledWith('Missing level');
	});
});

describe('handleAddToChatHistory', () => {
	function getAddHistoryRequestMock(
		message: string,
		level?: LEVEL_NAMES,
		chatHistory?: ChatHistoryMessage[]
	) {
		return {
			body: {
				message,
				chatMessageType: CHAT_MESSAGE_TYPE.USER,
				level: level ?? undefined,
			},
			session: {
				levelState: [
					{
						chatHistory: chatHistory ?? [],
					},
				],
			},
		} as OpenAiAddHistoryRequest;
	}

	const chatHistory: ChatHistoryMessage[] = [
		{
			completion: { role: 'system', content: 'You are a helpful chatbot' },
			chatMessageType: CHAT_MESSAGE_TYPE.SYSTEM,
		},
		{
			completion: { role: 'assistant', content: 'Hello human' },
			chatMessageType: CHAT_MESSAGE_TYPE.BOT,
		},
	];
	test('GIVEN a valid message WHEN handleAddToChatHistory called THEN message is added to chat history', () => {
		const req = getAddHistoryRequestMock(
			'tell me a story',
			LEVEL_NAMES.LEVEL_1,
			chatHistory
		);
		const res = responseMock();

		handleAddToChatHistory(req, res);

		expect(req.session.levelState[0].chatHistory.length).toEqual(3);
	});

	test('GIVEN invalid level WHEN handleAddToChatHistory called THEN returns 400', () => {
		const req = getAddHistoryRequestMock(
			'tell me a story',
			undefined,
			chatHistory
		);
		const res = responseMock();

		handleAddToChatHistory(req, res);

		expect(res.status).toHaveBeenCalledWith(400);
	});
});

describe('handleClearChatHistory', () => {
	function openAiClearRequestMock(
		level?: LEVEL_NAMES,
		chatHistory?: ChatHistoryMessage[]
	) {
		return {
			body: {
				level: level ?? undefined,
			},
			session: {
				levelState: [
					{
						chatHistory: chatHistory ?? [],
					},
				],
			},
		} as OpenAiClearRequest;
	}

	const chatHistory: ChatHistoryMessage[] = [
		{
			completion: { role: 'system', content: 'You are a helpful chatbot' },
			chatMessageType: CHAT_MESSAGE_TYPE.SYSTEM,
		},
		{
			completion: { role: 'assistant', content: 'Hello human' },
			chatMessageType: CHAT_MESSAGE_TYPE.BOT,
		},
	];
	test('GIVEN valid level WHEN handleClearChatHistory called THEN it sets chatHistory to empty', () => {
		const req = openAiClearRequestMock(LEVEL_NAMES.LEVEL_1, chatHistory);
		const res = responseMock();
		handleClearChatHistory(req, res);
		expect(req.session.levelState[0].chatHistory.length).toEqual(0);
	});

	test('GIVEN invalid level WHEN handleClearChatHistory called THEN returns 400 ', () => {
		const req = openAiClearRequestMock(undefined, chatHistory);

		const res = responseMock();

		handleClearChatHistory(req, res);

		expect(res.status).toHaveBeenCalledWith(400);
	});
});
