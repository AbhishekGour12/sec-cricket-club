import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/theme';
import { TabNavigationStyles } from '@/components/BottomNavigation';
import { PushNotificationBootstrap } from '@/components/PushNotificationBootstrap';
import { useApprovalStore } from '../../store/approvalStore';

export default function TabLayout() {
  const { approvalStatus, fetchApprovalStatus } = useApprovalStore();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 8);

  useEffect(() => {
    fetchApprovalStatus();
  }, []);

  const isApproved = approvalStatus === 'approved';

  return (
    <>
      <PushNotificationBootstrap />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: TabNavigationStyles.activeTintColor,
          tabBarInactiveTintColor: TabNavigationStyles.inactiveTintColor,
          tabBarStyle: {
            ...TabNavigationStyles.tabBar,
            height: 56 + bottomInset + 8,
            paddingBottom: bottomInset,
            paddingTop: 8,
          },
          tabBarLabelStyle: TabNavigationStyles.labelStyle,
          sceneStyle: {
            backgroundColor: Colors.background,
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: 'HOME',
            tabBarIcon: ({ color }) => (
              <MaterialIcons name="verified-user" color={color} size={22} />
            ),
          }}
        />
        <Tabs.Screen
          name="directory"
          options={{
            title: 'MEMBERS',
            tabBarIcon: ({ color }) => <MaterialIcons name="person" color={color} size={22} />,
            tabBarButton: isApproved ? undefined : () => null,
          }}
        />
        <Tabs.Screen
          name="announcements"
          options={{
            title: 'NEWS',
            tabBarIcon: ({ color }) => (
              <MaterialIcons name="notifications" color={color} size={22} />
            ),
            tabBarButton: isApproved ? undefined : () => null,
          }}
        />
        <Tabs.Screen
          name="events"
          options={{
            title: 'EVENTS',
            tabBarIcon: ({ color }) => (
              <MaterialIcons name="emoji-events" color={color} size={22} />
            ),
            tabBarButton: isApproved ? undefined : () => null,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </>
  );
}
