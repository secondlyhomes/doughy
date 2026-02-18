# ADR-001: Technology Stack Selection

**Status:** Accepted
**Date:** 2026-02-05
**Deciders:** Project team

## Context

We need to build a mobile application with the following requirements:

- Cross-platform (iOS and Android) from a single codebase
- Real-time data synchronization
- AI-powered features
- Offline support
- Secure authentication
- Scalable backend without managing servers
- Cost-effective for a startup/small team

## Decision

**We will use React Native (Expo SDK 54+) + Supabase + TypeScript as our core technology stack.**

### Frontend
- **React Native** with **Expo** for cross-platform mobile development
- **Expo Router** for file-based navigation
- **TypeScript** for type safety

### Backend
- **Supabase** for:
  - PostgreSQL database with Row Level Security (RLS)
  - Authentication (email, OAuth)
  - Realtime subscriptions
  - Edge Functions (Deno)
  - Storage (files, images)

### State Management
- **React Context** for global state (auth, theme)
- **Zustand** for feature-level state
- **React Query** or Supabase subscriptions for server state

### Testing
- **Jest** for unit tests
- **Maestro** for E2E testing

### CI/CD
- **GitHub Actions** for automation
- **EAS Build** for native builds

## Consequences

### Positive

| Benefit | Description |
|---------|-------------|
| **Single codebase** | One codebase for iOS and Android, reducing development time by ~40% |
| **Rapid development** | Expo provides OTA updates, development builds, and managed workflow |
| **Type safety** | TypeScript catches errors at compile time |
| **Scalable backend** | Supabase scales automatically, no server management |
| **Built-in security** | RLS provides database-level security |
| **Real-time ready** | Supabase Realtime for live updates |
| **Cost effective** | Generous free tiers for Supabase and Expo |
| **Large ecosystem** | React Native has extensive libraries and community |

### Negative

| Tradeoff | Mitigation |
|----------|------------|
| **Vendor lock-in** | Supabase is open-source; can self-host or migrate to PostgreSQL |
| **Expo limitations** | Can eject to bare workflow if needed; most native features supported |
| **Learning curve** | RLS requires SQL knowledge; document patterns clearly |
| **Performance** | React Native is ~90% of native; optimize critical paths |

### Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Expo SDK breaking changes | Medium | Medium | Pin SDK versions, test before upgrading |
| Supabase outages | Low | High | Implement offline-first patterns |
| React Native deprecation | Very Low | High | Large Facebook investment; industry standard |

## Alternatives Considered

### Flutter + Firebase

**Pros:**
- Excellent performance (compiles to native)
- Rich widget library
- Strong Google support

**Cons:**
- Dart language (smaller talent pool)
- Firebase vendor lock-in (not open-source)
- Higher cost at scale
- Less flexible database (NoSQL only)

**Why rejected:** Team has React experience; Supabase's PostgreSQL is more flexible than Firestore.

### Native iOS + Android

**Pros:**
- Best performance
- Full native API access
- Platform-specific UX

**Cons:**
- 2x development effort
- 2x maintenance cost
- Requires specialists for each platform

**Why rejected:** Budget and timeline constraints; 95% of features don't need native performance.

### React Native (Bare) + Custom Backend

**Pros:**
- Maximum flexibility
- No vendor lock-in
- Choose any backend stack

**Cons:**
- More setup and maintenance
- Must build auth, realtime, storage
- DevOps overhead

**Why rejected:** Supabase provides everything we need with less overhead.

### Next.js + Capacitor/Ionic

**Pros:**
- Web-first development
- Shared code with web app

**Cons:**
- WebView performance issues
- Native features via plugins only
- Less native feel

**Why rejected:** Need native performance and feel for mobile-first experience.

## Implementation Notes

### Required Setup

1. **Expo Project**
   ```bash
   npx create-expo-app@latest --template expo-template-blank-typescript
   ```

2. **Supabase Project**
   - Create project at [supabase.com](https://supabase.com)
   - Enable Email auth
   - Configure RLS policies

3. **Environment Variables**
   ```bash
   EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
   ```

### Key Dependencies

```json
{
  "dependencies": {
    "expo": "~54.0.0",
    "expo-router": "~4.0.0",
    "@supabase/supabase-js": "^2.0.0",
    "zustand": "^4.0.0",
    "react-native-reanimated": "~3.0.0"
  }
}
```

## References

- [Expo Documentation](https://docs.expo.dev)
- [Supabase Documentation](https://supabase.com/docs)
- [React Native Architecture](https://reactnative.dev/architecture/overview)
- [Why We Chose Supabase](https://supabase.com/customers)

## Related ADRs

- [ADR-002: State Management Approach](./ADR-002-STATE-MANAGEMENT.md)
