import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { Member } from './useMembers';

export const useApprovalStatusQuery = () => {
  return useQuery({
    queryKey: ['approvalStatus'],
    queryFn: async () => {
      const response = await api.get<{
        approval_status: 'pending' | 'approved' | 'rejected';
        status: 'active' | 'inactive';
        rejection_reason?: string;
      }>('/me/approval-status');
      return response.data;
    },
    staleTime: 10 * 1000, // 10 seconds
  });
};

export const usePendingMembersQuery = (enabled = false) => {
  return useQuery({
    queryKey: ['pendingMembers'],
    queryFn: async () => {
      const response = await api.get<{ members: Member[] }>('/admin/pending-members');
      return response.data.members;
    },
    enabled,
    staleTime: 60 * 1000,
  });
};

export const useApprovedMembersQuery = (enabled = false) => {
  return useQuery({
    queryKey: ['approvedMembers'],
    queryFn: async () => {
      const response = await api.get<{ members: Member[] }>('/admin/auth/members');
      return (response.data.members || []).filter((m) => m.approval_status === 'approved');
    },
    enabled,
    staleTime: 60 * 1000,
  });
};

export const useRejectedMembersQuery = (enabled = false) => {
  return useQuery({
    queryKey: ['rejectedMembers'],
    queryFn: async () => {
      const response = await api.get<{ members: Member[] }>('/admin/auth/members');
      return (response.data.members || []).filter((m) => m.approval_status === 'rejected');
    },
    enabled,
    staleTime: 60 * 1000,
  });
};
