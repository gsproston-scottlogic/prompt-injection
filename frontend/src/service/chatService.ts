import { sendRequest } from "./backendService";
import {
  CHAT_MESSAGE_TYPE,
  CHAT_MODELS,
  ChatHistoryMessage,
  ChatMessage,
  ChatResponse,
} from "../models/chat";
import { PHASE_NAMES } from "../models/phase";

const PATH = "openai/";

const clearChat = async (phase: number): Promise<boolean> => {
  const response = await sendRequest(
    PATH + "clear",
    "POST",
    {
      "Content-Type": "application/json",
    },
    JSON.stringify({ phase: phase })
  );
  return response.status === 200;
};

const sendMessage = async (
  message: string,
  currentPhase: PHASE_NAMES
): Promise<ChatResponse> => {
  const response = await sendRequest(
    PATH + "chat",
    "POST",
    { "Content-Type": "application/json" },
    JSON.stringify({ message, currentPhase })
  );
  const data = await response.json();
  console.log(data);
  return data;
};

const getChatHistory = async (phase: number): Promise<ChatMessage[]> => {
  const response = await sendRequest(PATH + "history?phase=" + phase, "GET");
  const data = await response.json();

  console.log("getChatHistory", data);

  // convert to ChatMessage object
  const chatMessages: ChatMessage[] = data.map(
    (message: ChatHistoryMessage) => {
      if (message.completion) {
        return {
          message: message.completion.content,
          isOriginalMessage: true,
          type:
            message.completion.role == "user"
              ? CHAT_MESSAGE_TYPE.USER
              : CHAT_MESSAGE_TYPE.BOT,
        };
      } else if (message.infoMessage) {
        return {
          message: message.infoMessage,
          isOriginalMessage: false,
          type: CHAT_MESSAGE_TYPE.INFO,
        };
      }
    }
  );
  return chatMessages;
};

const setOpenAIApiKey = async (openAiApiKey: string): Promise<boolean> => {
  const response = await sendRequest(
    PATH + "openAiApiKey",
    "POST",
    { "Content-Type": "application/json" },
    JSON.stringify({ openAiApiKey })
  );
  return response.status === 200;
};

const getOpenAIApiKey = async (): Promise<string> => {
  const response = await sendRequest(PATH + "openAiApiKey", "GET");
  const data = await response.text();
  return data;
};

const setGptModel = async (model: string): Promise<boolean> => {
  const response = await sendRequest(
    PATH + "model",
    "POST",
    { "Content-Type": "application/json" },
    JSON.stringify({ model })
  );
  return response.status === 200;
};

const getGptModel = async (): Promise<CHAT_MODELS> => {
  const response = await sendRequest(PATH + "model", "GET");
  const modelStr = await response.text();
  return modelStr as CHAT_MODELS;
};

export {
  clearChat,
  sendMessage,
  setOpenAIApiKey,
  getOpenAIApiKey,
  getGptModel,
  setGptModel,
  getChatHistory,
};
