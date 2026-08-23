import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Colors, Typography, Spacing, Radius } from '@/theme';
import { useNotificationInboxStore } from '@/store/notificationInboxStore';
import { navigateFromPushData } from '@/utils/notificationNavigation';

function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function NotificationsScreen() {
  const router = useRouter();
  const items = useNotificationInboxStore((s) => s.items);
  const hydrated = useNotificationInboxStore((s) => s.hydrated);
  const hydrate = useNotificationInboxStore((s) => s.hydrate);
  const markRead = useNotificationInboxStore((s) => s.markRead);
  const markAllRead = useNotificationInboxStore((s) => s.markAllRead);
  const unreadCount = useNotificationInboxStore((s) => s.unreadCount());

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const openItem = (item: (typeof items)[number]) => {
    markRead(item.id);
    const opened = navigateFromPushData({
      type: item.type,
      announcementId: item.type === 'announcement' ? String(item.contentId) : undefined,
      eventId: item.type === 'event' ? String(item.contentId) : undefined,
    });
    if (!opened) {
      router.back();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 ? (
          <Pressable onPress={markAllRead} hitSlop={8}>
            <Text style={styles.markAll}>Mark all read</Text>
          </Pressable>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      {!hydrated ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>Loading notifications...</Text>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.emptyWrap}>
          <MaterialIcons name="notifications-none" size={48} color={Colors.text.outline} />
          <Text style={styles.emptyTitle}>No notifications yet</Text>
          <Text style={styles.emptyText}>
            When admin publishes announcements, events, or tournaments, they will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.card, !item.read && styles.cardUnread]}
              onPress={() => openItem(item)}
            >
              <View
                style={[
                  styles.iconCircle,
                  item.type === 'event' ? styles.iconEvent : styles.iconAnnouncement,
                ]}
              >
                <MaterialIcons
                  name={item.type === 'event' ? 'emoji-events' : 'campaign'}
                  size={20}
                  color="#FFFFFF"
                />
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.cardBodyText} numberOfLines={2}>
                  {item.body}
                </Text>
                <Text style={styles.cardTime}>{formatTime(item.receivedAt)}</Text>
              </View>
              {!item.read ? <View style={styles.unreadDot} /> : null}
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(122, 133, 160, 0.15)',
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...Typography.subHeading,
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary,
  },
  markAll: {
    ...Typography.caption,
    color: Colors.secondary,
    fontWeight: '700',
    fontSize: 12,
  },
  headerSpacer: {
    width: 72,
  },
  listContent: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(122, 133, 160, 0.12)',
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  cardUnread: {
    borderColor: 'rgba(196, 18, 48, 0.25)',
    backgroundColor: '#FFF9FA',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconAnnouncement: {
    backgroundColor: Colors.primary,
  },
  iconEvent: {
    backgroundColor: '#F57F17',
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    ...Typography.body,
    fontWeight: '800',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  cardBodyText: {
    ...Typography.caption,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  cardTime: {
    ...Typography.caption,
    color: Colors.text.outline,
    marginTop: 6,
    fontSize: 11,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.secondary,
    marginTop: 6,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyTitle: {
    ...Typography.subHeading,
    color: Colors.text.primary,
    fontWeight: '800',
    marginTop: Spacing.sm,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.text.outline,
    textAlign: 'center',
    lineHeight: 20,
  },
});
