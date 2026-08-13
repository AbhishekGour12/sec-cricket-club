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
import { EventCard } from '@/components/Card';
import { LoadingComponent, EmptyState } from '@/components/States';
import { SectionHeader } from '@/components/Layout';
import { EventsCalendar } from '@/components/Events/EventsCalendar';
import { useApprovalStore } from '../../store/approvalStore';
import { EVENT_TYPES, useEventStore } from '../../store/eventStore';
import { useEventsQuery } from '../../hooks/useEvents';
import { getMediaUrl } from '../../utils/mediaUrl';
import { formatEventDate, formatEventTime, toDateKey } from '../../utils/eventFormat';

export default function EventsScreen() {
  const router = useRouter();
  const { approvalStatus } = useApprovalStore();
  const {
    selectedType,
    searchQuery,
    setSelectedType,
    setSearchQuery,
    viewMode,
    setViewMode,
    calendarMonth,
    setCalendarMonth,
    selectedCalendarDate,
    setSelectedCalendarDate,
    latestToast,
    clearToast,
  } = useEventStore();

  const { events, isLoading, error, refetch, isRefetching } = useEventsQuery({
    search: searchQuery.trim() || undefined,
    type: selectedType,
    limit: 100,
    enabled: approvalStatus === 'approved',
  });

  const nearestUpcomingDate = useMemo(() => {
    if (!events.length) return selectedCalendarDate;
    return toDateKey(events[0].event_date) || selectedCalendarDate;
  }, [events, selectedCalendarDate]);

  if (approvalStatus !== 'approved') {
    return <Redirect href="/(tabs)/home" />;
  }

  const openDetail = (id: number) => {
    router.push(`/event/${id}` as any);
  };

  const switchToCalendar = () => {
    setViewMode('calendar');
    // Prefer nearest upcoming event date when entering calendar.
    if (events[0]?.event_date) {
      const key = toDateKey(events[0].event_date);
      setSelectedCalendarDate(key);
      setCalendarMonth(key.slice(0, 7));
    }
  };

  const renderList = () => {
    if (isLoading) return <LoadingComponent message="Loading events..." />;

    if (error) {
      return (
        <EmptyState
          title="Could not load events"
          description="Please check your connection and try again."
          icon="error"
          actionLabel="Retry"
          onActionPress={() => refetch()}
        />
      );
    }

    if (events.length === 0) {
      return (
        <EmptyState
          title="No events available."
          description={
            searchQuery || selectedType !== 'All'
              ? 'No events match your search or filter.'
              : 'Published upcoming club events will appear here.'
          }
          icon="event"
        />
      );
    }

    return (
      <>
        <SectionHeader title="Upcoming Events" />
        {events.map((item) => (
          <EventCard
            key={item.id}
            title={item.event_name}
            date={formatEventDate(item.event_date)}
            time={formatEventTime(item.start_time)}
            location={item.venue_name}
            status="Upcoming"
            badge={item.is_featured ? 'Featured' : item.event_type}
            coverImage={getMediaUrl(item.event_image) || undefined}
            onPress={() => openDetail(item.id)}
            style={styles.cardSpacing}
          />
        ))}
      </>
    );
  };

  const renderCalendar = () => {
    if (isLoading) return <LoadingComponent message="Loading calendar..." />;

    if (error) {
      return (
        <EmptyState
          title="Could not load events"
          description="Please check your connection and try again."
          icon="error"
          actionLabel="Retry"
          onActionPress={() => refetch()}
        />
      );
    }

    return (
      <EventsCalendar
        events={events}
        month={calendarMonth}
        selectedDate={selectedCalendarDate || nearestUpcomingDate}
        onChangeMonth={setCalendarMonth}
        onSelectDate={setSelectedCalendarDate}
        onPressEvent={openDetail}
      />
    );
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.headerSection}>
        <Text style={styles.titleText}>Events</Text>
        <Text style={styles.subtitleText}>
          Fixtures, tournaments, and club gatherings for SEC members.
        </Text>

        <View style={styles.viewToggle}>
          <Pressable
            style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]}
            onPress={() => setViewMode('list')}
            accessibilityRole="button"
          >
            <ThemeIcon
              name="event"
              size={16}
              color={viewMode === 'list' ? '#FFFFFF' : Colors.text.secondary}
            />
            <Text style={[styles.toggleText, viewMode === 'list' && styles.toggleTextActive]}>
              List
            </Text>
          </Pressable>
          <Pressable
            style={[styles.toggleBtn, viewMode === 'calendar' && styles.toggleBtnActive]}
            onPress={switchToCalendar}
            accessibilityRole="button"
          >
            <ThemeIcon
              name="calendar"
              size={16}
              color={viewMode === 'calendar' ? '#FFFFFF' : Colors.text.secondary}
            />
            <Text
              style={[styles.toggleText, viewMode === 'calendar' && styles.toggleTextActive]}
            >
              Calendar
            </Text>
          </Pressable>
        </View>

        {viewMode === 'list' ? (
          <>
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search events, venue..."
              containerStyle={styles.searchBar}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
            >
              {EVENT_TYPES.map((filter) => {
                const active = selectedType === filter;
                return (
                  <Pressable
                    key={filter}
                    onPress={() => setSelectedType(filter)}
                    style={[styles.filterChip, active && styles.filterChipActive]}
                  >
                    <Text style={[styles.filterText, active && styles.filterTextActive]}>
                      {filter}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </>
        ) : null}
      </View>

      {latestToast ? (
        <Pressable
          style={styles.toast}
          onPress={() => {
            openDetail(latestToast.id);
            clearToast();
          }}
        >
          <ThemeIcon name="notification" size={18} color="#FFFFFF" />
          <View style={styles.toastTextCol}>
            <Text style={styles.toastEyebrow}>{latestToast.message || 'Event'}</Text>
            <Text style={styles.toastText} numberOfLines={1}>
              {latestToast.title}
            </Text>
          </View>
          <Pressable onPress={clearToast} hitSlop={8}>
            <ThemeIcon name="close" size={18} color="#FFFFFF" />
          </Pressable>
        </Pressable>
      ) : null}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={isRefetching && !isLoading} onRefresh={() => refetch()} />
        }
      >
        {viewMode === 'list' ? renderList() : renderCalendar()}
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
  viewToggle: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: 4,
    gap: 4,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
  },
  toggleBtnActive: {
    backgroundColor: Colors.primary,
  },
  toggleText: {
    ...Typography.caption,
    fontWeight: '800',
    color: Colors.text.secondary,
  },
  toggleTextActive: {
    color: '#FFFFFF',
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
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    paddingBottom: Spacing.massive,
  },
  cardSpacing: {
    marginBottom: Spacing.md,
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
});
