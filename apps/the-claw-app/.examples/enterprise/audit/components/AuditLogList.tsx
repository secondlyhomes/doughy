/**
 * Audit log list with pull-to-refresh
 */

import React from 'react'
import { View, Text, FlatList, ActivityIndicator, RefreshControl } from 'react-native'
import { AuditLog } from './types'
import { AuditLogItem } from './AuditLogItem'
import { styles } from './audit-log.styles'

interface AuditLogListProps {
  logs: AuditLog[]
  loading: boolean
  refreshing: boolean
  onRefresh: () => void
  onSelectLog: (log: AuditLog) => void
}

export function AuditLogList({
  logs,
  loading,
  refreshing,
  onRefresh,
  onSelectLog,
}: AuditLogListProps) {
  if (loading) {
    return <ActivityIndicator size="large" style={styles.loader} />
  }

  return (
    <FlatList
      data={logs}
      renderItem={({ item }) => (
        <AuditLogItem log={item} onPress={onSelectLog} />
      )}
      keyExtractor={(item) => item.id}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      ListEmptyComponent={<EmptyState />}
    />
  )
}

function EmptyState() {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No audit logs found</Text>
    </View>
  )
}
