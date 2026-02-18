/**
 * Consent Store
 *
 * Tracks user consent for Autonomous mode.
 * Persisted to AsyncStorage so consent survives app restarts.
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { AutonomousConsent } from '@/types'

interface ConsentState {
  consent: AutonomousConsent | null
}

interface ConsentActions {
  grantConsent(tosVersion: string, privacyVersion: string): void
  revokeConsent(): void
  hasActiveConsent(): boolean
}

export const useConsentStore = create<ConsentState & ConsentActions>()(
  persist(
    (set, get) => ({
      consent: null,

      grantConsent: (tosVersion, privacyVersion) =>
        set({
          consent: {
            agreedAt: new Date().toISOString(),
            tosVersion,
            privacyVersion,
            revokedAt: null,
          },
        }),

      revokeConsent: () =>
        set((state) => ({
          consent: state.consent
            ? { ...state.consent, revokedAt: new Date().toISOString() }
            : null,
        })),

      hasActiveConsent: () => {
        const { consent } = get()
        return consent !== null && consent.revokedAt === null
      },
    }),
    {
      name: '@the-claw/autonomous-consent',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ consent: state.consent }),
    },
  ),
)
