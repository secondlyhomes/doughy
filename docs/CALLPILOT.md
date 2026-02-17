# CallPilot — Server Architecture

> Call coaching platform powered by AI. Real estate investors get pre-call briefings, live coaching cards, and post-call summaries. Supports both human calls and autonomous AI calls (Bland AI).

## Architecture

```
callpilot/ (Expo app)           openclaw-server/src/callpilot/
├── services/                   ├── routes.ts         (16 endpoints)
│   ├── contactsService.ts  ──→ │   crm.contacts via Supabase JS
│   ├── briefsService.ts    ──→ │ engines.ts          (3 AI engines)
│   ├── callsService.ts     ──→ │   routes.ts         (/api/calls/*)
│   └── callpilotApi.ts         │ db.ts               (cpQuery/Insert/Update)
└── supabaseClient.ts           ├── voice.ts          (Twilio outbound calls)
                                ├── session.ts        (coaching intervals + post-call pipeline)
                                └── transcription.ts  (Deepgram speech-to-text)
```

## Server Endpoints (`/api/calls/*`)

All endpoints require JWT auth via `Authorization: Bearer <token>` header.

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/` | List calls for authenticated user |
| `POST` | `/pre-call` | Generate AI pre-call briefing + create call record |
| `POST` | `/:id/start` | Mark call as in-progress, start coaching session |
| `POST` | `/:id/end` | End call: stop coaching, transcribe, summarize, create Claw task |
| `POST` | `/:id/connect` | Initiate outbound voice call via Twilio |
| `GET` | `/:id/coaching` | Get coaching cards (supports `since_ms` for polling) |
| `POST` | `/:id/coaching` | Generate a new coaching card on demand |
| `POST` | `/:id/coaching/:cardId/dismiss` | Dismiss a coaching card |
| `GET` | `/:id/summary` | Get post-call summary + action items |
| `POST` | `/:id/actions/:actionId/approve` | Approve a post-call action item |
| `POST` | `/:id/actions/:actionId/dismiss` | Dismiss a post-call action item |
| `GET` | `/:id/session` | Get active session info (elapsed, phase, coaching count) |
| `GET` | `/:id/transcript` | Get transcript chunks + full text |
| `POST` | `/:id/transcribe` | Trigger Deepgram transcription for a completed call |
| `GET` | `/templates` | List script templates for user (module-filtered) |

### Voice Webhooks (no auth — Twilio signature validation)

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/webhooks/voice/status` | Twilio call status callback (ringing/in-progress/completed/failed) |
| `POST` | `/webhooks/voice/recording` | Twilio recording available callback |

## AI Engines (`engines.ts`)

### Pre-Call Briefing (Claude Sonnet)
- Gathers context: `crm.contacts`, `investor.deals_pipeline`, `investor.follow_ups`, `callpilot.script_templates`, `callpilot.user_profiles`
- Produces JSON: lead_name, talking_points, opening_script, questions_to_ask, warnings
- Saved to `callpilot.pre_call_briefings`
- Module-aware: script templates filtered by contact's `module` field

### Live Coaching (Claude Haiku)
- Runs every ~25 seconds during active call via `session.ts` interval
- Phase-aware: opening (0-60s), rapport (60-180s), discovery (180-360s), negotiation (360-600s), closing (600s+)
- Loads pre-call briefing + existing cards + recent transcript to avoid repetition
- Outputs: card_type (suggestion/question/warning/objection_handler/closing), content, priority
- Saved to `callpilot.coaching_cards`

### Post-Call Summary (Claude Sonnet)
- Aggregates: call record, briefing, coaching cards, questions, transcript
- Produces: summary, sentiment, key_points, lead_temperature, action_items
- Saved to `callpilot.call_summaries` + `callpilot.action_items`
- Updates call status to `completed`

## Voice Integration (`voice.ts`)

Twilio REST API for outbound calls:
1. `initiateOutboundCall(callId, toPhone)` — Creates Twilio call with TwiML (connecting message + Dial with recording)
2. Status callback updates call record: ringing -> in_progress -> completed/failed
3. Recording callback stores URL + SID for later transcription
4. Machine detection enabled to identify voicemail

## Call Session Manager (`session.ts`)

In-memory session tracking for active calls:
1. `startCallSession(callId, userId)` — Begins coaching card generation every 25s
2. Coaching interval: determines call phase, gets recent transcript, generates card via AI
3. `endCallSession(callId, userId)` — Full post-call pipeline:
   - Stop coaching interval
   - Transcribe recording via Deepgram (if available)
   - Generate post-call summary via Claude Sonnet
   - Create `claw.tasks` entry for integration loop (call_completed type)
4. `getSessionInfo(callId)` — Returns elapsed time, phase, coaching count

