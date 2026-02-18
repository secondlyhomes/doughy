/**
 * =============================================
 * AUDIT LOGGER SERVICE
 * =============================================
 * Centralized audit logging service for tracking
 * all user actions, data changes, and security events.
 *
 * Features:
 * - Automatic context capture (user, org, IP, device)
 * - Structured event logging
 * - Compliance tagging (GDPR, HIPAA, SOC2)
 * - Sensitive data access tracking
 * - Security event logging
 *
 * Usage:
 *   const logger = AuditLogger.getInstance()
 *   await logger.logTaskCreated(task)
 *   await logger.logUserLogin()
 * =============================================
 */

import { supabase } from '../services/supabase'
import Constants from 'expo-constants'
import { Platform } from 'react-native'
import * as Device from 'expo-device'
import * as Network from 'expo-network'

// =============================================
// TYPES
// =============================================

export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'read'
  | 'login'
  | 'logout'
  | 'export'
  | 'import'
  | 'share'
  | 'restore'
  | 'archive'
  | 'permission_changed'

export type AuditActionCategory = 'data' | 'auth' | 'security' | 'admin' | 'system'

export type AuditSeverity = 'info' | 'warning' | 'error' | 'critical'

export type ComplianceTag = 'gdpr' | 'hipaa' | 'soc2' | 'iso27001' | 'pci'

export interface AuditLogEntry {
  action: AuditAction | string
  actionCategory?: AuditActionCategory
  resourceType: string
  resourceId?: string
  resourceName?: string
  changes?: {
    before?: Record<string, any>
    after?: Record<string, any>
  }
  severity?: AuditSeverity
  complianceTags?: ComplianceTag[]
  metadata?: Record<string, any>
}

export interface SensitiveDataAccessEntry {
  dataType: 'phi' | 'pii' | 'financial' | 'credentials' | 'confidential'
  resourceType: string
  resourceId: string
  fieldsAccessed: string[]
  accessReason: string
}

export interface SecurityEventEntry {
  eventType:
    | 'login_failure'
    | 'login_success'
    | 'permission_denied'
    | 'rate_limit_exceeded'
    | 'suspicious_activity'
    | 'unauthorized_access'
  severity: AuditSeverity
  description: string
  details?: Record<string, any>
  wasBlocked?: boolean
  actionTaken?: string
}

// =============================================
// AUDIT LOGGER CLASS
// =============================================

export class AuditLogger {
  private static instance: AuditLogger
  private deviceInfo: Record<string, any> | null = null
  private networkInfo: Record<string, any> | null = null

  private constructor() {
    this.initializeDeviceInfo()
  }

  static getInstance(): AuditLogger {
    if (!this.instance) {
      this.instance = new AuditLogger()
    }
    return this.instance
  }

  // =============================================
  // INITIALIZATION
  // =============================================

  private async initializeDeviceInfo() {
    try {
      this.deviceInfo = {
        brand: Device.brand,
        modelName: Device.modelName,
        osName: Device.osName,
        osVersion: Device.osVersion,
        deviceType: Device.deviceType,
        deviceName: Device.deviceName,
      }

      this.networkInfo = await Network.getNetworkStateAsync()
    } catch (error) {
      console.warn('Failed to initialize device info:', error)
    }
  }

  // =============================================
  // CORE LOGGING
  // =============================================

  async log(entry: AuditLogEntry): Promise<void> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      // Get current organization from context
      const currentOrgId = await this.getCurrentOrganizationId()

      const auditEntry = {
        organization_id: currentOrgId,
        user_id: user?.id,
        action: entry.action,
        action_category: entry.actionCategory || 'data',
        resource_type: entry.resourceType,
        resource_id: entry.resourceId,
        resource_name: entry.resourceName,
        changes: entry.changes,
        severity: entry.severity || 'info',
        compliance_tags: entry.complianceTags || [],
        metadata: {
          ...entry.metadata,
          app_version: Constants.expoConfig?.version,
          platform: Platform.OS,
          device: this.deviceInfo,
          network: this.networkInfo,
          timestamp: new Date().toISOString(),
        },
      }

      const { error } = await supabase.from('audit_logs').insert(auditEntry)

