# Voice AI Features - Future Roadmap

**Status:** 📋 Planned
**Last Updated:** 2026-01-14
**Priority:** Medium (revisit when ready to reduce manual data entry)

## Vision

Enable AI-powered voice and text input for property walkthroughs and seller conversations, automatically extracting structured deal data to reduce manual entry time by 50%+.

## Core Concept

Users can record property walkthroughs or paste conversation transcripts, and AI will:
1. **Transcribe** audio (if applicable) using OpenAI Whisper
2. **Extract** structured data (bedrooms, repair costs, seller motivation, etc.) using Claude
3. **Auto-fill** deal/property forms with confidence-based highlighting
4. **Identify gaps** and suggest follow-up questions to complete the deal

## Feature Set

### 1. Manual Transcript Mode (Quick Win - Build First)
Users paste transcripts from external sources (call recordings, voice memos, notes) and AI extracts structured data.

**Use Cases:**
- External call recorder transcripts (legal compliance)
- Typed notes from conversations
- Voice memos from phone's native app
- Testing the extraction pipeline

**Why Build First:**
- Fastest path to value (no audio processing complexity)
- Tests extraction pipeline independently
- Provides immediate user feedback on AI accuracy
- Foundation for voice recording features

### 2. Continuous Walkthrough Recording (Core Feature)
Real-time voice recording during property walkthroughs with AI transcription and extraction.

**Use Cases:**
- On-site property walkthroughs
- Recording property condition details
- Capturing repair estimates
- Documenting seller conversations

**Tech:**
- Already have `expo-av` integration and `useVoiceRecording` hook
- Extend existing `FieldModeScreen` with recording mode toggle
- Process via Whisper API → Claude extraction → Review modal

### 3. Phone Call Recording (Future Enhancement)
In-app dialer with automatic recording and extraction for seller calls.

**Deferred Because:**
- More complex (legal, technical, iOS limitations)
- In-app dialer changes user workflow significantly
- Can use external call recorders + manual transcript mode instead

**Potential Integration:**
- Bland.ai for conversational AI during calls
- Twilio for call infrastructure

## Implementation Approach (When Ready)

### Phase 1: Foundation - Manual Transcript Mode (3 days)

**Backend:**
- `supabase/functions/extract-walkthrough-data/index.ts` - Claude API extraction
- Database table: `walkthrough_extractions`

**Type Definitions:**
```typescript
interface WalkthroughExtractionData {
  property_details: {
    bedrooms?: number;
    bathrooms?: number;
    square_feet?: number;
    year_built?: number;
    lot_size?: number;
    confidence: 'high' | 'medium' | 'low';
  };
  repair_items: Array<{
    description: string;
    category: string;
    estimated_cost?: number;
    confidence: 'high' | 'medium' | 'low';
  }>;
  condition_notes: string[];
  mortgage_details?: {
    balance?: number;
    monthly_payment?: number;
    behind_payments?: boolean;
  };
  seller_motivation: {
    signals: string[];
    urgency: 'low' | 'medium' | 'high';
  };
  missing_info: string[];
  follow_up_suggestions: string[];
}
```

**UI:**
- `src/features/field-mode/components/ManualTranscriptInput.tsx` - Text area + "Extract Data" button
- Add "Manual Transcript" tab to `FieldModeScreen`

### Phase 2: Extraction Review & Auto-Fill (3 days)

**Components:**
- `ExtractionReviewModal.tsx` - Shows extracted fields with confidence colors
- `GapAnalysisPanel.tsx` - Three sections:
  - ✅ **Captured Information**: Fields successfully extracted
  - ⚠️ **Missing Information**: Required fields still empty
  - 📋 **Follow-up Questions**: AI-generated + rule-based suggestions

**Example Gap Analysis Output:**
```
✅ Captured: Bedrooms (3), Bathrooms (2), Kitchen repair ($15K)

⚠️ Missing:
- Square footage (Required for accurate valuation)
- Mortgage balance (Mentioned seller is behind on payments)
- Year built (High priority)

📋 Follow-up Questions:
- "What's the approximate square footage?"
- "How much is owed on the current mortgage?"
- "When was the house built?"
```

**Auto-Fill UX:**
- Fields highlighted based on confidence (green=high, yellow=medium, orange=low)
- Banner above field: "AI extracted: 3 bedrooms [Accept] [Reject]"
- User selects which fields to apply → Updates property/deal

