import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadows, ThemeIcon } from '@/theme';
import type { ClubEvent } from '@/store/eventStore';
import { formatEventTime, monthLabel, toDateKey } from '@/utils/eventFormat';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface EventsCalendarProps {
  events: ClubEvent[];
  /** YYYY-MM */
  month: string;
  /** YYYY-MM-DD */
  selectedDate: string;
  onChangeMonth: (month: string) => void;
  onSelectDate: (date: string) => void;
  onPressEvent: (id: number) => void;
}

function parseMonth(month: string) {
  const [y, m] = month.split('-').map(Number);
  return { year: y || new Date().getFullYear(), monthIndex: (m || 1) - 1 };
}

function shiftMonth(month: string, delta: number) {
  const { year, monthIndex } = parseMonth(month);
  const d = new Date(year, monthIndex + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function buildCells(year: number, monthIndex: number) {
  const firstDow = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells: Array<{ day: number | null; key: string }> = [];

  for (let i = 0; i < firstDow; i += 1) {
    cells.push({ day: null, key: `pad-${i}` });
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    const key = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    cells.push({ day, key });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ day: null, key: `trail-${cells.length}` });
  }
  return cells;
}

/**
 * Lightweight month calendar — Expo-compatible, no extra calendar package.
 * Shows event dots and a list of events for the selected date.
 */
export function EventsCalendar({
  events,
  month,
  selectedDate,
  onChangeMonth,
  onSelectDate,
  onPressEvent,
}: EventsCalendarProps) {
  const { year, monthIndex } = parseMonth(month);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, ClubEvent[]>();
    events.forEach((event) => {
      const key = toDateKey(event.event_date);
      if (!key) return;
      const list = map.get(key) || [];
      list.push(event);
      map.set(key, list);
    });
    return map;
  }, [events]);

  const cells = useMemo(() => buildCells(year, monthIndex), [year, monthIndex]);
  const selectedEvents = eventsByDate.get(selectedDate) || [];
  const todayKey = new Date().toISOString().slice(0, 10);

  return (
    <View>
      <View style={styles.monthHeader}>
        <Pressable
          onPress={() => onChangeMonth(shiftMonth(month, -1))}
          hitSlop={10}
          style={styles.navBtn}
          accessibilityRole="button"
          accessibilityLabel="Previous month"
        >
          <ThemeIcon name="chevronLeft" size={20} color={Colors.primary} />
        </Pressable>
        <Text style={styles.monthTitle}>{monthLabel(year, monthIndex)}</Text>
        <Pressable
          onPress={() => onChangeMonth(shiftMonth(month, 1))}
          hitSlop={10}
          style={styles.navBtn}
          accessibilityRole="button"
          accessibilityLabel="Next month"
        >
          <ThemeIcon name="chevronRight" size={20} color={Colors.primary} />
        </Pressable>
      </View>

      <View style={styles.calendarCard}>
        <View style={styles.weekdayRow}>
          {WEEKDAYS.map((d) => (
            <Text key={d} style={styles.weekday}>
              {d}
            </Text>
          ))}
        </View>

        <View style={styles.grid}>
          {cells.map((cell) => {
            if (cell.day == null) {
              return <View key={cell.key} style={styles.dayCell} />;
            }
            const hasEvents = (eventsByDate.get(cell.key)?.length || 0) > 0;
            const selected = cell.key === selectedDate;
            const isToday = cell.key === todayKey;

            return (
              <Pressable
                key={cell.key}
                style={[
                  styles.dayCell,
                  selected && styles.daySelected,
                  isToday && !selected && styles.dayToday,
                ]}
                onPress={() => onSelectDate(cell.key)}
              >
                <Text
                  style={[
                    styles.dayNumber,
                    selected && styles.dayNumberSelected,
                    isToday && !selected && styles.dayNumberToday,
                  ]}
                >
                  {cell.day}
                </Text>
                {hasEvents ? (
                  <View style={[styles.dot, selected && styles.dotSelected]} />
                ) : (
                  <View style={styles.dotPlaceholder} />
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      <Text style={styles.selectedHeading}>
        {new Date(`${selectedDate}T00:00:00`).toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })}
      </Text>

      {selectedEvents.length === 0 ? (
        <View style={styles.emptyDay}>
          <Text style={styles.emptyDayText}>No events scheduled for this date.</Text>
        </View>
      ) : (
        selectedEvents.map((item) => (
          <Pressable
            key={item.id}
            style={styles.eventRow}
            onPress={() => onPressEvent(item.id)}
            accessibilityRole="button"
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.eventTitle} numberOfLines={2}>
                {item.event_name}
              </Text>
              <Text style={styles.eventMeta}>
                {formatEventTime(item.start_time)}
                {item.venue_name ? `  ·  ${item.venue_name}` : ''}
              </Text>
              {!!item.event_type && (
                <Text style={styles.eventType}>{item.event_type}</Text>
              )}
            </View>
            <ThemeIcon name="chevronRight" size={18} color={Colors.text.outline} />
          </Pressable>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  monthTitle: {
    ...Typography.heading,
    fontSize: 18,
    color: Colors.text.primary,
  },
  calendarCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
    ...Typography.caption,
    fontWeight: '800',
    color: Colors.text.outline,
    fontSize: 11,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.sm,
    paddingVertical: 2,
  },
  daySelected: {
    backgroundColor: Colors.primary,
  },
  dayToday: {
    borderWidth: 1.5,
    borderColor: Colors.secondary,
  },
  dayNumber: {
    ...Typography.body,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  dayNumberSelected: {
    color: '#FFFFFF',
  },
  dayNumberToday: {
    color: Colors.secondary,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.secondary,
    marginTop: 2,
  },
  dotSelected: {
    backgroundColor: '#FFFFFF',
  },
  dotPlaceholder: {
    width: 5,
    height: 5,
    marginTop: 2,
  },
  selectedHeading: {
    ...Typography.caption,
    fontWeight: '800',
    color: Colors.text.secondary,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  emptyDay: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  emptyDayText: {
    ...Typography.caption,
    color: Colors.text.outline,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  eventTitle: {
    ...Typography.body,
    fontWeight: '800',
    color: Colors.text.primary,
  },
  eventMeta: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  eventType: {
    ...Typography.caption,
    color: Colors.secondary,
    fontWeight: '700',
    marginTop: 4,
    fontSize: 11,
  },
});

export default EventsCalendar;
