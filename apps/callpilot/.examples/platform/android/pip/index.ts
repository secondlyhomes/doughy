/**
 * Picture-in-Picture Module
 *
 * Clean re-exports for PiP functionality
 */

// Types
export type {
  PiPParams,
  PiPAction,
  PiPState,
  PiPEnterResult,
  AspectRatio,
  UsePictureInPictureReturn,
  VideoPlayerWithPiPProps,
  PiPModeChangeEvent,
  PiPActionEvent,
} from './types';

// Hooks
export {
  usePictureInPicture,
  useAutoEnterPiP,
  usePiPActions,
} from './hooks/usePictureInPicture';

// Components
export {
  PIPControls,
  PIPModeIndicator,
  VideoCallControls,
} from './components/PIPControls';

// Video players with PiP
export { VideoPlayerWithPiP, VideoCallWithPiP } from './PictureInPicture';

// Utilities
export {
  PictureInPictureManager,
  PiPAnalytics,
  PIP_ASPECT_RATIOS,
  pipEmitter,
} from './utils/pip-utils';
