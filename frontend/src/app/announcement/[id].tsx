import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Linking,
  Share,
  Alert,
  RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Redirect } from 'expo-router';
import { Colors, Typography, Spacing, Radius, Shadows, ThemeIcon } from '@/theme';
import { LoadingComponent, EmptyState } from '@/components/States';
import { useAnnouncementDetail } from '../../hooks/useAnnouncements';
import { useApprovalStore } from '../../store/approvalStore';
import { getMediaUrl } from '../../utils/mediaUrl';

const formatDate = (value?: string | null) => {
  if (!value) return '';
  try {
    return new Date(value).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
};

export default function AnnouncementDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const announcementId = parseInt(String(id), 10);
  const validId = Number.isInteger(announcementId) && announcementId > 0;
  const { approvalStatus } = useApprovalStore();
  const { announcement, isLoading, error, refetch, isRefetching } = useAnnouncementDetail(
    validId ? announcementId : undefined,
  );

  const coverUri = useMemo(
    () => getMediaUrl(announcement?.cover_image),
    [announcement?.cover_image],
  );

  if (approvalStatus !== 'approved') {
    return <Redirect href="/(tabs)/home" />;
  }

  if (!validId) {
    return <Redirect href="/(tabs)/announcements" />;
  }

  const handleShare = async () => {
    if (!announcement) return;
    try {
      await Share.share({
        message: `${announcement.title}\n\n${announcement.short_description}`,
        title: announcement.title,
      });
    } catch {
      Alert.alert('Unable to share', 'Please try again.');
    }
  };

  const handleDownload = async (path: string) => {
    const url = getMediaUrl(path);
    if (!url) return;
    const supported = await Linking.canOpenURL(url);
    if (supported) Linking.openURL(url);
    else Alert.alert('Unable to open attachment');
  };

  const renderBody = () => {
    if (isLoading) return <LoadingComponent message="Loading announcement..." />;

    if (error || !announcement) {
      return (
        <EmptyState
          title="Announcement not found"
          description="This announcement may have expired or been removed."
          icon="error"
          actionLabel="Back to News"
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
            <ThemeIcon name="announcement" size={40} color={Colors.text.outline} />
          </View>
        )}

        <View style={styles.content}>
          <View style={styles.badgeRow}>
            {announcement.is_pinned && (
              <View style={styles.pinnedPill}>
                <Text style={styles.pinnedText}>PINNED</Text>
              </View>
            )}
            <View style={styles.typePill}>
              <Text style={styles.typeText}>{announcement.announcement_type}</Text>
            </View>
            <View style={styles.priorityPill}>
              <Text style={styles.priorityText}>{String(announcement.priority).toUpperCase()}</Text>
            </View>
          </View>

          <Text style={styles.title}>{announcement.title}</Text>
          <Text style={styles.date}>
            {formatDate(announcement.publish_date || announcement.created_at)}
          </Text>

          <Text style={styles.description}>{announcement.description}</Text>

          {(announcement.attachments?.length ?? 0) > 0 && (
            <View style={styles.attachSection}>
              <Text style={styles.attachTitle}>Attachments</Text>
              {announcement.attachments!.map((file, idx) => (
                <Pressable
                  key={`${file}-${idx}`}
                  style={styles.attachRow}
                  onPress={() => handleDownload(file)}
                >
                  <ThemeIcon name="link" size={18} color={Colors.primary} />
                  <Text style={styles.attachLabel} numberOfLines={1}>
                    Download attachment {idx + 1}
                  </Text>
                  <ThemeIcon name="chevronRight" size={18} color={Colors.text.outline} />
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </>
    );
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.back()}
          style={styles.iconBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ThemeIcon name="arrowBack" size={24} color={Colors.primary} />
        </Pressable>
        <Text style={styles.topTitle}>Announcement</Text>
        <Pressable
          onPress={handleShare}
          style={styles.iconBtn}
          accessibilityRole="button"
          accessibilityLabel="Share announcement"
        >
          <ThemeIcon name="share" size={22} color={Colors.primary} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching && !isLoading} onRefresh={() => refetch()} />
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
    backgroundColor: Colors.surface,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(122, 133, 160, 0.12)',
    backgroundColor: Colors.surface,
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    ...Typography.subHeading,
    color: Colors.primary,
    fontSize: 16,
  },
  scroll: {
    paddingBottom: Spacing.massive,
  },
  cover: {
    width: '100%',
    height: 220,
    backgroundColor: Colors.background,
  },
  coverFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: Spacing.lg,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing.md,
  },
  pinnedPill: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.xs,
  },
  pinnedText: {
    ...Typography.caption,
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 10,
  },
  typePill: {
    backgroundColor: Colors.primaryContainer,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.xs,
  },
  typeText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '800',
    fontSize: 10,
  },
  priorityPill: {
    backgroundColor: Colors.secondaryContainer,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.xs,
  },
  priorityText: {
    ...Typography.caption,
    color: Colors.secondary,
    fontWeight: '900',
    fontSize: 10,
  },
  title: {
    ...Typography.heading,
    fontSize: 24,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  date: {
    ...Typography.caption,
    color: Colors.text.outline,
    marginBottom: Spacing.lg,
  },
  description: {
    ...Typography.body,
    fontSize: 15,
    lineHeight: 24,
    color: Colors.text.secondary,
  },
  attachSection: {
    marginTop: Spacing.xl,
  },
  attachTitle: {
    ...Typography.subHeading,
    fontSize: 14,
    color: Colors.primary,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
  },
  attachRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  attachLabel: {
    ...Typography.body,
    flex: 1,
    fontSize: 14,
    color: Colors.text.primary,
    fontWeight: '700',
  },
});
