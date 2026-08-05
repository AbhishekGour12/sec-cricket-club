import { api } from './api';

export interface Achievement {
  id: string;
  title: string;
  year?: string;
}

export type PrivacyField =
  | 'phone'
  | 'alternate_phone'
  | 'contact_email'
  | 'instagram_url'
  | 'facebook_url'
  | 'linkedin_url'
  | 'website';

export type PrivacyVisibility = 'all' | 'hidden';

export type PrivacySettings = Partial<Record<PrivacyField, PrivacyVisibility>>;

export interface UserProfile {
  id: number;
  firebase_uid: string;
  email: string;
  alternate_phone?: string;
  contact_email?: string;
  instagram_url?: string;
  facebook_url?: string;
  linkedin_url?: string;
  business_address?: string;
  achievements?: Achievement[];
  privacy_settings?: PrivacySettings;
  bookmarked_members?: number[];
  full_name?: string;
  profile_image?: string;
  role: 'member' | 'admin' | 'moderator';
  member_source?: 'self_registration' | 'manual' | 'excel';
  status: 'active' | 'inactive';
  approval_status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  is_profile_completed: boolean;
  phone?: string;
  membership_number?: string;
  designation?: string;
  business_name?: string;
  business_category?: string;
  business_description?: string;
  business_logo?: string;
  visiting_card?: string;
  visiting_card_status?: 'pending' | 'approved' | 'rejected';
  visiting_card_rejection_reason?: string;
  business_images?: string[];
  city?: string;
  state?: string;
  country?: string;
  website?: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: UserProfile;
}

export const AuthApi = {
  /**
   * Log in or register using Firebase ID token.
   */
  loginWithGoogle: async (idToken: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/google', { idToken });
    return response.data;
  },

  /**
   * Get authenticated user profile details.
   */
  getMe: async (): Promise<{ user: UserProfile }> => {
    const response = await api.get<{ user: UserProfile }>('/auth/me');
    return response.data;
  },
};

export default AuthApi;
