import { Platform } from 'react-native';
import { Colors } from './colors';

export const Shadows = {
  sm: Platform.select({
    ios: {
      shadowColor: Colors.primary,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
    },
    android: {
      elevation: 2,
    },
    web: {
      boxShadow: `0 1px 3px rgba(26, 39, 68, 0.1)`,
    },
    default: {},
  }),
  md: Platform.select({
    ios: {
      shadowColor: Colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
    },
    android: {
      elevation: 5,
    },
    web: {
      boxShadow: `0 4px 8px rgba(26, 39, 68, 0.15)`,
    },
    default: {},
  }),
  lg: Platform.select({
    ios: {
      shadowColor: Colors.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
    },
    android: {
      elevation: 8,
    },
    web: {
      boxShadow: `0 8px 16px rgba(26, 39, 68, 0.2)`,
    },
    default: {},
  }),
} as const;

export default Shadows;
