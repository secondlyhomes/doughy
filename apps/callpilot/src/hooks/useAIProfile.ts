/**
 * AI Profile Hook
 *
 * Loads communication style profile and settings from aiProfileService.
 */

import { useState, useEffect, useCallback } from 'react'
import type {
  CommunicationStyleProfile,
  AIProfileSettings,
  QuestionnaireAnswers,
} from '@/types'
import * as aiProfileService from '@/services/aiProfileService'

export interface UseAIProfileReturn {
  profile: CommunicationStyleProfile | null
  settings: AIProfileSettings | null
  updateSettings: (updates: Partial<AIProfileSettings>) => void
  submitQuestionnaire: (answers: QuestionnaireAnswers) => void
  isLoading: boolean
  error: string | null
}

export function useAIProfile(): UseAIProfileReturn {
  const [profile, setProfile] = useState<CommunicationStyleProfile | null>(null)
  const [settings, setSettings] = useState<AIProfileSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load(): Promise<void> {
      try {
        const [p, s] = await Promise.all([
          aiProfileService.getProfile(),
          aiProfileService.getSettings(),
        ])
        if (!cancelled) {
          setProfile(p)
          setSettings(s)
          setIsLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Failed to load AI profile'
          )
          setIsLoading(false)
        }
      }
    }
    void load()
    return () => { cancelled = true }
  }, [])

  const updateSettings = useCallback(
    (updates: Partial<AIProfileSettings>): void => {
      setSettings((prev) => (prev ? { ...prev, ...updates } : prev))
      void aiProfileService.updateSettings(updates)
    },
    []
  )

  const submitQuestionnaire = useCallback(
    (answers: QuestionnaireAnswers): void => {
      setProfile((prev) => (prev ? { ...prev, questionnaire: answers } : prev))
      void aiProfileService.submitQuestionnaire(answers)
    },
    []
  )

  return {
    profile,
    settings,
    updateSettings,
    submitQuestionnaire,
    isLoading,
    error,
  }
}
