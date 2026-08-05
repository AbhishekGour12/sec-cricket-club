import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Typography } from '@/theme';

interface AvatarProps {
  name: string;
  imageUrl?: string;
  size?: number;
  status?: 'active' | 'inactive';
  style?: ViewStyle;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  imageUrl,
  size = 48,
  status,
  style,
}) => {
  const getInitials = (fullName: string) => {
    const parts = fullName.trim().split(' ');
    if (parts.length > 1) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return fullName.slice(0, 2).toUpperCase();
  };

  const getBackgroundColor = (hashName: string) => {
    // Generate a consistent color based on character hash
    let hash = 0;
    for (let i = 0; i < hashName.length; i++) {
      hash = hashName.charCodeAt(i) + ((hash << 5) - hash);
    }
    // We can use primary container color as default fallback or alternate primary colors
    return Colors.secondaryNavy;
  };

  const initials = getInitials(name);
  const avatarBg = getBackgroundColor(name);

  return (
    <View style={[{ width: size, height: size }, styles.container, style]}>
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
        />
      ) : (
        <View
          style={[
            styles.fallback,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: avatarBg,
            },
          ]}
        >
          <Text
            style={[
              styles.initialsText,
              { fontSize: size * 0.4, lineHeight: size * 0.4 },
            ]}
          >
            {initials}
          </Text>
        </View>
      )}

      {status === 'active' && (
        <View
          style={[
            styles.statusIndicator,
            {
              width: size * 0.28,
              height: size * 0.28,
              borderRadius: (size * 0.28) / 2,
              bottom: 0,
              right: 0,
            },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    ...Typography.button,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  statusIndicator: {
    position: 'absolute',
    backgroundColor: '#4CAF50', // Active Green
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});

export default Avatar;
