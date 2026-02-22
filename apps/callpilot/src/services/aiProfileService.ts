/**
 * AI Profile Service
 *
 * Communication style profile, settings, and questionnaire.
 *
 * // TODO: Phase 2 — replace mock data with Supabase queries
 * // TODO: Phase 5 — add analyzeNewCommunication
 */

import type {
  CommunicationStyleProfile,
  AIProfileSettings,
  QuestionnaireAnswers,
} from '@/types'

const mockProfile: CommunicationStyleProfile = {
  id: 'ai-profile-1',
  userId: 'user-1',
  confidenceScore: 0.72,
  communicationsAnalyzed: 47,
  toneProfile: {
    formality: 0.65,
    warmth: 0.82,
    directness: 0.58,
    primaryTone: 'Consultative & Warm',
    samplePhrases: [
      'I completely understand your concern...',
      'Let me walk you through the options...',
      'What matters most to you in a policy?',
    ],
  },
  patterns: {
    averageResponseTime: 45,
    preferredCallLength: 22,
    peakProductivityHours: ['9:00 AM', '10:00 AM', '2:00 PM'],
    followUpFrequency: 3.5,
    objectionHandlingStyle:
      'Empathetic reframe - acknowledges concern, then pivots to value',
    closingApproach:
      'Consultative close - summarizes needs met, asks for commitment',
  },
  strengths: [
    'Building rapport quickly',
    'Explaining complex coverage simply',
    'Consistent follow-up cadence',
  ],
  growthAreas: [
    'Asking for the close earlier',
    'Handling price objections more assertively',
    'Shortening discovery calls',
  ],
  questionnaire: null,
}

const mockSettings: AIProfileSettings = {
  passiveLearningEnabled: true,
  analyzeCallTranscripts: true,
  analyzeTextMessages: true,
  analyzeEmails: false,
  retainAnalysisMonths: 12,
}

export async function getProfile(): Promise<CommunicationStyleProfile> {
  return mockProfile
}

export async function getSettings(): Promise<AIProfileSettings> {
  return mockSettings
}

export async function updateSettings(
  updates: Partial<AIProfileSettings>
): Promise<AIProfileSettings> {
  // TODO: Phase 2 — supabase update + return updated row
  return { ...mockSettings, ...updates }
}

export async function submitQuestionnaire(
  answers: QuestionnaireAnswers
): Promise<CommunicationStyleProfile> {
  // TODO: Phase 2 — supabase update + return updated profile
  return { ...mockProfile, questionnaire: answers }
}
