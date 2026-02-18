/**
 * Edit Profile Screen
 *
 * Clean re-exports for the edit profile feature.
 */

// Main screen component
export { EditProfileScreen } from './EditProfileScreen';

// Sub-components
export { ProfileForm } from './components/ProfileForm';
export { AvatarEditor } from './components/AvatarEditor';

// Hooks
export { useEditProfile } from './hooks/useEditProfile';

// Types
export type {
  EditProfileScreenProps,
  ProfileFormState,
  ProfileFormProps,
  AvatarEditorProps,
  EditProfileHeaderProps,
  UseEditProfileReturn,
} from './types';

// Styles (for extension/customization)
export { styles as editProfileStyles } from './styles';
