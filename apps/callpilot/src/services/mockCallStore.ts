/**
 * Mock Call Store
 *
 * Simple in-memory store for passing mock call results from the active-call
 * screen to the call-summary screen. Not persisted — only lives for the
 * current app session.
 */

import type { TranscriptLine } from '@/hooks/useMockCallSimulation'
import type { MOCK_EXTRACTED_DATA } from '@/hooks/useMockCallSimulation'

export interface MockCallResult {
  contactId: string
  contactName: string
  duration: number
  transcript: TranscriptLine[]
  extractedData: typeof MOCK_EXTRACTED_DATA
}

const store = new Map<string, MockCallResult>()

export function setMockCallResult(callId: string, result: MockCallResult): void {
  store.set(callId, result)
}

export function getMockCallResult(callId: string): MockCallResult | undefined {
  return store.get(callId)
}

export function clearMockCallResult(callId: string): void {
  store.delete(callId)
}
