import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

export type SuggestionType = 'Suggestion' | 'Complaint' | 'Feedback' | 'General';
export type SuggestionStatus = 'Pending' | 'Reviewed' | 'Resolved' | 'Archived';

export interface SuggestionItem {
  id: number;
  user_id?: number | null;
  type: SuggestionType;
  subject?: string | null;
  message: string;
  status: SuggestionStatus;
  admin_notes?: string | null;
  created_at: string;
  updated_at: string;
}

interface MySuggestionsResponse {
  suggestions: SuggestionItem[];
}

interface SubmitSuggestionPayload {
  type: SuggestionType;
  subject?: string;
  message: string;
}

interface SubmitSuggestionResponse {
  message: string;
  suggestion: SuggestionItem;
}

export const useMySuggestions = (enabled = true) => {
  const query = useQuery({
    queryKey: ['suggestions', 'my'],
    queryFn: async () => {
      const res = await api.get<MySuggestionsResponse>('/me/suggestions');
      return res.data.suggestions ?? [];
    },
    enabled,
    staleTime: 30 * 1000,
  });

  return {
    ...query,
    suggestions: query.data ?? [],
    isLoading: query.isLoading,
  };
};

export const useSubmitSuggestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: SubmitSuggestionPayload) => {
      const res = await api.post<SubmitSuggestionResponse>('/suggestions', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suggestions', 'my'] });
    },
  });
};
