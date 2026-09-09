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
      toValue: 0.15,
      duration: 120,
      useNativeDriver: true,
    }).start(() => {
      setCurrentIndex(nextIdx);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 160,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleNext = () => {
    const next = (currentIndex + 1) % totalCount;
    animateToNext(next);
  };

  // Auto-slide loop every 3 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      if (isPausedRef.current) return;
      handleNext();
    }, 3000);

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
      Linking.openURL(currentSponsor.website).catch(() => { });
    }
  };

  return (
    <View style={styles.container}>
      {/* Compact Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.ribbonBadge}>
          <View style={styles.livePulseDot} />
          <Text style={styles.ribbonBadgeText}>OFFICIAL PARTNER</Text>
        </View>

        <View style={styles.counterPill}>
          <MaterialIcons name="star" size={11} color="#B45309" />
          <Text style={styles.counterText}>
            {currentIndex + 1}/{totalCount}
          </Text>
        </View>
      </View>

      {/* Fully Centered Sponsor Banner Item */}
      <Animated.View
        style={[
          styles.cardAnimatedWrap,
          { opacity: fadeAnim },
        ]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.card,
            { borderTopColor: currentSponsor.topColor, borderTopWidth: 3 },
            pressed && styles.cardPressed,
          ]}
          onPress={handleCardPress}
          onPressIn={() => {
            isPausedRef.current = true;
          }}
          onPressOut={() => {
            setTimeout(() => {
              isPausedRef.current = false;
            }, 2500);
          }}
        >
          {/* Centered Tier Badge */}
          <View
            style={[
              styles.tierBadge,
              {
                backgroundColor: currentSponsor.badgeBg,
                borderColor: currentSponsor.badgeBorder,
              },
            ]}
          >
            <MaterialIcons name="star" size={10} color={currentSponsor.accentColor} />
            <Text style={[styles.tierText, { color: currentSponsor.badgeText }]}>
              {currentSponsor.tierLabel}
            </Text>
          </View>

          {/* Centered Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={currentSponsor.logo}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          {/* Centered Sponsor Name */}
          <Text style={styles.sponsorName} numberOfLines={1}>
            {currentSponsor.name}
          </Text>

          {/* Centered Event Pill */}
          <View style={styles.eventPill}>
            <MaterialIcons name="sports-cricket" size={11} color="#64748B" />
            <Text style={styles.eventPillText} numberOfLines={1}>
              {currentSponsor.eventName}
            </Text>
          </View>
        </Pressable>
      </Animated.View>

      {/* Compact Indicator Dots */}
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
    marginVertical: 6,
    backgroundColor: 'transparent',
    paddingVertical: 2,
    paddingHorizontal: 0,
  },
  headerRow: {
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  ribbonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.round,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  livePulseDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#10B981',
  },
  ribbonBadgeText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.6,
  },
  counterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.round,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  counterText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#92400E',
  },
  cardAnimatedWrap: {
    width: '100%',
  },
  card: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
    ...Shadows.sm,
  },
  cardPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.99 }],
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.round,
    borderWidth: 1,
  },
  tierText: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  logoContainer: {
    width: 100,
    height: 52,
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    marginVertical: 4,
  },
  logoImage: {
    width: '100%',
    height: '100%',
    alignSelf: 'center',
  },
  sponsorName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  eventPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: Radius.round,
  },
  eventPillText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  dot: {
    width: 4.5,
    height: 4.5,
    borderRadius: 2.25,
    backgroundColor: '#CBD5E1',
  },
  dotActive: {
    width: 12,
    backgroundColor: Colors.primary,
    borderRadius: Radius.round,
  },
});

export default EventSponsorsRibbon;
