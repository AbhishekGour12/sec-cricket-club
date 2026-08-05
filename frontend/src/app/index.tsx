import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, DarkSurface } from '@/theme';
import { useAuthStore } from '../store/authStore';
import { LogoBadge } from '@/components/SecLogo';
import { DotPatternBackground } from '@/components/DotPatternBackground';

export default function SplashScreen() {
  const router = useRouter();
  const { restoreSession } = useAuthStore();

  const [fadeAnim] = React.useState(() => new Animated.Value(0));
  const [scaleAnim] = React.useState(() => new Animated.Value(0.9));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    const checkSession = async () => {
      const startTime = Date.now();
      const hasSession = await restoreSession();

      const elapsed = Date.now() - startTime;
      const delay = Math.max(0, 2500 - elapsed);

      setTimeout(() => {
        if (hasSession) {
          const user = useAuthStore.getState().user;
          if (user && !user.is_profile_completed) {
            router.replace('/profile-completion');
          } else {
            router.replace('/(tabs)/home');
          }
        } else {
          router.replace('/login');
        }
      }, delay);
    };

    checkSession();
  }, [router, restoreSession, fadeAnim, scaleAnim]);

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[DarkSurface.backgroundGradient[0], DarkSurface.background, DarkSurface.backgroundDeep]}
        style={StyleSheet.absoluteFill}
      />
      <DotPatternBackground />

      <SafeAreaView style={styles.container}>
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <LogoBadge size={180} />
          <Text style={styles.taglineRed}>LUDHIANA&apos;S ELITE ALLIANCE</Text>
          <Text style={styles.titleLine}>SPORTS</Text>
          <Text style={styles.titleLine}>ENTERTAINMENT</Text>
          <Text style={styles.titleClub}>CLUB</Text>
          <Text style={styles.subtitle}>Together We Play, Together We Win</Text>
        </Animated.View>

        <View style={styles.bottomSection}>
          <ActivityIndicator size="large" color={Colors.secondary} />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: DarkSurface.background,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.massive,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  taglineRed: {
    fontFamily: Typography.caption.fontFamily,
    color: Colors.secondary,
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 3.5,
    textTransform: 'uppercase',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  titleLine: {
    fontFamily: Typography.heading.fontFamily,
    fontSize: 28,
    color: '#FFFFFF',
    letterSpacing: 1,
    textAlign: 'center',
    fontWeight: '900',
    lineHeight: 34,
    textTransform: 'uppercase',
  },
  titleClub: {
    fontFamily: Typography.heading.fontFamily,
    fontSize: 28,
    color: '#FFFFFF',
    letterSpacing: 12,
    textAlign: 'center',
    fontWeight: '300',
    marginTop: 2,
    lineHeight: 38,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontFamily: Typography.caption.fontFamily,
    fontSize: 11,
    color: DarkSurface.textSecondary,
    marginTop: Spacing.md,
    textAlign: 'center',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  bottomSection: {
    paddingBottom: Spacing.xl,
  },
});
