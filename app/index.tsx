// app/index.tsx
// Root index - platform-specific redirects
import { Redirect } from 'expo-router';
import { Platform } from 'react-native';

export default function RootIndex() {
  // On mobile, redirect to sign-in (tabs layout will handle auth check)
  if (Platform.OS !== 'web') {
    return <Redirect href="/(auth)/sign-in" />;
  }

  // On web, redirect to public landing page (which has its own layout with Navbar/Footer)
  return <Redirect href="/(public)" />;
}
