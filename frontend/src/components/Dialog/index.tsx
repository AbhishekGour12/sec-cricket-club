import React, { useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/theme';
import { PrimaryButton, OutlineButton } from '@/components/Button';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Standard Dialog Component
interface DialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

export const Dialog: React.FC<DialogProps> = ({
  visible,
  title,
  message,
  confirmLabel = 'OK',
  cancelLabel,
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.dialogBackdrop}>
        <View style={styles.dialogContainer}>
          <Text style={styles.dialogTitle}>{title}</Text>
          <Text style={styles.dialogMessage}>{message}</Text>
          <View style={styles.dialogActions}>
            {cancelLabel && onCancel && (
              <OutlineButton
                title={cancelLabel}
                onPress={onCancel}
                style={styles.dialogButton}
              />
            )}
            <PrimaryButton
              title={confirmLabel}
              onPress={onConfirm}
              style={[styles.dialogButton, cancelLabel ? { marginLeft: Spacing.sm } : {}]}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Bottom Sheet Component
interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  visible,
  onClose,
  title,
  children,
}) => {
  const insets = useSafeAreaInsets();
  const [slideAnim] = React.useState(() => new Animated.Value(SCREEN_HEIGHT));

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 280, // theme animation normal
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.sheetBackdrop}>
        <Pressable style={styles.backdropPressable} onPress={onClose} />
        <Animated.View
          style={[
            styles.sheetContainer,
            {
              transform: [{ translateY: slideAnim }],
              paddingBottom: insets.bottom + Spacing.lg,
            },
          ]}
        >
          <View style={styles.dragIndicator} />
          {title && <Text style={styles.sheetTitle}>{title}</Text>}
          <View style={styles.sheetContent}>{children}</View>
        </Animated.View>
      </View>
    </Modal>
  );
};

// SnackBar Component
interface SnackBarProps {
  visible: boolean;
  message: string;
  onDismiss: () => void;
  duration?: number;
}

export const SnackBar: React.FC<SnackBarProps> = ({
  visible,
  message,
  onDismiss,
  duration = 3000,
}) => {
  const [opacity] = React.useState(() => new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      Animated.timing(opacity, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }).start();

      const timer = setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start(() => onDismiss());
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, message, duration, opacity, onDismiss]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.snackContainer, { opacity }]}>
      <Text style={styles.snackText}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  dialogBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(14, 21, 37, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  dialogContainer: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    ...Shadows.lg,
  },
  dialogTitle: {
    ...Typography.subHeading,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  dialogMessage: {
    ...Typography.body,
    fontSize: 15,
    color: Colors.text.secondary,
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  dialogActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  dialogButton: {
    flex: 1,
    marginVertical: 0,
    height: 44,
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(14, 21, 37, 0.5)',
    justifyContent: 'flex-end',
  },
  backdropPressable: {
    ...StyleSheet.absoluteFill,
  },
  sheetContainer: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    ...Shadows.lg,
    maxHeight: '80%',
  },
  dragIndicator: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(122, 133, 160, 0.3)',
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  sheetTitle: {
    ...Typography.subHeading,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  sheetContent: {
    marginTop: Spacing.sm,
  },
  snackContainer: {
    position: 'absolute',
    bottom: Spacing.huge,
    left: Spacing.lg,
    right: Spacing.lg,
    backgroundColor: Colors.primary,
    borderRadius: Radius.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 9999,
    ...Shadows.md,
  },
  snackText: {
    ...Typography.body,
    fontSize: 14,
    color: '#FFFFFF',
  },
});
