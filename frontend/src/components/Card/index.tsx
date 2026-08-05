import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ViewStyle,
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
  onPress,
  onRegisterPress,
  style,
}) => {
  return (
    <Pressable style={[styles.card, style]} onPress={onPress}>
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

      <Text style={styles.eventTitle}>{title}</Text>

      <View style={styles.eventLocationRow}>
        <ThemeIcon name="directory" size={16} color={Colors.text.secondary} style={styles.eventIcon} />
        <Text style={styles.eventLocationText} numberOfLines={1}>{location}</Text>
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
    </Pressable>
  );
};

// Standard Announcement Card
interface AnnouncementCardProps {
  title: string;
  content: string;
  date: string;
  author?: string;
  onPress?: () => void;
}

export const AnnouncementCard: React.FC<AnnouncementCardProps> = ({
  title,
  content,
  date,
  author,
  onPress,
}) => {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.announcementHeader}>
        <Chip text="Announcement" variant="primary" />
        <Text style={styles.announcementDate}>{date}</Text>
      </View>
      <Text style={styles.announcementTitle}>{title}</Text>
      <Text style={styles.announcementContent} numberOfLines={3}>
        {content}
      </Text>
      {author && (
        <View style={styles.announcementFooter}>
          <ThemeIcon name="profile" size={14} color={Colors.text.outline} style={styles.footerIcon} />
          <Text style={styles.announcementAuthor}>Posted by {author}</Text>
        </View>
      )}
    </Pressable>
  );
};

// Standard Sponsor Card
interface SponsorCardProps {
  name: string;
  logoUrl?: string;
  description: string;
  tier: 'Platinum' | 'Gold' | 'Silver';
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
      case 'Platinum': return '#E5E4E2';
      case 'Gold': return '#FFD700';
      case 'Silver': return '#C0C0C0';
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
          <Text style={styles.sponsorDescription} numberOfLines={2}>
            {description}
          </Text>
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
  eventDateTime: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontSize: 18,
    marginBottom: Spacing.xs,
  },
  eventLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  eventLocationText: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.text.secondary,
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
    marginBottom: Spacing.sm,
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
