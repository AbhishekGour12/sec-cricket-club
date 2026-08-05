import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0E1525',                 // Primary Text
    background: '#F0F2F7',           // App Background
    backgroundElement: '#FFFFFF',    // Surface Element
    backgroundSelected: '#D0D8EE',   // Selected Element Tint
    textSecondary: '#3A4260',        // Secondary Text
  },
  dark: {
    // In our design system, we fall back to unified colors or dark-tinted Navy surfaces
    text: '#FFFFFF',
    background: '#1A2744',
    backgroundElement: '#111B30',
    backgroundSelected: '#243260',
    textSecondary: '#7A85A0',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'System',
    serif: 'ui-serif',
    rounded: 'System',
    mono: 'System',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'Inter, -apple-system, sans-serif',
    serif: 'Georgia, serif',
    rounded: 'Inter, sans-serif',
    mono: 'monospace',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 48,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
