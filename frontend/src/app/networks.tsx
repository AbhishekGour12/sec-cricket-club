import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Radius, Shadows, ThemeIcon } from '@/theme';
import { Avatar } from '@/components/Avatar';
import { AppBar } from '@/components/AppBar';
import { LoadingComponent, EmptyState } from '@/components/States';
import { useNetwork } from '../hooks/useNetwork';
import { getMediaUrl } from '../utils/mediaUrl';

export default function NetworksScreen() {
  const router = useRouter();
  const { members, isLoading, error, refetch, toggleBookmark, isTogglingBookmark } = useNetwork();

  const handleRemove = (memberId: number, name: string) => {
    Alert.alert('Remove from network', `Remove ${name} from your saved network?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await toggleBookmark(memberId, true);
          } catch {
            Alert.alert('Could not update', 'Please check your connection and try again.');
          }
        },
      },
    ]);
  };

  const openLink = async (url: string) => {
    const normalized = url.startsWith('http://') || url.startsWith('https://')
      ? url
      : `https://${url}`;
    // Only allow browser links — block custom schemes for safety.
    if (!/^https?:\/\//i.test(normalized)) return;
    const supported = await Linking.canOpenURL(normalized);
    if (supported) Linking.openURL(normalized);
  };

  const renderBody = () => {
    if (isLoading) {
      return <LoadingComponent message="Loading your network..." />;
    }

    if (error) {
      return (
        <EmptyState
          title="Could not load your network"
          description={error}
          icon="error"
          actionLabel="Retry"
          onActionPress={() => refetch()}
        />
      );
    }

    if (members.length === 0) {
      return (
        <EmptyState
          title="No saved members yet"
          description="Bookmark members from the directory to build your personal network and reach them quickly."
          icon="bookmarkBorder"
          actionLabel="Browse Directory"
          onActionPress={() => router.push('/(tabs)/directory')}
        />
      );
    }

    return members.map((member) => (
      <View key={member.id} style={styles.card}>
        <View style={styles.cardHeader}>
          <Avatar
            name={member.full_name || 'Member'}
            size={52}
            imageUrl={getMediaUrl(member.profile_image)}
          />
          <View style={styles.cardInfo}>
            <Text style={styles.memberName} numberOfLines={1}>
              {member.full_name || 'Member'}
            </Text>
            <Text style={styles.memberRole} numberOfLines={1}>
              {member.designation || 'Club Member'}
            </Text>
            {!!member.business_name && (
              <Text style={styles.memberBusiness} numberOfLines={1}>
                {member.business_name}
              </Text>
            )}
          </View>
          <Pressable
            onPress={() => handleRemove(member.id, member.full_name || 'this member')}
            disabled={isTogglingBookmark}
            style={styles.iconButton}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${member.full_name || 'member'} from network`}
          >
            <ThemeIcon name="bookmark" size={22} color={Colors.secondary} />
          </Pressable>
        </View>

        <View style={styles.actionRow}>
          {!!member.phone && (
            <Pressable
              onPress={() => Linking.openURL(`tel:${member.phone}`)}
              style={styles.actionChip}
              accessibilityRole="button"
              accessibilityLabel={`Call ${member.full_name || 'member'}`}
            >
              <ThemeIcon name="phone" size={16} color={Colors.primary} />
              <Text style={styles.actionChipText}>Call</Text>
            </Pressable>
          )}
          {!!(member.contact_email || member.email) && (
            <Pressable
              onPress={() => Linking.openURL(`mailto:${member.contact_email || member.email}`)}
              style={styles.actionChip}
              accessibilityRole="button"
              accessibilityLabel={`Email ${member.full_name || 'member'}`}
            >
              <ThemeIcon name="email" size={16} color={Colors.primary} />
              <Text style={styles.actionChipText}>Email</Text>
            </Pressable>
          )}
          {!!member.linkedin_url && (
            <Pressable
              onPress={() => openLink(member.linkedin_url!)}
              style={styles.actionChip}
              accessibilityRole="button"
              accessibilityLabel={`Open LinkedIn for ${member.full_name || 'member'}`}
            >
              <ThemeIcon name="work" size={16} color={Colors.primary} />
              <Text style={styles.actionChipText}>LinkedIn</Text>
            </Pressable>
          )}
          {!!member.website && (
            <Pressable
              onPress={() => openLink(member.website!)}
              style={styles.actionChip}
              accessibilityRole="button"
              accessibilityLabel={`Open website for ${member.full_name || 'member'}`}
            >
              <ThemeIcon name="link" size={16} color={Colors.primary} />
              <Text style={styles.actionChipText}>Website</Text>
            </Pressable>
          )}
        </View>
      </View>
    ));
  };

  return (
    // AppBar already applies top safe-area insets — do not double-pad here (iPhone notch).
    <SafeAreaView edges={[]} style={styles.container}>
      <AppBar title="My Network" onBackPress={() => router.back()} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={() => refetch()} />}
      >
        {members.length > 0 && (
          <Text style={styles.countLabel}>
            {members.length} saved {members.length === 1 ? 'member' : 'members'}
          </Text>
        )}
        {renderBody()}
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
    padding: Spacing.lg,
    paddingBottom: Spacing.massive,
  },
  countLabel: {
    ...Typography.caption,
    color: Colors.text.outline,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.md,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  memberName: {
    ...Typography.body,
    fontWeight: '800',
    color: Colors.text.primary,
  },
  memberRole: {
    ...Typography.caption,
    color: Colors.secondary,
    fontWeight: '700',
    marginTop: 2,
  },
  memberBusiness: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.round,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: 'rgba(122, 133, 160, 0.2)',
  },
  actionChipText: {
    ...Typography.caption,
    fontWeight: '800',
    color: Colors.primary,
  },
});