## Transcription (`transcription.ts`)

Deepgram Nova-2 REST API with speaker diarization:
1. `transcribeRecording(callId, recordingUrl)` — Sends Twilio recording URL to Deepgram
2. Deepgram returns utterances with speaker labels (speaker 0 = agent, speaker 1 = contact)
3. Each utterance stored as `callpilot.transcript_chunks` row
4. Fallback: if no utterances, stores full transcript as single chunk
5. Updates `calls.transcription_status` and `transcript_chunk_count`
6. `getCallTranscript(callId)` — Returns full text with `[AGENT]/[CONTACT]` labels

Config: `DEEPGRAM_API_KEY` in server .env

## Database Schema (`callpilot.*`)

| Table | Purpose |
|-------|---------|
| `calls` | Call records (twilio_call_sid, caller_type, bland_call_id, status, duration, recording_url, transcription_status) |
| `transcript_chunks` | Real-time transcript segments (speaker, text, timestamp_ms, confidence) |
| `coaching_cards` | AI coaching cards shown during calls |
| `question_tracking` | Required questions and whether they were asked |
| `call_summaries` | Post-call AI analysis |
| `action_items` | Follow-up tasks generated from calls |
| `pre_call_briefings` | Cached AI briefings (JSONB content) |
| `user_profiles` | Investor preferences, buying criteria |
| `script_templates` | Call scripts by module (investor/landlord) and caller_type (human/ai_bland) |
| `suggested_updates` | AI-suggested CRM updates based on call outcomes |

All tables have RLS enabled with `auth.uid() = user_id` policies.

### Key Columns on `calls`
- `caller_type`: `human` (default) | `ai_bland` — distinguishes manual vs autonomous calls
- `bland_call_id`: Bland AI's call UUID for webhook correlation
- `transcription_status`: `pending` | `completed` | `failed`
- `transcript_chunk_count`: Number of transcript chunks stored

## Module Separation

Contacts and script templates are tagged with a `module` field:
- `investor` — property sellers, deal leads, acquisition targets
- `landlord` — tenants, guests, rental contacts

The pre-call briefing engine filters script templates by the contact's module to provide contextually appropriate call scripts.

## Data Flow

### Human Call (via CallPilot app)
```
1. User selects contact in CallPilot app
2. App queries crm.contacts via Supabase JS (module-filtered)
3. User taps "Pre-Call Brief"
4. App calls POST /api/calls/pre-call with contact_id
5. Server queries CRM + deals + follow-ups + scripts
6. Claude Sonnet generates structured briefing
7. Briefing saved to callpilot.pre_call_briefings
8. Response returned to app -> displayed on screen
9. User taps "Start Call" -> POST /:id/start -> coaching begins (25s intervals)
10. [Optional] POST /:id/connect -> Twilio outbound call
11. During call: GET /:id/coaching?since_ms=... polls for new cards
12. User ends call -> POST /:id/end -> transcription + summary + Claw task
13. POST /:id/summary -> AI-generated summary with action items
```

### AI Call (via Bland AI — Phase 2)
```
1. The Claw scheduler identifies warm/cold leads needing follow-up
2. Server calls Bland AI REST API with script + lead context
3. Bland makes call via BYOT Twilio number
4. Call completes -> Bland webhook -> POST /webhooks/bland/completed
5. Server creates callpilot.calls record (caller_type: 'ai_bland')
6. Transcript + outcome stored, claw.tasks entry created
7. Lead temperature updated based on outcome
8. Cost logged to claw.cost_log
```

## CallPilot App Services

### contactsService.ts
- Queries `crm.contacts` via Supabase JS client (`.schema('crm')`)
- Maps CRM fields to CallPilot `Contact` type via `mapCrmToContact()`
- Falls back to mock data when `isMockMode === true`
- Supports module filtering: `getContacts('investor')` or `getContacts('landlord')`

### briefsService.ts
- Cache-first: checks `callpilot.pre_call_briefings` for recent (<24h) briefing
- If no cache hit, calls `generateBrief()` -> `POST /api/calls/pre-call`
- Maps server response to `PreCallBrief` type

### callpilotApi.ts
- Authenticated fetch wrapper (`callsFetch<T>()`)
- Gets JWT from Supabase Auth session
- 401 retry with `refreshSession()`
- Base URL: `EXPO_PUBLIC_CALLPILOT_API_URL` or `https://openclaw.doughy.app/api/calls`

## Integration with The Claw

When a call ends (`endCallSession`), a task is created in `claw.tasks`:
- Type: `call_completed`
- Includes sentiment, lead temperature, action item count
- The Claw's next briefing includes: "Call with [contact] completed — N action items pending"
- Follow-up nudges can reference call outcomes
