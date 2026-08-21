import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type { Announcement } from '../store/announcementStore';

interface AnnouncementsResponse {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  announcements: Announcement[];
}

interface AnnouncementResponse {
  announcement: Announcement;
}

const listKey = (filters: Record<string, unknown>) => ['announcements', filters] as const;

export const useAnnouncements = (filters: {
  search?: string;
  type?: string;
  pinned?: boolean;
  page?: number;
  limit?: number;
  enabled?: boolean;
} = {}) => {
  const query = useQuery({
    queryKey: listKey({
      search: filters.search || '',
      type: filters.type || '',
      pinned: filters.pinned,
      page: filters.page || 1,
      limit: filters.limit || 20,
    }),
    queryFn: async () => {
      const response = await api.get<AnnouncementsResponse>('/mobile/announcements', {
        params: {
          search: filters.search || undefined,
          type: filters.type && filters.type !== 'All' ? filters.type : undefined,
          pinned: typeof filters.pinned === 'boolean' ? filters.pinned : undefined,
          page: filters.page || 1,
          limit: filters.limit || 20,
        },
      });
      return response.data;
    },
    enabled: filters.enabled !== false,
    staleTime: 5 * 1000,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchInterval: 10 * 1000,
  });

  return {
    ...query,
    announcements: query.data?.announcements ?? [],
    total: query.data?.total ?? 0,
    totalPages: query.data?.totalPages ?? 1,
  };
};

export const usePinnedAnnouncements = (enabled = true) => {
  return useAnnouncements({ pinned: true, limit: 10, enabled });
};

export const useLatestAnnouncements = (limit = 3, enabled = true) => {
  return useAnnouncements({ limit, enabled });
};

export const useAnnouncementDetail = (id?: number) => {
  const queryClient = useQueryClient();

  const detailQuery = useQuery({
    queryKey: ['announcement', id],
    queryFn: async () => {
      const response = await api.get<AnnouncementResponse>(`/mobile/announcements/${id}`);
      return response.data.announcement;
    },
    enabled: typeof id === 'number' && id > 0,
    staleTime: 60 * 1000,
  });

  const markReadMutation = useMutation({
    mutationFn: async (announcementId: number) => {
      await api.post(`/mobile/announcements/${announcementId}/read`);
      return announcementId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      if (id) queryClient.invalidateQueries({ queryKey: ['announcement', id] });
    },
  });

  return {
    ...detailQuery,
    announcement: detailQuery.data,
    markRead: markReadMutation.mutateAsync,
    isMarkingRead: markReadMutation.isPending,
  };
};

export default useAnnouncements;
