/**
 * RATE LIMITER
 *
 * Comprehensive rate limiting system for API endpoints
 * Supports multiple strategies: fixed window, sliding window, token bucket
 *
 * @example
 * ```ts
 * const limiter = new RateLimiter({ maxRequests: 100, windowMs: 60000 })
 * await limiter.checkLimit(userId, 'tasks.create')
 * ```
 */

import { supabase } from '@/services/supabaseClient'

// ============================================================================
// TYPES
// ============================================================================

export type RateLimitStrategy = 'fixed_window' | 'sliding_window' | 'token_bucket'

export interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  strategy?: RateLimitStrategy
  keyGenerator?: (req: any) => string
  skipFailedRequests?: boolean
  skipSuccessfulRequests?: boolean
  onLimitReached?: (key: string) => void | Promise<void>
}

export interface TokenBucketConfig {
  bucketSize: number
  refillRate: number // tokens per second
  cost?: number // cost per request
}

export interface RateLimitResult {
  allowed: boolean
  exempt?: boolean
  remaining?: number
  resetAt?: Date
  retryAfter?: number
  currentCount?: number
  tokensRemaining?: number
}

export interface RateLimitInfo {
  limit: number
  remaining: number
  reset: number // Unix timestamp
  retryAfter?: number
}

// ============================================================================
// ERRORS
// ============================================================================

export class RateLimitError extends Error {
  constructor(
    message: string,
    public retryAfter: number,
    public limit: number,
    public remaining: number = 0
  ) {
    super(message)
    this.name = 'RateLimitError'
  }

  toJSON() {
    return {
      error: 'rate_limit_exceeded',
      message: this.message,
      retryAfter: this.retryAfter,
      limit: this.limit,
      remaining: this.remaining,
    }
  }
}

// ============================================================================
// IN-MEMORY RATE LIMITER (for client-side)
// ============================================================================

interface RateLimitRecord {
  count: number
  resetAt: number
  requests: number[] // timestamps for sliding window
}

export class InMemoryRateLimiter {
  private cache = new Map<string, RateLimitRecord>()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor(private config: RateLimitConfig) {
    this.startCleanup()
  }

  private startCleanup() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      const now = Date.now()
      for (const [key, record] of this.cache.entries()) {
        if (record.resetAt < now) {
          this.cache.delete(key)
        }
      }
    }, 60000)
  }

  async checkLimit(userId: string, endpoint: string): Promise<RateLimitResult> {
    const key = `${userId}:${endpoint}`
    const now = Date.now()

    if (this.config.strategy === 'sliding_window') {
      return this.checkSlidingWindow(key, now)
    }

    return this.checkFixedWindow(key, now)
  }

  private checkFixedWindow(key: string, now: number): RateLimitResult {
    let record = this.cache.get(key)

    // Reset if window expired
    if (record && record.resetAt < now) {
      record = undefined
    }

    if (!record) {
      record = {
        count: 0,
        resetAt: now + this.config.windowMs,
        requests: [],
      }
      this.cache.set(key, record)
    }

    record.count++

    if (record.count > this.config.maxRequests) {
      const retryAfter = Math.ceil((record.resetAt - now) / 1000)

      if (this.config.onLimitReached) {
        this.config.onLimitReached(key)
      }

      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(record.resetAt),
        retryAfter,
        currentCount: record.count,
      }
    }

    return {
      allowed: true,
      remaining: this.config.maxRequests - record.count,
      resetAt: new Date(record.resetAt),
      currentCount: record.count,
    }
  }

  private checkSlidingWindow(key: string, now: number): RateLimitResult {
    let record = this.cache.get(key)

    if (!record) {
      record = {
        count: 0,
        resetAt: now + this.config.windowMs,
        requests: [],
      }
      this.cache.set(key, record)
    }

    // Remove requests outside window
    const windowStart = now - this.config.windowMs
    record.requests = record.requests.filter(ts => ts > windowStart)

    // Add current request
    record.requests.push(now)
    record.count = record.requests.length

    if (record.count > this.config.maxRequests) {
      const oldestRequest = Math.min(...record.requests)
      const retryAfter = Math.ceil((oldestRequest + this.config.windowMs - now) / 1000)

      if (this.config.onLimitReached) {
        this.config.onLimitReached(key)
      }

      // Remove the current request since it's denied
      record.requests.pop()
      record.count--

      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(oldestRequest + this.config.windowMs),
        retryAfter,
        currentCount: record.count,
      }
    }

    return {
      allowed: true,
      remaining: this.config.maxRequests - record.count,
      resetAt: new Date(now + this.config.windowMs),
      currentCount: record.count,
    }
  }

  reset(userId: string, endpoint: string) {
    const key = `${userId}:${endpoint}`
    this.cache.delete(key)
  }

  resetAll() {
    this.cache.clear()
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.cache.clear()
  }
}

