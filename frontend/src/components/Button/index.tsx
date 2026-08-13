import React from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Pressable,
  StyleProp,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, ThemeIcon, IconName } from '@/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: IconName;
  rightIcon?: IconName;
  variant?: 'solid' | 'outline' | 'tint';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

const ButtonContent = ({
  title,
  leftIcon,
  rightIcon,
  iconColor,
  iconBgColor,
  textStyle,
}: {
  title: string;
  leftIcon?: IconName;
  rightIcon?: IconName;
  iconColor: string;
  iconBgColor?: string;
  textStyle: StyleProp<TextStyle>;
}) => (
  <View style={styles.content}>
    {leftIcon ? (
      iconBgColor ? (
        <View style={[styles.iconBadge, { backgroundColor: iconBgColor }]}>
          <ThemeIcon name={leftIcon} size={18} color={iconColor} />
        </View>
      ) : (
        <ThemeIcon name={leftIcon} size={18} color={iconColor} />
      )
    ) : null}
    <Text style={textStyle}>{title}</Text>
    {rightIcon ? (
      <ThemeIcon name={rightIcon} size={18} color={iconColor} />
    ) : null}
  </View>
);

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
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
      disabled={disabled || loading}
      accessibilityRole="button"
    >
      {loading ? (
        <ActivityIndicator size="small" color="#FFFFFF" />
      ) : (
        <ButtonContent
          title={title}
          leftIcon={leftIcon}
          rightIcon={rightIcon}
          iconColor="#FFFFFF"
          textStyle={[styles.text, styles.textWhite, textStyle]}
        />
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
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
      disabled={disabled || loading}
      accessibilityRole="button"
    >
      {loading ? (
        <ActivityIndicator size="small" color="#FFFFFF" />
      ) : (
        <ButtonContent
          title={title}
          leftIcon={leftIcon}
          rightIcon={rightIcon}
          iconColor="#FFFFFF"
          textStyle={[styles.text, styles.textWhite, textStyle]}
        />
      )}
    </Pressable>
  );
};

export const DangerButton: React.FC<ButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  leftIcon = 'logout',
  rightIcon,
  variant = 'solid',
  style,
  textStyle,
}) => {
  const isTint = variant === 'tint';
  const isOutline = variant === 'outline';

  const getContainerStyle = (pressed: boolean) => {
    if (isTint) {
      return [styles.dangerTint, pressed && styles.dangerTintPressed];
    }
    if (isOutline) {
      return [styles.dangerOutline, pressed && styles.dangerOutlinePressed];
    }
    return [styles.dangerSolid, pressed && styles.pressed];
  };

  const getTextColor = () => {
    if (isTint || isOutline) return '#C41230';
    return '#FFFFFF';
  };

  return (
    <Pressable
      onPress={!disabled && !loading ? onPress : undefined}
      style={({ pressed }) => [
        styles.base,
        ...getContainerStyle(pressed),
        disabled && styles.disabled,
        style,
      ]}
      disabled={disabled || loading}
      accessibilityRole="button"
    >
      {loading ? (
        <ActivityIndicator size="small" color={getTextColor()} />
      ) : (
        <ButtonContent
          title={title}
          leftIcon={leftIcon}
          rightIcon={rightIcon}
          iconColor={getTextColor()}
          textStyle={[styles.text, { color: getTextColor() }, textStyle]}
        />
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
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
      disabled={disabled || loading}
      accessibilityRole="button"
    >
      {loading ? (
        <ActivityIndicator size="small" color={Colors.primary} />
      ) : (
        <ButtonContent
          title={title}
          leftIcon={leftIcon}
          rightIcon={rightIcon}
          iconColor={Colors.primary}
          iconBgColor="rgba(26, 39, 68, 0.1)"
          textStyle={[styles.text, styles.textPrimary, textStyle]}
        />
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
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
      disabled={disabled || loading}
      accessibilityRole="button"
    >
      {loading ? (
        <ActivityIndicator size="small" color={Colors.primary} />
      ) : (
        <ButtonContent
          title={title}
          leftIcon={leftIcon}
          rightIcon={rightIcon}
          iconColor={Colors.primary}
          iconBgColor="rgba(26, 39, 68, 0.08)"
          textStyle={[styles.text, styles.textPrimary, textStyle]}
        />
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.xl,
    marginVertical: Spacing.sm,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  iconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: '#1A2744',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  secondary: {
    backgroundColor: Colors.secondary,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  dangerSolid: {
    backgroundColor: Colors.secondary,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  dangerTint: {
    backgroundColor: '#FFF0F2',
    borderWidth: 1.5,
    borderColor: 'rgba(196, 18, 48, 0.3)',
  },
  dangerTintPressed: {
    backgroundColor: '#FDE2E6',
    transform: [{ scale: 0.985 }],
  },
  dangerOutline: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: Colors.secondary,
  },
  dangerOutlinePressed: {
    backgroundColor: '#FFF0F2',
    transform: [{ scale: 0.985 }],
  },
  glass: {
    backgroundColor: 'rgba(208, 216, 238, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(26, 39, 68, 0.15)',
  },
  outline: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    ...Typography.button,
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 15,
  },
  textWhite: {
    color: '#FFFFFF',
  },
  textPrimary: {
    color: Colors.primary,
  },
});

