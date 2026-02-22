// src/lib/ai/rateLimiter.ts
// Rate limiting for AI API calls to prevent abuse

interface RateLimitConfig {
  windowMs: number;      // Time window (e.g., 60000 = 1 minute)
  maxRequests: number;   // Max requests per window
}

/**
 * Simple in-memory rate limiter
 * Tracks requests per user within a sliding time window
 */
class RateLimiter {
  private attempts: Map<string, number[]> = new Map();

  constructor(private config: RateLimitConfig) {}

  /**
   * Check if user can make a request
   * @param userId - User ID to check
   * @returns true if under rate limit, false if exceeded
   */
  canMakeRequest(userId: string): boolean {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Get attempts for this user
    const userAttempts = this.attempts.get(userId) || [];

    // Filter to only recent attempts within the window
    const recentAttempts = userAttempts.filter(t => t > windowStart);

    // Update stored attempts (cleanup old ones)
    this.attempts.set(userId, recentAttempts);

    // Check if under limit
    return recentAttempts.length < this.config.maxRequests;
  }

  /**
   * Record a request for a user
   * @param userId - User ID making the request
   */
  recordRequest(userId: string): void {
    const attempts = this.attempts.get(userId) || [];
    attempts.push(Date.now());
    this.attempts.set(userId, attempts);
  }

  /**
   * Get remaining requests for a user in the current window
   * @param userId - User ID to check
   * @returns number of remaining requests
   */
  getRemainingRequests(userId: string): number {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    const userAttempts = this.attempts.get(userId) || [];
    const recentAttempts = userAttempts.filter(t => t > windowStart);
    return Math.max(0, this.config.maxRequests - recentAttempts.length);
  }

  /**
   * Get time until next request is allowed (in milliseconds)
   * Returns 0 if user can make a request now
   * @param userId - User ID to check
   */
  getTimeUntilReset(userId: string): number {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    const userAttempts = this.attempts.get(userId) || [];
    const recentAttempts = userAttempts.filter(t => t > windowStart);

    if (recentAttempts.length < this.config.maxRequests) {
      return 0; // Can make request now
    }

    // Time until oldest request expires
    const oldestRequest = recentAttempts[0];
    const resetTime = oldestRequest + this.config.windowMs;
    return Math.max(0, resetTime - now);
  }

  /**
   * Clear all rate limit data
   * Useful for testing
   */
  reset(): void {
    this.attempts.clear();
  }

  /**
   * Get stats for monitoring
   */
  getStats() {
    return {
      totalUsers: this.attempts.size,
      activeUsers: Array.from(this.attempts.entries()).filter(([_, attempts]) => {
        const windowStart = Date.now() - this.config.windowMs;
        return attempts.some(t => t > windowStart);
      }).length,
    };
  }
}

/**
 * Singleton rate limiter for AI requests
 * 20 requests per minute per user
 */
export const aiRateLimiter = new RateLimiter({
  windowMs: 60000,      // 1 minute
  maxRequests: 20,      // 20 requests per minute
});

/**
 * Export for testing
 */
export { RateLimiter };
