# AI Security & Compliance Guide

> **Document Version:** 1.0
> **Last Updated:** January 2026
> **Classification:** Internal Engineering Reference

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Security Best Practices (2026)](#2-security-best-practices-2026)
3. [Compliance Framework](#3-compliance-framework)
4. [Implementation Roadmap](#4-implementation-roadmap)
5. [Developer Guidelines](#5-developer-guidelines)
6. [Critical Files Reference](#6-critical-files-reference)

---

## 1. Executive Summary

This document provides comprehensive security and compliance guidance for the AI Security infrastructure in Doughy. It addresses current vulnerabilities, compliance requirements (GDPR, CCPA, EU AI Act), and provides actionable recommendations for developers.

### 1.1 Current Security Assessment

#### What's Working Well

| Area | Status | Details |
|------|--------|---------|
| **Database RLS** | Complete | 100% RLS coverage on all tables |
| **SQL Injection** | Protected | Using Supabase client with parameterized queries |
| **Encryption** | Implemented | Sensitive data encrypted at rest |
| **Pattern Matching** | Active | Database-driven threat patterns with regex scanning |
| **Circuit Breakers** | Active | Global, function-level, and user-level controls |
| **Rate Limiting** | Active | Cross-function rate limiting with burst protection |
| **Threat Scoring** | Active | Cumulative user threat tracking with decay |
| **SMS Webhook** | Secured | Twilio signature validation implemented |
| **CORS** | Acceptable | Wildcard only in dev mode without credentials |

#### Security Vulnerabilities Requiring Attention

| Issue | Severity | Description | Remediation Status |
|-------|----------|-------------|-------------------|
| Admin Compromise = Total Bypass | CRITICAL | A compromised admin account can disable all patterns, reset circuit breakers, clear threat scores, then attack undetected | Requires immutable audit trail |
| No Immutable Audit Trail | HIGH | Admin actions can be modified/deleted via service role | Implementing hash-chained logs |
| No Separation of Duties | HIGH | Single admin role controls viewing AND modifying security settings | Requires role hierarchy |
| No MFA for Destructive Actions | MEDIUM | Deleting patterns, unblocking users requires no re-authentication | Implementing step-up auth |
| Hard Delete of Patterns | MEDIUM | Deleted patterns are permanently removed, losing audit history | Implementing soft-delete |
| Error Message Leakage | LOW | Some edge functions return raw error.message to clients | Sanitizing responses |

### 1.2 Risk Matrix

```
IMPACT
  ^
  |  +--------------+--------------+
  |  | Admin        |              |
H |  | Compromise   |              |
  |  +--------------+--------------+
  |  | No Audit     | No MFA for   |
M |  | Trail        | Destructive  |
  |  |              | Actions      |
  |  +--------------+--------------+
  |  |              | Error        |
L |  |              | Leakage      |
  |  +--------------+--------------+
     L              M              H
                LIKELIHOOD
```

### 1.3 Compliance Gap Analysis

| Regulation | Gap | Impact |
|------------|-----|--------|
| **GDPR Art. 6** | User prompts logged without documented legal basis | Potential regulatory action |
| **GDPR Art. 5** | No data minimization for AI inputs | Regulatory action risk |
| **GDPR Art. 17** | Erasure rights conflict with audit requirements | Requires crypto-shredding |
| **CCPA 2026** | No ADMT disclosure for automated threat decisions | Civil penalties |
| **CCPA 2026** | No opt-out mechanism for threat scoring | Litigation risk |
| **EU AI Act Art. 12** | Logs not tamper-resistant | Compliance failure |
| **EU AI Act** | No cryptographic integrity verification | Audit failure |

---

## 2. Security Best Practices (2026)

### 2.1 Role Hierarchy (Defense in Depth)

The current single `admin` role should be expanded to a security-specific hierarchy:

```
+------------------------------------------------------------------+
|                    SECURITY_SUPER_ADMIN                           |
|  - Delete patterns (MFA + audit required)                        |
|  - Access full audit history                                     |
|  - Emergency global shutdown                                     |
|  - Approve pattern changes (four-eyes principle)                 |
+------------------------------------------------------------------+
|                    SECURITY_ADMIN                                 |
|  - Add/edit patterns (pending approval)                          |
|  - Block/unblock users (MFA required)                            |
|  - Reset user threat scores (MFA required)                       |
|  - View all security data                                        |
+------------------------------------------------------------------+
|                    SECURITY_OPERATOR                              |
|  - Reset circuit breakers                                        |
|  - View threat scores (anonymized)                               |
|  - View pattern performance metrics                              |
|  - No modification capabilities                                  |
+------------------------------------------------------------------+
|                    SECURITY_VIEWER                                |
|  - View only (dashboards, metrics)                               |
|  - No access to user-specific data                               |
|  - Alert subscription only                                       |
+------------------------------------------------------------------+
```

**Implementation Note:** Until full RBAC is implemented, enforce step-up MFA verification for all destructive actions.

### 2.2 Immutable Audit Logging

#### Hash Chain Design

All security-related admin actions must be logged with cryptographic hash chaining:

```sql
-- Each log entry includes a hash of the previous entry
current_hash = SHA256(
  event_type +
  actor_id +
  target_type +
  target_id +
  action +
  JSON.stringify(old_value) +
  JSON.stringify(new_value) +
  previous_hash +
  timestamp
)
```

#### What Must Be Logged

| Event Type | Actor | Target | Action | Old/New Values |
|------------|-------|--------|--------|----------------|
| `pattern.create` | Admin ID | Pattern ID | `create` | null / pattern data |
| `pattern.update` | Admin ID | Pattern ID | `update` | old pattern / new pattern |
| `pattern.delete` | Admin ID | Pattern ID | `soft_delete` | pattern data / deleted_at |
| `circuit_breaker.trip` | Admin ID | Scope | `trip` | closed / open + reason |
| `circuit_breaker.reset` | Admin ID | Scope | `reset` | open / closed |
| `threat_score.reset` | Admin ID | User ID | `reset` | old score / 0 |
| `user.block` | Admin ID | User ID | `block` | is_blocked=false / true |
| `user.unblock` | Admin ID | User ID | `unblock` | is_blocked=true / false |

#### Append-Only Policy

```sql
-- RLS policy prevents UPDATE/DELETE on audit table
CREATE POLICY "Audit logs are append-only"
  ON ai_security_audit_log
  FOR INSERT
  USING (true);

-- No UPDATE or DELETE policies = immutable
```

### 2.3 Four-Eyes Principle

For critical security changes, require approval from a second administrator:

**Pattern Changes Requiring Approval:**
- Pattern deletion (soft-delete)
- Pattern deactivation
- Severity downgrade
- Global circuit breaker trip/reset

**Emergency Bypass:**
When a circuit breaker is already tripped due to active attack, a single admin can make immediate changes. All bypass actions are logged with `emergency_bypass: true`.

### 2.4 MFA for Destructive Actions (Step-Up Authentication)

Before executing destructive actions, require MFA verification even if user is authenticated:

**Actions Requiring Step-Up:**
1. Pattern deletion
2. Threat score reset
3. User unblocking
4. Global circuit breaker reset
5. Bulk operations affecting > 10 records

**Implementation Pattern:**

```typescript
// useStepUpAuth hook usage
const { requireStepUp } = useStepUpAuth();

const handleDelete = async (patternId: string) => {
  const verified = await requireStepUp({
    reason: 'Delete security pattern',
    actionType: 'pattern_delete',
  });

  if (!verified) return;

  // Proceed with deletion
  await deletePattern(patternId);
};
```

### 2.5 Soft-Delete Pattern

Security patterns should never be hard-deleted:

```sql
-- Add to ai_moltbot_blocked_patterns
deleted_at TIMESTAMPTZ,
deleted_by UUID REFERENCES auth.users(id)

-- Update RLS to filter soft-deleted by default
CREATE POLICY "Users see active patterns only"
  ON ai_moltbot_blocked_patterns FOR SELECT
  USING (deleted_at IS NULL AND ...);
```

**Benefits:**
- Audit trail preserved
- Patterns can be restored if deleted in error
- Historical data for compliance reporting

---

## 3. Compliance Framework

### 3.1 GDPR Compliance

#### Legal Basis for Processing

| Data Type | Legal Basis | Justification |
|-----------|-------------|---------------|
| User AI inputs | Legitimate Interest (Art. 6(1)(f)) | Security monitoring to protect users and systems |
| Threat scores | Legitimate Interest | Preventing abuse and protecting service |
| Security event logs | Legal Obligation (Art. 6(1)(c)) | Required for security incident response |
| Admin audit logs | Legitimate Interest | Corporate governance and accountability |

**Documentation Required:**
- Legitimate Interest Assessment (LIA) for security processing
- Privacy policy disclosure of AI security monitoring
- Records of Processing Activities (ROPA) entry

#### Data Minimization (Art. 5(1)(c))

**Current Issue:** Raw user prompts may be stored in security logs.

**Solution:** Hash user inputs instead of storing raw text:

```typescript
// Before logging
const inputHash = await crypto.subtle.digest(
  'SHA-256',
  new TextEncoder().encode(userInput)
);

// Log only the hash, not the raw input
await logSecurityEvent({
  input_hash: arrayBufferToHex(inputHash),
  // NOT: input: userInput
});
```

#### Retention Policy

| Data Type | Retention Period | Justification |
|-----------|-----------------|---------------|
| Raw AI inputs | 7 days | Short-term debugging only |
| Hashed inputs | 90 days | Security analysis window |
| Threat scores | 2 years | Pattern analysis and legal |
| Admin audit logs | 7 years | Corporate governance |
| Pattern definitions | Forever | Historical security reference |

**Implementation:** Scheduled job to purge data beyond retention period.

#### Right to Erasure (Art. 17) - Crypto-Shredding

When a user requests erasure, we cannot delete security audit logs (legitimate interest override). Instead, use crypto-shredding:

```
Per-User Encryption Key
         |
         v
+---------------------+
| User's security     |
| event details       |--> Encrypted with user's key
| (input hashes,      |
|  matched patterns)  |
+---------------------+
         |
         v
On erasure request:
- Delete user's encryption key
- Encrypted data becomes unreadable
- Audit log structure preserved
```

### 3.2 CCPA 2026 - Automated Decision-Making Technology (ADMT)

#### Required Disclosures

**At Signup (Privacy Notice):**
> "We use automated security systems that analyze your interactions to protect against fraud and abuse. These systems may:
> - Detect and block potentially harmful content
> - Assign a risk score based on your activity patterns
> - Temporarily or permanently restrict access based on security concerns
>
> You have the right to opt out of behavioral scoring and request human review of any automated decisions affecting your access."

**In Privacy Policy:**
- List of ADMT uses (threat scoring, pattern matching)
- Categories of data used
- Logic involved (high-level explanation)
- How to exercise opt-out rights
- How to request human review

#### Opt-Out Mechanism

Users can opt out of **threat scoring** (behavioral analysis) but NOT pattern matching (content filtering):

```typescript
// user_profiles table
threat_scoring_opt_out BOOLEAN DEFAULT false

// Pattern matching still applies (cannot opt out - security requirement)
// But cumulative threat scoring is disabled
```

**When opt-out is enabled:**
- User is not tracked in `ai_moltbot_user_threat_scores`
- Individual requests still scanned for patterns
- Blocking requires manual admin action
- Higher threshold for automated restrictions

#### Right to Explanation

When a user is blocked or restricted, provide:
1. The fact that an automated decision was made
2. General categories of factors involved
3. How to request human review
4. Contact information for appeals

```typescript
// Example blocking response
{
  "blocked": true,
  "reason": "automated_security",
  "explanation": "Our security systems detected activity patterns that triggered protective measures.",
  "human_review_url": "https://doughy.ai/support/security-review",
  "reference_id": "SEC-2026-XXXX"
}
```

### 3.3 EU AI Act 2026 Compliance

#### Article 12 - Record-Keeping Requirements

For AI systems that make decisions affecting users, logs must be:

1. **Tamper-Resistant:** Hash chaining with verification capability
2. **Time-Synchronized:** UTC timestamps with NTP verification
3. **Integrity-Verified:** Periodic hash chain validation
4. **Human-Readable:** Logs must be interpretable by humans
5. **Duration-Adequate:** Retention matching risk level (minimum 6 months)

#### Technical Logging Requirements

```sql
-- Required fields per EU AI Act
CREATE TABLE ai_security_audit_log (
  id UUID PRIMARY KEY,

  -- Timestamp with high precision
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Actor identification
  actor_id UUID NOT NULL,
  actor_type TEXT NOT NULL, -- 'admin', 'system', 'automated'

  -- Action details
  event_type TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,

  -- Decision context (for explainability)
  decision_factors JSONB, -- What triggered this action
  confidence_score NUMERIC(4,3), -- If applicable

  -- State change
  old_value JSONB,
  new_value JSONB,

  -- Tamper-resistance
  previous_hash TEXT NOT NULL,
  current_hash TEXT NOT NULL,

  -- Human oversight
  requires_review BOOLEAN DEFAULT false,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ
);
```

#### Human Oversight Capability

The system must support human intervention:

1. **Review Queue:** Flag high-impact automated decisions for human review
2. **Override Capability:** Admins can override any automated decision
3. **Escalation Path:** Clear process for escalating complex cases
4. **Appeal Mechanism:** Users can request human review

```typescript
// Mark decision for human review
await supabase.from('ai_security_audit_log').update({
  requires_review: true,
  review_reason: 'High impact automated decision',
}).eq('id', logId);
```

---

## 4. Implementation Roadmap

### Phase 1: Immediate (Week 1-2)

| Task | Priority | Effort | Impact |
|------|----------|--------|--------|
| Add admin audit logging with hash chaining | P0 | Medium | High |
| Convert pattern delete to soft-delete | P0 | Low | Medium |
| Add MFA verification for destructive actions | P0 | Medium | High |
| Sanitize edge function error messages | P1 | Low | Medium |
| Verify .env files are gitignored | P1 | Trivial | High |

**Deliverables:**
- `ai_security_audit_log` table with triggers
- `useStepUpAuth` hook
- `StepUpVerificationSheet` component
- Updated `PatternEditorSheet` with soft-delete
- Sanitized error responses

### Phase 2: Short-Term (Week 3-6)

| Task | Priority | Effort | Impact |
|------|----------|--------|--------|
| Hash user inputs instead of storing raw | P1 | Medium | High |
| Implement data retention jobs | P1 | Medium | Medium |
| Add ADMT disclosure in app | P1 | Low | High |
| Add threat scoring opt-out toggle | P2 | Medium | Medium |
| Create security admin role (RBAC) | P2 | High | High |

**Deliverables:**
- Input hashing in firewall
- Scheduled retention job
- Privacy policy updates
- Settings screen opt-out toggle
- Basic RBAC implementation

### Phase 3: Long-Term (Month 2-3)

| Task | Priority | Effort | Impact |
|------|----------|--------|--------|
| Full RBAC with security roles | P2 | High | High |
| Pattern approval workflow (four-eyes) | P2 | High | Medium |
| Crypto-shredding for GDPR erasure | P2 | High | High |
| EU AI Act compliance logging | P2 | Medium | High |
| Human oversight queue | P3 | Medium | Medium |
| Hash chain verification job | P3 | Low | Medium |

**Deliverables:**
- Complete security role hierarchy
- Pattern approval UI
- Crypto-shredding service
- Enhanced audit logging
- Review queue UI

---

## 5. Developer Guidelines

### 5.1 What to Log in Security Events

**Always Log:**
- Event type and timestamp (UTC)
- Actor ID (user or system component)
- Target ID (what was affected)
- Decision outcome (allowed, blocked, flagged)
- Risk/threat score at time of decision
- Matched pattern IDs (not pattern content)
- Function name and version

**Never Log:**
- Raw user input (use hash instead)
- Personal identifiers beyond user ID
- IP addresses (hash if absolutely needed)
- API keys, tokens, or credentials
- Full error stack traces (to client responses)

### 5.2 Error Handling in Edge Functions

**NEVER do this:**
```typescript
// BAD - Leaks internal details
return new Response(
  JSON.stringify({ error: error.message }),
  { status: 500 }
);
```

**ALWAYS do this:**
```typescript
// GOOD - Log internally, sanitize externally
console.error('[FunctionName] Error:', error);
return new Response(
  JSON.stringify({ error: 'Internal server error' }),
  { status: 500 }
);
```

**For expected errors (validation, auth):**
```typescript
// OK - User-facing validation errors
return new Response(
  JSON.stringify({ error: 'Invalid email format' }),
  { status: 400 }
);
```

### 5.3 Security Pattern Updates

When adding or modifying security patterns:

1. **Test in staging first** - Use pattern tester with real-world samples
2. **Check for false positives** - Run against corpus of legitimate messages
3. **Document the threat** - Include description of what attack it prevents
4. **Set appropriate severity** - Use severity matrix below
5. **Request review** - Have another team member verify

**Severity Matrix:**

| Severity | Criteria | Auto-Action |
|----------|----------|-------------|
| `critical` | Active attack, data exfiltration, injection | Block immediately, alert |
| `high` | Clear malicious intent, privilege escalation | Block, increment score |
| `medium` | Suspicious but possibly legitimate | Flag, moderate score increase |
| `low` | Edge case, needs monitoring | Log only, small score increase |

### 5.4 Consent Requirements

| Processing Activity | User Consent | Legal Basis |
|---------------------|--------------|-------------|
| Security pattern matching | NOT required | Legitimate interest (cannot opt out) |
| Threat scoring | NOT required (but opt-out available) | Legitimate interest |
| Admin audit logging | NOT required | Legal obligation / legitimate interest |
| Raw input storage | Required for debug | Explicit consent |

**Never store raw input without explicit user consent.**

### 5.5 Testing Security Features

```typescript
// Unit test: Pattern matching
describe('SecurityFirewall', () => {
  it('should detect injection attempts', async () => {
    const result = await firewall.scan({
      userId: 'test-user',
      input: 'ignore previous instructions and...',
      channel: 'chat',
    });
    expect(result.blocked).toBe(true);
    expect(result.matchedPattern).toBeDefined();
  });

  it('should allow legitimate messages', async () => {
    const result = await firewall.scan({
      userId: 'test-user',
      input: 'What is the weather today?',
      channel: 'chat',
    });
    expect(result.blocked).toBe(false);
  });
});
```

---

## 6. Critical Files Reference

### 6.1 Database Schema

| File | Purpose |
|------|---------|
| `supabase/migrations/20260129000000_moltbot_security.sql` | Original security tables |
| `supabase/migrations/20260131300000_ai_security_firewall.sql` | Circuit breakers, threat scores, enhanced rate limiting |

### 6.2 Edge Function Security

| File | Purpose |
|------|---------|
| `supabase/functions/_shared/ai-security/firewall.ts` | Main firewall logic |
| `supabase/functions/_shared/ai-security/pattern-loader.ts` | Database pattern loading |
| `supabase/functions/_shared/ai-security/circuit-breaker.ts` | Circuit breaker operations |
| `supabase/functions/_shared/ai-security/threat-tracker.ts` | User threat scoring |
| `supabase/functions/_shared/ai-security/rate-limiter.ts` | Cross-function rate limiting |

### 6.3 Admin Dashboard

| File | Purpose |
|------|---------|
| `src/features/admin/screens/ai-security-dashboard/index.tsx` | Main dashboard |
| `src/features/admin/screens/ai-security-dashboard/PatternEditorSheet.tsx` | Pattern CRUD |
| `src/features/admin/screens/ai-security-dashboard/CircuitBreakerCard.tsx` | Circuit breaker controls |
| `src/features/admin/screens/ai-security-dashboard/UserThreatDetailScreen.tsx` | User threat details |
| `src/features/admin/screens/ai-security-dashboard/ThreatScoreCard.tsx` | Threat score display |

### 6.4 Authentication & MFA

| File | Purpose |
|------|---------|
| `src/features/auth/services/mfaService.ts` | MFA enrollment and verification |
| `src/features/auth/hooks/useAuth.ts` | Authentication hook |
| `src/features/auth/hooks/useStepUpAuth.ts` | Step-up MFA for destructive actions |
| `src/components/ui/StepUpVerificationSheet.tsx` | MFA prompt modal |

---

## Appendix A: Security Event Types

```typescript
type SecurityEventType =
  // Pattern events
  | 'pattern.matched'
  | 'pattern.created'
  | 'pattern.updated'
  | 'pattern.soft_deleted'
  | 'pattern.restored'

  // Circuit breaker events
  | 'circuit_breaker.tripped'
  | 'circuit_breaker.reset'
  | 'circuit_breaker.auto_closed'

  // Threat score events
  | 'threat_score.increased'
  | 'threat_score.decreased'
  | 'threat_score.reset'
  | 'threat_score.threshold_crossed'

  // User events
  | 'user.flagged'
  | 'user.blocked'
  | 'user.unblocked'

  // Rate limit events
  | 'rate_limit.exceeded'
  | 'rate_limit.warning';
```

---

## Appendix B: Compliance Checklist

### GDPR Readiness

- [ ] Legal basis documented for all AI processing
- [ ] Privacy policy updated with AI security disclosures
- [ ] Data minimization implemented (input hashing)
- [ ] Retention policy defined and enforced
- [ ] Crypto-shredding for erasure requests
- [ ] Records of Processing Activities updated

### CCPA 2026 Readiness

- [ ] ADMT disclosure at signup
- [ ] Privacy policy ADMT section
- [ ] Opt-out mechanism for threat scoring
- [ ] Human review request process
- [ ] Decision explanation capability

### EU AI Act Readiness

- [ ] Tamper-resistant logging (hash chains)
- [ ] Time-synchronized timestamps
- [ ] Periodic integrity verification
- [ ] Human oversight capability
- [ ] Decision explainability

---

## References

- [Microsoft Security Blog - AI Identity Security 2026](https://www.microsoft.com/en-us/security/blog/2026/01/20/four-priorities-for-ai-powered-identity-and-network-access-security-in-2026/)
- [Lakera - Prompt Injection Guide](https://www.lakera.ai/blog/guide-to-prompt-injection)
- [IBM - Prevent Prompt Injection](https://www.ibm.com/think/insights/prevent-prompt-injection)
- [SecurePrivacy - GDPR Compliance 2026](https://secureprivacy.ai/blog/gdpr-compliance-2026)
- [SecurePrivacy - CCPA Requirements 2026](https://secureprivacy.ai/blog/ccpa-requirements-2026-complete-compliance-guide)
- [Privacy World - 2026 Privacy Laws Primer](https://www.privacyworld.blog/2026/01/primer-on-2026-consumer-privacy-ai-and-cybersecurity-laws/)
- [EU AI Act - Article 12 Record-Keeping](https://artificialintelligenceact.eu/article/12/)
- [Hoop.dev - Immutable Audit Logs](https://hoop.dev/blog/immutable-audit-logs-the-baseline-for-security-compliance-and-operational-integrity/)
- [CMU SEI - Separation of Duties](https://www.sei.cmu.edu/blog/separation-of-duties-and-least-privilege-part-15-of-20-cert-best-practices-to-mitigate-insider-threats-series/)

---

*This document should be reviewed quarterly and updated as regulations evolve.*
