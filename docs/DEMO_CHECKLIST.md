# Demo Runsheet — Friday Feb 20

> Open this on your phone/laptop and check off as you go.
> All 3 apps on physical iOS device, server at `openclaw.doughy.app`.

---

## Pre-Demo Setup (30 min before)

- [ ] `curl https://openclaw.doughy.app/health` — server is up
- [ ] Verify `.env` in all 3 apps has staging Supabase URL + anon key
- [ ] Verify `CLAW_PHONE_USER_MAP` on server has your phone number mapped
- [ ] Verify Twilio webhook → `https://openclaw.doughy.app/webhooks/sms`
- [ ] Run `node scripts/demo-seed.js verify` — seed if needed (`create`)
- [ ] Open all 3 apps, sign in with `admin@doughy.app` / `testdev123!`
- [ ] Quick smoke test: text "Brief me" from your mapped phone → get SMS briefing back

---

## Demo Flow

### Act 1: Doughy (Investor/Landlord Platform) — 5 min

**Investor Mode:**
- [ ] Leads tab — show lead list loading from real DB
- [ ] Tap a lead → detail screen (contact info, deal link, notes)
- [ ] Properties tab — show investor properties
- [ ] Deals tab — pipeline view with stages
- [ ] Switch to Settings → show mode toggle

**Landlord Mode:**
- [ ] People tab — contacts filtered to landlord module
- [ ] Properties tab — rental properties with hub grid
- [ ] Bookings tab — upcoming bookings
- [ ] Tap a property → detail with glass cards (financials, listings)

**Talking point:** "Everything here is live Supabase — 170 tables, 7 schemas, RLS on every table."

---

### Act 2: The Claw (AI Agent Control Panel) — 5 min

- [ ] Show Queue — pending approvals from AI agents
- [ ] Approve one action → haptic feedback, item removed
- [ ] Show Connections — Gmail, Twilio, Discord status cards
- [ ] Show Activity Log — real cost tracking
- [ ] Show Trust Levels — 4 tiers controlling agent autonomy
- [ ] **Live demo:** Text your Twilio number: `VENDOR: I can fix the toilet at 2pm tomorrow`
  - [ ] Wait 5-10 sec → new approval appears in Queue (Realtime)
  - [ ] Show the draft message the AI composed
  - [ ] Approve or deny it

**Talking point:** "The AI never sends anything without approval. The Claw is the human-in-the-loop."

---

### Act 3: CallPilot (Communication Companion) — 10 min

**Contacts + Briefing:**
- [ ] Contacts tab — real contacts from `crm.contacts`
- [ ] Tap a contact → detail screen with module-specific info
- [ ] Tap "Pre-Call Brief" → AI-generated briefing loads

**Messaging (newly wired):**
- [ ] Messages tab → inbox shows real conversations from `crm.messages`
- [ ] Tap a contact → conversation thread loads real message history
- [ ] Type a message → tap Send → verify it sends (no "Coming Soon" alert)
- [ ] Check Supabase `crm.messages` → new row appears
- [ ] If Claw suggestion card visible → tap Send → AI draft sent + approved in DB

**Live SMS loop:**
- [ ] Text your Twilio number: `TENANT: The kitchen sink is leaking, can someone come look?`
- [ ] Wait 5-10 sec → Claw suggestion card appears above compose bar (Realtime)
- [ ] Review AI-drafted reply → tap Send → message delivered via Twilio
- [ ] **Cross-app:** Switch to The Claw → see the action logged in Activity

**Call Transcript:**
- [ ] Open a completed call → tap "View Transcript"
- [ ] Transcript loads from server (or graceful empty state if no transcript data)

**CRM Push:**
- [ ] Open a call summary screen
- [ ] Show extracted fields (property info, lead info from call)
- [ ] Tap "Approve" on a field → pushed to real CRM table
- [ ] Tap "Approve All" → batch push, screen shows "Synced to CRM"

**Talking point:** "CallPilot captures what you say on calls, extracts CRM data, and pushes it back — no manual data entry."

---

### Act 4: Cross-System Story (Tie It Together) — 2 min

- [ ] "A tenant texts about a leaky sink" → message appears in CallPilot
- [ ] "The AI drafts a reply" → Claw suggestion card in CallPilot
- [ ] "The reply needs approval" → The Claw shows it in Queue
- [ ] "You approve, it sends" → Twilio delivers the SMS
- [ ] "The interaction is logged" → Doughy has the contact record updated
- [ ] "All three apps, one backend, humans in control"

---

## Fallback Plans

| If this fails... | Do this instead... |
|-------------------|--------------------|
| Server is down | Show Doughy (fully local Supabase) + explain server architecture |
| SMS doesn't arrive | Use demo prefix from your own phone, or show seeded conversation data |
| Transcript empty | Expected — explain it needs a real call recording to populate |
| CRM push fails | Show the UI flow with mock data, explain the server endpoint |
| CallPilot in mock mode | Verify `.env` has `EXPO_PUBLIC_SUPABASE_URL` set |

---

## Don't Demo (Out of Scope)

- Voice memo recording (needs Deepgram)
- Active call coaching screen (WebRTC)
- Contact create/update from CallPilot
- Gmail OAuth flow (works but takes 60 sec, not visual)
- Admin seeding tools
