// src/lib/ai/__tests__/cache.test.ts
// Tests for AI response caching system

import {
  getCachedResponse,
  cacheResponse,
  clearCache,
} from '../cache';
import { AssistantContextSnapshot } from '@/features/assistant/types/context';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiRemove: jest.fn(),
}));

describe('AI Cache', () => {
  beforeEach(async () => {
    await clearCache();
    jest.clearAllMocks();
  });

  describe('cache isolation by userId', () => {
    it('should generate different cache keys for different users asking the same question', async () => {
      const userAContext: AssistantContextSnapshot = {
        app: { version: '1.0.0', platform: 'ios' },
        user: { id: 'user-a', plan: 'pro', timezone: 'America/New_York' },
        screen: { name: 'DealCockpit', route: '/deals/123' },
        permissions: { canWrite: true, canSendForESign: false, canGenerateReports: true },
        focusMode: false,
        selection: { dealId: 'deal-123' },
        summary: { oneLiner: 'Deal analysis', lastUpdated: new Date().toISOString() },
        payload: {
          type: 'deal_cockpit',
          deal: {
            id: 'deal-123',
            stage: 'analyzing' as any,
            strategy: 'flip' as any,
            numbers: {},
          },
          missingInfo: [],
          recentEvents: [],
        },
      };

      const userBContext: AssistantContextSnapshot = {
        ...userAContext,
        user: { id: 'user-b', plan: 'pro', timezone: 'America/New_York' },
      };

      const question = 'What should I focus on?';

      // User A caches a response
      await cacheResponse(question, 'User A specific advice about deal 123', userAContext);

      // User B should NOT get User A's cached response
      const userBCached = await getCachedResponse(question, userBContext);
      expect(userBCached).toBeNull();

      // User A should get their own cached response
      const userACached = await getCachedResponse(question, userAContext);
      expect(userACached).toBe('User A specific advice about deal 123');
    });

    it('should isolate cache for anonymous users', async () => {
      const anonymousContext1: AssistantContextSnapshot = {
        app: { version: '1.0.0', platform: 'ios' },
        user: { id: '', plan: 'starter', timezone: 'America/New_York' },
        screen: { name: 'DealCockpit', route: '/deals/123' },
        permissions: { canWrite: false, canSendForESign: false, canGenerateReports: false },
        focusMode: false,
        selection: { dealId: 'deal-123' },
        summary: { oneLiner: 'Deal analysis', lastUpdated: new Date().toISOString() },
        payload: {
          type: 'generic',
          screenName: 'DealCockpit',
        },
      };

      const question = 'What should I do?';

      // Anonymous user caches response
      await cacheResponse(question, 'Anonymous user advice', anonymousContext1);

      // Same anonymous user should get cached response
      const cached = await getCachedResponse(question, anonymousContext1);
      expect(cached).toBe('Anonymous user advice');
    });
  });

  describe('cache functionality', () => {
    const mockContext: AssistantContextSnapshot = {
      app: { version: '1.0.0', platform: 'ios' },
      user: { id: 'test-user', plan: 'pro', timezone: 'America/New_York' },
      screen: { name: 'DealCockpit', route: '/deals/123' },
      permissions: { canWrite: true, canSendForESign: true, canGenerateReports: true },
      focusMode: false,
      selection: { dealId: 'deal-123' },
      summary: { oneLiner: 'Test deal', lastUpdated: new Date().toISOString() },
      payload: {
        type: 'deal_cockpit',
        deal: {
          id: 'deal-123',
          stage: 'analyzing' as any,
          numbers: {},
        },
        missingInfo: [],
        recentEvents: [],
      },
    };

    it('should cache and retrieve responses', async () => {
      const message = 'What is the MAO?';
      const response = 'The MAO is $150,000 based on your ARV and repair estimates.';

      await cacheResponse(message, response, mockContext);
      const cached = await getCachedResponse(message, mockContext);

      expect(cached).toBe(response);
    });

    it('should return null for cache miss', async () => {
      const cached = await getCachedResponse('Never asked before', mockContext);
      expect(cached).toBeNull();
    });

    it('should invalidate cache when context changes', async () => {
      const message = 'What is the deal status?';
      const response = 'Deal is in analyzing stage';

      await cacheResponse(message, response, mockContext);

      // Change deal stage - should invalidate cache
      const changedContext: AssistantContextSnapshot = {
        ...mockContext,
        payload: {
          type: 'deal_cockpit',
          deal: {
            id: 'deal-123',
            stage: 'offer_sent' as any,
            numbers: {},
          },
          missingInfo: [],
          recentEvents: [],
        },
      };

      const cached = await getCachedResponse(message, changedContext);
      expect(cached).toBeNull(); // Cache should be invalidated
    });

    it('should work with different screen contexts', async () => {
      const dealCockpitMessage = 'What should I do next?';
      const dealResponse = 'Send the offer to the seller';

      await cacheResponse(dealCockpitMessage, dealResponse, mockContext);

      // Different screen - should be different cache
      const propertyContext: AssistantContextSnapshot = {
        ...mockContext,
        screen: { name: 'PropertyDetail', route: '/properties/456' },
        selection: { propertyId: 'prop-456' },
        payload: {
          type: 'property_detail',
          propertyId: 'prop-456',
          property: {
            address: '123 Main St',
          },
        },
      };

      const propertyCached = await getCachedResponse(dealCockpitMessage, propertyContext);
      expect(propertyCached).toBeNull(); // Different screen = different cache
    });

    it('should handle missing context gracefully', async () => {
      const message = 'Generic question';
      const response = 'Generic answer';

      await cacheResponse(message, response, undefined);
      const cached = await getCachedResponse(message, undefined);

      expect(cached).toBe(response);
    });
  });

  describe('cache clearing', () => {
    const mockContext: AssistantContextSnapshot = {
      app: { version: '1.0.0', platform: 'ios' },
      user: { id: 'test-user', plan: 'pro', timezone: 'America/New_York' },
      screen: { name: 'DealCockpit', route: '/deals/123' },
      permissions: { canWrite: true, canSendForESign: true, canGenerateReports: true },
      focusMode: false,
      selection: { dealId: 'deal-123' },
      summary: { oneLiner: 'Test deal', lastUpdated: new Date().toISOString() },
      payload: { type: 'generic', screenName: 'DealCockpit' },
    };

    it('should clear all cached responses', async () => {
      // Cache multiple responses
      await cacheResponse('Question 1', 'Answer 1', mockContext);
      await cacheResponse('Question 2', 'Answer 2', mockContext);

      // Verify cached
      expect(await getCachedResponse('Question 1', mockContext)).toBe('Answer 1');
      expect(await getCachedResponse('Question 2', mockContext)).toBe('Answer 2');

      // Clear cache
      await clearCache();

      // Verify cleared
      expect(await getCachedResponse('Question 1', mockContext)).toBeNull();
      expect(await getCachedResponse('Question 2', mockContext)).toBeNull();
    });
  });

  describe('LRU eviction', () => {
    const mockContext: AssistantContextSnapshot = {
      app: { version: '1.0.0', platform: 'ios' },
      user: { id: 'lru-test-user', plan: 'pro', timezone: 'America/New_York' },
      screen: { name: 'DealCockpit', route: '/deals/123' },
      permissions: { canWrite: true, canSendForESign: true, canGenerateReports: true },
      focusMode: false,
      selection: { dealId: 'deal-123' },
      summary: { oneLiner: 'Test deal', lastUpdated: new Date().toISOString() },
      payload: { type: 'generic', screenName: 'DealCockpit' },
    };

    it('should evict least recently used entry, not oldest inserted', async () => {
      // Clear cache first
      await clearCache();

      // Fill cache to limit (50 entries)
      for (let i = 0; i < 50; i++) {
        await cacheResponse(`Question ${i}`, `Answer ${i}`, mockContext);
      }

      // Access Question 0 (make it recently used)
      const accessed = await getCachedResponse('Question 0', mockContext);
      expect(accessed).toBe('Answer 0');

      // Add one more entry (should evict Question 1, not Question 0)
      await cacheResponse('Question 50', 'Answer 50', mockContext);

      // Question 0 should still be cached (was accessed recently)
      const question0 = await getCachedResponse('Question 0', mockContext);
      expect(question0).toBe('Answer 0');

      // Question 1 should be evicted (least recently used)
      const question1 = await getCachedResponse('Question 1', mockContext);
      expect(question1).toBeNull();

      // Question 50 should be cached (just added)
      const question50 = await getCachedResponse('Question 50', mockContext);
      expect(question50).toBe('Answer 50');
    });

    it('should update position on cache hits', async () => {
      await clearCache();

      // Add 3 entries
      await cacheResponse('A', 'Answer A', mockContext);
      await cacheResponse('B', 'Answer B', mockContext);
      await cacheResponse('C', 'Answer C', mockContext);

      // Access A (moves it to end)
      await getCachedResponse('A', mockContext);

      // Access B (moves it to end)
      await getCachedResponse('B', mockContext);

      // Now order should be: C (oldest), A, B (newest)
      // Fill cache to trigger eviction
      for (let i = 0; i < 48; i++) {
        await cacheResponse(`Filler ${i}`, `Answer ${i}`, mockContext);
      }

      // C should be evicted first
      expect(await getCachedResponse('C', mockContext)).toBeNull();

      // A and B should still be cached
      expect(await getCachedResponse('A', mockContext)).toBe('Answer A');
      expect(await getCachedResponse('B', mockContext)).toBe('Answer B');
    });
  });
});
