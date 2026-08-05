import { Platform } from 'react-native';

export const ThemeConstants = {
  appBarHeight: Platform.select({ ios: 64, android: 56, default: 56 }),
  tabBarHeight: Platform.select({ ios: 88, android: 60, default: 60 }),
  maxContentWidth: 800,
  isIOS: Platform.OS === 'ios',
  isAndroid: Platform.OS === 'android',
} as const;

export default ThemeConstants;
