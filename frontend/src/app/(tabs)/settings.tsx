import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-slate-950">
      <ScrollView className="px-6 py-4" showsVerticalScrollIndicator={false}>
        <View className="mb-6">
          <Text className="text-white text-2xl font-extrabold tracking-tight">Settings</Text>
          <Text className="text-slate-400 text-xs mt-1">Configure your notification and account options.</Text>
        </View>

        <View className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-6 space-y-4">
          <View className="flex-row justify-between items-center py-2">
            <View>
              <Text className="text-white font-semibold text-sm">Push Notifications</Text>
              <Text className="text-slate-500 text-[10px] mt-0.5">Receive match updates and alerts</Text>
            </View>
            <Switch value={true} trackColor={{ false: '#334155', true: '#0ea5e9' }} />
          </View>

          <View className="h-[1] bg-slate-800" />

          <View className="flex-row justify-between items-center py-2">
            <View>
              <Text className="text-white font-semibold text-sm">Dark Mode</Text>
              <Text className="text-slate-500 text-[10px] mt-0.5">Toggle theme settings</Text>
            </View>
            <Switch value={true} trackColor={{ false: '#334155', true: '#0ea5e9' }} />
          </View>
        </View>

        <TouchableOpacity 
          onPress={() => router.replace('/login')}
          className="bg-rose-500/10 border border-rose-500/20 rounded-2xl py-4 items-center justify-center active:opacity-90"
        >
          <Text className="text-rose-400 font-extrabold text-sm">Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
