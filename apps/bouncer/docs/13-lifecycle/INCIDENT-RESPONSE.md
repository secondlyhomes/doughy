# Incident Response Guide

## Overview

When production issues occur, a structured response minimizes impact and speeds resolution.

## Severity Levels

| Level | Description | Response Time | Examples |
|-------|-------------|---------------|----------|
| P0 | Critical outage | Immediate | App won't launch, data loss |
| P1 | Major impact | < 1 hour | Core feature broken, auth down |
| P2 | Moderate impact | < 4 hours | Secondary feature broken |
| P3 | Minor impact | < 24 hours | UI bugs, edge cases |

### Cross-Platform Severity Mapping

If you have a shared backend with web apps, ensure consistent severity classification:

| Mobile Severity | Web Equivalent | Shared Backend |
|-----------------|----------------|----------------|
| P0 | SEV-0 / Critical | Full outage, data loss |
| P1 | SEV-1 / High | Core feature broken |
| P2 | SEV-2 / Medium | Secondary feature broken |
| P3 | SEV-3 / Low | Minor bugs, cosmetic issues |

**Note:** Mobile P0 incidents may have wider blast radius due to app store release cycles. A critical mobile bug cannot be instantly patched like a web deployment.

## Response Protocol

### P0/P1 Incidents

```
1. DETECT    → Alert received or reported
2. TRIAGE    → Assess severity and impact
3. ASSEMBLE  → Get right people involved
4. MITIGATE  → Stop the bleeding
5. RESOLVE   → Fix root cause
6. REVIEW    → Learn and improve
```

### Detection

**Automated Alerts:**
- Sentry crash rate > 1%
- Error rate spike
- API latency > 2s
- Failed health checks

**Manual Reports:**
- User support tickets
- App store reviews
- Social media mentions
- Team observations

### Triage Questions

1. **What is broken?**
2. **Who is affected?** (% of users, specific segments)
3. **When did it start?**
4. **What changed recently?** (deploys, config changes)
5. **Is there a workaround?**

## Incident Roles

### Incident Commander (IC)
- Coordinates response
- Makes decisions
- Communicates status
- Documents timeline

### Technical Lead
- Investigates root cause
- Implements fix
- Validates resolution

### Communications Lead
- Updates stakeholders
- Drafts user communications
- Monitors social/support channels

## Communication Templates

### Internal Update (Slack/Teams)

```markdown
## 🔴 Incident: [Brief Description]

**Status:** Investigating / Identified / Mitigating / Resolved
**Severity:** P0/P1/P2
**IC:** @name
**Started:** 10:00 AM PST

### Current Understanding
[What we know so far]

### Impact
[Who/what is affected]

### Actions
- [x] Alert acknowledged
- [x] IC assigned
- [ ] Root cause identified
- [ ] Fix implemented

### Next Update
[Time or trigger for next update]
```

### Status Page Update

```markdown
## Investigating Issues with [Feature]

We are investigating reports of [brief issue description].
Some users may experience [symptoms].

We will provide updates as we learn more.

**Posted:** Jan 15, 2024 10:15 AM PST
```

### Resolution Update

```markdown
## Resolved: [Feature] Issues

The issue has been resolved. [Brief explanation of fix].

Users should now be able to [expected behavior] normally.

We apologize for any inconvenience.

**Resolved:** Jan 15, 2024 11:30 AM PST
**Duration:** 1 hour 15 minutes
```

## Investigation Playbook

### Step 1: Recent Changes

```bash
# Recent deployments
git log --oneline -20

# Recent config changes
# Check Supabase dashboard, env variables
```

### Step 2: Error Analysis

```bash
# Check Sentry for errors
# Look for patterns:
# - Device type
# - OS version
# - App version
# - User segment
```

### Step 3: Reproduce

```bash
# Try to reproduce locally
# Match user's conditions:
# - Same app version
# - Same account type
# - Same actions
```

### Step 4: Narrow Down

```bash
# Binary search through commits
git bisect start
git bisect bad HEAD
git bisect good v1.1.0
# Test each commit
```

