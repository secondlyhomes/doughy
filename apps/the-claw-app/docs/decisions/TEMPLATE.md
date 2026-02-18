# ADR-XXX: [Title]

## Status

[Proposed | Accepted | Deprecated | Superseded]

**Date:** YYYY-MM-DD
**Author:** [Name]
**Supersedes:** ADR-YYY (if applicable)

## Context

[Describe the situation that requires a decision. What problem are we trying to solve? What constraints exist?]

## Decision

[State the decision clearly and concisely.]

**We will [decision].**

## Consequences

### Positive
- [Benefit 1]
- [Benefit 2]

### Negative
- [Drawback 1]
- [Drawback 2]

### Neutral
- [Side effect that isn't clearly positive or negative]

## Alternatives Considered

### Option A: [Name]
**Description:** [Brief description]
**Pros:** [List pros]
**Cons:** [List cons]
**Why rejected:** [Reason]

### Option B: [Name]
**Description:** [Brief description]
**Pros:** [List pros]
**Cons:** [List cons]
**Why rejected:** [Reason]

## Implementation Notes

[Any specific guidance for implementing this decision]

## References

- [Link to relevant documentation]
- [Link to related ADRs]
- [Link to discussions/issues]

---

# Example ADR

# ADR-001: Use Supabase for Backend

## Status

Accepted

**Date:** 2024-01-15
**Author:** Team Lead

## Context

We need a backend solution for our mobile app that provides:
- Authentication
- Database
- Real-time subscriptions
- Edge functions
- Easy local development

Our team has limited backend experience and we want to move fast.

## Decision

**We will use Supabase as our backend-as-a-service platform.**

## Consequences

### Positive
- Faster development with built-in auth, database, and APIs
- PostgreSQL provides powerful querying and RLS
- Real-time subscriptions out of the box
- Generous free tier for development
- Good TypeScript support

### Negative
- Vendor lock-in to Supabase
- Less control over infrastructure
- Some features require paid plans
- Learning curve for RLS policies

### Neutral
- Need to learn Supabase-specific patterns
- Community is growing but smaller than Firebase

## Alternatives Considered

### Option A: Firebase
**Description:** Google's BaaS platform
**Pros:** Mature, large community, good React Native support
**Cons:** NoSQL only, complex pricing, less powerful querying
**Why rejected:** PostgreSQL gives us more flexibility for complex queries

### Option B: Custom Backend (Node.js + PostgreSQL)
**Description:** Self-hosted API with PostgreSQL
**Pros:** Full control, no vendor lock-in
**Cons:** Much more development time, need DevOps expertise
**Why rejected:** Would significantly slow down MVP development

## Implementation Notes

- Use Supabase CLI for local development
- Generate TypeScript types from database schema
- Implement RLS policies for all tables
- Use Edge Functions for AI integrations

## References

- [Supabase Documentation](https://supabase.com/docs)
- [RLS Policies Guide](../03-database/RLS-POLICIES.md)
