import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Colors, Typography, Spacing, Radius, Shadows, ThemeIcon } from '@/theme';
import { getMediaUrl } from '../../utils/mediaUrl';
import { ImageViewer } from './ImageViewer';
import type { BusinessFlyer } from '../../store/businessFlyerStore';

interface BusinessFlyersGalleryProps {
  flyers: BusinessFlyer[];
  title?: string;
  description?: string;
}

/** Read-only 2-column flyer gallery for member profiles. */
export function BusinessFlyersGallery({
  flyers,
  title = 'Business Flyers',
  description = 'Show your products, services, brochures, offers or promotional material.',
}: BusinessFlyersGalleryProps) {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const urls = useMemo(
    () => flyers.map((f) => getMediaUrl(f.image_url)).filter(Boolean) as string[],
    [flyers],
  );

  if (flyers.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
        <Text style={styles.count}>{flyers.length} / 5</Text>
      </View>

      <View style={styles.grid}>
        {flyers.map((flyer, index) => {
          const uri = getMediaUrl(flyer.image_url);
          return (
            <Pressable
              key={flyer.id}
              style={styles.card}
              onPress={() => setViewerIndex(index)}
              accessibilityRole="button"
              accessibilityLabel={`View business flyer ${index + 1}`}
            >
              {uri ? (
                <Image source={{ uri }} style={styles.image} contentFit="cover" />
              ) : (
                <View style={[styles.image, styles.fallback]}>
                  <ThemeIcon name="business" size={24} color={Colors.text.outline} />
                </View>
              )}
            </Pressable>
          );
        })}
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
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  headerText: {
    flex: 1,
  },
  title: {
    ...Typography.heading,
    fontSize: 18,
    color: Colors.primary,
  },
  description: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: 4,
    lineHeight: 18,
  },
  count: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.text.outline,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  card: {
    width: '47%',
    aspectRatio: 3 / 4,
    borderRadius: Radius.md,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    ...Shadows.sm,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
});

export default BusinessFlyersGallery;
