## Security Best Practices & Scanning

Comprehensive security guidance and automated vulnerability scanning for React Native mobile applications.

## Overview

This guide covers security best practices, common vulnerabilities, and automated security scanning tools for mobile applications built with React Native, Expo, and Supabase.

## OWASP Mobile Top 10 (2024)

### M1: Improper Platform Usage

Misuse of platform security features or failure to use them.

**Examples:**
- Not using iOS Keychain or Android Keystore
- Improper use of Touch ID/Face ID
- Ignoring platform security warnings

**Prevention:**

```typescript
// ✅ Use platform secure storage
import * as SecureStore from 'expo-secure-store'
await SecureStore.setItemAsync('token', authToken)

// ✅ Implement biometric auth properly
import * as LocalAuthentication from 'expo-local-authentication'

async function authenticateUser() {
  const hasHardware = await LocalAuthentication.hasHardwareAsync()
  const isEnrolled = await LocalAuthentication.isEnrolledAsync()

  if (!hasHardware || !isEnrolled) {
    // Fall back to password
    return await passwordAuth()
  }

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Authenticate to access sensitive data',
    fallbackLabel: 'Use Password',
  })

  return result.success
}
```

### M2: Insecure Data Storage

Storing sensitive data insecurely on the device.

**Examples:**
- Storing passwords in AsyncStorage
- Logging sensitive data
- Caching sensitive data unencrypted

**Prevention:**

```typescript
// ❌ DON'T store sensitive data in AsyncStorage
await AsyncStorage.setItem('password', password)

// ✅ DO use SecureStore
await SecureStore.setItemAsync('password', password)

// ❌ DON'T log sensitive data
console.log('User password:', password)

// ✅ DO log safely
console.log('User authenticated successfully')

// ❌ DON'T cache sensitive data unencrypted
const cachedData = await AsyncStorage.getItem('patient_data')

// ✅ DO encrypt cached data
const encrypted = await EncryptionService.getInstance().encrypt(patientData)
await AsyncStorage.setItem('patient_data', JSON.stringify(encrypted))
```

### M3: Insecure Communication

Not using TLS/SSL or improperly validating certificates.

**Prevention:**

```typescript
// ✅ Always use HTTPS
const API_URL = 'https://api.example.com' // Not http://

// ✅ Enforce TLS in Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  global: {
    headers: { 'X-Client-Info': 'mobile-app' },
  },
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
})

// ✅ Configure App Transport Security (iOS)
// In Info.plist:
// <key>NSAppTransportSecurity</key>
// <dict>
//   <key>NSAllowsArbitraryLoads</key>
//   <false/>
// </dict>

// ✅ Configure Network Security Config (Android)
// In android/app/src/main/res/xml/network_security_config.xml:
// <?xml version="1.0" encoding="utf-8"?>
// <network-security-config>
//   <base-config cleartextTrafficPermitted="false" />
// </network-security-config>
```

### M4: Insecure Authentication

Weak authentication mechanisms.

**Examples:**
- No password complexity requirements
- No rate limiting
- No MFA
- Storing auth tokens insecurely

**Prevention:**

```typescript
// ✅ Password complexity validation
function validatePassword(password: string): boolean {
  const minLength = 12
  const hasUppercase = /[A-Z]/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const hasNumber = /\d/.test(password)
  const hasSpecial = /[!@#$%^&*]/.test(password)

  return (
    password.length >= minLength &&
    hasUppercase &&
    hasLowercase &&
    hasNumber &&
    hasSpecial
  )
}

// ✅ Rate limiting on login attempts
const MAX_LOGIN_ATTEMPTS = 5
const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes

async function attemptLogin(email: string, password: string) {
  const attempts = await getLoginAttempts(email)

  if (attempts >= MAX_LOGIN_ATTEMPTS) {
    throw new Error('Account temporarily locked. Try again in 15 minutes.')
  }

  try {
    const result = await supabase.auth.signInWithPassword({ email, password })
    await resetLoginAttempts(email)
    return result
  } catch (error) {
    await incrementLoginAttempts(email)
    throw error
  }
}

// ✅ Implement MFA
async function enableMFA(userId: string) {
  const { data } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
  })

  return data
}
```

