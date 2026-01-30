// src/components/ui/PropertyImageCard.tsx
// Generic reusable property card with image, badge overlay, and flexible metrics
// Used across investor (portfolio) and landlord (rental) modules

import React, { memo } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Home, MapPin, ChevronRight } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { SPACING, FONT_SIZES, BORDER_RADIUS, PRESS_OPACITY } from '@/constants/design-tokens';
import { MetricsRow, Metric } from './MetricsRow';
import { GlassView, isLiquidGlassSupported } from './GlassView';

export type BadgeVariant = 'success' | 'warning' | 'info' | 'destructive' | 'secondary';

export interface PropertyImageCardBadgeOverlay {
  label: string;
  variant: BadgeVariant;
  icon?: LucideIcon;
}

export interface PropertyImageCardProps {
  // Image Section
  /** URL of the property image */
  imageUrl?: string | null;
  /** Icon to show when no image is available (default: Home) */
  imagePlaceholderIcon?: LucideIcon;
  /** Height of the image section (default: 140) */
  imageHeight?: number;

  // Badge Overlay (top-right of image)
  /** Badge displayed on top-right of the image */
  badgeOverlay?: PropertyImageCardBadgeOverlay;

  // Content Section
  /** Main title (e.g., property name or address) */
  title: string;
  /** Subtitle with location icon (e.g., "Austin, TX") */
  subtitle?: string;

  // Metrics Row (flexible - accepts 2-4 metrics)
  /** Array of metrics to display below the title */
  metrics: Metric[];

  // Optional Footer
  /** Custom footer content (e.g., occupancy bar) */
  footerContent?: React.ReactNode;

  // Actions
  /** Callback when card is pressed */
  onPress: () => void;

  // Styling
  /** Card variant: 'default' for solid, 'glass' for liquid glass effect */
  variant?: 'default' | 'glass';
  /** Blur intensity for glass variant (0-100). Default: 55 */
  glassIntensity?: number;
  /** Whether to show the chevron arrow on the right */
  showChevron?: boolean;
  /** Whether the card is in a selected state (shows primary border) */
  isSelected?: boolean;
}

function getBadgeColors(
  variant: BadgeVariant,
  colors: ReturnType<typeof useThemeColors>
): { bg: string; text: string } {
  // Use 'opaque' (50%) opacity for better visibility on light images
  // Badge text uses destructiveForeground (always white) for contrast on colored backgrounds
  const whiteText = colors.destructiveForeground;
  switch (variant) {
    case 'success':
      return { bg: withOpacity(colors.success, 'opaque'), text: whiteText };
    case 'warning':
      return { bg: withOpacity(colors.warning, 'opaque'), text: whiteText };
    case 'info':
      return { bg: withOpacity(colors.info, 'opaque'), text: whiteText };
    case 'destructive':
      return { bg: withOpacity(colors.destructive, 'opaque'), text: whiteText };
    case 'secondary':
    default:
      return { bg: withOpacity(colors.muted, 'almostOpaque'), text: colors.foreground };
  }
}

function PropertyImageCardComponent({
  imageUrl,
  imagePlaceholderIcon: PlaceholderIcon = Home,
  imageHeight = 140,
  badgeOverlay,
  title,
  subtitle,
  metrics,
  footerContent,
  onPress,
  variant = 'default',
  glassIntensity = 55,
  showChevron = true,
  isSelected = false,
}: PropertyImageCardProps) {
  const colors = useThemeColors();
  const useGlass = variant === 'glass' && isLiquidGlassSupported;

  const badgeColors = badgeOverlay ? getBadgeColors(badgeOverlay.variant, colors) : null;

  const cardContent = (
    <>
      {/* Image Section */}
      <View style={[styles.imageContainer, { height: imageHeight }]}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: colors.muted }]}>
            <PlaceholderIcon size={40} color={colors.mutedForeground} />
          </View>
        )}

        {/* Badge Overlay */}
        {badgeOverlay && badgeColors && (
          <View
            style={[
              styles.badgeOverlay,
              { backgroundColor: badgeColors.bg },
            ]}
          >
            {badgeOverlay.icon && (
              <badgeOverlay.icon size={12} color={badgeColors.text} />
            )}
            <Text
              style={[
                styles.badgeText,
                { color: badgeColors.text, marginLeft: badgeOverlay.icon ? 4 : 0 },
              ]}
            >
              {badgeOverlay.label}
            </Text>
          </View>
        )}
      </View>

      {/* Content Section */}
      <View style={styles.content}>
        {/* Title Row */}
        <View style={styles.titleRow}>
          <View style={styles.titleContainer}>
            <Text
              style={[styles.title, { color: colors.foreground }]}
              numberOfLines={1}
            >
              {title}
            </Text>
            {subtitle && (
              <View style={styles.subtitleRow}>
                <MapPin size={12} color={colors.mutedForeground} />
                <Text
                  style={[styles.subtitle, { color: colors.mutedForeground }]}
                  numberOfLines={1}
                >
                  {subtitle}
                </Text>
              </View>
            )}
          </View>
          {showChevron && <ChevronRight size={20} color={colors.mutedForeground} />}
        </View>

        {/* Metrics Row */}
        {metrics.length > 0 && (
          <View style={styles.metricsContainer}>
            <MetricsRow metrics={metrics} size="sm" />
          </View>
        )}

        {/* Footer Content */}
        {footerContent && <View style={styles.footerContainer}>{footerContent}</View>}
      </View>
    </>
  );

  if (useGlass) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={PRESS_OPACITY.DEFAULT}
        accessibilityRole="button"
        accessibilityLabel={`View ${title}`}
        style={isSelected ? {
          borderWidth: 2,
          borderColor: colors.primary,
          borderRadius: BORDER_RADIUS.xl,
        } : undefined}
      >
        <GlassView
          intensity={glassIntensity}
          style={[styles.card, { overflow: 'hidden' }]}
        >
          {cardContent}
        </GlassView>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderWidth: isSelected ? 2 : 1,
          borderColor: isSelected ? colors.primary : colors.border,
        },
      ]}
      activeOpacity={PRESS_OPACITY.DEFAULT}
      accessibilityRole="button"
      accessibilityLabel={`View ${title}`}
    >
      {cardContent}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeOverlay: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
  },
  badgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  content: {
    padding: SPACING.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  titleContainer: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  subtitle: {
    fontSize: FONT_SIZES.sm,
    marginLeft: 4,
  },
  metricsContainer: {
    marginTop: SPACING.sm,
  },
  footerContainer: {
    marginTop: SPACING.sm,
  },
});

// Memoize with custom comparison for better list performance
export const PropertyImageCard = memo(PropertyImageCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.imageUrl === nextProps.imageUrl &&
    prevProps.title === nextProps.title &&
    prevProps.subtitle === nextProps.subtitle &&
    prevProps.variant === nextProps.variant &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.badgeOverlay?.label === nextProps.badgeOverlay?.label &&
    prevProps.badgeOverlay?.variant === nextProps.badgeOverlay?.variant &&
    JSON.stringify(prevProps.metrics) === JSON.stringify(nextProps.metrics) &&
    prevProps.footerContent === nextProps.footerContent
  );
});
