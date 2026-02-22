// Node.js port of supabase/functions/_shared/crypto-server.ts decryption logic
// Uses Node crypto module (pbkdf2Sync, createDecipheriv, createHmac, timingSafeEqual)

import { createDecipheriv, createHmac, pbkdf2Sync, createHash, timingSafeEqual } from 'crypto';

/**
 * Decrypt an API key encrypted by the mobile app / edge functions.
 *
 * Supported formats:
 *   v2 — `v2:salt_b64:iv_b64:ciphertext_b64:hmac_hex` (PBKDF2 + AES-256-CBC + HMAC-SHA256)
 *   v1 — `iv_b64:ciphertext_b64:hmac_hex` (SHA-256 + AES-256-CBC + HMAC-SHA256)
 */
export function decryptApiKey(ciphertext: string, keySecret: string): string {
  if (!ciphertext) throw new Error('Empty ciphertext');
  if (!keySecret) throw new Error('Missing key secret');

  if (ciphertext.startsWith('v2:')) {
    return decryptV2(ciphertext, keySecret);
  }

  if (ciphertext.includes(':')) {
    return decryptV1(ciphertext, keySecret);
  }

  throw new Error('Unsupported encryption format');
}

/**
 * v2: PBKDF2 key derivation + AES-256-CBC + HMAC-SHA256
 * Format: v2:salt_b64:iv_b64:ciphertext_b64:hmac_hex
 */
function decryptV2(ciphertext: string, keySecret: string): string {
  const parts = ciphertext.slice(3).split(':');
  if (parts.length !== 4) throw new Error('Invalid v2 format');

  const [saltB64, ivB64, ctB64, receivedHmac] = parts;

  const salt = Buffer.from(saltB64, 'base64');
  const iv = Buffer.from(ivB64, 'base64');
  const encrypted = Buffer.from(ctB64, 'base64');

  if (salt.length !== 16 || iv.length !== 16) {
    throw new Error(
      `Invalid salt/IV size (salt: ${salt.length}, iv: ${iv.length}, expected: 16). ` +
      `This key may have been encrypted with a buggy client. Please re-save the API key.`
    );
  }

  // Derive 32-byte key using PBKDF2
  const derivedKey = pbkdf2Sync(keySecret, salt, 100_000, 32, 'sha256');

  // Verify HMAC
  const dataToAuth = `${saltB64}:${ivB64}:${ctB64}`;
  const expectedHmac = createHmac('sha256', derivedKey).update(dataToAuth).digest('hex');

  if (!timingSafeEqual(Buffer.from(receivedHmac, 'hex'), Buffer.from(expectedHmac, 'hex'))) {
    throw new Error('HMAC verification failed (v2)');
  }

  // Decrypt AES-256-CBC
  const decipher = createDecipheriv('aes-256-cbc', derivedKey, iv);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}

/**
 * v1: SHA-256 key derivation + AES-256-CBC + HMAC-SHA256
 * Format: iv_b64:ciphertext_b64:hmac_hex
 */
function decryptV1(ciphertext: string, keySecret: string): string {
  const parts = ciphertext.split(':');
  if (parts.length !== 3) throw new Error('Invalid v1 format');

  const [ivB64, ctB64, receivedHmac] = parts;

  const iv = Buffer.from(ivB64, 'base64');
  const encrypted = Buffer.from(ctB64, 'base64');

  // Derive key via SHA-256 of the secret
  const derivedKey = createHash('sha256').update(keySecret).digest();

  // Verify HMAC using the hex-encoded key (matching the edge function behavior)
  const keyHex = derivedKey.toString('hex');
  const dataToAuth = `${ivB64}:${ctB64}`;
  const expectedHmac = createHmac('sha256', Buffer.from(keyHex, 'hex')).update(dataToAuth).digest('hex');

  if (!timingSafeEqual(Buffer.from(receivedHmac, 'hex'), Buffer.from(expectedHmac, 'hex'))) {
    throw new Error('HMAC verification failed (v1)');
  }

  // Decrypt AES-256-CBC
  const decipher = createDecipheriv('aes-256-cbc', derivedKey, iv);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}
