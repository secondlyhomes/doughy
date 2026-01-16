/**
 * EmptyPortfolioState Component
 * Displays empty state when user has no properties in portfolio
 *
 * Features:
 * - Friendly illustration/icon
 * - Contextual message
 * - Call-to-action buttons
 * - Different variants for different contexts (first time, filtered, error)
 * - Follows ListEmptyState pattern
 *
 * Follows Zone B design system with zero hardcoded values.
 */

import React from 'react';
import { View, Text, ViewStyle } from 'react-native';
import { Home, Search, Filter, AlertCircle, Plus } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { SPACING, BORDER_RADIUS, ICON_SIZES } from '@/constants/design-tokens';
import { Button } from './Button';

export type EmptyPortfolioStateType = 'first_time' | 'filtered' | 'search' | 'error';

export interface EmptyPortfolioAction {
  /** Action label */
  label: string;

  /** onPress handler */
  onPress: () => void;

  /** Button variant */
  variant?: 'default' | 'outline';

  /** Icon (optional) */
  icon?: React.ReactNode;
}

export interface EmptyPortfolioStateProps {
  /** Type of empty state */
  type?: EmptyPortfolioStateType;

  /** Custom title (overrides default) */
  title?: string;

  /** Custom description (overrides default) */
  description?: string;

  /** Actions to display */
  actions?: EmptyPortfolioAction[];

  /** Custom style */
  style?: ViewStyle;
}

/**
 * Gets default content for each type
 */
function getDefaultContent(type: EmptyPortfolioStateType): {
  icon: typeof Home;
  iconColor: string;
  title: string;
  description: string;
} {
  switch (type) {
    case 'first_time':
      return {
        icon: Home,
        iconColor: 'primary',
        title: 'Start Building Your Portfolio',
        description: 'Add your first property to track deals, documents, and metrics all in one place.',
      };
    case 'filtered':
      return {
        icon: Filter,
        iconColor: 'mutedForeground',
        title: 'No Properties Match',
        description: 'Try adjusting your filters to see more results.',
      };
    case 'search':
      return {
        icon: Search,
        iconColor: 'mutedForeground',
        title: 'No Properties Found',
        description: 'We couldn\'t find any properties matching your search.',
      };
    case 'error':
      return {
        icon: AlertCircle,
        iconColor: 'destructive',
        title: 'Unable to Load Properties',
        description: 'Something went wrong. Please try again.',
      };
  }
}

export function EmptyPortfolioState({
  type = 'first_time',
  title,
  description,
  actions,
  style,
}: EmptyPortfolioStateProps) {
  const colors = useThemeColors();
  const defaultContent = getDefaultContent(type);

  const Icon = defaultContent.icon;
  const iconColor = colors[defaultContent.iconColor as keyof typeof colors] || colors.primary;
  const displayTitle = title || defaultContent.title;
  const displayDescription = description || defaultContent.description;

  return (
    <View
      style={[
        {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: SPACING['2xl'],
        },
        style,
      ]}
    >
      {/* Icon */}
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: BORDER_RADIUS.full,
          backgroundColor: withOpacity(iconColor as string, 'muted'),
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: SPACING.lg,
        }}
      >
        <Icon size={40} color={iconColor as string} />
      </View>

      {/* Title */}
      <Text
        style={{
          fontSize: 20,
          fontWeight: '700',
          color: colors.foreground,
          textAlign: 'center',
          marginBottom: SPACING.sm,
        }}
      >
        {displayTitle}
      </Text>

      {/* Description */}
      <Text
        style={{
          fontSize: 15,
          color: colors.mutedForeground,
          textAlign: 'center',
          marginBottom: SPACING.xl,
          maxWidth: 320,
          lineHeight: 22,
        }}
      >
        {displayDescription}
      </Text>

      {/* Actions */}
      {actions && actions.length > 0 && (
        <View style={{ gap: SPACING.sm, width: '100%', maxWidth: 320 }}>
          {actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || (index === 0 ? 'default' : 'outline')}
              onPress={action.onPress}
              style={{ width: '100%' }}
            >
              {action.icon && (
                <View style={{ marginRight: SPACING.sm }}>
                  {action.icon}
                </View>
              )}
              {action.label}
            </Button>
          ))}
        </View>
      )}
    </View>
  );
}

/**
 * Preset: First time empty state with default actions
 */
export function EmptyPortfolioFirstTime({
  onAddProperty,
  onBrowseMarket,
}: {
  onAddProperty: () => void;
  onBrowseMarket?: () => void;
}) {
  const colors = useThemeColors();

  const actions: EmptyPortfolioAction[] = [
    {
      label: 'Add First Property',
      onPress: onAddProperty,
      variant: 'default',
      icon: <Plus size={ICON_SIZES.md} color={colors.primaryForeground} />,
    },
  ];

  if (onBrowseMarket) {
    actions.push({
      label: 'Browse Market',
      onPress: onBrowseMarket,
      variant: 'outline',
    });
  }

  return (
    <EmptyPortfolioState
      type="first_time"
      actions={actions}
    />
  );
}

/**
 * Preset: Search/filter empty state
 */
export function EmptyPortfolioFiltered({
  onClearFilters,
}: {
  onClearFilters: () => void;
}) {
  const actions: EmptyPortfolioAction[] = [
    {
      label: 'Clear Filters',
      onPress: onClearFilters,
      variant: 'outline',
    },
  ];

  return (
    <EmptyPortfolioState
      type="filtered"
      actions={actions}
    />
  );
}

/**
 * Preset: Error state with retry
 */
export function EmptyPortfolioError({
  onRetry,
}: {
  onRetry: () => void;
}) {
  const actions: EmptyPortfolioAction[] = [
    {
      label: 'Try Again',
      onPress: onRetry,
      variant: 'default',
    },
  ];

  return (
    <EmptyPortfolioState
      type="error"
      actions={actions}
    />
  );
}
