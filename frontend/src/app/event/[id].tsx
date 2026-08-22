import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Linking,
  Alert,
  RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Redirect } from 'expo-router';
import { Colors, Typography, Spacing, Radius, Shadows, ThemeIcon } from '@/theme';
import { LoadingComponent, EmptyState } from '@/components/States';
import { SectionHeader } from '@/components/Layout';
import { useEventDetail } from '../../hooks/useEvents';
import { useApprovalStore } from '../../store/approvalStore';
import { getMediaUrl } from '../../utils/mediaUrl';
import type { EventSponsor, SponsorTier } from '../../store/eventStore';

const formatDate = (value?: string | null) => {
  if (!value) return '';
  try {
    const d = new Date(`${value}T00:00:00`);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString(undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return value || '';
  }
};

const formatTime = (value?: string | null) => {
  if (!value) return '';
  const match = value.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return value;
  let hour = Number(match[1]);
  const minute = match[2];
  const period = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12;
  return `${hour}:${minute} ${period}`;
};

import { useToast } from '@/components/Toast';

const TIER_ORDER: SponsorTier[] = ['Title Sponsor', 'Co-Sponsor', 'Associate Sponsor'];

async function openExternalUrl(url: string, showErrorToast?: (msg: string) => void) {
  const normalized =
    url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
  if (!/^https?:\/\//i.test(normalized)) return;
  const supported = await Linking.canOpenURL(normalized);
  if (supported) Linking.openURL(normalized);
  else {
    if (showErrorToast) showErrorToast('Could not open link.');
    else Alert.alert('Unable to open link');
  }
}

export default function EventDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const eventId = parseInt(String(id), 10);
  const validId = Number.isInteger(eventId) && eventId > 0;
  const { approvalStatus } = useApprovalStore();
  const { data: event, isLoading, error, refetch, isRefetching } = useEventDetail(
    validId ? eventId : undefined,
  );

  const coverUri = useMemo(() => getMediaUrl(event?.event_image), [event?.event_image]);

  const sponsorsByTier = useMemo(() => {
    const groups: Record<SponsorTier, EventSponsor[]> = {
      'Title Sponsor': [],
      'Co-Sponsor': [],
      'Associate Sponsor': [],
    };
    (event?.sponsors || []).forEach((s) => {
      if (groups[s.tier]) groups[s.tier].push(s);
    });
    return groups;
  }, [event?.sponsors]);

  if (approvalStatus !== 'approved') {
    return <Redirect href="/(tabs)/home" />;
  }

  if (!validId) {
    return <Redirect href="/(tabs)/events" />;
  }

  const renderSponsors = () => {
    const hasAny = TIER_ORDER.some((tier) => sponsorsByTier[tier].length > 0);
    if (!hasAny) return null;

    return TIER_ORDER.map((tier) => {
      const list = sponsorsByTier[tier];
      if (!list.length) return null;
      const isTitle = tier === 'Title Sponsor';
      const isCo = tier === 'Co-Sponsor';

      return (
        <View key={tier} style={styles.sponsorTierBlock}>
          <Text style={styles.sponsorTierLabel}>{tier.toUpperCase()}</Text>
          <View style={[styles.sponsorRow, isTitle && styles.sponsorRowTitle]}>
            {list.map((sponsor, index) => {
              const logo = getMediaUrl(sponsor.logo);
              return (
                <Pressable
                  key={`${sponsor.sponsor_id || sponsor.name}-${index}`}
                  style={[
                    styles.sponsorItem,
                    isTitle && styles.sponsorItemTitle,
                    isCo && styles.sponsorItemCo,
                  ]}
                  onPress={() => sponsor.website && openExternalUrl(sponsor.website)}
                  disabled={!sponsor.website}
                  accessibilityRole={sponsor.website ? 'link' : undefined}
                >
                  <View
                    style={[
                      styles.sponsorLogoWrap,
                      isTitle && styles.sponsorLogoWrapTitle,
                      isCo && styles.sponsorLogoWrapCo,
                    ]}
                  >
                    {logo ? (
                      <Image
                        source={{ uri: logo }}
                        style={styles.sponsorLogoImage}
                        contentFit="fill"
                      />
                    ) : (
                      <View style={styles.sponsorLogoFallback}>
                        <Text style={styles.sponsorInitials}>
                          {sponsor.name.slice(0, 2).toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.sponsorName}>{sponsor.name}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      );
    });
  };

  const renderBody = () => {
    if (isLoading) return <LoadingComponent message="Loading event..." />;

    if (error || !event) {
      return (
        <EmptyState
          title="Event not found"
          description="This event may have been cancelled or removed."
          icon="error"
          actionLabel="Back to Events"
          onActionPress={() => router.back()}
        />
      );
    }

    return (
      <>
        {coverUri ? (
          <Image source={{ uri: coverUri }} style={styles.cover} contentFit="cover" />
        ) : (
          <View style={[styles.cover, styles.coverFallback]}>
            <ThemeIcon name="event" size={40} color={Colors.text.outline} />
          </View>
        )}

        <View style={styles.content}>
          <View style={styles.typeRow}>
            <View style={styles.typeChip}>
              <Text style={styles.typeChipText}>{event.event_type}</Text>
            </View>
            {event.is_featured ? (
              <View style={[styles.typeChip, styles.featuredChip]}>
                <Text style={styles.featuredChipText}>Featured</Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.title}>{event.event_name}</Text>

          <View style={styles.metaCard}>
            <View style={styles.metaRow}>
              <ThemeIcon name="calendar" size={18} color={Colors.secondary} />
              <Text style={styles.metaText}>{formatDate(event.event_date)}</Text>
            </View>
            <View style={styles.metaRow}>
              <ThemeIcon name="event" size={18} color={Colors.secondary} />
              <Text style={styles.metaText}>{formatTime(event.start_time)}</Text>
            </View>
            <View style={styles.metaRow}>
              <ThemeIcon name="directory" size={18} color={Colors.secondary} />
              <Text style={styles.metaText}>{event.venue_name}</Text>
            </View>
            {!!event.venue_address && (
              <Text style={styles.addressText}>{event.venue_address}</Text>
            )}
            {!!event.map_link && (
              <Pressable
                style={styles.mapButton}
                onPress={() => openExternalUrl(event.map_link!)}
                accessibilityRole="link"
              >
                <ThemeIcon name="link" size={16} color="#FFFFFF" />
                <Text style={styles.mapButtonText}>View on Map</Text>
              </Pressable>
            )}
          </View>

          {!!event.teams_involved && (
            <>
              <SectionHeader title="Teams Involved" />
              <View style={styles.sectionCard}>
                <Text style={styles.bodyText}>{event.teams_involved}</Text>
              </View>
            </>
          )}

          {!!event.description && (
            <>
              <SectionHeader title="About the Event" />
              <View style={styles.sectionCard}>
                <Text style={styles.bodyText}>{event.description}</Text>
              </View>
            </>
          )}

          {TIER_ORDER.some((tier) => sponsorsByTier[tier].length > 0) ? (
            <>
              <SectionHeader title="Sponsors" />
              {renderSponsors()}
            </>
          ) : null}
        </View>
      </>
    );
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ThemeIcon name="arrowBack" size={22} color={Colors.primary} />
        </Pressable>
        <Text style={styles.topBarTitle}>Event Details</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={!!isRefetching && !isLoading} onRefresh={() => refetch()} />
        }
      >
        {renderBody()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(122, 133, 160, 0.1)',
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    ...Typography.subHeading,
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '800',
  },
  scrollContent: {
    paddingBottom: Spacing.massive,
  },
  cover: {
    width: '100%',
    height: 220,
    backgroundColor: Colors.primaryContainer,
  },
  coverFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  typeChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.round,
    backgroundColor: Colors.primaryContainer,
  },
  typeChipText: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.primary,
  },
  featuredChip: {
    backgroundColor: Colors.secondaryContainer,
  },
  featuredChipText: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.secondary,
  },
  title: {
    ...Typography.heading,
    fontSize: 24,
    color: Colors.text.primary,
    marginBottom: Spacing.lg,
  },
  metaCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  metaText: {
    ...Typography.body,
    fontSize: 15,
    color: Colors.text.primary,
    fontWeight: '600',
    flex: 1,
  },
  addressText: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
    marginLeft: 26,
  },
  mapButton: {
    marginTop: Spacing.sm,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  mapButtonText: {
    ...Typography.button,
    color: '#FFFFFF',
    fontSize: 14,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  bodyText: {
    ...Typography.body,
    fontSize: 15,
    lineHeight: 22,
    color: Colors.text.secondary,
  },
  emptySponsors: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.xl,
    alignItems: 'center',
    ...Shadows.sm,
  },
  emptySponsorsText: {
    ...Typography.caption,
    color: Colors.text.outline,
  },
  sponsorTierBlock: {
    marginBottom: Spacing.xl,
  },
  sponsorTierLabel: {
    ...Typography.caption,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: Colors.text.outline,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  sponsorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  sponsorRowTitle: {
    justifyContent: 'center',
  },
  sponsorItem: {
    width: '44%',
    minWidth: 140,
    maxWidth: 180,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  sponsorItemTitle: {
    width: '100%',
    maxWidth: 280,
    minWidth: 200,
  },
  sponsorItemCo: {
    width: '46%',
    minWidth: 150,
    maxWidth: 200,
  },
  sponsorLogoWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    backgroundColor: Colors.primaryContainer,
    marginBottom: Spacing.sm,
  },
  sponsorLogoWrapTitle: {
    width: 152,
    height: 152,
    borderRadius: 76,
  },
  sponsorLogoWrapCo: {
    width: 116,
    height: 116,
    borderRadius: 58,
  },
  sponsorLogoImage: {
    width: '100%',
    height: '100%',
  },
  sponsorLogoFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryContainer,
  },
  sponsorInitials: {
    ...Typography.button,
    fontSize: 22,
    color: Colors.primary,
  },
  sponsorName: {
    ...Typography.body,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text.primary,
    textAlign: 'center',
    width: '100%',
    lineHeight: 20,
  },
});
