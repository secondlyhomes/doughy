# Troubleshooting: Auth & Data Loading Issues

**Last updated:** 2026-02-17
**Applies to:** Supabase JS v2 + Expo/React Native + React Query

This guide documents a chain of auth bugs we hit and resolved. Each fix revealed the next layer. Use this as a diagnostic playbook when auth or data loading breaks.

---

## Quick Diagnosis Flowchart

```
App stuck on login screen?
  → Check: Are sessions accumulating? (Query auth.sessions)
  → Check: Are dev buttons disabled during auth? (LoginScreen.tsx)
  → Check: Is signInInProgressRef guarding re-entry? (AuthProvider.tsx)
  → See: Issue 1 (Login Loop)

Logged in but all screens show loading spinners?
  → Check: Do API logs show ANY mobile REST queries?
  → If NO queries reach server → See: Issue 3 (Init Lock)
  → If queries reach server but return empty → Check RLS policies
  → If queries return errors → Check schema permissions
  → See: Issue 2 (PlatformContext) and Issue 3 (Init Lock)

Platform selector not showing?
  → Check: Is PlatformContext calling getSession()? It shouldn't.
  → See: Issue 2 (PlatformContext Hang)
```

---

## Issue 1: Login Loop (Session Accumulation)

### Symptoms
- Tapping dev login button repeatedly creates new sessions
- Console shows repeating `[auth] Auth state changed: SIGNED_IN`
- User never reaches app screens
- `auth.sessions` table shows dozens/hundreds of active sessions

### Root Cause
Multiple interacting bugs:
1. **No re-entry guard** — each tap fires `signInWithPassword` → new server session
2. **Dev buttons not disabled** during auth — `loading` only tracked `isSubmitting`, not `isLoading`
3. **`isLoading` race** — `signIn()` set `isLoading=false` on success before `onAuthStateChange` fired, creating a brief `!isLoading && !isAuthenticated` window that triggered redirect back to login
4. **`app/index.tsx`** always redirected to auth without checking `isAuthenticated`

### How We Diagnosed
1. Queried `auth.sessions` — found 138 active sessions for one user
2. Checked API logs — server was healthy, all `signInWithPassword` returned 200
3. Traced the React state timing: `signInWithPassword` → `onAuthStateChange(SIGNED_IN)` → `setSession()` (batched, not immediate) → redirect checks stale state

### Fix Applied
```
AuthProvider.tsx:
  + signInInProgressRef — blocks concurrent signIn/devBypassAuth calls
  + Removed success-path setIsLoading(false) — let onAuthStateChange handle it
  + 5s safety timeout to unblock UI if onAuthStateChange never fires
  + Profile fetch timeout (3s) in onAuthStateChange (same as initializeAuth)
  + Filter TOKEN_REFRESHED events (just update session, skip profile refetch)
  + Skip INITIAL_SESSION (handled by initializeAuth, avoids double profile fetch)
  + signOut({ scope: 'others' }) on SIGNED_IN in __DEV__ to auto-clean stale sessions

LoginScreen.tsx:
  + devLoading = isLoading || isSubmitting — disables dev buttons during auth init

app/index.tsx:
  + Check isAuthenticated before redirecting (don't flash login for authenticated users)
```

### Verification
```sql
-- Check session count for a user
SELECT count(*) FROM auth.sessions
WHERE user_id = '3aa71532-c4df-4b1a-aabf-6ed1d5efc7ce';
-- Should be 1 (or very few) after fix
```

---

## Issue 2: PlatformContext Hang (Platform Selector Not Loading)

### Symptoms
- Login succeeds but platform selector (investor/landlord) never appears
- `PlatformContext.isLoading` stuck at `true` forever
- No errors in console

### Root Cause
`PlatformContext.loadSettings()` called `supabase.auth.getSession()` which blocks on the Supabase init lock (`initializePromise`). If token refresh is slow, this hangs ALL PostgREST queries too because `_getAccessToken()` also calls `getSession()`.

