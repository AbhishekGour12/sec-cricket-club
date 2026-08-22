import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Colors, Typography, Spacing, Radius, Shadows, ThemeIcon } from '@/theme';
import { getMediaUrl } from '../../utils/mediaUrl';
import { ImageViewer } from './ImageViewer';

interface BusinessShowcaseGalleryProps {
  images?: string[];
  title?: string;
  description?: string;
}

/**
 * Renders Product & Business Showcase Images uploaded by a member during profile completion or editing.
 */
export function BusinessShowcaseGallery({
  images = [],
  title = 'Product & Business Showcase',
  description = 'Products, services, and business showcase photos uploaded by member.',
}: BusinessShowcaseGalleryProps) {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const urls = useMemo(() => {
    if (!Array.isArray(images)) return [];
    return images
      .map((img) => getMediaUrl(img) || img)
      .filter(Boolean) as string[];
  }, [images]);

  if (urls.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <View style={styles.headerTitleRow}>
          <MaterialIcons name="storefront" size={20} color={Colors.primary} />
          <Text style={styles.title}>{title}</Text>
        </View>
        <Text style={styles.count}>{urls.length} / 5</Text>
      </View>
      <Text style={styles.description}>{description}</Text>

      <View style={styles.grid}>
        {urls.map((uri, index) => (
          <Pressable
            key={index}
            style={styles.card}
            onPress={() => setViewerIndex(index)}
            accessibilityRole="button"
            accessibilityLabel={`View product image ${index + 1}`}
          >
            <Image source={{ uri }} style={styles.image} contentFit="cover" transition={200} />
            <View style={styles.zoomBadge}>
              <MaterialIcons name="zoom-in" size={14} color="#FFFFFF" />
            </View>
          </Pressable>
        ))}
      </View>

      <ImageViewer
        visible={viewerIndex !== null}
        images={urls}
        initialIndex={viewerIndex ?? 0}
        onClose={() => setViewerIndex(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing.lg,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(122, 133, 160, 0.12)',
    ...Shadows.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    ...Typography.heading,
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '800',
  },
  description: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  count: {
    ...Typography.caption,
    fontWeight: '800',
    color: Colors.secondary,
    backgroundColor: '#F9D0D7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    fontSize: 11,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  card: {
    width: '47%',
    aspectRatio: 1,
    borderRadius: Radius.md,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  zoomBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 10,
    padding: 3,
  },
});

export default BusinessShowcaseGallery;