### M5: Insufficient Cryptography

Using weak or broken encryption algorithms.

**Prevention:**

```typescript
// ❌ DON'T use weak algorithms
import MD5 from 'crypto-js/md5'
const hash = MD5(data) // Broken

// ✅ DO use strong algorithms
import * as Crypto from 'expo-crypto'
const hash = await Crypto.digestStringAsync(
  Crypto.CryptoDigestAlgorithm.SHA256,
  data
)

// ❌ DON'T use custom encryption
function myEncrypt(data: string, key: string) {
  // Custom XOR encryption - INSECURE
  return data.split('').map((c, i) =>
    String.fromCharCode(c.charCodeAt(0) ^ key.charCodeAt(i % key.length))
  ).join('')
}

// ✅ DO use established libraries
import { EncryptionService } from '../encryption/EncryptionService'
const encrypted = await EncryptionService.getInstance().encrypt(data)
```

### M6: Insecure Authorization

Improper authorization checks.

**Examples:**
- Client-side only authorization
- No Row Level Security
- Trusting user input for permissions

**Prevention:**

```typescript
// ❌ DON'T rely on client-side checks only
if (userRole === 'admin') {
  await deleteUser(userId) // Can be bypassed
}

// ✅ DO enforce on server-side (Supabase RLS)
CREATE POLICY "admin_only_delete"
  ON users FOR DELETE
  USING (
    auth.uid() IN (
      SELECT user_id FROM admin_users
    )
  );

// ✅ Verify permissions before actions
async function deleteUser(userId: string) {
  // Check permission with server
  const { data: hasPermission } = await supabase.rpc('has_admin_permission', {
    user_id: auth.uid()
  })

  if (!hasPermission) {
    throw new Error('Unauthorized')
  }

  await supabase.from('users').delete().eq('id', userId)
}
```

### M7: Client Code Quality

Poor code quality leading to vulnerabilities.

**Prevention:**

```typescript
// ✅ Use TypeScript strict mode
// tsconfig.json:
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictPropertyInitialization": true
  }
}

// ✅ Input validation
function validateInput(input: unknown): string {
  if (typeof input !== 'string') {
    throw new Error('Invalid input type')
  }

  if (input.length > 1000) {
    throw new Error('Input too long')
  }

  // Sanitize special characters
  return input.replace(/[<>]/g, '')
}

// ✅ Avoid SQL injection
// Use parameterized queries
const { data } = await supabase
  .from('users')
  .select()
  .eq('email', userEmail) // Safe - uses parameters

// ❌ Never build queries with string concatenation
// const query = `SELECT * FROM users WHERE email = '${userEmail}'`
```

### M8: Code Tampering

Modifying app code or resources.

**Prevention:**

```typescript
// ✅ Detect jailbreak/root
import * as Device from 'expo-device'

async function checkDeviceIntegrity(): Promise<boolean> {
  // Check if device is jailbroken (iOS) or rooted (Android)
  const isJailbroken = await Device.isRootedExperimentalAsync()

  if (isJailbroken) {
    Alert.alert(
      'Security Warning',
      'This app cannot run on jailbroken/rooted devices.'
    )
    return false
  }

  return true
}

// ✅ Verify app signature
// Configure in app.json:
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.yourcompany.yourapp"
    },
    "android": {
      "package": "com.yourcompany.yourapp",
      "versionCode": 1
    }
  }
}

// ✅ Use code obfuscation for production
// metro.config.js:
module.exports = {
  transformer: {
    minifierConfig: {
      keep_classnames: true,
      keep_fnames: true,
      mangle: {
        keep_classnames: true,
        keep_fnames: true,
      },
    },
  },
}
```

### M9: Reverse Engineering

Extracting sensitive information from app binary.

**Prevention:**

```typescript
// ✅ Never hardcode secrets
// ❌ DON'T
const API_KEY = 'sk_live_abc123...'

// ✅ DO - use environment variables
const API_KEY = process.env.EXPO_PUBLIC_API_KEY

// ✅ Use code obfuscation
// expo build --no-bundler (then use custom bundler with obfuscation)

// ✅ Store sensitive logic server-side
// ❌ DON'T calculate prices client-side
const price = quantity * unitPrice * (1 - discount)

// ✅ DO calculate server-side
const { data: price } = await supabase.functions.invoke('calculate-price', {
  body: { quantity, productId }
})
```

