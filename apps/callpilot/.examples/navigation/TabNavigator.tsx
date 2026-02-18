/**
 * Tab Navigator (Reference Example)
 *
 * Bottom tab navigation pattern using Expo Router
 * This is a reference implementation - adapt to app/(tabs)/_layout.tsx
 */

import React from 'react'
import { Tabs } from 'expo-router'
import { useTheme } from '@/theme'

/**
 * Tab Navigator Component
 *
 * @example
 * ```tsx
 * // In app/(tabs)/_layout.tsx
 * import { TabNavigator } from '@/navigation/TabNavigator'
 *
 * export default function TabLayout() {
 *   return <TabNavigator />
 * }
 * ```
 */
export function TabNavigator() {
  const { theme } = useTheme()

  return (
    <Tabs
      screenOptions={{
        // Tab bar styling
        tabBarActiveTintColor: theme.colors.primary[500],
        tabBarInactiveTintColor: theme.colors.neutral[400],
        tabBarStyle: {
          backgroundColor: theme.colors.background.primary,
          borderTopColor: theme.colors.border.default,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 64,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },

        // Header styling
        headerStyle: {
          backgroundColor: theme.colors.background.primary,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border.default,
        },
        headerTintColor: theme.colors.text.primary,
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 17,
        },
      }}
    >
      {/* Home Tab */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon icon={focused ? '🏠' : '🏡'} color={color} size={size} />
          ),
        }}
      />

      {/* Tasks Tab */}
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tasks',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon icon={focused ? '✅' : '☑️'} color={color} size={size} />
          ),
          // Show badge count (optional)
          // tabBarBadge: incompleteTasks > 0 ? incompleteTasks : undefined,
        }}
      />

      {/* Profile Tab */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon icon={focused ? '👤' : '👥'} color={color} size={size} />
          ),
        }}
      />

      {/* Settings Tab */}
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon icon={focused ? '⚙️' : '🔧'} color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  )
}

/**
 * Tab Icon Component
 *
 * Simple emoji-based icon (replace with icon library if preferred)
 */
interface TabIconProps {
  icon: string
  color: string
  size: number
}

function TabIcon({ icon, color, size }: TabIconProps) {
  return (
    <span
      style={{
        fontSize: size,
        // Tint color can be applied if using icon library
        // color: color,
      }}
    >
      {icon}
    </span>
  )
}

/**
 * Alternative: Using Ionicons
 *
 * Install: npm install @expo/vector-icons
 *
 * @example
 * ```tsx
 * import { Ionicons } from '@expo/vector-icons'
 *
 * <Tabs.Screen
 *   name="index"
 *   options={{
 *     title: 'Home',
 *     tabBarIcon: ({ color, size }) => (
 *       <Ionicons name="home" size={size} color={color} />
 *     ),
 *   }}
 * />
 * ```
 */

/**
 * Advanced: Dynamic badge count
 *
 * @example
 * ```tsx
 * import { useTasks } from '@/features/tasks-local/TasksContext'
 *
 * export function TabNavigator() {
 *   const { stats } = useTasks()
 *
 *   return (
 *     <Tabs>
 *       <Tabs.Screen
 *         name="tasks"
 *         options={{
 *           title: 'Tasks',
 *           tabBarBadge: stats.incomplete > 0 ? stats.incomplete : undefined,
 *         }}
 *       />
 *     </Tabs>
 *   )
 * }
 * ```
 */
