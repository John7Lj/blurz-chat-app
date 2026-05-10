/*
 * Copyright (c) 2026 Blurz
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import api from '../lib/axios';
import type { Message } from '../types/message.types';

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
    await api.delete('/messages/delete', {
      params: { message_id: messageIds },
      paramsSerializer: {
        indexes: null, // serialize as ?message_id=a&message_id=b
      },
    });
  },

  editMessage: async (messageId: string, content: string): Promise<void> => {
    await api.patch(`/messages/${messageId}`, { content });
  },

  readMessage: async (messageId: string): Promise<void> => {
    await api.patch(`/messages/${messageId}/read`);
  },
};
