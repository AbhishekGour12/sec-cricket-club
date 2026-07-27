import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-slate-950">
      <ScrollView className="px-6 py-4" showsVerticalScrollIndicator={false}>
        <View className="items-center py-6 border-b border-slate-800">
          <View className="w-24 h-24 rounded-full bg-sky-500 items-center justify-center mb-4">
            <Text className="text-white text-3xl font-extrabold">JD</Text>
          </View>
          <Text className="text-white text-xl font-extrabold">John Doe</Text>
          <Text className="text-sky-400 text-xs mt-1 font-semibold uppercase">Batsman • Right-Handed</Text>
        </View>

        <View className="py-6 space-y-4">
          <Text className="text-slate-300 text-xs font-bold uppercase tracking-wider mb-2">Matches & Performance</Text>
          <View className="flex-row justify-between bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <View className="items-center flex-1">
              <Text className="text-slate-500 text-[10px] font-bold uppercase">Matches</Text>
              <Text className="text-white text-lg font-extrabold mt-1">28</Text>
            </View>
            <View className="w-[1] bg-slate-800 h-10" />
            <View className="items-center flex-1">
              <Text className="text-slate-500 text-[10px] font-bold uppercase">Runs</Text>
              <Text className="text-white text-lg font-extrabold mt-1">742</Text>
            </View>
            <View className="w-[1] bg-slate-800 h-10" />
            <View className="items-center flex-1">
              <Text className="text-slate-500 text-[10px] font-bold uppercase">Avg</Text>
              <Text className="text-white text-lg font-extrabold mt-1">32.4</Text>
            </View>
          </View>
        </View>

        <View className="space-y-3">
          <TouchableOpacity className="bg-slate-900 border border-slate-800 rounded-xl py-3 items-center">
            <Text className="text-slate-300 font-semibold text-xs">Edit Personal Details</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
