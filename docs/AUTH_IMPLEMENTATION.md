# Auth Implementation Guide

How authentication works in Doughy, and how to replicate it in CallPilot and The Claw UI apps.

## Environment Values (Staging)

```env
EXPO_PUBLIC_SUPABASE_URL=https://lqmbyobweeaigrwmvizo.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_vMs0P31fv8Vn2TsH0MmvqA_vUMPDEh6
```

Legacy anon key (also works, many LLMs are trained on this format):
```env
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-publishable-key
```

The Claw server URL:
```env
EXPO_PUBLIC_CLAW_SERVER_URL=https://openclaw.doughy.app
```

Dev login (for testing):
```env
EXPO_PUBLIC_DEV_EMAIL=admin@doughy.app
EXPO_PUBLIC_DEV_PASSWORD=<ask Dino — not committed to repo>
```

## Key Files to Copy/Reference

| File | Path in doughy-app-mobile | Purpose |
|------|---------------------------|---------|
| Supabase client | `src/lib/supabase.ts` | Client creation, storage adapter |
| Auth provider | `src/features/auth/context/AuthProvider.tsx` | Session management, sign-in/out |
| Auth types | `src/features/auth/types.ts` | TypeScript interfaces |
| Auth hook | `src/features/auth/hooks/useAuth.ts` | `useAuth()` convenience hook |
| Login screen | `src/features/auth/screens/LoginScreen.tsx` | Complete login UI |
| Dev mode config | `src/config/devMode.ts` | Mock data toggle |

## Auth Flow (Step by Step)

### 1. Create the Supabase Client

```typescript
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') return localStorage.getItem(key);
    // Try SecureStore first (< 2KB), fall back to AsyncStorage (> 2KB)
    const secureValue = await SecureStore.getItemAsync(key);
    if (secureValue !== null) return secureValue;
    return await AsyncStorage.getItem(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') { localStorage.setItem(key, value); return; }
    if (value.length > 2000) {
      await AsyncStorage.setItem(key, value);
      await SecureStore.deleteItemAsync(key).catch(() => {});
    } else {
      await SecureStore.setItemAsync(key, value);
      await AsyncStorage.removeItem(key).catch(() => {});
    }
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') { localStorage.removeItem(key); return; }
    await SecureStore.deleteItemAsync(key).catch(() => {});
    await AsyncStorage.removeItem(key).catch(() => {});
  },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

### 2. Session Persistence

- **Where**: Tokens stored via `ExpoSecureStoreAdapter` (SecureStore for < 2KB, AsyncStorage for larger values)
- **Auto-refresh**: Supabase JS client handles token refresh automatically (~55 min before expiry)
- **No manual token management needed** — the client handles everything

### 3. Auth Initialization (Critical Pattern)

```typescript
// In AuthProvider useEffect (runs once on mount):
const { data: { session } } = await supabase.auth.getSession();
// ^ This blocks until the Supabase init lock (initializePromise) is released.
// Once it returns, all REST queries (.from(), .schema(), .rpc()) will work.

if (session) {
  setUser(session.user);
  setSession(session);
  // Fetch profile from public.user_profiles
  setIsLoading(false);
} else {
  setIsLoading(false); // Show login screen
}
```

### 4. Sign In

```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});
// Let onAuthStateChange handle state updates
```

### 5. Listen for Auth State Changes

```typescript
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  async (event, newSession) => {
    if (event === 'TOKEN_REFRESHED') {
      // Just update session, skip profile refetch
      setSession(newSession);
      return;
    }
    if (event === 'INITIAL_SESSION') return; // Handled by getSession() above

    if (newSession) {
      setSession(newSession);
      setUser(newSession.user);
      // Fetch profile...
    } else {
      // Signed out
      setSession(null);
      setUser(null);
    }

    // Only set isLoading=false AFTER getSession() has returned
    if (initCompleteRef.current) setIsLoading(false);
  }
);
```

### 6. Sign Out

```typescript
await supabase.auth.signOut();
// Clear local state: user, session, profile
```

### 7. Token Refresh

Automatic. The Supabase client calls `_recoverAndRefresh` on startup and refreshes ~55 min before expiry. `onAuthStateChange` fires `TOKEN_REFRESHED` events.

## How auth.uid() Works with RLS

Every table has RLS policies like:
```sql
CREATE POLICY "user_access" ON claw.connections
  FOR ALL USING (auth.uid() = user_id);
```

When you query via the anon key + JWT token:
```typescript
const { data } = await supabase
  .schema('claw')
  .from('connections')
  .select('*');
