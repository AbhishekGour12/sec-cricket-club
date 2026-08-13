import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ViewStyle,
  ImageSourcePropType,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadows, ThemeIcon } from '@/theme';
import { Avatar } from '@/components/Avatar';
import { Chip, Badge } from '@/components/Chip';

// Standard Member Card
interface MemberCardProps {
  name: string;
  role: string;
  subRole?: string; // e.g. Batsman, Bowler, Right-handed
  imageUrl?: string;
  phone?: string;
  onPress?: () => void;
  onCallPress?: () => void;
}

export const MemberCard: React.FC<MemberCardProps> = ({
  name,
  role,
  subRole,
  imageUrl,
  phone,
  onPress,
  onCallPress,
}) => {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.memberRow}>
        <Avatar name={name} imageUrl={imageUrl} size={50} status="active" />
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{name}</Text>
          <Text style={styles.memberRole}>{role}</Text>
          {subRole && <Text style={styles.memberSubRole}>{subRole}</Text>}
        </View>
        {phone && onCallPress && (
          <Pressable style={styles.callButton} onPress={onCallPress}>
            <ThemeIcon name="phone" size={20} color={Colors.primary} />
          </Pressable>
        )}
      </View>
    </Pressable>
  );
};

// Standard Event Card
interface EventCardProps {
  title: string;
  date: string;
  time: string;
  location: string;
  status?: string;
  isRegistered?: boolean;
  coverImage?: string | ImageSourcePropType;
  badge?: string;
  onPress?: () => void;
  onRegisterPress?: () => void;
  style?: ViewStyle;
}

