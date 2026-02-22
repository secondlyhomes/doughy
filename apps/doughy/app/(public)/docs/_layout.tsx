// app/(public)/docs/_layout.tsx
// Layout for documentation pages - content only, parent layout provides Navbar/Footer
import { Slot } from 'expo-router';
import { View } from 'react-native';

export default function DocsLayout() {
  // Docs pages have their own sidebar
  // Parent (public)/_layout.tsx provides Navbar via PublicLayout
  return (
    <View className="flex-1 bg-background">
      <Slot />
    </View>
  );
}
