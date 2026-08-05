import { Platform } from 'react-native';
import { Colors, ThemeConstants } from '@/theme';

export const TabNavigationStyles = {
  // Height / bottom padding are overridden in (tabs)/_layout with safe-area insets.
  tabBar: {
    backgroundColor: Colors.primary,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    borderTopWidth: 1,
    height: ThemeConstants.tabBarHeight,
    paddingBottom: 8,
    paddingTop: 8,
    elevation: 8,
    shadowColor: Colors.primaryPressed,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  activeTintColor: Colors.secondary,
  inactiveTintColor: Colors.text.outline,
  labelStyle: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontWeight: '700' as const,
    fontSize: 10,
  },
};

export default TabNavigationStyles;
