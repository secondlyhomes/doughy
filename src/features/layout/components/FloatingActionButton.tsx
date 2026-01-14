// Floating Action Button Component - React Native
// Zone D: Expandable FAB with quick action menu

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Pressable,
  StyleSheet,
} from 'react-native';
import {
  Plus,
  X,
  Users,
  Building2,
  MessageCircle,
  FileText,
} from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { TAB_BAR_SAFE_PADDING } from '@/components/ui/FloatingGlassTabBar';

export interface FABAction {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  color?: string;
}

interface FloatingActionButtonProps {
  actions: FABAction[];
  mainColor?: string;
}

export function FloatingActionButton({
  actions,
  mainColor,
}: FloatingActionButtonProps) {
  const colors = useThemeColors();
  const fabColor = mainColor ?? colors.primary;
  const [isOpen, setIsOpen] = useState(false);
  const animation = useRef(new Animated.Value(0)).current;
  const rotateAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.parallel([
      Animated.spring(animation, {
        toValue: isOpen ? 1 : 0,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(rotateAnimation, {
        toValue: isOpen ? 1 : 0,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]);
    anim.start();
    return () => anim.stop();
    // animation and rotateAnimation are stable refs, only isOpen triggers the effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleActionPress = (action: FABAction) => {
    setIsOpen(false);
    // Small delay to let animation start before navigation
    setTimeout(() => {
      action.onPress();
    }, 100);
  };

  const rotation = rotateAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  const backdropOpacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.5],
  });

  return (
    <>
      {/* Backdrop - using black for overlay is standard UX */}
      {isOpen && (
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            {
              backgroundColor: '#000',
              opacity: backdropOpacity,
            },
          ]}
        >
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={() => setIsOpen(false)}
            accessibilityLabel="Close quick actions menu"
            accessibilityRole="button"
          />
        </Animated.View>
      )}

      {/* FAB Container */}
      <View className="absolute right-6" style={{ zIndex: 100, bottom: TAB_BAR_SAFE_PADDING }}>
        {/* Action Buttons */}
        {actions.map((action, index) => {
          const translateY = animation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -60 * (index + 1)],
          });

          const scale = animation.interpolate({
            inputRange: [0, 1],
            outputRange: [0.5, 1],
          });

          const opacity = animation.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0, 0, 1],
          });

          return (
            <Animated.View
              key={index}
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                transform: [{ translateY }, { scale }],
                opacity,
              }}
            >
              <View className="flex-row items-center">
                {/* Label */}
                <View className="rounded-lg px-3 py-2 mr-3 shadow-sm" style={{ backgroundColor: colors.card }}>
                  <Text className="text-foreground text-sm font-medium">
                    {action.label}
                  </Text>
                </View>

                {/* Action Button */}
                <TouchableOpacity
                  className="w-12 h-12 rounded-full items-center justify-center shadow-lg"
                  style={{
                    backgroundColor: action.color || colors.mutedForeground,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 3,
                    elevation: 5,
                  }}
                  onPress={() => handleActionPress(action)}
                  activeOpacity={0.8}
                  accessibilityLabel={action.label}
                  accessibilityRole="button"
                >
                  {action.icon}
                </TouchableOpacity>
              </View>
            </Animated.View>
          );
        })}

        {/* Main FAB Button */}
        <Animated.View style={{ transform: [{ rotate: rotation }] }}>
          <TouchableOpacity
            className="w-14 h-14 rounded-full items-center justify-center shadow-lg"
            style={{
              backgroundColor: fabColor,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 4,
              elevation: 5,
            }}
            onPress={toggleMenu}
            activeOpacity={0.8}
            accessibilityLabel={isOpen ? 'Close quick actions' : 'Open quick actions'}
            accessibilityRole="button"
            accessibilityState={{ expanded: isOpen }}
          >
            {isOpen ? (
              <X size={24} color={colors.primaryForeground} />
            ) : (
              <Plus size={24} color={colors.primaryForeground} />
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>
    </>
  );
}

// Pre-configured FAB with common actions
interface QuickActionFABProps {
  onAddLead: () => void;
  onAddProperty: () => void;
  onStartChat: () => void;
  onAddNote?: () => void;
}

export function QuickActionFAB({
  onAddLead,
  onAddProperty,
  onStartChat,
  onAddNote,
}: QuickActionFABProps) {
  const colors = useThemeColors();

  const actions: FABAction[] = [
    {
      icon: <Users size={20} color={colors.primaryForeground} />,
      label: 'Add Lead',
      onPress: onAddLead,
      color: colors.info,
    },
    {
      icon: <Building2 size={20} color={colors.primaryForeground} />,
      label: 'Add Property',
      onPress: onAddProperty,
      color: colors.success,
    },
    {
      icon: <MessageCircle size={20} color={colors.primaryForeground} />,
      label: 'Start Chat',
      onPress: onStartChat,
      color: colors.primary,
    },
  ];

  if (onAddNote) {
    actions.push({
      icon: <FileText size={20} color={colors.primaryForeground} />,
      label: 'Add Note',
      onPress: onAddNote,
      color: colors.warning,
    });
  }

  return <FloatingActionButton actions={actions} />;
}

export default FloatingActionButton;
