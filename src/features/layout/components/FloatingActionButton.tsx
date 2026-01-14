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
import { FAB_BOTTOM_OFFSET, FAB_RIGHT_MARGIN, FAB_Z_INDEX, FAB_SIZE } from '@/components/ui/FloatingGlassTabBar';
import { getFABShadowStyle } from '@/components/ui/fab-styles';
import { withOpacity } from '@/lib/design-utils';

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
      {/* Backdrop - uses theme background with opacity for proper dark mode support */}
      {isOpen && (
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            {
              backgroundColor: withOpacity(colors.background, 'backdrop'),
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
      <View style={{ position: 'absolute', zIndex: FAB_Z_INDEX.EXPANDABLE, bottom: FAB_BOTTOM_OFFSET, right: FAB_RIGHT_MARGIN }}>
        {/* Action Buttons */}
        {actions.map((action, index) => {
          // Simple vertical stack positioning
          const spacing = 70; // Distance between each button
          const leftOffset = -4; // Fine-tune alignment with main FAB

          // Stack vertically upward
          const targetX = leftOffset;
          const targetY = -spacing * (index + 1);

          const translateX = animation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, targetX],
          });

          const translateY = animation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, targetY],
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
                transform: [{ translateX }, { translateY }, { scale }],
                opacity,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
                {/* Label */}
                <View className="rounded-lg px-3 py-2 mr-3 shadow-sm" style={{ backgroundColor: colors.card, maxWidth: 200 }}>
                  <Text className="text-sm font-medium" style={{ color: colors.foreground }} numberOfLines={1}>
                    {action.label}
                  </Text>
                </View>

                {/* Action Button */}
                <TouchableOpacity
                  style={[
                    {
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: action.color || colors.mutedForeground,
                      alignItems: 'center',
                      justifyContent: 'center',
                    },
                    getFABShadowStyle(colors),
                  ]}
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
            style={[
              {
                width: FAB_SIZE,
                height: FAB_SIZE,
                borderRadius: FAB_SIZE / 2,
                backgroundColor: fabColor,
                alignItems: 'center',
                justifyContent: 'center',
              },
              getFABShadowStyle(colors),
            ]}
            onPress={toggleMenu}
            activeOpacity={0.8}
            accessibilityLabel={isOpen ? 'Close quick actions' : 'Open quick actions'}
            accessibilityRole="button"
            accessibilityState={{ expanded: isOpen }}
          >
            {isOpen ? (
              <X size={28} color={colors.primaryForeground} />
            ) : (
              <Plus size={28} color={colors.primaryForeground} />
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
