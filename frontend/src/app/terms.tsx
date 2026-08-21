import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing } from '@/theme';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function TermsOfServiceScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
          <FontAwesome name="chevron-left" size={18} color={Colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Last Updated: August 2026</Text>

        <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
        <Text style={styles.paragraph}>
          By accessing or using the SEC Cricket Club application, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not access or use the application.
        </Text>

        <Text style={styles.sectionTitle}>2. Membership & Verification</Text>
        <Text style={styles.paragraph}>
          Access to certain features of the app (such as event schedules, member directories, and announcements) requires account registration and administrator approval. SEC Cricket Club reserves the right to approve, reject, or revoke membership privileges at its discretion.
        </Text>

        <Text style={styles.sectionTitle}>3. Member Conduct</Text>
        <Text style={styles.paragraph}>
          Members agree to use the application respectfully and lawfully. You agree not to:
        </Text>
        <Text style={styles.bulletPoint}>• Upload false or misleading personal or business information.</Text>
        <Text style={styles.bulletPoint}>• Harass, abuse, or spam other members through the directory.</Text>
        <Text style={styles.bulletPoint}>• Misuse club logos, trademarks, or proprietary content.</Text>

        <Text style={styles.sectionTitle}>4. Content Rights & Accuracy</Text>
        <Text style={styles.paragraph}>
          All event schedules, announcements, and club assets provided within the application are property of SEC Cricket Club. While we strive to maintain accurate information, event schedules and details are subject to change by administration.
        </Text>

        <Text style={styles.sectionTitle}>5. Modifications & Termination</Text>
        <Text style={styles.paragraph}>
          SEC Cricket Club reserves the right to modify these terms or discontinue any aspect of the application at any time without prior notice.
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
