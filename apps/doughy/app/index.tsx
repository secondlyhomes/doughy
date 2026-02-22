// app/index.tsx
// Root index - auth-aware platform-specific redirects
import { Redirect } from 'expo-router';
import { Platform } from 'react-native';
import { useAuth } from '@/features/auth/hooks/useAuth';

export default function RootIndex() {
  const { isAuthenticated, isLoading } = useAuth();

  // On web, redirect to public landing page (which has its own layout with Navbar/Footer)
  if (Platform.OS === 'web') {
    return <Redirect href="/(public)" />;
  }

  // While auth is initializing, return null — splash screen stays visible
  if (isLoading) return null;

  // Already authenticated — skip login screen entirely
  if (isAuthenticated) return <Redirect href="/(tabs)" />;

  // Not authenticated — show login
  return <Redirect href="/(auth)/sign-in" />;
}
