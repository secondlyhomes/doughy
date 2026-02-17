# Debug Report: Dev Auth Infinite Loop & Navigation Hang

**Date:** 2026-02-17
**Status:** RESOLVED (confirmed working)
**Severity:** P0 Blocker (blocked Friday demo)
**Known-good commit:** `7b993e4`
**Broken since:** `b27eab8` (overnight build)

## Symptoms

1. Open app via Metro → see "Welcome Back" login screen
2. Click "User Console" or "Admin Console"
3. Metro logs show repeating pattern:
   ```
   LOG [auth] Auth state changed: SIGNED_IN
   LOG [auth] Dev bypass: Authenticating for testing
   ```
4. User never reaches the app screens
5. Reverting to older commits (even 2/13) doesn't fix it

---

## Investigation: Agent Team Findings

Four specialist agents ran in parallel to diagnose the issue.

### DBA: Smoking Gun — 138 Active Sessions

The admin@doughy.app user accumulated **138 active sessions** in Supabase with bursts of 2/second. Every `signInWithPassword` call succeeds (HTTP 200). The server is fine. The loop is 100% client-side.

| Time Window | Sessions Created | Rate |
|---|---|---|
| 15:14:00 - 15:14:12 | 22 sessions | ~2/sec |
| 14:35:00 - 14:35:59 | 37 sessions | ~1/sec |
| 10:51:00 - 10:53:00 | 10 sessions | ~5/sec |

**Key finding:** Database is healthy. User exists, profile exists, RLS works. The issue is purely client-side navigation timing.

### Auth Specialist: Navigation Race Condition

The auth flow has a **race condition between `signInWithPassword` returning and React state propagating**:

