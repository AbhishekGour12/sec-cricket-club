import React, { useState, useEffect, useCallback } from 'react';
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
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import { GoogleAuthProvider, OAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth as firebaseAuth } from '../config/firebase';
import { useAuth } from '../hooks/useAuth';
import { UserProfile } from '../services/authApi';
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

const PRIVACY_POLICY_URL =
  process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL || 'https://sec-cricket-club.onrender.com/privacy';
const TERMS_URL =
  process.env.EXPO_PUBLIC_TERMS_URL || 'https://sec-cricket-club.onrender.com/terms';

GoogleSignin.configure({
  webClientId: WEB_CLIENT_ID,
  iosClientId: IOS_CLIENT_ID,
  offlineAccess: false,
  forceCodeForRefreshToken: false,
});

function yieldToPaint() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => setTimeout(resolve, 0));
  });
}

function extractGoogleIdToken(signInResult: {
  data?: { idToken?: string | null } | null;
  idToken?: string;
}): string | null {
  return signInResult.data?.idToken || signInResult.idToken || null;
}

let playServicesReady = false;

async function warmGoogleSignIn(): Promise<void> {
  if (Platform.OS !== 'android' || playServicesReady) return;
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: false });
    playServicesReady = true;
  } catch {
    // Play Services unavailable — signIn will surface the error.
  }
}

const SILENT_SIGN_IN_MS = 1500;

async function trySilentGoogleToken(): Promise<string | null> {
  try {
    const silent = await Promise.race([
      GoogleSignin.signInSilently(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('silent-sign-in-timeout')), SILENT_SIGN_IN_MS),
      ),
    ]);
    if (silent.type === 'success') {
      return extractGoogleIdToken(silent);
    }
  } catch {
    // Silent sign-in unavailable — use interactive picker.
  }
  return null;
}

/** Fast path: silent cached session, otherwise one interactive Google sign-in. */
async function getGoogleIdToken(): Promise<string> {
  const silentToken = await trySilentGoogleToken();
  if (silentToken) return silentToken;

  const signInResult = await GoogleSignin.signIn();
  if (signInResult.type === 'cancelled') {
    throw new Error('SIGN_IN_CANCELLED');
  }
  const idToken = extractGoogleIdToken(signInResult);
  if (!idToken) {
    throw new Error('Google Sign-In failed: No ID Token returned.');
  }
  return idToken;
}

function isRejectedAuthError(err: unknown): boolean {
  const status = (err as { response?: { status?: number } })?.response?.status;
  return status === 401 || status === 400;
}

async function authenticateWithBackend(
  login: (token: string) => Promise<UserProfile>,
  idToken: string,
): Promise<UserProfile> {
  try {
    return await login(idToken);
  } catch (directErr) {
    // Only retry with Firebase when backend explicitly rejects the Google token.
    // Never fall back on timeout/network errors — that was adding ~15+ extra seconds.
    if (!isRejectedAuthError(directErr)) {
      throw directErr;
    }

    console.log('[PERF] Backend rejected Google token, retrying with Firebase token');
    const credential = GoogleAuthProvider.credential(idToken);
    const firebaseUserCredential = await signInWithCredential(firebaseAuth, credential);
    const firebaseIdToken = await firebaseUserCredential.user.getIdToken();
    return login(firebaseIdToken);
  }
}

const SUCCESS_VISIBLE_MS = 700;

