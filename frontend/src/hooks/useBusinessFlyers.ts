import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import {
  BusinessFlyer,
  useBusinessFlyerStore,
} from '../store/businessFlyerStore';

interface FlyersResponse {
  flyers: BusinessFlyer[];
  max?: number;
}

interface UploadResponse {
  message: string;
  flyer: BusinessFlyer;
}

interface ReorderResponse {
  message: string;
  flyers: BusinessFlyer[];
}

const OWN_KEY = ['business-flyers', 'me'] as const;
const memberKey = (id: number) => ['business-flyers', 'member', id] as const;

export const useBusinessFlyers = (options?: { enabled?: boolean }) => {
  const queryClient = useQueryClient();
  const { setFlyers, setMax } = useBusinessFlyerStore();

  const flyersQuery = useQuery({
    queryKey: OWN_KEY,
    queryFn: async () => {
      const response = await api.get<FlyersResponse>('/profile/business-flyers');
      setFlyers(response.data.flyers);
      if (typeof response.data.max === 'number') setMax(response.data.max);
      return response.data;
    },
    enabled: options?.enabled !== false,
    staleTime: 60 * 1000,
  });

  const uploadMutation = useMutation({
    mutationFn: async (payload: {
      uri: string;
      mimeType?: string;
      fileName?: string;
      replaceId?: number;
    }) => {
      const formData = new FormData();
      const name = payload.fileName || `flyer-${Date.now()}.jpg`;
      const type = payload.mimeType || 'image/jpeg';

      formData.append('image', {
        uri: payload.uri,
        name,
        type,
      } as unknown as Blob);

      if (payload.replaceId) {
        formData.append('replace_id', String(payload.replaceId));
      }

      const response = await api.post<UploadResponse>('/profile/business-flyers', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OWN_KEY });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/profile/business-flyers/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OWN_KEY });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (orderedIds: number[]) => {
      const response = await api.put<ReorderResponse>('/profile/business-flyers/reorder', {
        ordered_ids: orderedIds,
      });
      return response.data;
    },
    onSuccess: (data) => {
      setFlyers(data.flyers);
      queryClient.setQueryData(OWN_KEY, { flyers: data.flyers, max: 5 });
    },
  });

  return {
    flyersQuery,
    flyers: flyersQuery.data?.flyers ?? [],
    max: flyersQuery.data?.max ?? 5,
    isLoading: flyersQuery.isLoading,
    error: flyersQuery.error,
    refetch: flyersQuery.refetch,
    uploadFlyer: uploadMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
    deleteFlyer: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    reorderFlyers: reorderMutation.mutateAsync,
    isReordering: reorderMutation.isPending,
  };
};

export const useMemberBusinessFlyers = (memberId?: number) => {
  return useQuery({
    queryKey: memberId ? memberKey(memberId) : ['business-flyers', 'member', 'none'],
    queryFn: async () => {
      const response = await api.get<FlyersResponse>(`/members/${memberId}/business-flyers`);
      return response.data.flyers;
    },
    enabled: typeof memberId === 'number' && memberId > 0,
    staleTime: 2 * 60 * 1000,
  });
};

export default useBusinessFlyers;
