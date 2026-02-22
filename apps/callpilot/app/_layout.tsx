/**
 * Root Layout
 *
 * Wraps the entire app with providers and configuration.
 * Auto-signs in with dev credentials in development mode.
 */

import { useEffect, useState } from 'react'
import { Stack } from 'expo-router'
import { ThemeProvider } from '@/theme'
import { StatusBar } from 'expo-status-bar'
import { ensureDevAuth } from '@/services/authService'

export default function RootLayout() {
  const [authReady, setAuthReady] = useState(false)

  useEffect(() => {
    ensureDevAuth()
      .then((ok) => {
        if (ok) console.log('[App] Authenticated')
        else console.log('[App] Running without auth (mock mode or no dev credentials)')
      })
      .finally(() => setAuthReady(true))
  }, [])

  // Don't render screens until auth is resolved (prevents flash of empty data)
  if (!authReady) return null

  return (
    <ThemeProvider>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </ThemeProvider>
  )
}
