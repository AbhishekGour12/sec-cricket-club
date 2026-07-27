import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OTPScreen() {
  const router = useRouter();
  const { phone } = useLocalSearchParams();
  const [code, setCode] = useState('');

  const handleVerify = () => {
    if (code.trim().length === 6) {
      // Auto success login simulation, bypassing authentication
      router.replace('/(tabs)/home');
    } else {
      alert('Please enter a 6-digit OTP code');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView contentContainerClassName="flex-grow px-6 py-8 justify-between" className="flex-1">
          <View className="space-y-4">
            <Text className="text-white text-3xl font-extrabold tracking-tight">Verify Code</Text>
            <Text className="text-slate-400 text-sm">
              We sent a 6-digit confirmation code to <Text className="text-sky-400 font-semibold">+{phone || '91XXXXXXXX'}</Text>.
            </Text>
          </View>

          <View className="my-8 space-y-6">
            <View className="space-y-2">
              <Text className="text-slate-300 text-xs font-bold uppercase tracking-wider">Passcode (OTP)</Text>
              <View className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3">
                <TextInput
                  keyboardType="number-pad"
                  placeholder="Enter 6-digit OTP"
                  placeholderTextColor="#64748b"
                  value={code}
                  onChangeText={setCode}
                  className="text-white font-bold tracking-[8] text-center text-xl focus:outline-none"
                  maxLength={6}
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={handleVerify}
              className="bg-sky-500 rounded-2xl py-4 items-center justify-center shadow-lg shadow-sky-500/20 active:opacity-90"
            >
              <Text className="text-white font-extrabold text-base">Verify & Continue</Text>
            </TouchableOpacity>

            <View className="flex-row justify-center space-x-1 mt-2">
              <Text className="text-slate-400 text-xs">{"Didn't"} receive the code?</Text>
              <TouchableOpacity onPress={() => alert('OTP Resent')}>
                <Text className="text-sky-400 font-bold text-xs">Resend OTP</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className="items-center">
            <TouchableOpacity onPress={() => router.back()}>
              <Text className="text-slate-400 font-semibold text-xs">Back to phone number entry</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
