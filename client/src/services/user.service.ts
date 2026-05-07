import api from '../lib/axios';
import type { ContactUser, UpdateUserInput, User } from '../schemas/user.schema';

export const userService = {
  getContacts: async (): Promise<ContactUser[]> => {
    const response = await api.get('/users/contacts');
    return response.data;
  },

  searchUsers: async (query: string): Promise<ContactUser[]> => {
    const response = await api.get(`/users/search/${encodeURIComponent(query)}`);
    return response.data;
  },

  updateUser: async (data: UpdateUserInput): Promise<User> => {
    const response = await api.patch('/users/update', data);
    return response.data;
  },

  updateProfilePicture: async (pictureBase64: string): Promise<{ message: string }> => {
    const response = await api.patch('/users/update-profile-picture', {
      profile_picture: pictureBase64,
    });
    return response.data;
  },
};
