/**
 * useOnboarding Hook
 *
 * Checks and manages onboarding completion state via AsyncStorage.
 * Returns null for isOnboarded while the persisted value is loading.
 */

import { useState, useEffect, useCallback } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

const STORAGE_KEY = '@the-claw/onboarding-completed'

export const useOnboarding = () => {
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null)

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((value) => {
      setIsOnboarded(value === 'true')
    })
  }, [])

  const completeOnboarding = useCallback(async () => {
    await AsyncStorage.setItem(STORAGE_KEY, 'true')
    setIsOnboarded(true)
  }, [])

  const resetOnboarding = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY)
    setIsOnboarded(false)
  }, [])

  return { isOnboarded, completeOnboarding, resetOnboarding }
}