## Mitigation Strategies

### Immediate Actions

1. **Rollback**
   ```bash
   # Revert to last known good version
   git revert HEAD
   eas build && eas submit
   ```

2. **Feature Flag**
   ```typescript
   // Disable broken feature
   if (featureFlags.isEnabled('newFeature')) {
     return <NewFeature />;
   }
   return <OldFeature />;
   ```

3. **Server-Side Fix**
   ```sql
   -- Database fix
   UPDATE config SET feature_enabled = false;
   ```

4. **Communication**
   - Status page update
   - In-app message
   - Support prepared response

## Post-Incident Review

### Timeline Document

```markdown
# Incident Timeline: [Name]

## Summary
[1-2 sentence summary]

## Timeline (All times PST)

| Time | Event |
|------|-------|
| 10:00 | First error reported |
| 10:05 | Alert triggered in Sentry |
| 10:10 | IC assigned, investigation started |
| 10:25 | Root cause identified |
| 10:40 | Fix implemented and tested |
| 10:50 | Fix deployed |
| 11:00 | Confirmed resolved |

## Root Cause
[Technical explanation]

## Impact
- Duration: 1 hour
- Users affected: ~500
- Revenue impact: $X (if applicable)

## What Went Well
- Fast detection
- Clear communication
- Quick fix

## What Could Be Improved
- Better test coverage
- Faster rollback process
- More monitoring

## Action Items
- [ ] Add test for edge case (@owner, due: date)
- [ ] Implement feature flag for new code (@owner, due: date)
- [ ] Add alerting for error rate (@owner, due: date)
```

### 5 Whys Analysis

```markdown
**Problem:** Users couldn't delete tasks

**Why 1:** The delete API returned an error
**Why 2:** The database query failed
**Why 3:** A foreign key constraint was violated
**Why 4:** Subtasks weren't deleted first
**Why 5:** The new code removed cascade delete logic

**Root Cause:** Refactor removed necessary cascade delete
**Fix:** Restore cascade delete and add test
```

## Monitoring Setup

### Key Metrics to Watch

| Metric | Normal | Alert Threshold |
|--------|--------|-----------------|
| Crash-free rate | 99%+ | < 98% |
| API error rate | < 0.1% | > 1% |
| API latency (p95) | < 500ms | > 2s |
| Login success rate | > 99% | < 95% |
| Active users | Baseline | -20% |

### Sentry Configuration

```typescript
// sentry.config.ts
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.2,

  // Alert on error spike
  beforeSend(event) {
    if (event.level === 'error') {
      // Custom alerting logic
    }
    return event;
  },
});
```

## Incident Runbooks

### P0 Incident Runbook (Critical Outage)

**Response Time:** Immediate (< 5 minutes)

**Step 1: Acknowledge & Assemble (0-5 min)**
```bash
# 1. Acknowledge alert immediately
# 2. Create incident Slack channel: #incident-YYYYMMDD-description
# 3. Assign IC (Incident Commander)
# 4. Page on-call engineer
# 5. Start timeline document
```

**Step 2: Assess Impact (5-10 min)**
```bash
# Check Sentry dashboard
# - Crash rate
# - Error spikes
# - Affected user count

# Check app analytics
# - Active user drop
# - Feature usage drop

# Check support channels
# - Recent tickets
# - Social media mentions

# Document findings in incident channel
```

**Step 3: Immediate Mitigation (10-30 min)**
```bash
# Option A: Rollback (fastest)
git revert HEAD
git push origin master
eas build --platform all --profile production
eas submit --platform all --latest

# Option B: Hotfix
git checkout -b hotfix/critical-fix
# ... make minimal fix ...
git push
# Fast-track through CI/CD

# Option C: Feature Flag Disable
# Update remote config to disable broken feature
# No deployment required
```

**Step 4: Validate Fix (30-45 min)**
```bash
# 1. Test in production (limited rollout if possible)
# 2. Monitor error rates (should drop immediately)
# 3. Check user reports (should stop)
# 4. Confirm with affected users if known
```

