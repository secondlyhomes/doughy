## Data Encryption Guide

Comprehensive encryption implementation for React Native mobile applications.

## Overview

This guide covers multiple encryption strategies for protecting sensitive data in mobile applications:

1. **Device-level encryption** (Secure Store)
2. **End-to-end encryption** (E2EE)
3. **Field-level encryption**
4. **Database encryption**
5. **Transport encryption** (TLS/SSL)

## Quick Start

### Initialize Encryption Service

```typescript
import { EncryptionService } from '.examples/enterprise/encryption/EncryptionService'

// Initialize on app startup
const encryption = EncryptionService.getInstance()
await encryption.initialize()
```

### Encrypt Data

```typescript
// Encrypt string data
const encrypted = await encryption.encrypt('sensitive data')
console.log(encrypted)
// {
//   ciphertext: 'base64-encoded-data',
//   iv: 'initialization-vector',
//   tag: 'authentication-tag',
//   algorithm: 'AES-256-GCM',
//   version: 'v1'
// }

// Decrypt data
const plaintext = await encryption.decrypt(encrypted)
```

### Use React Hook

```typescript
import { useEncryption } from '.examples/enterprise/encryption/EncryptionService'

function MyComponent() {
  const { ready, encrypt, decrypt, secureSet, secureGet } = useEncryption()

  if (!ready) return <Text>Initializing encryption...</Text>

  const handleSave = async () => {
    // Encrypt field
    const encrypted = await encrypt(sensitiveData)

    // Or use secure storage directly
    await secureSet('api_key', apiKey)
  }
}
```

## Encryption Levels

### 1. Device-Level Encryption (Secure Store)

Encrypt data stored on the device using the platform's secure storage.

**iOS**: Keychain
**Android**: Keystore

```typescript
// Store sensitive data securely
await encryption.secureSet('auth_token', authToken)
await encryption.secureSet('api_key', apiKey)

// Retrieve secure data
const token = await encryption.secureGet('auth_token')

// Delete secure data
await encryption.secureDelete('auth_token')
```

**Best For:**
- API tokens
- Auth credentials
- Encryption keys
- Biometric data

**Security Features:**
- Hardware-backed encryption (when available)
- Protected by device passcode/biometric
- Cannot be accessed by other apps
- Backed up securely (iOS Keychain)

### 2. End-to-End Encryption (E2EE)

Encrypt data before sending to server so only the recipient can decrypt.

```typescript
// Generate key pair
const keyPair = await encryption.generateKeyPair()

// Store private key securely
await encryption.secureSet('private_key', keyPair.privateKey)

// Share public key with server
await uploadPublicKey(keyPair.publicKey)

// Encrypt message for recipient
const encryptedMessage = await encryptForRecipient(
  message,
  recipientPublicKey
)

// Send encrypted message
await sendMessage(recipientId, encryptedMessage)
```

**Best For:**
- Private messages
- Sensitive file sharing
- Healthcare communications
- Financial data

**Note**: Full E2EE implementation requires additional libraries (e.g., react-native-rsa-native, libsodium).

### 3. Field-Level Encryption

Encrypt specific fields before storing in database.

```typescript
// Encrypt individual field
const encryptedSSN = await encryption.encryptField(ssn)

// Encrypt multiple fields in object
const patient = {
  name: 'John Doe',
  ssn: '123-45-6789',
  diagnosis: 'Hypertension',
}

const encrypted = await encryption.encryptObject(patient, ['ssn', 'diagnosis'])

// Save to database
await supabase.from('patients').insert(encrypted)

// Later, decrypt fields
const decrypted = await encryption.decryptObject(
  dbRecord,
  ['ssn', 'diagnosis']
)
```

**Best For:**
- PHI/PII data
- Sensitive user data
- Financial information
- Personal identifiers

### 4. Database Encryption

Encrypt data at the database level using PostgreSQL pgcrypto.

