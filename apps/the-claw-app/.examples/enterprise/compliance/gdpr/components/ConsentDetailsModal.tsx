/**
 * ConsentDetailsModal Component
 * Modal displaying detailed consent information
 */

import React from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal } from 'react-native'
import { ConsentDetails } from '../types'

interface ConsentDetailsModalProps {
  details: ConsentDetails | null
  onClose: () => void
}

export function ConsentDetailsModal({ details, onClose }: ConsentDetailsModalProps) {
  if (!details) return null

  return (
    <Modal visible={true} animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{details.title}</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>Close</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <DetailSection title="Purpose" content={details.purpose} />
          <DetailSection title="Legal Basis" content={details.legalBasis} />
          <DetailSection title="Data Retention" content={details.retention} />

          <View style={styles.detailSection}>
            <Text style={styles.detailTitle}>Data Collected:</Text>
            {details.dataCollected.map((item, index) => (
              <Text key={index} style={styles.bulletPoint}>
                - {item}
              </Text>
            ))}
          </View>

          {details.thirdParties && (
            <View style={styles.detailSection}>
              <Text style={styles.detailTitle}>Third Parties:</Text>
              {details.thirdParties.map((party, index) => (
                <Text key={index} style={styles.bulletPoint}>
                  - {party}
                </Text>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  )
}

function DetailSection({ title, content }: { title: string; content: string }) {
  return (
    <View style={styles.detailSection}>
      <Text style={styles.detailTitle}>{title}:</Text>
      <Text style={styles.detailContent}>{content}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
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
    padding: 20,
  },
  detailSection: {
    marginBottom: 20,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  detailContent: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  bulletPoint: {
    fontSize: 14,
    color: '#666',
    lineHeight: 24,
    paddingLeft: 8,
  },
})
