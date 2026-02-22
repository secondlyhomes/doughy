// src/components/ui/tab-bar-helpers.ts
// Helper functions for FloatingGlassTabBar

// Safe haptics - requires native rebuild to work
export const triggerHaptic = async () => {
  try {
    const Haptics = await import('expo-haptics');
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // Haptics not available - native module not linked yet
  }
};

// Format badge text (caps at 99+)
export const formatBadge = (badge: number | string): string => {
  if (typeof badge === 'number' && badge > 99) return '99+';
  return String(badge);
};
