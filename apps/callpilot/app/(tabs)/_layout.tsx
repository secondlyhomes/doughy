/**
 * Tab Layout
 *
 * 3-tab layout: Contacts (home), Messages, Settings
 * Uses NativeTabs for native UITabBarController with automatic
 * liquid glass appearance on iOS 26+.
 *
 * Contacts and Messages tabs are folders with nested Stacks
 * so they get native UINavigationBar + UISearchBar.
 */

import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs'
import { useTheme } from '@/theme'

export default function TabLayout() {
  const { theme, isDark } = useTheme()

  return (
    <NativeTabs
      backgroundColor="transparent"
      blurEffect={isDark ? 'systemUltraThinMaterialDark' : 'systemUltraThinMaterialLight'}
      tintColor={theme.colors.primary[500]}
      shadowColor="transparent"
      disableTransparentOnScrollEdge
    >
      <NativeTabs.Trigger name="contacts">
        <Icon sf={{ default: 'person.2', selected: 'person.2.fill' }} />
        <Label>Contacts</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="inbox">
        <Icon sf={{ default: 'bubble.left', selected: 'bubble.left.fill' }} />
        <Label>Messages</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <Icon sf={{ default: 'gearshape', selected: 'gearshape.fill' }} />
        <Label>Settings</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  )
}