// Only returns rows where user_id matches the JWT's sub claim
```

The JWT contains the user's UUID as `sub`. Supabase extracts it as `auth.uid()` and enforces RLS automatically.

## Making Authenticated API Calls to The Claw Server

The Claw server (`openclaw.doughy.app`) expects a Supabase JWT in the `Authorization` header:

```typescript
async function clawFetch(path: string, options: RequestInit = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const response = await fetch(`${CLAW_SERVER_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      ...options.headers,
    },
  });

  // On 401, try refreshing the session
  if (response.status === 401) {
    const { data: { session: refreshed } } = await supabase.auth.refreshSession();
    if (refreshed) {
      return fetch(`${CLAW_SERVER_URL}${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${refreshed.access_token}`,
          ...options.headers,
        },
      });
    }
  }

  return response;
}
```

## Querying Cross-Schema Tables

To query tables outside the `public` schema:
```typescript
// CRM leads (investor module)
const { data } = await supabase.schema('crm').from('leads').select('*');

// Claw connections
const { data } = await supabase.schema('claw').from('connections').select('*');

// CallPilot calls
const { data } = await supabase.schema('callpilot').from('calls').select('*');
```

All schemas that apps need are exposed via PostgREST:
`claw`, `callpilot`, `crm`, `investor`, `landlord`, `integrations`, `public`

## Gotchas

### 1. Supabase Init Lock (CRITICAL)

**NEVER call `getSession()` eagerly** in providers, useEffects, or context init that runs before the auth provider mounts. The Supabase client has an internal `initializePromise` that blocks until session recovery completes. If you call `getSession()` from multiple places simultaneously, they all block on the same lock.

**NEVER trust `onAuthStateChange` timing for mount gates.** The `_recoverAndRefresh` mechanism fires `SIGNED_IN` BEFORE the init lock releases. If you set `isLoading = false` in the `onAuthStateChange` callback, tabs might mount before `getSession()` returns, and all REST queries will hang.

**Solution:** Track when `getSession()` returns with a ref (`initCompleteRef`), and only allow `isLoading=false` in `onAuthStateChange` after that ref is true.

### 2. signInWithPassword Bypasses the Lock

`signInWithPassword` makes a direct HTTP POST and does NOT wait for `initializePromise`. It's safe to call anytime, even during startup.

### 3. SecureStore 2KB Limit

iOS SecureStore has a ~2KB limit per key. Supabase session tokens can exceed this. The storage adapter falls back to AsyncStorage for large values. You MUST implement this dual-storage pattern or sessions will silently fail.

### 4. Profile Fetch Timeout

Always race the profile fetch against a timeout (3s). If the profile query is slow (first load, cold start), don't block the UI.

### 5. Don't Auto-Login in AuthProvider

Dev authentication should be triggered by LoginScreen buttons, NOT auto-initiated in the AuthProvider's useEffect. This prevents race conditions with manual login presses.

### 6. Schema Access Must Be Configured

For non-public schemas to work via PostgREST (the anon key), they must be in:
```sql
ALTER ROLE authenticator SET pgrst.db_schemas = 'public,claw,callpilot,crm,investor,landlord,integrations';
```
AND each schema needs:
```sql
GRANT USAGE ON SCHEMA claw TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA claw TO anon, authenticated, service_role;
```

This is already configured on staging.

## Server Endpoint Reference

### The Claw API (`/api/claw`)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/claw/message` | JWT | Send message to The Claw |
| GET | `/api/claw/briefing` | JWT | Generate fresh briefing |
| GET | `/api/claw/tasks` | JWT | List user's tasks |
| GET | `/api/claw/approvals` | JWT | List approvals (pending by default) |
| POST | `/api/claw/approvals/:id/decide` | JWT | Approve or reject an approval |
| POST | `/api/claw/approvals/batch` | JWT | Batch approve/reject |
| GET | `/api/claw/activity` | JWT | Combined activity feed |
| GET | `/api/claw/messages` | JWT | Conversation history |
| GET | `/api/claw/agent-profiles` | JWT | List agent profiles |
| PATCH | `/api/claw/agent-profiles/:id` | JWT | Enable/disable agent |
| GET | `/api/claw/kill-switch` | JWT | Check kill switch status |
| POST | `/api/claw/kill-switch` | JWT | Activate kill switch |
| DELETE | `/api/claw/kill-switch` | JWT | Deactivate kill switch (restore agents) |
| GET | `/api/claw/connections` | JWT | List channel connections |
| PUT | `/api/claw/trust` | JWT | Update trust level |
| POST | `/api/claw/queue/:id/approve` | JWT | Approve queued action |
| POST | `/api/claw/queue/:id/cancel` | JWT | Cancel queued action |
| POST | `/api/claw/email/scan` | JWT | Trigger Gmail inbox scan |

### CallPilot API (`/api/calls`)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/calls` | JWT | Call history |
| POST | `/api/calls/pre-call` | JWT | Generate pre-call briefing + create call |
| GET | `/api/calls/history/:leadId` | JWT | Call history for a lead |
| GET | `/api/calls/messages/:leadId` | JWT | Message history for a lead |
| GET | `/api/calls/templates` | JWT | List script templates |
| POST | `/api/calls/:id/start` | JWT | Mark call as in-progress |
| POST | `/api/calls/:id/end` | JWT | End call + generate summary |
| POST | `/api/calls/:id/connect` | JWT | Initiate outbound voice call |
| GET | `/api/calls/:id/coaching` | JWT | Get coaching cards |
| POST | `/api/calls/:id/coaching` | JWT | Generate coaching card |
| GET | `/api/calls/:id/summary` | JWT | Get post-call summary |
| GET | `/api/calls/:id/suggested-updates` | JWT | Get suggested CRM updates |
| POST | `/api/calls/:id/approve-all` | JWT | Batch approve action items + CRM updates |
| GET | `/api/calls/:id/transcript` | JWT | Get call transcript |
| GET | `/api/calls/:id/session` | JWT | Get active session info |

### Messages API (`/api/messages`)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/messages/send` | JWT | Send SMS/email to a lead or contact |

**Payload for `/api/messages/send`:**
```json
{
  "leadId": "uuid",       // OR contactId (one required)
  "contactId": "uuid",
  "channel": "sms",       // "sms" or "email"
  "body": "message text",
  "conversationId": "uuid" // optional — auto-creates if omitted
}
```

### Other Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/oauth/gmail/start?user_id=...` | None | Start Gmail OAuth flow |
| POST | `/webhooks/sms` | Twilio sig | Inbound SMS/WhatsApp |
| POST | `/api/demo/simulate-email` | None | Simulate inbound email (dev) |
| POST | `/api/demo/simulate-sms` | None | Simulate Claw message (dev) |
| GET | `/health` | None | Health check |

## Test User

- **Email**: `admin@doughy.app`
- **User ID**: `3aa71532-c4df-4b1a-aabf-6ed1d5efc7ce`
- All demo seed data is linked to this user
