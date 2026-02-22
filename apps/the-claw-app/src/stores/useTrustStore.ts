/**
 * Trust Level Store
 *
 * Zustand store with AsyncStorage persistence for trust level config.
 * Defaults to 'manual'. Migrates from old guard-level storage key on init.
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { TrustLevel, HeaderMode, ActionOverride } from '@/types'

interface TrustState {
  trustLevel: TrustLevel
  countdownSeconds: number
  overrides: ActionOverride[]
  dailySpendLimitCents: number
  dailyCallLimit: number
  headerMode: HeaderMode
  loading: boolean
  migrated: boolean
}

interface TrustActions {
  setTrustLevel(level: TrustLevel): void
  setHeaderMode(mode: HeaderMode): void
  setCountdownSeconds(seconds: number): void
  setOverrides(overrides: ActionOverride[]): void
  setDailySpendLimitCents(cents: number): void
  setDailyCallLimit(limit: number): void
  setLoading(loading: boolean): void
}

/** Map old guard levels to new trust levels */
function migrateGuardLevel(guard: string): TrustLevel {
  switch (guard) {
    case 'fortress': return 'locked'
    case 'strict': return 'manual'
    case 'balanced': return 'guarded'
    case 'relaxed': return 'guarded'
    case 'autonomous': return 'autonomous'
    default: return 'manual'
  }
}

export const useTrustStore = create<TrustState & TrustActions>()(
  persist(
    (set) => ({
      trustLevel: 'manual',
      countdownSeconds: 30,
      overrides: [],
      dailySpendLimitCents: 500,
      dailyCallLimit: 10,
      headerMode: 'detailed',
      loading: false,
      migrated: false,

      setTrustLevel: (trustLevel) => set({ trustLevel }),
      setHeaderMode: (headerMode) => set({ headerMode }),
      setCountdownSeconds: (countdownSeconds) => set({ countdownSeconds }),
      setOverrides: (overrides) => set({ overrides }),
      setDailySpendLimitCents: (dailySpendLimitCents) => set({ dailySpendLimitCents }),
      setDailyCallLimit: (dailyCallLimit) => set({ dailyCallLimit }),
      setLoading: (loading) => set({ loading }),
    }),
    {
      name: '@the-claw/trust-config',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        trustLevel: state.trustLevel,
        countdownSeconds: state.countdownSeconds,
        overrides: state.overrides,
        dailySpendLimitCents: state.dailySpendLimitCents,
        dailyCallLimit: state.dailyCallLimit,
        headerMode: state.headerMode,
        migrated: state.migrated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && !state.migrated) {
          // Migrate from old guard-level key
          AsyncStorage.getItem('@the-claw/guard-level')
            .then((raw) => {
              if (raw) {
                try {
                  const parsed = JSON.parse(raw)
                  const oldLevel = parsed?.state?.guardLevel
                  if (oldLevel) {
                    const newLevel = migrateGuardLevel(oldLevel)
                    useTrustStore.setState({ trustLevel: newLevel, migrated: true })
                  } else {
                    useTrustStore.setState({ migrated: true })
                  }
                } catch {
                  useTrustStore.setState({ migrated: true })
                }
              } else {
                useTrustStore.setState({ migrated: true })
              }
            })
            .catch(() => {
              useTrustStore.setState({ migrated: true })
            })
        }
      },
    },
  ),
)
