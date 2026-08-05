import { create } from 'zustand';
import { AuthApi, UserProfile } from '../services/authApi';
import { SecureStorageService } from '../services/secureStore';
import { auth as firebaseAuth } from '../config/firebase';
import { signOut as firebaseSignOut } from 'firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

interface AuthState {
  user: UserProfile | null;
  jwt: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  login: (idToken: string) => Promise<UserProfile>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<boolean>;
  updateUser: (user: UserProfile) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  jwt: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  setLoading: (loading: boolean) => set({ isLoading: loading }),
  setError: (error: string | null) => set({ error }),
  updateUser: (user: UserProfile) => set({ user }),

  login: async (idToken: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await AuthApi.loginWithGoogle(idToken);
      
      // Save credentials locally in Secure Storage
      await SecureStorageService.setToken(response.token);
      await SecureStorageService.setUserData(response.user);

      set({
        jwt: response.token,
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      });

      return response.user;
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || 'Login failed';
      set({ isLoading: false, error: errMsg });
      throw new Error(errMsg);
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      // 1. Sign out of Firebase Auth client
      await firebaseSignOut(firebaseAuth);
    } catch (err) {
      console.warn('Zustand AuthStore: Failed to sign out of Firebase Client Auth:', err);
    }

    try {
      // 2. Sign out of Google Sign-In SDK so native session is cleared and account chooser appears next time
      await GoogleSignin.signOut();
    } catch (err) {
      console.warn('Zustand AuthStore: Failed to sign out of GoogleSignin SDK:', err);
    }

    try {
      // 3. Clear Secure Storage
      await SecureStorageService.clearAuthSession();

      set({
        user: null,
        jwt: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    } catch (err: any) {
      set({ isLoading: false, error: err.message });
    }
  },

  restoreSession: async () => {
    set({ isLoading: true });
    try {
      const token = await SecureStorageService.getToken();
      const userData = await SecureStorageService.getUserData();

      if (token && userData) {
        set({
          jwt: token,
          user: userData,
          isAuthenticated: true,
          isLoading: false,
        });

        // Background check: verify token is still valid with backend and update profile
        try {
          const profileRes = await AuthApi.getMe();
          await SecureStorageService.setUserData(profileRes.user);
          set({ user: profileRes.user });
        } catch (bgError) {
          // If backend check fails with 401, interceptor will clear local storage and reset
          console.warn('Session refresh background check failed:', bgError);
        }

        return true;
      } else {
        set({ isLoading: false, isAuthenticated: false });
        return false;
      }
    } catch (err) {
      console.error('Failed to restore session:', err);
      set({ isLoading: false, isAuthenticated: false });
      return false;
    }
  },
}));

export default useAuthStore;
