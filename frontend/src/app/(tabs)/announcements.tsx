import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Radius, ThemeIcon } from '@/theme';
import { SearchBar } from '@/components/Input';
import { AnnouncementCard } from '@/components/Card';
import { LoadingComponent, EmptyState } from '@/components/States';
import { SectionHeader } from '@/components/Layout';
import { useApprovalStore } from '../../store/approvalStore';
import { useAnnouncementStore } from '../../store/announcementStore';
import { useAnnouncements, usePinnedAnnouncements } from '../../hooks/useAnnouncements';
import { getMediaUrl } from '../../utils/mediaUrl';

const FILTERS = [
  'All',
  'General',
  'Meeting',
  'Emergency',
  'Event',
  'Club Update',
] as const;

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

export default function AnnouncementsScreen() {
  const router = useRouter();
  const { approvalStatus } = useApprovalStore();
  const {
    selectedType,
    searchQuery,
    setSelectedType,
    setSearchQuery,
    latestToast,
    clearToast,
  } = useAnnouncementStore();

  const {
    announcements,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useAnnouncements({
    search: searchQuery.trim() || undefined,
    type: selectedType,
    limit: 50,
    enabled: approvalStatus === 'approved',
  });

  const pinnedQuery = usePinnedAnnouncements(approvalStatus === 'approved');

  const pinned = useMemo(() => {
    if (searchQuery.trim() || selectedType !== 'All') return [];
    return pinnedQuery.announcements;
  }, [pinnedQuery.announcements, searchQuery, selectedType]);

  const latest = useMemo(() => {
    const pinnedIds = new Set(pinned.map((p) => p.id));
    return announcements.filter((a) => !pinnedIds.has(a.id));
  }, [announcements, pinned]);

  if (approvalStatus !== 'approved') {
    return <Redirect href="/(tabs)/home" />;
  }

  const openDetail = (id: number) => {
    router.push(`/announcement/${id}` as any);
  };

  const renderList = () => {
    if (isLoading) return <LoadingComponent message="Loading announcements..." />;

    if (error) {
      return (
        <EmptyState
          title="Could not load announcements"
          description="Please check your connection and try again."
          icon="error"
          actionLabel="Retry"
          onActionPress={() => refetch()}
        />
      );
    }

    if (announcements.length === 0) {
      return (
        <EmptyState
          title="No announcements yet"
          description={
            searchQuery || selectedType !== 'All'
              ? 'No announcements match your search or filter.'
              : 'Official club news will appear here when published.'
          }
          icon="announcement"
        />
      );
    }

    return (
      <>
        {pinned.length > 0 && (
          <>
            <SectionHeader title="Pinned" />
            {pinned.map((item) => (
              <AnnouncementCard
                key={`pinned-${item.id}`}
                title={item.title}
                content={item.short_description}
                date={formatDate(item.publish_date || item.created_at)}
                coverImage={getMediaUrl(item.cover_image)}
                priority={item.priority}
                isPinned
                isNew={!!item.is_new}
                onPress={() => openDetail(item.id)}
              />
            ))}
          </>
        )}

        <SectionHeader title={pinned.length > 0 ? 'Latest' : 'Announcements'} />
        {latest.map((item) => (
          <AnnouncementCard
            key={item.id}
            title={item.title}
            content={item.short_description}
            date={formatDate(item.publish_date || item.created_at)}
            coverImage={getMediaUrl(item.cover_image)}
            priority={item.priority}
            isPinned={item.is_pinned}
            isNew={!!item.is_new}
            onPress={() => openDetail(item.id)}
          />
        ))}
      </>
    );
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.headerSection}>
        <Text style={styles.titleText}>Announcements</Text>
        <Text style={styles.subtitleText}>
          Stay updated with official SEC news, schedule alerts, and notices.
        </Text>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search announcements..."
          containerStyle={styles.searchBar}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {FILTERS.map((filter) => {
            const active = selectedType === filter;
            return (
              <Pressable
                key={filter}
                onPress={() => setSelectedType(filter)}
                style={[styles.filterChip, active && styles.filterChipActive]}
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]}>
                  {filter === 'Event' ? 'Events' : filter === 'Club Update' ? 'Club Updates' : filter}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {latestToast && (
        <Pressable
          style={styles.toast}
          onPress={() => {
            openDetail(latestToast.id);
            clearToast();
          }}
        >
          <ThemeIcon name="notification" size={18} color="#FFFFFF" />
          <View style={styles.toastTextCol}>
            <Text style={styles.toastEyebrow}>
              {latestToast.message || 'Announcement'}
            </Text>
            <Text style={styles.toastText} numberOfLines={1}>
              {latestToast.title}
            </Text>
          </View>
          <Pressable onPress={clearToast} hitSlop={8}>
            <ThemeIcon name="close" size={18} color="#FFFFFF" />
          </Pressable>
        </Pressable>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={isRefetching && !isLoading} onRefresh={() => refetch()} />
        }
      >
        {renderList()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(122, 133, 160, 0.1)',
  },
  titleText: {
    ...Typography.heading,
    color: Colors.text.primary,
    fontSize: 26,
  },
  subtitleText: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
  searchBar: {
    marginTop: Spacing.md,
  },
  filterRow: {
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.xl,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(122, 133, 160, 0.2)',
    marginRight: Spacing.sm,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.text.secondary,
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  toast: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    backgroundColor: Colors.secondary,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toastTextCol: {
    flex: 1,
  },
  toastEyebrow: {
    ...Typography.caption,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  toastText: {
    ...Typography.caption,
    color: '#FFFFFF',
    fontWeight: '700',
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    paddingBottom: Spacing.massive,
  },
});