// ============================================================================
// DATABASE RATE LIMITER (for server-side)
// ============================================================================

export class DatabaseRateLimiter {
  constructor(private defaultConfig?: RateLimitConfig) {}

  async checkLimit(
    userId: string,
    endpoint: string,
    apiKey?: string,
    config?: RateLimitConfig
  ): Promise<RateLimitResult> {
    try {
      const { data, error } = await supabase
        .rpc('check_rate_limit', {
          p_user_id: userId,
          p_api_key: apiKey || null,
          p_endpoint: endpoint,
        })

      if (error) throw error

      return {
        allowed: data.allowed,
        exempt: data.exempt,
        remaining: data.remaining,
        resetAt: data.reset_at ? new Date(data.reset_at) : undefined,
        retryAfter: data.retry_after,
        currentCount: data.current_count,
        tokensRemaining: data.tokens_remaining,
      }
    } catch (error) {
      console.error('Rate limit check failed:', error)
      // Fail open - allow request if rate limit check fails
      return { allowed: true }
    }
  }

  async checkFixedWindow(
    userId: string,
    endpoint: string,
    maxRequests: number,
    windowMs: number,
    apiKey?: string
  ): Promise<RateLimitResult> {
    const windowInterval = `${windowMs / 1000} seconds`

    try {
      const { data, error } = await supabase
        .rpc('check_rate_limit_fixed_window', {
          p_user_id: userId,
          p_api_key: apiKey || null,
          p_endpoint: endpoint,
          p_max_requests: maxRequests,
          p_window: windowInterval,
        })

      if (error) throw error

      return {
        allowed: data.allowed,
        exempt: data.exempt,
        remaining: data.remaining,
        resetAt: data.reset_at ? new Date(data.reset_at) : undefined,
        retryAfter: data.retry_after,
        currentCount: data.current_count,
      }
    } catch (error) {
      console.error('Fixed window rate limit check failed:', error)
      return { allowed: true }
    }
  }

  async checkSlidingWindow(
    userId: string,
    endpoint: string,
    maxRequests: number,
    windowMs: number,
    apiKey?: string
  ): Promise<RateLimitResult> {
    const windowInterval = `${windowMs / 1000} seconds`

    try {
      const { data, error } = await supabase
        .rpc('check_rate_limit_sliding_window', {
          p_user_id: userId,
          p_api_key: apiKey || null,
          p_endpoint: endpoint,
          p_max_requests: maxRequests,
          p_window: windowInterval,
        })

      if (error) throw error

      return {
        allowed: data.allowed,
        exempt: data.exempt,
        remaining: data.remaining,
        resetAt: data.reset_at ? new Date(data.reset_at) : undefined,
        retryAfter: data.retry_after,
        currentCount: data.current_count,
      }
    } catch (error) {
      console.error('Sliding window rate limit check failed:', error)
      return { allowed: true }
    }
  }

  async checkTokenBucket(
    userId: string,
    endpoint: string,
    config: TokenBucketConfig,
    apiKey?: string
  ): Promise<RateLimitResult> {
    try {
      const { data, error } = await supabase
        .rpc('check_rate_limit_token_bucket', {
          p_user_id: userId,
          p_api_key: apiKey || null,
          p_endpoint: endpoint,
          p_bucket_size: config.bucketSize,
          p_refill_rate: config.refillRate,
          p_cost: config.cost || 1,
        })

      if (error) throw error

      return {
        allowed: data.allowed,
        exempt: data.exempt,
        tokensRemaining: data.tokens_remaining,
        retryAfter: data.retry_after,
      }
    } catch (error) {
      console.error('Token bucket rate limit check failed:', error)
      return { allowed: true }
    }
  }

  async getViolations(userId: string, limit = 100) {
    const { data, error } = await supabase
      .from('rate_limit_violations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data
  }

  async getStatus(userId: string, endpoint?: string) {
    let query = supabase
      .from('rate_limit_status')
      .select('*')
      .eq('identifier', userId)

    if (endpoint) {
      query = query.eq('endpoint', endpoint)
    }

    const { data, error } = await query

    if (error) throw error
    return data
  }
}

// ============================================================================
// UNIFIED RATE LIMITER
// ============================================================================

export class RateLimiter {
  private inMemory: InMemoryRateLimiter
  private database: DatabaseRateLimiter

  constructor(
    private config: RateLimitConfig,
    private useDatabase = false
  ) {
    this.inMemory = new InMemoryRateLimiter(config)
    this.database = new DatabaseRateLimiter(config)
  }

