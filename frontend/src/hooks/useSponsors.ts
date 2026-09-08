import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

export interface EventSponsorItem {
  id: number;
  sponsor_id?: number;
  name: string;
  logo?: string | null;
  website?: string | null;
  tier: 'Title Sponsor' | 'Co-Sponsor' | 'Associate Sponsor' | string;
  display_order?: number;
  event_id: number;
  event_name: string;
  event_date?: string;
  event_type?: string;
}

interface EventSponsorsResponse {
  sponsors: EventSponsorItem[];
}

export const useEventSponsors = (enabled = true) => {
  const query = useQuery({
    queryKey: ['events', 'sponsors'],
    queryFn: async () => {
      const response = await api.get<EventSponsorsResponse>('/events/sponsors');
      return response.data.sponsors ?? [];
    },
    enabled,
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: false,
    refetchOnReconnect: true,
  });

  return {
    ...query,
    sponsors: query.data ?? [],
    isLoading: query.isLoading,
  };
};

export default useEventSponsors;