### M10: Extraneous Functionality

Exposing unnecessary functionality that can be exploited.

**Prevention:**

```typescript
// ✅ Remove debug code in production
if (__DEV__) {
  console.log('Debug info:', data)
  // Debug functionality only in development
}

// ✅ Disable unnecessary features
const ENABLE_ADMIN_PANEL = __DEV__ // Only in development

// ✅ Remove test endpoints
// ❌ DON'T leave test code
if (process.env.NODE_ENV === 'test') {
  // app.post('/test/reset-database', resetDB)
}

// ✅ Minimize permissions
// Only request permissions you actually need
<uses-permission android:name="android.permission.CAMERA" />
// Don't request:
// <uses-permission android:name="android.permission.READ_CONTACTS" />
```

## Automated Security Scanning

Use the `SecurityScanner` service to automatically detect vulnerabilities:

```typescript
import { SecurityScanner } from '.examples/enterprise/security/SecurityScanner'

const scanner = SecurityScanner.getInstance()
const result = await scanner.scanProject('/path/to/project')

console.log(`Found ${result.summary.critical} critical issues`)
console.log(`Found ${result.summary.high} high-severity issues`)

// Generate report
const report = scanner.generateReport(result)
await FileSystem.writeAsStringAsync('security-report.md', report)
```

### Scans Performed

1. **Exposed Secrets**: API keys, tokens, passwords
2. **SQL Injection**: Unsafe query construction
3. **XSS**: Dangerous HTML rendering
4. **Insecure Network**: HTTP instead of HTTPS
5. **Weak Cryptography**: MD5, SHA1, weak algorithms
6. **Debug Code**: console.log, debugger statements

## Security Checklist

### Authentication & Authorization

- [ ] Password complexity requirements (12+ chars, mixed case, numbers, symbols)
- [ ] Rate limiting on login attempts
- [ ] Multi-factor authentication (MFA) available
- [ ] Secure session management (short timeouts, secure cookies)
- [ ] Row Level Security (RLS) enabled on all tables
- [ ] Server-side permission checks
- [ ] Principle of least privilege

### Data Protection

- [ ] Sensitive data encrypted at rest
- [ ] TLS/SSL for all network communication
- [ ] No hardcoded secrets or credentials
- [ ] Secure key storage (Keychain/Keystore)
- [ ] Data sanitization and validation
- [ ] No sensitive data in logs
- [ ] Secure clipboard handling

### Platform Security

- [ ] App Transport Security configured (iOS)
- [ ] Network Security Config (Android)
- [ ] Certificate pinning (if needed)
- [ ] Jailbreak/root detection
- [ ] Code obfuscation in production
- [ ] Screenshot prevention for sensitive screens
- [ ] Biometric authentication implemented

### Code Quality

- [ ] TypeScript strict mode enabled
- [ ] Input validation on all user inputs
- [ ] Parameterized queries (no SQL injection)
- [ ] No dangerouslySetInnerHTML (XSS prevention)
- [ ] Error handling doesn't leak sensitive info
- [ ] Dependencies up to date
- [ ] Security-focused code reviews

### Audit & Monitoring

- [ ] Comprehensive audit logging
- [ ] Security event monitoring
- [ ] Intrusion detection
- [ ] Automated security scanning
- [ ] Regular penetration testing
- [ ] Incident response plan

## Testing for Security

```typescript
describe('Security Tests', () => {
  it('should reject weak passwords', () => {
    expect(validatePassword('weak')).toBe(false)
    expect(validatePassword('StrongPass123!')).toBe(true)
  })

  it('should prevent SQL injection', async () => {
    const maliciousInput = "'; DROP TABLE users; --"

    await expect(
      supabase.from('users').select().eq('email', maliciousInput)
    ).not.toThrow()
    // Should safely handle as parameter, not execute SQL
  })

  it('should enforce HTTPS', () => {
    expect(API_URL).toMatch(/^https:\/\//)
  })

  it('should not expose secrets', () => {
    const sourceCode = fs.readFileSync('src/config.ts', 'utf-8')
    expect(sourceCode).not.toMatch(/sk_live_/)
    expect(sourceCode).not.toMatch(/pk_test_/)
  })

  it('should encrypt sensitive data', async () => {
    const plaintext = 'sensitive data'
    const encrypted = await encryption.encrypt(plaintext)

    expect(encrypted).not.toBe(plaintext)
    expect(encrypted).toHaveProperty('ciphertext')
    expect(encrypted).toHaveProperty('iv')
    expect(encrypted).toHaveProperty('tag')
  })
})
```

