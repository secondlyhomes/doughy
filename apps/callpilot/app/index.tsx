/**
 * Root Index
 *
 * Redirects to the main tabs layout.
 * In production, this will check onboarding status and redirect accordingly.
 */

import { Redirect } from 'expo-router'

export default function RootIndex() {
  // TODO: Check onboarding status and redirect to /onboarding/welcome if not completed
  return <Redirect href="/(tabs)/contacts" />
}
