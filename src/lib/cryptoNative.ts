// src/lib/cryptoNative.ts
// Encryption utilities for React Native
// Uses AES-256-CBC with HMAC-SHA256 for authenticated encryption
// Compatible with server-side decryption

import 'react-native-get-random-values';
import * as Crypto from 'expo-crypto';
import CryptoJS from 'crypto-js';
import Constants from 'expo-constants';

/**
 * Get encryption secret from environment variables
 * Checks multiple possible sources for compatibility
 */
function getEncryptionSecret(): string {
  const secret =
    Constants.expoConfig?.extra?.EXPO_PUBLIC_ENCRYPTION_SECRET ||
    process.env.EXPO_PUBLIC_ENCRYPTION_SECRET ||
    Constants.expoConfig?.extra?.ENCRYPTION_SECRET ||
    process.env.ENCRYPTION_SECRET;

  if (!secret) {
    throw new Error(
      'Missing EXPO_PUBLIC_ENCRYPTION_SECRET environment variable. ' +
      'Create a .env file with EXPO_PUBLIC_ENCRYPTION_SECRET=<your-32-char-hex-string> ' +
      'Run: openssl rand -hex 16 to generate a secure key.'
    );
  }

  return secret;
}

/**
 * Derive a 256-bit key from the encryption secret using SHA-256
 * DEPRECATED: Use deriveKeyPBKDF2 for new encryptions (more secure)
 * This function kept for backward compatibility with v1 encrypted data
 */
async function deriveKeyLegacy(secret: string): Promise<string> {
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    secret,
    { encoding: Crypto.CryptoEncoding.HEX }
  );
  return digest;
}

/**
 * Derive a 256-bit key using PBKDF2 (100,000 iterations)
 * This is the secure key derivation function for v2 encryption format
 *
 * @param secret - The encryption secret
 * @param salt - Random salt (16 bytes)
 * @returns Derived key as hex string
 */
async function deriveKeyPBKDF2(secret: string, salt: CryptoJS.lib.WordArray): Promise<string> {
  // PBKDF2 with 100,000 iterations (OWASP recommended minimum)
  const key256Bits = CryptoJS.PBKDF2(secret, salt, {
    keySize: 256 / 32, // 256 bits = 8 words
    iterations: 100000,
    hasher: CryptoJS.algo.SHA256
  });

  return key256Bits.toString(CryptoJS.enc.Hex);
}

/**
 * Generate random bytes as hex string
 */
