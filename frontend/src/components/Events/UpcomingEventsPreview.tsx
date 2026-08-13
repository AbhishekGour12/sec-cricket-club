import React from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadows, ThemeIcon } from '@/theme';
import { SectionHeader } from '@/components/Layout';
import type { ClubEvent } from '@/store/eventStore';
import { formatEventTime } from '@/utils/eventFormat';

interface UpcomingEventsPreviewProps {
  events: ClubEvent[];
  isLoading?: boolean;
  onPressEvent: (id: number) => void;
  onPressAllCalendar: () => void;
  onPressViewAll: () => void;
}

/**
 * Compact Home upcoming list — matches PRD/home reference:
 * date box (day + month) + title + badge + venue/time.
 */
export function UpcomingEventsPreview({
  events,
  isLoading,
  onPressEvent,
  onPressAllCalendar,
  onPressViewAll,
}: UpcomingEventsPreviewProps) {
  return (
    <View style={styles.section}>
      <SectionHeader
        title="Upcoming Events"
        actionLabel="All Calendar"
        actionIcon="calendar"
        onActionPress={onPressAllCalendar}
      />

      {isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : events.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>No upcoming events available.</Text>
        </View>
      ) : (
        events.map((item) => {
          const day = item.event_date
            ? String(new Date(`${item.event_date}T00:00:00`).getDate()).padStart(2, '0')
            : '--';
          const month = item.event_date
            ? new Date(`${item.event_date}T00:00:00`)
                .toLocaleDateString('en-US', { month: 'short' })
                .toUpperCase()
            : '—';
          const time = formatEventTime(item.start_time);

          return (
            <Pressable
              key={item.id}
              style={styles.card}
              onPress={() => onPressEvent(item.id)}
              accessibilityRole="button"
            >
              <View style={styles.dateBox}>
                <Text style={styles.dayText}>{day}</Text>
                <Text style={styles.monthText}>{month}</Text>
              </View>

              <View style={styles.infoCol}>
                <View style={styles.titleRow}>
                  <Text style={styles.title} numberOfLines={1}>
                    {item.event_name}
                  </Text>
                  {!!item.event_type && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{item.event_type}</Text>
                    </View>
                  )}
                </View>

                {item.venue_name ? (
                  <View style={styles.metaRow}>
                    <ThemeIcon
                      name="directory"
                      size={14}
                      color={Colors.text.secondary}
                      style={styles.metaIcon}
                    />
                    <Text style={styles.metaText} numberOfLines={1}>
                      {item.venue_name}
                    </Text>
                  </View>
                ) : null}

                {time ? (
                  <View style={styles.metaRow}>
                    <ThemeIcon
                      name="calendar"
                      size={14}
                      color={Colors.secondary}
                      style={styles.metaIcon}
                    />
                    <Text style={styles.metaText} numberOfLines={1}>
                      {time}
                      {item.teams_involved ? ` • ${item.teams_involved}` : ''}
                    </Text>
                  </View>
                ) : null}
              </View>
            </Pressable>
          );
        })
      )}

      <Pressable style={styles.viewAllBtn} onPress={onPressViewAll} accessibilityRole="button">
        <Text style={styles.viewAllText}>View All Events</Text>
        <ThemeIcon name="chevronRight" size={16} color={Colors.secondary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing.md,
  },
  loadingBox: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  emptyBox: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  emptyText: {
    ...Typography.caption,
    color: Colors.text.outline,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  dateBox: {
    width: 56,
    borderRadius: Radius.sm,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    marginRight: Spacing.md,
  },
  dayText: {
    ...Typography.heading,
    fontSize: 20,
    color: Colors.primary,
    fontWeight: '800',
  },
  monthText: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.4,
  },
  infoCol: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 4,
  },
  title: {
    ...Typography.body,
    flexShrink: 1,
    fontWeight: '800',
    color: Colors.text.primary,
  },
  badge: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  badgeText: {
    ...Typography.caption,
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 9,
    textTransform: 'uppercase',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  metaIcon: {
    marginRight: 4,
  },
  metaText: {
    ...Typography.caption,
    color: Colors.text.secondary,
    flex: 1,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    gap: 4,
  },
  viewAllText: {
    ...Typography.button,
    color: Colors.secondary,
    fontSize: 13,
    fontWeight: '800',
  },
});

export default UpcomingEventsPreview;
