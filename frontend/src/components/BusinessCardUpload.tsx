import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  Modal,
  ActivityIndicator,
  Dimensions,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Colors, Spacing, Radius } from '@/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - Spacing.xl * 2 - Spacing.md) / 2;
const CARD_HEIGHT = CARD_WIDTH * 0.6; // Standard business card aspect ratio ~1.75:1

// ─── Types ───────────────────────────────────────────────────────────────────

type CardSide = 'front' | 'back';

interface BusinessCardUploadProps {
  /** URL string of the uploaded front card (empty string = not uploaded) */
  cardFront: string;
  /** URL string of the uploaded back card (empty string = not uploaded) */
  cardBack: string;
  /** Called after a successful upload with side + returned URL */
  onUpload: (side: CardSide, url: string) => void;
  /** Called when either card slot is pressed — caller handles actual upload API call */
  onPickImage: (side: CardSide, useCamera: boolean) => Promise<void>;
  /** Whether an upload is in progress (shows spinner on active side) */
  isUploading: CardSide | null;
  /** Optional error message shown below the cards */
  error?: string;
}

// ─── Guidelines data ─────────────────────────────────────────────────────────

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

// ─── Component ────────────────────────────────────────────────────────────────

const BusinessCardUpload: React.FC<BusinessCardUploadProps> = ({
  cardFront,
  cardBack,
  onPickImage,
  isUploading,
  error,
}) => {
  const [guidelinesVisible, setGuidelinesVisible] = useState(false);
  const [sourceModalVisible, setSourceModalVisible] = useState(false);
  const [activeSide, setActiveSide] = useState<CardSide>('front');

  // Step 1: User taps a card slot → show guidelines first
  const handleCardPress = (side: CardSide) => {
    setActiveSide(side);
    setGuidelinesVisible(true);
  };

  // Step 2: User reads guidelines and taps "Continue" → show camera/gallery choice
  const handleGuidelinesContinue = () => {
    setGuidelinesVisible(false);
    setSourceModalVisible(true);
  };

  // Step 3: User picks camera or gallery → delegate to parent
  const handleSourceChoice = async (useCamera: boolean) => {
    setSourceModalVisible(false);
    await onPickImage(activeSide, useCamera);
  };

  return (
    <View style={styles.wrapper}>
      {/* ── Section header ── */}
      <View style={styles.sectionHeader}>
        <MaterialIcons name="credit-card" size={20} color={Colors.primary} />
        <Text style={styles.sectionTitle}>Visiting Card</Text>
        <Text style={styles.requiredBadge}>FRONT REQUIRED</Text>
      </View>

      <Text style={styles.sectionHint}>
        Upload a clear photo of both sides of your business card.
      </Text>

      {/* ── Card slots grid ── */}
      <View style={styles.cardsGrid}>
        <CardSlot
          side="front"
          label="Front Side"
          required
          imageUrl={cardFront}
          isUploading={isUploading === 'front'}
          onPress={() => handleCardPress('front')}
        />
        <CardSlot
          side="back"
          label="Back Side"
          required={false}
          imageUrl={cardBack}
          isUploading={isUploading === 'back'}
          onPress={() => handleCardPress('back')}
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
            {/* Header */}
            <View style={styles.sheetHeader}>
              <View style={styles.sheetDragHandle} />
              <Text style={styles.sheetTitle}>
                {activeSide === 'front' ? 'Front Side' : 'Back Side'} — Photo Tips
              </Text>
              <Text style={styles.sheetSubtitle}>
                Follow these guidelines for best results
              </Text>
            </View>

            {/* Card frame illustration */}
            <View style={styles.cardFrameIllustration}>
              <View style={styles.cardFrameCorner} />
              <View style={[styles.cardFrameCorner, styles.cardFrameCornerTR]} />
              <View style={[styles.cardFrameCorner, styles.cardFrameCornerBL]} />
              <View style={[styles.cardFrameCorner, styles.cardFrameCornerBR]} />
              <MaterialIcons
                name="credit-card"
                size={48}
                color="rgba(255,255,255,0.3)"
              />
              <Text style={styles.cardFrameLabel}>
                Place your card here
              </Text>
            </View>

            {/* Guidelines list */}
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

            {/* Actions */}
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

            {/* Camera option */}
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
              <MaterialIcons
                name="chevron-right"
                size={22}
                color={Colors.text.outline}
              />
            </Pressable>

            {/* Gallery option */}
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
              <MaterialIcons
                name="chevron-right"
                size={22}
                color={Colors.text.outline}
              />
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
    </View>
  );
};

// ─── CardSlot sub-component ───────────────────────────────────────────────────

interface CardSlotProps {
  side: CardSide;
  label: string;
  required: boolean;
  imageUrl: string;
  isUploading: boolean;
  onPress: () => void;
}

