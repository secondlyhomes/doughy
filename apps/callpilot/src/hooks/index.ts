/**
 * Custom Hooks
 *
 * Export all custom hooks from this file.
 * Production hooks (useX) call services; mock hooks (useMockX) are kept for tests.
 */

export { useAppState } from './useAppState'

// Production hooks (call services)
export * from './useContacts'
export * from './useCalls'
export * from './useCommunications'
export * from './useBriefs'
export * from './useMemos'
export * from './useProfile'
export * from './useAIProfile'
export * from './useCallCoaching'
export * from './useConversations'
export * from './useKeyboardAvoidance'
export * from './useClawSuggestions'
export * from './useMockCallSimulation'
export * from './useCallStream'

// Mock hooks (kept for tests — types re-exported from production hooks above)
export { useMockContacts } from './useMockContacts'
export type { UseMockContactsReturn } from './useMockContacts'
export { useMockCalls } from './useMockCalls'
export type { UseMockCallsReturn } from './useMockCalls'
export { useMockBriefs } from './useMockBriefs'
export type { UseMockBriefsReturn } from './useMockBriefs'
export { useMockMemos } from './useMockMemos'
export type { UseMockMemosReturn } from './useMockMemos'
export { useMockProfile } from './useMockProfile'
export type { UseMockProfileReturn } from './useMockProfile'
export { useMockCommunications } from './useMockCommunications'
export type { UseMockCommunicationsReturn } from './useMockCommunications'
