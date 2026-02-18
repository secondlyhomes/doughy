// src/features/admin/services/api-key-health/cache.ts
// Health check cache management

import type { IntegrationHealth } from '../../types/integrations';

const healthCache = new Map<string, { health: IntegrationHealth; timestamp: number }>();

export const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
export const MAX_CACHE_SIZE = 50; // Prevent unbounded cache growth

/**
 * Check if health check result is cached and still valid
 */
export function getCachedHealth(service: string): IntegrationHealth | null {
  const cached = healthCache.get(service);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.health;
  }
  return null;
}

/**
 * Cache health check result with LRU-style eviction when cache is full
 */
export function cacheHealth(service: string, health: IntegrationHealth): void {
  // Evict oldest entries if cache is at max size
  if (healthCache.size >= MAX_CACHE_SIZE && !healthCache.has(service)) {
    // Find and remove the oldest entry
    let oldestKey: string | null = null;
    let oldestTimestamp = Infinity;

    for (const [key, value] of healthCache.entries()) {
      if (value.timestamp < oldestTimestamp) {
        oldestTimestamp = value.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      healthCache.delete(oldestKey);
    }
  }

  healthCache.set(service, { health, timestamp: Date.now() });
}

/**
 * Clear health cache for a specific service or all services
 */
export function clearHealthCache(service?: string): void {
  if (service) {
    healthCache.delete(service);
  } else {
    healthCache.clear();
  }
}
