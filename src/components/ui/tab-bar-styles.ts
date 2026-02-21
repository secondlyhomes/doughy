// src/components/ui/tab-bar-styles.ts
// StyleSheet for FloatingGlassTabBar

import { StyleSheet } from 'react-native';
import { BADGE_CONSTANTS, FONT_SIZES, SPACING } from '@/constants/design-tokens';
import { TAB_BAR_HEIGHT, PILL_BORDER_RADIUS, SELECTOR_SIZE } from './tab-bar-constants';

export const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    height: TAB_BAR_HEIGHT,
  },
  pill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: PILL_BORDER_RADIUS,
  },
  selectorWrapper: {
    position: 'absolute',
    top: (TAB_BAR_HEIGHT - SELECTOR_SIZE) / 2,
    left: 0,
  },
  selector: {
    width: SELECTOR_SIZE,
    height: SELECTOR_SIZE,
    borderRadius: SELECTOR_SIZE / 2,
  },
  iconsLayer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tab: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: TAB_BAR_HEIGHT,
    gap: 4,
  },
  tabContent: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 8, // Content padding for measurement
  },
  iconContainer: {
    position: 'relative',
  },
  label: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
    marginTop: SPACING.xxs,
  },
  badge: {
    position: 'absolute',
    top: BADGE_CONSTANTS.OFFSET_TOP,
    right: BADGE_CONSTANTS.OFFSET_RIGHT,
    minWidth: BADGE_CONSTANTS.MIN_SIZE,
    height: BADGE_CONSTANTS.MIN_SIZE,
    borderRadius: BADGE_CONSTANTS.MIN_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: FONT_SIZES['2xs'],
    fontWeight: '600',
  },
});
