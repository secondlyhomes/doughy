/**
 * Auth Navigator (Reference Example)
 *
 * Authentication flow with route guards using Expo Router
 * This is a reference implementation - adapt to app/_layout.tsx
 */

import React, { useEffect } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { LoadingState } from '@/components'
// import { useAuth } from '@/contexts/AuthContext'

/**
 * Auth Navigator with Route Guards
 *
 * Automatically redirects based on auth state:
 * - Not authenticated → Redirect to /login
 * - Authenticated → Redirect to /(tabs)
 *
 * @example
 * ```tsx
 * // In app/_layout.tsx
 * import { AuthNavigator } from '@/navigation/AuthNavigator'
 *
 * export default function RootLayout() {
 *   return (
 *     <ThemeProvider>
 *       <AuthProvider>
 *         <AuthNavigator />
 *       </AuthProvider>
 *     </ThemeProvider>
 *   )
 * }
 * ```
 */
export function AuthNavigator() {
  // Uncomment when using your auth context:
  // const { isAuthenticated, loading } = useAuth()

  // Simulated for demo (remove when using real auth)
  const isAuthenticated = false
  const loading = false

  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    if (loading) return

    const inAuthGroup = segments[0] === '(auth)'
    const inTabsGroup = segments[0] === '(tabs)'

    if (!isAuthenticated && !inAuthGroup) {
      // Not authenticated and not in auth screens → redirect to login
      router.replace('/login')
    } else if (isAuthenticated && inAuthGroup) {
      // Authenticated but in auth screens → redirect to home
      router.replace('/(tabs)')
    }
  }, [isAuthenticated, loading, segments])

  // Show loading while checking auth state
  if (loading) {
    return <LoadingState message="Loading..." />
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    >
      {/* Auth Screens (public) */}
      <Stack.Screen name="(auth)" />

      {/* Protected Screens (require auth) */}
      <Stack.Screen name="(tabs)" />

      {/* Modal Screens */}
      <Stack.Screen
        name="modal"
        options={{
          presentation: 'modal',
          headerShown: true,
          title: 'Modal',
        }}
      />
    </Stack>
  )
}

/**
 * Alternative: Manual Route Guard Component
 *
 * Use this pattern for individual screens that need auth
 *
 * @example
 * ```tsx
 * function ProtectedScreen() {
 *   return (
 *     <RequireAuth>
 *       <YourScreenContent />
 *     </RequireAuth>
 *   )
 * }
 * ```
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  // const { isAuthenticated, loading } = useAuth()
  const isAuthenticated = false
  const loading = false

  const router = useRouter()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login')
    }
  }, [isAuthenticated, loading])

  if (loading) {
    return <LoadingState />
  }

  if (!isAuthenticated) {
    return null // Will redirect
  }

  return <>{children}</>
}

/**
 * Alternative: Redirect Based on Auth State
 *
 * Simple redirect without navigation guards
 *
 * @example
 * ```tsx
 * // In app/index.tsx (root)
 * import { Redirect } from 'expo-router'
 * import { useAuth } from '@/contexts/AuthContext'
 *
 * export default function Index() {
 *   const { isAuthenticated, loading } = useAuth()
 *
 *   if (loading) {
 *     return <LoadingState />
 *   }
 *
 *   if (isAuthenticated) {
 *     return <Redirect href="/(tabs)" />
 *   }
 *
 *   return <Redirect href="/login" />
 * }
 * ```
 */

/**
 * Advanced: Role-Based Access Control
 *
 * Redirect based on user role
 *
 * @example
 * ```tsx
 * function AdminOnlyScreen() {
 *   const { user } = useAuth()
 *   const router = useRouter()
 *
 *   useEffect(() => {
 *     if (user && user.role !== 'admin') {
 *       router.replace('/(tabs)') // Redirect non-admins
 *     }
 *   }, [user])
 *
 *   if (!user || user.role !== 'admin') {
 *     return null
 *   }
 *
 *   return <AdminContent />
 * }
 * ```
 */
