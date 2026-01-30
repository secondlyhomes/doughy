// app/_layout.tsx
// Root layout for Expo Router - handles providers
import 'react-native-get-random-values'; // Polyfill for crypto.getRandomValues
import '../global.css';
import { View, LogBox } from 'react-native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { useEffect } from 'react';

// Suppress warnings from dependencies we can't control
const SUPPRESSED_WARNINGS = [
  'SafeAreaView has been deprecated',
  "Cannot find native module 'ExponentAV'",
] as const;

LogBox.ignoreLogs([...SUPPRESSED_WARNINGS]);

// Also suppress from console output (LogBox only hides yellow box UI)
// Note: We log suppressions in __DEV__ for visibility while debugging
const originalWarn = console.warn;
console.warn = (...args: unknown[]) => {
  const message = typeof args[0] === 'string' ? args[0] : '';
  if (SUPPRESSED_WARNINGS.some((warning) => message.includes(warning))) {
    if (__DEV__) console.debug('[Suppressed Warning]', message.substring(0, 80));
    return;
  }
  originalWarn.apply(console, args);
};

// Suppress native module errors that occur before JS try/catch can catch them
const originalError = console.error;
console.error = (...args: unknown[]) => {
  const message = typeof args[0] === 'string' ? args[0] : String(args[0]);
  if (message.includes("Cannot find native module 'ExponentAV'")) {
    if (__DEV__) console.debug('[Suppressed Error]', message.substring(0, 80));
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
import { ThemeProvider, useTheme, useThemeColors } from '@/contexts/ThemeContext';
import { FocusModeProvider } from '@/contexts/FocusModeContext';
import { ToastProvider } from '@/components/ui/Toast';
import { ErrorProvider } from '@/contexts/ErrorContext';
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

// Wrapper for flex layout with themed background
// Uses style instead of className to avoid NativeWind's CssInterop.View bug
// Background color ensures no white flash during screen transitions in dark mode
function ThemeSync({ children }: { children: React.ReactNode }) {
  const colors = useThemeColors();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
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
  const [fontsLoaded, fontError] = useFonts({
    Lobster: require('../assets/fonts/Lobster-Regular.ttf'),
  });

  // Log font loading errors for debugging
  useEffect(() => {
    if (fontError) {
      console.error('[Font Loading] Failed to load fonts:', fontError);
    }
  }, [fontError]);

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
