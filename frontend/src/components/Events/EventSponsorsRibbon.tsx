import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Linking,
  Image,
  Animated,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius, Shadows } from '@/theme';
import type { ClubEvent } from '@/store/eventStore';

// Bundled high-resolution logos (Guaranteed offline & instant rendering)
const APEX_LOGO = require('../../../assets/images/sponsors/sponsor-apex-sports.png');
const SKYLINE_LOGO = require('../../../assets/images/sponsors/sponsor-skyline-steel.png');
const MEHTA_LOGO = require('../../../assets/images/sponsors/sponsor-mehta-builders.png');
const ROYAL_LOGO = require('../../../assets/images/sponsors/sponsor-royal-energy.png');
const TATA_LOGO = require('../../../assets/images/sponsors/sponsor-tata-capital.png');
const SG_LOGO = require('../../../assets/images/sponsors/sponsor-sg-sports.png');

interface SponsorDisplayData {
  id: number;
  name: string;
  tier: 'Title Sponsor' | 'Co-Sponsor' | 'Associate Sponsor';
  tierLabel: string;
  topColor: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  accentColor: string;
  logo: any;
  website: string;
  eventName: string;
  eventId?: number;
}

const PREMIER_PARTNERS: SponsorDisplayData[] = [
  {
    id: 1,
    name: 'Apex Sports India',
    tier: 'Title Sponsor',
    tierLabel: 'TITLE SPONSOR',
    topColor: '#D97706',
    badgeBg: '#FEF3C7',
    badgeText: '#92400E',
    badgeBorder: '#FCD34D',
    accentColor: '#D97706',
    logo: APEX_LOGO,
    website: 'https://apexsports.in',
    eventName: 'SEC Corporate Invitational',
    eventId: 8,
  },
  {
    id: 2,
    name: 'Skyline Steel & Infra',
    tier: 'Co-Sponsor',
    tierLabel: 'CO-SPONSOR',
    topColor: '#BE185D',
    badgeBg: '#FFE4E6',
    badgeText: '#9F1239',
    badgeBorder: '#FDA4AF',
    accentColor: '#E11D48',
    logo: SKYLINE_LOGO,
    website: 'https://skylinesteel.com',
    eventName: 'SEC Corporate Invitational',
    eventId: 8,
  },
  {
    id: 3,
    name: 'Mehta Developers',
    tier: 'Title Sponsor',
    tierLabel: 'TITLE SPONSOR',
    topColor: '#D97706',
    badgeBg: '#FEF3C7',
    badgeText: '#92400E',
    badgeBorder: '#FCD34D',
    accentColor: '#D97706',
    logo: MEHTA_LOGO,
    website: 'https://mehtabuilders.in',
    eventName: 'SEC Champions Cup 2026',
    eventId: 7,
  },
  {
    id: 4,
    name: 'SG Cricket Gear',
    tier: 'Co-Sponsor',
    tierLabel: 'CO-SPONSOR',
    topColor: '#BE185D',
    badgeBg: '#FFE4E6',
    badgeText: '#9F1239',
    badgeBorder: '#FDA4AF',
    accentColor: '#E11D48',
    logo: SG_LOGO,
    website: 'https://sgcricket.com',
    eventName: 'SEC Champions Cup 2026',
    eventId: 7,
  },
  {
    id: 5,
    name: 'Royal Energy Drink',
    tier: 'Co-Sponsor',
    tierLabel: 'CO-SPONSOR',
    topColor: '#BE185D',
    badgeBg: '#FFE4E6',
    badgeText: '#9F1239',
    badgeBorder: '#FDA4AF',
    accentColor: '#E11D48',
    logo: ROYAL_LOGO,
    website: 'https://royalenergy.in',
    eventName: 'SEC Premier League 2026',
    eventId: 6,
  },
  {
    id: 6,
    name: 'Tata Capital Services',
    tier: 'Associate Sponsor',
    tierLabel: 'ASSOCIATE SPONSOR',
    topColor: '#2563EB',
    badgeBg: '#EFF6FF',
    badgeText: '#1E40AF',
    badgeBorder: '#BFDBFE',
    accentColor: '#2563EB',
    logo: TATA_LOGO,
    website: 'https://tatacapital.com',
    eventName: 'SEC Champions Cup 2026',
    eventId: 7,
  },
];

interface EventSponsorsRibbonProps {
  events?: ClubEvent[];
  onPressSponsor?: (sponsor: any) => void;
}

