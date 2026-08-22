import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Colors, Spacing, Radius } from '@/theme';
import { getMediaUrl } from '@/utils/mediaUrl';
import { ImageViewer } from './Profile/ImageViewer';

export type CardSide = 'front' | 'back';

interface BusinessCardUploadProps {
  cardFront: string;
  cardBack: string;
  localFrontUri?: string;
  localBackUri?: string;
  onUpload?: (side: CardSide, url: string) => void;
  onPickImage: (side: CardSide, useCamera: boolean) => Promise<void>;
  onRemoveImage?: (side: CardSide) => void;
  isUploading: CardSide | null;
  error?: string;
}

const GUIDELINES = [
  {
    icon: 'wb-sunny' as const,
    title: 'Good Lighting',
    desc: 'Place card in bright, even light. Avoid harsh shadows.',
  },
  {
    icon: 'crop-free' as const,
    title: 'Flat & Steady',
    desc: 'Lay the card flat. Keep camera still.',
  },
  {
    icon: 'center-focus-strong' as const,
    title: 'Fill the Frame',
    desc: 'Align all 4 corners inside the guide box. No cropping.',
  },
  {
    icon: 'text-fields' as const,
    title: 'Text Must Be Clear',
    desc: 'All text should be readable. Avoid blur or glare.',
  },
];

