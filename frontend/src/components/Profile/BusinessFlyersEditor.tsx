import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import {
  Colors,
  Typography,
  Spacing,
  Radius,
  Shadows,
  ThemeIcon,
} from '@/theme';
import { useBusinessFlyers } from '../../hooks/useBusinessFlyers';
import { useBusinessFlyerStore } from '../../store/businessFlyerStore';
import { compressImageForUpload } from '../../utils/compressImage';
import { getMediaUrl } from '../../utils/mediaUrl';
import { ImageViewer } from './ImageViewer';
import { useToast } from '@/components/Toast';

const MAX_BYTES = 5 * 1024 * 1024;

interface BusinessFlyersEditorProps {
  /** When false, shows a read-only gallery grid (owner view mode). */
  editable?: boolean;
}

export function BusinessFlyersEditor({ editable = true }: BusinessFlyersEditorProps) {
  const toast = useToast();
  const {
    flyers,
    max,
    isLoading,
    uploadFlyer,
    isUploading,
    deleteFlyer,
    isDeleting,
    reorderFlyers,
    isReordering,
    refetch,
  } = useBusinessFlyers();

  const { viewerIndex, openViewer, closeViewer } = useBusinessFlyerStore();
  const [busyId, setBusyId] = useState<number | null>(null);

  const imageUrls = useMemo(
    () => flyers.map((f) => getMediaUrl(f.image_url)).filter(Boolean) as string[],
    [flyers],
  );

  const requestPermissions = async (source: 'camera' | 'gallery') => {
    if (source === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        toast.showError('Permission Needed', 'Camera access is required to take flyer photos.');
        return false;
      }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        toast.showError('Permission Needed', 'Photo library access is required to upload flyers.');
        return false;
      }
    }
    return true;
  };

  const pickAndUpload = async (source: 'camera' | 'gallery', replaceId?: number) => {
    if (!replaceId && flyers.length >= max) {
      toast.showWarning('Limit Reached', `You can upload a maximum of ${max} business flyers.`);
      return;
    }

    const allowed = await requestPermissions(source);
    if (!allowed) return;

    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
      allowsMultipleSelection: false,
    };

    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    if (asset.fileSize && asset.fileSize > MAX_BYTES) {
      toast.showError('File Too Large', 'Each image must be 5 MB or smaller.');
      return;
    }

    const mime = (asset.mimeType || '').toLowerCase();
    if (
      mime &&
      !['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(mime)
    ) {
      toast.showError('Unsupported Format', 'Only JPG, JPEG, PNG, and WEBP images are allowed.');
      return;
    }

    try {
      setBusyId(replaceId ?? -1);
      const compressed = await compressImageForUpload(asset.uri);
      await uploadFlyer({
        uri: compressed.uri,
        mimeType: compressed.mimeType,
        fileName: compressed.fileName,
        replaceId,
      });
      await refetch();
      toast.showSuccess(replaceId ? 'Flyer Replaced' : 'Flyer Uploaded');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      const message =
        axiosErr?.response?.data?.message ||
        axiosErr?.message ||
        'Could not upload the flyer. Please try again.';
      toast.showError('Upload Failed', message);
    } finally {
      setBusyId(null);
    }
  };

  const showSourcePicker = (replaceId?: number) => {
    const title = replaceId ? 'Replace Flyer' : 'Upload Business Flyer';

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title,
          options: ['Cancel', 'Take Photo', 'Choose from Gallery'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) pickAndUpload('camera', replaceId);
          if (buttonIndex === 2) pickAndUpload('gallery', replaceId);
        },
      );
      return;
    }

    Alert.alert(title, 'Choose a source', [
      { text: 'Take Photo', onPress: () => pickAndUpload('camera', replaceId) },
      { text: 'Choose from Gallery', onPress: () => pickAndUpload('gallery', replaceId) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleRemove = (id: number) => {
    Alert.alert('Remove flyer', 'Delete this business flyer?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setBusyId(id);
            await deleteFlyer(id);
            await refetch();
            toast.showSuccess('Flyer Removed');
          } catch {
            toast.showError('Could Not Delete', 'Please try again.');
          } finally {
            setBusyId(null);
          }
        },
      },
    ]);
  };

  const moveFlyer = async (index: number, direction: -1 | 1) => {
    const next = index + direction;
    if (next < 0 || next >= flyers.length) return;

    const ordered = flyers.map((f) => f.id);
    const tmp = ordered[index];
    ordered[index] = ordered[next];
    ordered[next] = tmp;

    try {
      await reorderFlyers(ordered);
    } catch {
      toast.showError('Could Not Reorder', 'Please try again.');
    }
  };

  const showItemActions = (id: number, index: number) => {
    if (!editable) {
      openViewer(index);
      return;
    }

    const options = [
      { text: 'Preview', onPress: () => openViewer(index) },
      { text: 'Replace', onPress: () => showSourcePicker(id) },
      ...(index > 0
        ? [{ text: 'Move Left', onPress: () => moveFlyer(index, -1) }]
        : []),
      ...(index < flyers.length - 1
        ? [{ text: 'Move Right', onPress: () => moveFlyer(index, 1) }]
        : []),
      { text: 'Remove', style: 'destructive' as const, onPress: () => handleRemove(id) },
      { text: 'Cancel', style: 'cancel' as const },
    ];

    Alert.alert('Business Flyer', undefined, options);
  };

  const busy = isUploading || isDeleting || isReordering || busyId !== null;

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <View style={styles.headerTextCol}>
          <Text style={styles.title}>Business Flyers</Text>
          <Text style={styles.description}>
            Show your products, services, brochures, offers or promotional material.
          </Text>
        </View>
        <Text style={styles.count}>
          {flyers.length} / {max} Uploaded
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.emptyCard}>
          <ActivityIndicator color={Colors.secondary} />
        </View>
      ) : flyers.length === 0 ? (
        <Pressable
          style={styles.emptyCard}
          onPress={editable ? () => showSourcePicker() : undefined}
          disabled={!editable || busy}
          accessibilityRole={editable ? 'button' : undefined}
          accessibilityLabel="Upload Business Flyers"
        >
          <View style={styles.placeholderIcon}>
            <ThemeIcon name="business" size={40} color={Colors.text.outline} />
          </View>
          <Text style={styles.emptyTitle}>
            {editable ? 'Upload Business Flyers' : 'No flyers uploaded'}
          </Text>
          {editable && (
            <Text style={styles.emptyHint}>Tap to add from gallery or camera</Text>
          )}
        </Pressable>
      ) : (
        <View style={styles.grid}>
          {flyers.map((flyer, index) => {
            const uri = getMediaUrl(flyer.image_url);
            const isBusy = busyId === flyer.id;
            return (
              <Pressable
                key={flyer.id}
                style={styles.card}
                onPress={() => showItemActions(flyer.id, index)}
                disabled={busy && !isBusy}
              >
                {uri ? (
                  <Image source={{ uri }} style={styles.cardImage} contentFit="cover" />
                ) : (
                  <View style={[styles.cardImage, styles.cardFallback]} />
                )}
                {isBusy && (
                  <View style={styles.cardOverlay}>
                    <ActivityIndicator color="#FFFFFF" />
                  </View>
                )}
                {editable && (
                  <View style={styles.cardBadge}>
                    <Text style={styles.cardBadgeText}>{index + 1}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}

          {editable && flyers.length < max && (
            <Pressable
              style={[styles.card, styles.addCard]}
              onPress={() => showSourcePicker()}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel="Add business flyer"
            >
              {isUploading && busyId === -1 ? (
                <ActivityIndicator color={Colors.secondary} />
              ) : (
                <>
                  <ThemeIcon name="add" size={28} color={Colors.secondary} />
                  <Text style={styles.addText}>Add</Text>
                </>
              )}
            </Pressable>
          )}
        </View>
      )}

      <ImageViewer
        visible={viewerIndex !== null}
        images={imageUrls}
        initialIndex={viewerIndex ?? 0}
        onClose={closeViewer}
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
  headerTextCol: {
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
    marginTop: 2,
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
    minHeight: 140,
  },
  placeholderIcon: {
    width: 72,
    height: 72,
    borderRadius: Radius.lg,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    ...Typography.subHeading,
    fontSize: 15,
    color: Colors.text.secondary,
  },
  emptyHint: {
    ...Typography.caption,
    color: Colors.text.outline,
    marginTop: 4,
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
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardFallback: {
    backgroundColor: Colors.background,
  },
  cardOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(14, 21, 37, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  cardBadgeText: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  addCard: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(196, 18, 48, 0.35)',
    backgroundColor: Colors.secondaryContainer,
  },
  addText: {
    ...Typography.caption,
    fontWeight: '800',
    color: Colors.secondary,
    marginTop: 4,
  },
});

export default BusinessFlyersEditor;
