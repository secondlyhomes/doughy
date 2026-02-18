/**
 * ConsentBanner Component
 * GDPR cookie consent banner UI
 */

import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'

interface ConsentBannerProps {
  visible: boolean
  onAcceptAll: () => void
  onRejectAll: () => void
  onCustomize: () => void
}

export function ConsentBanner({
  visible,
  onAcceptAll,
  onRejectAll,
  onCustomize,
}: ConsentBannerProps) {
  if (!visible) return null

  return (
    <View style={styles.banner}>
      <Text style={styles.bannerTitle}>We value your privacy</Text>
      <Text style={styles.bannerText}>
        We use cookies and similar technologies to improve your experience. You can
        choose which types of cookies to accept.
      </Text>

      <View style={styles.bannerButtons}>
        <TouchableOpacity style={styles.bannerButtonSecondary} onPress={onRejectAll}>
          <Text style={styles.bannerButtonSecondaryText}>Reject All</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.bannerButtonSecondary} onPress={onCustomize}>
          <Text style={styles.bannerButtonSecondaryText}>Customize</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.bannerButtonPrimary} onPress={onAcceptAll}>
          <Text style={styles.bannerButtonPrimaryText}>Accept All</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  bannerText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  bannerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  bannerButtonPrimary: {
    flex: 1,
    backgroundColor: '#2196f3',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  bannerButtonPrimaryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  bannerButtonSecondary: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  bannerButtonSecondaryText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 14,
  },
})
