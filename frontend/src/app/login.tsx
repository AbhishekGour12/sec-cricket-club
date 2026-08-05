import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, Radius, Glass, DarkSurface } from '@/theme';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth as firebaseAuth } from '../config/firebase';
import { useAuth } from '../hooks/useAuth';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LogoBadge } from '@/components/SecLogo';
import { DotPatternBackground } from '@/components/DotPatternBackground';

// Web (type 3) client is required for idToken; iOS client matches GoogleService-Info.plist.
const WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
  '837780082237-n5fr5566aibc80v5ula2ssljqivuf98t.apps.googleusercontent.com';
const IOS_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ||
  '837780082237-gmj2oqqtv9ek1a4h1pnrnpfjvr59ktnj.apps.googleusercontent.com';

GoogleSignin.configure({
  webClientId: WEB_CLIENT_ID,
  iosClientId: IOS_CLIENT_ID,
  offlineAccess: true,
});

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading, error } = useAuth();
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoginError(null);
    try {
      // Play Services check is Android-only; calling it on iOS can throw.
      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices();
      }

      try {
        await GoogleSignin.signOut();
      } catch {
        // Ignore if no active Google session existed
      }

      const signInResult = await GoogleSignin.signIn();
      const idToken = signInResult.data?.idToken || (signInResult as { idToken?: string }).idToken;

      if (!idToken) {
        throw new Error('Google Sign-In failed: No ID Token returned.');
      }

      const credential = GoogleAuthProvider.credential(idToken);
      const firebaseUserCredential = await signInWithCredential(firebaseAuth, credential);
      const firebaseIdToken = await firebaseUserCredential.user.getIdToken();
      const userRes = await login(firebaseIdToken);

      if (userRes && !userRes.is_profile_completed) {
        router.replace('/profile-completion');
      } else {
        router.replace('/(tabs)/home');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to authenticate with Google.';
      console.error('Google Auth Login failed:', err);

      if (message.includes('SIGN_IN_CANCELLED') || message.includes('developer_error')) {
        setLoginError('Login was cancelled or misconfigured.');
      } else {
        setLoginError(message || 'Failed to authenticate with Google. Please try again.');
      }
    }
  };

  const handleDevBypass = async () => {
    if (!__DEV__) return;
    setLoginError(null);
    try {
      const userRes = await login('mock-member-token');
      if (userRes && !userRes.is_profile_completed) {
        router.replace('/profile-completion');
      } else {
        router.replace('/(tabs)/home');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Mock login bypass failed.';
      setLoginError(message);
    }
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[DarkSurface.backgroundGradient[0], DarkSurface.background, DarkSurface.backgroundDeep]}
        style={StyleSheet.absoluteFill}
      />
      <DotPatternBackground />

      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.estdBadge}>
            <View style={styles.estdDot} />
            <Text style={styles.estdText}>ESTD. 2022</Text>
          </View>
        </View>

        {/* Hero */}
        <View style={styles.heroSection}>
          <Pressable
            onLongPress={handleDevBypass}
            delayLongPress={1500}
            style={styles.logoPressable}
          >
            <LogoBadge size={208} />
          </Pressable>

          <Text style={styles.taglineRed}>LUDHIANA&apos;S ELITE ALLIANCE</Text>

          <Text style={styles.titleLine} numberOfLines={1} adjustsFontSizeToFit>
            SPORTS
          </Text>
          <Text style={styles.titleLine} numberOfLines={1} adjustsFontSizeToFit>
            ENTERTAINMENT
          </Text>
          <Text style={styles.titleClub} numberOfLines={1} adjustsFontSizeToFit>
            CLUB
          </Text>

          <View style={styles.dividerRow}>
            <View style={styles.lineDivider} />
            <View style={styles.dotDividerRed} />
            <View style={styles.lineDivider} />
          </View>

          <Text style={styles.mottoText}>TOGETHER WE PLAY, TOGETHER WE WIN</Text>
        </View>

        {/* Bottom auth card */}
        <View style={styles.bottomSection}>
          <View style={styles.authCard}>
            <Pressable
              onPress={handleGoogleLogin}
              disabled={isLoading}
              style={styles.googleButtonWrapper}
            >
              {({ pressed }) => (
                <LinearGradient
                  colors={pressed ? ['#9E0E27', '#C41230'] : ['#E61E43', '#C41230']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[
                    styles.googleButton,
                    isLoading && styles.googleButtonDisabled,
                  ]}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <FontAwesome name="google" size={18} color="#FFFFFF" style={styles.googleIcon} />
                      <Text style={styles.googleButtonText}>CONTINUE WITH GOOGLE</Text>
                      <Text style={styles.chevron}>{'>'}</Text>
                    </>
                  )}
                </LinearGradient>
              )}
            </Pressable>

            {(error || loginError) && (
              <Text style={styles.errorText}>{error || loginError}</Text>
            )}
          </View>

          <Text style={styles.prestigeFooter}>PRESTIGE  •  COMMUNITY  •  LEGACY</Text>
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
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
  },
  estdBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Glass.fillSubtle,
    borderWidth: 1,
    borderColor: Glass.borderDim,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 7,
    borderRadius: Radius.round,
  },
  estdDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.secondary,
    marginRight: Spacing.sm,
  },
  estdText: {
    fontFamily: Typography.caption.fontFamily,
    color: DarkSurface.textSecondary,
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 2,
    paddingLeft: 2,
  },
  heroSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  logoPressable: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xxl,
  },
  taglineRed: {
    fontFamily: Typography.caption.fontFamily,
    color: '#E8324F',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 3.5,
    paddingLeft: 3.5,
    textAlign: 'center',
    textTransform: 'uppercase',
    marginBottom: Spacing.md,
  },
  titleLine: {
    fontFamily: Typography.heading.fontFamily,
    color: DarkSurface.textPrimary,
    fontSize: 38,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.5,
    paddingLeft: 0.5,
    lineHeight: 44,
    textTransform: 'uppercase',
  },
  titleClub: {
    fontFamily: Typography.heading.fontFamily,
    color: 'rgba(255, 255, 255, 0.88)',
    fontSize: 32,
    fontWeight: '300',
    textAlign: 'center',
    letterSpacing: 14,
    paddingLeft: 14,
    lineHeight: 42,
    textTransform: 'uppercase',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
    width: '52%',
  },
  lineDivider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  dotDividerRed: {
    width: 8,
    height: 8,
    backgroundColor: Colors.secondary,
    transform: [{ rotate: '45deg' }],
    marginHorizontal: Spacing.md,
  },
  mottoText: {
    fontFamily: Typography.caption.fontFamily,
    color: 'rgba(255, 255, 255, 0.92)',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 2,
    paddingLeft: 2,
    lineHeight: 22,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  bottomSection: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  authCard: {
    backgroundColor: Glass.fillSubtle,
    borderWidth: 1,
    borderColor: Glass.borderDim,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  googleButtonWrapper: {
    width: '100%',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
    borderRadius: Radius.round,
    width: '100%',
    paddingHorizontal: Spacing.xl,
  },
  googleButtonDisabled: {
    opacity: 0.6,
  },
  googleIcon: {
    marginRight: Spacing.md,
  },
  googleButtonText: {
    fontFamily: Typography.button.fontFamily,
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 1.2,
    flex: 1,
    textAlign: 'center',
  },
  chevron: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: -Spacing.lg,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.error,
    marginTop: Spacing.md,
    textAlign: 'center',
    fontWeight: '600',
  },
  prestigeFooter: {
    fontFamily: Typography.caption.fontFamily,
    color: DarkSurface.textMuted,
    fontSize: 10,
    letterSpacing: 2.5,
    fontWeight: '700',
    textAlign: 'center',
    textTransform: 'uppercase',
    marginTop: Spacing.lg,
  },
});
