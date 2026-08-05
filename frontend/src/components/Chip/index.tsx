import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { Colors, Typography, Spacing, Radius } from '@/theme';

interface ChipProps {
  text: string;
  selected?: boolean;
  onPress?: () => void;
  variant?: 'primary' | 'secondary';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Chip: React.FC<ChipProps> = ({
  text,
  selected = false,
  onPress,
  variant = 'primary',
  style,
  textStyle,
}) => {
  const getStyles = () => {
    if (variant === 'secondary') {
      return {
        container: selected ? styles.secondarySelected : styles.secondaryUnselected,
        text: selected ? styles.textWhite : styles.textSecondaryCrimson,
      };
    }
    return {
      container: selected ? styles.primarySelected : styles.primaryUnselected,
      text: selected ? styles.textWhite : styles.textPrimaryNavy,
    };
  };

  const chipStyles = getStyles();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chipBase,
        chipStyles.container,
        pressed && styles.pressed,
        style,
      ]}
      disabled={!onPress}
    >
      <Text style={[styles.textBase, chipStyles.text, textStyle]}>{text}</Text>
    </Pressable>
  );
};

interface BadgeProps {
  text: string | number;
  variant?: 'primary' | 'secondary' | 'error';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  text,
  variant = 'primary',
  style,
  textStyle,
}) => {
  const getBadgeColors = () => {
    switch (variant) {
      case 'secondary':
        return {
          bg: Colors.secondaryContainer,
          border: 'transparent',
          text: Colors.secondary,
        };
      case 'error':
        return {
          bg: 'rgba(211, 47, 47, 0.1)',
          border: Colors.error,
          text: Colors.error,
        };
      default:
        return {
          bg: Colors.primaryContainer,
          border: 'transparent',
          text: Colors.primary,
        };
    }
  };

  const colors = getBadgeColors();

  return (
    <View
      style={[
        styles.badgeBase,
        { backgroundColor: colors.bg, borderColor: colors.border },
        style,
      ]}
    >
      <Text style={[styles.badgeText, { color: colors.text }, textStyle]}>
        {text}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  chipBase: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.xl, // Pill rounded shape
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  primarySelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  primaryUnselected: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(26, 39, 68, 0.3)',
  },
  secondarySelected: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  secondaryUnselected: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(196, 18, 48, 0.3)',
  },
  textBase: {
    ...Typography.caption,
    fontWeight: '700',
  },
  textWhite: {
    color: '#FFFFFF',
  },
  textPrimaryNavy: {
    color: Colors.primary,
  },
  textSecondaryCrimson: {
    color: Colors.secondary,
  },
  pressed: {
    opacity: 0.8,
  },
  badgeBase: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.xs, // Square rounded shape for MD3 badges
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: 'transparent',
  },
  badgeText: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
});