export default function LoginScreen() {
  const router = useRouter();
  const { login, error } = useAuth();
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('Signing in...');

  useEffect(() => {
    void warmGoogleSignIn();
  }, []);

  const navigateAfterLogin = useCallback(
    (userRes: UserProfile) => {
      if (userRes && !userRes.is_profile_completed) {
        router.replace('/profile-completion');
      } else {
        router.replace('/(tabs)/home');
      }
    },
    [router],
  );

  const finishLogin = useCallback(
    async (userRes: UserProfile) => {
      const welcomeName = userRes.full_name?.trim() || userRes.email?.split('@')[0] || 'Member';
      setLoginSuccess(`Welcome, ${welcomeName}!`);
      setStatusMessage('Login successful');
      setIsSigningIn(false);
      await new Promise((resolve) => setTimeout(resolve, SUCCESS_VISIBLE_MS));
      navigateAfterLogin(userRes);
    },
    [navigateAfterLogin],
  );

  const handleGoogleLogin = async () => {
    if (isSigningIn || loginSuccess) return;
    setLoginError(null);
    setLoginSuccess(null);
    setIsSigningIn(true);
    setStatusMessage('Connecting to Google...');
    const startMs = Date.now();
    await yieldToPaint();

    try {
      const t1 = Date.now();
      const idToken = await getGoogleIdToken();
      console.log(`[PERF] 1. Google Sign-In took: ${(Date.now() - t1) / 1000}s`);

      setStatusMessage('Verifying account...');
      const t2 = Date.now();
      const userRes = await authenticateWithBackend(login, idToken);
      console.log(`[PERF] 2. Backend auth took: ${(Date.now() - t2) / 1000}s`);
      console.log(`[PERF] ✅ TOTAL Google Login Flow: ${(Date.now() - startMs) / 1000}s`);

      await finishLogin(userRes);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to authenticate with Google.';
      console.error('Google Auth Login failed:', err);

      if (message.includes('SIGN_IN_CANCELLED') || message.includes('developer_error')) {
        setLoginError('Login was cancelled or misconfigured.');
      } else {
        setLoginError(message || 'Failed to authenticate with Google. Please try again.');
      }
      setIsSigningIn(false);
      setLoginSuccess(null);
      setStatusMessage('Signing in...');
    }
  };

  const handleAppleLogin = async () => {
    if (isSigningIn || loginSuccess) return;
    setLoginError(null);
    setLoginSuccess(null);
    setIsSigningIn(true);
    setStatusMessage('Connecting to Apple...');
    await yieldToPaint();

    try {
      const credentialResult = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credentialResult.identityToken) {
        throw new Error('Apple Sign-In failed: No identity token returned.');
      }

      setStatusMessage('Verifying account...');
      const provider = new OAuthProvider('apple.com');
      const credential = provider.credential({
        idToken: credentialResult.identityToken,
      });

      const firebaseUserCredential = await signInWithCredential(firebaseAuth, credential);
      const firebaseIdToken = await firebaseUserCredential.user.getIdToken();
      const userRes = await login(firebaseIdToken);

      await finishLogin(userRes);
    } catch (err: unknown) {
      if ((err as { code?: string })?.code === 'ERR_REQUEST_CANCELED') {
        setLoginError('Apple Sign-In was cancelled.');
      } else {
        const message = err instanceof Error ? err.message : 'Failed to authenticate with Apple.';
        console.error('Apple Auth Login failed:', err);
        setLoginError(message || 'Failed to authenticate with Apple. Please try again.');
      }
      setIsSigningIn(false);
      setLoginSuccess(null);
      setStatusMessage('Signing in...');
    }
  };

  const openPrivacyPolicy = () => {
    router.push('/privacy' as any);
  };

  const openTermsOfService = () => {
    router.push('/terms' as any);
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
            {Platform.OS === 'ios' && (
              <View style={styles.appleButtonWrapper}>
                <AppleAuthentication.AppleAuthenticationButton
                  buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
                  buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
                  cornerRadius={27}
                  style={styles.appleButton}
                  onPress={handleAppleLogin}
                />
              </View>
            )}

            <Pressable
              onPress={handleGoogleLogin}
              disabled={isSigningIn}
              style={styles.googleButtonWrapper}
            >
              {({ pressed }) => (
                <LinearGradient
                  colors={pressed ? ['#9E0E27', '#C41230'] : ['#E61E43', '#C41230']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[
                    styles.googleButton,
                    isSigningIn && styles.googleButtonDisabled,
                  ]}
                >
                  {isSigningIn ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <FontAwesome name="google" size={18} color="#FFFFFF" style={styles.googleIcon} />
                      <Text style={styles.googleButtonText}>CONTINUE WITH GOOGLE</Text>
                    </>
                  )}
                </LinearGradient>
              )}
            </Pressable>

            {(error || loginError) && (
              <Text style={styles.errorText}>{error || loginError}</Text>
            )}
          </View>

          <View style={styles.policyRow}>
            <Pressable onPress={openPrivacyPolicy} hitSlop={8}>
              <Text style={styles.policyLink}>Privacy Policy</Text>
            </Pressable>
            <Text style={styles.policyDot}>•</Text>
            <Pressable onPress={openTermsOfService} hitSlop={8}>
              <Text style={styles.policyLink}>Terms of Service</Text>
            </Pressable>
          </View>

          <Text style={styles.prestigeFooter}>PRESTIGE  •  COMMUNITY  •  LEGACY</Text>
        </View>
      </SafeAreaView>

      {isSigningIn || loginSuccess ? (
        <View style={styles.loadingOverlay} pointerEvents="auto">
          {loginSuccess ? (
            <>
              <View style={styles.successIconCircle}>
                <FontAwesome name="check" size={32} color="#FFFFFF" />
              </View>
              <Text style={styles.successTitle}>Login Successful</Text>
              <Text style={styles.successSubtitle}>{loginSuccess}</Text>
            </>
          ) : (
            <>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={styles.loadingOverlayText}>{statusMessage}</Text>
            </>
          )}
        </View>
      ) : null}
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
  appleButtonWrapper: {
    width: '100%',
    marginBottom: Spacing.md,
  },
  appleButton: {
    width: '100%',
    height: 54,
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
  policyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  policyLink: {
    fontFamily: Typography.caption.fontFamily,
    color: DarkSurface.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  policyDot: {
    color: DarkSurface.textMuted,
    fontSize: 12,
  },
  prestigeFooter: {
    fontFamily: Typography.caption.fontFamily,
    color: DarkSurface.textMuted,
    fontSize: 10,
    letterSpacing: 2.5,
    fontWeight: '700',
    textAlign: 'center',
    textTransform: 'uppercase',
    marginTop: Spacing.md,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  loadingOverlayText: {
    fontFamily: Typography.caption.fontFamily,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 1.4,
    marginTop: Spacing.md,
    textTransform: 'uppercase',
  },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  successTitle: {
    fontFamily: Typography.heading.fontFamily,
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 22,
    letterSpacing: 0.5,
  },
  successSubtitle: {
    fontFamily: Typography.body.fontFamily,
    color: 'rgba(255, 255, 255, 0.88)',
    fontSize: 14,
    marginTop: Spacing.sm,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
});
