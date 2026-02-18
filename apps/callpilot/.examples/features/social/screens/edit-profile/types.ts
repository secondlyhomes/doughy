/**
 * Edit Profile Screen Types
 *
 * TypeScript interfaces for the edit profile feature.
 */

/**
 * Props for the EditProfileScreen component
 */
export interface EditProfileScreenProps {
  onSave?: () => void;
  onCancel?: () => void;
}

/**
 * Form state for editing profile
 */
export interface ProfileFormState {
  username: string;
  fullName: string;
  bio: string;
  website: string;
  location: string;
}

/**
 * Props for the ProfileForm component
 */
export interface ProfileFormProps {
  formState: ProfileFormState;
  onFieldChange: <K extends keyof ProfileFormState>(
    field: K,
    value: ProfileFormState[K]
  ) => void;
}

/**
 * Props for the AvatarEditor component
 */
export interface AvatarEditorProps {
  userId: string;
  currentAvatarUrl: string | null;
  onUpload: (uri: string) => Promise<void>;
}

/**
 * Props for the EditProfileHeader component
 */
export interface EditProfileHeaderProps {
  onCancel?: () => void;
  onSave: () => void;
  saving: boolean;
}

/**
 * Return type for useEditProfile hook
 */
export interface UseEditProfileReturn {
  profile: {
    user_id: string;
    username: string;
    full_name: string | null;
    bio: string | null;
    website: string | null;
    location: string | null;
    avatar_url: string | null;
  } | null;
  loading: boolean;
  saving: boolean;
  formState: ProfileFormState;
  setFormField: <K extends keyof ProfileFormState>(
    field: K,
    value: ProfileFormState[K]
  ) => void;
  handleSave: () => Promise<void>;
  handleAvatarUpload: (uri: string) => Promise<void>;
}
