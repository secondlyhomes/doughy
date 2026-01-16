# Troubleshooting Guide

Common issues and their solutions for the Doughy AI application.

---

## Authentication & Database Issues

### "Database error creating new user"

**Symptom:**
- Cannot create users in Supabase (via dashboard or app)
- Error message: "Database error creating new user" or "Failed to create user: Database error creating new user"
- May occur after not using the project for a while (months+)

**Root Cause:**
The `public.handle_new_user()` function and trigger are missing or broken. This trigger is responsible for automatically creating a `profiles` record when a new user signs up in `auth.users`. Without it, user creation fails because downstream code expects the profile to exist.

**Solution:**

1. **Run this SQL in Supabase Dashboard → SQL Editor:**
   ```sql
   -- Fix missing trigger for auto-creating profiles
   CREATE OR REPLACE FUNCTION public.handle_new_user()
   RETURNS TRIGGER AS $$
   BEGIN
     INSERT INTO public.profiles (id, email, role, workspace_id)
     VALUES (NEW.id, NEW.email, 'user', NULL)
     ON CONFLICT (id) DO NOTHING;
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;

   DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
   CREATE TRIGGER on_auth_user_created
     AFTER INSERT ON auth.users
     FOR EACH ROW
     EXECUTE FUNCTION public.handle_new_user();
   ```

2. **Verify the fix:**
   - Try creating a user via Supabase Dashboard → Authentication → Users → "Add user"
   - OR in your app console: `await supabase.auth.signUp({ email: 'test@example.com', password: 'password123' })`
   - Should succeed without errors

3. **Check the trigger exists:**
   ```sql
   -- Verify trigger is installed
   SELECT trigger_name, event_manipulation, action_statement
   FROM information_schema.triggers
   WHERE event_object_schema = 'auth'
     AND event_object_table = 'users';
   ```

**Prevention:**
- Keep local migrations in sync with remote database
- Run `supabase db pull --linked` periodically to capture schema changes
- Document all manual schema changes in migrations

**Related Files:**
- `supabase/migrations/20260115_fix_user_profile_trigger.sql` (migration for this fix)
- `src/features/auth/context/AuthProvider.tsx` (uses profiles)

---

### "User not authenticated when fetching API key"

**Symptom:**
- Console warning: `WARN  User not authenticated when fetching API key`
- Cannot save or fetch API keys
- App appears to be signed in (UI shows user) but database queries fail
- Occurs in DEV/STAGE environment

**Root Cause:**
The `devBypassAuth()` function was only setting React context state (local UI state) but not creating a real Supabase authentication session. Without a valid JWT token, Row Level Security (RLS) policies see `auth.uid() = null` and deny all queries to user-scoped tables like `api_keys`.

**Solution:**

The `devBypassAuth()` function has been updated to use real Supabase sign-in:

