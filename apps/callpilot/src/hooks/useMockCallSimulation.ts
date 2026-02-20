/**
 * Mock Call Simulation Hook
 *
 * Simulates a live call with transcript segments appearing over time.
 * Used for demo purposes — feeds transcript lines and AI suggestions
 * on a timed interval to simulate a real investor call.
 */

import { useState, useEffect, useRef } from 'react'

export interface TranscriptLine {
  id: string
  speaker: 'user' | 'contact'
  text: string
  timestamp: number // seconds into call
}

export interface AISuggestion {
  id: string
  type: 'question' | 'info' | 'action' | 'response'
  text: string
  confidence: number
  appearsAtLine: number // show after this transcript line index
}

// Simulates a typical real estate investor call
const MOCK_TRANSCRIPT_SEGMENTS: Array<{ speaker: 'user' | 'contact'; text: string }> = [
  { speaker: 'user', text: "Hi, this is calling about the property on Oak Street. Is this the owner?" },
  { speaker: 'contact', text: "Yes, this is John. I got your letter about buying my house." },
  { speaker: 'user', text: "Great! I'm an investor in the area. Can you tell me a bit about the property?" },
  { speaker: 'contact', text: "Sure, it's a 3 bed, 2 bath. About 1,500 square feet. Built in 1985." },
  { speaker: 'user', text: "And what's your situation? Are you looking to sell quickly?" },
  { speaker: 'contact', text: "Yeah, I inherited it from my mom. I live out of state and just want to get it off my hands." },
  { speaker: 'user', text: "I understand. What kind of price were you hoping for?" },
  { speaker: 'contact', text: "I was thinking around 180,000, but I'm flexible. It needs some work." },
  { speaker: 'user', text: "What kind of repairs does it need?" },
  { speaker: 'contact', text: "The roof is about 15 years old, kitchen is outdated, and there's some foundation issues." },
  { speaker: 'user', text: "Got it. Would you be open to a cash offer with a quick close, maybe 2-3 weeks?" },
  { speaker: 'contact', text: "That sounds perfect actually. When can you come look at it?" },
]

const MOCK_AI_SUGGESTIONS: AISuggestion[] = [
  // After line 3: contact says "3 bed, 2 bath, 1500 sqft, built 1985"
  { id: 'sug-1', type: 'info', text: "1985 build — check for lead paint, asbestos. FHA loans may require remediation.", confidence: 0.82, appearsAtLine: 3 },
  // After line 5: contact says "inherited from mom, out of state, wants it off hands"
  { id: 'sug-2', type: 'info', text: "Inherited + out-of-state = highly motivated seller. Likely flexible on price and timeline.", confidence: 0.92, appearsAtLine: 5 },
  { id: 'sug-3', type: 'question', text: "Ask about their closing timeline — inherited properties often have estate or tax deadlines.", confidence: 0.85, appearsAtLine: 5 },
  // After line 7: contact says "$180k, flexible, needs work"
  { id: 'sug-4', type: 'response', text: "Acknowledge flexibility: 'I appreciate you being upfront about the price and condition.'", confidence: 0.78, appearsAtLine: 7 },
  // After line 9: contact says "roof 15 years, kitchen outdated, foundation issues"
  { id: 'sug-5', type: 'info', text: "Three major repairs = strong leverage. Estimate $35-50k rehab. Counter well below $180k.", confidence: 0.90, appearsAtLine: 9 },
  // After line 11: contact says "sounds perfect, when can you look?"
  { id: 'sug-6', type: 'action', text: "Schedule property walkthrough within 48 hours while motivation is high.", confidence: 0.88, appearsAtLine: 11 },
]

/** Post-call extracted data for CRM push */
export const MOCK_EXTRACTED_DATA = {
  contact: {
    name: "John",
    relationship: "Property owner (inherited)",
    location: "Out of state",
  },
  property: {
    address: "Oak Street",
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1500,
    yearBuilt: 1985,
    condition: "Needs work",
    repairs: ["Roof (15 years old)", "Kitchen outdated", "Foundation issues"],
  },
  deal: {
    askingPrice: 180000,
    motivation: "Inherited, lives out of state, wants quick sale",
    timeline: "Flexible, prefers quick close (2-3 weeks)",
    sellerFlexibility: "High — said 'flexible' on price",
  },
  suggestedActions: [
    { action: "Schedule property walkthrough", priority: "high" as const },
    { action: "Run comps for Oak Street area", priority: "high" as const },
    { action: "Prepare cash offer around $150-160k", priority: "medium" as const },
  ],
}

export interface UseMockCallSimulationReturn {
  transcript: TranscriptLine[]
  suggestions: AISuggestion[]
  isSimulating: boolean
  isComplete: boolean
  extractedData: typeof MOCK_EXTRACTED_DATA
}

/**
 * Hook that simulates a live call with transcript appearing over time
 */
export function useMockCallSimulation(
  enabled: boolean = true,
  intervalMs: number = 3000
): UseMockCallSimulationReturn {
  const [transcript, setTranscript] = useState<TranscriptLine[]>([])
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([])
  const [isComplete, setIsComplete] = useState(false)
  const lineIndexRef = useRef(0)
  const startTimeRef = useRef(Date.now())

  useEffect(() => {
    if (!enabled) return

    lineIndexRef.current = 0
    startTimeRef.current = Date.now()
    setTranscript([])
    setSuggestions([])
    setIsComplete(false)

    const interval = setInterval(() => {
      const idx = lineIndexRef.current
      if (idx >= MOCK_TRANSCRIPT_SEGMENTS.length) {
        setIsComplete(true)
        clearInterval(interval)
        return
      }

      const segment = MOCK_TRANSCRIPT_SEGMENTS[idx]
      if (!segment) return
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)

      setTranscript(prev => [
        ...prev,
        {
          id: `line-${idx}`,
          speaker: segment.speaker,
          text: segment.text,
          timestamp: elapsed,
        },
      ])

      // Check if any suggestions should appear at this line
      const newSuggestions = MOCK_AI_SUGGESTIONS.filter(s => s.appearsAtLine === idx)
      if (newSuggestions.length > 0) {
        setSuggestions(prev => [...prev, ...newSuggestions])
      }

      lineIndexRef.current = idx + 1
    }, intervalMs)

    return () => clearInterval(interval)
  }, [enabled, intervalMs])

  return {
    transcript,
    suggestions,
    isSimulating: enabled && !isComplete,
    isComplete,
    extractedData: MOCK_EXTRACTED_DATA,
  }
}
