// src/components/navigation/EntityHeader.tsx
// Unified header component for Deal/Property screens with context switching
// Provides seamless navigation between related Deal and Property entities

import React, { useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  MoreHorizontal,
  Building2,
  Handshake,
  Plus,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/context/ThemeContext';
import { ContextSwitcher, type ContextOption } from '@/components/ui/ContextSwitcher';
import { SPACING, ICON_SIZES } from '@/constants/design-tokens';

// ============================================
// Types
// ============================================

export type EntityContext = 'deal' | 'property';

export interface EntityHeaderProps {
  /** Current context (deal or property) */
  context: EntityContext;

  /** Deal ID (required for deal context, optional for property with linked deal) */
  dealId?: string;

  /** Property ID (required for property context, optional for deal with linked property) */
  propertyId?: string;

  /** Whether a property is linked to this deal */
  hasLinkedProperty?: boolean;

  /** Whether a deal is linked to this property */
  hasLinkedDeal?: boolean;

  /** Number of deals linked to this property (for multi-deal properties) */
  linkedDealCount?: number;

  /** Callback when context changes */
  onContextChange?: (context: EntityContext, entityId: string) => void;

  /** Callback to create new deal from property */
  onCreateDeal?: () => void;

  /** Callback to link property to deal */
  onLinkProperty?: () => void;

  /** Callback when deal selector should be shown (for multi-deal properties) */
  onSelectDeal?: () => void;

  /** Phone number for call action (deal context only) */
  phoneNumber?: string;

  /** Callback for more options */
  onMore?: () => void;

  /** Callback for share action (property context) */
  onShare?: () => void;

  /** Custom back handler */
  onBack?: () => void;

  /** Label to show for back button */
  backLabel?: string;
}

// ============================================
// EntityHeader Component
// ============================================

export function EntityHeader({
  context,
  dealId,
  propertyId,
  hasLinkedProperty = false,
  hasLinkedDeal = false,
  linkedDealCount = 0,
  onContextChange,
  onCreateDeal,
  onLinkProperty,
  onSelectDeal,
  phoneNumber,
  onMore,
  onShare,
  onBack,
  backLabel,
}: EntityHeaderProps) {
  const colors = useThemeColors();
  const router = useRouter();

  // Build context options based on available links
  // Order: Deal | Property (deal first for consistency)
  const contextOptions = useMemo<ContextOption[]>(() => {
    const options: ContextOption[] = [];

    // Deal option (first)
    if (context === 'deal') {
      options.push({
        id: 'deal',
        label: 'Deal',
        icon: <Handshake size={14} color={colors.foreground} />,
      });
    } else {
      // We're in property context
      const hasDeal = hasLinkedDeal || linkedDealCount > 0;
      options.push({
        id: 'deal',
        label: linkedDealCount > 1 ? `Deals (${linkedDealCount})` : 'Deal',
        icon: <Handshake size={14} color={hasDeal ? colors.mutedForeground : colors.mutedForeground} />,
        disabled: !hasDeal,
        disabledReason: 'No deals linked',
      });
    }

    // Property option (second)
    if (context === 'property') {
      options.push({
        id: 'property',
        label: 'Property',
        icon: <Building2 size={14} color={colors.foreground} />,
      });
    } else {
      // We're in deal context
      options.push({
        id: 'property',
        label: 'Property',
        icon: <Building2 size={14} color={hasLinkedProperty ? colors.mutedForeground : colors.mutedForeground} />,
        disabled: !hasLinkedProperty,
        disabledReason: 'No property linked',
      });
    }

    return options;
  }, [context, hasLinkedProperty, hasLinkedDeal, linkedDealCount, colors]);

  // Handle context switch
  const handleContextSwitch = useCallback(
    (newContextId: string) => {
      if (newContextId === context) return;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      if (newContextId === 'property' && propertyId) {
        if (onContextChange) {
          onContextChange('property', propertyId);
        } else {
          // Default navigation
          router.push({
            pathname: `/(tabs)/deals/property/${propertyId}` as any,
            params: dealId ? { fromDeal: dealId } : undefined,
          });
        }
      } else if (newContextId === 'deal') {
        if (linkedDealCount > 1 && onSelectDeal) {
          // Show deal selector for multi-deal properties
          onSelectDeal();
        } else if (dealId) {
          if (onContextChange) {
            onContextChange('deal', dealId);
          } else {
            // Default navigation
            router.push({
              pathname: `/(tabs)/deals/${dealId}` as any,
              params: propertyId ? { fromProperty: propertyId } : undefined,
            });
          }
        }
      }
    },
    [context, propertyId, dealId, linkedDealCount, onContextChange, onSelectDeal, router]
  );

  // Handle back navigation
  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  }, [onBack, router]);

  // Handle more options
  const handleMore = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onMore) {
      onMore();
    } else {
      Alert.alert('Options', 'More options coming soon!', [{ text: 'OK' }]);
    }
  }, [onMore]);

  // Handle create/link actions for disabled states
  const handleDisabledAction = useCallback(
    (contextId: string) => {
      if (contextId === 'property' && !hasLinkedProperty) {
        if (onLinkProperty) {
          onLinkProperty();
        } else {
          Alert.alert(
            'Link Property',
            'Link a property to this deal to view property details.',
            [{ text: 'OK' }]
          );
        }
      } else if (contextId === 'deal' && !hasLinkedDeal && linkedDealCount === 0) {
        if (onCreateDeal) {
          onCreateDeal();
        } else {
          Alert.alert(
            'Create Deal',
            'Create a deal for this property to track your progress.',
            [{ text: 'OK' }]
          );
        }
      }
    },
    [hasLinkedProperty, hasLinkedDeal, linkedDealCount, onLinkProperty, onCreateDeal]
  );

  // Determine if we should show the "create/link" button
  const showActionButton = useMemo(() => {
    if (context === 'deal' && !hasLinkedProperty) {
      return { show: true, label: 'Link Property', action: () => handleDisabledAction('property') };
    }
    if (context === 'property' && !hasLinkedDeal && linkedDealCount === 0) {
      return { show: true, label: 'Create Deal', action: () => handleDisabledAction('deal') };
    }
    return { show: false };
  }, [context, hasLinkedProperty, hasLinkedDeal, linkedDealCount, handleDisabledAction]);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.sm,
      }}
    >
      {/* Left side: Back button */}
      <TouchableOpacity
        onPress={handleBack}
        accessibilityLabel={backLabel ? `Go back to ${backLabel}` : 'Go back'}
        accessibilityRole="button"
        style={{
          minWidth: 50,
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: SPACING.xs,
          paddingRight: SPACING.sm,
        }}
      >
        <ArrowLeft size={ICON_SIZES.md} color={colors.foreground} />
        {backLabel && (
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
        )}
      </TouchableOpacity>

      {/* Center: Context Switcher */}
      <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: SPACING.sm }}>
        {(hasLinkedProperty || hasLinkedDeal || linkedDealCount > 0) ? (
          <ContextSwitcher
            contexts={contextOptions}
            value={context}
            onChange={handleContextSwitch}
            size="sm"
          />
        ) : showActionButton.show ? (
          <TouchableOpacity
            onPress={showActionButton.action}
            accessibilityLabel={showActionButton.label}
            accessibilityRole="button"
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
            <Text
              style={{
                fontSize: 13,
                fontWeight: '600',
                color: colors.primary,
                marginLeft: SPACING.xs,
              }}
            >
              {showActionButton.label}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Right side: Actions */}
      <View style={{ minWidth: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
        {/* Note: Phone for deals and Share for properties moved to action sheets */}
        <TouchableOpacity
          onPress={handleMore}
          accessibilityLabel="More options"
          accessibilityRole="button"
          style={{ padding: SPACING.sm }}
        >
          <MoreHorizontal size={ICON_SIZES.lg} color={colors.foreground} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default EntityHeader;
