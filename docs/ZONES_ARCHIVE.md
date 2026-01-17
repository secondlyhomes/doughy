# Zone A-H Project Archive

**Purpose:** Historical record of the zone-based development phases (completed January 2026).

**Note:** This file consolidates documentation from 8 zone-specific files that were removed during codebase cleanup. For current system documentation, see [AI_ASSISTANT.md](./AI_ASSISTANT.md).

---

## Zone Summary

### Zone A & B: AI Assistant + Timeline Integration
**Status:** ✅ COMPLETED

**Key Deliverables:**
- AI Assistant UI with 3-tab interface (Actions, Ask, Jobs)
- Deal Events timeline system
- Focus Mode for reduced cognitive load
- PatchSet system for AI-proposed changes
- 12 action handlers in catalog
- Two-tier caching (97.5% faster responses)
- Context compression (87.5% token reduction)

**Key Files:**
- `src/features/assistant/hooks/useAssistantContext.ts` - Context system
- `src/features/deals/hooks/useDealEvents.ts` - Timeline events
- `src/features/assistant/hooks/useAIJobs.ts` - Background jobs
- `src/features/deals/components/DealTimeline.tsx` - Timeline UI

**Integration Points:**
- Zone A creates timeline events via `logDealEvent()`
- Zone B provides `useDealEvents`, `useFocusMode` hooks
- `ai_jobs` table for background processing
- `deal_events` table for timeline

---

### Zone E: Database Standardization
**Status:** ✅ COMPLETED

**Key Deliverables:**
- 35 tables renamed across 2 phases
- Zero-downtime migration using compatibility views
- DBA-approved naming conventions established

**Phase 1 (19 tables):**
- System & Infrastructure: `system_feature_flags`, `system_rate_limits`, `system_usage_logs`, etc.
- User & Auth: `user_mfa_pending_setup`, `user_mfa_recovery_codes`, `user_onboarding_status`, etc.
- Communications: `comms_messages`, `comms_scheduled_messages`
- Call/Voice: `call_logs`, `call_transcripts`, `call_transcript_segments`
- Assistant: `assistant_jobs` (was `ai_jobs`)

**Phase 2 (16 tables):**
- User Profile: `user_profiles` (was `profiles`)
- CRM: `crm_leads`, `crm_contacts`, `crm_lead_contacts`, `crm_lead_notes`
- Security: `security_oauth_tokens`, `security_api_keys`, `user_mfa_settings`
- Email: `comms_email_logs`, `user_email_preferences`, `security_email_change_history`
- Billing: `billing_stripe_customers`, `billing_stripe_products`, `billing_subscription_notifications`, `billing_subscription_events`
- Reminders: `user_reminder_logs`

**Key Decisions:**
- `deals` and `deal_events` kept as-is (no semantic drift per DBA review)
- Prefix = functional domain owner (system_, user_, crm_, etc.)
- Compatibility views allowed zero-downtime deployment

---

### Zone F: Frontend Code Updates
**Status:** ✅ 90% COMPLETE

**Key Deliverables:**
- All TypeScript updated to use new table names
- Compatibility views dropped (zero code dependencies)
- TypeScript types regenerated (1,319 lines of legacy types removed)

**Verification Commands:**
```bash
grep -r "\.from('profiles')" src --include="*.ts"     # 0 results
grep -r "\.from('user_profiles')" src --include="*.ts" # 17 results
grep -r "\.from('deals')" src --include="*.ts"         # 11 results (kept as-is)
```

**Remaining:** Test coverage for deal and CRM hooks

---

### Zone G: UX Improvements (Weeks 6-9)
**Status:** ✅ READY FOR REVIEW

**Key Deliverables:**

**Week 6 - Progressive Disclosure:**
- `MetricCard` component (3-state: collapsed, expanded, actionable)
- `EvidenceTrailModal` (shows data sources with override capability)

**Week 7 - Navigation:**
- `StageStepper` component (visual pipeline progress)
- `SmartBackButton` (context-aware back navigation)
- Tab bar badges for overdue deals

**Week 8 - Conversation Tracking:**
- `ConversationsView` (unified timeline of SMS, calls, voice memos)
- `VoiceMemoRecorder` (transcription, no audio storage)
- `CallLogger` (post-call logging sheet)
- `conversation_items` database table with AI analysis

**Week 9 - NBA Enhancements:**
- Enhanced `useNextAction` with walkthrough progress tracking
- `aiSuggestions` service for contextual recommendations
- `dealNotificationService` for push notifications

**Key Files:**
- `src/components/deals/MetricCard.tsx`
- `src/features/deals/components/StageStepper.tsx`
- `src/features/conversations/components/ConversationsView.tsx`
- `src/features/conversations/components/VoiceMemoRecorder.tsx`
- `src/features/deals/services/aiSuggestions.ts`

---

