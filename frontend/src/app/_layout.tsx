import 'react-native-gesture-handler';
import React from 'react';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Colors } from '@/theme';
import '../global.css';

import { ToastProvider } from '@/components/Toast';

// Keep warnings visible in release builds; silence only while developing.
if (__DEV__) {
  LogBox.ignoreAllLogs();
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerStyle: {
                backgroundColor: Colors.primary,
              },
              headerTintColor: '#FFFFFF',
              headerTitleStyle: {
                fontWeight: '900',
              },
              contentStyle: {
                backgroundColor: Colors.background,
              },
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="otp" options={{ headerShown: false }} />
            <Stack.Screen name="profile-completion" options={{ headerShown: false }} />
            <Stack.Screen name="networks" options={{ headerShown: false }} />
            <Stack.Screen name="member/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="announcement/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="event/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
        </ToastProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

