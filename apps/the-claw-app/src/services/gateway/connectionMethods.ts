/**
 * Connection Methods — connection/channel management adapter methods
 */

import { supabase } from '@/lib/supabase'
import type { ServiceConnection, ConnectionId } from '@/types'
import { parsePermissions } from './helpers'
import { DEFAULT_CONNECTIONS } from './defaultConnections'

/**
 * Map raw connection rows (DB or in-memory) to ServiceConnection[].
 * DB uses `channel`, in-memory defaults use `service` — normalize both.
 */
function mapConnections(rows: any[]): ServiceConnection[] {
  const seen = new Set<string>()
  const unique = rows.filter((row: any) => {
    const key = row.channel ?? row.service ?? row.id
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  return unique.map((row: any) => {
    const serviceId = row.channel ?? row.service
    const defaults = DEFAULT_CONNECTIONS.find(d => d.service === serviceId)
    // Permissions: DB stores in config.permissions, in-memory has top-level permissions
    const perms = row.config?.permissions ?? row.permissions ?? defaults?.permissions
    return {
      id: serviceId as ConnectionId,
      name: defaults?.name || row.label || serviceId,
      icon: row.config?.icon || 'flash',
      status: row.status as ServiceConnection['status'],
      permissions: parsePermissions(perms),
      summary: row.config?.summary || defaults?.summary || row.label || '',
      ...(serviceId === 'bland' ? { blandConfig: row.config?.bland ?? defaults?.config?.bland } : {}),
    }
  })
}

/**
 * Initialize default connections for the current user.
 * Called once when getConnections() finds no rows.
 *
 * DB columns: channel (text), label (text), status (text), config (jsonb)
 * Unique constraint: (user_id, channel)
 */
async function initializeConnections(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated — cannot initialize connections')

  const rows = DEFAULT_CONNECTIONS.map((conn) => ({
    user_id: user.id,
    channel: conn.service,
    label: conn.name,
    status: conn.status,
    config: { summary: conn.summary, permissions: conn.permissions, ...(conn.config ?? {}) },
  }))

  const { error } = await supabase
    .schema('claw').from('connections')
    .upsert(rows, { onConflict: 'user_id,channel' })

  if (error) throw new Error(`Failed to initialize connections: ${error.message}`)
}

export function createConnectionMethods() {
  return {
    async getConnections(): Promise<ServiceConnection[]> {
      const { data, error } = await supabase
        .schema('claw').from('connections')
        .select('*')
        .order('created_at')

      if (error) {
        // Schema not exposed or permissions issue — fall back to in-memory defaults
        console.warn('[SupabaseAdapter] getConnections DB failed, using defaults:', error.message)
        return mapConnections(DEFAULT_CONNECTIONS.map(c => ({
          channel: c.service, label: c.name, status: c.status,
          config: { summary: c.summary, permissions: c.permissions, ...(c.config ?? {}) },
        })))
      }

      // Initialize defaults if user has no connections
      if (!data || data.length === 0) {
        try {
          await initializeConnections()
        } catch (initErr) {
          // Upsert failed (schema not exposed yet) — return in-memory defaults
          console.warn('[SupabaseAdapter] initializeConnections failed, using defaults:', initErr instanceof Error ? initErr.message : initErr)
          return mapConnections(DEFAULT_CONNECTIONS.map(c => ({
            service: c.service, name: c.name, status: c.status,
            permissions: c.permissions, config: { summary: c.summary, ...(c.config ?? {}) },
          })))
        }
        // Re-fetch after initialization
        const { data: freshData, error: freshError } = await supabase
          .schema('claw').from('connections')
          .select('*')
          .order('created_at')
        if (freshError) {
          console.warn('[SupabaseAdapter] Re-fetch after init failed, using defaults:', freshError.message)
          return mapConnections(DEFAULT_CONNECTIONS.map(c => ({
            service: c.service, name: c.name, status: c.status,
            permissions: c.permissions, config: { summary: c.summary, ...(c.config ?? {}) },
          })))
        }
        return mapConnections(freshData ?? [])
      }

      return mapConnections(data)
    },

    async toggleConnectionPermission(connectionId: ConnectionId, permissionId: string, enabled: boolean): Promise<void> {
      // permissionId format: "ModuleName.perm_key"
      const dotIndex = permissionId.indexOf('.')
      if (dotIndex === -1) throw new Error(`Invalid permission ID format: ${permissionId}`)
      const moduleName = permissionId.slice(0, dotIndex)
      const permKey = permissionId.slice(dotIndex + 1)

      // DB column is `channel`, permissions stored in config.permissions JSONB
      const { data: conn, error: fetchError } = await supabase
        .schema('claw').from('connections')
        .select('config')
        .eq('channel', connectionId)
        .single()

      if (fetchError) throw new Error(`Failed to fetch connection: ${fetchError.message}`)
      if (!conn) throw new Error(`Connection "${connectionId}" not found`)

      const config = { ...(conn.config ?? {}) } as Record<string, any>
      const perms = { ...(config.permissions ?? {}) }
      if (perms[moduleName] && typeof perms[moduleName] === 'object') {
        perms[moduleName] = { ...perms[moduleName], [permKey]: enabled }
      }
      config.permissions = perms

      const { error } = await supabase
        .schema('claw').from('connections')
        .update({ config })
        .eq('channel', connectionId)

      if (error) throw new Error(error.message)
    },

    async disconnectConnection(connectionId: ConnectionId): Promise<void> {
      const { error } = await supabase
        .schema('claw').from('connections')
        .update({ status: 'disconnected', config: {} })
        .eq('channel', connectionId)

      if (error) throw new Error(error.message)
    },
  }
}