### Phase 3: Continuous Recording Mode (3 days)

**Backend:**
- `supabase/functions/transcribe-audio/index.ts` - OpenAI Whisper integration
- Follow pattern from existing `supabase/functions/openai/index.ts`

**UI:**
- `ContinuousRecordingPanel.tsx` - Large START/STOP button, timer, pause/resume
- Add recording mode toggle to `FieldModeScreen`:
  - **Bucket Mode** (existing photo-based workflow)
  - **Walkthrough Mode** (continuous recording)

**AI Job Integration:**
- Add job types: `transcribe_walkthrough`, `extract_walkthrough_data`
- Processing flow:
  1. User stops recording → Audio saved to Supabase Storage
  2. AI job created → Progress modal (Uploading → Transcribing → Extracting)
  3. Completion → `ExtractionReviewModal` opens

**Performance:**
- 30-60 seconds to transcribe 5-minute recording
- 10-20 seconds for extraction
- <60 seconds total processing time

### Phase 4: Testing & Polish (1 day)

**Test Scenarios:**
- Manual transcript with complete/partial property details
- Continuous recording in quiet/noisy environments
- Short (<10s) and long (>10min) recordings
- Contradictory information handling
- Network failures and retry logic

**Success Metrics:**
- 90%+ transcription accuracy on clear audio
- 70%+ extraction accuracy for property details
- <60 seconds processing time for 5-minute recording
- Zero data loss (recordings saved even if processing fails)

## Technical Architecture

### Extraction Pipeline
```
User Input (Voice/Text)
    ↓
Transcription (Whisper API - if voice)
    ↓
Structured Extraction (Claude API)
    ↓
Confidence Scoring & Validation
    ↓
Storage (walkthrough_extractions table)
    ↓
Review UI (ExtractionReviewModal)
    ↓
Auto-Fill with Verification
    ↓
Apply to Property/Deal
```

### Gap Analysis Logic

**Rule-Based Detection:**
- Check required fields (bedrooms, bathrooms, square_feet, year_built)
- Cross-reference mentions in transcript vs actual data
- Identify contradictions

**AI-Generated Suggestions:**
- Analyze seller motivation for strategic questions
- Compare property details to market norms
- Flag inconsistencies ("Recently renovated" but extensive repairs needed)

## Database Schema

