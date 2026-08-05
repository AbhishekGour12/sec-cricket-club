import React from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInputProps,
  Pressable,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, ThemeIcon, IconName } from '@/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: IconName;
  rightIcon?: IconName;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  inputStyle,
  placeholderTextColor,
  ...props
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputWrapper,
          props.multiline ? { height: 'auto', minHeight: 90, alignItems: 'flex-start', paddingVertical: Spacing.sm } : null,
          error ? styles.inputErrorBorder : styles.inputNormalBorder,
        ]}
      >
        {leftIcon && (
          <ThemeIcon
            name={leftIcon}
            size={20}
            color={Colors.text.outline}
            style={styles.leftIcon}
          />
        )}
        <TextInput
          style={[styles.textInput, inputStyle]}
          placeholderTextColor={placeholderTextColor || Colors.text.outline}
          {...props}
        />
        {rightIcon && (
          <Pressable onPress={onRightIconPress}>
            <ThemeIcon
              name={rightIcon}
              size={20}
              color={Colors.text.outline}
              style={styles.rightIcon}
            />
          </Pressable>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

interface SearchBarProps extends Omit<TextInputProps, 'onChangeText'> {
  value: string;
  onChangeText: (text: string) => void;
  onClear?: () => void;
  containerStyle?: ViewStyle;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  onClear,
  containerStyle,
  ...props
}) => {
  return (
    <View style={[styles.searchContainer, containerStyle]}>
      <ThemeIcon
        name="search"
        size={20}
        color={Colors.text.outline}
        style={styles.leftIcon}
      />
      <TextInput
        style={styles.searchTextInput}
        value={value}
        onChangeText={onChangeText}
        placeholder="Search..."
        placeholderTextColor={Colors.text.outline}
        clearButtonMode="never"
        autoCapitalize="none"
        {...props}
      />
      {value.length > 0 && (
        <Pressable
          onPress={() => {
            onChangeText('');
            if (onClear) onClear();
          }}
        >
          <ThemeIcon
            name="close"
            size={18}
            color={Colors.text.secondary}
            style={styles.rightIcon}
          />
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.sm,
    width: '100%',
  },
  label: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '700',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    height: 52,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
  },
  inputNormalBorder: {
    borderWidth: 1,
    borderColor: 'rgba(122, 133, 160, 0.3)',
  },
  inputErrorBorder: {
    borderWidth: 1,
    borderColor: Colors.error,
  },
  textInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.text.primary,
    paddingVertical: 0, // fix Android centering
    height: '100%',
  },
  leftIcon: {
    marginRight: Spacing.sm,
  },
  rightIcon: {
    marginLeft: Spacing.sm,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    height: 48,
    borderRadius: Radius.xl, // MD3 rounded pills
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(122, 133, 160, 0.2)',
  },
  searchTextInput: {
    flex: 1,
    ...Typography.body,
    fontSize: 15,
    color: Colors.text.primary,
    paddingVertical: 0,
    height: '100%',
  },
});
