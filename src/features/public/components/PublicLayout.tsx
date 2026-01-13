// src/features/public/components/PublicLayout.tsx
// Layout wrapper for public pages with Navbar and Footer
import { ScrollView, View } from 'react-native';
import { usePathname } from 'expo-router';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { SimpleAssistant } from './SimpleAssistant';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  const pathname = usePathname();

  // Don't show SimpleAssistant on docs pages (they have their own AskDoughy)
  const isDocsPage = pathname?.startsWith('/docs');

  return (
    <View className="flex-1 bg-background">
      {/* Fixed navbar at top */}
      <Navbar />
      {/* Scrollable content with top padding for navbar */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, paddingTop: 64 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1">
          {children}
        </View>
        <Footer />
      </ScrollView>
      {/* Floating assistant - only on non-docs public pages */}
      {!isDocsPage && <SimpleAssistant />}
    </View>
  );
}
