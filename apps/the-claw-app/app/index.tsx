/**
 * Root Index
 *
 * Redirects based on auth state.
 * If authenticated → main app. Otherwise → onboarding/sign-in.
 */

import { Redirect } from 'expo-router'
import { useAuth } from '@/contexts/AuthContext'
import { LoadingState } from '@/components'

export default function RootIndex() {
  const { isAuthenticated, loading: authLoading } = useAuth()

  if (authLoading) return <LoadingState message="Loading..." />

  if (isAuthenticated) return <Redirect href="/(main)" />

  return <Redirect href="/(onboarding)/connect" />
}
