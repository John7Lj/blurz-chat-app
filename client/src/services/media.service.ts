/*
 * Copyright (c) 2026 Blurz
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import api from '../lib/axios';
import axios from 'axios';
import type { Message } from '../types/message.types';

export const mediaService = {
  /**
   * Upload a media file to a chat via direct Cloudinary upload.
   * Returns the created Message with file_url, msg_type, etc.
   */
  uploadChatMedia: async (chatId: string, file: File): Promise<Message> => {
    // Determine category based on MIME type
    let category = 'file';
    if (file.type.startsWith('image/')) category = 'image';
    else if (file.type.startsWith('video/')) category = 'video';
    else if (file.type.startsWith('audio/')) category = 'audio';
    else if (file.type === 'application/pdf') category = 'document';

    // 1. Get signature from our backend
    const signRes = await api.post('/media/sign-upload', { category });
    const { timestamp, signature, cloud_name, api_key, folder, resource_type } = signRes.data;

    // 2. Upload directly to Cloudinary
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', api_key);
    formData.append('timestamp', timestamp);
    formData.append('signature', signature);
    formData.append('folder', folder);

    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloud_name}/${resource_type}/upload`;
    const cloudRes = await axios.post(uploadUrl, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    // 3. Confirm with our backend
    const confirmRes = await api.post('/media/confirm-upload', {
      chat_id: chatId,
      secure_url: cloudRes.data.secure_url,
      public_id: cloudRes.data.public_id,
      resource_type: cloudRes.data.resource_type,
      original_filename: file.name,
      file_size: file.size,
      file_mime: file.type || 'application/octet-stream',
    });

    return confirmRes.data;
  },

  /**
   * Upload or replace profile picture via direct Cloudinary upload.
   * Returns { message, profile_url }.
   */
  uploadProfilePicture: async (file: File): Promise<{ message: string; profile_url: string }> => {
    // 1. Get signature from our backend
    const signRes = await api.post('/media/sign-upload', { category: 'profile' });
    const { timestamp, signature, cloud_name, api_key, folder, resource_type, transformation } = signRes.data;

    // 2. Upload directly to Cloudinary
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', api_key);
    formData.append('timestamp', timestamp);
    formData.append('signature', signature);
    formData.append('folder', folder);
    if (transformation) {
      formData.append('transformation', transformation);
    }

    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloud_name}/${resource_type}/upload`;
    const cloudRes = await axios.post(uploadUrl, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    // 3. Confirm with our backend
    const confirmRes = await api.post('/media/confirm-profile-upload', {
      secure_url: cloudRes.data.secure_url,
      public_id: cloudRes.data.public_id,
    });

    return confirmRes.data;
  },
};
