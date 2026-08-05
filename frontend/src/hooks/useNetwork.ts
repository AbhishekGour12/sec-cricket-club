import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import type { Member } from './useMembers';

/**
 * The member's saved network — the people they bookmarked from the directory.
 */
export const useNetwork = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);

  const networkQuery = useQuery({
    queryKey: ['network'],
    queryFn: async () => {
      const response = await api.get<{ members: Member[] }>('/me/bookmarks');
      return response.data.members;
    },
    staleTime: 60 * 1000,
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ memberId, saved }: { memberId: number; saved: boolean }) => {
      const response = saved
        ? await api.delete<{ bookmarked_members: number[] }>(`/me/bookmarks/${memberId}`)
        : await api.post<{ bookmarked_members: number[] }>(`/me/bookmarks/${memberId}`);
      return response.data.bookmarked_members;
    },
    onSuccess: (bookmarked_members) => {
      if (user) updateUser({ ...user, bookmarked_members });
      queryClient.invalidateQueries({ queryKey: ['network'] });
    },
  });

  const bookmarkedIds = user?.bookmarked_members ?? [];

  return {
    members: networkQuery.data ?? [],
    isLoading: networkQuery.isLoading,
    error: networkQuery.error instanceof Error ? networkQuery.error.message : null,
    refetch: networkQuery.refetch,

    bookmarkedIds,
    isBookmarked: (memberId: number) => bookmarkedIds.includes(memberId),
    toggleBookmark: (memberId: number, saved: boolean) =>
      toggleMutation.mutateAsync({ memberId, saved }),
    isTogglingBookmark: toggleMutation.isPending,
  };
};

export default useNetwork;
