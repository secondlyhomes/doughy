// src/routes/index.ts
// Export all navigation components and types

// Navigators
export { RootNavigator } from './RootNavigator';
export { AuthNavigator } from './AuthNavigator';
export { MainNavigator } from './MainNavigator';

// Types
export type {
  RootStackParamList,
  AuthStackParamList,
  MainTabParamList,
  PropertiesStackParamList,
  LeadsStackParamList,
  ConversationsStackParamList,
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
