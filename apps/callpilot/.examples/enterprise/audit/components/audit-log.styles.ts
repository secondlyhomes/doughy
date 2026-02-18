/**
 * Styles for audit log components
 */
import { StyleSheet, Platform, ViewStyle } from 'react-native'

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    backgroundColor: '#2196f3',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
  },
  headerButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  statsContainer: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statCard: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  actionBreakdown: {
    marginTop: 12,
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  breakdownAction: {
    fontSize: 14,
    color: '#666',
  },
  breakdownCount: {
    fontSize: 14,
    fontWeight: '600',
  },
  loader: {
    marginTop: 32,
  },
  logItem: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  logAction: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  logTimestamp: {
    fontSize: 12,
    color: '#666',
  },
  logDetails: {
    marginBottom: 8,
  },
  logResource: {
    fontSize: 14,
    marginBottom: 4,
  },
  logUser: {
    fontSize: 12,
    color: '#666',
  },
  severityInfo: { borderLeftColor: '#4caf50' },
  severityWarning: { borderLeftColor: '#ff9800' },
  severityError: { borderLeftColor: '#ff5722' },
  severityCritical: { borderLeftColor: '#f44336' },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 8,
  },
  tag: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 10,
    color: '#1976d2',
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    fontSize: 16,
    color: '#2196f3',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  detailRow: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
})

export function getSeverityStyle(severity: string): ViewStyle {
  switch (severity) {
    case 'critical': return styles.severityCritical
    case 'error': return styles.severityError
    case 'warning': return styles.severityWarning
    default: return styles.severityInfo
  }
}
