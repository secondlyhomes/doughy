/**
 * Connection Detail Screen
 *
 * Service-specific detail views:
 * - Doughy: Module-based permission cards (Investor, Landlord)
 * - Bland AI: Call settings + limits + permission toggles
 * - Channels (WhatsApp/Discord/SMS): Delivery preferences
 * - Generic: Grouped permission toggles + disconnect
 */

import { useCallback, useMemo } from 'react'
import { View, ScrollView, TouchableOpacity, Alert } from 'react-native'
import * as Linking from 'expo-linking'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useTheme } from '@/theme'
import { useConnections } from '@/hooks/useConnections'
import { Text } from '@/components/Text'
import { Card } from '@/components/Card/Card'
import { Switch } from '@/components/Switch/Switch'
import { Badge } from '@/components/Badge/Badge'
import { Button } from '@/components/Button/Button'
import { Divider } from '@/components/Divider'
import { StatusDot, type StatusDotColor } from '@/components/StatusDot'
import { CONNECTION_ICONS } from '@/constants/icons'
import type { ConnectionPermission, BlandConfig } from '@/types'

const STATUS_DOT_MAP: Record<string, StatusDotColor> = {
  connected: 'green',
  warning: 'yellow',
  disconnected: 'gray',
  error: 'red',
}

const RISK_BADGE: Record<string, { label: string; variant: 'success' | 'warning' | 'error' }> = {
  low: { label: 'Low', variant: 'success' },
  medium: { label: 'Med', variant: 'warning' },
  high: { label: 'High', variant: 'error' },
}

// ---------------------------------------------------------------------------
// Shared: Permission row with risk badge
// ---------------------------------------------------------------------------

function PermissionRow({
  perm,
  disabled,
  onToggle,
}: {
  perm: ConnectionPermission
  disabled: boolean
  onToggle: (id: string, value: boolean) => void
}) {
  const { theme } = useTheme()
  const risk = RISK_BADGE[perm.riskLevel]

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: theme.tokens.spacing[2],
      }}
    >
      <View style={{ flex: 1, marginRight: theme.tokens.spacing[3] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.tokens.spacing[2] }}>
          <Text variant="body">{perm.name}</Text>
          {risk && <Badge label={risk.label} variant={risk.variant} size="sm" />}
        </View>
        <Text variant="caption" color={theme.colors.text.tertiary}>{perm.description}</Text>
      </View>
      <Switch
        value={perm.enabled}
        onValueChange={(v) => onToggle(perm.id, v)}
        disabled={disabled}
      />
    </View>
  )
}

// ---------------------------------------------------------------------------
// Module card (groups permissions by module name)
// ---------------------------------------------------------------------------

