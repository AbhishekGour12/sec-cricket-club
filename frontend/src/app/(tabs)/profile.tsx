import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Radius, Shadows, ThemeIcon } from '@/theme';
import { Avatar } from '@/components/Avatar';
import { SectionHeader, Divider } from '@/components/Layout';
import { OutlineButton } from '@/components/Button';
import { AchievementsEditor } from '@/components/Profile/AchievementsEditor';
import {
  ContactLinksEditor,
  ContactLinksValue,
} from '@/components/Profile/ContactLinksEditor';
import { useAuth } from '../../hooks/useAuth';
import { useApprovalStore } from '../../store/approvalStore';
import { useProfileEditor } from '../../hooks/useProfileEditor';
import { useNetwork } from '../../hooks/useNetwork';
import type { Achievement, PrivacyField, PrivacySettings } from '../../services/authApi';
import { getMediaUrl } from '../../utils/mediaUrl';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[0-9\s-]{7,15}$/;

const DEFAULT_PRIVACY: PrivacySettings = {
  phone: 'all',
  alternate_phone: 'all',
  contact_email: 'all',
  instagram_url: 'all',
  facebook_url: 'all',
  linkedin_url: 'all',
  website: 'all',
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user, refetchUser } = useAuth();
  const { approvalStatus, fetchApprovalStatus } = useApprovalStore();
  const { saveProfile, isSaving } = useProfileEditor();
  const { bookmarkedIds } = useNetwork();

  const [isEditing, setIsEditing] = useState(false);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [privacy, setPrivacy] = useState<PrivacySettings>(DEFAULT_PRIVACY);
  const [links, setLinks] = useState<ContactLinksValue>({
    alternate_phone: '',
    contact_email: '',
    instagram_url: '',
    facebook_url: '',
    linkedin_url: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ContactLinksValue, string>>>({});

  // Pull the latest profile every time the tab is opened, so edits made by an
  // administrator show up without restarting the app.
  useFocusEffect(
    useCallback(() => {
      fetchApprovalStatus();
      if (!isEditing) refetchUser();
    }, [fetchApprovalStatus, refetchUser, isEditing]),
  );

  /** Seeds the editable working copy from the last saved profile. */
  const seedFromUser = () => {
    setAchievements(user?.achievements ?? []);
    setPrivacy({ ...DEFAULT_PRIVACY, ...(user?.privacy_settings ?? {}) });
    setLinks({
      alternate_phone: user?.alternate_phone ?? '',
      contact_email: user?.contact_email ?? '',
      instagram_url: user?.instagram_url ?? '',
      facebook_url: user?.facebook_url ?? '',
      linkedin_url: user?.linkedin_url ?? '',
    });
    setErrors({});
  };

  const handleStartEditing = () => {
    seedFromUser();
    setIsEditing(true);
  };

  const displayName = user?.full_name || 'Member';

  const badge = useMemo(() => {
    switch (approvalStatus) {
      case 'approved':
        return {
          text: 'Verified Member',
          bgColor: '#E8F5E9',
          textColor: '#2E7D32',
          borderColor: '#C8E6C9',
        };
      case 'rejected':
        return {
          text: 'Registration Rejected',
          bgColor: '#FFEBEE',
          textColor: '#C62828',
          borderColor: '#FFCDD2',
        };
      default:
        return {
          text: 'Pending Approval',
          bgColor: '#FFFDE7',
          textColor: '#F57F17',
          borderColor: '#FFF9C4',
        };
    }
  }, [approvalStatus]);

  const handleLinkChange = (field: keyof ContactLinksValue, next: string) => {
    setLinks((current) => ({ ...current, [field]: next }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handlePrivacyChange = (field: PrivacyField, next: 'all' | 'hidden') => {
    setPrivacy((current) => ({ ...current, [field]: next }));
  };

  const validate = (): boolean => {
    const nextErrors: Partial<Record<keyof ContactLinksValue, string>> = {};

    if (links.alternate_phone.trim() && !PHONE_PATTERN.test(links.alternate_phone.trim())) {
      nextErrors.alternate_phone = 'Enter a valid phone number.';
    }
    if (links.contact_email.trim() && !EMAIL_PATTERN.test(links.contact_email.trim())) {
      nextErrors.contact_email = 'Enter a valid email address.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      await saveProfile({
        alternate_phone: links.alternate_phone.trim(),
        contact_email: links.contact_email.trim(),
        instagram_url: links.instagram_url.trim(),
        facebook_url: links.facebook_url.trim(),
        linkedin_url: links.linkedin_url.trim(),
        achievements,
        privacy_settings: privacy,
      });
      setIsEditing(false);
      Alert.alert('Profile updated', 'Your contact details and accomplishments have been saved.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Please try again.';
      Alert.alert('Could not save', message);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    seedFromUser();
  };

  const savedLinks: { label: string; value?: string }[] = [
    { label: 'Primary Phone', value: user?.phone },
    { label: 'Alternate Phone', value: user?.alternate_phone },
    { label: 'Contact Email', value: user?.contact_email },
    { label: 'Website', value: user?.website },
    { label: 'Instagram', value: user?.instagram_url },
    { label: 'Facebook', value: user?.facebook_url },
    { label: 'LinkedIn', value: user?.linkedin_url },
  ];

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Profile Card Header */}
          <View style={styles.profileHeaderCard}>
            <Pressable
              onPress={() => router.push('/networks')}
              style={styles.networkButton}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`My network, ${bookmarkedIds.length} saved members`}
            >
              <ThemeIcon name="bookmark" size={20} color="#FFFFFF" />
              {bookmarkedIds.length > 0 && (
                <View style={styles.networkBadge}>
                  <Text style={styles.networkBadgeText}>{bookmarkedIds.length}</Text>
                </View>
              )}
            </Pressable>

            <Avatar
              name={displayName}
              size={88}
              imageUrl={getMediaUrl(user?.profile_image)}
              style={styles.avatarSpacing}
            />
            <Text style={styles.userName}>{displayName}</Text>
            <Text style={styles.userRole}>{user?.designation || 'Club Member'}</Text>
            <Text style={styles.memberSince}>Email: {user?.email}</Text>

            <View
              style={[
                styles.badgeContainer,
                { backgroundColor: badge.bgColor, borderColor: badge.borderColor },
              ]}
            >
              <Text style={[styles.badgeText, { color: badge.textColor }]}>{badge.text}</Text>
            </View>

            <Pressable
              onPress={() => router.push('/networks')}
              style={styles.networkLink}
              accessibilityRole="button"
            >
              <ThemeIcon name="bookmark" size={14} color={Colors.secondaryContainer} />
              <Text style={styles.networkLinkText}>
                View My Network ({bookmarkedIds.length})
              </Text>
              <ThemeIcon name="chevronRight" size={16} color={Colors.secondaryContainer} />
            </Pressable>
          </View>

          {/* Bio */}
          {!!user?.business_description && (
            <>
              <SectionHeader title="About" />
              <View style={styles.detailsCard}>
                <Text style={styles.bioText}>{user.business_description}</Text>
              </View>
            </>
          )}

          {/* Business & Location Details */}
          <SectionHeader title="Business Information" />
          <View style={styles.detailsCard}>
            <Text style={styles.detailsTitle}>{user?.business_name || 'No Business Listed'}</Text>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Category</Text>
              <Text style={styles.detailValue}>{user?.business_category || 'N/A'}</Text>
            </View>
            <Divider />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Address</Text>
              <Text style={styles.detailValue}>{user?.business_address || 'N/A'}</Text>
            </View>
            <Divider />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Location</Text>
              <Text style={styles.detailValue}>
                {[user?.city, user?.state, user?.country].filter(Boolean).join(', ') || 'N/A'}
              </Text>
            </View>
          </View>

          {/* Editable sections — title + Edit must share the row without clipping */}
          <View style={styles.editHeaderRow}>
            <Text style={styles.editHeaderTitle} numberOfLines={1}>
              Profile Details
            </Text>
            {!isEditing && (
              <Pressable
                onPress={handleStartEditing}
                style={styles.editTrigger}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Edit contact details and accomplishments"
              >
                <ThemeIcon name="edit" size={16} color={Colors.secondary} />
                <Text style={styles.editTriggerText}>Edit</Text>
              </Pressable>
            )}
          </View>

          {isEditing ? (
            <>
              <AchievementsEditor achievements={achievements} onChange={setAchievements} />
              <ContactLinksEditor
                primaryPhone={user?.phone}
                website={user?.website}
                value={links}
                privacy={privacy}
                errors={errors}
                onChange={handleLinkChange}
                onPrivacyChange={handlePrivacyChange}
              />

              <View style={styles.saveRow}>
                <Pressable
                  onPress={handleCancel}
                  disabled={isSaving}
                  style={styles.cancelBtn}
                  accessibilityRole="button"
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleSave}
                  disabled={isSaving}
                  style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
                  accessibilityRole="button"
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.saveBtnText}>Save Changes</Text>
                  )}
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <AchievementsEditor
                achievements={user?.achievements ?? []}
                onChange={() => {}}
                editable={false}
              />

              <View style={styles.detailsCard}>
                <Text style={styles.detailsTitle}>Contact &amp; Social Links</Text>
                {savedLinks.map((item, index) => (
                  <React.Fragment key={item.label}>
                    {index > 0 && <Divider />}
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{item.label}</Text>
                      <Text style={styles.detailValue} numberOfLines={1}>
                        {item.value || 'Not added'}
                      </Text>
                    </View>
                  </React.Fragment>
                ))}
              </View>
            </>
          )}

          <OutlineButton
            title="Edit Details & Uploads"
            onPress={() => router.push('/profile-completion')}
            style={styles.editButton}
          />
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
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingBottom: Spacing.massive,
  },
  profileHeaderCard: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    ...Shadows.md,
  },
  networkButton: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  networkBadge: {
    position: 'absolute',
    top: 4,
    right: 2,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  networkBadgeText: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  avatarSpacing: {
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 999,
  },
  userName: {
    ...Typography.heading,
    fontSize: 22,
    color: '#FFFFFF',
  },
  userRole: {
    ...Typography.caption,
    color: Colors.secondaryContainer,
    fontWeight: '700',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  memberSince: {
    ...Typography.caption,
    color: Colors.primaryContainer,
    fontSize: 11,
    marginTop: Spacing.xs,
  },
  badgeContainer: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.xl,
    borderWidth: 1,
  },
  badgeText: {
    ...Typography.caption,
    fontWeight: '900',
    fontSize: 11,
  },
  networkLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.lg,
    minHeight: 44,
    paddingHorizontal: Spacing.md,
  },
  networkLinkText: {
    ...Typography.caption,
    color: Colors.secondaryContainer,
    fontWeight: '800',
  },
  detailsCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  detailsTitle: {
    ...Typography.subHeading,
    fontSize: 16,
    color: Colors.primary,
    marginBottom: Spacing.md,
    fontWeight: '800',
  },
  bioText: {
    ...Typography.body,
    fontSize: 14,
    lineHeight: 21,
    color: Colors.text.secondary,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
  },
  detailLabel: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.text.secondary,
  },
  detailValue: {
    ...Typography.body,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text.primary,
    maxWidth: '60%',
    textAlign: 'right',
  },
  editHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: Spacing.md,
    gap: Spacing.sm,
  },
  editHeaderTitle: {
    ...Typography.heading,
    fontSize: 18,
    color: Colors.primary,
    flex: 1,
    flexShrink: 1,
  },
  editTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 44,
    paddingHorizontal: Spacing.sm,
    flexShrink: 0,
  },
  editTriggerText: {
    ...Typography.button,
    fontSize: 14,
    color: Colors.secondary,
  },
  saveRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  cancelBtn: {
    minHeight: 48,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(122, 133, 160, 0.35)',
  },
  cancelBtnText: {
    ...Typography.button,
    fontSize: 14,
    color: Colors.text.secondary,
  },
  saveBtn: {
    minHeight: 48,
    paddingHorizontal: Spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    backgroundColor: Colors.secondary,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    ...Typography.button,
    fontSize: 14,
    color: '#FFFFFF',
  },
  editButton: {
    height: 48,
    borderRadius: Radius.md,
    marginTop: Spacing.sm,
    borderColor: Colors.primary,
  },
});
