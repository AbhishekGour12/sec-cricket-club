import { create } from 'zustand';
import api from '../services/api';

export interface ApprovalState {
  approvalStatus: 'pending' | 'approved' | 'rejected' | null;
  loading: boolean;
  rejectedReason: string;
  setApprovalStatus: (status: 'pending' | 'approved' | 'rejected') => void;
  setLoading: (loading: boolean) => void;
  setRejectedReason: (reason: string) => void;
  fetchApprovalStatus: () => Promise<void>;
}

export const useApprovalStore = create<ApprovalState>((set) => ({
  approvalStatus: null, // null = not yet fetched; avoids false 'pending' flash on mount
  loading: false,
  rejectedReason: '',

  setApprovalStatus: (status) => set({ approvalStatus: status }),
  setLoading: (loading) => set({ loading }),
  setRejectedReason: (reason) => set({ rejectedReason: reason }),

  fetchApprovalStatus: async () => {
    set({ loading: true });
    try {
      const response = await api.get('/me/approval-status');
      set({
        approvalStatus: response.data.approval_status || 'pending',
        rejectedReason: response.data.rejection_reason || '',
      });
    } catch (error) {
      console.error('Failed to fetch approval status from backend:', error);
      // On error keep null so we don't flash a false pending screen
    } finally {
      set({ loading: false });
    }
  },
}));

export default useApprovalStore;
