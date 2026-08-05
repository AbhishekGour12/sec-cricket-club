import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, ThemeIcon, IconName, ThemeConstants } from '@/theme';

interface AppBarProps {
  title: string;
  onBackPress?: () => void;
  rightIcon?: IconName;
  onRightIconPress?: () => void;
  rightAction?: React.ReactNode;
  showDivider?: boolean;
}

export const AppBar: React.FC<AppBarProps> = ({
  title,
  onBackPress,
  rightIcon,
  onRightIconPress,
  rightAction,
  showDivider = false,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          height: ThemeConstants.appBarHeight + insets.top,
        },
        showDivider && styles.divider,
      ]}
    >
      <View style={styles.content}>
        {onBackPress ? (
          <Pressable style={styles.iconButton} onPress={onBackPress}>
            <ThemeIcon name="arrowBack" size={24} color="#FFFFFF" />
          </Pressable>
        ) : (
          <View style={styles.placeholder} />
        )}

        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>

        {rightAction ? (
          <View style={styles.actionContainer}>{rightAction}</View>
        ) : rightIcon && onRightIconPress ? (
          <Pressable style={styles.iconButton} onPress={onRightIconPress}>
            <ThemeIcon name={rightIcon} size={24} color="#FFFFFF" />
          </Pressable>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    width: '100%',
  },
  content: {
    height: ThemeConstants.appBarHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
  },
  title: {
    ...Typography.subHeading,
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
    fontWeight: '800',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionContainer: {
    minWidth: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  placeholder: {
    width: 40,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
});

export default AppBar;
