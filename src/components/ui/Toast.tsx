// src/components/ui/Toast.tsx
// React Native Toast notification component
import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, Animated, TouchableOpacity, Platform } from 'react-native';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react-native';
import { cn } from '@/lib/utils';
import { useThemeColors } from '@/context/ThemeContext';

// Toast types
export type ToastType = 'default' | 'success' | 'error' | 'warning' | 'info';

export interface ToastAction {
  /** Button label */
  label: string;
  /** Action callback */
  onPress: () => void;
}

export interface ToastMessage {
  id: string;
  title?: string;
  description?: string;
  type?: ToastType;
  duration?: number;
  /** Optional action button */
  action?: ToastAction;
}

interface ToastContextType {
  toast: (message: Omit<ToastMessage, 'id'>) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// Individual Toast component
interface ToastItemProps extends ToastMessage {
  onDismiss: () => void;
}

function ToastItem({ id, title, description, type = 'default', duration = 4000, action, onDismiss }: ToastItemProps) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const colors = useThemeColors();

  const animateOut = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => onDismiss());
  }, [translateY, opacity, onDismiss]);

  useEffect(() => {
    // Animate in
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto dismiss
    const timer = setTimeout(() => {
      animateOut();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, translateY, opacity, animateOut]);

  // Semantic colors that work in both light and dark modes
  const toastColors = {
    success: colors.success,
    error: colors.destructive,
    warning: colors.warning,
    info: colors.info,
  };

  const getIcon = () => {
    const iconProps = { size: 20 };
    switch (type) {
      case 'success':
        return <CheckCircle {...iconProps} color={toastColors.success} />;
      case 'error':
        return <AlertCircle {...iconProps} color={toastColors.error} />;
      case 'warning':
        return <AlertTriangle {...iconProps} color={toastColors.warning} />;
      case 'info':
        return <Info {...iconProps} color={toastColors.info} />;
      default:
        return null;
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'success':
        return colors.success;
      case 'error':
        return colors.destructive;
      case 'warning':
        return colors.warning;
      case 'info':
        return colors.info;
      default:
        return colors.border;
    }
  };

  const handleActionPress = useCallback(() => {
    if (action?.onPress) {
      action.onPress();
      animateOut();
    }
  }, [action, animateOut]);

  return (
    <Animated.View
      style={{
        transform: [{ translateY }],
        opacity,
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: getBorderColor(),
      }}
      className="mx-4 mb-2 flex-row items-start rounded-lg p-4 shadow-lg"
    >
      {getIcon() && <View className="mr-3">{getIcon()}</View>}
      <View className="flex-1">
        {title && (
          <Text className="font-semibold" style={{ color: colors.foreground }}>{title}</Text>
        )}
        {description && (
          <Text className="text-sm" style={{ color: colors.mutedForeground }}>{description}</Text>
        )}
        {action && (
          <TouchableOpacity
            onPress={handleActionPress}
            className="mt-2 self-start rounded-md px-3 py-1.5"
            style={{ backgroundColor: colors.primary }}
            accessibilityRole="button"
            accessibilityLabel={action.label}
          >
            <Text className="text-sm font-medium" style={{ color: colors.primaryForeground }}>
              {action.label}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      <TouchableOpacity onPress={animateOut} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityRole="button" accessibilityLabel="Dismiss">
        <X size={16} color={colors.mutedForeground} />
      </TouchableOpacity>
    </Animated.View>
  );
}

// Toast Provider
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const toast = useCallback((message: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { ...message, id }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <View
        className="absolute left-0 right-0 z-50"
        style={{ top: Platform.OS === 'ios' ? 60 : 40 }}
        pointerEvents="box-none"
      >
        {toasts.map((t) => (
          <ToastItem
            key={t.id}
            {...t}
            onDismiss={() => dismiss(t.id)}
          />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

// Standalone toast function (for use outside provider)
export const toast = {
  success: (title: string, description?: string) => {
    console.log('[Toast Success]', title, description);
  },
  error: (title: string, description?: string) => {
    console.log('[Toast Error]', title, description);
  },
  warning: (title: string, description?: string) => {
    console.log('[Toast Warning]', title, description);
  },
  info: (title: string, description?: string) => {
    console.log('[Toast Info]', title, description);
  },
};
