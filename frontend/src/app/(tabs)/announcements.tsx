import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AnnouncementsScreen() {
  const posts = [
    { title: 'New Jersey Sponsorship Partner', text: 'We are thrilled to welcome our new principal jersey sponsor for the 2026 season.', date: '2 hours ago' },
    { title: 'Training Cancelled Due to Weather', text: 'Due to heavy monsoon showers, training scheduled for this afternoon is cancelled.', date: '1 day ago' },
  ];

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-slate-950">
      <ScrollView className="px-6 py-4" showsVerticalScrollIndicator={false}>
        <View className="mb-6">
          <Text className="text-white text-2xl font-extrabold tracking-tight">Announcements</Text>
          <Text className="text-slate-400 text-xs mt-1">Stay updated with official SEC alerts.</Text>
        </View>

        <View className="space-y-4">
          {posts.map((post, idx) => (
            <View key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <View className="flex-row justify-between items-center">
                <Text className="text-slate-500 text-[10px] font-semibold">{post.date}</Text>
              </View>
              <Text className="text-white font-bold text-base mt-2">{post.title}</Text>
              <Text className="text-slate-400 text-xs mt-2 leading-5">{post.text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
