import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ProfileCompletionData {
  // Step 1
  profile_image: string;
  full_name: string;
  
  // Step 2
  membership_number: string;
  phone: string;
  designation: string;
  city: string;
  state: string;
  country: string;

  // Step 3
  business_name: string;
  business_category: string;
  business_description: string;
  website: string;
  business_address: string;

  // Step 4
  business_logo: string;
  visiting_card: string; // Stored as a relative URL (CSV if multi-card)
  business_images: string[]; // Max 5 image paths
}

interface ProfileCompletionState {
  step: number;
  formData: ProfileCompletionData;
  isSubmitting: boolean;
  
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateFormData: (data: Partial<ProfileCompletionData>) => void;
  setSubmitting: (isSubmitting: boolean) => void;
  reset: () => void;
}

const initialFormData: ProfileCompletionData = {
  profile_image: '',
  full_name: '',
  membership_number: '',
  phone: '',
  designation: 'Associate Member', // default matching mockup
  city: '',
  state: '',
  country: '',
  business_name: '',
  business_category: '',
  business_description: '',
  website: '',
  business_address: '',
  business_logo: '',
  visiting_card: '',
  business_images: [],
};

export const useProfileStore = create<ProfileCompletionState>()(
  persist(
    (set) => ({
      step: 0,
      formData: initialFormData,
      isSubmitting: false,

      setStep: (step) => set({ step }),
      nextStep: () => set((state) => ({ step: Math.min(3, state.step + 1) })),
      prevStep: () => set((state) => ({ step: Math.max(0, state.step - 1) })),
      
      updateFormData: (data) =>
        set((state) => ({
          formData: { ...state.formData, ...data },
        })),
        
      setSubmitting: (isSubmitting) => set({ isSubmitting }),
      
      reset: () => set({ step: 0, formData: initialFormData, isSubmitting: false }),
    }),
    {
      name: 'profile-completion-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useProfileStore;
