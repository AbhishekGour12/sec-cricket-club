import { create } from 'zustand';

export interface BusinessFlyer {
  id: number;
  user_id: number;
  image_url: string;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface BusinessFlyerState {
  flyers: BusinessFlyer[];
  max: number;
  viewerIndex: number | null;
  setFlyers: (flyers: BusinessFlyer[]) => void;
  setMax: (max: number) => void;
  openViewer: (index: number) => void;
  closeViewer: () => void;
  setViewerIndex: (index: number) => void;
  reset: () => void;
}

export const useBusinessFlyerStore = create<BusinessFlyerState>((set) => ({
  flyers: [],
  max: 5,
  viewerIndex: null,

  setFlyers: (flyers) => set({ flyers }),
  setMax: (max) => set({ max }),
  openViewer: (index) => set({ viewerIndex: index }),
  closeViewer: () => set({ viewerIndex: null }),
  setViewerIndex: (index) => set({ viewerIndex: index }),
  reset: () => set({ flyers: [], max: 5, viewerIndex: null }),
}));

export default useBusinessFlyerStore;
