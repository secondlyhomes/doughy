// src/features/real-estate/stores/drawerStore.ts
// Mobile navigation drawer store (replaces sidebar for mobile)

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface DrawerState {
  isOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
}

export const useDrawerStore = create<DrawerState>()(
  persist(
    (set) => ({
      isOpen: false,
      openDrawer: () => set({ isOpen: true }),
      closeDrawer: () => set({ isOpen: false }),
      toggleDrawer: () => set((state) => ({ isOpen: !state.isOpen })),
    }),
    {
      name: 'property-drawer-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
