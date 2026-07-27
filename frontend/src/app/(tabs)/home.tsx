import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-slate-950">
      <ScrollView className="px-6 py-4" showsVerticalScrollIndicator={false}>
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider">Welcome Back</Text>
            <Text className="text-white text-2xl font-extrabold">John Doe</Text>
          </View>
          <View className="w-10 h-10 rounded-full bg-sky-500 items-center justify-center">
            <Text className="text-white font-bold text-sm">JD</Text>
          </View>
        </View>

        <View className="bg-sky-500 rounded-3xl p-6 mb-6 shadow-xl shadow-sky-500/20">
          <Text className="text-sky-100 text-xs font-bold uppercase tracking-widest">Next Club Match</Text>
          <Text className="text-white text-2xl font-extrabold mt-1">SEC vs Knights XI</Text>
          <Text className="text-sky-100 text-sm mt-1">Sunday, 30th July at 9:00 AM</Text>
          <View className="bg-white/20 h-[1] my-4" />
          <View className="flex-row justify-between">
            <View>
              <Text className="text-sky-100 text-[10px] font-bold uppercase">Location</Text>
              <Text className="text-white font-semibold text-xs mt-0.5">SEC Sports Ground</Text>
            </View>
            <TouchableOpacity className="bg-white px-4 py-2 rounded-xl items-center justify-center">
              <Text className="text-sky-600 font-bold text-xs">Set Reminder</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text className="text-slate-300 text-xs font-bold uppercase tracking-wider mb-3">Quick Navigation</Text>
        <View className="grid grid-cols-2 gap-4 mb-6">
          <View className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex-1">
            <Text className="text-lg">🏏</Text>
            <Text className="text-white font-bold text-sm mt-2">Active Matches</Text>
            <Text className="text-slate-500 text-[10px] mt-0.5">Track live scores</Text>
          </View>
          <View className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex-1">
            <Text className="text-lg">🏆</Text>
            <Text className="text-white font-bold text-sm mt-2">Standings</Text>
            <Text className="text-slate-500 text-[10px] mt-0.5">Club leaderboards</Text>
          </View>
        </View>

        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-slate-300 text-xs font-bold uppercase tracking-wider">Latest News</Text>
        </View>
        <View className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 mb-6">
          <View>
            <Text className="text-sky-400 text-[10px] font-bold uppercase">News Update</Text>
            <Text className="text-white font-bold text-sm mt-0.5">Annual Membership Renewals Open</Text>
            <Text className="text-slate-500 text-xs mt-1">Please make sure to renew your subscriptions before the upcoming league match.</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
