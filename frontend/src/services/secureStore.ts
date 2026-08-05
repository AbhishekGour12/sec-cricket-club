import * as SecureStore from 'expo-secure-store';

const JWT_KEY = 'sec_cricket_jwt_token';
const USER_DATA_KEY = 'sec_cricket_user_data';

export const SecureStorageService = {
  /**
   * Save JWT token to secure storage.
   */
  setToken: async (token: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(JWT_KEY, token);
    } catch (error) {
      console.error('SecureStore: Failed to save JWT token:', error);
    }
  },

  /**
   * Retrieve JWT token from secure storage.
   */
  getToken: async (): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(JWT_KEY);
    } catch (error) {
      console.error('SecureStore: Failed to get JWT token:', error);
      return null;
    }
  },

  /**
   * Delete JWT token from secure storage.
   */
  deleteToken: async (): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(JWT_KEY);
    } catch (error) {
      console.error('SecureStore: Failed to delete JWT token:', error);
    }
  },

  /**
   * Save User Data to secure storage.
   */
  setUserData: async (userData: any): Promise<void> => {
    try {
      const dataStr = JSON.stringify(userData);
      await SecureStore.setItemAsync(USER_DATA_KEY, dataStr);
    } catch (error) {
      console.error('SecureStore: Failed to save user data:', error);
    }
  },

  /**
   * Retrieve User Data from secure storage.
   */
  getUserData: async (): Promise<any | null> => {
    try {
      const dataStr = await SecureStore.getItemAsync(USER_DATA_KEY);
      return dataStr ? JSON.parse(dataStr) : null;
    } catch (error) {
      console.error('SecureStore: Failed to get user data:', error);
      return null;
    }
  },

  /**
   * Clear all stored credentials.
   */
  clearAuthSession: async (): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(JWT_KEY);
      await SecureStore.deleteItemAsync(USER_DATA_KEY);
    } catch (error) {
      console.error('SecureStore: Failed to clear auth session:', error);
    }
  },
};

export default SecureStorageService;
