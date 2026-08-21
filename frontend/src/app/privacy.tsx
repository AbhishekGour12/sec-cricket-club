import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '@/theme';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function PrivacyPolicyScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
          <FontAwesome name="chevron-left" size={18} color={Colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Last Updated: August 2026</Text>

        <Text style={styles.sectionTitle}>1. Introduction</Text>
        <Text style={styles.paragraph}>
          Welcome to SEC Cricket Club. We value your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your data when you use our mobile application and related services.
        </Text>

        <Text style={styles.sectionTitle}>2. Information We Collect</Text>
        <Text style={styles.paragraph}>
          We collect information that you voluntarily provide to us when registering an account, updating your profile, or contacting club administration. This includes:
        </Text>
        <Text style={styles.bulletPoint}>• Personal Identifiers: Name, email address, phone number, and profile photograph.</Text>
        <Text style={styles.bulletPoint}>• Professional & Business Information: Business name, category, logo, flyers, and visiting cards.</Text>
        <Text style={styles.bulletPoint}>• Club Activity: Attendance in events, announcements read, and bookmarking preferences.</Text>

        <Text style={styles.sectionTitle}>3. How We Use Your Information</Text>
        <Text style={styles.paragraph}>
          Your information is used strictly to provide and improve SEC Cricket Club services, including:
        </Text>
        <Text style={styles.bulletPoint}>• Managing member verification and membership directory access.</Text>
        <Text style={styles.bulletPoint}>• Facilitating club networking and business directory features.</Text>
        <Text style={styles.bulletPoint}>• Sending real-time push notifications regarding club events and announcements.</Text>

        <Text style={styles.sectionTitle}>4. Data Sharing & Security</Text>
        <Text style={styles.paragraph}>
          We do not sell or rent your personal data to third parties. Member directory details are accessible only to verified, approved club members. We implement industry-standard encryption and secure token storage to protect your data.
        </Text>

        <Text style={styles.sectionTitle}>5. Contact Us</Text>
        <Text style={styles.paragraph}>
          If you have any questions or concerns regarding this Privacy Policy, please contact the SEC Cricket Club administration.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    ...Typography.heading,
    fontSize: 18,
    color: Colors.text.primary,
  },
  scrollContent: {
    padding: Spacing.xl,
  },
  lastUpdated: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.heading,
    fontSize: 16,
    color: Colors.text.primary,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  paragraph: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 22,
    marginBottom: Spacing.sm,
  },
  bulletPoint: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 22,
    marginLeft: Spacing.md,
    marginBottom: 4,
  },
});
