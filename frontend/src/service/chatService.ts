import { sendRequest } from "./backendService";
import { CHAT_MODELS, ChatResponse } from "../models/chat";

const PATH = "openai/";

const clearChat = async (): Promise<boolean> => {
  const response = await sendRequest(PATH + "clear", "POST");
  return response.status === 200;
};

const sendMessage = async (
  message: string,
  currentPhase: number
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

const setOpenAIApiKey = async (apiKey: string): Promise<boolean> => {
  const response = await sendRequest(
    PATH + "apiKey",
    "POST",
    { "Content-Type": "application/json" },
    JSON.stringify({ apiKey })
  );
  return response.status === 200;
};

const getOpenAIApiKey = async (): Promise<string> => {
  const response = await sendRequest(PATH + "apiKey", "GET");
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
  return <CHAT_MODELS>modelStr;
};

export {
  clearChat,
  sendMessage,
  setOpenAIApiKey,
  getOpenAIApiKey,
  getGptModel,
  setGptModel,
};