1. **Create a test user** (if you haven't already):
   - Via Supabase Dashboard → Authentication → Users → "Add user"
   - Email: `admin@doughy.app` (or your choice)
   - Password: `Doughy123!` (or your choice)
   - Enable "Auto Confirm User"

2. **Update `.env.local`** with your test credentials:
   ```bash
   EXPO_PUBLIC_DEV_EMAIL=admin@doughy.app
   EXPO_PUBLIC_DEV_PASSWORD=Doughy123!
   ```

3. **How it works now:**
   - App starts in DEV mode
   - `devBypassAuth()` calls `supabase.auth.signInWithPassword()` with test credentials
   - Creates a real JWT token
   - RLS policies see valid `auth.uid()`
   - Database queries succeed

4. **Verify it's working:**
   - Restart app
   - Check console logs: Should see `[auth] Dev bypass: Authenticating for testing` and `[auth] Dev sign-in successful`
   - Should NOT see "User not authenticated" warnings
   - Navigate to Admin → Integrations → Try saving an API key

**Production Safety:**
- `devBypassAuth()` only works when `__DEV__ === true`
- Production builds require real user authentication
- Test credentials are only in `.env.local` (not committed to git)

**Related Files:**
- `src/features/auth/context/AuthProvider.tsx:178-258` (devBypassAuth function)
- `src/hooks/useApiKey.ts:37-42` (where auth check happens)
- `.env.local:17-19` (dev credentials)

---

## Encryption Issues

### "Error decrypting integration key"

**Symptom:**
- Health checks fail with: `{"message": "Error decrypting integration key", "status": "error"}`
- Affects multiple services: openai, stripe-secret, perplexity, etc.
- Old API keys showing errors but new ones don't work either

**Root Cause:**
API keys were encrypted with an old/broken encryption format (e.g., `react-native-aes-crypto` native module) that is incompatible with the new `crypto-js` implementation.

**Solution:**

1. **Clear all old encrypted keys:**
   ```sql
   -- Run in Supabase Dashboard → SQL Editor
   DELETE FROM api_keys;
   ```

2. **Re-enter your API keys:**
   - Navigate to Admin → Integrations
   - Enter fresh API keys for each service
   - They will be encrypted with the new crypto-js format
   - Should save without errors

3. **Verify encryption works:**
   - Save a test key
   - Refresh the page
   - Key should still display (obfuscated, e.g., `sk-proj-****`)
   - No decryption errors in console

**Current Encryption:**
- Client: `crypto-js` (pure JavaScript, no native modules)
- Format: `ivBase64:ciphertextBase64:hmacHex`
- Algorithm: AES-256-CBC with HMAC-SHA256
- Works in Expo Go and development builds

**Related Files:**
- `src/lib/cryptoNative.ts` (client-side encryption)
- `supabase/functions/_shared/crypto-server.ts` (server-side decryption)

---

### "Cannot read property 'encrypt' of null"

**Symptom:**
- Error when trying to save API keys
- Full error: `TypeError: Cannot read property 'encrypt' of null`
- Occurs at `cryptoNative.ts:74`

**Root Cause:**
This was caused by `react-native-aes-crypto` (a native module) returning null in development environments or Expo Go.

**Solution:**
✅ **Already fixed** - The app now uses `crypto-js` (pure JavaScript) instead of native crypto modules.

**If you see this error again:**
1. Check `package.json` - ensure `react-native-aes-crypto` is NOT installed
2. Check `src/lib/cryptoNative.ts` - should import `crypto-js`, not `react-native-aes-crypto`
3. Run: `npm install crypto-js @types/crypto-js`
4. Run: `npm uninstall react-native-aes-crypto` (if present)

---

## Environment & Configuration

### Wrong environment label in logs

**Symptom:**
- Logs say "PRODUCTION" but you're actually in DEV/STAGE
- Confusing when debugging

**Solution:**
✅ **Already fixed** - `src/lib/supabase.ts` now detects environment from URL:
- `vpqglbaedcpeprnlnfxd` = PRODUCTION
- `lqmbyobweeaigrwmvizo` = DEV/STAGE

**Verify:**
Check logs on app start:
```
✅ [Supabase] CONNECTED TO REAL DATABASE
✅ Project: https://lqmbyobweeaigrwmvizo.supabase.co
✅ Environment: DEV/STAGE
```

---

## Supabase CLI Issues

### "Remote migration versions not found in local migrations directory"

**Symptom:**
- Cannot push migrations with `supabase db push --linked`
- Error about migration history mismatch
- Suggests running `supabase migration repair`

**Root Cause:**
Local migration files are out of sync with remote database migration history.

**Solution:**

**Option 1: Run SQL manually (recommended for single fixes):**
1. Copy the SQL from your migration file
2. Go to Supabase Dashboard → SQL Editor
3. Paste and run the SQL directly
4. Skip the CLI migration push

**Option 2: Repair migration history (for ongoing work):**
1. Follow the CLI's suggestions to repair individual migrations
2. Pull remote schema: `supabase db pull --linked`
3. Then push your new migration: `supabase db push --linked`

**Prevention:**
- Keep local migrations in sync with remote
- Use `supabase db pull --linked` before creating new migrations
- Prefer manual SQL execution for hotfixes

---

## Quick Reference

### Key URLs
- **DEV/STAGE Supabase:** https://supabase.com/dashboard/project/lqmbyobweeaigrwmvizo
- **PROD Supabase:** https://supabase.com/dashboard/project/vpqglbaedcpeprnlnfxd
- **SQL Editor:** `.../sql` (append to project URL)
- **Auth Users:** `.../auth/users`

### Useful SQL Queries

**Check profiles table:**
```sql
SELECT id, email, role FROM profiles LIMIT 10;
```

**Check API keys:**
```sql
SELECT service, status, last_checked FROM api_keys;
```

**Check auth users:**
```sql
SELECT id, email, email_confirmed_at, created_at FROM auth.users ORDER BY created_at DESC LIMIT 10;
```

**Verify trigger exists:**
```sql
SELECT trigger_name FROM information_schema.triggers WHERE event_object_table = 'users' AND event_object_schema = 'auth';
```

### Environment Files

- `.env.local` - Currently active environment (DEV/STAGE or PROD)
- `.env.dev` - Template for DEV/STAGE
- `.env.prod` - Template for PROD (if exists)

**Switch environments:**
```bash
# To DEV/STAGE
cp .env.dev .env.local

# To PROD
cp .env.prod .env.local
```

---

## UI/Layout Issues

### NativeTabs Icons Not Showing and Wrong Tint Color

**Symptom:**
- Tab bar icons are invisible or not rendering
- Tab bar showing blue color instead of theme sage green (#4d7c5f)
- Tabs work functionally but visual appearance is wrong
- Occurs when using `expo-router/unstable-native-tabs`

**Root Cause:**
Using React Navigation's options-based API pattern instead of NativeTabs' component composition API.

**WRONG (options-based API):**
```typescript
import { NativeTabs } from 'expo-router/unstable-native-tabs';

<NativeTabs.Trigger
  name="index"
  options={{
    title: 'Inbox',
    icon: { sf: 'tray' },
    selectedIcon: { sf: 'tray.fill' },
    iconColor: '#4d7c5f',
  }}
/>
```

**CORRECT (component composition API):**
```typescript
import { NativeTabs, Icon, Label, Badge } from 'expo-router/unstable-native-tabs';
import { DynamicColorIOS } from 'react-native';

<NativeTabs
  backgroundColor="transparent"
  blurEffect={isDark ? "systemUltraThinMaterialDark" : "systemUltraThinMaterialLight"}
  tintColor={DynamicColorIOS({
    light: '#4d7c5f',  // Sage green
    dark: '#6b9b7e',   // Lighter sage
  })}
  shadowColor="transparent"
>
  <NativeTabs.Trigger name="index">
    <Icon sf={{ default: 'tray', selected: 'tray.fill' }} />
    <Label>Inbox</Label>
    {counts.leads > 0 && <Badge value={String(counts.leads)} />}
  </NativeTabs.Trigger>
</NativeTabs>
```

**Solution:**

1. **Update imports** to include component composition API:
   ```typescript
   import { NativeTabs, Icon, Label, Badge } from 'expo-router/unstable-native-tabs';
   import { DynamicColorIOS } from 'react-native';
   ```

2. **Configure NativeTabs wrapper** with DynamicColorIOS for tintColor:
   ```typescript
   <NativeTabs
     backgroundColor="transparent"
     blurEffect={isDark ? "systemUltraThinMaterialDark" : "systemUltraThinMaterialLight"}
     tintColor={DynamicColorIOS({
       light: '#4d7c5f',  // Your theme's light mode color
       dark: '#6b9b7e',   // Your theme's dark mode color
     })}
     shadowColor="transparent"
   >
   ```

3. **Replace each trigger** with component composition:
   ```typescript
   <NativeTabs.Trigger name="index">
     <Icon sf={{ default: 'tray', selected: 'tray.fill' }} />
     <Label>Inbox</Label>
     {/* Optional badge */}
     {counts.leads > 0 && <Badge value={String(counts.leads)} />}
   </NativeTabs.Trigger>
   ```

4. **Common SF Symbol icons** for tabs:
   - Inbox: `tray` / `tray.fill`
   - Deals/Documents: `doc.text` / `doc.text.fill`
   - Properties/Buildings: `building.2` / `building.2.fill`
   - Settings: `gearshape` / `gearshape.fill`
   - Dashboard: `house` / `house.fill`
   - Users: `person.2` / `person.2.fill`

5. **Hide tabs** if needed (still accessible via navigation):
   ```typescript
   <NativeTabs.Trigger name="leads" hidden />
   ```

**Note About Blue Tint:**
If you still see a blue tint after fixing the API usage, this is likely **expected behavior** from iOS Liquid Glass blur effect picking up your app's background color. For example, if your dark mode background is slate-900 (`#0f172a`), the blur will have a slight blue tint. This is how iOS Liquid Glass works - it adapts to the content behind it.

**Related Files:**
- `app/(tabs)/_layout.tsx` - Main app tab navigation
- `app/(admin)/_layout.tsx` - Admin tab navigation
- [Expo Native Tabs Documentation](https://docs.expo.dev/router/advanced/native-tabs/)

**Prevention:**
- Always use component composition API (`<Icon>`, `<Label>`, `<Badge>`) with NativeTabs
- Never use React Navigation's `options` prop pattern
- Use `DynamicColorIOS` for theme colors to support light/dark mode
- Reference official Expo documentation when in doubt

---

### Excessive Bottom Padding After Switching Tab Bar

**Symptom:**
- Too much empty space at bottom of screens above the tab bar
- Content padding is much larger than needed
- Inconsistent spacing between different screens

**Root Cause:**
With `NativeTabs` (native iOS UITabBarController), iOS **automatically handles** scroll view content insets for the tab bar and safe area. If you also manually add `+ insets.bottom` to your padding, you get **double-counting**.

**The Pattern Problem:**
```typescript
// ❌ WRONG - Double-counts safe area with NativeTabs
paddingBottom: TAB_BAR_SAFE_PADDING + insets.bottom

// ✅ CORRECT - Just breathing room, iOS handles tab bar
paddingBottom: TAB_BAR_SAFE_PADDING  // Currently 16px
```

**Current Values (for NativeTabs):**
| Constant | Value | Purpose |
|----------|-------|---------|
| TAB_BAR_HEIGHT | 49px | Native iOS tab bar height (reference) |
| TAB_BAR_SAFE_PADDING | 16px | Minimal visual breathing room |
| FAB_BOTTOM_OFFSET | 100px | For absolutely positioned FABs |

**Solution:**

1. Use `TAB_BAR_SAFE_PADDING` alone (no `+ insets.bottom`):
   ```typescript
   <ScrollView contentContainerStyle={{ paddingBottom: TAB_BAR_SAFE_PADDING }}>
   ```

2. Or use the hook:
   ```typescript
   const { contentPadding } = useTabBarPadding();
   <ScrollView contentContainerStyle={{ paddingBottom: contentPadding }}>
   ```

**Related Files:**
- `src/components/ui/FloatingGlassTabBar.tsx` - Constants definition
- `src/hooks/useTabBarPadding.ts` - Hook that handles this automatically
- `docs/DESIGN_SYSTEM.md#tab-bar-spacing--bottom-padding` - Full pattern docs

---

## Getting Help

If you encounter an issue not covered here:

1. **Check console logs** for specific error messages
2. **Check Supabase logs** in Dashboard → Logs
3. **Search this file** for keywords from your error
4. **Document new issues** by adding them to this file with:
   - Clear symptom description
   - Root cause analysis
   - Step-by-step solution
   - Prevention tips

---

**Last Updated:** 2026-01-15
**Major Changes:**
- Added "NativeTabs Icons Not Showing and Wrong Tint Color" troubleshooting
- Added "Excessive Bottom Padding After Switching Tab Bar" troubleshooting
- Added "Database error creating new user" troubleshooting
- Added "User not authenticated" RLS fix
- Added encryption migration guide