See: `.examples/enterprise/encryption/database/schema.sql`

```sql
-- Encrypt data
INSERT INTO users (name, ssn_encrypted)
VALUES (
  'John Doe',
  encrypt_data('123-45-6789', current_setting('app.encryption_key'))
);

-- Decrypt data (authorized users only)
SELECT
  name,
  decrypt_data(ssn_encrypted, current_setting('app.encryption_key')) as ssn
FROM users
WHERE id = 'user-id';
```

**Best For:**
- Compliance requirements (HIPAA, GDPR)
- Multi-tenant applications
- Highly sensitive data
- Regulatory audits

### 5. Transport Encryption (TLS/SSL)

All network traffic must use HTTPS/TLS.

```typescript
// Supabase automatically uses HTTPS
const supabase = createClient(
  'https://your-project.supabase.co', // HTTPS only
  SUPABASE_ANON_KEY
)

// Enforce HTTPS for custom API calls
async function apiCall(endpoint: string) {
  if (!endpoint.startsWith('https://')) {
    throw new Error('Only HTTPS connections allowed')
  }

  return await fetch(endpoint)
}
```

**Best For:**
- All network communications
- API calls
- File uploads
- Real-time connections

## Encryption Algorithms

### Recommended Algorithms

**Symmetric Encryption (Data):**
- AES-256-GCM (recommended)
- ChaCha20-Poly1305

**Asymmetric Encryption (Key Exchange):**
- RSA-OAEP-2048 (minimum)
- RSA-4096 (recommended)
- ECIES (elliptic curve)

**Hashing:**
- SHA-256 (general purpose)
- SHA-512 (higher security)
- bcrypt (passwords)
- scrypt/Argon2 (password hashing)

### Avoid These Algorithms

- ❌ MD5 (broken)
- ❌ SHA-1 (weaknesses found)
- ❌ DES, 3DES (too short key length)
- ❌ RC4 (broken)
- ❌ ECB mode (insecure)

## Hashing

### General Purpose Hashing

```typescript
// SHA-256 hash
const hash = await encryption.hash('data to hash', 'SHA256')

// SHA-512 hash
const hash512 = await encryption.hash('data to hash', 'SHA512')
```

### Password Hashing

```typescript
// Hash password with salt
const hashedPassword = await encryption.hashPassword('user-password')
// Returns: "salt:hash"

// Verify password
const isValid = await encryption.verifyPassword('user-password', hashedPassword)
// Returns: true
```

**Best Practice**: Use bcrypt/scrypt/Argon2 for password hashing (requires additional library).

## Key Management

### Master Key

The master encryption key is stored in device secure storage:

```typescript
// Generated on first launch
await encryption.initialize()

// Master key stored in:
// iOS: Keychain
// Android: Keystore
```

### Data Encryption Keys (DEK)

Generate unique keys for each piece of encrypted data:

```typescript
// Generate data key
const dataKey = await encryption.generateDataKey()

// Encrypt data with data key
const encrypted = await encryptWithKey(data, dataKey)

// Encrypt data key with master key
const encryptedKey = await encryption.encrypt(dataKey)

// Store encrypted data and encrypted key
await save({ data: encrypted, key: encryptedKey })
```

### Key Rotation

Periodically rotate encryption keys for security:

```typescript
// Rotate master key
await encryption.rotateKeys()

// This creates a new master key and re-encrypts all data
```

**Rotation Schedule:**
- Master keys: Annually
- Data keys: When compromised
- API keys: Quarterly or when staff leaves

## Secure Storage

### Store Sensitive Configuration

```typescript
// Store API keys
await encryption.secureSet('openai_api_key', process.env.OPENAI_API_KEY)
await encryption.secureSet('stripe_key', process.env.STRIPE_SECRET_KEY)

// Retrieve at runtime
const apiKey = await encryption.secureGet('openai_api_key')
```

### Never Hard-Code Secrets

