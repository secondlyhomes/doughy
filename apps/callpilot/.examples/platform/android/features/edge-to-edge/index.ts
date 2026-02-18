/**
 * Edge-to-Edge Display (Android 15+)
 *
 * Features:
 * - Full-screen immersive mode
 * - Transparent system bars
 * - Proper insets handling
 * - Gesture navigation support
 *
 * Requirements:
 * - Android 15+ (API 35+) for full features
 * - Android 11+ (API 30+) for basic edge-to-edge
 */

// Types
export type {
  SystemBarStyle,
  WindowInsets,
  UseEdgeToEdgeOptions,
  UseEdgeToEdgeResult,
  SafeAreaEdge,
  BaseContainerProps,
  EdgeToEdgeContainerProps,
  SafeAreaViewProps,
  InsetAwareScrollViewProps,
  BottomSheetWithInsetsProps,
  FABWithInsetsProps,
  FullScreenImageViewerProps,
} from './types';

// Manager
export { EdgeToEdgeManager } from './EdgeToEdgeManager';

// Hooks
export { useEdgeToEdge, useDynamicSystemBars } from './hooks';

// Components
export {
  EdgeToEdgeContainer,
  SafeAreaView,
  InsetAwareScrollView,
  BottomSheetWithInsets,
  FABWithInsets,
} from './components';

// Examples
export {
  FullScreenImageViewer,
  VideoPlayerFullScreen,
} from './examples';
