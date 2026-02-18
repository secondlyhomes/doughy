// src/lib/ai/__tests__/rateLimiter.test.ts
// Tests for rate limiting functionality

import { RateLimiter, aiRateLimiter } from '../rateLimiter';

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    // Create a fresh rate limiter for each test
    rateLimiter = new RateLimiter({
      windowMs: 1000, // 1 second for testing
      maxRequests: 5,  // 5 requests per second
    });
  });

  describe('canMakeRequest', () => {
    it('should allow requests under the limit', () => {
      const userId = 'test-user';

      for (let i = 0; i < 5; i++) {
        expect(rateLimiter.canMakeRequest(userId)).toBe(true);
        rateLimiter.recordRequest(userId);
      }
    });

    it('should block requests over the limit', () => {
      const userId = 'test-user';

      // Make 5 requests (at limit)
      for (let i = 0; i < 5; i++) {
        rateLimiter.recordRequest(userId);
      }

      // 6th request should be blocked
      expect(rateLimiter.canMakeRequest(userId)).toBe(false);
    });

    it('should isolate rate limits per user', () => {
      const userA = 'user-a';
      const userB = 'user-b';

      // User A hits limit
      for (let i = 0; i < 5; i++) {
        rateLimiter.recordRequest(userA);
      }

      expect(rateLimiter.canMakeRequest(userA)).toBe(false);

      // User B should still be able to make requests
      expect(rateLimiter.canMakeRequest(userB)).toBe(true);
    });

    it('should allow requests after window expires', async () => {
      const userId = 'test-user';

      // Hit the limit
      for (let i = 0; i < 5; i++) {
        rateLimiter.recordRequest(userId);
      }

      expect(rateLimiter.canMakeRequest(userId)).toBe(false);

      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Should be able to make requests again
      expect(rateLimiter.canMakeRequest(userId)).toBe(true);
    });
  });

  describe('getRemainingRequests', () => {
    it('should return correct remaining count', () => {
      const userId = 'test-user';

      expect(rateLimiter.getRemainingRequests(userId)).toBe(5);

      rateLimiter.recordRequest(userId);
      expect(rateLimiter.getRemainingRequests(userId)).toBe(4);

      rateLimiter.recordRequest(userId);
      expect(rateLimiter.getRemainingRequests(userId)).toBe(3);
    });

    it('should return 0 when at limit', () => {
      const userId = 'test-user';

      for (let i = 0; i < 5; i++) {
        rateLimiter.recordRequest(userId);
      }

      expect(rateLimiter.getRemainingRequests(userId)).toBe(0);
    });

    it('should update as window slides', async () => {
      const userId = 'test-user';

      // Make 5 requests
      for (let i = 0; i < 5; i++) {
        rateLimiter.recordRequest(userId);
      }

      expect(rateLimiter.getRemainingRequests(userId)).toBe(0);

      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 1100));

      expect(rateLimiter.getRemainingRequests(userId)).toBe(5);
    });
  });

  describe('getTimeUntilReset', () => {
    it('should return 0 when under limit', () => {
      const userId = 'test-user';
      expect(rateLimiter.getTimeUntilReset(userId)).toBe(0);
    });

    it('should return time until oldest request expires', () => {
      const userId = 'test-user';

      // Fill up the limit
      for (let i = 0; i < 5; i++) {
        rateLimiter.recordRequest(userId);
      }

      const resetTime = rateLimiter.getTimeUntilReset(userId);
      expect(resetTime).toBeGreaterThan(0);
      expect(resetTime).toBeLessThanOrEqual(1000);
    });
  });

  describe('reset', () => {
    it('should clear all rate limit data', () => {
      const userId = 'test-user';

      // Hit limit
      for (let i = 0; i < 5; i++) {
        rateLimiter.recordRequest(userId);
      }

      expect(rateLimiter.canMakeRequest(userId)).toBe(false);

      // Reset
      rateLimiter.reset();

      // Should be able to make requests again
      expect(rateLimiter.canMakeRequest(userId)).toBe(true);
    });
  });

  describe('getStats', () => {
    it('should return correct stats', () => {
      rateLimiter.recordRequest('user-1');
      rateLimiter.recordRequest('user-2');
      rateLimiter.recordRequest('user-3');

      const stats = rateLimiter.getStats();
      expect(stats.totalUsers).toBe(3);
      expect(stats.activeUsers).toBe(3);
    });

    it('should only count active users in window', async () => {
      rateLimiter.recordRequest('user-1');

      await new Promise(resolve => setTimeout(resolve, 1100));

      rateLimiter.recordRequest('user-2');

      const stats = rateLimiter.getStats();
      expect(stats.totalUsers).toBe(2);
      expect(stats.activeUsers).toBe(1); // Only user-2 is active
    });
  });
});

describe('aiRateLimiter singleton', () => {
  beforeEach(() => {
    aiRateLimiter.reset();
  });

  it('should be configured with production limits', () => {
    const userId = 'test-user';

    // Should allow 20 requests
    for (let i = 0; i < 20; i++) {
      expect(aiRateLimiter.canMakeRequest(userId)).toBe(true);
      aiRateLimiter.recordRequest(userId);
    }

    // 21st should be blocked
    expect(aiRateLimiter.canMakeRequest(userId)).toBe(false);
  });

  it('should have 1 minute window', () => {
    const userId = 'test-user';

    // Fill limit
    for (let i = 0; i < 20; i++) {
      aiRateLimiter.recordRequest(userId);
    }

    const resetTime = aiRateLimiter.getTimeUntilReset(userId);
    expect(resetTime).toBeGreaterThan(0);
    expect(resetTime).toBeLessThanOrEqual(60000); // 1 minute
  });
});
