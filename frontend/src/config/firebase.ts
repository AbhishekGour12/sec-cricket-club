import { initializeApp } from 'firebase/app';
// @ts-expect-error getReactNativePersistence has incorrect typescript definition in standard exports but is valid in react-native runtime
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Public Firebase client config (same values as google-services / GoogleService-Info).
// Ignore a web App ID override on native so iOS/Android keep their platform apps.
const envAppId = process.env.EXPO_PUBLIC_FIREBASE_APP_ID;
const nativeAppId =
  Platform.OS === 'ios'
    ? '1:837780082237:ios:a25e66d808dc7f4f9f2454'
    : '1:837780082237:android:7086e0fe585fa2119f2454';

const firebaseConfig = {
  apiKey:
    process.env.EXPO_PUBLIC_FIREBASE_API_KEY ||
    (Platform.OS === 'ios'
      ? 'AIzaSyB3R_kvHr8-1wtOEdHGWeyxKoVXwXDlDdY'
      : 'AIzaSyBtlGkE4uMmb8bc7znx_tFtdCUN0ftt9jM'),
  authDomain:
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'sec-cricket-club.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'sec-cricket-club',
  storageBucket:
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'sec-cricket-club.firebasestorage.app',
  messagingSenderId:
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '837780082237',
  appId:
    Platform.OS === 'web'
      ? envAppId || '1:837780082237:web:831a184b6879cbe99f2454'
      : envAppId && !envAppId.includes(':web:')
        ? envAppId
        : nativeAppId,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);

export const auth =
  Platform.OS === 'web'
    ? getAuth(app)
    : initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });

export default app;
