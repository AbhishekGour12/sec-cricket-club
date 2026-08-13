import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/theme';
import { SectionHeader } from '@/components/Layout';
import { getMediaUrl } from '../../utils/mediaUrl';
import { ImageViewer } from './ImageViewer';

/** Split comma-separated or JSON visiting_card into front/back paths. */
export function parseVisitingCards(visitingCard?: string | null): string[] {
  if (!visitingCard) return [];
  const trimmed = visitingCard.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((s) => String(s).trim()).filter(Boolean);
      }
    } catch {
      // fall through
    }
  }

  return trimmed.split(',').map((s) => s.trim()).filter(Boolean);
}

interface VisitingCardDisplayProps {
  visitingCard?: string | null;
}

export function VisitingCardDisplay({ visitingCard }: VisitingCardDisplayProps) {
  const cards = useMemo(() => parseVisitingCards(visitingCard), [visitingCard]);
  const urls = useMemo(
    () => cards.map((c) => getMediaUrl(c)).filter(Boolean) as string[],
    [cards],
  );
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  if (urls.length === 0) {
    return (
      <View style={styles.section}>
        <SectionHeader title="Digital Visiting Card" />
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>No visiting card uploaded</Text>
        </View>
      </View>
    );
  }

  const labels = ['Front View', 'Back View'];

  return (
    <View style={styles.section}>
      <SectionHeader title="Digital Visiting Card" />

      <View style={styles.cardStack}>
        {urls.map((uri, index) => (
          <Pressable
            key={`${uri}-${index}`}
            style={styles.imageCard}
            onPress={() => setViewerIndex(index)}
            accessibilityRole="button"
            accessibilityLabel={`View visiting card ${labels[index] || `image ${index + 1}`}`}
          >
            <Text style={styles.sideLabel}>{labels[index] || `Side ${index + 1}`}</Text>
            <Image source={{ uri }} style={styles.cardImage} contentFit="cover" />
          </Pressable>
        ))}
      </View>

      <Text style={styles.hint}>Tap an image to view full screen</Text>

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
  cardStack: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
    ...Shadows.sm,
  },
  imageCard: {
    borderRadius: Radius.md,
    overflow: 'hidden',
    backgroundColor: Colors.background,
  },
  sideLabel: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.text.outline,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: 4,
    fontSize: 12,
  },
  cardImage: {
    width: '100%',
    aspectRatio: 16 / 10,
    backgroundColor: Colors.primaryContainer,
  },
  hint: {
    ...Typography.caption,
    color: Colors.text.outline,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  emptyBox: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.xl,
    alignItems: 'center',
    ...Shadows.sm,
  },
  emptyText: {
    ...Typography.caption,
    color: Colors.text.outline,
  },
});

export default VisitingCardDisplay;
