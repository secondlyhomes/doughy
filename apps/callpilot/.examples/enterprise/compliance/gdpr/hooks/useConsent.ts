/**
 * useConsent Hook
 * Manages consent state and operations
 */

import { useState, useEffect, useCallback } from 'react'
import { Alert } from 'react-native'
import { GDPRService } from '../GDPRService'
import { supabase } from '../../../../services/supabase'
import { ConsentPreferences, ConsentType, DEFAULT_PREFERENCES } from '../types'
import {
  applyConsentChanges,
  createAcceptAllPreferences,
  createRejectAllPreferences,
} from '../utils/consent-utils'

interface UseConsentReturn {
  preferences: ConsentPreferences
  loading: boolean
  saving: boolean
  showBanner: boolean
  setShowBanner: (show: boolean) => void
  updateConsent: (type: ConsentType, value: boolean) => Promise<void>
  acceptAll: () => Promise<void>
  rejectAll: () => Promise<void>
}

export function useConsent(): UseConsentReturn {
  const [preferences, setPreferences] = useState<ConsentPreferences>(DEFAULT_PREFERENCES)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showBanner, setShowBanner] = useState(false)

  const gdprService = GDPRService.getInstance()

  const loadConsents = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const consents = await gdprService.getUserConsents(user.id)

      const newPrefs = { ...DEFAULT_PREFERENCES }
      for (const consent of consents) {
        if (consent.granted && consent.consent_type in newPrefs) {
          newPrefs[consent.consent_type as ConsentType] = true
        }
      }

      setPreferences(newPrefs)

      if (consents.length === 0) {
        setShowBanner(true)
      }
    } catch (error) {
      console.error('Failed to load consents:', error)
    } finally {
      setLoading(false)
    }
  }, [gdprService])

  useEffect(() => {
    loadConsents()
  }, [loadConsents])

  const updateConsent = useCallback(
    async (type: ConsentType, value: boolean) => {
      if (type === 'essential' && !value) {
        Alert.alert(
          'Required Consent',
          'Essential cookies are required for the app to function and cannot be disabled.'
        )
        return
      }

      try {
        setSaving(true)

        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        setPreferences((prev) => ({ ...prev, [type]: value }))

        if (value) {
          await gdprService.grantConsent(user.id, type)
        } else {
          await gdprService.withdrawConsent(user.id, type)
        }

        applyConsentChanges(type, value)
      } catch (error) {
        console.error('Failed to update consent:', error)
        Alert.alert('Error', 'Failed to update consent preferences')
      } finally {
        setSaving(false)
      }
    },
    [gdprService]
  )

  const acceptAll = useCallback(async () => {
    const allTrue = createAcceptAllPreferences()

    for (const [type, value] of Object.entries(allTrue)) {
      if (value && type !== 'essential') {
        await updateConsent(type as ConsentType, true)
      }
    }

    setShowBanner(false)
  }, [updateConsent])

  const rejectAll = useCallback(async () => {
    const allFalse = createRejectAllPreferences()

    for (const [type, value] of Object.entries(allFalse)) {
      if (!value && type !== 'essential') {
        await updateConsent(type as ConsentType, false)
      }
    }

    setShowBanner(false)
  }, [updateConsent])

  return {
    preferences,
    loading,
    saving,
    showBanner,
    setShowBanner,
    updateConsent,
    acceptAll,
    rejectAll,
  }
}
