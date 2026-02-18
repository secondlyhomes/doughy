/**
 * index.ts
 *
 * iOS App Clips module exports
 *
 * App Clips are lightweight versions of your app (<15MB) that load instantly
 * from NFC tags, QR codes, Safari App Banners, or Messages.
 *
 * Usage:
 * ```tsx
 * import {
 *   AppClipEntryPoint,
 *   AppClipManager,
 *   useAppClip,
 *   AppClipInvocationType,
 * } from '.examples/platform/ios/app-clips';
 * ```
 */

// Types
export {
  AppClipInvocationType,
  type AppClipConfig,
  type ClipContentProps,
} from './types';

// Manager class
export { AppClipManager } from './AppClipManager';

// Hook
export { useAppClip } from './useAppClip';

// Components
export { AppClipEntryPoint } from './AppClipEntryPoint';
export {
  AppClipContent,
  QRCodeClipContent,
  NFCClipContent,
  DefaultClipContent,
} from './AppClipContent';

// Styles (for extending if needed)
export { styles as appClipStyles } from './styles';
