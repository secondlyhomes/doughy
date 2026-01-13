// app/index.tsx
// Root index - platform-specific behavior
import { Redirect } from 'expo-router';
import { Platform } from 'react-native';

// Import the landing screen for web
import { LandingScreen } from '@/features/public/screens/LandingScreen';
import { PublicLayout } from '@/features/public/components/PublicLayout';

export default function RootIndex() {
  // On mobile, redirect to auth (the AuthRouter will handle the rest)
  if (Platform.OS !== 'web') {
    return <Redirect href="/(auth)/sign-in" />;
  }

  // On web, show the landing page with navbar and footer
  return (
    <PublicLayout>
      <LandingScreen />
    </PublicLayout>
  );
}
