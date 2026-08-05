import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '@/theme';
import { EventCard } from '@/components/Card';
import { useApprovalStore } from '../../store/approvalStore';
import { Redirect } from 'expo-router';

export default function EventsScreen() {
  const { approvalStatus } = useApprovalStore();

  if (approvalStatus !== 'approved') {
    return <Redirect href="/(tabs)/home" />;
  }

  // Mock event state to simulate dynamic registrations
  const [events, setEvents] = useState([
    {
      id: 1,
      title: 'Weekend Practice Match',
      date: 'Jul 29, 2026',
      time: '7:00 AM',
      location: 'SEC Sports Ground, Oval 1',
      status: 'Upcoming',
      isRegistered: false,
    },
    {
      id: 2,
      title: 'SEC Club League Round 1',
      date: 'Aug 02, 2026',
      time: '9:00 AM',
      location: 'SEC Main Cricket Stadium',
      status: 'Upcoming',
      isRegistered: true,
    },
    {
      id: 3,
      title: 'Monsoon Charity Cup',
      date: 'Aug 15, 2026',
      time: '10:00 AM',
      location: 'Green Valley Arena',
      status: 'Upcoming',
      isRegistered: false,
    },
  ]);

  const handleToggleRegister = (id: number) => {
    setEvents((prevEvents) =>
      prevEvents.map((evt) =>
        evt.id === id ? { ...evt, isRegistered: !evt.isRegistered } : evt
      )
    );
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerSection}>
          <Text style={styles.titleText}>Club Events & Matches</Text>
          <Text style={styles.subtitleText}>
            Register for matches, practice sessions, and social events.
          </Text>
        </View>

        <View style={styles.listContainer}>
          {events.map((evt) => (
            <EventCard
              key={evt.id}
              title={evt.title}
              date={evt.date}
              time={evt.time}
              location={evt.location}
              status={evt.status}
              isRegistered={evt.isRegistered}
              onRegisterPress={() => handleToggleRegister(evt.id)}
              style={styles.cardSpacing}
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
  cardSpacing: {
    marginBottom: Spacing.md,
  },
});
