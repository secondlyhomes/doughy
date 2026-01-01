// src/store/appStore.ts
// Global app state store using Zustand
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AppState {
  // App state
  isReady: boolean;
  isOnline: boolean;

  // Theme
  colorScheme: 'light' | 'dark' | 'system';

  // User preferences
  hasCompletedOnboarding: boolean;
  pushNotificationsEnabled: boolean;

  // Actions
  setIsReady: (ready: boolean) => void;
  setIsOnline: (online: boolean) => void;
  setColorScheme: (scheme: 'light' | 'dark' | 'system') => void;
  setHasCompletedOnboarding: (completed: boolean) => void;
  setPushNotificationsEnabled: (enabled: boolean) => void;
  reset: () => void;
}

const initialState = {
  isReady: false,
  isOnline: true,
  colorScheme: 'system' as const,
  hasCompletedOnboarding: false,
  pushNotificationsEnabled: false,
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      ...initialState,

      setIsReady: (ready) => set({ isReady: ready }),
      setIsOnline: (online) => set({ isOnline: online }),
      setColorScheme: (scheme) => set({ colorScheme: scheme }),
      setHasCompletedOnboarding: (completed) => set({ hasCompletedOnboarding: completed }),
      setPushNotificationsEnabled: (enabled) => set({ pushNotificationsEnabled: enabled }),

      reset: () => set(initialState),
    }),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        colorScheme: state.colorScheme,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        pushNotificationsEnabled: state.pushNotificationsEnabled,
      }),
    }
  )
);
