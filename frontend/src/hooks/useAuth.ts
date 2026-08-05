import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { AuthApi } from '../services/authApi';

export const useAuth = () => {
  const queryClient = useQueryClient();
  const store = useAuthStore();

  // Query: Get current authenticated user profile
  const userQuery = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const res = await AuthApi.getMe();
      // Keep the global auth state in sync with the fresh, complete database
      // response. Screens read user data from this store.
      useAuthStore.getState().updateUser(res.user);
      return res.user;
    },
    enabled: store.isAuthenticated,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnMount: 'always',
  });

  // Mutation: Login with Google (Firebase ID Token)
  const loginMutation = useMutation({
    mutationFn: async (idToken: string) => {
      return await store.login(idToken);
    },
    onSuccess: (user) => {
      queryClient.setQueryData(['currentUser'], user);
    },
  });

  // Mutation: Logout
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await store.logout();
    },
    onSuccess: () => {
      queryClient.clear(); // Clear all cache on logout
    },
  });

  return {
    // State from store
    user: store.user,
    jwt: store.jwt,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading || userQuery.isFetching,
    error: store.error || (loginMutation.error?.message ?? null),

    // Actions
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    logout: logoutMutation.mutateAsync,
    isLoggingOut: logoutMutation.isPending,
    restoreSession: store.restoreSession,
    
    // Query direct access
    refetchUser: userQuery.refetch,
  };
};

export default useAuth;