**Step 5: Communication (Throughout)**
```markdown
## Internal (Every 15 min until resolved)
- Incident channel updates
- Stakeholder briefings

## External (Within 30 min of detection)
- Status page: "Investigating"
- Support: Prepared response
- Status page: "Identified" (when root cause known)
- Status page: "Monitoring" (after fix deployed)
- Status page: "Resolved" (when confirmed stable)
```

**Step 6: Post-Resolution (Within 24 hours)**
```bash
# 1. Schedule post-mortem (within 48 hours)
# 2. Document timeline
# 3. Create action items
# 4. Update runbooks if needed
```

---

### P1 Incident Runbook (Major Impact)

**Response Time:** < 1 hour

**Step 1: Acknowledge (0-15 min)**
```bash
# 1. Create incident channel
# 2. Assign IC
# 3. Alert on-call engineer
# 4. Begin investigation
```

**Step 2: Investigate (15-30 min)**
```bash
# Recent changes
git log --since="2 hours ago" --oneline

# Error analysis
# - Check Sentry for patterns
# - Review recent deployments
# - Check database migrations

# Reproduce issue
# - Match user conditions
# - Follow error breadcrumbs
```

**Step 3: Fix or Mitigate (30-60 min)**
```bash
# If fix is quick (<30 min):
# - Implement fix
# - Test thoroughly
# - Deploy

# If fix is complex:
# - Deploy workaround/mitigation
# - Schedule proper fix
# - Monitor closely
```

**Step 4: Validate & Monitor (60 min+)**
```bash
# 1. Confirm fix works
# 2. Monitor for regressions
# 3. Update stakeholders
# 4. Document learnings
```

---

### P2 Incident Runbook (Moderate Impact)

**Response Time:** < 4 hours

**Step 1: Log & Triage (0-30 min)**
```bash
# 1. Create issue in tracker
# 2. Assign to appropriate team
# 3. Set priority
# 4. Gather initial context
```

**Step 2: Investigate (30 min - 2 hours)**
```bash
# 1. Reproduce issue
# 2. Identify root cause
# 3. Estimate fix complexity
# 4. Decide on approach
```

**Step 3: Fix (2-4 hours)**
```bash
# 1. Implement fix
# 2. Add tests
# 3. Code review
# 4. Deploy in next release window
```

**Step 4: Verify**
```bash
# 1. Validate in staging
# 2. Deploy to production
# 3. Monitor for 24 hours
```

---

### P3 Incident Runbook (Minor Impact)

**Response Time:** < 24 hours

**Step 1: Document**
```bash
# 1. Create issue
# 2. Add to backlog
# 3. Prioritize in planning
```

**Step 2: Fix in Regular Cycle**
```bash
# 1. Schedule for upcoming sprint
# 2. Implement with normal workflow
# 3. Deploy with regular release
```

---

## Severity-Specific Checklists

### P0 Critical Outage Checklist

**Impact:** App completely unusable, data loss, security breach

**Immediate Actions (Within 5 minutes):**
- [ ] Alert acknowledged by on-call engineer
- [ ] Incident channel created
- [ ] IC (Incident Commander) assigned
- [ ] Initial assessment completed
- [ ] Stakeholders alerted

**Within 15 minutes:**
- [ ] Root cause hypothesis formed
- [ ] Mitigation strategy chosen (rollback/hotfix/disable)
- [ ] Status page updated: "Investigating"
- [ ] Customer support briefed

**Within 30 minutes:**
- [ ] Mitigation deployed
- [ ] Fix validation in progress
- [ ] Status page updated: "Identified" or "Monitoring"

**Within 1 hour:**
- [ ] Issue confirmed resolved
- [ ] Monitoring shows normal operations
- [ ] Status page updated: "Resolved"
- [ ] Incident timeline documented

**Within 24 hours:**
- [ ] Post-mortem scheduled
- [ ] Preliminary action items created
- [ ] Customer communication sent (if warranted)

