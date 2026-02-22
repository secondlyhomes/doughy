/**
 * Gateway Module
 *
 * Barrel exports for the gateway adapter layer.
 * Always uses SupabaseGatewayAdapter — mock adapter removed.
 */

export type { GatewayAdapter } from './types'
export { SupabaseGatewayAdapter } from './supabaseAdapter'
