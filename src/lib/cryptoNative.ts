// src/lib/cryptoNative.ts
// Encryption utilities for React Native using Web Crypto API
// Maintains compatibility with server-side AES-GCM encryption

import 'react-native-get-random-values';
import * as Crypto from 'expo-crypto';
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
    // Never use a fallback key - always fail in development too
    throw new Error(
      'Missing EXPO_PUBLIC_ENCRYPTION_SECRET environment variable. ' +
      'Create a .env file with EXPO_PUBLIC_ENCRYPTION_SECRET=<your-32-char-hex-string> ' +
      'Run: openssl rand -hex 16 to generate a secure key.'
    );
  }

  return secret;
}

/**
 * Derive a 256-bit AES-GCM key from the encryption secret using SHA-256
 */
async function deriveKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const rawKey = await crypto.subtle.digest('SHA-256', encoder.encode(secret));
  return crypto.subtle.importKey(
    'raw',
    rawKey,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Convert ArrayBuffer to base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert base64 string to Uint8Array
 */
function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Encrypts a string using AES-256-GCM
 * Format: ${iv_base64}.${ciphertext_base64}
 *
 * @param plaintext - The string to encrypt
 * @returns Encrypted string in format: iv.ciphertext
 */
export async function encrypt(plaintext: string): Promise<string> {
  try {
    const secret = getEncryptionSecret();
    const key = await deriveKey(secret);

    // Generate random 12-byte IV for GCM
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Encrypt the plaintext
    const encoder = new TextEncoder();
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(plaintext)
    );

    // Convert to base64
    const ivBase64 = arrayBufferToBase64(iv.buffer);
    const ciphertextBase64 = arrayBufferToBase64(encrypted);

    return `${ivBase64}.${ciphertextBase64}`;
  } catch (error) {
    console.error('Encryption error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to encrypt data: ${message}`);
  }
}

/**
 * Decrypts an encrypted string
 * Supports both modern format (iv.ciphertext) and legacy format (DEV.base64)
 *
 * @param ciphertext - The encrypted string to decrypt
 * @returns Decrypted plaintext string
 */
export async function decrypt(ciphertext: string): Promise<string> {
  try {
    // Handle legacy DEV. prefix format
    if (ciphertext.startsWith('DEV.')) {
      console.warn('Decrypting legacy DEV. format. Consider re-encrypting.');
      const base64Data = ciphertext.slice(4); // Remove 'DEV.' prefix
      const bytes = base64ToUint8Array(base64Data);
      return new TextDecoder().decode(bytes);
    }

    // Modern format: iv.ciphertext
    const [ivB64, dataB64] = ciphertext.split('.');

    if (!ivB64 || !dataB64) {
      throw new Error('Invalid encrypted data format');
    }

    const secret = getEncryptionSecret();
    const key = await deriveKey(secret);

    const iv = base64ToUint8Array(ivB64);
    const encryptedData = base64ToUint8Array(dataB64);

    // Decrypt using AES-GCM
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encryptedData
    );

    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error('Decryption error:', error);
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
  const bytes = await Crypto.getRandomBytesAsync(length);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Export a crypto secure object with utility functions
 */
export const cryptoSecure = {
  encrypt,
  decrypt,
  generateRandomString,
  isAvailable: (): boolean => typeof crypto !== 'undefined' && typeof crypto.subtle !== 'undefined',
};
