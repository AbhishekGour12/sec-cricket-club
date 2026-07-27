import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');

  const handleRequestOTP = () => {
    // Basic verification placeholder
    if (phoneNumber.trim().length >= 8) {
      router.push({
        pathname: '/otp',
        params: { phone: phoneNumber }
      });
    } else {
      alert('Please enter a valid phone number');
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
            <Text className="text-white text-3xl font-extrabold tracking-tight">Welcome Back</Text>
            <Text className="text-slate-400 text-sm">
              Enter your mobile number to receive a secure one-time passcode.
            </Text>
          </View>

          <View className="my-8 space-y-5">
            <View className="space-y-2">
              <Text className="text-slate-300 text-xs font-bold uppercase tracking-wider">Mobile Number</Text>
              <View className="bg-slate-900 border border-slate-800 rounded-2xl flex-row items-center px-4 py-3">
                <Text className="text-slate-400 font-semibold mr-2">+91</Text>
                <TextInput
                  keyboardType="phone-pad"
                  placeholder="Enter 10-digit number"
                  placeholderTextColor="#64748b"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  className="text-white font-medium flex-1 text-base focus:outline-none"
                  maxLength={10}
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={handleRequestOTP}
              className="bg-sky-500 rounded-2xl py-4 items-center justify-center shadow-lg shadow-sky-500/20 active:opacity-90"
            >
              <Text className="text-white font-extrabold text-base">Request OTP</Text>
            </TouchableOpacity>
          </View>

          <View className="items-center">
            <Text className="text-slate-500 text-xs text-center">
              By continuing, you agree to the SEC Cricket Club Terms of Service and Privacy Policy.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
