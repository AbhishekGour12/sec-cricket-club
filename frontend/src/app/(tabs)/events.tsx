import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EventsScreen() {
  const events = [
    { title: 'Weekend Practice Match', date: 'Jul 29, 2026', time: '7:00 AM', type: 'Practice' },
    { title: 'SEC Club League Round 1', date: 'Aug 02, 2026', time: '9:00 AM', type: 'League' },
    { title: 'Monsoon Charity Cup', date: 'Aug 15, 2026', time: '10:00 AM', type: 'Tournament' },
  ];

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-slate-950">
      <ScrollView className="px-6 py-4" showsVerticalScrollIndicator={false}>
        <View className="mb-6">
          <Text className="text-white text-2xl font-extrabold tracking-tight">Club Events</Text>
          <Text className="text-slate-400 text-xs mt-1">Register for matches and social events.</Text>
        </View>

        <View className="space-y-4">
          {events.map((evt, idx) => (
            <View key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <View className="flex-row justify-between items-center">
                <View className="bg-sky-500/10 border border-sky-500/20 px-2.5 py-0.5 rounded-full">
                  <Text className="text-sky-400 text-[10px] font-bold uppercase">{evt.type}</Text>
                </View>
                <Text className="text-slate-500 text-[10px] font-semibold">{evt.date}</Text>
              </View>
              <Text className="text-white font-bold text-base mt-2.5">{evt.title}</Text>
              <Text className="text-slate-400 text-xs mt-1">Time: {evt.time} | SEC Stadium</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