export function EventSponsorsRibbon({ events, onPressSponsor }: EventSponsorsRibbonProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const isPausedRef = useRef(false);

  const totalCount = PREMIER_PARTNERS.length;
  const currentSponsor = PREMIER_PARTNERS[currentIndex];

  const animateToNext = (nextIdx: number) => {
    Animated.timing(fadeAnim, {
      toValue: 0.2,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setCurrentIndex(nextIdx);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleNext = () => {
    const next = (currentIndex + 1) % totalCount;
    animateToNext(next);
  };

  const handlePrev = () => {
    const prev = (currentIndex - 1 + totalCount) % totalCount;
    animateToNext(prev);
  };

  // Auto-slide loop every 3.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      if (isPausedRef.current) return;
      handleNext();
    }, 3500);

    return () => clearInterval(timer);
  }, [currentIndex]);

  const handleCardPress = () => {
    if (onPressSponsor) {
      onPressSponsor(currentSponsor);
      return;
    }
    if (currentSponsor.eventId) {
      router.push(`/event/${currentSponsor.eventId}` as any);
    } else if (currentSponsor.website) {
      Linking.openURL(currentSponsor.website).catch(() => {});
    }
  };

  return (
    <View style={styles.container}>
      {/* Ribbon Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={styles.ribbonBadge}>
            <View style={styles.livePulseDot} />
            <Text style={styles.ribbonBadgeText}>OFFICIAL PARTNERS</Text>
          </View>
          <Text style={styles.title}>Tournament Sponsors</Text>
        </View>

        <View style={styles.headerRightControls}>
          <Pressable
            style={styles.navArrowBtn}
            onPress={handlePrev}
            hitSlop={8}
          >
            <MaterialIcons name="chevron-left" size={20} color="#475569" />
          </Pressable>

          <View style={styles.counterPill}>
            <MaterialIcons name="star" size={12} color="#B45309" />
            <Text style={styles.counterText}>
              {currentIndex + 1}/{totalCount}
            </Text>
          </View>

          <Pressable
            style={styles.navArrowBtn}
            onPress={handleNext}
            hitSlop={8}
          >
            <MaterialIcons name="chevron-right" size={20} color="#475569" />
          </Pressable>
        </View>
      </View>

      {/* Main Full-Width Sponsor Showcase Card */}
      <Animated.View
        style={[
          styles.cardAnimatedWrap,
          { opacity: fadeAnim },
        ]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.card,
            { borderTopColor: currentSponsor.topColor },
            pressed && styles.cardPressed,
          ]}
          onPress={handleCardPress}
          onPressIn={() => {
            isPausedRef.current = true;
          }}
          onPressOut={() => {
            setTimeout(() => {
              isPausedRef.current = false;
            }, 3000);
          }}
        >
          {/* Card Top Row: Tier Pill + Action Link */}
          <View style={styles.cardHeader}>
            <View
              style={[
                styles.tierBadge,
                {
                  backgroundColor: currentSponsor.badgeBg,
                  borderColor: currentSponsor.badgeBorder,
                },
              ]}
            >
              <MaterialIcons name="star" size={12} color={currentSponsor.accentColor} />
              <Text style={[styles.tierText, { color: currentSponsor.badgeText }]}>
                {currentSponsor.tierLabel}
              </Text>
            </View>

            <View style={styles.actionChip}>
              <Text style={styles.actionChipText}>View Details</Text>
              <MaterialIcons name="arrow-forward" size={13} color={Colors.primary} />
            </View>
          </View>

          {/* Large High-Contrast Logo Box */}
          <View style={styles.logoContainer}>
            <Image
              source={currentSponsor.logo}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          {/* Sponsor Brand Name */}
          <Text style={styles.sponsorName} numberOfLines={1}>
            {currentSponsor.name}
          </Text>

          {/* Sponsoring Fixture Pill */}
          <View style={styles.eventPill}>
            <MaterialIcons name="sports-cricket" size={13} color="#475569" />
            <Text style={styles.eventPillText} numberOfLines={1}>
              {currentSponsor.eventName}
            </Text>
          </View>
        </Pressable>
      </Animated.View>

      {/* Slide Indicator Dots with Direct Tap Navigation */}
      <View style={styles.dotsContainer}>
        {PREMIER_PARTNERS.map((_, i) => (
          <Pressable
            key={i}
            onPress={() => animateToNext(i)}
            hitSlop={6}
            style={[
              styles.dot,
              i === currentIndex && styles.dotActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.sm,
    backgroundColor: '#FFFFFF',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.sm,
  },
  headerRow: {
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'column',
    gap: 3,
  },
  ribbonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.round,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  ribbonBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  headerRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  navArrowBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  counterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.round,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  counterText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400E',
  },
  cardAnimatedWrap: {
    width: '100%',
  },
  card: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderTopWidth: 4,
    alignItems: 'center',
    ...Shadows.sm,
  },
  cardPressed: {
    transform: [{ scale: 0.99 }],
    opacity: 0.95,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: Spacing.sm,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.round,
    borderWidth: 1,
  },
  tierText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.round,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  actionChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
  },
  logoContainer: {
    width: '100%',
    height: 80,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    padding: Spacing.sm,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  sponsorName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 6,
  },
  eventPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EEF2F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.round,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  eventPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
  },
  dotActive: {
    width: 18,
    backgroundColor: Colors.primary,
    borderRadius: Radius.round,
  },
});

export default EventSponsorsRibbon;
