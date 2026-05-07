import api from '../lib/axios';
import type { Message } from '../schemas/message.schema';

export const messageService = {
  getMessages: async (
    chatId: string,
    limit = 50,
    skip = 0,
  ): Promise<Message[]> => {
    const response = await api.get(`/messages/${chatId}`, {
      params: { limit, skip },
    });
    return response.data;
  },

  deleteMessages: async (messageIds: string[]): Promise<void> => {
    await api.delete('/messages/messages', {
      params: { message_id: messageIds },
    });
  },

  editMessage: async (messageId: string, content: string): Promise<void> => {
    await api.patch(`/messages/messages/${messageId}`, null, {
      params: { content },
    });
  },

  readMessage: async (messageId: string): Promise<void> => {
    await api.patch(`/messages/messages/${messageId}/read`);
  },
};
