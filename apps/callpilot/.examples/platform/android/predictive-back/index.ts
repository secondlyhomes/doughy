/**
 * Predictive Back Gesture (Android 13+)
 *
 * Implementation for Android predictive back gestures with
 * preview animations and cross-activity support.
 *
 * Features:
 * - Preview back navigation
 * - Smooth gesture animations
 * - Cancel gesture support
 * - Cross-activity animations
 *
 * Requirements:
 * - Android 13+ (API 33+) for predictive back
 * - Edge-to-edge display recommended
 *
 * Setup:
 * 1. Enable predictive back in AndroidManifest.xml
 * 2. Implement OnBackInvokedCallback
 * 3. Handle gesture animations
 *
 * @example
 * ```tsx
 * import {
 *   PredictiveBackScreen,
 *   usePredictiveBack,
 *   BackAnimations,
 * } from './predictive-back';
 *
 * // Simple usage with preset animation
 * <PredictiveBackScreen onBack={handleBack}>
 *   <ScreenContent />
 * </PredictiveBackScreen>
 *
 * // Custom animation
 * const { animationValue } = usePredictiveBack({
 *   onBackInvoked: handleBack,
 * });
 * ```
 */

// Types
export type {
  BackGestureEvent,
  BackInvokedCallback,
  AnimationStyle,
  UsePredictiveBackResult,
} from './types';

// Hooks
export { usePredictiveBack } from './hooks/usePredictiveBack';
export { useConditionalBack } from './hooks/useConditionalBack';

// Utils
export { BackAnimations, type BackAnimationType } from './utils/animations';
export { BackGestureInterceptor } from './utils/BackGestureInterceptor';

// Components
export { PredictiveBackScreen } from './components/PredictiveBackScreen';
export { CustomBackAnimation } from './components/CustomBackAnimation';
export { PredictiveBackModal } from './components/PredictiveBackModal';
export { NavigationStackItem } from './components/NavigationStackItem';

// Examples (for reference)
export { TaskDetailWithPredictiveBack } from './examples/TaskDetailWithPredictiveBack';
export { FormWithUnsavedChanges } from './examples/FormWithUnsavedChanges';