### Key Insight: The Supabase Init Lock
```
supabase.auth.getSession()     ← blocks on initializePromise
supabase.auth.getUser()        ← blocks on initializePromise
supabase.from('x').select()    ← calls _getAccessToken() → getSession() → blocks
supabase.schema('y').from('x') ← same chain, also blocks

supabase.auth.signInWithPassword()  ← does NOT block (direct HTTP POST)
```

**Rule: NEVER call `getSession()` in providers, context initializers, or any code that runs eagerly at mount time.** It will block on the init lock and hang everything downstream.

### Fix Applied
```
PlatformContext.tsx:
  - Removed ALL getSession() calls (3 total)
  + loadSettings() — AsyncStorage only, no network/auth dependency
  + onAuthStateChange listener — syncs DB when SIGNED_IN/INITIAL_SESSION fires
  + currentUserIdRef — caches user ID for saveToDatabase/refreshSettings
```

### How to Check for This Pattern
```bash
# Search for getSession() calls outside of AuthProvider
grep -r "getSession" src/ --include="*.ts" --include="*.tsx" | grep -v AuthProvider | grep -v node_modules
```
Any hits in contexts, providers, or hooks that run at mount time are suspect.

---

## Issue 3: Data Loading Hang (Queries Never Reach Server)

### Symptoms
- Login works, platform selector works
- ALL data screens (investor leads, properties, deals, landlord properties, bookings, contacts) show loading spinners forever
- **Zero REST queries in Supabase API logs** from the mobile app
- Data exists in DB and is owned by the authenticated user

### Root Cause: Init Lock Timing
The Supabase client's `_initialize()` method has a timing issue:

```
1. App starts → _initialize() acquires init lock (initializePromise)
2. _recoverAndRefresh() reads stored session from SecureStore
3. _recoverAndRefresh() fires SIGNED_IN event ← BEFORE HTTP token refresh
4. Our onAuthStateChange catches SIGNED_IN, sets isLoading=false in finally block
5. Tab layout sees isAuthenticated && !isLoading → mounts tab screens
6. React Query hooks fire immediately (no `enabled` guards)
7. Each query calls _getAccessToken() → getSession() → BLOCKS on initializePromise
8. initializePromise is still held (token refresh HTTP call in progress)
9. Queries never reach the server → permanent loading state
```

The critical insight: **`onAuthStateChange(SIGNED_IN)` fires BEFORE the init lock releases.** The event is emitted mid-way through `_recoverAndRefresh`, while the HTTP token refresh is still in progress.

### How We Diagnosed
1. **Checked API logs** — zero mobile REST queries (only openclaw server polling). This proved queries weren't reaching the server at all.
2. **Verified data exists** — SQL confirmed 61 leads, 101 properties, 52 deals owned by admin user. Not a data/RLS issue.
3. **Read Supabase source code:**
   - `SupabaseClient.ts:339-347` — `_getAccessToken()` calls `this.auth.getSession()`
   - `fetch.ts` — `fetchWithAuth` calls `getAccessToken()` before EVERY REST request
   - `GoTrueClient.ts:_initialize()` — the init lock mechanism and timing
4. **Connected the dots:** `onAuthStateChange` → `isLoading=false` → tabs mount → queries hang on lock

### Fix Applied
```typescript
// AuthProvider.tsx — added initCompleteRef

const initCompleteRef = useRef(false);

// In initializeAuth, AFTER getSession() returns:
const { data: { session } } = await supabase.auth.getSession();
initCompleteRef.current = true; // Init lock is now released

// In onAuthStateChange's finally block:
finally {
  if (initCompleteRef.current) {
    setIsLoading(false);  // Only allow if lock is released
  }
  signInInProgressRef.current = false;
}
```

