// crypto-server.ts (Deno + Supabase Edge compatible)
import { decode as base64Decode, encode as base64Encode } from "https://deno.land/std@0.177.0/encoding/base64.ts";

// Manual conversion to Uint8Array
function fromBase64(str: string): Uint8Array {
  return base64Decode(str);
}

// Convert hex string to Uint8Array
function fromHex(hexString: string): Uint8Array {
  const bytes = new Uint8Array(hexString.length / 2);
  for (let i = 0; i < hexString.length; i += 2) {
    bytes[i / 2] = parseInt(hexString.substr(i, 2), 16);
  }
  return bytes;
}

// Get SHA-256 digest as hex string
async function sha256Hex(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(data));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Get HMAC-SHA256 as hex string (for verifying crypto-js format)
async function hmacSha256Hex(data: string, keyHex: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyBytes = fromHex(keyHex);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    encoder.encode(data)
  );

  const signatureArray = Array.from(new Uint8Array(signature));
  return signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Get SHA-256 key from secret (for AES-GCM)
async function getKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const rawKey = await crypto.subtle.digest("SHA-256", encoder.encode(secret));
  return crypto.subtle.importKey(
    "raw",
    rawKey,
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );
}

// Get SHA-256 key from secret (for AES-CBC) - LEGACY v1 format only
async function getCBCKeyLegacy(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const rawKey = await crypto.subtle.digest("SHA-256", encoder.encode(secret));
  return crypto.subtle.importKey(
    "raw",
    rawKey,
    { name: "AES-CBC" },
    false,
    ["decrypt"]
  );
}

// Derive AES-CBC key using PBKDF2 (for v2 format)
async function getCBCKeyPBKDF2(secret: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();

  // Import the secret as a base key for PBKDF2
  const baseKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  // Derive 256-bit AES key using PBKDF2 with 100,000 iterations
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256"
    },
    baseKey,
    { name: "AES-CBC", length: 256 },
    false,
    ["decrypt"]
  );
}

// Derive key as hex string using PBKDF2 (for HMAC verification)
async function deriveKeyHexPBKDF2(secret: string, salt: Uint8Array): Promise<string> {
  const encoder = new TextEncoder();

  // Import the secret as a base key for PBKDF2
  const baseKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  // Derive 256 bits (32 bytes) using PBKDF2
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256"
    },
    baseKey,
    256
  );

  // Convert to hex string
  const derivedArray = Array.from(new Uint8Array(derivedBits));
  return derivedArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Log helper for tracking decryption issues