export const EventCard: React.FC<EventCardProps> = ({
  title,
  date,
  time,
  location,
  status,
  isRegistered,
  coverImage,
  badge,
  onPress,
  onRegisterPress,
  style,
}) => {
  const day = date.split(' ')[0] || '';
  const month = (date.split(' ')[1] || '').replace(',', '').slice(0, 3).toUpperCase();
  const coverSource =
    typeof coverImage === 'string' ? { uri: coverImage } : coverImage;

  return (
    <Pressable style={[styles.eventCard, style]} onPress={onPress}>
      {!!coverImage && (
        <View style={styles.eventCoverWrap}>
          <Image source={coverSource} style={styles.eventCoverImage} resizeMode="cover" />
          {(badge || status) && (
            <View style={styles.eventCoverBadge}>
              <Text style={styles.eventCoverBadgeText}>
                {(badge || status || '').toUpperCase()}
              </Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.eventBody}>
        <View style={styles.eventMainRow}>
          <View style={styles.eventDateBox}>
            <Text style={styles.eventDayText}>{day || '--'}</Text>
            <Text style={styles.eventMonthText}>{month || '—'}</Text>
          </View>

          <View style={styles.eventInfoCol}>
            {!coverImage && (
              <View style={styles.eventHeader}>
                <View style={styles.eventDateTime}>
                  <ThemeIcon name="calendar" size={16} color={Colors.secondary} style={styles.eventIcon} />
                  <Text style={styles.eventDateText}>{date} • {time}</Text>
                </View>
                {status && (
                  <Badge
                    text={status}
                    variant={status === 'Upcoming' ? 'secondary' : 'primary'}
                  />
                )}
              </View>
            )}

            <Text style={styles.eventTitle}>{title}</Text>

            {!!coverImage && (
              <View style={styles.eventDateTime}>
                <ThemeIcon name="calendar" size={14} color={Colors.secondary} style={styles.eventIcon} />
                <Text style={styles.eventDateText}>{time}</Text>
              </View>
            )}

            <View style={styles.eventLocationRow}>
              <ThemeIcon name="directory" size={16} color={Colors.text.secondary} style={styles.eventIcon} />
              <Text style={styles.eventLocationText} numberOfLines={1}>{location}</Text>
            </View>
          </View>
        </View>

        {onRegisterPress && (
          <View style={styles.eventActionRow}>
            <Pressable
              style={[
                styles.eventActionButton,
                isRegistered ? styles.eventActiveButton : styles.eventOutlineButton,
              ]}
              onPress={onRegisterPress}
            >
              <Text
                style={[
                  styles.eventActionText,
                  isRegistered ? styles.eventActiveText : styles.eventOutlineText,
                ]}
              >
                {isRegistered ? 'Registered ✔' : 'Register Now'}
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </Pressable>
  );
};

// Standard Announcement Card — matches club news UI (cover + NEW + Read more)
interface AnnouncementCardProps {
  title: string;
  content: string;
  date: string;
  author?: string;
  coverImage?: string;
  priority?: string;
  isPinned?: boolean;
  isNew?: boolean;
  onPress?: () => void;
}

export const AnnouncementCard: React.FC<AnnouncementCardProps> = ({
  title,
  content,
  date,
  author,
  coverImage,
  priority,
  isPinned,
  isNew,
  onPress,
}) => {
  return (
    <Pressable style={styles.announcementCard} onPress={onPress}>
      {!!coverImage && (
        <View style={styles.coverWrap}>
          <Image source={{ uri: coverImage }} style={styles.coverImage} resizeMode="cover" />
          {isNew && (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
          )}
          {isPinned && (
            <View style={styles.pinnedBadge}>
              <Text style={styles.pinnedBadgeText}>PINNED</Text>
            </View>
          )}
        </View>
      )}

      {!coverImage && (
        <View style={styles.announcementHeader}>
          <View style={styles.badgeRow}>
            <Chip text="Announcement" variant="primary" />
            {isNew && (
              <View style={styles.newBadgeInline}>
                <Text style={styles.newBadgeText}>NEW</Text>
              </View>
            )}
            {isPinned && (
              <View style={styles.pinnedBadgeInline}>
                <Text style={styles.pinnedBadgeText}>PINNED</Text>
              </View>
            )}
          </View>
          <Text style={styles.announcementDate}>{date}</Text>
        </View>
      )}

      <View style={styles.announcementBody}>
        {!!coverImage && (
          <View style={styles.metaRow}>
            {!!priority && (
              <View style={styles.priorityPill}>
                <Text style={styles.priorityPillText}>{priority.toUpperCase()}</Text>
              </View>
            )}
            <Text style={styles.announcementDate}>{date}</Text>
          </View>
        )}

        <Text style={styles.announcementTitle}>{title}</Text>
        <Text style={styles.announcementContent} numberOfLines={3}>
          {content}
        </Text>

        <View style={styles.readMoreRow}>
          <Text style={styles.readMoreText}>Read more →</Text>
          {author ? (
            <Text style={styles.announcementAuthor} numberOfLines={1}>
              {author}
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
};

// Standard Sponsor Card
interface SponsorCardProps {
  name: string;
  logoUrl?: string;
  description?: string;
  tier: 'Title Sponsor' | 'Co-Sponsor' | 'Associate Sponsor' | 'Platinum' | 'Gold' | 'Silver';
  onPress?: () => void;
}

export const SponsorCard: React.FC<SponsorCardProps> = ({
  name,
  logoUrl,
  description,
  tier,
  onPress,
}) => {
  const getTierColor = () => {
    switch (tier) {
      case 'Title Sponsor':
      case 'Platinum':
        return Colors.primary;
      case 'Co-Sponsor':
      case 'Gold':
        return Colors.secondary;
      case 'Associate Sponsor':
      case 'Silver':
      default:
        return Colors.text.outline;
    }
  };

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.sponsorRow}>
        <View style={styles.sponsorLogoContainer}>
          {logoUrl ? (
            <Image source={{ uri: logoUrl }} style={styles.sponsorLogo} resizeMode="contain" />
          ) : (
            <View style={[styles.sponsorLogoPlaceholder, { borderColor: getTierColor() }]}>
              <Text style={styles.sponsorLogoText}>{name.slice(0, 2).toUpperCase()}</Text>
            </View>
          )}
        </View>
        <View style={styles.sponsorInfo}>
          <View style={styles.sponsorHeader}>
            <Text style={styles.sponsorName}>{name}</Text>
            <Badge text={`${tier} Sponsor`} style={{ backgroundColor: getTierColor() + '33', borderColor: getTierColor() }} textStyle={{ color: Colors.text.primary }} />
          </View>
          {!!description && (
            <Text style={styles.sponsorDescription} numberOfLines={2}>
              {description}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    marginVertical: Spacing.sm,
    ...Shadows.sm,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  memberName: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  memberRole: {
    ...Typography.caption,
    color: Colors.secondary,
    fontWeight: '700',
  },
  memberSubRole: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.round,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  eventCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    marginVertical: Spacing.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(122, 133, 160, 0.12)',
    ...Shadows.sm,
  },
  eventCoverWrap: {
    width: '100%',
    height: 150,
    backgroundColor: Colors.background,
    position: 'relative',
  },
  eventCoverImage: {
    width: '100%',
    height: '100%',
  },
  eventCoverBadge: {
    position: 'absolute',
    top: Spacing.sm + 2,
    right: Spacing.sm + 2,
    backgroundColor: Colors.secondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.xs,
  },
  eventCoverBadgeText: {
    ...Typography.caption,
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 10,
  },
  eventBody: {
    paddingTop: Spacing.sm + 2,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  eventMainRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  eventDateBox: {
    width: 56,
    borderRadius: Radius.sm,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
  },
  eventDayText: {
    ...Typography.heading,
    fontSize: 20,
    color: Colors.primary,
    fontWeight: '900',
  },
  eventMonthText: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '800',
    marginTop: 2,
  },
  eventInfoCol: {
    flex: 1,
    minWidth: 0,
  },
  eventDateTime: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  eventIcon: {
    marginRight: Spacing.xs,
  },
  eventDateText: {
    ...Typography.caption,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  eventTitle: {
    ...Typography.subHeading,
    color: Colors.text.primary,
    fontSize: 17,
    marginBottom: Spacing.xs,
  },
  eventLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  eventLocationText: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.text.secondary,
    flex: 1,
  },
  eventActionRow: {
    marginTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(122, 133, 160, 0.1)',
    paddingTop: Spacing.md,
  },
  eventActionButton: {
    height: 40,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventOutlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  eventActiveButton: {
    backgroundColor: Colors.primaryContainer,
  },
  eventActionText: {
    ...Typography.button,
    fontSize: 14,
  },
  eventOutlineText: {
    color: Colors.primary,
  },
  eventActiveText: {
    color: Colors.primary,
  },
  announcementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.sm + 2,
    paddingHorizontal: Spacing.lg,
    paddingBottom: 2,
    marginBottom: 0,
  },
  announcementCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    marginVertical: Spacing.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(122, 133, 160, 0.12)',
    ...Shadows.sm,
  },
  coverWrap: {
    width: '100%',
    height: 160,
    backgroundColor: Colors.background,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  newBadge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    backgroundColor: Colors.secondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.xs,
  },
  newBadgeInline: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.xs,
  },
  newBadgeText: {
    ...Typography.caption,
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 10,
  },
  pinnedBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.xs,
  },
  pinnedBadgeInline: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.xs,
  },
  pinnedBadgeText: {
    ...Typography.caption,
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 10,
  },
  announcementBody: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm + 2,
    paddingBottom: Spacing.lg,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
    paddingTop: 2,
  },
  priorityPill: {
    backgroundColor: Colors.secondaryContainer,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.xl,
  },
  priorityPillText: {
    ...Typography.caption,
    color: Colors.secondary,
    fontWeight: '900',
    fontSize: 10,
  },
  announcementDate: {
    ...Typography.caption,
    color: Colors.text.outline,
  },
  announcementTitle: {
    ...Typography.subHeading,
    color: Colors.text.primary,
    fontSize: 18,
    marginBottom: Spacing.sm,
  },
  announcementContent: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  readMoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  readMoreText: {
    ...Typography.button,
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '800',
  },
  announcementFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(122, 133, 160, 0.1)',
    paddingTop: Spacing.sm,
    marginTop: Spacing.xs,
  },
  footerIcon: {
    marginRight: Spacing.xs,
  },
  announcementAuthor: {
    ...Typography.caption,
    color: Colors.text.outline,
    maxWidth: '50%',
  },
  sponsorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sponsorLogoContainer: {
    width: 60,
    height: 60,
    borderRadius: Radius.sm,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  sponsorLogo: {
    width: '100%',
    height: '100%',
  },
  sponsorLogoPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: Radius.sm,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sponsorLogoText: {
    ...Typography.heading,
    fontSize: 18,
    color: Colors.primary,
  },
  sponsorInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  sponsorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  sponsorName: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  sponsorDescription: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
});
