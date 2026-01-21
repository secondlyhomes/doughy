// src/features/settings/index.ts
// Main settings feature exports

// Screens
export {
  SettingsScreen,
  ProfileScreen,
  ChangePasswordScreen,
  AppearanceScreen,
  NotificationsSettingsScreen,
  SecurityScreen,
  AboutScreen,
  NudgeSettingsScreen,
} from './screens';

// Services
export {
  updateProfile,
  pickAvatar,
  uploadAvatar,
  deleteAvatar,
  changePassword,
  type ProfileUpdateData,
  type ProfileResult,
  type AvatarUploadResult,
} from './services';
