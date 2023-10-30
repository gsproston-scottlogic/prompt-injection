import { DEFENCE_TYPES, DefenceConfig, DefenceInfo } from "../models/defence";
import { sendRequest } from "./backendService";

const PATH = "defence/";

async function getDefences(level: number) {
  const response = await sendRequest(`${PATH}status?level=${level}`, "GET");
  const data = (await response.json()) as DefenceInfo[];
  return data;
}

async function activateDefence(id: string, level: number): Promise<boolean> {
  const response = await sendRequest(
    `${PATH}activate`,
    "POST",
    { "Content-Type": "application/json" },
    JSON.stringify({ defenceId: id, level })
  );
  return response.status === 200;
}

async function deactivateDefence(id: string, level: number): Promise<boolean> {
  const response = await sendRequest(
    `${PATH}deactivate`,
    "POST",
    {
      "Content-Type": "application/json",
    },
    JSON.stringify({ defenceId: id, level })
  );
  return response.status === 200;
}

async function configureDefence(
  id: string,
  config: DefenceConfig[],
  level: number
): Promise<boolean> {
  const response = await sendRequest(
    `${PATH}configure`,
    "POST",
    {
      "Content-Type": "application/json",
    },
    JSON.stringify({ defenceId: id, config, level })
  );
  return response.status === 200;
}

function validatePositiveNumberConfig(config: string) {
  // config is a number greater than zero
  return !isNaN(Number(config)) && Number(config) > 0;
}

function validateNonEmptyStringConfig(config: string) {
  // config is non empty string and is not a number
  return config !== "" && !Number(config);
}

function validateFilterConfig(config: string) {
  // config is not a list of empty commas
  const commaPattern = /^,*,*$/;
  return config === "" || !commaPattern.test(config);
}

function validateDefence(id: string, configName: string, config: string) {
  switch (id) {
    case DEFENCE_TYPES.CHARACTER_LIMIT:
      return validatePositiveNumberConfig(config);
    case DEFENCE_TYPES.RANDOM_SEQUENCE_ENCLOSURE:
      return configName === "length"
        ? validatePositiveNumberConfig(config)
        : validateNonEmptyStringConfig(config);
    case DEFENCE_TYPES.FILTER_USER_INPUT:
    case DEFENCE_TYPES.FILTER_BOT_OUTPUT:
      return validateFilterConfig(config);
    default:
      return validateNonEmptyStringConfig(config);
  }
}

async function resetActiveDefences(level: number) {
  const response = await sendRequest(
    `${PATH}reset`,
    "POST",
    {
      "Content-Type": "application/json",
    },
    JSON.stringify({ level })
  );
  return response.status === 200;
}

export {
  getDefences,
  activateDefence,
  deactivateDefence,
  configureDefence,
  resetActiveDefences,
  validateDefence,
};
