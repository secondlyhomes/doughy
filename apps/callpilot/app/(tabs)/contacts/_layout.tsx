/**
 * Contacts Tab Stack
 *
 * Nested Stack so the Contacts screen gets a native UINavigationBar
 * with headerSearchBarOptions — renders a real UISearchBar that
 * automatically gets liquid glass on iOS 26+.
 */

import { Stack } from 'expo-router'
import { useTheme } from '@/theme'

export default function ContactsLayout() {
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
