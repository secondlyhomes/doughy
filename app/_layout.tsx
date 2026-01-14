// app/_layout.tsx
// Root layout for Expo Router - handles providers
import '../global.css';
import { View, LogBox } from 'react-native';
import { useFonts } from 'expo-font';
import { Slot } from 'expo-router';

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

// Wrapper for flex layout - no className to avoid NativeWind's CssInterop.View bug
// Dark mode is synced via Appearance API in ThemeProvider instead
function ThemeSync({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ flex: 1 }}>
      {children}
    </View>
  );
}

// StatusBar that respects theme
function ThemedStatusBar() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? 'light' : 'dark'} />;
}

// Root layout with all providers
export default function RootLayout() {
  // Load fonts in background - don't block render
  useFonts({
    Lobster: require('../assets/fonts/Lobster-Regular.ttf'),
  });

  return (
    <ErrorBoundary>
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
                        <Slot />
                      </SafeAreaProvider>
                    </UnreadCountsProvider>
                  </ToastProvider>
                </ThemeSync>
              </FocusModeProvider>
            </ThemeProvider>
          </AuthProvider>
        </QueryClientProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
