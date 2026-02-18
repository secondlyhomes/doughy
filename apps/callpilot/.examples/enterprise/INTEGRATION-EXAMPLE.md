# Enterprise Features Integration Example

Complete example showing how to integrate all enterprise authentication features together.

## Complete App Structure

```tsx
// App.tsx - Root component with all providers
import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

// Providers
import { AuthProvider } from './contexts/AuthContext'
import { OrganizationProvider } from './contexts/OrganizationContext'
import { RBACProvider } from './contexts/RBACContext'
import { SSOProvider } from './contexts/SSOContext'
import { TeamsProvider } from './contexts/TeamsContext'

// Screens
import { LoginScreen } from './screens/LoginScreen'
import { DashboardScreen } from './screens/DashboardScreen'
import { SettingsScreen } from './screens/SettingsScreen'

const Stack = createNativeStackNavigator()

export default function App() {
  return (
    <AuthProvider>
      <OrganizationProvider>
        <RBACProvider>
          <SSOProvider>
            <TeamsProvider>
              <NavigationContainer>
                <Stack.Navigator>
                  <Stack.Screen name="Login" component={LoginScreen} />
                  <Stack.Screen name="Dashboard" component={DashboardScreen} />
                  <Stack.Screen name="Settings" component={SettingsScreen} />
                </Stack.Navigator>
              </NavigationContainer>
            </TeamsProvider>
          </SSOProvider>
        </RBACProvider>
      </OrganizationProvider>
    </AuthProvider>
  )
}
```

---

## Login Screen with SSO

```tsx
// screens/LoginScreen.tsx
import React, { useState } from 'react'
import { View, TextInput, Button, Text, StyleSheet } from 'react-native'
import { useAuth } from '../contexts/AuthContext'
import { useSSO } from '../contexts/SSOContext'

export function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const { signIn } = useAuth()
  const { detectProvider, signInWithSSO } = useSSO()

  async function handleEmailChange(value: string) {
    setEmail(value)

    // Auto-detect SSO provider
    if (value.includes('@')) {
      const provider = await detectProvider(value)
      if (provider) {
        // Show SSO option
        console.log('SSO available:', provider.name)
      }
    }
  }

  async function handleSignIn() {
    setLoading(true)

    try {
      // Try SSO first
      const provider = await detectProvider(email)

      if (provider) {
        // SSO login
        await signInWithSSO(email)
      } else {
        // Email/password login
        await signIn(email, password)
      }

      navigation.replace('Dashboard')
    } catch (error) {
      Alert.alert('Error', error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign In</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={handleEmailChange}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Button
        title={loading ? 'Signing in...' : 'Sign In'}
        onPress={handleSignIn}
        disabled={loading}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
})
```

---

## Dashboard with All Features

```tsx
// screens/DashboardScreen.tsx
import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native'
import { useOrganization } from '../contexts/OrganizationContext'
import { useRBAC } from '../contexts/RBACContext'
import { useTeams } from '../contexts/TeamsContext'
import { PermissionGuard } from '../components/PermissionGuard'
import { OrganizationSwitcher } from '../components/OrganizationSwitcher'

export function DashboardScreen({ navigation }) {
  const { currentOrg, members, usage } = useOrganization()
  const { hasPermission, userRoles, getPrimaryRole } = useRBAC()
  const { teams, currentTeam } = useTeams()
  const [tasks, setTasks] = useState([])

  const primaryRole = getPrimaryRole()

  useEffect(() => {
    if (currentOrg) {
      fetchTasks()
    }
  }, [currentOrg])

  async function fetchTasks() {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('organization_id', currentOrg.id)
      .order('created_at', { ascending: false })

    setTasks(data || [])
  }

  return (
    <View style={styles.container}>
      {/* Organization Switcher */}
      <OrganizationSwitcher />

      {/* User Info */}
      <View style={styles.userInfo}>
        <Text style={styles.userName}>
          {currentOrg?.name}
        </Text>
        <Text style={styles.userRole}>
          {primaryRole?.role.name}
        </Text>
      </View>

      {/* Usage Stats */}
      {usage && (
        <View style={styles.statsContainer}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{usage.member_count}</Text>
            <Text style={styles.statLabel}>Members</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{usage.task_count}</Text>
            <Text style={styles.statLabel}>Tasks</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{teams.length}</Text>
            <Text style={styles.statLabel}>Teams</Text>
          </View>
        </View>
      )}

      {/* Tasks List */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Tasks</Text>

          <PermissionGuard permission="tasks:create">
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => navigation.navigate('CreateTask')}
            >
              <Text style={styles.createButtonText}>+ New Task</Text>
            </TouchableOpacity>
          </PermissionGuard>
        </View>

        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          renderItem={({ item: task }) => (
            <View style={styles.taskCard}>
              <Text style={styles.taskTitle}>{task.title}</Text>
              <Text style={styles.taskDescription}>{task.description}</Text>

              <View style={styles.taskActions}>
                <PermissionGuard permission="tasks:update">
                  <TouchableOpacity>
                    <Text style={styles.actionButton}>Edit</Text>
                  </TouchableOpacity>
                </PermissionGuard>

                <PermissionGuard permission="tasks:delete">
                  <TouchableOpacity>
                    <Text style={[styles.actionButton, styles.deleteButton]}>
                      Delete
                    </Text>
                  </TouchableOpacity>
                </PermissionGuard>
              </View>
            </View>
          )}
        />
      </View>

      {/* Admin Section */}
      <PermissionGuard permission="settings:read">
        <View style={styles.adminSection}>
          <Text style={styles.sectionTitle}>Administration</Text>

          <TouchableOpacity
            style={styles.adminButton}
            onPress={() => navigation.navigate('Members')}
          >
            <Text>Manage Members ({members.length})</Text>
          </TouchableOpacity>

          <PermissionGuard permission="roles:read">
            <TouchableOpacity
              style={styles.adminButton}
              onPress={() => navigation.navigate('Roles')}
            >
              <Text>Manage Roles & Permissions</Text>
            </TouchableOpacity>
          </PermissionGuard>

          <PermissionGuard permission="settings:update">
            <TouchableOpacity
              style={styles.adminButton}
              onPress={() => navigation.navigate('Settings')}
            >
              <Text>Organization Settings</Text>
            </TouchableOpacity>
          </PermissionGuard>
        </View>
      </PermissionGuard>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  userInfo: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  userRole: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginTop: 8,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  section: {
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  createButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  taskCard: {
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 12,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  taskDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  taskActions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 12,
  },
  actionButton: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  deleteButton: {
    color: '#EF4444',
  },
  adminSection: {
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  adminButton: {
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginTop: 8,
  },
})
```