```typescript
// ❌ DON'T DO THIS
const API_KEY = 'sk_live_abcd1234...'

// ✅ DO THIS
const API_KEY = await encryption.secureGet('api_key')

// Or use environment variables
const API_KEY = process.env.API_KEY
```

## Best Practices

### 1. Encrypt Sensitive Data

Always encrypt:
- ✅ Passwords
- ✅ API keys and tokens
- ✅ Personal identifiers (SSN, passport, etc.)
- ✅ Financial information
- ✅ Health information (PHI)
- ✅ Biometric data
- ✅ Private messages
- ✅ Location data (if sensitive)

Don't need to encrypt:
- ❌ Public user profile (name, avatar)
- ❌ Non-sensitive app settings
- ❌ Public content
- ❌ Non-identifiable analytics

### 2. Use Authentication Tags

Always verify data integrity with authentication tags (AEAD):

```typescript
// AES-GCM provides authenticated encryption
const encrypted = await encryption.encrypt(data)

// Decryption automatically verifies tag
try {
  const decrypted = await encryption.decrypt(encrypted)
} catch {
  // Tag verification failed - data was tampered with
  throw new Error('Data integrity check failed')
}
```

### 3. Generate Random IVs

Never reuse initialization vectors:

```typescript
// ✅ Good - generates random IV each time
const iv = await Crypto.getRandomBytesAsync(12)

// ❌ Bad - static IV
const iv = 'same-iv-every-time'
```

### 4. Use Secure Random Numbers

```typescript
// ✅ Use cryptographically secure random
import * as Crypto from 'expo-crypto'
const randomBytes = await Crypto.getRandomBytesAsync(32)

// ❌ Don't use Math.random() for security
const random = Math.random() // NOT cryptographically secure
```

### 5. Protect Keys

```typescript
// ✅ Store in secure storage
await SecureStore.setItemAsync('encryption_key', key)

// ❌ Never store in AsyncStorage
await AsyncStorage.setItem('encryption_key', key) // INSECURE

// ❌ Never log keys
console.log('Key:', key) // NEVER DO THIS

// ❌ Never commit keys to git
const KEY = 'hardcoded-key' // NEVER DO THIS
```

### 6. Clear Sensitive Data from Memory

```typescript
// Clear sensitive data when done
let password = 'user-password'
// ... use password ...

// Clear from memory
password = ''
password = null
```

## Platform-Specific Considerations

### iOS

**Keychain:**
- Automatic encryption
- Backed up to iCloud (with encryption)
- Can be protected by biometric/passcode
- Survives app reinstall

**App Transport Security:**
- Enforces HTTPS by default
- Can be configured in Info.plist

### Android

**Keystore:**
- Hardware-backed encryption (when available)
- Not backed up by default
- Cleared on app uninstall
- Can require biometric unlock

**Network Security Config:**
- Configure in android/app/src/main/res/xml/network_security_config.xml
- Enforce TLS versions

### Web

**Web Crypto API:**
- Available in modern browsers
- No secure storage (use IndexedDB with encryption)
- localStorage is NOT secure

## Common Pitfalls

### ❌ Mistake 1: Using Weak Algorithms

```typescript
// ❌ DON'T
import MD5 from 'crypto-js/md5'
const hash = MD5(password)

// ✅ DO
const hash = await Crypto.digestStringAsync(
  Crypto.CryptoDigestAlgorithm.SHA256,
  password
)
```

### ❌ Mistake 2: Storing Keys Insecurely

```typescript
// ❌ DON'T
await AsyncStorage.setItem('encryption_key', key)

// ✅ DO
await SecureStore.setItemAsync('encryption_key', key)
```

### ❌ Mistake 3: Not Using HTTPS

```typescript
// ❌ DON'T
const response = await fetch('http://api.example.com/data')

// ✅ DO
const response = await fetch('https://api.example.com/data')
```

