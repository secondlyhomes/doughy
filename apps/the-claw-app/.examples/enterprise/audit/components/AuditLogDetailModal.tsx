/**
 * Modal for displaying detailed audit log information
 */

import React from 'react'
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native'
import { AuditLog } from './types'
import { styles } from './audit-log.styles'

interface AuditLogDetailModalProps {
  log: AuditLog | null
  onClose: () => void
}

export function AuditLogDetailModal({ log, onClose }: AuditLogDetailModalProps) {
  return (
    <Modal
      visible={log !== null}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <ModalHeader onClose={onClose} />
        <ScrollView style={styles.modalContent}>
          {log && <LogDetails log={log} />}
        </ScrollView>
      </View>
    </Modal>
  )
}

interface ModalHeaderProps {
  onClose: () => void
}

function ModalHeader({ onClose }: ModalHeaderProps) {
  return (
    <View style={styles.modalHeader}>
      <Text style={styles.modalTitle}>Audit Log Details</Text>
      <TouchableOpacity onPress={onClose}>
        <Text style={styles.closeButton}>Close</Text>
      </TouchableOpacity>
    </View>
  )
}

interface LogDetailsProps {
  log: AuditLog
}

function LogDetails({ log }: LogDetailsProps) {
  return (
    <>
      <DetailRow label="ID" value={log.id} />
      <DetailRow label="Action" value={log.action} />
      <DetailRow label="Category" value={log.action_category} />
      <DetailRow label="Resource Type" value={log.resource_type} />
      <DetailRow label="Resource ID" value={log.resource_id} />
      <DetailRow label="Resource Name" value={log.resource_name} />
      <DetailRow label="Severity" value={log.severity} />
      <DetailRow label="User ID" value={log.user_id} />
      <DetailRow label="IP Address" value={log.ip_address} />
      <DetailRow
        label="Timestamp"
        value={new Date(log.created_at).toLocaleString()}
      />

      {log.compliance_tags.length > 0 && (
        <DetailRow
          label="Compliance Tags"
          value={log.compliance_tags.join(', ')}
        />
      )}

      {log.changes && (
        <DetailRow
          label="Changes"
          value={JSON.stringify(log.changes, null, 2)}
        />
      )}

      {log.metadata && (
        <DetailRow
          label="Metadata"
          value={JSON.stringify(log.metadata, null, 2)}
        />
      )}
    </>
  )
}

interface DetailRowProps {
  label: string
  value?: string
}

function DetailRow({ label, value }: DetailRowProps) {
  if (!value) return null

  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}:</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  )
}
