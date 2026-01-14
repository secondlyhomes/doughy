// app/_layout.tsx
// Root layout for Expo Router - handles providers and auth routing
import '../global.css';
import { useEffect } from 'react';
import { View, ActivityIndicator, LogBox, Platform } from 'react-native';
import { useFonts } from 'expo-font';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useColorScheme } from 'nativewind';

// Suppress warnings from dependencies we can't control
const SUPPRESSED_WARNINGS = ['SafeAreaView has been deprecated'];

LogBox.ignoreLogs(SUPPRESSED_WARNINGS);

// Also suppress from console output (LogBox only hides yellow box UI)
const originalWarn = console.warn;
console.warn = (...args: unknown[]) => {
  const message = typeof args[0] === 'string' ? args[0] : '';
  if (SUPPRESSED_WARNINGS.some((warning) => message.includes(warning))) {
    return;
  }
  originalWarn.apply(console, args);
};
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AuthProvider } from '@/features/auth/context/AuthProvider';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { UnreadCountsProvider, ErrorBoundary } from '@/features/layout';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { FocusModeProvider } from '@/context/FocusModeContext';
import { ToastProvider } from '@/components/ui/Toast';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

// Sync ThemeContext with NativeWind's color scheme and apply .dark class
function ThemeSync({ children }: { children: React.ReactNode }) {
  const { isDark } = useTheme();
  const { setColorScheme } = useColorScheme();

  useEffect(() => {
    setColorScheme(isDark ? 'dark' : 'light');
  }, [isDark, setColorScheme]);

  // Wrap in View with .dark class so NativeWind CSS variables activate for dark mode
  return (
    <View className={`flex-1 ${isDark ? 'dark' : ''}`}>
      {children}
    </View>
  );
}

// Auth routing logic
function AuthRouter() {
  const { isAuthenticated, isLoading } = useAuth();
  const { colors } = useTheme();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inPublicGroup = segments[0] === '(public)';
    const isWeb = Platform.OS === 'web';

    // On web, allow public routes without authentication
    // Public routes include: landing page (/), pricing, about, docs, etc.
    if (isWeb && (inPublicGroup || segments.length === 0)) {
      // User is on a public route on web - no redirect needed
      return;
    }

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to sign-in if not authenticated and not already in auth group
      router.replace('/(auth)/sign-in');
    }
    // Note: Don't auto-redirect authenticated users from auth group
    // Let the login buttons handle navigation to /(tabs) or /(admin) explicitly
  }, [isAuthenticated, isLoading, segments]);

  // Show loading screen while checking auth
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return <Slot />;
}

// StatusBar that respects theme
function ThemedStatusBar() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? 'light' : 'dark'} />;
}

// Root layout with all providers
export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Lobster: require('../assets/fonts/Lobster-Regular.ttf'),
  });

  // Show loading spinner while fonts are loading (but not if there's an error)
  // If fonts fail to load, continue anyway - system fonts will be used as fallback
  if (!fontsLoaded && !fontError) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ThemeProvider>
            <FocusModeProvider>
              <ThemeSync>
                <ToastProvider>
                  <UnreadCountsProvider>
                    <SafeAreaProvider>
                      <ThemedStatusBar />
                      <ErrorBoundary>
                        <AuthRouter />
                      </ErrorBoundary>
                    </SafeAreaProvider>
                  </UnreadCountsProvider>
                </ToastProvider>
              </ThemeSync>
            </FocusModeProvider>
          </ThemeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
