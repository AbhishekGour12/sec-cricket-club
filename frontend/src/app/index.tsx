import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SplashScreen() {
  const router = useRouter();

  // Simple auto-redirect placeholder simulation or manual button trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      // Directing to login as start point
      router.replace('/login');
    }, 2500);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <SafeAreaView className="flex-1 bg-slate-950 justify-between items-center py-12 px-6">
      <View />

      <View className="items-center">
        <View className="w-24 h-24 rounded-3xl bg-sky-500 items-center justify-center shadow-2xl shadow-sky-500/30 mb-6">
          <Text className="text-white text-4xl font-extrabold">SEC</Text>
        </View>
        <Text className="text-white text-3xl font-extrabold tracking-tight">SEC CRICKET CLUB</Text>
        <Text className="text-slate-400 text-sm mt-2 text-center max-w-[250px]">
          The ultimate platform for club members, match updates, and events.
        </Text>
      </View>

      <View className="items-center w-full space-y-6">
        <ActivityIndicator size="large" color="#0ea5e9" />
        <TouchableOpacity 
          onPress={() => router.replace('/login')}
          className="bg-slate-900 border border-slate-800 px-6 py-3 rounded-full mt-4"
        >
          <Text className="text-sky-400 font-semibold text-xs">Skip Splash Screen</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
