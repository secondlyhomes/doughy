// src/lib/ai/cache.ts
// AI response caching and optimization layer

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AssistantContextSnapshot } from '@/features/assistant/types/context';

/**
 * Cache entry structure
 */
interface CacheEntry {
  key: string;
  response: string;
  timestamp: number;
  contextHash: string;
  expiresAt: number;
}

/**
 * Cache configuration
 */
const CACHE_CONFIG = {
  TTL: 15 * 60 * 1000, // 15 minutes
  MAX_ENTRIES: 50,
  STORAGE_KEY: '@doughy:ai_cache',
};

/**
 * Generate a hash from message and context for cache key
 * IMPORTANT: Includes userId to prevent cross-user cache leakage
 */
function generateCacheKey(message: string, context?: AssistantContextSnapshot): string {
  // Use userId, message, screen, and deal ID as cache key components
  const parts = [
    context?.user.id || 'anonymous',  // SECURITY: Isolate cache by user
    message.toLowerCase().trim(),
    context?.screen.name || 'generic',
    context?.selection.dealId || 'no-deal',
  ];

  // Simple hash function
  const str = parts.join('::');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  return `ai_${Math.abs(hash).toString(36)}`;
}

/**
 * Generate a context hash to detect context changes
 * Includes userId for security
 */
function generateContextHash(context?: AssistantContextSnapshot): string {
  if (!context) return 'no-context';

  // Hash key context properties including userId
  const parts = [
    context.user.id || 'anonymous',  // SECURITY: Include userId
    context.screen.name,
    context.selection.dealId || '',
    context.payload.type,
    // Add deal stage if available
    context.payload.type === 'deal_cockpit' ? context.payload.deal.stage : '',
  ];

  return parts.filter(Boolean).join('::');
}

/**
 * In-memory cache for fast lookups with proper LRU eviction
 */
class InMemoryCache {
  private cache: Map<string, CacheEntry> = new Map();

  get(key: string): CacheEntry | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    // LRU: Move to end (mark as recently used)
    // Delete and re-add to update position in Map
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry;
  }

  set(key: string, response: string, contextHash: string): void {
    // LRU: Remove if exists (to update position)
    this.cache.delete(key);

    // Add to end (most recently used)
    const entry: CacheEntry = {
      key,
      response,
      timestamp: Date.now(),
      contextHash,
      expiresAt: Date.now() + CACHE_CONFIG.TTL,
    };

    this.cache.set(key, entry);

    // Limit cache size - evict least recently used (first in Map)
    if (this.cache.size > CACHE_CONFIG.MAX_ENTRIES) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  // Get cache stats
  getStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.values()).map(e => ({
        key: e.key,
        age: Date.now() - e.timestamp,
        expiresIn: e.expiresAt - Date.now(),
      })),
    };
  }
}

// Singleton cache instance
const memCache = new InMemoryCache();

/**
 * Persistent cache using AsyncStorage
 */
class PersistentCache {
  async get(key: string): Promise<CacheEntry | null> {
    try {
      const data = await AsyncStorage.getItem(`${CACHE_CONFIG.STORAGE_KEY}:${key}`);
      if (!data) return null;

      const entry: CacheEntry = JSON.parse(data);

      // Check if expired
      if (Date.now() > entry.expiresAt) {
        await this.delete(key);
        return null;
      }

      return entry;
    } catch (error) {
      console.error('[Cache] Error reading from persistent cache:', error);
      return null;
    }
  }

  async set(key: string, response: string, contextHash: string): Promise<void> {
    try {
      const entry: CacheEntry = {
        key,
        response,
        timestamp: Date.now(),
        contextHash,
        expiresAt: Date.now() + CACHE_CONFIG.TTL,
      };

      await AsyncStorage.setItem(
        `${CACHE_CONFIG.STORAGE_KEY}:${key}`,
        JSON.stringify(entry)
      );
    } catch (error) {
      console.error('[Cache] Error writing to persistent cache:', error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`${CACHE_CONFIG.STORAGE_KEY}:${key}`);
    } catch (error) {
      console.error('[Cache] Error deleting from persistent cache:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(k => k.startsWith(CACHE_CONFIG.STORAGE_KEY));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('[Cache] Error clearing persistent cache:', error);
    }
  }
}

const persistentCache = new PersistentCache();

/**
 * Get cached AI response
 */
export async function getCachedResponse(
  message: string,
  context?: AssistantContextSnapshot
): Promise<string | null> {
  const key = generateCacheKey(message, context);
  const contextHash = generateContextHash(context);

  // Check in-memory cache first (fast)
  const memEntry = memCache.get(key);
  if (memEntry && memEntry.contextHash === contextHash) {
    return memEntry.response;
  }

  // Check persistent cache (slower)
  const persistentEntry = await persistentCache.get(key);
  if (persistentEntry && persistentEntry.contextHash === contextHash) {
    // Warm up memory cache
    memCache.set(key, persistentEntry.response, contextHash);
    return persistentEntry.response;
  }

  return null;
}

/**
 * Cache AI response
 */
export async function cacheResponse(
  message: string,
  response: string,
  context?: AssistantContextSnapshot
): Promise<void> {
  const key = generateCacheKey(message, context);
  const contextHash = generateContextHash(context);

  // Store in both caches
  memCache.set(key, response, contextHash);
  await persistentCache.set(key, response, contextHash);
}

/**
 * Clear all caches
 */
export async function clearCache(): Promise<void> {
  memCache.clear();
  await persistentCache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return memCache.getStats();
}

/**
 * Preload common responses (could be called on app start)
 */
export async function preloadCommonResponses(): Promise<void> {
  // This could load frequently asked questions or common commands
  // For now, it's a placeholder for future optimization
}

export default {
  getCachedResponse,
  cacheResponse,
  clearCache,
  getCacheStats,
  preloadCommonResponses,
};