**Why this works:** `getSession()` blocks until `initializePromise` resolves. Once it returns, we KNOW the lock is released and future `getSession()` calls (from REST queries) won't hang. If `onAuthStateChange` fires before `getSession()` returns, we keep `isLoading=true` so tabs don't mount yet.

### Verification
1. Start app → dev login → ALL screens should load data (not just platform selector)
2. Check Supabase API logs → should see REST queries from mobile app
3. Console should NOT show `[auth] onAuthStateChange did not fire within 5s`

---

## Debugging Toolkit

### Check Active Sessions
```sql
SELECT id, created_at, updated_at, user_agent
FROM auth.sessions
WHERE user_id = '3aa71532-c4df-4b1a-aabf-6ed1d5efc7ce'
ORDER BY created_at DESC;
```

### Clean Up Stale Sessions
```sql
-- Keep only the most recent session
DELETE FROM auth.sessions
WHERE user_id = '3aa71532-c4df-4b1a-aabf-6ed1d5efc7ce'
  AND id NOT IN (
    SELECT id FROM auth.sessions
    WHERE user_id = '3aa71532-c4df-4b1a-aabf-6ed1d5efc7ce'
    ORDER BY created_at DESC
    LIMIT 1
  );
```

### Check API Logs (via Supabase MCP)
Use `get_logs` with service `api` to see if REST queries are reaching the server. If zero queries appear from the mobile app, the issue is client-side (init lock or auth state).

### Check What's Blocking
Add temporary logging to AuthProvider:
```typescript
console.log('[auth] initCompleteRef:', initCompleteRef.current);
console.log('[auth] isLoading:', isLoading);
console.log('[auth] isAuthenticated:', !!session && !!user);
```

### Key Console Messages
| Message | Meaning |
|---------|---------|
| `[auth] signIn already in progress` | Re-entry guard working correctly |
| `[auth] onAuthStateChange did not fire within 5s` | Supabase event system stalled — fallback kicked in |
| `[auth] Profile fetch timed out after 3s` | Network slow but app continues |
| `[auth] Failed to clean up other sessions` | signOut(scope:'others') failed — non-critical |

---

## Architecture Rules (Learned the Hard Way)

### Rule: Never call `getSession()` eagerly
Any code that runs at mount time (useEffect with `[]` deps, context initializers, providers) must NOT call `getSession()`. It blocks on the init lock. Use `onAuthStateChange` to react to auth state instead.

### Rule: `isLoading` gates everything
`isLoading` in AuthProvider controls whether tab screens mount. If it becomes `false` too early (before init lock releases), all REST queries hang. The `initCompleteRef` pattern ensures proper timing.

### Rule: `signInWithPassword` bypasses the init lock
It makes a direct HTTP POST — safe to call at any time. But the `SIGNED_IN` event it triggers still goes through `onAuthStateChange`, which must respect `initCompleteRef`.

### Rule: One `signInWithPassword` = one server session
Each call creates a new session without revoking old ones. Use `signOut({ scope: 'others' })` after `SIGNED_IN` in dev mode to auto-cleanup. Never rely on the client to have only one session.

### Rule: Always timeout `fetchProfile`
Profile fetch goes through the Supabase client (REST query), which means it can hang on the init lock too. Always wrap in `Promise.race` with a 3s timeout.

---

## Files Reference

| File | Role |
|------|------|
| `src/features/auth/context/AuthProvider.tsx` | Auth state machine — `initCompleteRef`, `signInInProgressRef`, `hasInitializedRef` |
| `src/features/auth/screens/LoginScreen.tsx` | Dev buttons — `devLoading` disables during auth |
| `src/contexts/PlatformContext.tsx` | Platform switching — AsyncStorage-first, `currentUserIdRef` |
| `app/index.tsx` | Root redirect — auth-aware, shows nothing while loading |
| `app/(tabs)/_layout.tsx` | Tab guard — redirects to sign-in if not authenticated |
| `docs/DEBUG_AUTH_LOOP.md` | Detailed historical record of all fixes + Supabase internals reference |
