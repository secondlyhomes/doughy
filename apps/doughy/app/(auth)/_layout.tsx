// app/(auth)/_layout.tsx
// Auth group layout - stack navigator for auth screens
// Includes auth guard: if user is already authenticated (e.g. stored session),
// redirect to tabs immediately instead of showing the login screen.
import { Stack, Redirect } from 'expo-router';
import { useAuth } from '@/features/auth/hooks/useAuth';

export default function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  // If already authenticated and not loading, skip auth screens entirely
  if (!isLoading && isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    />
  );
}
