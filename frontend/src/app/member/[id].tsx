import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Redirect } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Colors, Typography, Spacing, Radius, Shadows, ThemeIcon, IconName } from '@/theme';
import { Avatar } from '@/components/Avatar';
import { LoadingComponent, EmptyState } from '@/components/States';
import { VisitingCardDisplay } from '@/components/Profile/VisitingCardDisplay';
import { BusinessFlyersGallery } from '@/components/Profile/BusinessFlyersGallery';
import { useApprovalStore } from '../../store/approvalStore';
import { useNetwork } from '../../hooks/useNetwork';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';
import { getMediaUrl } from '../../utils/mediaUrl';
import type { Member } from '../../hooks/useMembers';
import type { BusinessFlyer } from '../../store/businessFlyerStore';

interface MemberDetail extends Member {
  business_flyers?: BusinessFlyer[];
  created_at?: string;
}

interface ContactRow {
  label: string;
  value?: string | null;
  icon: IconName;
  linkable?: boolean;
}

export default function MemberProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const memberId = parseInt(String(id), 10);
  const validId = Number.isInteger(memberId) && memberId > 0;
  const { approvalStatus } = useApprovalStore();
  const { user: currentUser } = useAuth();
  const { isBookmarked, toggleBookmark, isTogglingBookmark } = useNetwork();

  const isOwnProfile = !!(currentUser?.id && validId && currentUser.id === memberId);

  const memberQuery = useQuery({
    queryKey: ['member', memberId],
    queryFn: async () => {
      const response = await api.get<{ member: MemberDetail }>(`/members/${memberId}`);
      return response.data.member;
    },
    enabled: validId && !isOwnProfile && approvalStatus === 'approved',
    staleTime: 60 * 1000,
  });

  const member = memberQuery.data;
  const flyers = member?.business_flyers ?? [];
  const saved = member ? isBookmarked(member.id) : false;

  const sectorLabel = useMemo(() => {
    const cat = member?.business_category?.trim();
    if (!cat) return null;
    return cat.toUpperCase();
  }, [member?.business_category]);

  const joinedLabel = useMemo(() => {
    if (!member?.created_at) return null;
    try {
      return new Date(member.created_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return null;
    }
  }, [member?.created_at]);

  const contactRows: ContactRow[] = useMemo(
    () => [
      { label: 'Email', value: member?.contact_email || member?.email, icon: 'email' },
      { label: 'Phone', value: member?.phone, icon: 'phone' },
      { label: 'Alternate Phone', value: member?.alternate_phone, icon: 'phone' },
      { label: 'Joined Club', value: joinedLabel, icon: 'calendar' },
      { label: 'Website', value: member?.website, icon: 'link', linkable: true },
      { label: 'Instagram', value: member?.instagram_url, icon: 'share', linkable: true },
      { label: 'Facebook', value: member?.facebook_url, icon: 'share', linkable: true },
      { label: 'LinkedIn', value: member?.linkedin_url, icon: 'work', linkable: true },
    ],
    [member, joinedLabel],
  );

  const openUrl = useCallback(async (url: string) => {
    const normalized =
      url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
    if (!/^https?:\/\//i.test(normalized)) return;
    const supported = await Linking.canOpenURL(normalized);
    if (supported) Linking.openURL(normalized);
  }, []);

  const handleCall = useCallback(() => {
    const phone = member?.phone || member?.alternate_phone;
    if (!phone) {
      Alert.alert('No phone number', 'This member has not shared a phone number.');
      return;
    }
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Unable to call', `Could not open the dialer for ${phone}.`);
    });
  }, [member]);

  const handleWhatsApp = useCallback(() => {
    const phone = (member?.phone || member?.alternate_phone || '').replace(/[^\d+]/g, '');
    if (!phone) {
      Alert.alert('No phone number', 'This member has not shared a phone number.');
      return;
    }
    const digits = phone.replace(/^\+/, '');
    Linking.openURL(`https://wa.me/${digits}`).catch(() => {
      Alert.alert('Unable to open WhatsApp', 'Please try again.');
    });
  }, [member]);

  const handleEmail = useCallback(() => {
    const email = member?.contact_email || member?.email;
    if (!email) {
      Alert.alert('No email', 'This member has not shared an email address.');
      return;
    }
    Linking.openURL(`mailto:${email}`).catch(() => {
      Alert.alert('Unable to email', 'Please try again.');
    });
  }, [member]);

  const handleToggleBookmark = useCallback(async () => {
    if (!member) return;
    try {
      await toggleBookmark(member.id, saved);
    } catch {
      Alert.alert('Could not update', 'Please check your connection and try again.');
    }
  }, [member, saved, toggleBookmark]);

  if (approvalStatus !== 'approved') {
    return <Redirect href="/(tabs)/home" />;
  }

  if (!validId) {
    return <Redirect href="/(tabs)/directory" />;
  }

  // Own profile belongs on the Profile tab, not the public member page.
  if (isOwnProfile) {
    return <Redirect href="/(tabs)/profile" />;
  }

  const renderBody = () => {
    if (memberQuery.isLoading) {
      return <LoadingComponent message="Loading member profile..." />;
    }

    if (memberQuery.error || !member) {
      return (
        <EmptyState
          title="Member not found"
          description="This profile is unavailable or no longer active."
          icon="error"
          actionLabel="Back to Directory"
          onActionPress={() => router.back()}
        />
      );
    }

    const visibleContacts = contactRows.filter((row) => !!row.value);

    return (
      <>
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            {sectorLabel ? (
              <View style={styles.sectorBadge}>
                <Text style={styles.sectorText} numberOfLines={1}>
                  {sectorLabel}
                </Text>
              </View>
            ) : (
              <View />
            )}
            <Pressable
              onPress={() => router.back()}
              hitSlop={10}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Close member profile"
            >
              <ThemeIcon name="close" size={24} color={Colors.text.primary} />
            </Pressable>
          </View>

          <Avatar
            name={member.full_name || 'Member'}
            size={88}
            imageUrl={getMediaUrl(member.profile_image)}
            style={styles.avatar}
          />
          <Text style={styles.name}>{member.full_name || 'Member'}</Text>
          {!!member.business_name && (
            <Text style={styles.business}>{member.business_name}</Text>
          )}
          <View style={styles.statusRow}>
            <ThemeIcon name="check" size={16} color={Colors.secondary} />
            <Text style={styles.statusText}>{member.designation || 'Active Player'}</Text>
          </View>

          <Pressable
            onPress={handleToggleBookmark}
            disabled={isTogglingBookmark}
            style={styles.bookmarkBtn}
            accessibilityRole="button"
          >
            <ThemeIcon
              name={saved ? 'bookmark' : 'bookmarkBorder'}
              size={18}
              color={saved ? Colors.secondary : Colors.text.outline}
            />
            <Text style={[styles.bookmarkText, saved && { color: Colors.secondary }]}>
              {saved ? 'Saved to Network' : 'Save to Network'}
            </Text>
          </Pressable>
        </View>

        <VisitingCardDisplay visitingCard={member.visiting_card} />

        <BusinessFlyersGallery flyers={flyers} />

        {!!member.business_description && (
          <View style={styles.block}>
            <Text style={styles.blockTitle}>Biography</Text>
            <View style={styles.panel}>
              <Text style={styles.bioText}>{member.business_description}</Text>
            </View>
          </View>
        )}

        <View style={styles.block}>
          <Text style={styles.blockTitle}>Business Information</Text>
          <View style={styles.panel}>
            <DetailRow label="Business" value={member.business_name} />
            <DetailRow label="Category" value={member.business_category} />
            <DetailRow label="Address" value={member.business_address} />
            <DetailRow
              label="Location"
              value={[member.city, member.state, member.country].filter(Boolean).join(', ')}
              last
            />
          </View>
        </View>

        {(member.achievements?.length ?? 0) > 0 && (
          <View style={styles.block}>
            <View style={styles.blockTitleRow}>
              <ThemeIcon name="trophy" size={16} color={Colors.secondary} />
              <Text style={[styles.blockTitle, styles.blockTitleInline]}>
                Club Accomplishments & Awards
              </Text>
            </View>
            <View style={styles.panel}>
              {member.achievements!.map((ach, i) => (
                <View
                  key={ach.id}
                  style={[
                    styles.achievementRow,
                    i < member.achievements!.length - 1 && styles.achievementBorder,
                  ]}
                >
                  <ThemeIcon name="star" size={16} color={Colors.secondary} />
                  <View style={styles.achievementText}>
                    <Text style={styles.achievementTitle}>{ach.title}</Text>
                    {!!ach.year && <Text style={styles.achievementYear}>{ach.year}</Text>}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.block}>
          <Text style={styles.blockTitle}>Contact & Dossier Details</Text>
          <View style={styles.panel}>
            {visibleContacts.map((row, index) => (
              <Pressable
                key={row.label}
                style={[
                  styles.contactRow,
                  index < visibleContacts.length - 1 && styles.contactBorder,
                ]}
                onPress={() => {
                  if (row.linkable && row.value) openUrl(String(row.value));
                }}
                disabled={!row.linkable}
              >
                <View style={styles.contactLeft}>
                  <ThemeIcon name={row.icon} size={16} color={Colors.text.outline} />
                  <Text style={styles.contactLabel}>{row.label}</Text>
                </View>
                <Text style={styles.contactValue} numberOfLines={1}>
                  {row.value}
                </Text>
              </Pressable>
            ))}
            {visibleContacts.length === 0 && (
              <Text style={styles.emptyHint}>No contact details shared</Text>
            )}
          </View>
        </View>

        <View style={styles.actions}>
          <ActionTile icon="phone" label="Call" onPress={handleCall} />
          <ActionTile icon="share" label="WhatsApp" onPress={handleWhatsApp} />
          <ActionTile icon="email" label="Email" onPress={handleEmail} />
        </View>
      </>
    );
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={memberQuery.isRefetching && !memberQuery.isLoading}
            onRefresh={() => memberQuery.refetch()}
          />
        }
      >
        {renderBody()}
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({
  label,
  value,
  last,
}: {
  label: string;
  value?: string | null;
  last?: boolean;
}) {
  return (
    <View style={[styles.detailRow, !last && styles.detailBorder]}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value || 'N/A'}</Text>
    </View>
  );
}

function ActionTile({
  icon,
  label,
  onPress,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.actionTile} onPress={onPress} accessibilityRole="button">
      <ThemeIcon name={icon} size={22} color={Colors.primary} />
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  scroll: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.massive,
  },
  headerCard: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: Spacing.md,
  },
  sectorBadge: {
    backgroundColor: Colors.primaryContainer,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.xl,
    maxWidth: '70%',
  },
  sectorText: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.4,
  },
  closeBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    marginBottom: Spacing.md,
  },
  name: {
    ...Typography.heading,
    fontSize: 22,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  business: {
    ...Typography.body,
    color: Colors.text.outline,
    marginTop: 4,
    textAlign: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.sm,
  },
  statusText: {
    ...Typography.caption,
    fontWeight: '900',
    color: Colors.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  bookmarkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.md,
    minHeight: 44,
    paddingHorizontal: Spacing.md,
  },
  bookmarkText: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.text.outline,
  },
  block: {
    marginBottom: Spacing.lg,
  },
  blockTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.md,
  },
  blockTitle: {
    ...Typography.heading,
    fontSize: 13,
    color: Colors.text.outline,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '800',
    marginBottom: Spacing.md,
  },
  blockTitleInline: {
    marginBottom: 0,
  },
  panel: {
    backgroundColor: Colors.background,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  bioText: {
    ...Typography.body,
    fontSize: 14,
    lineHeight: 22,
    color: Colors.text.secondary,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  detailBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(122, 133, 160, 0.25)',
  },
  detailLabel: {
    ...Typography.caption,
    color: Colors.text.outline,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  detailValue: {
    ...Typography.body,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text.primary,
    maxWidth: '60%',
    textAlign: 'right',
  },
  achievementRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  achievementBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(122, 133, 160, 0.25)',
  },
  achievementText: {
    flex: 1,
  },
  achievementTitle: {
    ...Typography.body,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  achievementYear: {
    ...Typography.caption,
    color: Colors.text.outline,
    marginTop: 2,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  contactBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(122, 133, 160, 0.25)',
  },
  contactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactLabel: {
    ...Typography.caption,
    color: Colors.text.outline,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  contactValue: {
    ...Typography.body,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text.primary,
    maxWidth: '55%',
    textAlign: 'right',
  },
  emptyHint: {
    ...Typography.caption,
    color: Colors.text.outline,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  actionTile: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    ...Shadows.sm,
  },
  actionLabel: {
    ...Typography.caption,
    fontWeight: '800',
    color: Colors.primary,
    textTransform: 'uppercase',
    fontSize: 11,
  },
});
