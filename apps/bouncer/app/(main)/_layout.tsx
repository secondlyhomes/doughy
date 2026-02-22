/**
 * Main Layout
 *
 * Simple stack with no headers. All navigation is handled inline.
 * Screens: index (control panel), connection-detail, per-action-overrides, activity-detail.
 */

import { Stack } from 'expo-router'

export default function MainLayout() {
  return <Stack screenOptions={{ headerShown: false }} />
}
