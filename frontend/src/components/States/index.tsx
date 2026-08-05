import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { Colors, Typography, Spacing, ThemeIcon, IconName } from '@/theme';
import { OutlineButton } from '@/components/Button';

// Loading Component
interface LoadingComponentProps {
  message?: string;
  style?: ViewStyle;
}

export const LoadingComponent: React.FC<LoadingComponentProps> = ({
  message = 'Loading...',
  style,
}) => {
  return (
    <View style={[styles.centerContainer, style]}>
      <ActivityIndicator size="large" color={Colors.secondary} />
      {message && <Text style={styles.loadingText}>{message}</Text>}
    </View>
  );
};

// Empty State Component
interface EmptyStateProps {
  title: string;
  description: string;
  icon?: IconName;
  actionLabel?: string;
  onActionPress?: () => void;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon = 'info',
  actionLabel,
  onActionPress,
  style,
}) => {
  return (
    <View style={[styles.centerContainer, styles.padded, style]}>
      <View style={styles.iconCircle}>
        <ThemeIcon name={icon} size={36} color={Colors.text.outline} />
      </View>
      <Text style={styles.titleText}>{title}</Text>
      <Text style={styles.descriptionText}>{description}</Text>
      {actionLabel && onActionPress && (
        <OutlineButton
          title={actionLabel}
          onPress={onActionPress}
          style={styles.actionButton}
        />
      )}
    </View>
  );
};

// Error State Component
interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  style?: ViewStyle;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
  style,
}) => {
  return (
    <View style={[styles.centerContainer, styles.padded, style]}>
      <View style={[styles.iconCircle, styles.errorIconCircle]}>
        <ThemeIcon name="error" size={36} color={Colors.error} />
      </View>
      <Text style={[styles.titleText, styles.errorTitleText]}>{title}</Text>
      <Text style={styles.descriptionText}>{message}</Text>
      {onRetry && (
        <OutlineButton
          title="Retry"
          onPress={onRetry}
          style={styles.actionButton}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  padded: {
    paddingHorizontal: Spacing.massive,
    paddingVertical: Spacing.huge,
  },
  loadingText: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: Spacing.md,
    fontWeight: '600',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(122, 133, 160, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  errorIconCircle: {
    backgroundColor: 'rgba(211, 47, 47, 0.1)',
  },
  titleText: {
    ...Typography.subHeading,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  errorTitleText: {
    color: Colors.error,
  },
  descriptionText: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  actionButton: {
    minWidth: 120,
    height: 40,
  },
});
