// src/components/ui/ListEmptyState.tsx
// Reusable empty state component for list screens
// Handles empty, loading, error, and filtered states with consistent styling

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { Button } from './Button';
import { SPACING, ICON_SIZES } from '@/constants/design-tokens';

export type ListEmptyStateType = 'empty' | 'loading' | 'error' | 'filtered';

export interface ListEmptyAction {
  /** Action button label */
  label: string;
  /** Action button press handler */
  onPress: () => void;
  /** Button variant */
  variant?: 'default' | 'outline' | 'ghost';
}

export interface ListEmptyStateProps {
  /** State type determines icon, title, and description defaults */
  state?: ListEmptyStateType;
  /** Icon to display (overrides state default) */
  icon?: LucideIcon;
  /** Title text (overrides state default) */
  title?: string;
  /** Description text (overrides state default) */
  description?: string;
  /** Primary action button */
  primaryAction?: ListEmptyAction;
  /** Secondary action button */
  secondaryAction?: ListEmptyAction;
  /** Custom content to render instead of defaults */
  children?: React.ReactNode;
}

/**
 * Reusable empty state for list screens
 *
 * @example
 * // Empty state with add action
 * <ListEmptyState
 *   state="empty"
 *   icon={Home}
 *   title="No Properties Yet"
 *   description="Add your first property to get started."
 *   primaryAction={{ label: 'Add Property', onPress: handleAdd }}
 * />
 *
 * @example
 * // Filtered state with clear action
 * <ListEmptyState
 *   state="filtered"
 *   title="No Results"
 *   description="Try adjusting your search or filters."
 *   primaryAction={{ label: 'Clear Filters', onPress: clearFilters }}
 * />
 *
 * @example
 * // Loading state
 * <ListEmptyState state="loading" />
 *
 * @example
 * // Error state with retry
 * <ListEmptyState
 *   state="error"
 *   primaryAction={{ label: 'Try Again', onPress: retry }}
 * />
 */
export function ListEmptyState({
  state = 'empty',
  icon: Icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  children,
}: ListEmptyStateProps) {
  const colors = useThemeColors();

  // If custom children provided, render that instead
  if (children) {
    return <View style={styles.container}>{children}</View>;
  }

  // Loading state
  if (state === 'loading') {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.title, { color: colors.foreground }]}>
          {title || 'Loading...'}
        </Text>
      </View>
    );
  }

  // Error state defaults
  const errorDefaults = {
    title: 'Something Went Wrong',
    description: 'We couldn\'t load this content. Please try again.',
  };

  // Filtered state defaults
  const filteredDefaults = {
    title: 'No Results Found',
    description: 'Try adjusting your search or filters.',
  };

  // Empty state defaults
  const emptyDefaults = {
    title: 'Nothing Here Yet',
    description: 'Get started by adding your first item.',
  };

  // Select defaults based on state
  const defaults =
    state === 'error'
      ? errorDefaults
      : state === 'filtered'
      ? filteredDefaults
      : emptyDefaults;

  const displayTitle = title || defaults.title;
  const displayDescription = description || defaults.description;

  return (
    <View style={styles.container}>
      {/* Icon */}
      {Icon && (
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: colors.muted },
          ]}
        >
          <Icon size={ICON_SIZES['2xl']} color={colors.mutedForeground} />
        </View>
      )}

      {/* Title */}
      <Text style={[styles.title, { color: colors.foreground }]}>
        {displayTitle}
      </Text>

      {/* Description */}
      <Text style={[styles.description, { color: colors.mutedForeground }]}>
        {displayDescription}
      </Text>

      {/* Actions */}
      {(primaryAction || secondaryAction) && (
        <View style={styles.actionsContainer}>
          {primaryAction && (
            <Button
              onPress={primaryAction.onPress}
              variant={primaryAction.variant || 'default'}
              style={styles.actionButton}
            >
              {primaryAction.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              onPress={secondaryAction.onPress}
              variant={secondaryAction.variant || 'outline'}
              style={styles.actionButton}
            >
              {secondaryAction.label}
            </Button>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING['3xl'],
    paddingVertical: SPACING['4xl'],
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.xl,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  actionButton: {
    minWidth: 120,
  },
});

export default ListEmptyState;
