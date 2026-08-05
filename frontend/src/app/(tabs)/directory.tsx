import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Linking,
  Pressable,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Radius, Shadows, ThemeIcon } from '@/theme';
import { SearchBar } from '@/components/Input';
import { Avatar } from '@/components/Avatar';
import { LoadingComponent, EmptyState } from '@/components/States';
import { useApprovalStore } from '../../store/approvalStore';
import { useMembers } from '../../hooks/useMembers';
import { useNetwork } from '../../hooks/useNetwork';
import { getMediaUrl } from '../../utils/mediaUrl';

export default function DirectoryScreen() {
  const router = useRouter();
  const { approvalStatus } = useApprovalStore();
  const [searchQuery, setSearchQuery] = useState('');

  const { members, isLoadingMembers, membersError, refetchMembers } = useMembers({
    search: searchQuery.trim() || undefined,
    limit: 50,
  });
  const { isBookmarked, toggleBookmark, isTogglingBookmark } = useNetwork();

  if (approvalStatus !== 'approved') {
    return <Redirect href="/(tabs)/home" />;
  }

  const handleCall = (phoneNumber?: string) => {
    if (!phoneNumber) return;
    Linking.openURL(`tel:${phoneNumber}`).catch(() => {
      Alert.alert('Unable to call', `Could not open the dialer for ${phoneNumber}.`);
    });
  };

  const handleToggleBookmark = async (memberId: number, saved: boolean) => {
    try {
      await toggleBookmark(memberId, saved);
    } catch {
      Alert.alert('Could not update', 'Please check your connection and try again.');
    }
  };

  const renderBody = () => {
    if (isLoadingMembers) {
      return <LoadingComponent message="Loading members..." />;
    }

    if (membersError) {
      return (
        <EmptyState
          title="Could not load the directory"
          description="Something went wrong while fetching members."
          icon="error"
          actionLabel="Retry"
          onActionPress={() => refetchMembers()}
        />
      );
    }

    if (members.length === 0) {
      return (
        <EmptyState
          title="No members found"
          description={
            searchQuery
              ? `No members match "${searchQuery}". Try a different name, business, or category.`
              : 'The member directory is empty right now.'
          }
          icon="directory"
        />
      );
    }

    return members.map((member) => {
      const saved = isBookmarked(member.id);
      return (
        <View key={member.id} style={styles.card}>
          <Avatar
            name={member.full_name || 'Member'}
            size={48}
            imageUrl={getMediaUrl(member.profile_image)}
          />
          <View style={styles.cardInfo}>
            <Text style={styles.memberName} numberOfLines={1}>
              {member.full_name || 'Member'}
            </Text>
            <Text style={styles.memberRole} numberOfLines={1}>
              {member.designation || 'Club Member'}
            </Text>
            {!!(member.business_name || member.business_category) && (
              <Text style={styles.memberBusiness} numberOfLines={1}>
                {[member.business_name, member.business_category].filter(Boolean).join(' · ')}
              </Text>
            )}
          </View>

          <Pressable
            onPress={() => handleToggleBookmark(member.id, saved)}
            disabled={isTogglingBookmark}
            style={styles.iconButton}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={
              saved
                ? `Remove ${member.full_name || 'member'} from your network`
                : `Save ${member.full_name || 'member'} to your network`
            }
          >
            <ThemeIcon
              name={saved ? 'bookmark' : 'bookmarkBorder'}
              size={22}
              color={saved ? Colors.secondary : Colors.text.outline}
            />
          </Pressable>

          {!!member.phone && (
            <Pressable
              onPress={() => handleCall(member.phone)}
              style={styles.iconButton}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel={`Call ${member.full_name || 'member'}`}
            >
              <ThemeIcon name="phone" size={20} color={Colors.primary} />
            </Pressable>
          )}
        </View>
      );
    });
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.headerSection}>
        <View style={styles.titleRow}>
          <View style={styles.titleCol}>
            <Text style={styles.titleText}>Members Directory</Text>
            <Text style={styles.subtitleText}>
              Connect with fellow members and grow your network.
            </Text>
          </View>
          <Pressable
            onPress={() => router.push('/networks')}
            style={styles.iconButton}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Open my saved network"
          >
            <ThemeIcon name="bookmark" size={22} color={Colors.secondary} />
          </Pressable>
        </View>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by name, business or category..."
          containerStyle={styles.searchBarSpacing}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={() => refetchMembers()} />
        }
      >
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
  headerSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(122, 133, 160, 0.1)',
    paddingBottom: Spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  titleCol: {
    flex: 1,
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
  searchBarSpacing: {
    marginTop: Spacing.md,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    paddingBottom: Spacing.massive,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    marginVertical: Spacing.sm,
    ...Shadows.sm,
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
});
