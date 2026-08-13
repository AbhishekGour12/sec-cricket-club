import React from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { Colors, Typography, Spacing, Radius, ThemeIcon, IconName } from '@/theme';

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  actionIcon?: IconName;
  onActionPress?: () => void;
  style?: ViewStyle;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  actionLabel,
  actionIcon,
  onActionPress,
  style,
}) => {
  const iconName: IconName = actionIcon || (actionLabel?.toLowerCase() === 'edit' ? 'edit' : 'chevronRight');

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>{title}</Text>
      {actionLabel && onActionPress && (
        <Pressable
          onPress={onActionPress}
          style={({ pressed }) => [styles.actionPressable, pressed && styles.actionPressed]}
          accessibilityRole="button"
          hitSlop={8}
        >
          <View style={styles.actionSurface}>
            <ThemeIcon name={iconName} size={14} color="#C41230" />
            <Text style={styles.actionText}>{actionLabel}</Text>
          </View>
        </Pressable>
      )}
    </View>
  );
};

interface DividerProps {
  style?: ViewStyle;
}

export const Divider: React.FC<DividerProps> = ({ style }) => {
  return <View style={[styles.divider, style]} />;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: Spacing.md,
    width: '100%',
  },
  title: {
    ...Typography.heading,
    fontSize: 18,
    color: Colors.primary,
    flexShrink: 1,
  },
  actionPressable: {
    flexShrink: 0,
  },
  actionPressed: {
    opacity: 0.75,
  },
  actionSurface: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    backgroundColor: '#F9D0D7',
  },
  actionText: {
    ...Typography.button,
    fontWeight: '700',
    fontSize: 13,
    color: '#C41230',
    marginLeft: 4,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(122, 133, 160, 0.15)',
    width: '100%',
    marginVertical: Spacing.sm,
  },
});

