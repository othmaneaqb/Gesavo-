import api from "./api";

export const chatbotService = {
  sendMessage: async ({ message, language = "fr", history = [] }) => {
    const response = await api.post("chatbot/message/", { message, language, history });
    return response.data;
  },

  executeAction: async (action, language = "fr") => {
    const response = await api.post("chatbot/action/", { ...action, language });
    return response.data;
  },
};
