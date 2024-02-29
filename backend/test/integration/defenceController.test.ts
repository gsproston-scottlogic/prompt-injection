import { expect, test, jest, describe } from '@jest/globals';
import { Response } from 'express';

import {
	handleConfigureDefence,
	handleDefenceActivation,
	handleDefenceDeactivation,
	handleGetDefenceStatus,
} from '@src/controller/defenceController';
import { DefenceActivateRequest } from '@src/models/api/DefenceActivateRequest';
import { DefenceConfigureRequest } from '@src/models/api/DefenceConfigureRequest';
import { DefenceStatusRequest } from '@src/models/api/DefenceStatusRequest';
import { ChatModel } from '@src/models/chat';
import { ChatMessage } from '@src/models/chatMessage';
import { DEFENCE_ID, Defence } from '@src/models/defence';
import { EmailInfo } from '@src/models/email';
import { LEVEL_NAMES, getInitialLevelStates } from '@src/models/level';

declare module 'express-session' {
	interface Session {
		initialised: boolean;
		chatModel: ChatModel;
		levelState: LevelState[];
	}
	interface LevelState {
		level: LEVEL_NAMES;
		chatHistory: ChatMessage[];
		defences?: Defence[];
		sentEmails: EmailInfo[];
	}
}

function responseMock() {
	return {
		send: jest.fn(),
		status: jest.fn().mockReturnThis(),
	} as unknown as Response;
}

describe('The correct levels can have their defences changed', () => {
	[LEVEL_NAMES.LEVEL_1, LEVEL_NAMES.LEVEL_2].forEach((level) => {
		test(`GIVEN level ${
			level + 1
		} WHEN attempt to activate a defence THEN defence is not activated`, () => {
			const req = {
				body: {
					defenceId: DEFENCE_ID.CHARACTER_LIMIT,
					level,
				},
				session: {
					levelState: getInitialLevelStates(),
				},
			} as unknown as DefenceActivateRequest;

			const res = responseMock();

			handleDefenceActivation(req, res);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.send).toHaveBeenCalledWith(
				'You cannot activate defences on this level, because it uses the default defences'
			);
		});

		test(`GIVEN level ${
			level + 1
		} WHEN attempt to deactivate a defence THEN defence is not activated`, () => {
			const req = {
				body: {
					defenceId: DEFENCE_ID.CHARACTER_LIMIT,
					level,
				},
				session: {
					levelState: getInitialLevelStates(),
				},
			} as unknown as DefenceActivateRequest;

			const res = responseMock();

			handleDefenceDeactivation(req, res);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.send).toHaveBeenCalledWith(
				'You cannot deactivate defences on this level, because it uses the default defences'
			);
		});

		test(`GIVEN level ${
			level + 1
		} WHEN attempt to configure a defence THEN defence is not configured`, () => {
			const req = {
				body: {
					defenceId: DEFENCE_ID.CHARACTER_LIMIT,
					level,
					config: [],
				},
				session: {
					levelState: getInitialLevelStates(),
				},
			} as unknown as DefenceConfigureRequest;

			const res = responseMock();

			handleConfigureDefence(req, res);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.send).toHaveBeenCalledWith(
				'You cannot configure defences on this level, because it uses the default defences'
			);
		});

		test(`GIVEN level ${
			level + 1
		} WHEN attempt to get defence status THEN shoult return undefined`, () => {
			const req = {
				query: { level },
				session: {
					levelState: getInitialLevelStates(),
				},
			} as unknown as DefenceStatusRequest;

			const res = responseMock();

			handleGetDefenceStatus(req, res);

			expect(res.send).toHaveBeenCalledWith(undefined);
		});
	});

	[LEVEL_NAMES.LEVEL_3, LEVEL_NAMES.SANDBOX].forEach((level) => {
		test(`GIVEN level ${level} WHEN attempt to activate a defence THEN defence is activated`, () => {
			const req = {
				body: {
					defenceId: DEFENCE_ID.CHARACTER_LIMIT,
					level,
				},
				session: {
					levelState: getInitialLevelStates(),
				},
			} as unknown as DefenceActivateRequest;

			const res = responseMock();

			handleDefenceActivation(req, res);

			const newLevelState = getInitialLevelStates().map((levelState) =>
				levelState.level === level
					? {
							...levelState,
							defences: levelState.defences?.map((defence) =>
								defence.id === DEFENCE_ID.CHARACTER_LIMIT
									? { ...defence, isActive: true }
									: defence
							),
					  }
					: levelState
			);

			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.send).toHaveBeenCalled();
			expect(req.session.levelState).toEqual(newLevelState);
		});

		test(`GIVEN level ${level} WHEN attempt to deactivate a defence THEN defence is deactivated`, () => {
			const initialLevelStatesButWithCharacterLimitActive =
				getInitialLevelStates().map((levelState) =>
					levelState.level === level
						? {
								...levelState,
								defences: levelState.defences?.map((defence) =>
									defence.id === DEFENCE_ID.CHARACTER_LIMIT
										? { ...defence, isActive: true }
										: defence
								),
						  }
						: levelState
				);

			const req = {
				body: {
					defenceId: DEFENCE_ID.CHARACTER_LIMIT,
					level,
				},
				session: {
					levelState: initialLevelStatesButWithCharacterLimitActive,
				},
			} as unknown as DefenceActivateRequest;

			const res = responseMock();

			handleDefenceDeactivation(req, res);

			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.send).toHaveBeenCalled();
			expect(req.session.levelState).toEqual(getInitialLevelStates());
		});

		test(`GIVEN level ${level} WHEN attempt to configure a defence THEN defence is configured`, () => {
			const req = {
				body: {
					defenceId: DEFENCE_ID.CHARACTER_LIMIT,
					level,
					config: [{ id: 'MAX_MESSAGE_LENGTH', value: '1' }],
				},
				session: {
					levelState: getInitialLevelStates(),
				},
			} as DefenceConfigureRequest;

			const res = responseMock();

			handleConfigureDefence(req, res);

			const updatedDefenceConfig = req.session.levelState
				.find((levelState) => levelState.level === level)
				?.defences?.find(
					(defence) => defence.id === DEFENCE_ID.CHARACTER_LIMIT
				)?.config;

			const expectedDefenceConfig = [{ id: 'MAX_MESSAGE_LENGTH', value: '1' }];

			expect(res.send).toHaveBeenCalled();
			expect(updatedDefenceConfig).toEqual(expectedDefenceConfig);
		});

		test(`GIVEN level ${level} WHEN attempt to get defence status THEN should return the defences`, () => {
			const req = {
				query: { level },
				session: {
					levelState: getInitialLevelStates(),
				},
			} as unknown as DefenceStatusRequest;

			const res = responseMock();

			handleGetDefenceStatus(req, res);

			expect(res.send).toHaveBeenCalledWith(
				getInitialLevelStates().find((levelState) => levelState.level === level)
					?.defences
			);
		});
	});
});
