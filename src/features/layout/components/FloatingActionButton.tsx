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
  mainColor = '#3b82f6',
}: FloatingActionButtonProps) {
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
      {/* Backdrop */}
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
      <View className="absolute bottom-6 right-6" style={{ zIndex: 100 }}>
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
                <View className="bg-card rounded-lg px-3 py-2 mr-3 shadow-sm">
                  <Text className="text-foreground text-sm font-medium">
                    {action.label}
                  </Text>
                </View>

                {/* Action Button */}
                <TouchableOpacity
                  className="w-12 h-12 rounded-full items-center justify-center shadow-lg"
                  style={{
                    backgroundColor: action.color || '#6b7280',
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
              backgroundColor: mainColor,
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
              <X size={24} color="white" />
            ) : (
              <Plus size={24} color="white" />
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
  const actions: FABAction[] = [
    {
      icon: <Users size={20} color="white" />,
      label: 'Add Lead',
      onPress: onAddLead,
      color: '#3b82f6',
    },
    {
      icon: <Building2 size={20} color="white" />,
      label: 'Add Property',
      onPress: onAddProperty,
      color: '#22c55e',
    },
    {
      icon: <MessageCircle size={20} color="white" />,
      label: 'Start Chat',
      onPress: onStartChat,
      color: '#8b5cf6',
    },
  ];

  if (onAddNote) {
    actions.push({
      icon: <FileText size={20} color="white" />,
      label: 'Add Note',
      onPress: onAddNote,
      color: '#f59e0b',
    });
  }

  return <FloatingActionButton actions={actions} />;
}

export default FloatingActionButton;
