# Security Checklist (Pre-Launch Audit)

Based on [OWASP Mobile Application Security](https://mas.owasp.org/) and adapted for React Native + Expo + Supabase.

---

## Critical: Authentication

### No Hardcoded Credentials

- [ ] **No API keys in source code.** Search the entire codebase for patterns like `sk-`, `sk_live`, `password`, `secret`, `token`, `api_key`.

```bash
# Scan for secrets in the codebase
npx gitleaks detect --source . --verbose
# Or
npx trufflehog filesystem . --no-update
```

- [ ] **No secrets in app config.** Check `app.json`, `app.config.js`, and `eas.json` for hardcoded values.
- [ ] **`.env` files are in `.gitignore`.** Verify with `git ls-files | grep -i env` (should return nothing).
- [ ] **No credentials in git history.** If secrets were ever committed, rotate them immediately and clean git history.

### Secure Session Management

- [ ] **Use Supabase Auth for all authentication.** Do not implement custom auth.
- [ ] **Session tokens have reasonable expiry.** Supabase default is 1 hour for access tokens with refresh tokens.
- [ ] **Refresh token rotation is enabled.** Old refresh tokens are invalidated when a new one is issued.
- [ ] **Logout clears all tokens** from SecureStore and AsyncStorage.

```typescript
// Verify logout is complete
async function handleLogout() {
  await supabase.auth.signOut();
  await SecureStore.deleteItemAsync('auth_token');
  await SecureStore.deleteItemAsync('refresh_token');
  // Clear any cached data
  queryClient.clear(); // If using React Query
}
```

- [ ] **Session timeout on inactivity** (15-30 minutes for sensitive apps).
- [ ] **Rate limiting on login attempts** (5 per 15 minutes).

### Password Security

- [ ] **Minimum password length enforced.** At least 8 characters (NIST recommends allowing up to 64).
- [ ] **Password strength indicator** shown during signup (optional but recommended).
- [ ] **Breached password checking.** Use HaveIBeenPwned API or Supabase's built-in password strength checks.

### Multi-Factor Authentication

- [ ] **MFA option available for users.** Supabase supports TOTP-based MFA.
- [ ] **MFA required for admin accounts.** Enforce MFA for any user with elevated privileges.

```typescript
// Enable MFA enrollment
const { data, error } = await supabase.auth.mfa.enroll({
  factorType: 'totp',
});

// Verify MFA during login
const { data, error } = await supabase.auth.mfa.verify({
  factorId: factorId,
  code: totpCode,
});
```

---

## Critical: Data Protection

### Row Level Security (RLS)

- [ ] **RLS is enabled on ALL tables.** No table should be accessible without RLS policies.

```sql
-- Verify RLS is enabled on all tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
-- All rows should show rowsecurity = true
```

- [ ] **Every table has appropriate policies.** At minimum: users can read/write their own data.
- [ ] **Test RLS policies.** Attempt to access another user's data from the client and verify it is denied.
- [ ] **No `USING (true)` policies** except on truly public data.

### Service Role Key Protection

- [ ] **Service role key (`service_role`) is NEVER in client code.** It bypasses RLS.
- [ ] **Service role key is only used in server-side code** (Supabase Edge Functions).
- [ ] **Anon key is used in the client** with RLS protecting all data access.

### Secure Storage

- [ ] **Sensitive data stored in SecureStore** (uses iOS Keychain / Android Keystore).
- [ ] **Never store secrets in AsyncStorage** (it's not encrypted).

```typescript
import * as SecureStore from 'expo-secure-store';

// Store sensitive data
await SecureStore.setItemAsync('auth_token', token);

// Retrieve
const token = await SecureStore.getItemAsync('auth_token');

// Delete
await SecureStore.deleteItemAsync('auth_token');
```

| Data | Storage | Reason |
|------|---------|--------|
| Auth tokens | SecureStore | Sensitive |
| API keys | Server-side only | Never in app |
| User preferences | AsyncStorage | Not sensitive |
| Cache | AsyncStorage | Not sensitive |
| Biometric state | SecureStore | Security-related |

### HTTPS Enforcement

- [ ] **All traffic uses HTTPS.** Supabase enforces HTTPS by default.
- [ ] **No HTTP calls in app** even for development.
- [ ] **Certificate pinning for sensitive operations** (optional, high-security apps).

---

## Critical: API Security

### Input Validation

- [ ] **All user inputs are validated server-side.** Client-side validation is for UX only.
- [ ] **Type checking on all API parameters.** Use Zod schema validation.

```typescript
// Example: Zod validation in Edge Function
import { z } from 'zod';

const CreateTaskSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  description: z.string().max(1000).optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
});

// In handler:
const body = CreateTaskSchema.parse(await req.json());
```

- [ ] **SQL injection prevented.** Use parameterized queries (Supabase client handles this automatically). Never concatenate user input into SQL strings.
- [ ] **Max input length enforced** (prevent DoS attacks).
- [ ] **File upload validation.** Check file type, size, and content (not just extension).

### Rate Limiting

- [ ] **Rate limiting on all public endpoints.** Especially auth, AI, and form submission endpoints.
- [ ] **Different rate limits per endpoint sensitivity.** Auth: strict. API: moderate.
- [ ] **Rate limit by both device ID and user ID.**
- [ ] **Cost caps for AI features** to prevent abuse.

### CORS Configuration

- [ ] **CORS is configured in Edge Functions** to allow only your domains.

```typescript
// Supabase Edge Function CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://yourdomain.com', // NOT '*'
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Request-ID',
  'Access-Control-Max-Age': '86400',
};

// Handle preflight
if (req.method === 'OPTIONS') {
  return new Response(null, { headers: corsHeaders });
}
```

- [ ] **Wildcard origin (`*`) is NOT used in production.** Specify exact origins.
- [ ] **Preflight requests (OPTIONS) are handled correctly.**

---

## Critical: Code Security

### No Secrets in App Bundle

- [ ] **Verify no secrets in the production build.** After building, inspect the bundle:

```bash
# Build the application
eas build --platform all --profile production

# Check what's bundled (use expo-updates asset inspection)
# Or manually review app.json "extra" config
```

- [ ] **Only `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`** appear in client code.
- [ ] **EAS secrets used for sensitive build-time values.**

### Dependency Audit

- [ ] **Run `npm audit` and fix critical/high vulnerabilities.**

```bash
npm audit
npm audit fix

# Check for specific severity
npm audit --audit-level=high
```

- [ ] **No dependencies with known critical vulnerabilities** ship to production.
- [ ] **Dependency lock file is committed.** `package-lock.json` is in version control.
- [ ] **Dependabot is enabled** for automatic dependency update PRs.

---

## High: Mobile-Specific Security

### Device Security

- [ ] **Jailbreak/root detection** (optional, for high-security apps).
- [ ] **Debugger detection** (optional).
- [ ] **Screen capture prevention** for sensitive screens (banking, health data).

```typescript
// Prevent screenshots on sensitive screens (Android)
import * as ScreenCapture from 'expo-screen-capture';

useEffect(() => {
  ScreenCapture.preventScreenCaptureAsync();
  return () => {
    ScreenCapture.allowScreenCaptureAsync();
  };
}, []);
```

### Biometric Authentication

- [ ] **Use expo-local-authentication for biometrics.**
- [ ] **Fallback to PIN/password** when biometrics unavailable.
- [ ] **Don't store actual credentials** - store auth tokens.

```typescript
import * as LocalAuthentication from 'expo-local-authentication';

const hasHardware = await LocalAuthentication.hasHardwareAsync();
const isEnrolled = await LocalAuthentication.isEnrolledAsync();

const result = await LocalAuthentication.authenticateAsync({
  promptMessage: 'Authenticate to continue',
  fallbackLabel: 'Use Passcode',
});
```

### Deep Link Security

- [ ] **Validate all deep link parameters** before using.
- [ ] **Don't pass sensitive data in deep links.**
- [ ] **Use universal links (iOS) / app links (Android)** for sensitive flows.

---

## High: AI Security

See `PROMPT-INJECTION-SECURITY.md` for full AI security checklist.

- [ ] **Jailbreak detection** for AI prompts.
- [ ] **Output validation** - don't trust AI responses blindly.
- [ ] **Rate limiting** per device for AI features.
- [ ] **Cost caps** to prevent abuse.
- [ ] **Content moderation** for user-generated prompts.

---

## Automated Security Checks

### npm audit in CI/CD

```yaml
# .github/workflows/security.yml
name: Security Audit

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 9 * * 1'  # Weekly on Monday at 9 AM UTC

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run npm audit
        run: npm audit --audit-level=high
        continue-on-error: false

      - name: Run dependency license check
        run: npx license-checker --failOn 'GPL-3.0;AGPL-3.0'
```

### Secret Scanning (Gitleaks)

```yaml
# .github/workflows/secret-scan.yml
name: Secret Scanning

on:
  push:
    branches: [main]
  pull_request:

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Full history for scanning

      - name: Run Gitleaks
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### SAST (Static Application Security Testing)

```yaml
# .github/workflows/sast.yml
name: SAST

on:
  push:
    branches: [main]
  pull_request:

jobs:
  semgrep:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Semgrep
        uses: returntocorp/semgrep-action@v1
        with:
          config: >-
            p/javascript
            p/typescript
            p/react
            p/react-native
            p/owasp-top-ten
```

---

## Dependency Scanning

### Dependabot Configuration

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
    open-pull-requests-limit: 10
    labels:
      - "dependencies"
      - "security"
    groups:
      production-dependencies:
        dependency-type: "production"
        update-types:
          - "minor"
          - "patch"
      development-dependencies:
        dependency-type: "development"
        update-types:
          - "minor"
          - "patch"
```

### GitHub Security Advisories

- [ ] **Enable Dependabot alerts** in repository settings.
- [ ] **Enable Dependabot security updates** for automatic PR creation.
- [ ] **Enable code scanning** (GitHub Advanced Security or free Semgrep).
- [ ] **Enable secret scanning** in repository settings.

---

## Security Headers (Edge Functions)

```typescript
// supabase/functions/_shared/headers.ts

export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Request-ID': crypto.randomUUID(),
};

export const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || '',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type, x-request-id',
};

export function withHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  Object.entries({ ...securityHeaders, ...corsHeaders }).forEach(([k, v]) => {
    headers.set(k, v);
  });
  return new Response(response.body, {
    status: response.status,
    headers,
  });
}
```

---

## Monitoring & Alerting

### Error Tracking (Sentry)

```typescript
// sentry.config.ts
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  environment: __DEV__ ? 'development' : 'production',

  // Security-relevant options
  beforeSend(event) {
    // Strip PII from error reports
    if (event.user) {
      delete event.user.email;
      delete event.user.ip_address;
    }
    return event;
  },

  // Don't send in development
  enabled: !__DEV__,
});
```

### Security Event Logging

- [ ] **Log authentication events** (login, logout, failed attempts).
- [ ] **Log authorization failures** (RLS denials, permission errors).
- [ ] **Log rate limit hits.**
- [ ] **Alert on anomalies** (unusual login locations, multiple failed attempts).

```typescript
// services/securityLogger.ts
export async function logSecurityEvent(event: {
  type: 'auth_failure' | 'rate_limit' | 'permission_denied' | 'suspicious_activity';
  userId?: string;
  deviceId: string;
  details: Record<string, unknown>;
}) {
  await supabase.from('security_events').insert({
    event_type: event.type,
    user_id: event.userId,
    device_id: event.deviceId,
    details: event.details,
    timestamp: new Date().toISOString(),
  });
}
```

---

## Known Vulnerabilities Disclosure

Document known risks in your app:

```markdown
## Known Vulnerabilities (MVP - Accepted Risk)

| Risk | Severity | Mitigation | Fix Timeline |
|------|----------|------------|--------------|
| Device ID spoofing | Medium | Anomaly detection | v1.2 |
| No MFA | Low | Strong passwords required | v1.3 |
| No cert pinning | Low | HTTPS + token auth | Future |
```

---

## Incident Response

If a security issue is found:

1. **Assess severity** (Critical/High/Medium/Low)
2. **Notify users** if data was compromised
3. **Fix and deploy** immediately for Critical/High
4. **Document** in incident report
5. **Review** how it happened
6. **Prevent** future occurrences

See `docs/13-lifecycle/INCIDENT-RESPONSE.md` for full incident response procedures.

---

## Complete Pre-Launch Checklist

### Critical (Must Do Before Launch)

- [ ] No secrets in client code or git history
- [ ] RLS enabled and tested on all Supabase tables
- [ ] Service role key only on server-side (Edge Functions)
- [ ] HTTPS enforced for all API calls
- [ ] Input validation on all API endpoints
- [ ] Rate limiting on auth and AI endpoints
- [ ] CORS configured with specific origins
- [ ] `npm audit` shows no critical or high vulnerabilities
- [ ] Secure token storage (SecureStore, not AsyncStorage)

### High (Within First Sprint)

- [ ] Secret scanning (gitleaks) in CI/CD pipeline
- [ ] SAST scanning (semgrep) in CI/CD pipeline
- [ ] Dependabot enabled for dependency updates
- [ ] MFA available for user accounts
- [ ] Biometric authentication for sensitive operations
- [ ] Error tracking (Sentry) configured without PII
- [ ] Security event logging enabled

### Medium (Ongoing)

- [ ] Weekly npm audit reviews
- [ ] Monthly security review of RLS policies
- [ ] Quarterly penetration testing or security review
- [ ] Regular review of security event logs
- [ ] Incident response plan tested

### Monitoring

- [ ] Security event alerts configured
- [ ] Rate limit hit alerts set up
- [ ] Dependency vulnerability alerts enabled
- [ ] App store security review requirements met
- [ ] Regular review of Sentry error patterns

---

## Checklist Before Each Release

- [ ] `npm audit` passes with no high/critical issues
- [ ] No new secrets added to code
- [ ] RLS policies reviewed for new tables
- [ ] Rate limits tested for new endpoints
- [ ] Error messages don't leak sensitive info
- [ ] Logout properly clears all data
- [ ] Deep links validated for new routes
- [ ] AI prompts sanitized for new AI features
