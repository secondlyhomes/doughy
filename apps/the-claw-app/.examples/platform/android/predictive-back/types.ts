/**
 * Types for Predictive Back Gesture (Android 13+)
 */

/**
 * Back gesture event data
 */
export interface BackGestureEvent {
  /** Progress of the gesture (0-1) */
  progress: number;
  /** Edge where the gesture started */
  swipeEdge: 'left' | 'right';
  /** Touch X coordinate */
  touchX: number;
  /** Touch Y coordinate */
  touchY: number;
}

/**
 * Callbacks for back gesture events
 */
export interface BackInvokedCallback {
  /** Called when back gesture starts */
  onBackStarted?: (event: BackGestureEvent) => void;
  /** Called as back gesture progresses */
  onBackProgressed?: (event: BackGestureEvent) => void;
  /** Called when back gesture is cancelled */
  onBackCancelled?: () => void;
  /** Called when back gesture is invoked/completed */
  onBackInvoked?: () => void | Promise<void>;
}

/**
 * Animation style type returned by animation presets
 */
export interface AnimationStyle {
  transform?: Array<{ [key: string]: any }>;
  opacity?: any;
}

/**
 * Return type for usePredictiveBack hook
 */
export interface UsePredictiveBackResult {
  animationValue: any;
  isGestureActive: boolean;
}
