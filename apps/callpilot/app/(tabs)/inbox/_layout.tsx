/**
 * Messages Tab Stack
 *
 * Nested Stack so the Messages screen gets a native UINavigationBar
 * with headerSearchBarOptions — renders a real UISearchBar that
 * automatically gets liquid glass on iOS 26+.
 */

import { Stack } from 'expo-router'
import { useTheme } from '@/theme'

export default function InboxLayout() {
  const { theme } = useTheme()

  return (
    <Stack
      screenOptions={{
        headerShadowVisible: false,
        headerTransparent: true,
        headerTintColor: theme.colors.primary[500],
      }}
    />
  )
}
