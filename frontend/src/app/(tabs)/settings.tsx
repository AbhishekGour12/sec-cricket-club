import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Switch, Alert, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Colors, Typography, Spacing, Radius, Shadows, ThemeIcon } from '@/theme';
import { Divider, SectionHeader } from '@/components/Layout';
import { DangerButton } from '@/components/Button';
import { useAuth } from '../../hooks/useAuth';

const PRIVACY_POLICY_URL =
  process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL || 'https://sec-cricket-club.onrender.com/privacy';
const TERMS_URL =
  process.env.EXPO_PUBLIC_TERMS_URL || 'https://sec-cricket-club.onrender.com/terms';

export default function SettingsScreen() {
  const router = useRouter();
  const { logout, isLoggingOut, deleteAccount, isDeletingAccount } = useAuth();
  const [pushNotifications, setPushNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
          } catch (err) {
            console.warn('Logout error:', err);
          }
          router.replace('/login');
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action is permanent and cannot be undone. All your profile information, business card data, and saved network links will be deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount();
              Alert.alert('Account Deleted', 'Your account has been deleted.');
            } catch (err) {
              console.warn('Account deletion error:', err);
            }
            router.replace('/login');
          },
        },
      ],
    );
  };

  const openPrivacyPolicy = () => {
    WebBrowser.openBrowserAsync(PRIVACY_POLICY_URL);
  };

  const openTermsOfService = () => {
    WebBrowser.openBrowserAsync(TERMS_URL);
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerSection}>
          <Text style={styles.titleText}>Settings</Text>
          <Text style={styles.subtitleText}>
            Configure your notifications, app theme, and account options.
          </Text>
        </View>

        <View style={styles.settingsCard}>
          <View style={styles.settingItem}>
            <View style={styles.settingLabelColumn}>
              <Text style={styles.settingTitle}>Push Notifications</Text>
              <Text style={styles.settingSubtitle}>Receive match updates, news, and notifications</Text>
            </View>
            <Switch
              value={pushNotifications}
              onValueChange={setPushNotifications}
              trackColor={{ false: 'rgba(122, 133, 160, 0.3)', true: Colors.primary }}
              thumbColor={pushNotifications ? Colors.secondary : '#f4f3f4'}
            />
          </View>

          <Divider style={styles.itemDivider} />

          <View style={styles.settingItem}>
            <View style={styles.settingLabelColumn}>
              <Text style={styles.settingTitle}>Dark Mode</Text>
              <Text style={styles.settingSubtitle}>Toggle application visual appearance mode</Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: 'rgba(122, 133, 160, 0.3)', true: Colors.primary }}
              thumbColor={darkMode ? Colors.secondary : '#f4f3f4'}
            />
          </View>
        </View>

        <SectionHeader title="Legal & Privacy" />
        <View style={styles.settingsCard}>
          <Pressable style={styles.settingLinkItem} onPress={openPrivacyPolicy}>
            <View style={styles.settingLabelColumn}>
              <Text style={styles.settingTitle}>Privacy Policy</Text>
              <Text style={styles.settingSubtitle}>Read how your data is handled and protected</Text>
            </View>
            <ThemeIcon name="chevronRight" size={18} color={Colors.text.secondary} />
          </Pressable>

          <Divider style={styles.itemDivider} />

          <Pressable style={styles.settingLinkItem} onPress={openTermsOfService}>
            <View style={styles.settingLabelColumn}>
              <Text style={styles.settingTitle}>Terms of Service</Text>
              <Text style={styles.settingSubtitle}>Review community terms and conditions</Text>
            </View>
            <ThemeIcon name="chevronRight" size={18} color={Colors.text.secondary} />
          </Pressable>
        </View>

        <SectionHeader title="Account Management" />
        <DangerButton
          title="Log Out"
          onPress={handleLogout}
          loading={isLoggingOut}
          leftIcon="logout"
          variant="tint"
          style={styles.logoutButton}
        />

        <DangerButton
          title="Delete Account"
          onPress={handleDeleteAccount}
          loading={isDeletingAccount}
          leftIcon="delete"
          variant="solid"
          style={styles.deleteAccountButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingBottom: Spacing.massive,
  },
  headerSection: {
    marginBottom: Spacing.lg,
  },
  titleText: {
    ...Typography.heading,
    color: Colors.text.primary,
    fontSize: 26,
  },
  subtitleText: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
  settingsCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.xl,
    ...Shadows.sm,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  settingLinkItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  settingLabelColumn: {
    flex: 1,
    marginRight: Spacing.md,
  },
  settingTitle: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  settingSubtitle: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  itemDivider: {
    marginVertical: 0,
  },
  logoutButton: {
    width: '100%',
    marginVertical: 0,
    marginBottom: Spacing.md,
  },
  deleteAccountButton: {
    width: '100%',
    marginVertical: 0,
    marginBottom: Spacing.xl,
  },
});
