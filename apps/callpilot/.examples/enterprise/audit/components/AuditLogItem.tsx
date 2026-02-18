/**
 * Individual audit log item component
 */

import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { AuditLog } from './types'
import { styles, getSeverityStyle } from './audit-log.styles'

interface AuditLogItemProps {
  log: AuditLog
  onPress: (log: AuditLog) => void
}

export function AuditLogItem({ log, onPress }: AuditLogItemProps) {
  return (
    <TouchableOpacity
      style={[styles.logItem, getSeverityStyle(log.severity)]}
      onPress={() => onPress(log)}
    >
      <View style={styles.logHeader}>
        <Text style={styles.logAction}>{log.action.toUpperCase()}</Text>
        <Text style={styles.logTimestamp}>
          {new Date(log.created_at).toLocaleString()}
        </Text>
      </View>

      <View style={styles.logDetails}>
        <Text style={styles.logResource}>
          {log.resource_type}
          {log.resource_name ? `: ${log.resource_name}` : ''}
        </Text>
        {log.user_id && <Text style={styles.logUser}>User: {log.user_id}</Text>}
      </View>

      {log.compliance_tags.length > 0 && (
        <ComplianceTags tags={log.compliance_tags} />
      )}
    </TouchableOpacity>
  )
}

interface ComplianceTagsProps {
  tags: string[]
}

function ComplianceTags({ tags }: ComplianceTagsProps) {
  return (
    <View style={styles.tagsContainer}>
      {tags.map((tag) => (
        <View key={tag} style={styles.tag}>
          <Text style={styles.tagText}>{tag.toUpperCase()}</Text>
        </View>
      ))}
    </View>
  )
}
