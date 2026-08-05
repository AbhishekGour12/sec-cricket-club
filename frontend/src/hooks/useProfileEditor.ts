import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import type {
  Achievement,
  PrivacySettings,
  UserProfile,
} from '../services/authApi';

export interface ProfileEditorPayload {
  alternate_phone?: string;
  contact_email?: string;
  instagram_url?: string;
  facebook_url?: string;
  linkedin_url?: string;
  achievements?: Achievement[];
  privacy_settings?: PrivacySettings;
}

/**
 * Saves the contact / social / achievements portion of the member's own
 * profile and keeps the auth store and query cache in step.
 */
export const useProfileEditor = () => {
  const queryClient = useQueryClient();
  const updateUser = useAuthStore((state) => state.updateUser);

  const mutation = useMutation({
    mutationFn: async (payload: ProfileEditorPayload) => {
      const response = await api.put<{ user: UserProfile }>('/me', payload);
      return response.data.user;
    },
    onSuccess: (user) => {
      updateUser(user);
      queryClient.setQueryData(['currentUser'], user);
    },
  });

  return {
    saveProfile: mutation.mutateAsync,
    isSaving: mutation.isPending,
    saveError: mutation.error instanceof Error ? mutation.error.message : null,
  };
};

export default useProfileEditor;
