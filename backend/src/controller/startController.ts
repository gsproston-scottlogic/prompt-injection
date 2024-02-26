import { Response } from 'express';

import { GetStartRequest } from '@src/models/api/getStartRequest';
import { LEVEL_NAMES } from '@src/models/level';
import { getValidOpenAIModels } from '@src/openai';
import {
	systemRoleLevel1,
	systemRoleLevel2,
	systemRoleLevel3,
} from '@src/promptTemplates';

function handleStart(req: GetStartRequest, res: Response) {
	const { level } = req.query;

	const systemRoles = [
		{ level: LEVEL_NAMES.LEVEL_1, systemRole: systemRoleLevel1 },
		{ level: LEVEL_NAMES.LEVEL_2, systemRole: systemRoleLevel2 },
		{ level: LEVEL_NAMES.LEVEL_3, systemRole: systemRoleLevel3 },
	];

	res.send({
		emails: req.session.levelState[level].sentEmails,
		chatHistory: req.session.levelState[level].chatHistory,
		defences: req.session.levelState[level].defences,
		availableModels: getValidOpenAIModels(),
		systemRoles,
	});
}

export { handleStart };
