/**
 * Services
 *
 * Business logic and API calls
 */

export type { GatewayAdapter } from './gateway/types'
export { SupabaseGatewayAdapter } from './gateway/supabaseAdapter'
export { HttpGatewayAdapter } from './gateway/httpAdapter'
export { ConnectionManager } from './connectionManager'
export { ActionService } from './actionService'
export { filterActivityEntries } from './activityService'
