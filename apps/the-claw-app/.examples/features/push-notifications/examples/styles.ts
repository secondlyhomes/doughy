/**
 * Shared styles for push notification examples
 */

import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  info: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
  section: {
    marginTop: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  notificationItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  notificationBody: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  notificationMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  notificationStatus: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  notificationDate: {
    fontSize: 12,
    color: '#999',
  },
});
