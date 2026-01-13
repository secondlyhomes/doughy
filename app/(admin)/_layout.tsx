// app/(admin)/_layout.tsx
// Admin group layout with role-based access guard
import { Stack, Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { usePermissions } from '@/features/auth/hooks/usePermissions';
import { useAuth } from '@/features/auth/hooks/useAuth';

export default function AdminLayout() {
  const { isLoading } = useAuth();
  const { canViewAdminPanel } = usePermissions();

  // Show loading while checking auth
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  // Redirect to main app if user doesn't have admin access
  if (!canViewAdminPanel) {
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
