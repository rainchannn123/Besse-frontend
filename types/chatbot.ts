export interface ChatbotMessage {
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface ChatbotResponse {
  reply: string;
  contextUsed?: Array<{
    id: string;
    text: string;
    score: number;
    metadata?: Record<string, unknown>;
  }>;
}
