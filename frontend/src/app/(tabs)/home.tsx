import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Radius, Shadows, ThemeIcon } from '@/theme';
import { Avatar } from '@/components/Avatar';
import { SectionHeader, Divider } from '@/components/Layout';
import { AnnouncementCard } from '@/components/Card';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';
import { useApprovalStore } from '../../store/approvalStore';
import { useProfileStore } from '../../store/profileStore';
import {
  calculateProfileCompletion,
  getNextProfileAction,
  mergeProfileCompletionFields,
} from '../../utils/profileCompletion';
import { getMediaUrl } from '../../utils/mediaUrl';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { approvalStatus, rejectedReason, fetchApprovalStatus } = useApprovalStore();
  const profileDraft = useProfileStore((state) => state.formData);
  const effectiveProfile = mergeProfileCompletionFields(user, profileDraft);

  useEffect(() => {
    // Seed from the user object immediately so there's no flicker —
    // then confirm with a real API call in the background.
    if (user?.approval_status) {
      useApprovalStore.getState().setApprovalStatus(user.approval_status);
    }
    fetchApprovalStatus();
  }, []);

  const handleResubmit = async () => {
    if (!user) return;
    try {
      await api.post(`/admin/member/${user.id}/resubmit`);
      alert('Your registration has been resubmitted successfully!');
      fetchApprovalStatus();
    } catch (err) {
      alert('Failed to resubmit. Please try again.');
    }
  };

  const handleRequestApproval = async () => {
    try {
      const response = await api.post('/me/request-approval');
      alert(response.data.message || 'Approval request submitted to the administrator successfully.');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit approval request.');
    }
  };

  // Returns a colour that shifts from red → amber → green as % rises
  const getCompletenessColor = (pct: number): string => {
    if (pct < 40) return '#D32F2F';
    if (pct < 70) return '#F57F17';
    return '#2E7D32';
  };

  const displayName = user?.full_name || 'Member';

  // Shared profile completeness banner. The backend completion flag is
  // authoritative; percentage is only guidance while a profile is incomplete.
  const renderCompletenessCard = () => {
    if (!user || user.is_profile_completed) return null;
    const pct = calculateProfileCompletion(effectiveProfile);
    if (pct >= 100) return null;
    const barColor = getCompletenessColor(pct);
    const nextStep = getNextProfileAction(effectiveProfile);
    return (
      <View style={[styles.completenessCard, { borderLeftWidth: 4, borderLeftColor: barColor }]}>
        <View style={styles.completenessHeader}>
          <View style={[styles.completenessIconBg, { backgroundColor: `${barColor}18` }]}>
            <ThemeIcon name="star" size={22} color={barColor} />
          </View>
          <View style={styles.completenessTextCol}>
            <Text style={styles.completenessTitle}>Profile Incomplete</Text>
            <Text style={styles.completenessSubtitle}>{nextStep}</Text>
          </View>
          <Text style={[styles.completenessPercent, { color: barColor }]}>{pct}%</Text>
        </View>

        <View style={styles.completenessTrack}>
          <View
            style={[
              styles.completenessFill,
              { width: `${pct}%` as any, backgroundColor: barColor },
            ]}
          />
        </View>

        <Pressable
          style={[styles.completeProfileBtn, { backgroundColor: barColor }]}
          onPress={() => router.push('/profile-completion')}
        >
          <Text style={styles.completeProfileBtnText}>COMPLETE PROFILE</Text>
          <ThemeIcon name="chevronRight" size={16} color="#FFFFFF" style={styles.btnChevron} />
        </Pressable>
      </View>
    );
  };

  if (approvalStatus === null) {
    // Status not yet confirmed from server — show a minimal spinner
    // so we never flash a false "pending" screen to an approved user.
    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (approvalStatus === 'pending') {
    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.statusCard}>
            <View style={[styles.statusIconCircle, { backgroundColor: '#FFF9C4' }]}>
              <ThemeIcon name="star" size={32} color="#F57F17" />
            </View>
            <Text style={styles.statusTitle}>Waiting for Admin Approval</Text>
            <Text style={styles.statusDesc}>
              Your account is pending approval. You can complete your profile now — the admin will review and activate your account shortly.
            </Text>

            <View style={styles.statusButtonGroup}>
              <Pressable
                style={[styles.statusButton, styles.primaryBtn]}
                onPress={() => router.push('/(tabs)/profile')}
              >
                <Text style={styles.primaryBtnText}>EDIT PROFILE</Text>
              </Pressable>

              <Pressable
                style={[styles.statusButton, { backgroundColor: '#0288D1' }]}
                onPress={handleRequestApproval}
              >
                <Text style={styles.primaryBtnText}>REQUEST ADMIN APPROVAL</Text>
              </Pressable>

              <Pressable
                style={[styles.statusButton, styles.secondaryBtn]}
                onPress={() => fetchApprovalStatus()}
              >
                <Text style={styles.secondaryBtnText}>REFRESH STATUS</Text>
              </Pressable>
            </View>
          </View>

          {/* Profile completeness badge visible even while awaiting approval */}
          {renderCompletenessCard()}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (approvalStatus === 'rejected') {
    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.statusCard}>
            <View style={[styles.statusIconCircle, { backgroundColor: '#FFCDD2' }]}>
              <ThemeIcon name="close" size={32} color="#D32F2F" />
            </View>
            <Text style={styles.statusTitle}>Registration Rejected</Text>

            {rejectedReason ? (
              <View style={styles.reasonContainer}>
                <Text style={styles.reasonLabel}>REASON FROM ADMINISTRATOR:</Text>
                <Text style={styles.reasonText}>{rejectedReason}</Text>
              </View>
            ) : null}

            <Text style={styles.statusDesc}>
              Please review the feedback above, edit your profile details, and tap Resubmit below to try again.
            </Text>

            <View style={styles.statusButtonGroup}>
              <Pressable
                style={[styles.statusButton, styles.primaryBtn]}
                onPress={() => router.push('/(tabs)/profile')}
              >
                <Text style={styles.primaryBtnText}>EDIT PROFILE</Text>
              </Pressable>

              <Pressable
                style={[styles.statusButton, styles.resubmitBtn]}
                onPress={handleResubmit}
              >
                <Text style={styles.primaryBtnText}>RESUBMIT APPLICATION</Text>
              </Pressable>
            </View>
          </View>

          {/* Profile completeness badge on rejection screen too */}
          {renderCompletenessCard()}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Greeting */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Welcome Back</Text>
            <Text style={styles.userName}>{displayName}</Text>
          </View>
          <Pressable onPress={() => router.push('/(tabs)/profile')}>
            <Avatar name={displayName} imageUrl={getMediaUrl(user?.profile_image)} size={48} status="active" />
          </Pressable>
        </View>

        {/* Profile completeness badge for approved members who haven't finished their profile */}
        {renderCompletenessCard()}

        {/* Featured Next Club Match Widget */}
        <View style={styles.featuredCard}>
          <View style={styles.featuredBadge}>
            <ThemeIcon name="sports" size={14} color="#FFFFFF" style={styles.badgeIcon} />
            <Text style={styles.featuredBadgeText}>Next Club Match</Text>
          </View>
          <Text style={styles.featuredMatchName}>SEC vs Knights XI</Text>
          <Text style={styles.featuredMatchTime}>Sunday, 30th July at 9:00 AM</Text>
          
          <Divider style={styles.featuredDivider} />
          
          <View style={styles.featuredFooter}>
            <View>
              <Text style={styles.footerLabel}>Location</Text>
              <Text style={styles.footerValue}>SEC Sports Ground</Text>
            </View>
            <Pressable
              style={styles.reminderButton}
              onPress={() => alert('Reminder Set')}
            >
              <Text style={styles.reminderButtonText}>Set Reminder</Text>
            </Pressable>
          </View>
        </View>

        {/* Quick Navigation Section */}
        <SectionHeader title="Quick Navigation" />
        <View style={styles.quickNavRow}>
          <Pressable
            style={styles.quickNavCard}
            onPress={() => router.push('/(tabs)/events')}
          >
            <View style={[styles.quickNavIconContainer, { backgroundColor: Colors.primaryContainer }]}>
              <ThemeIcon name="sports" size={24} color={Colors.primary} />
            </View>
            <Text style={styles.quickNavTitle}>Active Matches</Text>
            <Text style={styles.quickNavSubtitle}>Track live scores</Text>
          </Pressable>

          <Pressable
            style={styles.quickNavCard}
            onPress={() => router.push('/(tabs)/directory')}
          >
            <View style={[styles.quickNavIconContainer, { backgroundColor: 'rgba(196, 18, 48, 0.1)' }]}>
              <ThemeIcon name="directory" size={24} color={Colors.secondary} />
            </View>
            <Text style={styles.quickNavTitle}>Directory</Text>
            <Text style={styles.quickNavSubtitle}>Club members</Text>
          </Pressable>
        </View>

        {/* Latest News Announcement */}
        <SectionHeader
          title="Latest News"
          actionLabel="View All"
          onActionPress={() => router.push('/(tabs)/announcements')}
        />
        <AnnouncementCard
          title="Annual Membership Renewals Open"
          content="Please make sure to renew your subscriptions before the upcoming league match on next Sunday. Forms and payment details are available at the clubhouse or under Settings."
          date="July 28, 2026"
          author="Admin Team"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  welcomeText: {
    ...Typography.caption,
    color: Colors.text.secondary,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  userName: {
    ...Typography.heading,
    color: Colors.text.primary,
    fontSize: 24,
  },
  completenessCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(122, 133, 160, 0.12)',
    ...Shadows.sm,
  },
  completenessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  completenessIconBg: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(196, 18, 48, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completenessTextCol: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  completenessTitle: {
    ...Typography.body,
    fontWeight: '800',
    color: Colors.text.primary,
  },
  completenessSubtitle: {
    ...Typography.caption,
    color: Colors.text.outline,
    marginTop: 2,
    fontWeight: '600',
  },
  completenessPercent: {
    ...Typography.heading,
    fontSize: 20,
    color: Colors.secondary,
    fontWeight: '900',
  },
  completenessTrack: {
    height: 6,
    backgroundColor: 'rgba(122, 133, 160, 0.15)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  completenessFill: {
    height: '100%',
    backgroundColor: Colors.secondary,
    borderRadius: 3,
  },
  completeProfileBtn: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    height: 48,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeProfileBtnText: {
    ...Typography.button,
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  btnChevron: {
    marginLeft: 6,
  },
  featuredCard: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    ...Shadows.md,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondary,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.xl,
    marginBottom: Spacing.sm,
  },
  badgeIcon: {
    marginRight: Spacing.xs,
  },
  featuredBadgeText: {
    ...Typography.caption,
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  featuredMatchName: {
    ...Typography.heading,
    fontSize: 24,
    color: '#FFFFFF',
  },
  featuredMatchTime: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.primaryContainer,
    marginTop: Spacing.xs,
  },
  featuredDivider: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginVertical: Spacing.md,
  },
  featuredFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLabel: {
    ...Typography.caption,
    color: Colors.primaryContainer,
    fontWeight: '700',
  },
  footerValue: {
    ...Typography.body,
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  reminderButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
  },
  reminderButtonText: {
    ...Typography.button,
    color: Colors.primary,
    fontSize: 12,
  },
  quickNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  quickNavCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    marginHorizontal: Spacing.xs,
    ...Shadows.sm,
  },
  quickNavIconContainer: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  quickNavTitle: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  quickNavSubtitle: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    width: '100%',
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
    ...Shadows.md,
  },
  statusIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  statusTitle: {
    ...Typography.heading,
    fontSize: 20,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  statusDesc: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  statusButtonGroup: {
    width: '100%',
    gap: Spacing.md,
  },
  statusButton: {
    height: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
  },
  primaryBtnText: {
    ...Typography.button,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  secondaryBtn: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  secondaryBtnText: {
    ...Typography.button,
    color: Colors.primary,
    fontWeight: '800',
  },
  resubmitBtn: {
    backgroundColor: Colors.secondary,
  },
  reasonContainer: {
    width: '100%',
    backgroundColor: '#FFF8F8',
    borderColor: '#FFCDD2',
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  reasonLabel: {
    ...Typography.caption,
    color: '#C62828',
    fontWeight: '900',
    fontSize: 10,
    marginBottom: 4,
  },
  reasonText: {
    ...Typography.body,
    color: '#C62828',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
});
