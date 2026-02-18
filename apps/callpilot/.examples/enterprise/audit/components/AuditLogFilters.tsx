/**
 * Audit log statistics and filters display
 */

import React from 'react'
import { View, Text } from 'react-native'
import { AuditStatistics } from './types'
import { styles } from './audit-log.styles'

interface AuditLogStatisticsProps {
  statistics: AuditStatistics
}

export function AuditLogStatistics({ statistics }: AuditLogStatisticsProps) {
  return (
    <View style={styles.statsContainer}>
      <Text style={styles.statsTitle}>Audit Statistics</Text>

      <View style={styles.statsGrid}>
        <StatCard label="Total Events" value={statistics.total} />
        <StatCard
          label="Critical"
          value={statistics.criticalEvents}
          color="#ff4444"
        />
        <StatCard
          label="Errors"
          value={statistics.errorEvents}
          color="#ff9800"
        />
      </View>

      <ActionBreakdown byAction={statistics.byAction} />
    </View>
  )
}

interface StatCardProps {
  label: string
  value: number
  color?: string
}

function StatCard({ label, value, color = '#4caf50' }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

interface ActionBreakdownProps {
  byAction: Record<string, number>
}

function ActionBreakdown({ byAction }: ActionBreakdownProps) {
  const entries = Object.entries(byAction)

  if (entries.length === 0) {
    return null
  }

  return (
    <View style={styles.actionBreakdown}>
      <Text style={styles.breakdownTitle}>Actions Breakdown:</Text>
      {entries.map(([action, count]) => (
        <View key={action} style={styles.breakdownRow}>
          <Text style={styles.breakdownAction}>{action}</Text>
          <Text style={styles.breakdownCount}>{count}</Text>
        </View>
      ))}
    </View>
  )
}