**Within 1 week:**
- [ ] Post-mortem completed
- [ ] Action items assigned and tracked
- [ ] Runbooks updated
- [ ] Monitoring/alerting improved

---

### P1 Major Impact Checklist

**Impact:** Core feature broken, significant user impact

**Within 15 minutes:**
- [ ] Incident logged
- [ ] IC assigned
- [ ] Investigation started
- [ ] Stakeholders notified

**Within 1 hour:**
- [ ] Root cause identified
- [ ] Fix strategy determined
- [ ] Status update sent

**Within 4 hours:**
- [ ] Fix implemented and tested
- [ ] Fix deployed
- [ ] Validation in progress

**Within 24 hours:**
- [ ] Confirmed stable
- [ ] Timeline documented
- [ ] Post-incident review scheduled

---

### P2 Moderate Impact Checklist

**Within 30 minutes:**
- [ ] Issue documented
- [ ] Owner assigned
- [ ] Initial investigation

**Within 4 hours:**
- [ ] Root cause identified
- [ ] Fix approach determined

**Within 24 hours:**
- [ ] Fix implemented
- [ ] Code reviewed
- [ ] Scheduled for deployment

---

### P3 Minor Impact Checklist

**Within 24 hours:**
- [ ] Issue documented
- [ ] Added to backlog
- [ ] Prioritized appropriately

**Within 1 week:**
- [ ] Scheduled for upcoming sprint

---

## Enhanced Post-Mortem Template

### Incident Report: [Title]

**Date:** YYYY-MM-DD
**Duration:** X hours Y minutes
**Severity:** P0/P1/P2/P3
**IC:** @name
**Status:** Draft / Under Review / Final

---

### Executive Summary

[1-2 paragraphs summarizing what happened, impact, and resolution]

**Key Metrics:**
- Users affected: X (Y% of total)
- Duration: X hours Y minutes
- Revenue impact: $X (if applicable)
- Support tickets: X
- Social media mentions: X

---

### Timeline

All times in PST (UTC-8)

| Time | Event | Owner |
|------|-------|-------|
| 10:00 | First user report received | Support |
| 10:05 | Sentry alert triggered (error rate spike) | Automated |
| 10:08 | On-call engineer acknowledged | @engineer |
| 10:10 | Incident channel created | @ic |
| 10:15 | Initial assessment: auth service down | @ic |
| 10:20 | Root cause identified: database connection pool exhausted | @engineer |
| 10:25 | Mitigation: increased pool size | @engineer |
| 10:30 | Fix deployed to production | @engineer |
| 10:35 | Error rates returning to normal | Automated |
| 10:45 | Confirmed resolved | @ic |
| 10:50 | Status page updated: resolved | @comms |

---

### Root Cause

#### What Happened

[Detailed technical explanation of what went wrong]

**Example:**
The authentication service database connection pool was configured with a maximum of 10 connections. During peak traffic (3x normal load due to marketing campaign), the pool was exhausted, causing new login attempts to timeout after 30 seconds.

#### Why It Happened

**Immediate Cause:**
Database connection pool too small for peak load.

**Underlying Causes:**
1. Connection pool size not load-tested
2. No alerting on connection pool utilization
3. Marketing campaign not communicated to engineering

**Contributing Factors:**
- Recent migration to new database increased latency per query
- Connection timeout set too high (30s instead of 5s)
- No circuit breaker to fail fast

---

### Impact Analysis

#### Users Affected
- **Total affected:** 1,250 users (5% of daily active users)
- **Geographic distribution:** 80% US, 15% EU, 5% Asia
- **User segments:** All segments affected equally
- **Mitigation for users:** Manual logout/login workaround

#### Business Impact
- **Revenue loss:** $500 (estimated from abandoned checkouts)
- **Support tickets:** 45 tickets
- **Social media:** 8 negative mentions
- **App store reviews:** 2 one-star reviews mentioning issue

#### System Impact
- **Services affected:** Auth service (primary), User profile service (secondary)
- **Data integrity:** No data loss, no corruption
- **Cascading failures:** Session refresh also affected

