import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '@/theme';
import { AnnouncementCard } from '@/components/Card';
import { useApprovalStore } from '../../store/approvalStore';
import { Redirect } from 'expo-router';

export default function AnnouncementsScreen() {
  const { approvalStatus } = useApprovalStore();

  if (approvalStatus !== 'approved') {
    return <Redirect href="/(tabs)/home" />;
  }

  const posts = [
    {
      title: 'New Jersey Sponsorship Partner',
      text: 'We are thrilled to welcome our new principal jersey sponsor for the 2026 season. Jersey distribution starts next Saturday in the training rooms.',
      date: 'July 28, 2026 (2h ago)',
      author: 'Secretary Office',
    },
    {
      title: 'Training Cancelled Due to Weather',
      text: 'Due to heavy monsoon showers and pitch waterlogging, training scheduled for this afternoon is cancelled. Indoor session bookings will be announced soon.',
      date: 'July 27, 2026 (1d ago)',
      author: 'Coach Miller',
    },
    {
      title: 'Annual General Meeting (AGM) Details',
      text: 'Our annual club general board meeting will take place at the main clubhouse lounge on Saturday, August 8th. Attendance is mandatory for all primary members.',
      date: 'July 20, 2026 (1w ago)',
      author: 'Committee Board',
    },
  ];

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerSection}>
          <Text style={styles.titleText}>Announcements</Text>
          <Text style={styles.subtitleText}>
            Stay updated with official SEC news, schedule alerts, and notices.
          </Text>
        </View>

        <View style={styles.listContainer}>
          {posts.map((post, idx) => (
            <AnnouncementCard
              key={idx}
              title={post.title}
              content={post.text}
              date={post.date}
              author={post.author}
            />
          ))}
        </View>
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
  listContainer: {
    marginTop: Spacing.sm,
  },
});
