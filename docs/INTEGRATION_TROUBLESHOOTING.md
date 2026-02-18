# Integration Troubleshooting Guide

This document covers common issues with API key encryption, integration health checks, and their solutions.

---

## Table of Contents

1. [Encryption/Decryption Errors](#encryptiondecryption-errors)
2. [Health Check Failures](#health-check-failures)
3. [UI Issues](#ui-issues)
4. [Diagnostic Tools](#diagnostic-tools)

---

## Encryption/Decryption Errors

### "Invalid salt/IV size (salt: 64, iv: 64, expected: 16)"

**Symptoms:**
- Health check returns "Decryption error"
- Edge function logs show "Counter must be 16 bytes"
- Salt/IV decoded to 64 bytes instead of 16

**Root Cause:**
A bug in `CryptoJS.lib.WordArray.create(Array.from(bytes))` where each byte was treated as a 32-bit word instead of being packed 4 bytes per word.

**Solution:**
1. Delete the affected API key from the Integrations screen
2. Re-save the API key (client now uses fixed `bytesToWordArray()` function)

**Technical Details:**
```javascript
// WRONG - treats each byte as a 32-bit word (16 bytes → 64 bytes)
const salt = CryptoJS.lib.WordArray.create(Array.from(saltBytes));

// CORRECT - packs 4 bytes into each 32-bit word
function bytesToWordArray(bytes: Uint8Array): CryptoJS.lib.WordArray {
  const words: number[] = [];
  for (let i = 0; i < bytes.length; i += 4) {
    const word =
      ((bytes[i] || 0) << 24) |
      ((bytes[i + 1] || 0) << 16) |
      ((bytes[i + 2] || 0) << 8) |
      (bytes[i + 3] || 0);
    words.push(word);
  }
  return CryptoJS.lib.WordArray.create(words, bytes.length);
}
```

**Files involved:**
- `src/lib/cryptoNative.ts` - Client-side encryption
- `supabase/functions/_shared/crypto-server.ts` - Server-side decryption

---

### "HMAC verification failed"

**Symptoms:**
- Decryption fails with HMAC error
- Key was saved but cannot be verified

**Possible Causes:**
1. **Different encryption secrets** - Client and server using different keys
2. **Corrupted data** - Ciphertext was modified in transit/storage
3. **Key mismatch** - Key encrypted with one secret, decrypted with another

**Solution:**

1. Verify secrets match:
   ```bash
   # Check client secret
   grep EXPO_PUBLIC_ENCRYPTION_SECRET .env

   # Check server secret (should match)
   npx supabase secrets list --project-ref <PROJECT_REF> | grep KEY_SECRET
   ```

2. If secrets don't match, update the server:
   ```bash
   npx supabase secrets set KEY_SECRET="<your-64-char-hex-secret>" --project-ref <PROJECT_REF>
   npx supabase functions deploy integration-health --project-ref <PROJECT_REF>
   ```

3. Delete and re-save the API key

---

### "Missing encryption configuration"

**Symptoms:**
- Edge function logs show "CRITICAL: Missing KEY_SECRET environment variable"

**Solution:**
```bash
# Set the secret
npx supabase secrets set KEY_SECRET="<your-64-char-hex-secret>" --project-ref <PROJECT_REF>

# Redeploy affected functions
npx supabase functions deploy integration-health --project-ref <PROJECT_REF>
```

---

## Health Check Failures

### "not-configured" status for saved keys

**Symptoms:**
- Key appears saved but health check shows "not-configured"
- Database has the key but health check can't find it

**Possible Causes:**
1. Service name mismatch between client and server
2. Key saved to wrong table

**Solution:**
1. Check the `security_api_keys` table:
   ```sql
   SELECT service, key_ciphertext IS NOT NULL as has_key
   FROM security_api_keys
   ORDER BY service;
   ```

2. Verify service name normalization in `integration-health/index.ts`:
   ```typescript
   function normalizeServiceName(service: string): string {
     // Check mappings here
   }
   ```

---

### "error" status with no details

**Symptoms:**
- Health check returns generic error without useful information

**Solution:**
The integration-health function now includes detailed error messages. Check Edge Function logs:
```bash
# View recent logs in Supabase Dashboard
# https://supabase.com/dashboard/project/<PROJECT_REF>/functions
```

Or check the `system_logs` table:
```sql
SELECT * FROM system_logs
WHERE source = 'integration-health'
ORDER BY created_at DESC
LIMIT 20;
```

---

## UI Issues

### Save button spinner doesn't appear

**Symptoms:**
- Click Save, no spinner visible
- UI appears frozen for 1-2 seconds
- Spinner appears late

**Root Cause:**
PBKDF2 key derivation (100,000 iterations) blocks the main thread before React can render the loading state.

**Solution:**
Force a paint before starting encryption:
```typescript
const handleSave = useCallback(async () => {
  setIsSaveLoading(true);

  // Force React to paint the spinner before PBKDF2 blocks the thread
  await new Promise<void>(resolve => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });

  // Now do the CPU-intensive encryption
  const result = await save(inputValue);
  // ...
});
```

**Why double RAF?**
- First `requestAnimationFrame`: Schedules callback before next paint
- Second `requestAnimationFrame`: Ensures the paint actually happened
- Without this, React batches the state update with the blocking work

---

## Diagnostic Tools

### Edge Function Logging

The `crypto-server.ts` includes diagnostic logging:

```typescript
console.info('[crypto-server] KEY DIAGNOSTICS:', JSON.stringify({
  keySecretSet: !!keySecret,
  keySecretLength: keySecret?.length || 0,
  keySecretPrefix: keySecret ? keySecret.substring(0, 6) + '...' : 'NOT_SET',
  keySecretSuffix: keySecret ? '...' + keySecret.substring(keySecret.length - 6) : 'NOT_SET',
  ciphertextFormat: /* v2, DEV, v1, or GCM */,
}));
```

**Expected output for healthy setup:**
```json
{
  "keySecretSet": true,
  "keySecretLength": 64,
  "keySecretPrefix": "1817ac...",
  "keySecretSuffix": "...f8f42",
  "ciphertextFormat": "v2"
}
```

### Verifying Secrets Match

```bash
# Get expected digest for your secret
echo -n "YOUR_64_CHAR_HEX_SECRET" | sha256sum

# Compare with Supabase secrets list (shows digests)
npx supabase secrets list --project-ref <PROJECT_REF>
```

### Database Inspection

```sql
-- Check encrypted keys
SELECT
  service,
  LEFT(key_ciphertext, 20) as ciphertext_preview,
  CASE
    WHEN key_ciphertext LIKE 'v2:%' THEN 'v2 (PBKDF2)'
    WHEN key_ciphertext LIKE 'DEV.%' THEN 'DEV (insecure)'
    WHEN key_ciphertext LIKE '%:%:%' THEN 'v1 (legacy)'
    ELSE 'GCM (old)'
  END as format,
  last_used,
  created_at
FROM security_api_keys
ORDER BY service;
```

---

## Encryption Format Reference

| Format | Pattern | Security | Notes |
|--------|---------|----------|-------|
| v2 | `v2:salt:iv:ct:hmac` | Secure | PBKDF2 (100k iterations) |
| v1 | `iv:ct:hmac` | Legacy | SHA-256 key derivation |
| DEV | `DEV.base64` | Insecure | Dev-only, base64 encoded |
| GCM | `iv.ct+tag` | Legacy | AES-GCM without HMAC |

**Always use v2 format in production.**

---

## Quick Reference: Common Commands

```bash
# List secrets
npx supabase secrets list --project-ref <PROJECT_REF>

# Set a secret
npx supabase secrets set KEY_SECRET="..." --project-ref <PROJECT_REF>

# Deploy edge function
npx supabase functions deploy integration-health --project-ref <PROJECT_REF>

# View function in dashboard
open https://supabase.com/dashboard/project/<PROJECT_REF>/functions
```

---

## Related Files

- `src/lib/cryptoNative.ts` - Client encryption/decryption
- `src/features/admin/components/ApiKeyFormItem.tsx` - API key form UI
- `src/features/admin/services/apiKeyHealthService.ts` - Health check client
- `supabase/functions/_shared/crypto-server.ts` - Server decryption
- `supabase/functions/integration-health/index.ts` - Health check endpoint
