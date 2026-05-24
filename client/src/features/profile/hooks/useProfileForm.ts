/*
 * Copyright (c) 2026 Blurz
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useCurrentUser, useUpdateProfile, ME_KEY } from '../../../hooks/useUser';
import { mediaService } from '../../../services/media.service';

export function useProfileForm() {
  const { data: user, isLoading } = useCurrentUser();
  const updateMutation = useUpdateProfile();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    username: '',
    first_name: '',
    last_name: '',
    bio: '',
  });
  const [initialized, setInitialized] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (user && !initialized) {
    setForm({
      username: user.username || '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      bio: user.bio || '',
    });
    setInitialized(true);
  }

  const setFieldValue = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSave = () => {
    updateMutation.mutate(form, {
      onSuccess: () => toast.success('Profile updated!'),
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Only JPG, PNG and WEBP images are allowed');
      return;
    }

    setIsUploading(true);

    toast.promise(
      mediaService.uploadProfilePicture(file).then(() => {
        queryClient.invalidateQueries({ queryKey: ME_KEY });
      }),
      {
        loading: 'Uploading to Cloudinary...',
        success: 'Profile picture updated!',
        error: 'Failed to upload image'
      }
    ).finally(() => {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    });
  };

  const fullName = `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim();

  return {
    user,
    isLoading,
    form,
    setFieldValue,
    handleSave,
    handleFileChange,
    isUploading,
    fileInputRef,
    fullName,
    isSaving: updateMutation.isPending,
  };
}