  async checkLimit(
    userId: string,
    endpoint: string,
    apiKey?: string
  ): Promise<RateLimitResult> {
    if (this.useDatabase) {
      return this.database.checkLimit(userId, endpoint, apiKey, this.config)
    }

    return this.inMemory.checkLimit(userId, endpoint)
  }

  async checkAndThrow(userId: string, endpoint: string, apiKey?: string) {
    const result = await this.checkLimit(userId, endpoint, apiKey)

    if (!result.allowed) {
      throw new RateLimitError(
        `Rate limit exceeded for ${endpoint}. Try again in ${result.retryAfter}s`,
        result.retryAfter || 0,
        this.config.maxRequests,
        result.remaining || 0
      )
    }

    return result
  }

  /**
   * Decorator for rate-limiting functions
   */
  withRateLimit(endpoint: string) {
    return <T extends (...args: any[]) => Promise<any>>(
      target: T
    ): T => {
      return (async (...args: any[]) => {
        const userId = args[0]?.userId || args[0]?.user?.id
        if (!userId) {
          throw new Error('User ID required for rate limiting')
        }

        await this.checkAndThrow(userId, endpoint)
        return target(...args)
      }) as T
    }
  }

  /**
   * Express/API middleware
   */
  middleware(endpoint: string) {
    return async (req: any, res: any, next: any) => {
      try {
        const userId = req.user?.id
        const apiKey = req.headers['x-api-key']

        if (!userId && !apiKey) {
          return res.status(401).json({ error: 'Unauthorized' })
        }

        const result = await this.checkLimit(userId, endpoint, apiKey)

        // Set rate limit headers
        res.set({
          'X-RateLimit-Limit': this.config.maxRequests,
          'X-RateLimit-Remaining': result.remaining || 0,
          'X-RateLimit-Reset': result.resetAt?.getTime() || 0,
        })

        if (!result.allowed) {
          res.set('Retry-After', result.retryAfter || 0)
          return res.status(429).json({
            error: 'rate_limit_exceeded',
            message: 'Too many requests',
            retryAfter: result.retryAfter,
          })
        }

        next()
      } catch (error) {
        console.error('Rate limit middleware error:', error)
        next(error)
      }
    }
  }

  reset(userId: string, endpoint: string) {
    this.inMemory.reset(userId, endpoint)
  }

  resetAll() {
    this.inMemory.resetAll()
  }

  destroy() {
    this.inMemory.destroy()
  }
}

// ============================================================================
// RATE LIMIT HEADERS
// ============================================================================

export function getRateLimitHeaders(result: RateLimitResult, limit: number): Record<string, string> {
  return {
    'X-RateLimit-Limit': limit.toString(),
    'X-RateLimit-Remaining': (result.remaining || 0).toString(),
    'X-RateLimit-Reset': (result.resetAt?.getTime() || 0).toString(),
    ...(result.retryAfter && { 'Retry-After': result.retryAfter.toString() }),
  }
}

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

// Example 1: Basic rate limiter
export const basicLimiter = new RateLimiter({
  maxRequests: 100,
  windowMs: 60000, // 1 minute
  strategy: 'fixed_window',
})

// Example 2: Strict rate limiter with sliding window
export const strictLimiter = new RateLimiter({
  maxRequests: 50,
  windowMs: 60000,
  strategy: 'sliding_window',
  onLimitReached: async (key) => {
    console.warn(`Rate limit exceeded for ${key}`)
  },
})

// Example 3: Database-backed rate limiter
export const dbLimiter = new RateLimiter(
  {
    maxRequests: 1000,
    windowMs: 60000,
  },
  true // use database
)

// Example 4: Per-endpoint rate limiters
export const endpointLimiters = {
  'tasks.create': new RateLimiter({
    maxRequests: 60,
    windowMs: 60000,
  }),
  'tasks.update': new RateLimiter({
    maxRequests: 120,
    windowMs: 60000,
  }),
  'ai.chat': new RateLimiter({
    maxRequests: 20,
    windowMs: 60000,
  }),
  'export.data': new RateLimiter({
    maxRequests: 5,
    windowMs: 3600000, // 1 hour
  }),
}

// Example 5: Function decorator
export const createTask = basicLimiter.withRateLimit('tasks.create')(
  async (params: { userId: string; task: any }) => {
    // Create task logic
    return { success: true, task: params.task }
  }
)

// Example 6: Check limit manually
export async function handleRequest(userId: string, endpoint: string) {
  try {
    const result = await basicLimiter.checkAndThrow(userId, endpoint)
    console.log(`Request allowed. ${result.remaining} remaining`)
    // Process request
  } catch (error) {
    if (error instanceof RateLimitError) {
      console.error(`Rate limited. Retry after ${error.retryAfter}s`)
      throw error
    }
  }
}
