import api from '../lib/axios';
import type { ChatListItem, StartChatResponse } from '../schemas/chat.schema';

export const chatService = {
  getMyChats: async (): Promise<ChatListItem[]> => {
    const response = await api.get('/chats/mine');
    return response.data;
  },

  startChat: async (recipientId: string, message: string): Promise<StartChatResponse> => {
    const response = await api.post('/chats/start', {
      recipient_id: recipientId,
      message,
    });
    return response.data;
  },

  deleteChats: async (ids: string[]): Promise<void> => {
    await api.delete('/chats/delete', { params: { ids } });
  },
};
