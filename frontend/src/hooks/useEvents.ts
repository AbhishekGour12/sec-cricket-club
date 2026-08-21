import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import type { ClubEvent } from '../store/eventStore';

interface EventsListResponse {
  events: ClubEvent[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

interface EventDetailResponse {
  event: ClubEvent;
}

interface FeaturedEventsResponse {
  events: ClubEvent[];
}

const listKey = (filters: Record<string, unknown>) => ['events', filters] as const;

export const useEvents = (filters: {
  search?: string;
  type?: string;
  page?: number;
  limit?: number;
  enabled?: boolean;
} = {}) => {
  const query = useQuery({
    queryKey: listKey({
      search: filters.search || '',
      type: filters.type || '',
      page: filters.page || 1,
      limit: filters.limit || 20,
    }),
    queryFn: async () => {
      const response = await api.get<EventsListResponse>('/events', {
        params: {
          search: filters.search || undefined,
          type: filters.type && filters.type !== 'All' ? filters.type : undefined,
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
    events: query.data?.events ?? [],
    total: query.data?.pagination?.total ?? 0,
    totalPages: query.data?.pagination?.total_pages ?? 1,
  };
};

/** Fetches all published upcoming featured events (API clamps to max 10). */
export const useFeaturedEvents = (limit = 10, enabled = true) => {
  const query = useQuery({
    queryKey: ['events', 'featured', limit],
    queryFn: async () => {
      const response = await api.get<FeaturedEventsResponse>('/events/featured', {
        params: { limit },
      });
      return response.data;
    },
    enabled,
    staleTime: 5 * 1000,
    refetchOnMount: true,
    refetchInterval: 10 * 1000,
  });

  return {
    ...query,
    events: query.data?.events ?? [],
  };
};

export const useEventDetail = (id?: number) => {
  return useQuery({
    queryKey: ['event', id],
    queryFn: async () => {
      const response = await api.get<EventDetailResponse>(`/events/${id}`);
      return response.data.event;
    },
    enabled: !!id && Number.isFinite(id) && id > 0,
    staleTime: 30 * 1000,
  });
};

/** PRD aliases — same TanStack Query hooks. */
export const useFeaturedEventsQuery = useFeaturedEvents;
export const useEventsQuery = useEvents;
export const useEventQuery = useEventDetail;
