import { create } from 'zustand';

interface RealtimeState {
  streamConnected: boolean;
  setStreamConnected: (connected: boolean) => void;
}

export const useRealtimeStore = create<RealtimeState>((set) => ({
  streamConnected: false,
  setStreamConnected: (streamConnected) => set({ streamConnected }),
}));

export default useRealtimeStore;
