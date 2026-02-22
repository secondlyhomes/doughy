// src/features/deals/screens/cockpit/CockpitHeader.tsx
// Custom hook that builds the native header options for the Deal Cockpit screen

import React, { useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SPACING, ICON_SIZES } from '@/constants/design-tokens';
import {
  ChevronLeft,
  MoreHorizontal,
  Handshake,
  Building2,
  Plus,
} from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { ContextSwitcher, type ContextOption } from '@/components/ui/ContextSwitcher';
import type { Deal } from '../../types';

interface UseCockpitHeaderProps {
  deal: Deal | null | undefined;
  dealId: string;
  handleBack: () => void;
  onShowActionsSheet: () => void;
}

export function useCockpitHeader({
  deal,
  dealId,
  handleBack,
  onShowActionsSheet,
}: UseCockpitHeaderProps) {
  const colors = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Build context options for Deal | Property switcher
  const hasLinkedProperty = !!deal?.property_id;
  const contextOptions = useMemo<ContextOption[]>(() => {
    return [
      {
        id: 'deal',
        label: 'Deal',
        icon: <Handshake size={14} color={colors.foreground} />,
      },
      {
        id: 'property',
        label: 'Property',
        icon: <Building2 size={14} color={hasLinkedProperty ? colors.mutedForeground : colors.mutedForeground} />,
        disabled: !hasLinkedProperty,
        disabledReason: 'No property linked',
      },
    ];
  }, [hasLinkedProperty, colors]);

  // Handle context switch to property
  const handleContextSwitch = useCallback(
    (newContextId: string) => {
      if (newContextId === 'deal') return;
      if (newContextId === 'property' && deal?.property_id) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push({
          pathname: `/(tabs)/deals/property/${deal.property_id}` as any,
          params: { fromDeal: dealId },
        });
      }
    },
    [deal?.property_id, dealId, router]
  );

  // Native header options with context switcher
  const headerOptions = useMemo(() => ({
    headerShown: true,
    headerStyle: { backgroundColor: colors.background },
    headerShadowVisible: false,
    headerStatusBarHeight: insets.top,
    headerTitle: () => (
      <View style={{ alignItems: 'center' }}>
        {hasLinkedProperty ? (
          <ContextSwitcher
            contexts={contextOptions}
            value="deal"
            onChange={handleContextSwitch}
            size="sm"
          />
        ) : (
          <TouchableOpacity
            onPress={() => {
              Alert.alert('Link Property', 'Property linking coming soon!', [{ text: 'OK' }]);
            }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: SPACING.xs,
              paddingHorizontal: SPACING.md,
              borderRadius: 20,
              backgroundColor: colors.muted,
            }}
          >
            <Plus size={14} color={colors.primary} />
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.primary, marginLeft: SPACING.xs }}>
              Link Property
            </Text>
          </TouchableOpacity>
        )}
      </View>
    ),
    headerLeft: () => (
      <TouchableOpacity
        onPress={handleBack}
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: `${colors.muted}80`,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ChevronLeft size={24} color={colors.foreground} />
      </TouchableOpacity>
    ),
    headerRight: () => (
      <TouchableOpacity onPress={onShowActionsSheet} style={{ padding: SPACING.sm }}>
        <MoreHorizontal size={ICON_SIZES.lg} color={colors.foreground} />
      </TouchableOpacity>
    ),
  }), [colors, insets.top, hasLinkedProperty, contextOptions, handleContextSwitch, handleBack, onShowActionsSheet]);

  return { headerOptions };
}
