import api from '@/config/api';
import { ChatbotMessage, ChatbotResponse } from '@/types/chatbot';

interface ChatMessageRequest {
  message: string;
  sessionId?: string;
  pageContext: 'mrf-collection' | 'broker-inventory' | 'municipality';
  history?: Pick<ChatbotMessage, 'role' | 'content'>[];
}

export const chatbotService = {
  async sendMessage(payload: ChatMessageRequest): Promise<ChatbotResponse> {
    const response = await api.post('/chatbot/message', payload);
    return response.data?.data;
  },
};