### ❌ Mistake 4: Logging Sensitive Data

```typescript
// ❌ DON'T
console.log('User password:', password)
console.log('API response:', apiResponse) // May contain sensitive data

// ✅ DO
console.log('User authenticated successfully')
console.log('API call completed')
```

### ❌ Mistake 5: Not Handling Decryption Errors

```typescript
// ❌ DON'T
const decrypted = await encryption.decrypt(data)

// ✅ DO
try {
  const decrypted = await encryption.decrypt(data)
} catch (error) {
  // Data may be corrupted or tampered with
  console.error('Decryption failed:', error)
  // Handle error appropriately
}
```

## Testing

```typescript
describe('Encryption', () => {
  it('should encrypt and decrypt data', async () => {
    const plaintext = 'sensitive data'
    const encrypted = await encryption.encrypt(plaintext)
    const decrypted = await encryption.decrypt(encrypted)

    expect(decrypted).toBe(plaintext)
  })

  it('should fail on tampered data', async () => {
    const encrypted = await encryption.encrypt('data')

    // Tamper with ciphertext
    encrypted.ciphertext = 'tampered'

    await expect(encryption.decrypt(encrypted)).rejects.toThrow()
  })

  it('should use different IVs', async () => {
    const encrypted1 = await encryption.encrypt('data')
    const encrypted2 = await encryption.encrypt('data')

    expect(encrypted1.iv).not.toBe(encrypted2.iv)
  })
})
```

## Compliance

### HIPAA

- ✅ Encrypt ePHI at rest
- ✅ Encrypt ePHI in transit
- ✅ Use strong encryption algorithms
- ✅ Implement key management
- ✅ Document encryption methods

### GDPR

- ✅ Encrypt personal data (recommended)
- ✅ Pseudonymization
- ✅ Technical safeguards
- ✅ Encryption for data transfer

### PCI DSS

- ✅ Encrypt cardholder data at rest
- ✅ Encrypt transmission over public networks
- ✅ Strong cryptography (AES-256)
- ✅ Key management procedures

## Performance Considerations

### Encryption Overhead

Encryption adds computational overhead:
- AES-256: ~10-50ms per operation
- RSA: ~100-500ms per operation
- Hashing: ~1-10ms per operation

### Optimization Tips

```typescript
// 1. Batch encrypt when possible
const fields = ['field1', 'field2', 'field3']
await encryption.encryptObject(data, fields)

// 2. Cache decrypted data (securely)
const cache = new Map()

async function getDecryptedData(id: string) {
  if (cache.has(id)) {
    return cache.get(id)
  }

  const decrypted = await encryption.decrypt(encrypted)
  cache.set(id, decrypted)
  return decrypted
}

// 3. Use lazy decryption
// Only decrypt when needed, not on load

// 4. Consider encryption granularity
// Encrypt fields vs. entire records
```

## Troubleshooting

### "Decryption failed"

- Check if using correct key version
- Verify data hasn't been corrupted
- Ensure key hasn't been rotated

### "SecureStore not available"

- Web platform doesn't have SecureStore
- Use alternative (encrypted localStorage)

### "Invalid key"

- Key may have been cleared
- Check device security settings
- Reinitialize encryption service

## Resources

### Official Documentation

- [Expo Crypto](https://docs.expo.dev/versions/latest/sdk/crypto/)
- [Expo SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/)
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)

### Standards & Specifications

- [NIST Cryptographic Standards](https://csrc.nist.gov/projects/cryptographic-standards-and-guidelines)
- [OWASP Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)

### Related Documentation

- [Security Best Practices](../security/README.md)
- [HIPAA Compliance](../compliance/hipaa/README.md)
- [GDPR Compliance](../compliance/gdpr/README.md)

---

**Last Updated**: 2025-01-15
**Version**: 1.0.0
**Algorithms**: AES-256-GCM, SHA-256, RSA-OAEP
