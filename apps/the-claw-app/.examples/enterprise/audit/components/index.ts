/**
 * Audit Log Components
 *
 * Clean re-exports for audit log functionality.
 */

// Main component
export { AuditLogViewer } from './AuditLogViewer'

// Sub-components
export { AuditLogList } from './AuditLogList'
export { AuditLogItem } from './AuditLogItem'
export { AuditLogStatistics } from './AuditLogFilters'
export { AuditLogDetailModal } from './AuditLogDetailModal'

// Hooks
export { useAuditLogs } from './hooks/useAuditLogs'
export type { UseAuditLogsReturn } from './hooks/useAuditLogs'

// Types
export type {
  AuditLog,
  FilterOptions,
  AuditStatistics,
  SeverityLevel,
} from './types'

// Styles (for extension/customization)
export { styles, getSeverityStyle } from './audit-log.styles'
