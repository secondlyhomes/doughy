/**
 * Root Layout
 *
 * Wraps the entire app with providers and configuration.
 * Routes: (onboarding), (main)
 */

import { Stack } from 'expo-router'
import { ThemeProvider } from '@/theme'
import { AuthProvider } from '@/contexts/AuthContext'
import { ConnectionProvider } from '@/contexts/ConnectionContext'
import { StatusBar } from 'expo-status-bar'
import { NotificationInit } from '@/components/NotificationInit'

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ConnectionProvider>
          <NotificationInit />
          <StatusBar style="auto" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(onboarding)" />
            <Stack.Screen name="(main)" />
          </Stack>
        </ConnectionProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
