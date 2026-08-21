import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

export interface Member {
  id: number;
  firebase_uid: string;
  email: string;
  alternate_phone?: string;
  contact_email?: string;
  instagram_url?: string;
  facebook_url?: string;
  linkedin_url?: string;
  business_address?: string;
  achievements?: { id: string; title: string; year?: string }[];
  full_name?: string;
  profile_image?: string;
  phone?: string;
  membership_number?: string;
  designation?: string;
  business_name?: string;
  business_category?: string;
  business_description?: string;
  business_logo?: string;
  visiting_card?: string;
  business_images?: string[];
  city?: string;
  state?: string;
  country?: string;
  website?: string;
  status: 'active' | 'inactive';
  approval_status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  role: 'member' | 'admin' | 'moderator';
  is_profile_completed: boolean;
}

export interface MembersResponse {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  members: Member[];
}

export const useMembers = (filters: {
  search?: string;
  category?: string;
  status?: string;
  page?: number;
  limit?: number;
} = {}) => {
  const membersQuery = useQuery({
    queryKey: ['members', filters],
    queryFn: async () => {
      const response = await api.get<MembersResponse>('/members', {
        params: filters,
      });
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get<{ categories: string[] }>('/members/categories');
      return response.data.categories;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    membersQuery,
    categoriesQuery,
    
    members: membersQuery.data?.members || [],
    total: membersQuery.data?.total || 0,
    totalPages: membersQuery.data?.totalPages || 1,
    categories: categoriesQuery.data || [],
    
    isLoadingMembers: membersQuery.isLoading,
    isLoadingCategories: categoriesQuery.isLoading,
    membersError: membersQuery.error,
    categoriesError: categoriesQuery.error,
    
    refetchMembers: membersQuery.refetch,
    refetchCategories: categoriesQuery.refetch,
  };
};

export default useMembers;
