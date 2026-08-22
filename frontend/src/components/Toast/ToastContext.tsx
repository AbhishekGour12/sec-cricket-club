import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Platform,
  StatusBar,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Colors, Radius, Shadows, Spacing } from '@/theme';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  type?: ToastType;
  title: string;
  message?: string;
  duration?: number; // in ms, default 3500
}

interface ToastItem extends ToastOptions {
  id: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (options: ToastOptions) => void;
  showSuccess: (title: string, message?: string) => void;
  showError: (title: string, message?: string) => void;
  showWarning: (title: string, message?: string) => void;
  showInfo: (title: string, message?: string) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentToast, setCurrentToast] = useState<ToastItem | null>(null);
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hideToast = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -120,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentToast(null);
    });
  }, [opacity, translateY]);

  const showToast = useCallback(
    (options: ToastOptions) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      const id = Date.now().toString();
      const toastItem: ToastItem = {
        id,
        title: options.title,
        message: options.message,
        type: options.type || 'info',
        duration: options.duration || 3500,
      };

      setCurrentToast(toastItem);

      // Animate in
      translateY.setValue(-100);
      opacity.setValue(0);

      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          friction: 8,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-hide
      timerRef.current = setTimeout(() => {
        hideToast();
      }, toastItem.duration);
    },
    [hideToast, opacity, translateY]
  );

  const showSuccess = useCallback(
    (title: string, message?: string) => showToast({ type: 'success', title, message }),
    [showToast]
  );

  const showError = useCallback(
    (title: string, message?: string) => showToast({ type: 'error', title, message }),
    [showToast]
  );

  const showWarning = useCallback(
    (title: string, message?: string) => showToast({ type: 'warning', title, message }),
    [showToast]
  );

  const showInfo = useCallback(
    (title: string, message?: string) => showToast({ type: 'info', title, message }),
    [showToast]
  );

  return (
    <ToastContext.Provider
      value={{
        showToast,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        hideToast,
      }}
    >
      {children}

      {currentToast && (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              transform: [{ translateY }],
              opacity,
            },
          ]}
          pointerEvents="box-none"
        >
          <ToastCard toast={currentToast} onClose={hideToast} />
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// ─── Toast Card Item UI ──────────────────────────────────────────────────────

const ToastCard: React.FC<{ toast: ToastItem; onClose: () => void }> = ({ toast, onClose }) => {
  const getThemeConfig = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          icon: 'check-circle' as const,
          iconColor: '#2E7D32',
          bgColor: '#FFFFFF',
          accentColor: '#4CAF50',
          chipBg: '#E8F5E9',
          titleColor: '#1B5E20',
        };
      case 'error':
        return {
          icon: 'error' as const,
          iconColor: '#D32F2F',
          bgColor: '#FFFFFF',
          accentColor: '#F44336',
          chipBg: '#FFEBEE',
          titleColor: '#B71C1C',
        };
      case 'warning':
        return {
          icon: 'warning' as const,
          iconColor: '#F57F17',
          bgColor: '#FFFFFF',
          accentColor: '#FF9800',
          chipBg: '#FFFDE7',
          titleColor: '#E65100',
        };
      case 'info':
      default:
        return {
          icon: 'info' as const,
          iconColor: Colors.primary,
          bgColor: '#FFFFFF',
          accentColor: Colors.secondary,
          chipBg: '#E8ECF5',
          titleColor: Colors.text.primary,
        };
    }
  };

  const theme = getThemeConfig(toast.type);

  return (
    <View style={[styles.toastCard, { borderLeftColor: theme.accentColor }]}>
      <View style={[styles.iconBox, { backgroundColor: theme.chipBg }]}>
        <MaterialIcons name={theme.icon} size={22} color={theme.iconColor} />
      </View>
      <View style={styles.textStack}>
        <Text style={[styles.toastTitle, { color: theme.titleColor }]}>{toast.title}</Text>
        {!!toast.message && <Text style={styles.toastMessage}>{toast.message}</Text>}
      </View>
      <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={10}>
        <MaterialIcons name="close" size={18} color={Colors.text.outline} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 24) + 10,
    left: Spacing.md,
    right: Spacing.md,
    zIndex: 99999,
    elevation: 99999,
    alignItems: 'center',
  },
  toastCard: {
    width: '100%',
    maxWidth: 500,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderLeftWidth: 5,
    ...Shadows.md,
    shadowColor: '#0E1525',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
    gap: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textStack: {
    flex: 1,
  },
  toastTitle: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  toastMessage: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
    lineHeight: 16,
  },
  closeBtn: {
    padding: 4,
    borderRadius: 12,
  },
});

export default ToastProvider;
