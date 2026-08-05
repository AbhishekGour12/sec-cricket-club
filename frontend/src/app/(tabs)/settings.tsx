import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/theme';
import { Divider } from '@/components/Layout';
import { SecondaryButton } from '@/components/Button';
import { useAuth } from '../../hooks/useAuth';

export default function SettingsScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const [pushNotifications, setPushNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.warn('Logout error:', err);
    }
    router.replace('/login');
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

        {/* Configurations Box */}
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

        {/* Log Out CTA */}
        <SecondaryButton
          title="Log Out"
          onPress={handleLogout}
          style={styles.logoutButton}
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
    height: 52,
    borderRadius: Radius.md,
    backgroundColor: Colors.secondary,
  },
});
