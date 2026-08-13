import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Dimensions,
  ActivityIndicator,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { Image } from 'expo-image';
import { Colors, Typography, Spacing, Radius, Shadows, ThemeIcon } from '@/theme';
import { SectionHeader, Divider } from '@/components/Layout';
import type { ClubEvent } from '@/store/eventStore';
import { formatEventDate, formatEventTime } from '@/utils/eventFormat';
import { getMediaUrl } from '@/utils/mediaUrl';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_H_PADDING = Spacing.lg;
const CARD_GAP = Spacing.md;
const CARD_WIDTH = SCREEN_WIDTH - CARD_H_PADDING * 2;
const AUTO_SLIDE_MS = 2500;

interface FeaturedEventsCarouselProps {
  events: ClubEvent[];
  isLoading?: boolean;
  onPressEvent: (id: number) => void;
}

export function FeaturedEventsCarousel({
  events,
  isLoading,
  onPressEvent,
}: FeaturedEventsCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<FlatList<ClubEvent>>(null);
  const activeIndexRef = useRef(0);
  const isDraggingRef = useRef(false);
  const eventCount = events.length;

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  useEffect(() => {
    if (eventCount <= 1) return;

    const timer = setInterval(() => {
      if (isDraggingRef.current) return;

      const nextIndex = (activeIndexRef.current + 1) % eventCount;
      activeIndexRef.current = nextIndex;
      setActiveIndex(nextIndex);
      listRef.current?.scrollToOffset({
        offset: nextIndex * (CARD_WIDTH + CARD_GAP),
        animated: true,
      });
    }, AUTO_SLIDE_MS);

    return () => clearInterval(timer);
  }, [eventCount]);

  if (isLoading) {
    return (
      <View style={styles.section}>
        <SectionHeader title="Featured Events" />
        <View style={styles.skeletonCard}>
          <ActivityIndicator color="#FFFFFF" />
        </View>
      </View>
    );
  }

  if (!events.length) return null;

  const syncIndexFromScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const index = Math.round(x / (CARD_WIDTH + CARD_GAP));
    const clamped = Math.max(0, Math.min(index, events.length - 1));
    activeIndexRef.current = clamped;
    setActiveIndex(clamped);
  };

  return (
    <View style={styles.section}>
      <SectionHeader title="Featured Events" />
      <FlatList
        ref={listRef}
        data={events}
        keyExtractor={(item) => String(item.id)}
        horizontal
        nestedScrollEnabled
        pagingEnabled={false}
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + CARD_GAP}
        snapToAlignment="start"
        disableIntervalMomentum
        contentContainerStyle={styles.listContent}
        onScrollBeginDrag={() => {
          isDraggingRef.current = true;
        }}
        onMomentumScrollEnd={(e) => {
          isDraggingRef.current = false;
          syncIndexFromScroll(e);
        }}
        onScrollEndDrag={(e) => {
          // If the user stops without momentum, still resume auto-slide.
          const velocity = e.nativeEvent.velocity?.x ?? 0;
          if (Math.abs(velocity) < 0.05) {
            isDraggingRef.current = false;
            syncIndexFromScroll(e);
          }
        }}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.card, { width: CARD_WIDTH }]}
            onPress={() => onPressEvent(item.id)}
            accessibilityRole="button"
          >
            {!!item.event_image && (
              <Image
                source={{ uri: getMediaUrl(item.event_image) || undefined }}
                style={styles.cover}
                contentFit="cover"
              />
            )}
            <View style={styles.cardBody}>
              <View style={styles.badgeRow}>
                <View style={styles.featuredBadge}>
                  <ThemeIcon name="sports" size={12} color="#FFFFFF" style={styles.badgeIcon} />
                  <Text style={styles.featuredBadgeText}>Featured Event</Text>
                </View>
                {!!item.event_type && (
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeBadgeText}>{item.event_type}</Text>
                  </View>
                )}
              </View>

              <Text style={styles.title} numberOfLines={2}>
                {item.event_name}
              </Text>
              <Text style={styles.meta}>
                {formatEventDate(item.event_date)}
                {item.start_time ? ` · ${formatEventTime(item.start_time)}` : ''}
              </Text>

              <Divider style={styles.divider} />

              <View style={styles.footer}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.footerLabel}>Venue</Text>
                  <Text style={styles.footerValue} numberOfLines={1}>
                    {item.venue_name}
                  </Text>
                </View>
                <View style={styles.cta}>
                  <Text style={styles.ctaText}>View Event</Text>
                </View>
              </View>
            </View>
          </Pressable>
        )}
      />

      {events.length > 1 ? (
        <View style={styles.dots}>
          {events.map((item, index) => (
            <View
              key={item.id}
              style={[styles.dot, index === activeIndex && styles.dotActive]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing.md,
  },
  listContent: {
    paddingRight: Spacing.lg,
  },
  skeletonCard: {
    height: 180,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  card: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    marginRight: CARD_GAP,
    overflow: 'hidden',
    ...Shadows.md,
  },
  cover: {
    width: '100%',
    height: 120,
    backgroundColor: Colors.secondaryNavy,
  },
  cardBody: {
    padding: Spacing.xl,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondary,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.xl,
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
  typeBadge: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.xl,
    alignSelf: 'flex-start',
  },
  typeBadgeText: {
    ...Typography.caption,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 10,
  },
  title: {
    ...Typography.heading,
    fontSize: 22,
    color: '#FFFFFF',
  },
  meta: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.primaryContainer,
    marginTop: Spacing.xs,
  },
  divider: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginVertical: Spacing.md,
  },
  footer: {
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
  cta: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
  },
  ctaText: {
    ...Typography.button,
    color: Colors.primary,
    fontSize: 12,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: Spacing.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primaryContainer,
  },
  dotActive: {
    width: 16,
    backgroundColor: Colors.secondary,
  },
});

export default FeaturedEventsCarousel;