      if (error) {
        console.error('Failed to log audit entry:', error)
        // Don't throw - we don't want audit failures to break the app
      }
    } catch (error) {
      console.error('Audit logging error:', error)
    }
  }

  async logBatch(entries: AuditLogEntry[]): Promise<void> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      const currentOrgId = await this.getCurrentOrganizationId()

      const auditEntries = entries.map((entry) => ({
        organization_id: currentOrgId,
        user_id: user?.id,
        action: entry.action,
        action_category: entry.actionCategory || 'data',
        resource_type: entry.resourceType,
        resource_id: entry.resourceId,
        resource_name: entry.resourceName,
        changes: entry.changes,
        severity: entry.severity || 'info',
        compliance_tags: entry.complianceTags || [],
        metadata: {
          ...entry.metadata,
          app_version: Constants.expoConfig?.version,
          platform: Platform.OS,
        },
      }))

      const { error } = await supabase.from('audit_logs').insert(auditEntries)

      if (error) {
        console.error('Failed to log batch audit entries:', error)
      }
    } catch (error) {
      console.error('Batch audit logging error:', error)
    }
  }

  // =============================================
  // SENSITIVE DATA ACCESS LOGGING
  // =============================================

  async logSensitiveAccess(entry: SensitiveDataAccessEntry): Promise<void> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      const currentOrgId = await this.getCurrentOrganizationId()

      const { error } = await supabase.from('sensitive_data_access_logs').insert({
        organization_id: currentOrgId,
        user_id: user?.id,
        data_type: entry.dataType,
        data_classification: 'confidential',
        resource_type: entry.resourceType,
        resource_id: entry.resourceId,
        access_reason: entry.accessReason,
        fields_accessed: entry.fieldsAccessed,
        access_granted: true,
      })

      if (error) {
        console.error('Failed to log sensitive access:', error)
      }

      // Also log to main audit log with compliance tags
      await this.log({
        action: 'read',
        actionCategory: 'security',
        resourceType: entry.resourceType,
        resourceId: entry.resourceId,
        severity: 'warning',
        complianceTags: entry.dataType === 'phi' ? ['hipaa'] : ['gdpr'],
        metadata: {
          dataType: entry.dataType,
          fieldsAccessed: entry.fieldsAccessed,
          accessReason: entry.accessReason,
        },
      })
    } catch (error) {
      console.error('Sensitive access logging error:', error)
    }
  }

  // =============================================
  // SECURITY EVENT LOGGING
  // =============================================

  async logSecurityEvent(entry: SecurityEventEntry): Promise<void> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      const currentOrgId = await this.getCurrentOrganizationId()

      const { error } = await supabase.from('security_events').insert({
        organization_id: currentOrgId,
        user_id: user?.id,
        event_type: entry.eventType,
        severity: entry.severity,
        description: entry.description,
        details: entry.details,
        was_blocked: entry.wasBlocked || false,
        action_taken: entry.actionTaken,
      })

      if (error) {
        console.error('Failed to log security event:', error)
      }

      // Also log to main audit log
      await this.log({
        action: entry.eventType,
        actionCategory: 'security',
        resourceType: 'security_events',
        severity: entry.severity,
        complianceTags: ['soc2'],
        metadata: {
          ...entry.details,
          wasBlocked: entry.wasBlocked,
          actionTaken: entry.actionTaken,
        },
      })
    } catch (error) {
      console.error('Security event logging error:', error)
    }
  }

  // =============================================
  // CONVENIENCE METHODS - DATA OPERATIONS
  // =============================================

  async logTaskCreated(task: any): Promise<void> {
    await this.log({
      action: 'create',
      resourceType: 'tasks',
      resourceId: task.id,
      resourceName: task.title,
      changes: { after: task },
    })
  }

  async logTaskUpdated(taskId: string, before: any, after: any): Promise<void> {
    await this.log({
      action: 'update',
      resourceType: 'tasks',
      resourceId: taskId,
      resourceName: after.title,
      changes: { before, after },
    })
  }

  async logTaskDeleted(task: any): Promise<void> {
    await this.log({
      action: 'delete',
      resourceType: 'tasks',
      resourceId: task.id,
      resourceName: task.title,
      changes: { before: task },
    })
  }

  async logTaskShared(taskId: string, sharedWith: string[]): Promise<void> {
    await this.log({
      action: 'share',
      resourceType: 'tasks',
      resourceId: taskId,
      metadata: { sharedWith },
    })
  }

  // =============================================
  // CONVENIENCE METHODS - AUTH OPERATIONS
  // =============================================

  async logUserLogin(userId: string, method: string = 'password'): Promise<void> {
    await this.logSecurityEvent({
      eventType: 'login_success',
      severity: 'info',
      description: `User logged in via ${method}`,
      details: { method },
    })

    await this.log({
      action: 'login',
      actionCategory: 'auth',
      resourceType: 'auth',
      resourceId: userId,
      metadata: { method },
    })
  }

  async logUserLogout(userId: string): Promise<void> {
    await this.log({
      action: 'logout',
      actionCategory: 'auth',
      resourceType: 'auth',
      resourceId: userId,
    })
  }

  async logLoginFailure(email: string, reason: string): Promise<void> {
    await this.logSecurityEvent({
      eventType: 'login_failure',
      severity: 'warning',
      description: `Failed login attempt for ${email}`,
      details: { email, reason },
    })
  }

  async logPasswordReset(userId: string): Promise<void> {
    await this.logSecurityEvent({
      eventType: 'login_success', // Reusing type
      severity: 'warning',
      description: 'Password reset requested',
    })

    await this.log({
      action: 'update',
      actionCategory: 'auth',
      resourceType: 'auth',
      resourceId: userId,
      severity: 'warning',
      metadata: { type: 'password_reset' },
    })
  }

  // =============================================
  // CONVENIENCE METHODS - ADMIN OPERATIONS
  // =============================================

  async logUserRoleChanged(
    userId: string,
    oldRole: string,
    newRole: string
  ): Promise<void> {
    await this.log({
      action: 'permission_changed',
      actionCategory: 'admin',
      resourceType: 'users',
      resourceId: userId,
      severity: 'warning',
      changes: {
        before: { role: oldRole },
        after: { role: newRole },
      },
    })
  }

  async logOrganizationCreated(org: any): Promise<void> {
    await this.log({
      action: 'create',
      actionCategory: 'admin',
      resourceType: 'organizations',
      resourceId: org.id,
      resourceName: org.name,
      changes: { after: org },
    })
  }

  async logOrganizationDeleted(org: any): Promise<void> {
    await this.log({
      action: 'delete',
      actionCategory: 'admin',
      resourceType: 'organizations',
      resourceId: org.id,
      resourceName: org.name,
      severity: 'warning',
      changes: { before: org },
    })
  }

  // =============================================
  // CONVENIENCE METHODS - COMPLIANCE
  // =============================================

  async logDataExport(userId: string, exportType: string): Promise<void> {
    await this.log({
      action: 'export',
      actionCategory: 'data',
      resourceType: 'users',
      resourceId: userId,
      severity: 'warning',
      complianceTags: ['gdpr'],
      metadata: { exportType, reason: 'GDPR data export request' },
    })
  }

  async logDataDeletion(userId: string, reason: string): Promise<void> {
    await this.log({
      action: 'delete',
      actionCategory: 'data',
      resourceType: 'users',
      resourceId: userId,
      severity: 'warning',
      complianceTags: ['gdpr'],
      metadata: { reason, gdprRight: 'right_to_erasure' },
    })
  }

  async logConsentChanged(
    userId: string,
    consentType: string,
    granted: boolean
  ): Promise<void> {
    await this.log({
      action: 'update',
      actionCategory: 'data',
      resourceType: 'user_consents',
      resourceId: userId,
      complianceTags: ['gdpr'],
      changes: {
        before: { [consentType]: !granted },
        after: { [consentType]: granted },
      },
      metadata: { consentType, granted },
    })
  }

  // =============================================
  // HELPER METHODS
  // =============================================

  private async getCurrentOrganizationId(): Promise<string | undefined> {
    try {
      // Try to get from app state/context
      // This is a placeholder - implement based on your state management
      const orgId = await supabase
        .from('user_organizations')
        .select('organization_id')
        .limit(1)
        .single()

      return orgId.data?.organization_id
    } catch {
      return undefined
    }
  }

  // =============================================
  // QUERY HELPERS
  // =============================================

  async getRecentLogs(limit: number = 50) {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data
  }

  async getLogsByUser(userId: string, limit: number = 50) {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data
  }

  async getLogsByResource(resourceType: string, resourceId: string) {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('resource_type', resourceType)
      .eq('resource_id', resourceId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  async getSecurityEvents(limit: number = 50) {
    const { data, error } = await supabase
      .from('security_events')
      .select('*')
      .order('occurred_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data
  }

  async getFailedLoginAttempts(hoursAgo: number = 24) {
    const since = new Date()
    since.setHours(since.getHours() - hoursAgo)

    const { data, error } = await supabase
      .from('security_events')
      .select('*')
      .eq('event_type', 'login_failure')
      .gte('occurred_at', since.toISOString())
      .order('occurred_at', { ascending: false })

    if (error) throw error
    return data
  }
}

// =============================================
// REACT HOOKS
// =============================================

import { useCallback, useEffect, useState } from 'react'

export function useAuditLog() {
  const logger = AuditLogger.getInstance()

  const logAction = useCallback(
    (entry: AuditLogEntry) => {
      logger.log(entry)
    },
    [logger]
  )

  const logSensitiveAccess = useCallback(
    (entry: SensitiveDataAccessEntry) => {
      logger.logSensitiveAccess(entry)
    },
    [logger]
  )

  const logSecurityEvent = useCallback(
    (entry: SecurityEventEntry) => {
      logger.logSecurityEvent(entry)
    },
    [logger]
  )

  return {
    logAction,
    logSensitiveAccess,
    logSecurityEvent,
    logger,
  }
}

export function useAuditLogs(options?: {
  resourceType?: string
  resourceId?: string
  userId?: string
  limit?: number
}) {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const logger = AuditLogger.getInstance()

  useEffect(() => {
    async function fetchLogs() {
      try {
        setLoading(true)

        let data
        if (options?.resourceType && options?.resourceId) {
          data = await logger.getLogsByResource(
            options.resourceType,
            options.resourceId
          )
        } else if (options?.userId) {
          data = await logger.getLogsByUser(options.userId, options?.limit)
        } else {
          data = await logger.getRecentLogs(options?.limit)
        }

        setLogs(data)
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchLogs()
  }, [options?.resourceType, options?.resourceId, options?.userId, options?.limit])

  return { logs, loading, error }
}

// =============================================
// EXPORTS
// =============================================

export default AuditLogger
