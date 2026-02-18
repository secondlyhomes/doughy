/**
 * AvatarUpload module exports
 */

// Main component
export { AvatarUpload } from './AvatarUpload';

// Types
export type {
  AvatarUploadProps,
  AvatarDisplayProps,
  UploadOptionsMenuProps,
  UseAvatarUploadStateProps,
  UseAvatarUploadStateReturn,
} from './types';

// Sub-components (for advanced customization)
export { AvatarDisplay } from './components/AvatarDisplay';
export { UploadOptionsMenu } from './components/UploadOptionsMenu';

// Hooks (for advanced customization)
export { useAvatarUploadState } from './hooks/useAvatarUploadState';

// Styles (for extension)
export { styles } from './styles';
