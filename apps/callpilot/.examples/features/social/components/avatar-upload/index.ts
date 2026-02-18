/**
 * Avatar Upload Module
 *
 * Clean re-exports for the AvatarUpload component and related types.
 */

// Main component
export { AvatarUpload } from './AvatarUpload';

// Types
export type {
  AvatarUploadProps,
  AvatarPreviewProps,
  UploadOptionsProps,
  UseAvatarUploadReturn,
} from './types';

// Sub-components (for advanced customization)
export { AvatarPreview } from './components/AvatarPreview';
export { UploadOptions } from './components/UploadOptions';

// Hook (for custom implementations)
export { useAvatarUpload } from './hooks/useAvatarUpload';
