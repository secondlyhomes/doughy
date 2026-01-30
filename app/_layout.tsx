// app/_layout.tsx
// Root layout for Expo Router - handles providers
import 'react-native-get-random-values'; // Polyfill for crypto.getRandomValues
import '../global.css';
import { View, LogBox } from 'react-native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';

// Suppress warnings from dependencies we can't control
const SUPPRESSED_WARNINGS = [
  'SafeAreaView has been deprecated',
  "Cannot find native module 'ExponentAV'",
];

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

// Suppress native module errors that occur before JS try/catch can catch them
const originalError = console.error;
console.error = (...args: unknown[]) => {
  const message = typeof args[0] === 'string' ? args[0] : String(args[0]);
  if (message.includes("Cannot find native module 'ExponentAV'")) {
    return;
  }
  originalError.apply(console, args);
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
import { ErrorProvider } from '@/context/ErrorContext';
import { PlatformProvider } from '@/contexts/PlatformContext';

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
            <PlatformProvider>
              <ThemeProvider>
                <FocusModeProvider>
                  <ThemeSync>
                    <ToastProvider>
                      <ErrorProvider>
                        <UnreadCountsProvider>
                          <SafeAreaProvider>
                            <ThemedStatusBar />
                            <Stack screenOptions={{ headerShown: false }}>
                              <Stack.Screen name="(tabs)" />
                              <Stack.Screen name="(auth)" />
                              <Stack.Screen name="(public)" />
                              <Stack.Screen name="(admin)" />
                              <Stack.Screen name="skip-tracing" />
                              <Stack.Screen
                                name="(modals)"
                                options={{
                                  presentation: 'fullScreenModal',
                                  animation: 'slide_from_bottom',
                                }}
                              />
                              <Stack.Screen name="index" />
                            </Stack>
                          </SafeAreaProvider>
                        </UnreadCountsProvider>
                      </ErrorProvider>
                    </ToastProvider>
                  </ThemeSync>
                </FocusModeProvider>
              </ThemeProvider>
            </PlatformProvider>
          </AuthProvider>
        </QueryClientProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