const CardSlot: React.FC<CardSlotProps> = ({
  side,
  label,
  required,
  imageUrl,
  isUploading,
  onPress,
}) => {
  const hasImage = Boolean(imageUrl);

  return (
    <View style={styles.cardSlotWrapper}>
      {/* Label row */}
      <View style={styles.cardSlotLabelRow}>
        <Text style={styles.cardSlotLabel}>{label}</Text>
        {required && <Text style={styles.cardSlotRequired}>*</Text>}
      </View>

      {/* Card pressable area */}
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.cardSlot,
          hasImage && styles.cardSlotFilled,
          pressed && styles.cardSlotPressed,
        ]}
      >
        {isUploading ? (
          <View style={styles.cardSlotLoader}>
            <ActivityIndicator size="small" color={Colors.secondary} />
            <Text style={styles.cardSlotLoaderText}>Uploading...</Text>
          </View>
        ) : hasImage ? (
          <>
            <Image
              source={{ uri: imageUrl }}
              style={styles.cardSlotImage}
              resizeMode="cover"
            />
            {/* Edit badge overlay */}
            <View style={styles.cardSlotEditBadge}>
              <MaterialIcons name="edit" size={13} color="#FFFFFF" />
              <Text style={styles.cardSlotEditText}>Change</Text>
            </View>
            {/* Success tick */}
            <View style={styles.cardSlotSuccessTick}>
              <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
            </View>
          </>
        ) : (
          <View style={styles.cardSlotEmpty}>
            {/* Corner guides */}
            <View style={styles.cornerTL} />
            <View style={styles.cornerTR} />
            <View style={styles.cornerBL} />
            <View style={styles.cornerBR} />

            <MaterialIcons
              name={side === 'front' ? 'credit-card' : 'flip'}
              size={28}
              color={Colors.text.outline}
            />
            <Text style={styles.cardSlotEmptyTitle}>
              {side === 'front' ? 'Add Front' : 'Add Back'}
            </Text>
            <Text style={styles.cardSlotEmptyHint}>Tap to upload</Text>
          </View>
        )}
      </Pressable>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    marginTop: Spacing.md,
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  sectionTitle: {
    fontSize: 15,
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
    lineHeight: 17,
  },

  // Cards grid
  cardsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },

  // Error
  errorText: {
    fontSize: 12,
    color: Colors.error,
    marginTop: 6,
    fontWeight: '600',
  },

  // ── Card Slot ──
  cardSlotWrapper: {
    flex: 1,
  },
  cardSlotLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 2,
  },
  cardSlotLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardSlotRequired: {
    fontSize: 14,
    color: Colors.secondary,
    fontWeight: '900',
    lineHeight: 16,
  },
  cardSlot: {
    width: '100%',
    height: CARD_HEIGHT,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.text.outline,
    borderStyle: 'dashed',
    overflow: 'hidden',
    backgroundColor: '#F8F9FC',
  },
  cardSlotFilled: {
    borderStyle: 'solid',
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  cardSlotPressed: {
    opacity: 0.75,
  },

  // Empty state
  cardSlotEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    position: 'relative',
  },
  cardSlotEmptyTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text.secondary,
    marginTop: 2,
  },
  cardSlotEmptyHint: {
    fontSize: 10,
    color: Colors.text.outline,
  },

  // Corner guides on empty card slot
  cornerTL: {
    position: 'absolute', top: 8, left: 8,
    width: 14, height: 14,
    borderTopWidth: 2, borderLeftWidth: 2,
    borderColor: Colors.text.outline, borderRadius: 1,
  },
  cornerTR: {
    position: 'absolute', top: 8, right: 8,
    width: 14, height: 14,
    borderTopWidth: 2, borderRightWidth: 2,
    borderColor: Colors.text.outline, borderRadius: 1,
  },
  cornerBL: {
    position: 'absolute', bottom: 8, left: 8,
    width: 14, height: 14,
    borderBottomWidth: 2, borderLeftWidth: 2,
    borderColor: Colors.text.outline, borderRadius: 1,
  },
  cornerBR: {
    position: 'absolute', bottom: 8, right: 8,
    width: 14, height: 14,
    borderBottomWidth: 2, borderRightWidth: 2,
    borderColor: Colors.text.outline, borderRadius: 1,
  },

  // Filled state
  cardSlotImage: {
    width: '100%',
    height: '100%',
  },
  cardSlotEditBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 3,
  },
  cardSlotEditText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  cardSlotSuccessTick: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },

  // Uploading state
  cardSlotLoader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  cardSlotLoaderText: {
    fontSize: 11,
    color: Colors.text.outline,
    fontWeight: '600',
  },

  // ── Modals ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },

  // Guidelines sheet
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

  // Card frame illustration
  cardFrameIllustration: {
    marginHorizontal: Spacing.xl,
    height: 100,
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

  // Guidelines list
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

  // Sheet actions
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

  // ── Source Sheet ──
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