function ModuleCard({
  moduleName,
  permissions,
  disabled,
  onToggle,
}: {
  moduleName: string
  permissions: ConnectionPermission[]
  disabled: boolean
  onToggle: (id: string, value: boolean) => void
}) {
  const { theme } = useTheme()
  const enabledCount = permissions.filter(p => p.enabled).length

  return (
    <Card variant="outlined" padding="md" style={{ marginBottom: theme.tokens.spacing[3] }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.tokens.spacing[1] }}>
        <Text variant="bodySmall" weight="semibold">{moduleName}</Text>
        <Text variant="caption" color={theme.colors.text.tertiary}>
          {enabledCount}/{permissions.length} enabled
        </Text>
      </View>
      <Divider style={{ marginBottom: theme.tokens.spacing[1] }} />
      {permissions.map((perm) => (
        <PermissionRow key={perm.id} perm={perm} disabled={disabled} onToggle={onToggle} />
      ))}
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Bland AI: Settings card
// ---------------------------------------------------------------------------

function BlandSettingsCard({ config }: { config: BlandConfig }) {
  const { theme } = useTheme()

  const rows: { label: string; value: string }[] = [
    { label: 'Max calls/day', value: String(config.maxCallsPerDay) },
    { label: 'Max spend/day', value: `$${(config.maxSpendPerDayCents / 100).toFixed(2)}` },
    { label: 'Queue delay', value: `${config.queueDelaySeconds}s` },
    { label: 'Voice', value: config.voice },
    { label: 'Language', value: config.language },
  ]

  return (
    <Card variant="outlined" padding="md" style={{ marginBottom: theme.tokens.spacing[3] }}>
      <Text variant="bodySmall" weight="semibold" style={{ marginBottom: theme.tokens.spacing[1] }}>
        Call Settings
      </Text>
      <Divider style={{ marginBottom: theme.tokens.spacing[1] }} />
      {rows.map((row) => (
        <View
          key={row.label}
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: theme.tokens.spacing[2],
          }}
        >
          <Text variant="bodySmall" color={theme.colors.text.secondary}>{row.label}</Text>
          <Text variant="bodySmall" weight="medium" style={{ fontVariant: ['tabular-nums'] }}>{row.value}</Text>
        </View>
      ))}
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function ConnectionDetailScreen() {
  const { theme } = useTheme()
  const router = useRouter()
  const { connectionId } = useLocalSearchParams<{ connectionId: string }>()
  const { connections, togglePermission, disconnect } = useConnections()

  const connection = useMemo(
    () => connections.find((c) => c.id === connectionId),
    [connections, connectionId],
  )

  const groupedPermissions = useMemo(() => {
    if (!connection) return {}
    const groups: Record<string, ConnectionPermission[]> = {}
    for (const perm of connection.permissions) {
      if (!groups[perm.module]) groups[perm.module] = []
      groups[perm.module].push(perm)
    }
    return groups
  }, [connection])

  const handleToggle = useCallback((permissionId: string, value: boolean) => {
    if (!connectionId) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    togglePermission(connectionId as any, permissionId, value)
  }, [connectionId, togglePermission])

  const handleDisconnect = useCallback(() => {
    if (!connectionId) return
    Alert.alert(
      'Disconnect Service',
      `Are you sure you want to disconnect ${connection?.name ?? connectionId}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: () => {
            disconnect(connectionId as any)
            router.back()
          },
        },
      ],
    )
  }, [connectionId, connection, disconnect, router])

  if (!connection) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <Text variant="body" style={{ padding: theme.tokens.spacing[4] }}>Connection not found.</Text>
      </SafeAreaView>
    )
  }

  const iconName = CONNECTION_ICONS[connection.id] ?? 'cube-outline'
  const isDisabled = connection.status === 'disconnected'
  const modules = Object.entries(groupedPermissions)

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: theme.tokens.spacing[4],
          gap: theme.tokens.spacing[3],
        }}
      >
        <TouchableOpacity onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Ionicons name={iconName as any} size={28} color={theme.colors.primary[500]} />
        <View style={{ flex: 1 }}>
          <Text variant="h3" weight="bold">{connection.name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.tokens.spacing[1] }}>
            <StatusDot color={STATUS_DOT_MAP[connection.status] ?? 'gray'} size="sm" />
            <Text variant="caption" color={theme.colors.text.secondary} style={{ textTransform: 'capitalize' }}>
              {connection.status}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: theme.tokens.spacing[4], paddingBottom: theme.tokens.spacing[10] }}>
        {/* Summary */}
        <Text variant="bodySmall" color={theme.colors.text.secondary} style={{ marginBottom: theme.tokens.spacing[4] }}>
          {connection.summary}
        </Text>

        {/* Bland: Call settings */}
        {connection.id === 'bland' && connection.blandConfig && (
          <BlandSettingsCard config={connection.blandConfig} />
        )}

        {/* Permission modules */}
        {modules.map(([moduleName, perms]) => (
          <ModuleCard
            key={moduleName}
            moduleName={moduleName}
            permissions={perms}
            disabled={isDisabled}
            onToggle={handleToggle}
          />
        ))}

        {/* Disconnected state */}
        {isDisabled && (
          <Card variant="outlined" padding="md" style={{ marginBottom: theme.tokens.spacing[3] }}>
            <Text variant="bodySmall" color={theme.colors.text.tertiary} align="center">
              Connect this service to manage permissions.
            </Text>
            {connection.id === 'gmail' && (
              <Button
                title="Connect Gmail"
                variant="primary"
                size="lg"
                onPress={async () => {
                  const { data: { user } } = await (await import('@/lib/supabase')).supabase.auth.getUser()
                  const baseUrl = process.env.EXPO_PUBLIC_CLAW_API_URL?.replace('/api/claw', '')
                  Linking.openURL(`${baseUrl}/oauth/gmail/start?user_id=${user?.id ?? ''}`)
                }}
                style={{ marginTop: theme.tokens.spacing[3] }}
              />
            )}
          </Card>
        )}

        {/* Disconnect button */}
        {!isDisabled && (
          <Button
            title="Disconnect"
            variant="secondary"
            size="lg"
            onPress={handleDisconnect}
            style={{ marginTop: theme.tokens.spacing[4] }}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