---

## Settings Screen

```tsx
// screens/SettingsScreen.tsx
import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Switch } from 'react-native'
import { useOrganization } from '../contexts/OrganizationContext'
import { useRBAC } from '../contexts/RBACContext'
import { useSSO } from '../contexts/SSOContext'
import { PermissionGuard } from '../components/PermissionGuard'

export function SettingsScreen() {
  const { currentOrg, updateSettings, canManageSettings } = useOrganization()
  const { hasPermission } = useRBAC()
  const { providers } = useSSO()

  async function toggleFeature(feature: string, value: boolean) {
    if (!canManageSettings()) {
      Alert.alert('Error', 'You do not have permission to change settings')
      return
    }

    await updateSettings({
      features: {
        ...currentOrg.settings.features,
        [feature]: value,
      },
    })
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Organization Settings</Text>

      {/* Features */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Features</Text>

        <PermissionGuard permission="settings:update">
          <View style={styles.setting}>
            <Text>AI Assistant</Text>
            <Switch
              value={currentOrg?.settings.features.ai_enabled}
              onValueChange={(value) => toggleFeature('ai_enabled', value)}
            />
          </View>

          <View style={styles.setting}>
            <Text>Analytics</Text>
            <Switch
              value={currentOrg?.settings.features.analytics_enabled}
              onValueChange={(value) => toggleFeature('analytics_enabled', value)}
            />
          </View>

          <View style={styles.setting}>
            <Text>API Access</Text>
            <Switch
              value={currentOrg?.settings.features.api_access}
              onValueChange={(value) => toggleFeature('api_access', value)}
            />
          </View>
        </PermissionGuard>
      </View>

      {/* SSO Configuration */}
      <PermissionGuard permission="settings:update">
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Single Sign-On</Text>

          {providers.length > 0 ? (
            providers.map((provider) => (
              <View key={provider.id} style={styles.ssoProvider}>
                <Text>{provider.name}</Text>
                <Text style={styles.providerDomain}>{provider.domain}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noProviders}>No SSO providers configured</Text>
          )}

          <TouchableOpacity style={styles.addButton}>
            <Text style={styles.addButtonText}>+ Add SSO Provider</Text>
          </TouchableOpacity>
        </View>
      </PermissionGuard>

      {/* Billing */}
      <PermissionGuard permission="settings:billing">
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subscription</Text>

          <View style={styles.subscription}>
            <Text style={styles.tier}>
              {currentOrg?.subscription_tier.toUpperCase()}
            </Text>
            <Text style={styles.status}>
              Status: {currentOrg?.subscription_status}
            </Text>

            <TouchableOpacity style={styles.upgradeButton}>
              <Text style={styles.upgradeButtonText}>Upgrade Plan</Text>
            </TouchableOpacity>
          </View>
        </View>
      </PermissionGuard>

      {/* Danger Zone */}
      <PermissionGuard permission="settings:update">
        {hasPermission('settings:update') && (
          <View style={[styles.section, styles.dangerZone]}>
            <Text style={styles.sectionTitle}>Danger Zone</Text>

            <TouchableOpacity style={styles.dangerButton}>
              <Text style={styles.dangerButtonText}>
                Delete Organization
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </PermissionGuard>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  section: {
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  setting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  ssoProvider: {
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
  },
  providerDomain: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  noProviders: {
    color: '#6B7280',
    fontStyle: 'italic',
  },
  addButton: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  subscription: {
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  tier: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  status: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  upgradeButton: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    alignItems: 'center',
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  dangerZone: {
    borderWidth: 2,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  dangerButton: {
    padding: 12,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    alignItems: 'center',
  },
  dangerButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
})
```

---

## Key Takeaways

### 1. Provider Hierarchy

```tsx
AuthProvider
  └─ OrganizationProvider
      └─ RBACProvider
          └─ SSOProvider
              └─ TeamsProvider
```

### 2. Permission Checks

Always use both UI and backend validation:

```tsx
// UI
<PermissionGuard permission="tasks:delete">
  <DeleteButton />
</PermissionGuard>

// Backend (Edge Function)
const canDelete = await supabase.rpc('has_permission', {...})
if (!canDelete) return new Response('Forbidden', { status: 403 })
```

### 3. Data Scoping

All queries should be scoped to current organization:

```tsx
const { data } = await supabase
  .from('tasks')
  .select('*')
  .eq('organization_id', currentOrg.id) // Always include
```

### 4. Error Handling

```tsx
try {
  await someAction()
} catch (error) {
  // Log to monitoring service
  console.error('Error:', error)

  // Show user-friendly message
  Alert.alert('Error', 'Something went wrong. Please try again.')
}
```

### 5. Loading States

```tsx
const { loading } = useOrganization()

if (loading) {
  return <LoadingSpinner />
}
```

This integration example demonstrates how all enterprise features work together in a real application.
