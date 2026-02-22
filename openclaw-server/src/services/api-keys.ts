// Per-user API key retrieval from public.security_api_keys
// Fetches encrypted key from DB, decrypts, caches in-memory with 5-min TTL

import { config } from '../config.js';
import { schemaQuery, schemaUpdate } from '../claw/db.js';
import { decryptApiKey } from './crypto.js';

interface CacheEntry {
  apiKey: string;
  fetchedAt: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, CacheEntry>();

/**
 * Get an API key for a user+service pair.
 * Flow: check cache -> query DB -> decrypt -> cache -> return
 * Fallback: env var (e.g. config.anthropicApiKey for 'anthropic')
 */
export async function getApiKey(userId: string, service: string): Promise<string> {
  const cacheKey = `${userId}:${service}`;

  // Check cache
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.apiKey;
  }

  // Query DB
  try {
    const rows = await schemaQuery<{
      id: string;
      key_ciphertext: string;
    }>(
      'public',
      'security_api_keys',
      `user_id=eq.${userId}&service=eq.${encodeURIComponent(service)}&select=id,key_ciphertext&limit=1`
    );

    if (rows.length > 0 && rows[0].key_ciphertext && config.keySecret) {
      const decrypted = decryptApiKey(rows[0].key_ciphertext, config.keySecret);
      cache.set(cacheKey, { apiKey: decrypted, fetchedAt: Date.now() });
      console.log(`[ApiKeys] Key for ${service}: source=db`);

      // Fire-and-forget last_used update
      schemaUpdate('public', 'security_api_keys', rows[0].id, {
        last_used: new Date().toISOString(),
      }).catch((err) => console.warn('[ApiKeys] Failed to update last_used:', err));

      return decrypted;
    }
  } catch (err) {
    console.error(`[ApiKeys] DB lookup failed for ${service}:`, err);
  }

  // Fallback to env var
  const envKey = getEnvFallback(service);
  if (envKey) {
    console.log(`[ApiKeys] Key for ${service}: source=env`);
    return envKey;
  }

  console.warn(`[ApiKeys] No key found for ${service} (user=${userId}) — neither DB nor env`);
  return '';
}

function getEnvFallback(service: string): string {
  switch (service) {
    case 'anthropic': return config.anthropicApiKey;
    case 'deepgram': return config.deepgramApiKey;
    default: return '';
  }
}

export function clearApiKeyCache(): void {
  cache.clear();
}

export function getApiKeyCacheSize(): number {
  return cache.size;
}