**New Table: `walkthrough_extractions`**
```sql
CREATE TABLE walkthrough_extractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  walkthrough_id UUID REFERENCES walkthroughs(id),
  voice_memo_id UUID REFERENCES walkthrough_items(id) NULL,
  transcript TEXT NOT NULL,
  extraction_json JSONB NOT NULL,
  review_status TEXT CHECK (review_status IN ('pending', 'reviewed', 'applied')),
  applied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Extend Table: `walkthrough_items`**
```sql
ALTER TABLE walkthrough_items
ADD COLUMN extraction_id UUID REFERENCES walkthrough_extractions(id);
```

## Critical Files to Modify

### Backend
1. `supabase/functions/extract-walkthrough-data/index.ts` (new) - Claude extraction
2. `supabase/functions/transcribe-audio/index.ts` (new) - Whisper transcription

### Frontend Core
3. `src/features/field-mode/screens/FieldModeScreen.tsx` - Add modes and tabs
4. `src/features/field-mode/hooks/useWalkthrough.ts` - Extraction state management
5. `src/features/deals/types/index.ts` - Add WalkthroughExtraction interface

### UI Components (New)
6. `src/features/field-mode/components/ManualTranscriptInput.tsx`
7. `src/features/field-mode/components/ContinuousRecordingPanel.tsx`
8. `src/features/field-mode/components/ExtractionReviewModal.tsx`
9. `src/features/field-mode/components/GapAnalysisPanel.tsx`

### Services & Utilities (New)
10. `src/features/field-mode/services/walkthroughExtractionService.ts`
11. `src/features/field-mode/utils/gapAnalysis.ts`

## User Experience Flows

### Manual Transcript Flow
1. User taps "Manual Transcript" in FieldModeScreen
2. Pastes transcript from external source
3. Taps "Extract Data" → Processing (10-20 seconds)
4. ExtractionReviewModal opens with extracted fields and gap analysis
5. User selects fields to apply
6. Taps "Apply Selected" → Property/Deal updated
7. Success message: "Applied 5 fields, 3 still missing"

### Continuous Recording Flow
1. User switches to "Walkthrough Mode" in FieldModeScreen
2. Taps large START button → Recording begins
3. Walks through property describing features
4. Taps STOP → Processing modal with progress
5. ExtractionReviewModal opens
6. Review → Apply → Done

## Error Handling Strategy

### Transcription Failures
- Audio too large → Chunk into 10-minute segments
- Rate limit → Queue for retry with 60-second delay
- Low quality → Save audio without transcript, allow manual transcript input

### Extraction Validation
- Impossible values → Flag for review (e.g., 50 bedrooms)
- Contradictions → Highlight in UI with warning
- Low confidence (<50%) → Don't auto-fill, show as suggestion only

### Network Issues
- Save all recordings locally first
- Background sync when connection restored
- Progress persisted across app restarts

## Privacy & Security

**Audio Storage:**
- Supabase private bucket with Row Level Security
- Auto-delete after 90 days (configurable)
- Encrypted at rest

**Transcripts:**
- Disclaimer: "AI-generated, verify accuracy"
- Auto-redact sensitive info (SSN, credit cards) if detected

**Audit Trail:**
- Log all extraction applications (user_id, timestamp, fields_applied)
- Allow reverting auto-applied data
- Evidence trail with `source="ai_extraction"`

## Future Enhancements (Post-MVP)

### Real-Time Features
- Live transcription during recording (AssemblyAI/Deepgram)
- Show transcript as user speaks
- Real-time extraction hints ("Just captured: 3 bedrooms")

### Multi-Modal Extraction
- Combine voice + photos for context
  - "This kitchen needs new cabinets" + kitchen photo → Higher confidence
- OCR on photos (HVAC model numbers, permit stickers)

### Conversational AI
- AI asks follow-up questions based on gaps
  - Voice: "I noticed you mentioned 3 bedrooms but didn't specify bathrooms. How many bathrooms?"
- Voice-to-voice interaction (Bland.ai integration)

### Phone Call Integration
- In-app dialer with automatic recording
- Bland.ai conversational AI for seller calls
- Call summary generation
- CRM-style call logging

## Timeline Estimate

- **Phase 1 (Manual Transcript):** 3 days
- **Phase 2 (Review & Auto-Fill):** 3 days
- **Phase 3 (Continuous Recording):** 3 days
- **Phase 4 (Testing & Polish):** 1 day

**Total:** 10 days for full MVP

## Risk Considerations

### Risk 1: Poor Transcription Quality
**Mitigation:** Provide audio quality indicator, allow re-recording, fall back to manual entry

### Risk 2: Over-reliance on AI Extraction
**Mitigation:** Always show confidence scores, require verification for low-confidence extractions

### Risk 3: Complex Property Descriptions
**Mitigation:** Train on real-world examples, handle multi-unit properties, clarify with follow-ups

### Risk 4: API Cost Overruns
**Mitigation:** Rate limit recordings, compress audio, cache transcriptions, monitor costs

## Why This Approach

✅ **Manual transcript first** - Fastest value, tests extraction without audio complexity
✅ **Post-recording transcription** - Simpler than real-time, works with expo-av
✅ **Claude for extraction** - Superior structured output, existing integration
✅ **Auto-fill with review** - Balances speed with accuracy
✅ **Gap analysis** - Ensures users don't miss critical information
✅ **Modular architecture** - Easy to add phone call recording later

## When to Revisit

**Good Time to Build:**
- Users complain about manual data entry being tedious
- Deals are being lost due to incomplete property information
- Team wants to scale without hiring more data entry support

**Prerequisites:**
- OpenAI API key configured (for Whisper)
- Anthropic API key configured (for Claude extraction)
- Comfortable with AI job processing system
- Field mode walkthrough feature is being actively used

**Decision Criteria:**
- Expected time savings > 2 hours/week per user
- At least 10 deals per month where property details are incomplete
- Users willing to record/transcribe conversations

## Notes from Planning Session

- User is interested in this feature but not ready to implement yet
- Brainstormed three modes: manual transcript, walkthrough recording, phone call recording
- Decided on phased approach: manual transcript → walkthrough → phone calls
- Key insight: Manual transcript mode provides quick win and tests extraction pipeline
- Existing tech stack already supports this (expo-av, OpenAI integration, Claude API)
- Can leverage existing FieldModeScreen and walkthrough infrastructure
