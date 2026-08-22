import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius, ThemeConstants } from '@/theme';
import { Input } from '@/components/Input';
import { PrimaryButton } from '@/components/Button';
import { useToast } from '@/components/Toast';

export default function OTPScreen() {
  const router = useRouter();
  const toast = useToast();
  const { phone } = useLocalSearchParams();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleVerify = () => {
    setError('');
    const trimmedCode = code.trim();
    if (trimmedCode.length === 6 && /^\d+$/.test(trimmedCode)) {
      router.replace('/(tabs)/home');
    } else {
      setError('Please enter a valid 6-digit OTP passcode');
    }
  };

  const handleResend = () => {
    toast.showSuccess('OTP Sent', `A new OTP has been sent to +${phone || '91XXXXXXXXX'}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={ThemeConstants.isIOS ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerSection}>
            <Text style={styles.titleText}>Verify Code</Text>
            <Text style={styles.subtitleText}>
              We sent a 6-digit confirmation code to{' '}
              <Text style={styles.phoneAccent}>+{phone || '91XXXXXXXXX'}</Text>.
            </Text>
          </View>

          <View style={styles.formSection}>
            <Input
              label="Passcode (OTP)"
              keyboardType="number-pad"
              placeholder="• • • • • •"
              value={code}
              onChangeText={(text) => {
                setCode(text.replace(/[^0-9]/g, ''));
                if (error) setError('');
              }}
              maxLength={6}
              leftIcon="lock"
              error={error}
              inputStyle={styles.otpInput}
            />

            <PrimaryButton
              title="Verify & Continue"
              onPress={handleVerify}
              style={styles.submitButton}
            />

            <View style={styles.resendRow}>
              <Text style={styles.resendText}>{"Didn't"} receive the code? </Text>
              <Pressable onPress={handleResend}>
                <Text style={styles.resendAction}>Resend OTP</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.footerSection}>
            <Pressable onPress={() => router.back()}>
              <Text style={styles.backLink}>Back to phone number entry</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.massive,
    justifyContent: 'space-between',
  },
  headerSection: {
    marginTop: Spacing.xl,
  },
  titleText: {
    ...Typography.heading,
    color: Colors.text.primary,
    fontSize: 32,
    fontWeight: '900',
  },
  subtitleText: {
    ...Typography.body,
    fontSize: 15,
    color: Colors.text.secondary,
    marginTop: Spacing.sm,
    lineHeight: 22,
  },
  phoneAccent: {
    color: Colors.secondary,
    fontWeight: '700',
  },
  formSection: {
    marginVertical: Spacing.huge,
  },
  otpInput: {
    fontSize: 20,
    letterSpacing: 8,
    fontWeight: '700',
  },
  submitButton: {
    marginTop: Spacing.lg,
    height: 52,
    borderRadius: Radius.md,
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.md,
  },
  resendText: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  resendAction: {
    ...Typography.caption,
    color: Colors.secondary,
    fontWeight: '700',
  },
  footerSection: {
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  backLink: {
    ...Typography.caption,
    color: Colors.text.outline,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
