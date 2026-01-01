// src/store/index.ts
// Export all Zustand stores

export { useAppStore } from './appStore';
export type { AppState } from './appStore';

export { useGoogleStore } from './googleStore';
export type { GoogleState, GoogleEvent } from './googleStore';
