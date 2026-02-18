/**
 * Type definitions for Audit Log components
 */

export interface AuditLog {
  id: string
  organization_id: string
  user_id: string
  action: string
  action_category: string
  resource_type: string
  resource_id?: string
  resource_name?: string
  changes?: any
  ip_address?: string
  user_agent?: string
  severity: string
  compliance_tags: string[]
  metadata: any
  created_at: string
}

export interface FilterOptions {
  userId?: string
  action?: string
  resourceType?: string
  severity?: string
  dateFrom?: Date
  dateTo?: Date
  searchQuery?: string
}

export interface AuditStatistics {
  total: number
  byAction: Record<string, number>
  bySeverity: Record<string, number>
  criticalEvents: number
  errorEvents: number
}

export type SeverityLevel = 'critical' | 'error' | 'warning' | 'info'
