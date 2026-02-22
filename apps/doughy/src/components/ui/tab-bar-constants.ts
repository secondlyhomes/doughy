// src/components/ui/tab-bar-constants.ts
// Constants for FloatingGlassTabBar — exported for use in layouts and FAB positioning

// Constants - exported for use in layouts
// NOTE: With NativeTabs, iOS automatically handles tab bar + safe area insets.
// These values are for visual breathing room only, not to clear the tab bar.
export const TAB_BAR_HEIGHT = 49;           // Native iOS tab bar height (for reference)
export const TAB_BAR_BOTTOM_OFFSET = 0;
/** Minimal padding for visual breathing room (iOS handles tab bar clearance with NativeTabs) */
export const TAB_BAR_SAFE_PADDING = 16;

/** Standard FAB positioning (above tab bar + safe area) */
export const FAB_BOTTOM_OFFSET = 24;
export const FAB_RIGHT_MARGIN = 24;
export const FAB_LEFT_MARGIN = 24;

/** FAB z-index hierarchy */
export const FAB_Z_INDEX = {
  ASSISTANT: 1000,   // DealAssistant (draggable)
  EXPANDABLE: 900,   // QuickActionFAB (with backdrop)
  SIMPLE: 800,       // SimpleFAB (basic add button)
} as const;

/** Standard FAB size */
export const FAB_SIZE = 56;

export const PILL_BORDER_RADIUS = 30;
export const SELECTOR_SIZE = 70;
export const SPRING_CONFIG = { damping: 42, stiffness: 180 };

// Tab labels fallback mapping (only used if options.title is not set)
export const TAB_LABELS_FALLBACK: Record<string, string> = {
  index: 'Dashboard',
  deals: 'Deals',
  properties: 'Properties',
  settings: 'Settings',
};
