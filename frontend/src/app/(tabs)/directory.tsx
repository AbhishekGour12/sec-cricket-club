import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DirectoryScreen() {
  const members = [
    { name: 'John Doe', role: 'Club Administrator', status: 'Batsman' },
    { name: 'Alice Smith', role: 'Captain', status: 'All-rounder' },
    { name: 'Bob Johnson', role: 'Vice Captain', status: 'Bowler' },
  ];

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-slate-950">
      <ScrollView className="px-6 py-4" showsVerticalScrollIndicator={false}>
        <View className="mb-6">
          <Text className="text-white text-2xl font-extrabold tracking-tight">Members Directory</Text>
          <Text className="text-slate-400 text-xs mt-1">Connect with player profiles and roles.</Text>
        </View>

        <View className="space-y-3">
          {members.map((member, idx) => (
            <View key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex-row items-center justify-between">
              <View className="flex-row items-center space-x-3">
                <View className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 items-center justify-center">
                  <Text className="text-sky-400 font-bold">{member.name.split(' ').map(n => n[0]).join('')}</Text>
                </View>
                <View>
                  <Text className="text-white font-bold text-sm">{member.name}</Text>
                  <Text className="text-slate-500 text-[10px] font-semibold mt-0.5">{member.role}</Text>
                </View>
              </View>
              <View className="bg-sky-500/10 px-2.5 py-1 rounded-lg">
                <Text className="text-sky-400 text-[10px] font-bold uppercase">{member.status}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
