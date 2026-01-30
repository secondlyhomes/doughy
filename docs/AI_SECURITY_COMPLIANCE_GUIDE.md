# AI Security & Compliance Guide

> Comprehensive security and compliance documentation for the Doughy AI security infrastructure.
> Last updated: January 2026

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Security Best Practices (2026)](#2-security-best-practices-2026)
3. [Compliance Framework](#3-compliance-framework)
4. [Implementation Roadmap](#4-implementation-roadmap)
5. [Developer Guidelines](#5-developer-guidelines)
6. [Critical Files Reference](#6-critical-files-reference)

---

## 1. Executive Summary

### Current Vulnerabilities Assessment

The AI security module provides robust real-time protection against prompt injection, data exfiltration, and other AI-specific threats. However, the following critical vulnerabilities have been identified:

| Issue | Severity | Description |
|-------|----------|-------------|
| **Admin Compromise = Total Bypass** | CRITICAL | An attacker with admin access can disable all patterns, reset circuit breakers, clear threat scores, then attack undetected |
| **No Immutable Audit Trail** | HIGH | Admin actions can be modified/deleted via service role access |
| **No Separation of Duties** | HIGH | Single `admin` role controls viewing AND modifying all security settings |
| **No MFA for Destructive Actions** | MEDIUM | Deleting patterns, unblocking users, resetting circuit breakers requires no re-authentication |

### Compliance Gap Analysis

| Regulation | Gap |
|------------|-----|
| **GDPR (Art. 6, 17, 25)** | User prompts logged without documented legal basis; no data minimization strategy; no retention policy; erasure rights conflict with audit needs |
| **CCPA 2026 (ADMT)** | No Automated Decision-Making Technology disclosure; no opt-out mechanism for threat scoring; automated decisions affecting user access |
| **EU AI Act 2026 (Art. 12)** | Logs not tamper-resistant; no cryptographic integrity verification; no documented human oversight mechanism |

### Risk Matrix

| Risk Category | Current State | Target State | Priority |
|---------------|---------------|--------------|----------|
| Insider Threat | HIGH | LOW | P0 |
| Audit Integrity | HIGH | LOW | P0 |
| Regulatory Non-compliance | HIGH | LOW | P1 |
| Attack Detection Gap | MEDIUM | LOW | P2 |

---

## 2. Security Best Practices (2026)

### 2.1 Role Hierarchy (Defense in Depth)

The current system uses a flat `admin` and `support` role structure. The recommended defense-in-depth approach separates concerns:

```
SECURITY_VIEWER      - View dashboard, logs, scores (read-only)
SECURITY_OPERATOR    - Reset circuit breakers, view scores, respond to alerts
SECURITY_ADMIN       - Add/edit patterns, block users, configure thresholds
SECURITY_SUPER_ADMIN - Delete patterns, bulk operations (MFA + approval required)
```

**Implementation:**

```sql
-- Example role hierarchy in user_profiles
CREATE TYPE security_role AS ENUM (
  'security_viewer',
  'security_operator',
  'security_admin',
  'security_super_admin'
);

ALTER TABLE user_profiles
ADD COLUMN security_role security_role DEFAULT NULL;

-- RLS policy example for pattern deletion
CREATE POLICY "Only super_admins can delete patterns"
  ON ai_moltbot_blocked_patterns FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND security_role = 'security_super_admin'
    )
  );
```

### 2.2 Immutable Audit Logging

Current audit logs can be modified via service role access. Implement tamper-evident logging:

**Hash Chain Design:**

```sql
-- Append-only audit table with cryptographic chaining
CREATE TABLE ai_security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Event details
  event_type TEXT NOT NULL,
  actor_id UUID REFERENCES auth.users(id),
  target_type TEXT, -- 'pattern', 'circuit_breaker', 'user_score', etc.
  target_id TEXT,
  action TEXT NOT NULL, -- 'create', 'update', 'delete', 'reset'
  old_value JSONB,
  new_value JSONB,

  -- Context
  ip_address_hash TEXT, -- SHA-256 hash, not raw IP
  user_agent TEXT,
  session_id TEXT,

  -- Integrity
  previous_hash TEXT NOT NULL,
  current_hash TEXT NOT NULL,

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Prevent any modifications
CREATE POLICY "Audit log is append-only"
  ON ai_security_audit_log FOR ALL
  USING (false)  -- Blocks UPDATE/DELETE
  WITH CHECK (true);  -- Allows INSERT

-- Only service role can INSERT (via trigger)
CREATE POLICY "Service role can insert audit"
  ON ai_security_audit_log FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');
```

**Hash Generation Function:**

```sql
CREATE OR REPLACE FUNCTION generate_audit_hash()
RETURNS TRIGGER AS $$
DECLARE
  v_previous_hash TEXT;
  v_payload TEXT;
BEGIN
  -- Get previous hash (or genesis hash)
  SELECT current_hash INTO v_previous_hash
  FROM ai_security_audit_log
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_previous_hash IS NULL THEN
    v_previous_hash := 'GENESIS_HASH_' || gen_random_uuid()::TEXT;
  END IF;

  -- Create hash payload
  v_payload := concat_ws('|',
    NEW.event_type,
    NEW.actor_id::TEXT,
    NEW.target_type,
    NEW.target_id,
    NEW.action,
    NEW.old_value::TEXT,
    NEW.new_value::TEXT,
    NEW.created_at::TEXT,
    v_previous_hash
  );

  NEW.previous_hash := v_previous_hash;
  NEW.current_hash := encode(sha256(v_payload::BYTEA), 'hex');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_hash_trigger
  BEFORE INSERT ON ai_security_audit_log
  FOR EACH ROW
  EXECUTE FUNCTION generate_audit_hash();
```

### 2.3 Four-Eyes Principle

Critical security changes require approval from a second authorized user:

```typescript
// Pattern change approval workflow
interface PatternChangeRequest {
  id: string;
  requestedBy: string;
  changeType: 'create' | 'update' | 'delete';
  patternData: Partial<SecurityPattern>;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: Date;
  reason: string;
}

// Only apply changes after approval
async function applyPatternChange(requestId: string, approverId: string) {
  const request = await getChangeRequest(requestId);

  // Enforce four-eyes: requester cannot approve their own change
  if (request.requestedBy === approverId) {
    throw new Error('Cannot approve own change request');
  }

  // Apply the change
  await executePatternChange(request);

  // Log with both actors
  await logAuditEvent({
    eventType: 'pattern_change',
    actorId: approverId,
    metadata: {
      requestedBy: request.requestedBy,
      approvedBy: approverId
    }
  });
}
```

**Emergency Bypass:** Four-eyes can be bypassed ONLY when a circuit breaker is already tripped, documented in audit log with justification.

### 2.4 MFA for Destructive Actions

Require step-up authentication before critical operations:

```typescript
// Actions requiring MFA verification
const MFA_REQUIRED_ACTIONS = [
  'pattern.delete',
  'pattern.bulk_disable',
  'threat_score.reset',
  'threat_score.bulk_reset',
  'user.unblock',
  'circuit_breaker.global_reset',
];

async function requireMFAVerification(
  userId: string,
  action: string
): Promise<boolean> {
  if (!MFA_REQUIRED_ACTIONS.includes(action)) {
    return true;
  }

  // Check if user has verified MFA in last 5 minutes
  const recentMFA = await checkRecentMFAVerification(userId, 5 * 60 * 1000);
  if (recentMFA) {
    return true;
  }

  // Trigger MFA challenge
  throw new MFARequiredError(action);
}
```

---

## 3. Compliance Framework

### 3.1 GDPR Compliance

**Legal Basis: Legitimate Interest (Article 6(1)(f))**

Security monitoring qualifies under legitimate interest because:
- It protects the service and other users from attacks
- It is proportionate (only security-relevant data)
- Users are informed in the privacy policy

**Documentation Required:**
```
Legitimate Interest Assessment (LIA)
- Purpose: Detect and prevent AI system attacks (injection, exfiltration, abuse)
- Necessity: AI systems are vulnerable to prompt injection; no less intrusive alternative
- Balancing: Minimal personal data collected; security benefit outweighs privacy impact
- Safeguards: Data minimization, retention limits, access controls
```

**Data Minimization (Article 25):**

Replace raw prompt storage with hashing:

```typescript
// Instead of storing raw user input
const rawInput = userMessage; // DON'T store this

// Store a one-way hash for pattern matching analytics
const inputHash = await crypto.subtle.digest(
  'SHA-256',
  new TextEncoder().encode(rawInput + SALT)
);
const hashHex = Array.from(new Uint8Array(inputHash))
  .map(b => b.toString(16).padStart(2, '0'))
  .join('');

// Store only the hash for analytics
await logSecurityEvent({
  inputHash: hashHex,
  inputLength: rawInput.length,
  detectedPatterns: matchedPatternIds, // IDs only, not content
  riskScore: scan.riskScore,
});
```

**Crypto-Shredding for GDPR Erasure (Article 17):**

```sql
-- Per-user encryption key for erasable data
CREATE TABLE user_encryption_keys (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  encrypted_key BYTEA NOT NULL, -- DEK encrypted with KEK
  key_version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- To satisfy erasure request: delete the key
-- All user's encrypted data becomes unreadable
DELETE FROM user_encryption_keys WHERE user_id = $1;
```

**Retention Policy:**

| Data Type | Retention | Justification |
|-----------|-----------|---------------|
| Raw user inputs | 0 days (hash only) | Data minimization |
| Input hashes | 90 days | Pattern analysis |
| Threat scores | Until reset or user deletion | Security operation |
| Security events (hashed) | 2 years | Incident investigation |
| Admin audit log | 7 years | Legal/compliance requirement |

### 3.2 CCPA 2026 ADMT Compliance

California's 2026 CCPA amendments require disclosure of Automated Decision-Making Technology.

**Required Disclosure (at signup and in privacy policy):**

```markdown
## Automated Decision-Making Technology Notice

We use automated systems to protect our AI services:

**What we do:**
- Analyze your messages for security threats before processing
- Track a "threat score" based on security events
- Automatically limit or block access if threats are detected

**How it affects you:**
- Messages matching threat patterns may be blocked
- Repeated security events may result in temporary access limits
- High threat scores may restrict AI feature access

**Your rights:**
- View your current threat score in Account Settings
- Request human review of automated blocking decisions
- Opt out of threat scoring (pattern matching still applies)
```

**Opt-Out Mechanism:**

```typescript
interface UserSecurityPreferences {
  userId: string;
  // Pattern matching cannot be opted out (security requirement)
  threatScoringEnabled: boolean; // CAN opt out
  threatScoringOptOutDate?: Date;
}

// Check before updating threat score
async function shouldTrackThreatScore(userId: string): Promise<boolean> {
  const prefs = await getUserSecurityPreferences(userId);
  return prefs.threatScoringEnabled;
}
```

**Right to Explanation:**

When a user is blocked, provide explainable output:

```typescript
interface BlockingExplanation {
  decision: 'blocked' | 'rate_limited' | 'flagged';
  reason: string; // Human-readable
  factors: string[]; // e.g., ["High threat score", "Pattern match detected"]
  appealProcess: string;
  humanReviewAvailable: boolean;
}

// Return explanation with blocked response
if (securityScan.action === 'blocked') {
  return {
    error: 'Request blocked due to security policy',
    code: 'THREAT_BLOCKED',
    explanation: {
      decision: 'blocked',
      reason: 'Your message matched our security patterns',
      factors: ['Potential prompt injection detected'],
      appealProcess: 'Contact support@example.com for human review',
      humanReviewAvailable: true,
    }
  };
}
```

### 3.3 EU AI Act 2026 Compliance (Article 12)

The EU AI Act requires tamper-resistant logging for high-risk AI systems.

**Tamper-Resistant Logging:**

See Section 2.2 (Hash Chain Design) for implementation.

**Verification Function:**

```sql
CREATE OR REPLACE FUNCTION verify_audit_chain()
RETURNS TABLE(
  id UUID,
  is_valid BOOLEAN,
  error_message TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
  rec RECORD;
  v_expected_hash TEXT;
  v_payload TEXT;
  v_prev_hash TEXT := NULL;
BEGIN
  FOR rec IN
    SELECT * FROM ai_security_audit_log
    ORDER BY created_at ASC
  LOOP
    -- Check previous hash link
    IF v_prev_hash IS NOT NULL AND rec.previous_hash != v_prev_hash THEN
      id := rec.id;
      is_valid := false;
      error_message := 'Previous hash mismatch';
      RETURN NEXT;
      CONTINUE;
    END IF;

    -- Verify current hash
    v_payload := concat_ws('|',
      rec.event_type, rec.actor_id::TEXT, rec.target_type,
      rec.target_id, rec.action, rec.old_value::TEXT,
      rec.new_value::TEXT, rec.created_at::TEXT, rec.previous_hash
    );
    v_expected_hash := encode(sha256(v_payload::BYTEA), 'hex');

    IF rec.current_hash != v_expected_hash THEN
      id := rec.id;
      is_valid := false;
      error_message := 'Hash verification failed';
      RETURN NEXT;
    ELSE
      id := rec.id;
      is_valid := true;
      error_message := NULL;
      RETURN NEXT;
    END IF;

    v_prev_hash := rec.current_hash;
  END LOOP;
END;
$$;
```

**Human Oversight Capability:**

```typescript
// Human override endpoint for security decisions
interface HumanOverrideRequest {
  userId: string;
  overrideType: 'unblock' | 'allow_request' | 'clear_score';
  justification: string;
  authorizedBy: string; // Security admin
  expiresAt?: Date;
}

// Log human oversight decisions
await logAuditEvent({
  eventType: 'human_override',
  actorId: adminId,
  targetId: userId,
  action: 'override',
  metadata: {
    overrideType: request.overrideType,
    justification: request.justification,
    expiresAt: request.expiresAt,
  }
});
```

**Decision Explainability:**

Store reasoning with each automated decision:

```typescript
// Enhanced security event logging
interface ExplainableSecurityEvent {
  // Existing fields
  eventType: string;
  action: 'allowed' | 'flagged' | 'blocked';
  riskScore: number;

  // Explainability additions
  decisionFactors: {
    factor: string;
    weight: number;
    triggered: boolean;
  }[];
  thresholdUsed: number;
  alternativeActionsConsidered: string[];
}
```

---

## 4. Implementation Roadmap

### Phase 1: Immediate (Week 1-2)

**P1.1: Add Admin Audit Logging Trigger**

```sql
-- Trigger for pattern changes
CREATE OR REPLACE FUNCTION audit_pattern_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO ai_security_audit_log (
    event_type, actor_id, target_type, target_id,
    action, old_value, new_value
  ) VALUES (
    'pattern_change',
    auth.uid(),
    'pattern',
    COALESCE(NEW.id, OLD.id)::TEXT,
    TG_OP,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER audit_blocked_patterns
  AFTER INSERT OR UPDATE OR DELETE ON ai_moltbot_blocked_patterns
  FOR EACH ROW EXECUTE FUNCTION audit_pattern_changes();
```

**P1.2: Convert Pattern Delete to Soft-Delete**

```sql
-- Add soft-delete column
ALTER TABLE ai_moltbot_blocked_patterns
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- Modify RLS to exclude soft-deleted
CREATE OR REPLACE POLICY "Admins can view active patterns"
  ON ai_moltbot_blocked_patterns FOR SELECT
  USING (
    deleted_at IS NULL AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'support')
    )
  );
```

**P1.3: Add MFA Verification for Destructive Actions**

Implement in dashboard:

```typescript
// src/features/admin/screens/ai-security-dashboard/hooks/useMFAVerification.ts
export function useMFAVerification() {
  const [mfaVerified, setMFAVerified] = useState(false);
  const [mfaVerifiedAt, setMFAVerifiedAt] = useState<Date | null>(null);

  const MFA_VALIDITY_MS = 5 * 60 * 1000; // 5 minutes

  const isMFAValid = () => {
    if (!mfaVerified || !mfaVerifiedAt) return false;
    return Date.now() - mfaVerifiedAt.getTime() < MFA_VALIDITY_MS;
  };

  const requireMFA = async (action: string): Promise<boolean> => {
    if (isMFAValid()) return true;

    // Trigger MFA challenge
    const verified = await promptMFAChallenge(action);
    if (verified) {
      setMFAVerified(true);
      setMFAVerifiedAt(new Date());
    }
    return verified;
  };

  return { requireMFA, isMFAValid };
}
```

### Phase 2: Short-Term (Week 3-6)

**P2.1: Hash User Inputs**

Replace raw input logging in `firewall.ts`:

```typescript
// In logSecurityEvent function
const logSecurityEvent = (details: SecurityEventDetails): void => {
  // Hash raw input before logging
  const inputHash = details.rawInput
    ? await hashInput(details.rawInput)
    : null;

  supabase.rpc('log_security_event', {
    p_user_id: userId,
    p_event_type: details.eventType,
    p_input_hash: inputHash, // Hash instead of raw
    p_input_length: details.rawInput?.length,
    p_detected_pattern_ids: details.detectedPatterns, // IDs only
    p_risk_score: details.riskScore,
  });
};
```

**P2.2: Implement Data Retention Jobs**

```sql
-- Scheduled job for data retention (run daily)
CREATE OR REPLACE FUNCTION enforce_data_retention()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_deleted INTEGER := 0;
BEGIN
  -- Delete hashed inputs older than 90 days
  DELETE FROM ai_moltbot_security_events
  WHERE created_at < NOW() - INTERVAL '90 days';
  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  -- Keep admin audit for 7 years (no action needed yet)

  RETURN v_deleted;
END;
$$;

-- Schedule with pg_cron
SELECT cron.schedule('retention-cleanup', '0 2 * * *', 'SELECT enforce_data_retention()');
```

**P2.3: Add ADMT Disclosure and Opt-Out**

Add to user settings:

```typescript
// src/features/settings/screens/PrivacySettingsScreen.tsx
<Section title="AI Security">
  <InfoCard>
    We use automated systems to protect our AI services.
    Learn more in our Privacy Policy.
  </InfoCard>

  <Toggle
    label="Threat Score Tracking"
    description="Track cumulative security events (pattern matching still applies)"
    value={prefs.threatScoringEnabled}
    onValueChange={handleThreatScoringToggle}
  />

  <Button onPress={viewThreatScore}>
    View My Threat Score
  </Button>
</Section>
```

### Phase 3: Long-Term (Month 2-3)

| Task | Description | Effort |
|------|-------------|--------|
| Full RBAC | Implement security role hierarchy | 2 weeks |
| Pattern Approval Workflow | Four-eyes principle for pattern changes | 1 week |
| Crypto-Shredding | Per-user encryption keys for GDPR erasure | 2 weeks |
| Hash Chain Logging | Tamper-evident audit trail | 1 week |
| EU AI Act Logging | Decision explainability, human oversight | 2 weeks |
| Compliance Dashboard | Audit verification, retention reports | 1 week |

---

## 5. Developer Guidelines

### 5.1 What to Log

**Always Log:**
- Event type (injection_attempt, rate_limit, etc.)
- Timestamp (ISO 8601 with timezone)
- Actor ID (user_id or system)
- Target ID (pattern_id, user_id, etc.)
- Decision outcome (allowed, flagged, blocked)
- Risk score (0-100)
- Matched pattern IDs (not pattern content)

**Example:**
```typescript
await logSecurityEvent({
  eventType: 'injection_attempt',
  timestamp: new Date().toISOString(),
  actorId: userId,
  targetId: null,
  decision: 'blocked',
  riskScore: 85,
  matchedPatternIds: ['pat_123', 'pat_456'],
  auditId: context.auditId,
});
```

### 5.2 What NOT to Log

| Data Type | Why Not | Alternative |
|-----------|---------|-------------|
| Raw user input | Privacy, GDPR | Hash + length |
| Personal identifiers | Data minimization | User ID only |
| IP addresses | Privacy | Hash if needed for geo |
| API keys / credentials | Security | Never log |
| Pattern regex content | Security | Pattern ID only |
| Full error stack traces | May contain PII | Sanitized message |

### 5.3 Consent Requirements

| Feature | Opt-Out Allowed | Documentation |
|---------|-----------------|---------------|
| Pattern matching | NO | Required for security |
| Rate limiting | NO | Required for service |
| Threat scoring | YES | Privacy policy |
| Circuit breakers | NO | Required for security |
| Admin audit logging | NO | Legal requirement |

### 5.4 Security Code Review Checklist

When reviewing code that touches the security system:

- [ ] No raw user input stored or logged
- [ ] Threat scores updated only via RPC (not direct UPDATE)
- [ ] Pattern changes trigger audit log
- [ ] Circuit breaker checks use database function (not in-memory only)
- [ ] Rate limit headers included in responses
- [ ] Blocked responses include explanation for CCPA compliance
- [ ] No service role key exposed to client
- [ ] RLS policies verified for new tables

---

## 6. Critical Files Reference

### Database Schema

| File | Purpose |
|------|---------|
| `supabase/migrations/20260131300000_ai_security_firewall.sql` | Core tables: circuit breakers, threat scores, patterns cache, rate limits |

**Key Tables:**
- `ai_moltbot_circuit_breakers` - Emergency stop controls
- `ai_moltbot_user_threat_scores` - Cumulative threat tracking
- `ai_moltbot_blocked_patterns` - Security pattern definitions
- `ai_moltbot_rate_limits` - Per-user, per-function rate limits
- `ai_moltbot_security_patterns_cache` - Pattern cache for performance

### Edge Function Security Layer

| File | Purpose |
|------|---------|
| `supabase/functions/_shared/ai-security/firewall.ts` | Main firewall middleware wrapper |
| `supabase/functions/_shared/ai-security/circuit-breaker.ts` | Circuit breaker check logic |
| `supabase/functions/_shared/ai-security/threat-tracker.ts` | Threat score management |
| `supabase/functions/_shared/ai-security/rate-limiter.ts` | Rate limiting implementation |
| `supabase/functions/_shared/ai-security/pattern-loader.ts` | Database pattern loading |
| `supabase/functions/_shared/ai-security/types.ts` | TypeScript type definitions |

**Usage:**
```typescript
import { withAIFirewall } from './_shared/ai-security/firewall.ts';

Deno.serve(withAIFirewall('my-function', async (req, context) => {
  // context.sanitizedInput - Input after security scan
  // context.securityScan - Scan results
  // context.rateLimit - Rate limit status
  // context.logSecurityEvent() - Async event logging

  return new Response(JSON.stringify({ result: 'ok' }));
}));
```

### Admin Dashboard

| File | Purpose |
|------|---------|
| `src/features/admin/screens/ai-security-dashboard/AISecurityDashboardScreen.tsx` | Main dashboard component |
| `src/features/admin/screens/ai-security-dashboard/useSecurityData.ts` | Data fetching hook |
| `src/features/admin/screens/ai-security-dashboard/CircuitBreakerCard.tsx` | Circuit breaker controls |
| `src/features/admin/screens/ai-security-dashboard/ThreatScoreCard.tsx` | User threat score display |
| `src/features/admin/screens/ai-security-dashboard/PatternEditorSheet.tsx` | Pattern management UI |
| `src/features/admin/screens/ai-security-dashboard/UserThreatDetailScreen.tsx` | Per-user threat details |

---

## Sources

Industry best practices and compliance references:

- [Microsoft Security Blog - AI Identity Security 2026](https://www.microsoft.com/en-us/security/blog/2026/01/20/four-priorities-for-ai-powered-identity-and-network-access-security-in-2026/)
- [Lakera - Guide to Prompt Injection](https://www.lakera.ai/blog/guide-to-prompt-injection)
- [IBM - Prevent Prompt Injection](https://www.ibm.com/think/insights/prevent-prompt-injection)
- [SecurePrivacy - GDPR Compliance 2026](https://secureprivacy.ai/blog/gdpr-compliance-2026)
- [SecurePrivacy - CCPA Requirements 2026](https://secureprivacy.ai/blog/ccpa-requirements-2026-complete-compliance-guide)
- [Privacy World - 2026 Privacy Laws Primer](https://www.privacyworld.blog/2026/01/primer-on-2026-consumer-privacy-ai-and-cybersecurity-laws/)
- [EU AI Act - Article 12 Record-Keeping](https://artificialintelligenceact.eu/article/12/)
- [Hoop.dev - Immutable Audit Logs](https://hoop.dev/blog/immutable-audit-logs-the-baseline-for-security-compliance-and-operational-integrity/)
- [CMU SEI - Separation of Duties](https://www.sei.cmu.edu/blog/separation-of-duties-and-least-privilege-part-15-of-20-cert-best-practices-to-mitigate-insider-threats-series/)
