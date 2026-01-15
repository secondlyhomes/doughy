// crypto-server.ts (Deno + Supabase Edge compatible)
import { decode as base64Decode, encode as base64Encode } from "https://deno.land/std@0.177.0/encoding/base64.ts";

// Manual conversion to Uint8Array
function fromBase64(str: string): Uint8Array {
  return base64Decode(str);
}

// Get SHA-256 key from secret
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

// Log helper for tracking decryption issues
function logDecryptionInfo(prefix: string, details: string): void {
  console.info(`[crypto-server] ${prefix}: ${details}`);
}

export async function decryptServer(ciphertext: string): Promise<string> {
  if (!ciphertext) {
    throw new Error("Empty ciphertext provided");
  }

  // Case 1: Legacy DEV prefix (Basic Base64)
  if (ciphertext.startsWith("DEV.")) {
    logDecryptionInfo("Legacy format detected", "Using basic Base64 decoding");
    try {
      const legacy = fromBase64(ciphertext.slice(4));
      return new TextDecoder().decode(legacy);
    } catch (error) {
      console.error("[crypto-server] Error decoding legacy format:", error);
      throw new Error("Failed to decode legacy format");
    }
  }

  // Case 2: Modern secure format (AES-GCM)
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

    // Get decryption key from environment
    // Try multiple possible environment variable names
    // Prioritize KEY_SECRET as the primary env var
    const keySecret = Deno.env.get("KEY_SECRET") || Deno.env.get("VITE_KEY_SECRET") ||
                      Deno.env.get("ENCRYPTION_SECRET") || Deno.env.get("VITE_ENCRYPTION_SECRET");
    if (!keySecret) {
      console.error("[crypto-server] CRITICAL: Missing KEY_SECRET or alternative environment variable");
      throw new Error("Missing encryption configuration");
    }

    const key = await getKey(keySecret);

    // Attempt decryption with AES-GCM
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      combined
    );

    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error("[crypto-server] Decryption error:", error);
    throw new Error(`Failed to decrypt: ${error.message}`);
  }
}
