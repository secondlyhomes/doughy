/**
 * Picture-in-Picture Types
 *
 * Type definitions for PiP functionality
 */

/**
 * PiP action configuration
 */
export interface PiPAction {
  icon: string;
  title: string;
  action: string;
  enabled?: boolean;
}

/**
 * PiP configuration parameters
 */
export interface PiPParams {
  width: number;  // Aspect ratio width
  height: number; // Aspect ratio height
  autoEnter?: boolean;
  actions?: PiPAction[];
  title?: string;
  subtitle?: string;
}

/**
 * PiP state
 */
export interface PiPState {
  isInPipMode: boolean;
  isSupported: boolean;
  aspectRatio: { width: number; height: number };
}

/**
 * PiP enter result
 */
export interface PiPEnterResult {
  success: boolean;
  error?: string;
}

/**
 * Aspect ratio type
 */
export interface AspectRatio {
  width: number;
  height: number;
}

/**
 * PiP hook return type
 */
export interface UsePictureInPictureReturn {
  isInPipMode: boolean;
  isSupported: boolean;
  enterPiP: (customParams?: PiPParams) => Promise<PiPEnterResult>;
  exitPiP: () => Promise<void>;
  updatePiP: (updates: Partial<PiPParams>) => Promise<void>;
}

/**
 * Video player with PiP props
 */
export interface VideoPlayerWithPiPProps {
  videoUrl: string;
  aspectRatio?: AspectRatio;
  autoEnterOnBackground?: boolean;
}

/**
 * PiP mode change event
 */
export interface PiPModeChangeEvent {
  isInPipMode: boolean;
}

/**
 * PiP action received event
 */
export interface PiPActionEvent {
  action: string;
}
