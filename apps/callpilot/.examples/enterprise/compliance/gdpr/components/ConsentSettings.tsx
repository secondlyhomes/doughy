/**
 * ConsentSettings Component
 * Displays consent items with toggles
 */

import React, { useState } from 'react'
import { View, Text, Switch, StyleSheet, TouchableOpacity } from 'react-native'
import { ConsentDetails, ConsentPreferences, ConsentType } from '../types'
import { CONSENT_TYPES } from '../utils/consent-utils'
import { ConsentDetailsModal } from './ConsentDetailsModal'

interface ConsentSettingsProps {
  preferences: ConsentPreferences
  saving: boolean
  onUpdateConsent: (type: ConsentType, value: boolean) => void
}

export function ConsentSettings({
  preferences,
  saving,
  onUpdateConsent,
}: ConsentSettingsProps) {
  const [showDetails, setShowDetails] = useState<ConsentDetails | null>(null)

  return (
    <>
      <View style={styles.consentList}>
        {CONSENT_TYPES.map((consentType) => (
          <ConsentItem
            key={consentType.type}
            consentType={consentType}
            value={preferences[consentType.type]}
            saving={saving}
            onToggle={(value) => onUpdateConsent(consentType.type, value)}
            onViewDetails={() => setShowDetails(consentType)}
          />
        ))}
      </View>

      <ConsentDetailsModal
        details={showDetails}
        onClose={() => setShowDetails(null)}
      />
    </>
  )
}

interface ConsentItemProps {
  consentType: ConsentDetails
  value: boolean
  saving: boolean
  onToggle: (value: boolean) => void
  onViewDetails: () => void
}

function ConsentItem({
  consentType,
  value,
  saving,
  onToggle,
  onViewDetails,
}: ConsentItemProps) {
  return (
    <View style={styles.consentItem}>
      <View style={styles.consentHeader}>
        <View style={styles.consentInfo}>
          <Text style={styles.consentTitle}>{consentType.title}</Text>
          {consentType.required && (
            <Text style={styles.requiredBadge}>Required</Text>
          )}
        </View>
        <Switch
          value={value}
          onValueChange={onToggle}
          disabled={consentType.required || saving}
        />
      </View>

      <Text style={styles.consentDescription}>{consentType.description}</Text>

      <TouchableOpacity style={styles.detailsButton} onPress={onViewDetails}>
        <Text style={styles.detailsButtonText}>View Details</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  consentList: {
    padding: 16,
  },
  consentItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  consentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  consentInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  consentTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  requiredBadge: {
    fontSize: 10,
    color: '#fff',
    backgroundColor: '#ff9800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: 'bold',
  },
  consentDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  detailsButton: {
    alignSelf: 'flex-start',
  },
  detailsButtonText: {
    fontSize: 14,
    color: '#2196f3',
    fontWeight: '600',
  },
})
