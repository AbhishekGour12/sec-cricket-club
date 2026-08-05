import { Platform } from 'react-native';

export const FontWeights = {
  w300: '300' as const,
  w400: '400' as const,
  w500: '500' as const,
  w600: '600' as const,
  w700: '700' as const,
  w800: '800' as const,
  w900: '900' as const,
};

export const FontFamilies = {
  primary: Platform.select({
    ios: 'System', // Uses SF Pro, matches Inter specs perfectly
    android: 'sans-serif',
    web: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    default: 'sans-serif',
  }),
};

export const FontSizes = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const Typography = {
  heading: {
    fontFamily: FontFamilies.primary,
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.w900,
  },
  subHeading: {
    fontFamily: FontFamilies.primary,
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.w700,
  },
  body: {
    fontFamily: FontFamilies.primary,
    fontSize: FontSizes.base,
    fontWeight: FontWeights.w400,
  },
  caption: {
    fontFamily: FontFamilies.primary,
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.w500,
  },
  button: {
    fontFamily: FontFamilies.primary,
    fontSize: FontSizes.base,
    fontWeight: FontWeights.w700,
  },
} as const;

export default Typography;
