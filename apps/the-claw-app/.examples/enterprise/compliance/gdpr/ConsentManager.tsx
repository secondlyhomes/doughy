/**
 * =============================================
 * CONSENT MANAGER COMPONENT
 * =============================================
 * GDPR-compliant consent management UI
 *
 * Features:
 * - Granular consent controls
 * - Consent history tracking
 * - Cookie consent banner
 * - Marketing preferences
 * - Analytics opt-in/out
 *
 * GDPR Articles: 6, 7, 13, 14
 * =============================================
 */

import React from 'react'
import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { useConsent } from './hooks/useConsent'
import { ConsentBanner } from './components/ConsentBanner'
import { ConsentSettings } from './components/ConsentSettings'

export function ConsentManager() {
  const {
    preferences,
    loading,
    saving,
    showBanner,
    setShowBanner,
    updateConsent,
    acceptAll,
    rejectAll,
  } = useConsent()

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading consent preferences...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Privacy Preferences</Text>
          <Text style={styles.subtitle}>
            Manage your privacy and cookie preferences. You can change these settings
            at any time.
          </Text>
        </View>

        <ConsentSettings
          preferences={preferences}
          saving={saving}
          onUpdateConsent={updateConsent}
        />

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            For more information, please read our{' '}
            <Text style={styles.link}>Privacy Policy</Text> and{' '}
            <Text style={styles.link}>Cookie Policy</Text>.
          </Text>
        </View>
      </ScrollView>

      <ConsentBanner
        visible={showBanner}
        onAcceptAll={acceptAll}
        onRejectAll={rejectAll}
        onCustomize={() => setShowBanner(false)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  footer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  link: {
    color: '#2196f3',
    textDecorationLine: 'underline',
  },
})
