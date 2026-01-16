// src/components/navigation/SmartBackButton.tsx
// Smart Back Button - Zone G Week 7
// Context-aware back button that shows the destination label

import React, { useCallback, useMemo } from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { useRouter, usePathname, useSegments } from 'expo-router';
import { ArrowLeft, ChevronLeft } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/context/ThemeContext';
import { SPACING, ICON_SIZES } from '@/constants/design-tokens';

// ============================================
// Types
// ============================================

export interface SmartBackButtonProps {
  /** Optional override for the label */
  labelOverride?: string;

  /** Variant style */
  variant?: 'default' | 'minimal' | 'ios';

  /** Custom onPress handler (defaults to router.back()) */
  onPress?: () => void;

  /** Accessibility label override */
  accessibilityLabel?: string;
}

// ============================================
// Route Label Mappings
// ============================================

/**
 * Maps route segments to human-readable labels
 */
const ROUTE_LABELS: Record<string, string> = {
  'deals': 'Deals',
  'leads': 'Leads',
  'properties': 'Properties',
  'portfolio': 'Portfolio',
  'settings': 'Settings',
  'index': 'Inbox',
  'conversations': 'Conversations',
  'underwrite': 'Cockpit',
  'offer': 'Cockpit',
  'docs': 'Cockpit',
  'field-mode': 'Cockpit',
  'seller-report': 'Cockpit',
};

/**
 * Get the label for the previous screen based on current route
 */
function getBackLabel(segments: string[], pathname: string): string {
  // Filter out dynamic segments like [dealId], [leadId], etc.
  const staticSegments = segments.filter((s) => !s.startsWith('['));

  // If we're in a deal detail screen (deals/[dealId])
  if (staticSegments.includes('deals') && segments.length >= 3) {
    // Check if we're in a nested screen (underwrite, offer, etc.)
    const lastSegment = segments[segments.length - 1];
    if (lastSegment === 'underwrite' || lastSegment === 'offer' ||
        lastSegment === 'docs' || lastSegment === 'field-mode' ||
        lastSegment === 'seller-report') {
      return 'Cockpit';
    }
    // We're in the cockpit screen
    return 'Deals';
  }

  // If we're in a lead detail screen
  if (staticSegments.includes('leads') && segments.length >= 3) {
    return 'Leads';
  }

  // If we're in a property detail screen
  if (staticSegments.includes('properties') && segments.length >= 3) {
    return 'Properties';
  }

  // Default to the parent segment
  if (staticSegments.length >= 2) {
    const parentSegment = staticSegments[staticSegments.length - 2];
    return ROUTE_LABELS[parentSegment] || parentSegment;
  }

  return 'Back';
}

// ============================================
// SmartBackButton Component
// ============================================

export function SmartBackButton({
  labelOverride,
  variant = 'default',
  onPress,
  accessibilityLabel,
}: SmartBackButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const segments = useSegments();
  const colors = useThemeColors();

  // Determine the back label
  const backLabel = useMemo(() => {
    if (labelOverride) return labelOverride;
    return getBackLabel(segments, pathname);
  }, [labelOverride, segments, pathname]);

  // Handle press
  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onPress) {
      onPress();
    } else {
      router.back();
    }
  }, [onPress, router]);

  // Render based on variant
  if (variant === 'minimal') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        accessibilityLabel={accessibilityLabel || `Go back to ${backLabel}`}
        accessibilityRole="button"
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={{ padding: SPACING.xs }}
      >
        <ArrowLeft size={ICON_SIZES.lg} color={colors.foreground} />
      </TouchableOpacity>
    );
  }

  if (variant === 'ios') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        accessibilityLabel={accessibilityLabel || `Go back to ${backLabel}`}
        accessibilityRole="button"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: SPACING.xs,
        }}
      >
        <ChevronLeft size={28} color={colors.primary} strokeWidth={2} />
        <Text
          style={{
            fontSize: 17,
            color: colors.primary,
            marginLeft: -4,
          }}
        >
          {backLabel}
        </Text>
      </TouchableOpacity>
    );
  }

  // Default variant
  return (
    <TouchableOpacity
      onPress={handlePress}
      accessibilityLabel={accessibilityLabel || `Go back to ${backLabel}`}
      accessibilityRole="button"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.xs,
        paddingRight: SPACING.sm,
      }}
    >
      <ArrowLeft size={ICON_SIZES.md} color={colors.foreground} />
      <Text
        style={{
          fontSize: 14,
          fontWeight: '500',
          color: colors.mutedForeground,
          marginLeft: SPACING.xs,
        }}
      >
        {backLabel}
      </Text>
    </TouchableOpacity>
  );
}

export default SmartBackButton;
