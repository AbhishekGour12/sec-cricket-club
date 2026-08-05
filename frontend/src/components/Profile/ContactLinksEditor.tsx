import React from 'react';
import { View, Text, StyleSheet, TextInput, Pressable } from 'react-native';
import {
  Colors,
  Typography,
  Spacing,
  Radius,
  Shadows,
  ThemeIcon,
  IconName,
} from '@/theme';
import type { PrivacyField, PrivacySettings } from '../../services/authApi';

export interface ContactLinksValue {
  alternate_phone: string;
  contact_email: string;
  instagram_url: string;
  facebook_url: string;
  linkedin_url: string;
}

interface ContactLinksEditorProps {
  primaryPhone?: string;
  /** Captured in Business Details, shown here only for visibility control. */
  website?: string;
  value: ContactLinksValue;
  privacy: PrivacySettings;
  errors?: Partial<Record<keyof ContactLinksValue, string>>;
  onChange: (field: keyof ContactLinksValue, next: string) => void;
  onPrivacyChange: (field: PrivacyField, next: 'all' | 'hidden') => void;
}

interface FieldConfig {
  key: keyof ContactLinksValue;
  privacyKey: PrivacyField;
  label: string;
  icon: IconName;
  placeholder: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'url';
}

const FIELDS: FieldConfig[] = [
  {
    key: 'alternate_phone',
    privacyKey: 'alternate_phone',
    label: 'Alternate Phone',
    icon: 'phone',
    placeholder: '10-digit alternate number',
    keyboardType: 'phone-pad',
  },
  {
    key: 'contact_email',
    privacyKey: 'contact_email',
    label: 'Contact Email',
    icon: 'email',
    placeholder: 'name@company.com',
    keyboardType: 'email-address',
  },
  {
    key: 'instagram_url',
    privacyKey: 'instagram_url',
    label: 'Instagram',
    icon: 'share',
    placeholder: '@handle or profile link',
    keyboardType: 'url',
  },
  {
    key: 'facebook_url',
    privacyKey: 'facebook_url',
    label: 'Facebook',
    icon: 'share',
    placeholder: 'https://facebook.com/yourpage',
    keyboardType: 'url',
  },
  {
    key: 'linkedin_url',
    privacyKey: 'linkedin_url',
    label: 'LinkedIn',
    icon: 'work',
    placeholder: 'https://linkedin.com/in/you',
    keyboardType: 'url',
  },
];

const PrivacyToggle: React.FC<{
  hidden: boolean;
  label: string;
  onToggle: () => void;
}> = ({ hidden, label, onToggle }) => (
  <Pressable
    onPress={onToggle}
    style={[styles.privacyChip, hidden ? styles.privacyChipHidden : styles.privacyChipVisible]}
    accessibilityRole="switch"
    accessibilityState={{ checked: !hidden }}
    accessibilityLabel={`${label} is ${hidden ? 'hidden from members' : 'visible to all members'}. Tap to change.`}
    hitSlop={6}
  >
    <ThemeIcon
      name={hidden ? 'hidden' : 'visible'}
      size={14}
      color={hidden ? Colors.text.outline : '#2E7D32'}
    />
    <Text style={[styles.privacyChipText, hidden ? styles.privacyTextHidden : styles.privacyTextVisible]}>
      {hidden ? 'Hidden' : 'Visible to all'}
    </Text>
  </Pressable>
);

/**
 * Contact and social links with a per-field privacy switch. The primary phone
 * is shown read-only because it is tied to account verification.
 */
