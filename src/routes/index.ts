// src/routes/index.ts
// Re-export Expo Router hooks for backward compatibility
// All navigation now uses Expo Router's file-based routing

// Expo Router hooks
export {
  useRouter,
  useLocalSearchParams,
  useGlobalSearchParams,
  useSegments,
  usePathname,
  useNavigationContainerRef,
  Link,
  Redirect,
} from 'expo-router';

// Note: useFocusEffect is now from expo-router
export { useFocusEffect } from 'expo-router';