---

### Detection and Response

#### What Went Well ✅
- **Fast detection:** Alert triggered within 5 minutes of first error
- **Clear ownership:** On-call engineer responded immediately
- **Good communication:** Stakeholders kept informed every 15 minutes
- **Fast mitigation:** Fix deployed within 30 minutes
- **No data loss:** Systems maintained data integrity

#### What Could Be Improved ⚠️
- **Prevention:** Load testing didn't catch this scenario
- **Monitoring:** No alert on connection pool utilization before exhaustion
- **Documentation:** Database scaling procedures not documented
- **Communication:** Marketing campaign not shared with engineering

---

### Action Items

#### Immediate (< 1 week)
- [ ] Increase connection pool size to 50 (current: 10) - @engineer - Due: 2026-02-10
- [ ] Add connection pool utilization monitoring - @devops - Due: 2026-02-10
- [ ] Reduce connection timeout from 30s to 5s - @engineer - Due: 2026-02-11

#### Short-term (< 1 month)
- [ ] Implement circuit breaker for auth service - @engineer - Due: 2026-02-28
- [ ] Load test all services at 5x normal traffic - @qa - Due: 2026-02-28
- [ ] Document database scaling procedures - @engineer - Due: 2026-02-20
- [ ] Set up cross-team calendar for marketing campaigns - @pm - Due: 2026-02-15

#### Long-term (< 3 months)
- [ ] Implement auto-scaling for database connections - @devops - Due: 2026-04-30
- [ ] Build traffic forecasting dashboard - @analytics - Due: 2026-04-30
- [ ] Conduct chaos engineering exercises quarterly - @sre - Due: 2026-05-01

---

### Lessons Learned

#### Technical
1. **Connection pooling** - Small pools cause cascading failures under load
2. **Timeouts matter** - Long timeouts amplify the impact of slow queries
3. **Monitoring gaps** - What you don't monitor, you can't prevent

#### Process
1. **Cross-team communication** - Engineering needs visibility into marketing campaigns
2. **Load testing** - Test at 5x normal load, not just expected peak
3. **Incident response** - Our runbook worked well, validated the process

#### Tools
1. **Sentry alerting** - Worked as expected, alerted within 5 minutes
2. **Status page** - Needed manual updates, consider auto-sync
3. **Documentation** - Runbooks need to be living documents

---

### Appendix

#### Related Incidents
- [Incident-2026-01-15] Similar connection pool issue in different service
- [Incident-2025-12-10] Auth timeout cascade

#### Related Documentation
- [Database Scaling Guide](../03-database/SCALING.md)
- [Connection Pooling Best Practices](../03-database/CONNECTION-POOLING.md)
- [Load Testing Procedures](../06-testing/LOAD-TESTING.md)

#### Metrics and Graphs
[Attach screenshots of relevant dashboards, error graphs, traffic patterns]

---

**Review Sign-off:**
- [ ] Technical accuracy reviewed by @engineer
- [ ] Business impact reviewed by @pm
- [ ] Action items assigned and scheduled
- [ ] Shared with team for feedback
- [ ] Final version published

---

## Checklist

### During Incident
- [ ] IC assigned
- [ ] Severity determined
- [ ] Timeline started
- [ ] Incident channel created (#incident-YYYYMMDD-name)
- [ ] Status page updated
- [ ] Stakeholders notified
- [ ] Root cause investigation started
- [ ] Mitigation in progress
- [ ] Customer support briefed
- [ ] Escalation path clear (who to escalate to if needed)

### After Resolution
- [ ] Status page updated (resolved)
- [ ] Users notified if needed
- [ ] Monitoring confirmed stable (24h+)
- [ ] Timeline documented
- [ ] Post-incident review scheduled (within 48h)
- [ ] Action items created and assigned
- [ ] Knowledge base updated
- [ ] Runbooks updated (if gaps found)
- [ ] Monitoring/alerting improved
- [ ] Team debriefed
