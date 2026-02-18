/**
 * Audit Log Viewer Component
 *
 * Main viewer for audit logs with filtering, statistics, and export capabilities.
 * Features: Real-time log streaming, advanced filtering, CSV export, drill-down details.
 */

import React, { useState } from 'react'
import { View, Text, TouchableOpacity, Platform } from 'react-native'
import * as FileSystem from 'expo-file-system'
import * as Sharing from 'expo-sharing'

import { FilterOptions, AuditLog } from './types'
import { useAuditLogs } from './hooks/useAuditLogs'
import { AuditLogList } from './AuditLogList'
import { AuditLogStatistics } from './AuditLogFilters'
import { AuditLogDetailModal } from './AuditLogDetailModal'
import { styles } from './audit-log.styles'

export function AuditLogViewer() {
  const [filters, setFilters] = useState<FilterOptions>({})
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  const { logs, loading, refreshing, statistics, fetchLogs } = useAuditLogs(filters)

  const exportToCSV = async () => {
    try {
      const csv = convertToCSV(logs)
      const fileName = `audit-logs-${new Date().toISOString()}.csv`
      const fileUri = `${FileSystem.documentDirectory}${fileName}`

      await FileSystem.writeAsStringAsync(fileUri, csv)

      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Export Audit Logs',
        })
      }
    } catch (error) {
      console.error('Failed to export logs:', error)
    }
  }

  return (
    <View style={styles.container}>
      <Header
        onToggleFilters={() => setShowFilters(!showFilters)}
        onExport={exportToCSV}
      />

      <AuditLogStatistics statistics={statistics} />

      <AuditLogList
        logs={logs}
        loading={loading}
        refreshing={refreshing}
        onRefresh={fetchLogs}
        onSelectLog={setSelectedLog}
      />

      <AuditLogDetailModal
        log={selectedLog}
        onClose={() => setSelectedLog(null)}
      />
    </View>
  )
}

interface HeaderProps {
  onToggleFilters: () => void
  onExport: () => void
}

function Header({ onToggleFilters, onExport }: HeaderProps) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>Audit Logs</Text>
      <View style={styles.headerButtons}>
        <TouchableOpacity style={styles.headerButton} onPress={onToggleFilters}>
          <Text style={styles.headerButtonText}>Filters</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerButton} onPress={onExport}>
          <Text style={styles.headerButtonText}>Export CSV</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

function convertToCSV(data: AuditLog[]): string {
  const headers = [
    'Timestamp',
    'User',
    'Action',
    'Category',
    'Resource Type',
    'Resource ID',
    'Severity',
    'IP Address',
    'Compliance Tags',
  ]

  const rows = data.map((log) => [
    log.created_at,
    log.user_id,
    log.action,
    log.action_category,
    log.resource_type,
    log.resource_id || '',
    log.severity,
    log.ip_address || '',
    log.compliance_tags.join(';'),
  ])

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
}
