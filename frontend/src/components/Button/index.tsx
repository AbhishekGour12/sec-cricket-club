import React from 'react';
import {
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Pressable,
  StyleProp,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadows, ThemeIcon, IconName } from '@/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: IconName;
  rightIcon?: IconName;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const PrimaryButton: React.FC<ButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  style,
  textStyle,
}) => {
  return (
    <Pressable
      onPress={!disabled && !loading ? onPress : undefined}
      style={({ pressed }) => [
        styles.base,
        styles.primary,
        pressed && styles.primaryPressed,
        disabled && styles.disabled,
        style,
      ]}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#FFFFFF" />
      ) : (
        <>
          {leftIcon && (
            <ThemeIcon
              name={leftIcon}
              size={18}
              color="#FFFFFF"
              style={styles.leftIcon}
            />
          )}
          <Text style={[styles.text, styles.textWhite, textStyle]}>{title}</Text>
          {rightIcon && (
            <ThemeIcon
              name={rightIcon}
              size={18}
              color="#FFFFFF"
              style={styles.rightIcon}
            />
          )}
        </>
      )}
    </Pressable>
  );
};

export const SecondaryButton: React.FC<ButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  style,
  textStyle,
}) => {
  return (
    <Pressable
      onPress={!disabled && !loading ? onPress : undefined}
      style={({ pressed }) => [
        styles.base,
        styles.secondary,
        pressed && styles.secondaryPressed,
        disabled && styles.disabled,
        style,
      ]}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#FFFFFF" />
      ) : (
        <>
          {leftIcon && (
            <ThemeIcon
              name={leftIcon}
              size={18}
              color="#FFFFFF"
              style={styles.leftIcon}
            />
          )}
          <Text style={[styles.text, styles.textWhite, textStyle]}>{title}</Text>
          {rightIcon && (
            <ThemeIcon
              name={rightIcon}
              size={18}
              color="#FFFFFF"
              style={styles.rightIcon}
            />
          )}
        </>
      )}
    </Pressable>
  );
};

export const GlassButton: React.FC<ButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  style,
  textStyle,
}) => {
  return (
    <Pressable
      onPress={!disabled && !loading ? onPress : undefined}
      style={({ pressed }) => [
        styles.base,
        styles.glass,
        pressed && styles.glassPressed,
        disabled && styles.disabled,
        style,
      ]}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color={Colors.primary} />
      ) : (
        <>
          {leftIcon && (
            <ThemeIcon
              name={leftIcon}
              size={18}
              color={Colors.primary}
              style={styles.leftIcon}
            />
          )}
          <Text style={[styles.text, styles.textPrimary, textStyle]}>{title}</Text>
          {rightIcon && (
            <ThemeIcon
              name={rightIcon}
              size={18}
              color={Colors.primary}
              style={styles.rightIcon}
            />
          )}
        </>
      )}
    </Pressable>
  );
};

export const OutlineButton: React.FC<ButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  style,
  textStyle,
}) => {
  return (
    <Pressable
      onPress={!disabled && !loading ? onPress : undefined}
      style={({ pressed }) => [
        styles.base,
        styles.outline,
        pressed && styles.outlinePressed,
        disabled && styles.disabled,
        style,
      ]}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color={Colors.primary} />
      ) : (
        <>
          {leftIcon && (
            <ThemeIcon
              name={leftIcon}
              size={18}
              color={Colors.primary}
              style={styles.leftIcon}
            />
          )}
          <Text style={[styles.text, styles.textPrimary, textStyle]}>{title}</Text>
          {rightIcon && (
            <ThemeIcon
              name={rightIcon}
              size={18}
              color={Colors.primary}
              style={styles.rightIcon}
            />
          )}
        </>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.xl,
    marginVertical: Spacing.sm,
  },
  primary: {
    backgroundColor: Colors.primary,
    ...Shadows.sm,
  },
  primaryPressed: {
    backgroundColor: Colors.primaryPressed,
  },
  secondary: {
    backgroundColor: Colors.secondary,
    ...Shadows.sm,
  },
  secondaryPressed: {
    backgroundColor: Colors.secondaryPressed,
  },
  glass: {
    backgroundColor: 'rgba(208, 216, 238, 0.4)', // transparent container-like tint
    borderWidth: 1,
    borderColor: 'rgba(26, 39, 68, 0.15)',
  },
  glassPressed: {
    backgroundColor: 'rgba(208, 216, 238, 0.6)',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  outlinePressed: {
    backgroundColor: 'rgba(26, 39, 68, 0.05)',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    ...Typography.button,
    textAlign: 'center',
  },
  textWhite: {
    color: '#FFFFFF',
  },
  textPrimary: {
    color: Colors.primary,
  },
  leftIcon: {
    marginRight: Spacing.sm,
  },
  rightIcon: {
    marginLeft: Spacing.sm,
  },
});