async function randomBytesHex(length: number): Promise<string> {
  const bytes = await Crypto.getRandomBytesAsync(length);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Encrypts a string using AES-256-CBC with HMAC-SHA256 and PBKDF2 key derivation
 * Format v2: v2:${salt_base64}:${iv_base64}:${ciphertext_base64}:${hmac_hex}
 *
 * Uses crypto-js with PBKDF2 (100,000 iterations) for secure key derivation
 *
 * @param plaintext - The string to encrypt
 * @returns Encrypted string in v2 format with salt, iv, ciphertext, and hmac
 */
export async function encrypt(plaintext: string): Promise<string> {
  try {
    const secret = getEncryptionSecret();

    // Generate random 16-byte salt for PBKDF2
    const saltBytes = await Crypto.getRandomBytesAsync(16);
    const salt = CryptoJS.lib.WordArray.create(Array.from(saltBytes));

    // Derive key using PBKDF2 (secure, slow by design)
    const key = await deriveKeyPBKDF2(secret, salt);

    // Generate random 16-byte IV for AES-CBC
    const ivBytes = await Crypto.getRandomBytesAsync(16);
    const iv = CryptoJS.lib.WordArray.create(Array.from(ivBytes));

    // Encrypt using crypto-js AES-256-CBC
    const encrypted = CryptoJS.AES.encrypt(
      plaintext,
      CryptoJS.enc.Hex.parse(key),
      {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      }
    );

    // Get base64 representations
    const saltB64 = salt.toString(CryptoJS.enc.Base64);
    const ivB64 = iv.toString(CryptoJS.enc.Base64);
    const ctB64 = encrypted.ciphertext.toString(CryptoJS.enc.Base64);

    // Validate key is valid hex before parsing
    if (!/^[0-9a-fA-F]+$/.test(key)) {
      throw new Error('Invalid key format: must be hexadecimal');
    }

    // Generate HMAC for authentication using proper HMAC-SHA256 primitive
    const dataToAuth = `${saltB64}:${ivB64}:${ctB64}`;
    const hmac = CryptoJS.HmacSHA256(dataToAuth, CryptoJS.enc.Hex.parse(key)).toString(CryptoJS.enc.Hex);

    // Return v2 format: v2:salt:iv:ciphertext:hmac
    return `v2:${saltB64}:${ivB64}:${ctB64}:${hmac}`;
  } catch (error) {
    // Only log detailed errors in development to prevent information leakage
    // Safe check for __DEV__ existence in all contexts
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.error('Encryption error:', error);
    } else {
      console.error('Encryption failed');
    }
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to encrypt data: ${message}`);
  }
}

/**
 * Constant-time string comparison to prevent timing attacks
 * Critical for HMAC verification to avoid leaking information
 *
 * Note: This implementation avoids early returns even on length mismatch
 * to ensure consistent timing regardless of input differences.
 *
 * @param a - First string to compare
 * @param b - Second string to compare
 * @returns true if strings are equal, false otherwise
 */
function timingSafeEqual(a: string, b: string): boolean {
  const len = Math.max(a.length, b.length);
  let result = a.length ^ b.length; // XOR lengths first (non-zero if different)
  for (let i = 0; i < len; i++) {
    const charA = i < a.length ? a.charCodeAt(i) : 0;
    const charB = i < b.length ? b.charCodeAt(i) : 0;
    result |= charA ^ charB;
  }
  return result === 0;
}

/**
 * Decrypts an encrypted string
 * Supports multiple formats for backward compatibility:
 * - v2: PBKDF2 format (v2:salt:iv:ciphertext:hmac) - RECOMMENDED
 * - v1: Legacy SHA-256 format (iv:ciphertext:hmac)
 * - DEV: Development format (DEV.base64) - INSECURE
 *
 * @param ciphertext - The encrypted string to decrypt
 * @returns Decrypted plaintext string
 */
export async function decrypt(ciphertext: string): Promise<string> {
  try {
    // Handle legacy DEV. prefix format (INSECURE - base64 only)
    if (ciphertext.startsWith('DEV.')) {
      // CRITICAL: Block insecure DEV format in production builds
      // Safe check for __DEV__ existence in all contexts
      if (typeof __DEV__ === 'undefined' || !__DEV__) {
        throw new Error('Insecure encryption format not allowed in production');
      }
      console.warn('Decrypting legacy DEV. format (INSECURE). Re-encrypt immediately.');
      const base64Data = ciphertext.slice(4);
      const wordArray = CryptoJS.enc.Base64.parse(base64Data);
      return wordArray.toString(CryptoJS.enc.Utf8);
    }

    const secret = getEncryptionSecret();

    // Check for v2 format (PBKDF2 - secure)
    if (ciphertext.startsWith('v2:')) {
      const parts = ciphertext.slice(3).split(':');

      if (parts.length !== 4) {
        throw new Error('Invalid v2 encrypted data format');
      }

      const [saltB64, ivB64, ctB64, receivedHmac] = parts;

      // Derive key using PBKDF2 with extracted salt
      const salt = CryptoJS.enc.Base64.parse(saltB64);
      const key = await deriveKeyPBKDF2(secret, salt);

      // Verify HMAC using proper HMAC-SHA256 primitive
      const dataToAuth = `${saltB64}:${ivB64}:${ctB64}`;
      const expectedHmac = CryptoJS.HmacSHA256(dataToAuth, CryptoJS.enc.Hex.parse(key)).toString(CryptoJS.enc.Hex);

      // Use constant-time comparison to prevent timing attacks
      if (!timingSafeEqual(receivedHmac, expectedHmac)) {
        throw new Error('Authentication failed: data may be corrupted or tampered with');
      }

      // Decrypt using crypto-js AES-256-CBC
      const iv = CryptoJS.enc.Base64.parse(ivB64);
      const ct = CryptoJS.enc.Base64.parse(ctB64);

      const decrypted = CryptoJS.AES.decrypt(
        { ciphertext: ct } as any,
        CryptoJS.enc.Hex.parse(key),
        {
          iv: iv,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7
        }
      );

      return decrypted.toString(CryptoJS.enc.Utf8);
    }

    // v1 format (legacy SHA-256): iv:ciphertext:hmac
    const parts = ciphertext.split(':');

    if (parts.length !== 3) {
      throw new Error('Invalid v1 encrypted data format');
    }

    const [ivB64, ctB64, receivedHmac] = parts;

    // Use legacy SHA-256 key derivation for v1 format
    const key = await deriveKeyLegacy(secret);

    // Verify HMAC using proper HMAC-SHA256 primitive
    const dataToAuth = `${ivB64}:${ctB64}`;
    const expectedHmac = CryptoJS.HmacSHA256(dataToAuth, CryptoJS.enc.Hex.parse(key)).toString(CryptoJS.enc.Hex);

    // Use constant-time comparison to prevent timing attacks
    if (!timingSafeEqual(receivedHmac, expectedHmac)) {
      throw new Error('Authentication failed: data may be corrupted or tampered with');
    }

    // Decrypt using crypto-js AES-256-CBC
    const iv = CryptoJS.enc.Base64.parse(ivB64);
    const ct = CryptoJS.enc.Base64.parse(ctB64);

    const decrypted = CryptoJS.AES.decrypt(
      { ciphertext: ct } as any,
      CryptoJS.enc.Hex.parse(key),
      {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      }
    );

    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    // Only log detailed errors in development to prevent information leakage
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.error('Decryption error:', error);
    } else {
      console.error('Decryption failed');
    }
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(
      `Failed to decrypt data: ${message}. The data may be corrupted or encrypted with a different key.`
    );
  }
}

/**
 * Generate a cryptographically secure random string
 * @param length - Length in bytes (output will be hex, so 2x length)
 * @returns Random hex string
 */
export async function generateRandomString(length: number): Promise<string> {
  return await randomBytesHex(length);
}

/**
 * Export a crypto secure object with utility functions
 */
export const cryptoSecure = {
  encrypt,
  decrypt,
  generateRandomString,
  isAvailable: (): boolean => true,
};
