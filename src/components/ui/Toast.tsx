// src/components/ui/Toast.tsx
// React Native Toast notification component
import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, Animated, TouchableOpacity, Platform } from 'react-native';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react-native';
import { cn } from '@/lib/utils';

// Toast types
export type ToastType = 'default' | 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  title?: string;
  description?: string;
  type?: ToastType;
  duration?: number;
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

function ToastItem({ id, title, description, type = 'default', duration = 4000, onDismiss }: ToastItemProps) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

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
  }, []);

  const animateOut = () => {
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
  };

  const getIcon = () => {
    const iconProps = { size: 20 };
    switch (type) {
      case 'success':
        return <CheckCircle {...iconProps} color="#22c55e" />;
      case 'error':
        return <AlertCircle {...iconProps} color="#ef4444" />;
      case 'warning':
        return <AlertTriangle {...iconProps} color="#f59e0b" />;
      case 'info':
        return <Info {...iconProps} color="#3b82f6" />;
      default:
        return null;
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'success':
        return 'border-green-500';
      case 'error':
        return 'border-red-500';
      case 'warning':
        return 'border-yellow-500';
      case 'info':
        return 'border-blue-500';
      default:
        return 'border-border';
    }
  };

  return (
    <Animated.View
      style={{
        transform: [{ translateY }],
        opacity,
      }}
      className={cn(
        'mx-4 mb-2 flex-row items-start rounded-lg border bg-background p-4 shadow-lg',
        getBorderColor()
      )}
    >
      {getIcon() && <View className="mr-3">{getIcon()}</View>}
      <View className="flex-1">
        {title && (
          <Text className="font-semibold text-foreground">{title}</Text>
        )}
        {description && (
          <Text className="text-sm text-muted-foreground">{description}</Text>
        )}
      </View>
      <TouchableOpacity onPress={animateOut} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <X size={16} color="#64748b" />
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