function logDecryptionInfo(prefix: string, details: string): void {
  console.info(`[crypto-server] ${prefix}: ${details}`);
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

export async function decryptServer(ciphertext: string): Promise<string> {
  if (!ciphertext) {
    throw new Error("Empty ciphertext provided");
  }

  // Get decryption key from environment
  const keySecret = Deno.env.get("KEY_SECRET") || Deno.env.get("VITE_KEY_SECRET") ||
                    Deno.env.get("ENCRYPTION_SECRET") || Deno.env.get("VITE_ENCRYPTION_SECRET");
  if (!keySecret) {
    console.error("[crypto-server] CRITICAL: Missing KEY_SECRET or alternative environment variable");
    throw new Error("Missing encryption configuration");
  }

  // Case 1: Legacy DEV prefix (Basic Base64) - INSECURE
  if (ciphertext.startsWith("DEV.")) {
    const isDevelopment = Deno.env.get("ENVIRONMENT") === "development";

    if (!isDevelopment) {
      console.error("[crypto-server] Legacy DEV. format not allowed in production");
      throw new Error("Unsupported encryption format");
    }

    logDecryptionInfo("WARNING: Legacy format detected", "Using basic Base64 decoding (DEVELOPMENT ONLY)");
    try {
      const legacy = fromBase64(ciphertext.slice(4));
      return new TextDecoder().decode(legacy);
    } catch (error) {
      console.error("[crypto-server] Error decoding legacy format:", error);
      throw new Error("Failed to decode legacy format");
    }
  }

  // Case 2a: v2 format with PBKDF2 (v2:salt:iv:ciphertext:hmac) - SECURE
  if (ciphertext.startsWith("v2:")) {
    logDecryptionInfo("v2 format detected (PBKDF2)", "Using secure key derivation");
    try {
      const parts = ciphertext.slice(3).split(":");
      if (parts.length !== 4) {
        throw new Error("Invalid v2 format");
      }

      const [saltB64, ivB64, ctB64, receivedHmac] = parts;

      // Decode salt
      const salt = fromBase64(saltB64);

      // Derive key using PBKDF2 with salt
      const keyHex = await deriveKeyHexPBKDF2(keySecret, salt);

      // Verify HMAC
      const dataToAuth = `${saltB64}:${ivB64}:${ctB64}`;
      const expectedHmac = await sha256Hex(`${keyHex}:${dataToAuth}`);

      // Use constant-time comparison to prevent timing attacks
      if (!timingSafeEqual(receivedHmac, expectedHmac)) {
        console.error("[crypto-server] HMAC verification failed (v2)");
        throw new Error("HMAC verification failed");
      }

      // Decrypt using AES-256-CBC with PBKDF2-derived key
      const iv = fromBase64(ivB64);
      const encrypted = fromBase64(ctB64);
      const key = await getCBCKeyPBKDF2(keySecret, salt);

      const decrypted = await crypto.subtle.decrypt(
        { name: "AES-CBC", iv },
        key,
        encrypted
      );

      return new TextDecoder().decode(decrypted);
    } catch (error) {
      console.error("[crypto-server] v2 decryption error:", error);
      throw new Error(`Failed to decrypt v2 format: ${error.message}`);
    }
  }

  // Case 2b: v1 format (legacy SHA-256): iv:ciphertext:hmac
  if (ciphertext.includes(":")) {
    logDecryptionInfo("v1 format detected (legacy SHA-256)", "Using legacy key derivation");
    try {
      const parts = ciphertext.split(":");
      if (parts.length !== 3) {
        throw new Error("Invalid v1 CBC+HMAC format");
      }

      const [ivB64, ctB64, receivedHmac] = parts;

      // Derive key (same as client legacy method)
      const keyHex = await sha256Hex(keySecret);

      // Verify HMAC - must match client's approach
      const dataToAuth = `${ivB64}:${ctB64}`;
      const expectedHmac = await sha256Hex(`${keyHex}:${dataToAuth}`);

      // Use constant-time comparison to prevent timing attacks
      if (!timingSafeEqual(receivedHmac, expectedHmac)) {
        console.error("[crypto-server] HMAC verification failed (v1)");
        throw new Error("HMAC verification failed");
      }

      // Decrypt using AES-256-CBC with legacy key
      const iv = fromBase64(ivB64);
      const encrypted = fromBase64(ctB64);
      const key = await getCBCKeyLegacy(keySecret);

      const decrypted = await crypto.subtle.decrypt(
        { name: "AES-CBC", iv },
        key,
        encrypted
      );

      return new TextDecoder().decode(decrypted);
    } catch (error) {
      console.error("[crypto-server] v1 decryption error:", error);
      throw new Error(`Failed to decrypt v1 format: ${error.message}`);
    }
  }

  // Case 3: Old GCM format (iv.ciphertext) - kept for backward compatibility
  logDecryptionInfo("GCM format detected", "Using AES-256-GCM");
  try {
    const [ivB64, dataB64] = ciphertext.split(".");

    if (!ivB64 || !dataB64) {
      throw new Error("Invalid encrypted data format");
    }

    const iv = fromBase64(ivB64);
    const full = fromBase64(dataB64);

    const tagLength = 16;
    const encrypted = full.slice(0, full.length - tagLength);
    const tag = full.slice(full.length - tagLength);

    const combined = new Uint8Array(encrypted.length + tag.length);
    combined.set(encrypted);
    combined.set(tag, encrypted.length);

    const key = await getKey(keySecret);

    // Attempt decryption with AES-GCM
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      combined
    );

    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error("[crypto-server] GCM decryption error:", error);
    throw new Error(`Failed to decrypt: ${error.message}`);
  }
}