1. `devBypassAuth()` calls `signInWithPassword()` → Supabase client fires `onAuthStateChange(SIGNED_IN)` internally
2. The `onAuthStateChange` callback calls `setSession()` / `setUser()` — but these are **React state updates that are BATCHED and not applied until the next render**
3. `signInWithPassword` returns → `devBypassAuth` returns
4. `router.replace('/(tabs)')` fires **IMMEDIATELY** — before React has rendered with the new session/user state
5. Tab layout renders with **STALE state**: `isAuthenticated = false` (session/user haven't propagated yet)
6. Tab layout fires `<Redirect href="/(auth)/sign-in" />` → back to login screen
7. The queued state updates finally apply → `isAuthenticated = true` → but user is already on login screen
8. No auto-redirect from auth screens → user clicks again → cycle repeats

**Why it broke after commit b27eab8:** The auth code didn't change, but b27eab8 added heavier tab screens (InvestorNeedsAttention, LandlordNeedsAttention, glass effects, PropertyHubGrid expansion). This made the tab layout tree more complex, which widened the timing window for the race condition. At the known-good commit, tabs were lighter and React reconciliation was faster, so the state propagated before the tab layout's auth guard evaluated.

### Full-Stack Reviewer: File-by-File Analysis

All 20 changed files analyzed. Findings:
- **app/(tabs)/_layout.tsx:** conversations trigger removal is NOT the root cause (campaigns/dev directories also lack triggers and work fine)
- **src/hooks/useNativeHeader.tsx:** Glass default is safe, only affects detail screens, not tab layout
- **New components (Needs Attention, etc.):** All import chains verified clean, no synchronous throws
- **Screen changes:** All cosmetic/styling, no logic changes that affect auth

### Devil's Advocate: Additional Contributing Factors

1. **Stale SecureStore sessions** — Corrupted/expired sessions from previous sign-ins persist across code changes. This explains why reverting to old commits doesn't fix it.
2. **Dual `onAuthStateChange` listeners** — Both AuthProvider AND PlatformContext fire async work on every SIGNED_IN event, causing more state churn
3. **Auto-auth in initializeAuth** — Fires `devBypassAuth()` in background on every fresh start, competing with manual button presses
4. **`devBypassAuth` doesn't set `isLoading = true`** — Unlike `signIn()`, the dev bypass doesn't protect against the transient `isAuthenticated = false` state

---

## Root Causes (Two Bugs)

### Bug 1: Navigation Race Condition (Infinite Loop)

`router.replace('/(tabs)')` fires before React has applied the session/user state updates from `onAuthStateChange`. The tab layout evaluates `isAuthenticated` with stale state and redirects back to the login screen.

Contributing factors:
1. `devBypassAuth()` didn't set `isLoading = true` (no loading guard during auth)
2. Auto-auth in `initializeAuth` created duplicate sign-in attempts
3. Heavier tab screens (from b27eab8) widened the race condition timing window
4. 138 stale sessions accumulated from repeated failed attempts

### Bug 2: `getSession()` Hangs on Initialization Lock

After fixing Bug 1, a `getSession()` check was added to `devBypassAuth` to prevent duplicate sessions. This caused the app to **hang silently** — the button click would log "Dev bypass: Authenticating for testing" and then freeze with no further output.

**Root cause:** The Supabase auth-js client uses an internal lock (`initializePromise`). On app start:
1. `_recoverAndRefresh()` fires — reads session from SecureStore, fires `SIGNED_IN` event early, then starts an HTTP call to refresh the token
2. That HTTP call **holds the lock** until it completes or times out
3. `getSession()` waits for that lock before returning
4. So when the user clicks the button before token refresh completes, `getSession()` blocks indefinitely

**Key insight:** `signInWithPassword()` makes a **direct HTTP POST** to `/auth/v1/token?grant_type=password`. It does NOT acquire the initialization lock. This is why the original code (before the getSession check) didn't have this problem.

---

## Why Old Commits Didn't Fix It

The stale sessions in SecureStore/AsyncStorage persist on the device across code changes. When the Supabase client initializes with a stored session, `_recoverAndRefresh` fires, which can create additional SIGNED_IN events. The accumulated sessions and tokens in device storage interfere regardless of which code version is running.

---

## Failed Fix Attempts (Chronological)

### Attempt 1: Auth Guard Ref + Session Reuse (REVERTED)
- Added `isAuthInProgressRef` to prevent concurrent `devBypassAuth` calls
- Added session reuse check via `getSession()`
- **Result:** User had to click button twice, then got infinite loading spinner
- **Why it failed:** `getSession()` blocked on initialization lock; the ref guard prevented the second click from actually authenticating

### Attempt 2: Restore Conversations NativeTabs Trigger
- Added back `<NativeTabs.Trigger name="conversations" hidden />` to tab layout
- **Result:** Not sufficient, auth loop continued
- **Why it failed:** This was never the root cause. The `campaigns` and `dev` directories have no triggers at the known-good commit and work fine. Missing triggers don't crash NativeTabs.

### Attempt 3: Remove Auto-Auth + Add getSession Check (PARTIAL)
- Removed auto-auth from `initializeAuth` (correct)
- Added `getSession()` check to `devBypassAuth` (wrong — caused hang)
- Added reactive `useEffect` in LoginScreen (correct)
- Added `setIsLoading(true)` guard (correct)
- Cleaned 137 stale sessions from database
- **Result:** Fixed the infinite loop (138 rapid sessions → 1 SIGNED_IN event) but introduced a silent hang because `getSession()` blocks on the initialization lock

### Attempt 4: Remove getSession, Add Auth Layout Guard (FINAL FIX)
- Removed `getSession()` from `devBypassAuth` — calls `signInWithPassword` directly
- Added auth guard to `app/(auth)/_layout.tsx` — redirects authenticated users to tabs
- **Result:** Working. Login screen appears, button click signs in, navigates to tabs.

---

## Final Fix (Applied)

### 1. AuthProvider.tsx — `devBypassAuth()`

**Removed:** `getSession()` check before `signInWithPassword`
**Kept:** `setIsLoading(true)` at the start (prevents tab layout redirect race)
**Kept:** Direct `signInWithPassword` call (no initialization lock dependency)
**Kept:** `onAuthStateChange` handles state propagation (not manual `setSession`/`setUser`)

```typescript
// WRONG — hangs on initialization lock:
const { data: { session: existingSession } } = await supabase.auth.getSession();
if (existingSession) { ... }

// CORRECT — direct HTTP POST, no lock:
const { data, error } = await supabase.auth.signInWithPassword({ email, password });
```

### 2. AuthProvider.tsx — `initializeAuth()`

**Removed:** Auto-auth (`devBypassAuth()` call in background)
**Added:** `hasInitializedRef` guard to run exactly once
**Added:** Profile fetch with 3-second timeout (never hangs)

### 3. LoginScreen.tsx — Reactive Navigation

**Removed:** Immediate `router.replace('/(tabs)')` after `await devBypassAuth()`
**Added:** `useEffect` that watches `isAuthenticated && !isLoading` before navigating
**Added:** `pendingRedirect` state to track destination (tabs vs admin)

```typescript
// WRONG — fires before React state propagates:
await devBypassAuth();
router.replace('/(tabs)');

// CORRECT — waits for state propagation:
useEffect(() => {
  if (isAuthenticated && !isLoading) {
    router.replace((pendingRedirect || '/(tabs)') as any);
  }
}, [isAuthenticated, isLoading, pendingRedirect, router]);
```

### 4. app/(auth)/_layout.tsx — Auth Guard

**Added:** Check for `isAuthenticated` — if user has a stored session, redirect to tabs immediately without showing login screen.

```typescript
if (!isLoading && isAuthenticated) {
  return <Redirect href="/(tabs)" />;
}
```

### 5. Database Cleanup

- Deleted 137 stale sessions for admin@doughy.app (kept 1)

---

## Why Hidden NativeTabs Triggers Exist

**We DON'T strictly need them.** Hidden triggers register routes with the native UITabBarController as non-visible tabs. Without a trigger, a route directory still works for programmatic navigation (`router.push`). The `campaigns` and `dev` directories have never had triggers and work fine.

However, hidden triggers serve as **explicit documentation** that a route exists and is intentionally accessible via navigation but not in the tab bar. They're a code-level manifest of the app's routes.

The conversations trigger was restored as a safety measure but is NOT related to the auth bug.

---

## Prevention Rules

### Rule 1: Never Navigate Immediately After Auth
```typescript
// NEVER DO THIS:
await signIn(email, password);
router.replace('/(tabs)');

// ALWAYS DO THIS:
useEffect(() => {
  if (isAuthenticated && !isLoading) {
    router.replace('/(tabs)');
  }
}, [isAuthenticated, isLoading]);
```
React state updates from `onAuthStateChange` are batched and not applied until the next render. Navigation must wait for state propagation.

### Rule 2: Always Set `isLoading = true` Before Auth Operations
The tab layout's auth guard checks `isLoading` — if it's `false` and `isAuthenticated` is `false`, it redirects to login. Setting `isLoading = true` before auth operations prevents this transient redirect.

### Rule 3: Never Call `getSession()` in User-Triggered Code Paths
`getSession()` blocks on the Supabase client's `initializePromise` lock. If token refresh is in progress, `getSession()` will hang until it completes. Use `signInWithPassword()` directly — it makes a direct HTTP POST without waiting for the lock.

```typescript
// NEVER in button handlers or user-triggered code:
await supabase.auth.getSession(); // Can hang!

// OK in initialization code (runs first, acquires the lock):
// initializeAuth() calls getSession() — this is fine because it's the first caller
```

### Rule 4: Auth Layout Should Have a Guard
`app/(auth)/_layout.tsx` must check `isAuthenticated` and redirect to tabs if the user already has a valid stored session. Without this, users with stored sessions see the login screen unnecessarily.

### Rule 5: No Auto-Auth in Providers
Authentication should only be triggered by explicit user action (button click, form submit). Background auto-auth in providers races with manual interactions and creates duplicate sessions.

### Rule 6: Periodic Session Cleanup
Dev mode testing accumulates sessions. If auth behavior becomes erratic, check for stale sessions:
```sql
SELECT count(*) FROM auth.sessions WHERE user_id = '3aa71532-c4df-4b1a-aabf-6ed1d5efc7ce';
-- If > 5, clean up:
DELETE FROM auth.sessions
WHERE user_id = '3aa71532-c4df-4b1a-aabf-6ed1d5efc7ce'
  AND created_at < now() - interval '1 hour';
```

---

## Files Modified

| File | Change |
|------|--------|
| `src/features/auth/context/AuthProvider.tsx` | Removed auto-auth, removed getSession check, added isLoading guard |
| `src/features/auth/screens/LoginScreen.tsx` | Reactive useEffect navigation, pendingRedirect pattern |
| `app/(auth)/_layout.tsx` | Added auth guard (redirect authenticated users) |
| `app/(tabs)/_layout.tsx` | Restored conversations hidden trigger (unrelated but kept) |

## Supabase Auth-JS Internals Reference

For future debugging, key facts about `@supabase/auth-js`:

- **`initializePromise`**: Internal lock that gates `getSession()`, `getUser()`, and other read operations until initial session recovery (`_recoverAndRefresh`) completes
- **`_recoverAndRefresh`**: Reads session from storage → fires `SIGNED_IN` event → makes HTTP call to refresh token → releases lock
- **`signInWithPassword`**: Direct HTTP POST to `/auth/v1/token?grant_type=password` — does NOT wait for `initializePromise`
- **`onAuthStateChange`**: Fires synchronously when session is read from storage (before token refresh completes). The callback's state updates are React-batched.
- **Session storage**: Uses `ExpoSecureStoreAdapter` — SecureStore for items < 2KB, AsyncStorage for >= 2KB. Persists across app restarts and code changes.
