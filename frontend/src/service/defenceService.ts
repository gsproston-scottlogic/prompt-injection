import { DEFAULT_DEFENCES } from '@src/defences';
import { ChatInfoMessageResponse } from '@src/models/apiResponse';
import { ChatMessage } from '@src/models/chat';
import {
	DEFENCE_ID,
	DefenceConfigItem,
	DefenceResetResponse,
	DefenceDTO,
	DEFENCE_CONFIG_ITEM_ID,
} from '@src/models/defence';
import { LEVEL_NAMES } from '@src/models/level';

import { post } from './backendService';
import { makeChatMessageFromDTO } from './chatService';

const PATH = 'defence';

function getDefencesFromDTOs(defenceDTOs: DefenceDTO[]) {
	return DEFAULT_DEFENCES.map((defence) => {
		const defenceDTO = defenceDTOs.find(
			(defenceDTO) => defence.id === defenceDTO.id
		);
		return defenceDTO
			? {
					...defence,
					isActive: defenceDTO.isActive,
					config: defence.config.map((config) => {
						const matchingConfigItemDTO = defenceDTO.config.find(
							(configItemDTO) => config.id === configItemDTO.id
						);
						return matchingConfigItemDTO
							? { ...config, value: matchingConfigItemDTO.value }
							: config;
					}),
				}
			: defence;
	});
}

async function toggleDefence(
	defenceId: DEFENCE_ID,
	isActive: boolean,
	level: LEVEL_NAMES
): Promise<ChatMessage | null> {
	const command = isActive ? 'deactivate' : 'activate';
	const response = await post(`${PATH}/${command}`, { defenceId, level });
	if (response.status !== 200) return null;

	const { chatInfoMessage } =
		(await response.json()) as ChatInfoMessageResponse;

	return makeChatMessageFromDTO(chatInfoMessage);
}

async function configureDefence(
	defenceId: DEFENCE_ID,
	config: DefenceConfigItem[],
	level: LEVEL_NAMES
): Promise<ChatMessage | null> {
	const response = await post(`${PATH}/configure`, {
		defenceId,
		config,
		level,
	});

	if (response.status !== 200) return null;

	const { chatInfoMessage } =
		(await response.json()) as ChatInfoMessageResponse;

	return makeChatMessageFromDTO(chatInfoMessage);
}

async function resetDefenceConfigItem(
	defenceId: DEFENCE_ID,
	configItemId: DEFENCE_CONFIG_ITEM_ID,
	level: LEVEL_NAMES
): Promise<DefenceResetResponse | null> {
	return post(`${PATH}/resetConfig`, {
		defenceId,
		configItemId,
		level,
	}).then(
		async (response) => {
			return (await response.json()) as DefenceResetResponse;
		},
		async () => {
			return null;
		}
	);
}

function validatePositiveNumberConfig(value: string) {
	// config is a number greater than zero
	return !isNaN(Number(value)) && Number(value) > 0;
}

function validateNonEmptyStringConfig(value: string) {
	// config is non empty string and is not a number
	return value !== '' && !Number(value);
}

function validateFilterConfig(value: string) {
	// config is not a list of empty commas
	return (
		value
			.split(',')
			.map((item) => item.trim())
			.filter((item) => item).length > 0
	);
}

function validateDefence(
	defenceId: DEFENCE_ID,
	configItemId: DEFENCE_CONFIG_ITEM_ID,
	configItemValue: string
) {
	switch (defenceId) {
		case DEFENCE_ID.CHARACTER_LIMIT:
			return validatePositiveNumberConfig(configItemValue);
		case DEFENCE_ID.INPUT_FILTERING:
		case DEFENCE_ID.OUTPUT_FILTERING:
			return validateFilterConfig(configItemValue);
		case DEFENCE_ID.RANDOM_SEQUENCE_ENCLOSURE:
			return configItemId === 'SEQUENCE_LENGTH'
				? validatePositiveNumberConfig(configItemValue)
				: validateNonEmptyStringConfig(configItemValue);
		default:
			return validateNonEmptyStringConfig(configItemValue);
	}
}

export {
	toggleDefence,
	configureDefence,
	resetDefenceConfigItem,
	validateDefence,
	getDefencesFromDTOs,
};