const BusinessCardUpload: React.FC<BusinessCardUploadProps> = ({
  cardFront,
  cardBack,
  localFrontUri,
  localBackUri,
  onPickImage,
  onRemoveImage,
  isUploading,
  error,
}) => {
  const [activeSide, setActiveSide] = useState<CardSide>('front');
  const [guidelinesVisible, setGuidelinesVisible] = useState(false);
  const [sourceModalVisible, setSourceModalVisible] = useState(false);

  // Full Screen Preview state
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);

  const resolveCardUri = (uri: string, localUri?: string) => {
    if (localUri) return localUri;
    if (!uri) return '';
    return getMediaUrl(uri) || uri;
  };

  const frontResolved = resolveCardUri(cardFront, localFrontUri);
  const backResolved = resolveCardUri(cardBack, localBackUri);

  const handleStartPick = (side: CardSide) => {
    setActiveSide(side);
    setGuidelinesVisible(true);
  };

  const handleGuidelinesContinue = () => {
    setGuidelinesVisible(false);
    setSourceModalVisible(true);
  };

  const handleSourceChoice = async (useCamera: boolean) => {
    setSourceModalVisible(false);
    await onPickImage(activeSide, useCamera);
  };

  const handleOpenPreview = (side: CardSide) => {
    const list: string[] = [];
    let initialIdx = 0;
    if (frontResolved) list.push(frontResolved);
    if (backResolved) {
      list.push(backResolved);
      if (side === 'back') initialIdx = list.length - 1;
    }

    if (list.length === 0) return;
    setPreviewImages(list);
    setPreviewIndex(initialIdx);
    setPreviewVisible(true);
  };

  const handleRemove = (side: CardSide) => {
    if (onRemoveImage) {
      onRemoveImage(side);
    }
  };

  return (
    <View style={styles.wrapper}>
      {/* ── Section Header ── */}
      <View style={styles.sectionHeader}>
        <MaterialIcons name="credit-card" size={20} color={Colors.primary} />
        <Text style={styles.sectionTitle}>Visiting Card (Business Card)</Text>
        <Text style={styles.requiredBadge}>FRONT REQUIRED</Text>
      </View>

      <Text style={styles.sectionHint}>
        Upload clear photos of both sides of your business card.
      </Text>

      {/* ── Both Front & Back Card Slots Stack ── */}
      <View style={styles.cardSlotsStack}>
        {/* FRONT SIDE CARD SLOT */}
        <SingleCardSlot
          side="front"
          label="Front Side (Required)"
          required
          displayUri={frontResolved}
          isUploading={isUploading === 'front'}
          onPick={() => handleStartPick('front')}
          onPreview={() => handleOpenPreview('front')}
          onChangeImage={() => handleStartPick('front')}
          onRemove={() => handleRemove('front')}
        />

        {/* BACK SIDE CARD SLOT */}
        <SingleCardSlot
          side="back"
          label="Back Side (Optional)"
          required={false}
          displayUri={backResolved}
          isUploading={isUploading === 'back'}
          onPick={() => handleStartPick('back')}
          onPreview={() => handleOpenPreview('back')}
          onChangeImage={() => handleStartPick('back')}
          onRemove={() => handleRemove('back')}
        />
      </View>

      {/* Error message */}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* ── Guidelines Modal ── */}
      <Modal
        visible={guidelinesVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setGuidelinesVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.guidelinesSheet}>
            <View style={styles.sheetHeader}>
              <View style={styles.sheetDragHandle} />
              <Text style={styles.sheetTitle}>
                {activeSide === 'front' ? 'Front Side' : 'Back Side'} — Photo Tips
              </Text>
              <Text style={styles.sheetSubtitle}>
                Follow these guidelines for best results
              </Text>
            </View>

            <View style={styles.cardFrameIllustration}>
              <View style={styles.cardFrameCorner} />
              <View style={[styles.cardFrameCorner, styles.cardFrameCornerTR]} />
              <View style={[styles.cardFrameCorner, styles.cardFrameCornerBL]} />
              <View style={[styles.cardFrameCorner, styles.cardFrameCornerBR]} />
              <MaterialIcons
                name="credit-card"
                size={44}
                color="rgba(255,255,255,0.35)"
              />
              <Text style={styles.cardFrameLabel}>Place your card here</Text>
            </View>

            <ScrollView
              style={styles.guidelinesList}
              showsVerticalScrollIndicator={false}
            >
              {GUIDELINES.map((g, i) => (
                <View key={i} style={styles.guidelineItem}>
                  <View style={styles.guidelineIconCircle}>
                    <MaterialIcons name={g.icon} size={18} color={Colors.secondary} />
                  </View>
                  <View style={styles.guidelineText}>
                    <Text style={styles.guidelineTitle}>{g.title}</Text>
                    <Text style={styles.guidelineDesc}>{g.desc}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={styles.sheetActions}>
              <Pressable
                style={styles.cancelButton}
                onPress={() => setGuidelinesVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.continueButton}
                onPress={handleGuidelinesContinue}
              >
                <MaterialIcons name="arrow-forward" size={18} color="#FFFFFF" />
                <Text style={styles.continueButtonText}>Continue</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Camera / Gallery Source Modal ── */}
      <Modal
        visible={sourceModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSourceModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.sourceSheet}>
            <View style={styles.sheetDragHandle} />
            <Text style={styles.sourceTitle}>
              Upload {activeSide === 'front' ? 'Front' : 'Back'} of Card
            </Text>
            <Text style={styles.sourceSubtitle}>Choose how to add your photo</Text>

            <Pressable
              style={styles.sourceOption}
              onPress={() => handleSourceChoice(true)}
            >
              <View style={[styles.sourceIconBox, { backgroundColor: '#E8F5E9' }]}>
                <MaterialIcons name="camera-alt" size={26} color="#2E7D32" />
              </View>
              <View style={styles.sourceOptionText}>
                <Text style={styles.sourceOptionTitle}>Take a Photo</Text>
                <Text style={styles.sourceOptionDesc}>
                  Use your camera for the best quality shot
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={22} color={Colors.text.outline} />
            </Pressable>

            <Pressable
              style={styles.sourceOption}
              onPress={() => handleSourceChoice(false)}
            >
              <View style={[styles.sourceIconBox, { backgroundColor: '#E3F2FD' }]}>
                <MaterialIcons name="photo-library" size={26} color="#1565C0" />
              </View>
              <View style={styles.sourceOptionText}>
                <Text style={styles.sourceOptionTitle}>Choose from Gallery</Text>
                <Text style={styles.sourceOptionDesc}>
                  Pick an existing photo from your device
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={22} color={Colors.text.outline} />
            </Pressable>

            <Pressable
              style={styles.sourceCancelButton}
              onPress={() => setSourceModalVisible(false)}
            >
              <Text style={styles.sourceCancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Full screen Image Viewer */}
      <ImageViewer
        visible={previewVisible}
        images={previewImages}
        initialIndex={previewIndex}
        onClose={() => setPreviewVisible(false)}
      />
    </View>
  );
};