### Zone H: Code Cleanup
**Status:** ✅ COMPLETED

**Key Deliverables:**
- 21 ROLLBACK migrations archived to `_archived/` folder
- 4 dead files removed:
  - `AdminUsersScreen.tsx` (empty file)
  - `NotificationSettingsScreen.tsx` (duplicate)
  - Related barrel exports cleaned up
- Analysis scripts created for future use
- `docs/DEPRECATED_CODE.md` created

**Archived Migrations Location:** `supabase/migrations/_archived/`

**Analysis Scripts:**
- `scripts/find-unused-hooks.sh`
- `scripts/find-unused-components.sh`

---

## Database Table Rename Reference

### Phase 1 Renames (19 tables)

| Old Name | New Name | Domain |
|----------|----------|--------|
| `feature_flags` | `system_feature_flags` | System |
| `rate_limits` | `system_rate_limits` | System |
| `usage_logs` | `system_usage_logs` | System |
| `feature_usage_stats` | `analytics_feature_usage_stats` | Analytics |
| `scheduled_deletions` | `system_scheduled_deletions` | System |
| `mfa_pending_setup` | `user_mfa_pending_setup` | User |
| `mfa_recovery_codes` | `user_mfa_recovery_codes` | User |
| `reset_tokens` | `security_reset_tokens` | Security |
| `onboarding_status` | `user_onboarding_status` | User |
| `onboarding_steps` | `user_onboarding_steps` | User |
| `onboarding_surveys` | `user_onboarding_surveys` | User |
| `reminder_states` | `user_reminder_states` | User |
| `workspace` | `workspaces` | Workspace |
| `messages` | `comms_messages` | Communications |
| `scheduled_messages` | `comms_scheduled_messages` | Communications |
| `calls` | `call_logs` | Call |
| `transcripts` | `call_transcripts` | Call |
| `transcript_segments` | `call_transcript_segments` | Call |
| `ai_jobs` | `assistant_jobs` | Assistant |

### Phase 2 Renames (16 tables)

| Old Name | New Name | Domain |
|----------|----------|--------|
| `profiles` | `user_profiles` | User |
| `leads` | `crm_leads` | CRM |
| `contacts` | `crm_contacts` | CRM |
| `lead_contacts` | `crm_lead_contacts` | CRM |
| `lead_notes` | `crm_lead_notes` | CRM |
| `oauth_tokens` | `security_oauth_tokens` | Security |
| `api_keys` | `security_api_keys` | Security |
| `user_mfa` | `user_mfa_settings` | User |
| `email_logs` | `comms_email_logs` | Communications |
| `email_preferences` | `user_email_preferences` | User |
| `email_change_history` | `security_email_change_history` | Security |
| `stripe_customers` | `billing_stripe_customers` | Billing |
| `stripe_products` | `billing_stripe_products` | Billing |
| `subscription_notifications` | `billing_subscription_notifications` | Billing |
| `subscription_events` | `billing_subscription_events` | Billing |
| `reminder_logs` | `user_reminder_logs` | User |

### Tables Kept As-Is

| Table | Reason |
|-------|--------|
| `deals` | Clear entity name, no semantic drift |
| `deal_events` | Child of deals, follows naming pattern |

---

## Key Decisions Log

1. **deals/deal_events kept as-is** - DBA determined names are already clear entity names with no semantic drift. Renaming to `re_pipeline` rejected as it implies workflow rather than entity.

2. **DBA naming convention** - Prefix indicates functional domain owner:
   - `system_*` = internal platform config
   - `user_*` = user-specific state/settings
   - `crm_*` = CRM/lead management
   - `re_*` = Real Estate domain
   - `billing_*` = payments/subscriptions
   - `comms_*` = outbound messaging
   - `security_*` = security/audit data
   - `call_*` = call feature domain
   - `assistant_*` = AI product domain

3. **Conservative deletion approach** - Archive, don't delete:
   - ROLLBACK migrations kept in `_archived/` for reference
   - Unused hooks documented but not deleted (may be reused)
   - Only confirmed dead code removed

4. **Zero-downtime migration** - Compatibility views allowed code to be updated gradually while database was already migrated.

5. **Voice memo audio policy** - Transcripts only, no long-term audio storage (with optional 7-day retention for review).

---

## Related Documentation

- [AI_ASSISTANT.md](./AI_ASSISTANT.md) - Current AI system guide
- [DATABASE_NAMING_CONVENTIONS.md](./DATABASE_NAMING_CONVENTIONS.md) - Naming standards
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - Schema reference
- [RLS_SECURITY_MODEL.md](./RLS_SECURITY_MODEL.md) - Security policies
- [DEPRECATED_CODE.md](./DEPRECATED_CODE.md) - Code cleanup analysis

---

**Archive Created:** 2026-01-16
**Original Files Consolidated:** 8 files (~3,400 lines)
**Archive Size:** ~300 lines
