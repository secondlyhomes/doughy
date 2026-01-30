// src/features/voip/config.ts
// VoIP feature configuration
// Easy toggle between dev mock mode and production

/**
 * VoIP Configuration
 *
 * Set VOIP_DEV_MODE to control behavior:
 * - true: Uses mock data, no backend calls, simulated call flow
 * - false: Real Twilio integration, database persistence
 *
 * In production builds, this is always false regardless of setting.
 */
export const VOIP_CONFIG = {
  // Set to false when Twilio is integrated and ready for real calls
  DEV_MODE: __DEV__ ? true : false,

  // Simulation settings (only used when DEV_MODE is true)
  simulation: {
    // Delay before call "connects" (ms)
    connectionDelay: 2000,
    // Delay before ringing starts (ms)
    ringDelay: 500,
    // Enable mock transcript during calls
    enableMockTranscript: true,
    // Interval for mock transcript segments (ms)
    transcriptInterval: 3000,
    // Enable mock AI suggestions
    enableMockSuggestions: true,
  },

  // Feature flags
  features: {
    // Show post-call summary screen
    showPostCallSummary: true,
    // Enable smart extraction (AI fills in lead/property fields)
    enableSmartExtraction: true,
    // Require user confirmation before applying extracted data
    requireExtractionConfirmation: true,
    // Save call history to inbox
    saveToInbox: true,
  },
} as const;

/**
 * Check if we're in dev/mock mode
 */
export function isVoipDevMode(): boolean {
  return VOIP_CONFIG.DEV_MODE;
}

/**
 * Mock transcript segments for dev simulation
 * Simulates a typical real estate investor call
 */
export const MOCK_TRANSCRIPT_SEGMENTS = [
  { speaker: 'user' as const, text: "Hi, this is calling about the property on Oak Street. Is this the owner?" },
  { speaker: 'contact' as const, text: "Yes, this is John. I got your letter about buying my house." },
  { speaker: 'user' as const, text: "Great! I'm an investor in the area. Can you tell me a bit about the property?" },
  { speaker: 'contact' as const, text: "Sure, it's a 3 bed, 2 bath. About 1,500 square feet. Built in 1985." },
  { speaker: 'user' as const, text: "And what's your situation? Are you looking to sell quickly?" },
  { speaker: 'contact' as const, text: "Yeah, I inherited it from my mom. I live out of state and just want to get it off my hands." },
  { speaker: 'user' as const, text: "I understand. What kind of price were you hoping for?" },
  { speaker: 'contact' as const, text: "I was thinking around 180,000, but I'm flexible. It needs some work." },
  { speaker: 'user' as const, text: "What kind of repairs does it need?" },
  { speaker: 'contact' as const, text: "The roof is about 15 years old, kitchen is outdated, and there's some foundation issues." },
  { speaker: 'user' as const, text: "Got it. Would you be open to a cash offer with a quick close, maybe 2-3 weeks?" },
  { speaker: 'contact' as const, text: "That sounds perfect actually. When can you come look at it?" },
];

/**
 * Mock AI suggestions for dev simulation
 */
export const MOCK_AI_SUGGESTIONS = [
  { type: 'question' as const, text: "Ask about the timeline - when do they need to close?", confidence: 0.85 },
  { type: 'info' as const, text: "Inherited property = motivated seller. Likely flexible on price.", confidence: 0.92 },
  { type: 'action' as const, text: "Schedule property walkthrough within 48 hours", confidence: 0.88 },
  { type: 'response' as const, text: "Acknowledge their situation: 'I understand dealing with inherited property can be stressful'", confidence: 0.78 },
];

/**
 * Mock extracted data from a call (for smart extraction demo)
 */
export const MOCK_EXTRACTED_DATA = {
  contact: {
    name: "John",
    relationship: "Property owner (inherited)",
    location: "Out of state",
  },
  property: {
    address: "Oak Street", // Would be full address in real extraction
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
    sellerFlexibility: "High - said 'flexible' on price",
  },
  suggestedActions: [
    { action: "Schedule property walkthrough", priority: "high" },
    { action: "Run comps for Oak Street area", priority: "high" },
    { action: "Prepare cash offer around $150-160k", priority: "medium" },
  ],
};