export const ContactLinksEditor: React.FC<ContactLinksEditorProps> = ({
  primaryPhone,
  website,
  value,
  privacy,
  errors = {},
  onChange,
  onPrivacyChange,
}) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <ThemeIcon name="link" size={16} color={Colors.secondary} />
      <Text style={styles.sectionTitle}>Contact &amp; Social Links</Text>
    </View>

    <Text style={styles.helperText}>
      Choose what other members can see. Hidden details stay private to you and the club admin.
    </Text>

    <View style={styles.field}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>Primary Phone</Text>
        <PrivacyToggle
          hidden={privacy.phone === 'hidden'}
          label="Primary phone"
          onToggle={() => onPrivacyChange('phone', privacy.phone === 'hidden' ? 'all' : 'hidden')}
        />
      </View>
      <View style={[styles.inputWrapper, styles.inputReadOnly]}>
        <ThemeIcon name="lock" size={18} color={Colors.text.outline} />
        <Text style={styles.readOnlyValue}>{primaryPhone || 'Not provided'}</Text>
      </View>
      <Text style={styles.fieldHint}>Verified during registration and cannot be edited here.</Text>
    </View>

    <View style={styles.field}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>Business Website</Text>
        <PrivacyToggle
          hidden={privacy.website === 'hidden'}
          label="Business website"
          onToggle={() => onPrivacyChange('website', privacy.website === 'hidden' ? 'all' : 'hidden')}
        />
      </View>
      <View style={[styles.inputWrapper, styles.inputReadOnly]}>
        <ThemeIcon name="link" size={18} color={Colors.text.outline} />
        <Text style={styles.readOnlyValue} numberOfLines={1}>
          {website || 'Not added'}
        </Text>
      </View>
      <Text style={styles.fieldHint}>Edit this under Business Details in your profile.</Text>
    </View>

    {FIELDS.map((field) => {
      const fieldError = errors[field.key];
      return (
        <View key={field.key} style={styles.field}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>{field.label}</Text>
            <PrivacyToggle
              hidden={privacy[field.privacyKey] === 'hidden'}
              label={field.label}
              onToggle={() =>
                onPrivacyChange(
                  field.privacyKey,
                  privacy[field.privacyKey] === 'hidden' ? 'all' : 'hidden',
                )
              }
            />
          </View>
          <View style={[styles.inputWrapper, fieldError ? styles.inputWrapperError : null]}>
            <ThemeIcon name={field.icon} size={18} color={Colors.text.outline} />
            <TextInput
              value={value[field.key]}
              onChangeText={(next) => onChange(field.key, next)}
              placeholder={field.placeholder}
              placeholderTextColor={Colors.text.outline}
              keyboardType={field.keyboardType}
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />
          </View>
          {!!fieldError && <Text style={styles.errorText}>{fieldError}</Text>}
        </View>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  section: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.caption,
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 1,
    color: Colors.text.outline,
    textTransform: 'uppercase',
  },
  helperText: {
    ...Typography.caption,
    color: Colors.text.outline,
    lineHeight: 18,
    marginBottom: Spacing.lg,
  },
  field: {
    marginBottom: Spacing.lg,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  label: {
    ...Typography.caption,
    fontWeight: '800',
    color: Colors.text.secondary,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    minHeight: 48,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: 'rgba(122, 133, 160, 0.25)',
    borderRadius: Radius.sm,
  },
  inputWrapperError: {
    borderColor: Colors.error,
  },
  inputReadOnly: {
    backgroundColor: 'rgba(122, 133, 160, 0.08)',
  },
  input: {
    ...Typography.body,
    flex: 1,
    fontSize: 14,
    color: Colors.text.primary,
    paddingVertical: Spacing.md,
  },
  readOnlyValue: {
    ...Typography.body,
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text.secondary,
  },
  fieldHint: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.text.outline,
    marginTop: Spacing.xs,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.error,
    fontWeight: '600',
    marginTop: Spacing.xs,
  },
  privacyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.round,
    borderWidth: 1,
  },
  privacyChipVisible: {
    backgroundColor: '#E8F5E9',
    borderColor: '#C8E6C9',
  },
  privacyChipHidden: {
    backgroundColor: 'rgba(122, 133, 160, 0.12)',
    borderColor: 'rgba(122, 133, 160, 0.25)',
  },
  privacyChipText: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  privacyTextVisible: {
    color: '#2E7D32',
  },
  privacyTextHidden: {
    color: Colors.text.outline,
  },
});

export default ContactLinksEditor;
