// src/routes/index.ts
// Export all navigation components and types

// Navigators
export { RootNavigator } from './RootNavigator';
export { AuthNavigator } from './AuthNavigator';
export { MainNavigator } from './MainNavigator';
export { LeadsNavigator } from './LeadsNavigator';
export { ConversationsNavigator } from './ConversationsNavigator';
export { AdminNavigator } from './AdminNavigator';
export { SettingsNavigator } from './SettingsNavigator';

// Types
export type {
  RootStackParamList,
  AuthStackParamList,
  MainTabParamList,
  PropertiesStackParamList,
  LeadsStackParamList,
  ConversationsStackParamList,
  SettingsStackParamList,
  AdminStackParamList,
} from './types';

// Navigation hooks (re-export from react-navigation)
export {
  useNavigation,
  useRoute,
  useFocusEffect,
  useIsFocused,
  useNavigationState,
} from '@react-navigation/native';

export type {
  NavigationProp,
  RouteProp,
} from '@react-navigation/native';
