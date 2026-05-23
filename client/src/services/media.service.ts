/*
 * Copyright (c) 2026 Blurz
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import api from '../lib/axios';
import type { Message } from '../types/message.types';

export const mediaService = {
  /**
   * Upload a media file to a chat.
   * Returns the created Message with file_url, msg_type, etc.
   */
  uploadChatMedia: async (chatId: string, file: File): Promise<Message> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('chat_id', chatId);
    const response = await api.post('/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000, // 2 min timeout for large files
    });
    return response.data;
  },

  /**
   * Upload or replace profile picture.
   * Returns { message, profile_url }.
   */
  uploadProfilePicture: async (file: File): Promise<{ message: string; profile_url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/media/upload-profile', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000,
    });
    return response.data;
  },
};