// ─── SingleCardSlot Sub-component ─────────────────────────────────────────────

interface SingleCardSlotProps {
  side: CardSide;
  label: string;
  required: boolean;
  displayUri: string;
  isUploading: boolean;
  onPick: () => void;
  onPreview: () => void;
  onChangeImage: () => void;
  onRemove: () => void;
}

const SingleCardSlot: React.FC<SingleCardSlotProps> = ({
  side,
  label,
  required,
  displayUri,
  isUploading,
  onPick,
  onPreview,
  onChangeImage,
  onRemove,
}) => {
  const hasImage = Boolean(displayUri);

  return (
    <View style={styles.slotBlock}>
      <View style={styles.slotHeaderRow}>
        <Text style={styles.slotHeaderLabel}>{label}</Text>
        {required && <Text style={styles.slotRequiredText}>*</Text>}
      </View>

      <View style={[styles.slotCardContainer, hasImage && styles.slotCardFilled]}>
        <Pressable
          onPress={hasImage ? onPreview : onPick}
          style={({ pressed }) => [styles.slotPressArea, pressed && styles.slotPressed]}
        >
          {isUploading ? (
            <View style={styles.slotLoader}>
              <ActivityIndicator size="small" color={Colors.secondary} />
              <Text style={styles.slotLoaderText}>Uploading photo...</Text>
            </View>
          ) : hasImage ? (
            <View style={styles.imagePreviewWrapper}>
              <Image
                source={{ uri: displayUri }}
                style={styles.cardImagePreview}
                contentFit="contain"
                transition={200}
              />
              <View style={styles.tickBadge}>
                <MaterialIcons name="check-circle" size={18} color="#4CAF50" />
              </View>
            </View>
          ) : (
            <View style={styles.placeholderContent}>
              <View style={styles.cornerTL} />
              <View style={styles.cornerTR} />
              <View style={styles.cornerBL} />
              <View style={styles.cornerBR} />
              <MaterialIcons
                name={side === 'front' ? 'credit-card' : 'flip'}
                size={26}
                color={Colors.text.outline}
              />
              <Text style={styles.placeholderTitle}>
                {side === 'front' ? 'Tap to pick Front image' : 'Tap to pick Back image'}
              </Text>
            </View>
          )}
        </Pressable>

        {/* Action button bar underneath when image is uploaded */}
        {hasImage && !isUploading && (
          <View style={styles.actionBar}>
            <Pressable style={styles.actionBtn} onPress={onPreview}>
              <MaterialIcons name="visibility" size={14} color={Colors.primary} />
              <Text style={styles.actionBtnText}>Preview</Text>
            </Pressable>
            <View style={styles.actionDivider} />
            <Pressable style={styles.actionBtn} onPress={onChangeImage}>
              <MaterialIcons name="edit" size={14} color={Colors.secondary} />
              <Text style={styles.actionBtnText}>Change</Text>
            </Pressable>
            <View style={styles.actionDivider} />
            <Pressable style={styles.actionBtn} onPress={onRemove}>
              <MaterialIcons name="delete" size={14} color={Colors.error} />
              <Text style={[styles.actionBtnText, { color: Colors.error }]}>Remove</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    marginTop: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text.primary,
    flex: 1,
  },
  requiredBadge: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.secondary,
    backgroundColor: '#F9D0D7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    letterSpacing: 0.5,
  },
  sectionHint: {
    fontSize: 12,
    color: Colors.text.outline,
    marginBottom: Spacing.md,
    lineHeight: 16,
  },

  cardSlotsStack: {
    gap: Spacing.md,
  },

  slotBlock: {
    width: '100%',
  },
  slotHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 2,
  },
  slotHeaderLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  slotRequiredText: {
    fontSize: 14,
    color: Colors.secondary,
    fontWeight: '900',
  },

  // Slot box styling — FIXED 125px COMPACT HEIGHT MATCHING LOGO BOX!
  slotCardContainer: {
    width: '100%',
    height: 125,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.text.outline,
    borderStyle: 'dashed',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  slotCardFilled: {
    borderStyle: 'solid',
    borderColor: '#4CAF50',
    borderWidth: 1.5,
    backgroundColor: '#FAFAFA',
  },
  slotPressArea: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotPressed: {
    opacity: 0.85,
  },

  imagePreviewWrapper: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
    position: 'relative',
    padding: 6,
  },
  cardImagePreview: {
    width: '100%',
    height: '100%',
  },
  tickBadge: {
    position: 'absolute',
    top: 6,
    right: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 1,
  },

  placeholderContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  placeholderTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.outline,
  },

  cornerTL: {
    position: 'absolute', top: 6, left: 8,
    width: 12, height: 12,
    borderTopWidth: 2, borderLeftWidth: 2,
    borderColor: Colors.text.outline, borderRadius: 1,
  },
  cornerTR: {
    position: 'absolute', top: 6, right: 8,
    width: 12, height: 12,
    borderTopWidth: 2, borderRightWidth: 2,
    borderColor: Colors.text.outline, borderRadius: 1,
  },
  cornerBL: {
    position: 'absolute', bottom: 6, left: 8,
    width: 12, height: 12,
    borderBottomWidth: 2, borderLeftWidth: 2,
    borderColor: Colors.text.outline, borderRadius: 1,
  },
  cornerBR: {
    position: 'absolute', bottom: 6, right: 8,
    width: 12, height: 12,
    borderBottomWidth: 2, borderRightWidth: 2,
    borderColor: Colors.text.outline, borderRadius: 1,
  },

  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    height: 34,
    paddingHorizontal: 6,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: '100%',
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  actionDivider: {
    width: 1,
    height: 14,
    backgroundColor: '#CBD5E1',
  },

  slotLoader: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  slotLoaderText: {
    fontSize: 11,
    color: Colors.text.outline,
    fontWeight: '600',
  },

  errorText: {
    fontSize: 12,
    color: Colors.error,
    marginTop: 6,
    fontWeight: '600',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },

  guidelinesSheet: {
    backgroundColor: Colors.primary,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingBottom: 32,
    maxHeight: '88%',
  },
  sheetHeader: {
    alignItems: 'center',
    paddingTop: 12,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  sheetDragHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 2,
    marginBottom: 14,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  sheetSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
    marginTop: 4,
    textAlign: 'center',
  },

  cardFrameIllustration: {
    marginHorizontal: Spacing.xl,
    height: 95,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    position: 'relative',
    marginBottom: Spacing.lg,
    gap: 6,
  },
  cardFrameCorner: {
    position: 'absolute', top: -2, left: -2,
    width: 18, height: 18,
    borderTopWidth: 3, borderLeftWidth: 3,
    borderColor: Colors.secondary,
    borderRadius: 2,
  },
  cardFrameCornerTR: { top: -2, left: undefined, right: -2, borderLeftWidth: 0, borderRightWidth: 3 },
  cardFrameCornerBL: { top: undefined, bottom: -2, left: -2, borderTopWidth: 0, borderBottomWidth: 3 },
  cardFrameCornerBR: { top: undefined, bottom: -2, left: undefined, right: -2, borderTopWidth: 0, borderBottomWidth: 3, borderLeftWidth: 0, borderRightWidth: 3 },
  cardFrameLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  guidelinesList: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  guidelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  guidelineIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(196,18,48,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  guidelineText: {
    flex: 1,
  },
  guidelineTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  guidelineDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
    lineHeight: 17,
  },

  sheetActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
  },
  continueButton: {
    flex: 2,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  continueButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  sourceSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: Spacing.xl,
    paddingTop: 14,
    paddingBottom: 32,
  },
  sourceTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  sourceSubtitle: {
    fontSize: 12,
    color: Colors.text.outline,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  sourceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F7',
  },
  sourceIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceOptionText: {
    flex: 1,
  },
  sourceOptionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  sourceOptionDesc: {
    fontSize: 12,
    color: Colors.text.outline,
    lineHeight: 16,
  },
  sourceCancelButton: {
    marginTop: Spacing.lg,
    height: 48,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: '#E0E4EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text.secondary,
  },
});

export default BusinessCardUpload;