## Security Headers

Configure security headers for API requests:

```typescript
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  global: {
    headers: {
      'X-Client-Info': 'mobile-app/1.0.0',
      'X-Requested-With': 'XMLHttpRequest',
    },
  },
  db: {
    schema: 'public',
  },
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
})

// For custom API calls
const headers = {
  'Content-Type': 'application/json',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
}
```

## Common Vulnerabilities

### 1. Hardcoded Secrets

```typescript
// ❌ BAD
const OPENAI_API_KEY = 'sk-proj-abc123...'

// ✅ GOOD
const OPENAI_API_KEY = await SecureStore.getItemAsync('openai_api_key')
```

### 2. Insecure Random

```typescript
// ❌ BAD
const token = Math.random().toString(36)

// ✅ GOOD
const token = await Crypto.getRandomBytesAsync(32)
```

### 3. Missing Input Validation

```typescript
// ❌ BAD
function processInput(input: string) {
  return eval(input) // Code injection!
}

// ✅ GOOD
function processInput(input: unknown): string {
  if (typeof input !== 'string') {
    throw new Error('Invalid input')
  }

  if (input.length > 1000) {
    throw new Error('Input too long')
  }

  return sanitize(input)
}
```

### 4. Insufficient Session Timeout

```typescript
// ❌ BAD - sessions never expire
const SESSION_TIMEOUT = Infinity

// ✅ GOOD - 15-minute timeout for sensitive apps
const SESSION_TIMEOUT = 15 * 60 * 1000

let lastActivity = Date.now()

function resetSessionTimer() {
  lastActivity = Date.now()
}

function checkSession() {
  if (Date.now() - lastActivity > SESSION_TIMEOUT) {
    logout()
  }
}
```

## Penetration Testing

### Internal Testing

Run regular security scans:

```bash
# 1. Dependency vulnerability scan
npm audit

# 2. Static code analysis
npm run lint

# 3. Type checking
npx tsc --noEmit

# 4. Security scanner
npm run security-scan
```

### External Testing

Consider hiring security professionals for:
- Penetration testing
- Security audits
- Code reviews
- Compliance assessments

## Incident Response

### 1. Detection

Monitor for security events:

```typescript
// Alert on critical security events
const subscription = supabase
  .channel('security_alerts')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'security_events',
      filter: 'severity=eq.critical',
    },
    (payload) => {
      sendSecurityAlert(payload.new)
    }
  )
  .subscribe()
```

### 2. Response Plan

1. **Contain**: Isolate affected systems
2. **Investigate**: Determine scope and impact
3. **Remediate**: Fix vulnerability
4. **Notify**: Alert affected users and authorities
5. **Document**: Record incident details
6. **Review**: Update security procedures

## Resources

### Security Standards

- [OWASP Mobile Security Project](https://owasp.org/www-project-mobile-top-10/)
- [OWASP Mobile Application Security](https://mas.owasp.org/)
- [CWE/SANS Top 25](https://cwe.mitre.org/top25/)

### Tools

- [MobSF](https://github.com/MobSF/Mobile-Security-Framework-MobSF) - Mobile security testing
- [npm audit](https://docs.npmjs.com/cli/v8/commands/npm-audit) - Dependency scanning
- [Snyk](https://snyk.io/) - Vulnerability scanning

### Related Documentation

- [Audit Logging](../audit/README.md)
- [Data Encryption](../encryption/README.md)
- [GDPR Compliance](../compliance/gdpr/README.md)
- [HIPAA Compliance](../compliance/hipaa/README.md)

---

**Last Updated**: 2025-01-15
**Version**: 1.0.0
**Framework**: OWASP Mobile Top 10 (2024)
