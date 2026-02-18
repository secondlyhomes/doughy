// Tests for mockWalkthrough data utilities
import {
  mockWalkthrough,
  mockWalkthroughItems,
  mockAISummary,
  emptyWalkthrough,
  inProgressWalkthrough,
  getItemsByBucket,
  getPhotoCountByBucket,
  getMemoCountByBucket,
} from '../mockWalkthrough';

describe('mockWalkthrough data', () => {
  describe('mockWalkthrough', () => {
    it('should have valid structure', () => {
      expect(mockWalkthrough.id).toBeDefined();
      expect(mockWalkthrough.deal_id).toBeDefined();
      expect(mockWalkthrough.status).toBe('organized');
      expect(mockWalkthrough.items).toBeDefined();
      expect(mockWalkthrough.ai_summary).toBeDefined();
    });

    it('should have items array', () => {
      expect(Array.isArray(mockWalkthrough.items)).toBe(true);
      expect(mockWalkthrough.items!.length).toBeGreaterThan(0);
    });

    it('should have AI summary', () => {
      expect(mockWalkthrough.ai_summary).toEqual(mockAISummary);
    });
  });

  describe('mockAISummary', () => {
    it('should have issues array', () => {
      expect(Array.isArray(mockAISummary.issues)).toBe(true);
      expect(mockAISummary.issues.length).toBeGreaterThan(0);
    });

    it('should have questions array', () => {
      expect(Array.isArray(mockAISummary.questions)).toBe(true);
      expect(mockAISummary.questions.length).toBeGreaterThan(0);
    });

    it('should have scope_bullets array', () => {
      expect(Array.isArray(mockAISummary.scope_bullets)).toBe(true);
      expect(mockAISummary.scope_bullets.length).toBeGreaterThan(0);
    });
  });

  describe('mockWalkthroughItems', () => {
    it('should have valid items with required fields', () => {
      mockWalkthroughItems.forEach((item) => {
        expect(item.id).toBeDefined();
        expect(item.walkthrough_id).toBeDefined();
        expect(item.bucket).toBeDefined();
        expect(item.item_type).toMatch(/^(photo|voice_memo)$/);
      });
    });

    it('should have items across multiple buckets', () => {
      const buckets = new Set(mockWalkthroughItems.map((item) => item.bucket));
      expect(buckets.size).toBeGreaterThan(1);
    });

    it('should have both photos and voice memos', () => {
      const photos = mockWalkthroughItems.filter((item) => item.item_type === 'photo');
      const memos = mockWalkthroughItems.filter((item) => item.item_type === 'voice_memo');

      expect(photos.length).toBeGreaterThan(0);
      expect(memos.length).toBeGreaterThan(0);
    });

    it('should have voice memos with transcripts', () => {
      const memos = mockWalkthroughItems.filter((item) => item.item_type === 'voice_memo');
      const memosWithTranscripts = memos.filter((m) => m.transcript);

      expect(memosWithTranscripts.length).toBeGreaterThan(0);
    });
  });

  describe('emptyWalkthrough', () => {
    it('should have empty items array', () => {
      expect(emptyWalkthrough.items).toEqual([]);
    });

    it('should have in_progress status', () => {
      expect(emptyWalkthrough.status).toBe('in_progress');
    });

    it('should have no AI summary', () => {
      expect(emptyWalkthrough.ai_summary).toBeUndefined();
    });
  });

  describe('inProgressWalkthrough', () => {
    it('should have in_progress status', () => {
      expect(inProgressWalkthrough.status).toBe('in_progress');
    });

    it('should have some items but fewer than complete walkthrough', () => {
      expect(inProgressWalkthrough.items!.length).toBeGreaterThan(0);
      expect(inProgressWalkthrough.items!.length).toBeLessThan(mockWalkthroughItems.length);
    });
  });

  describe('getItemsByBucket', () => {
    it('should filter items by bucket', () => {
      const exteriorItems = getItemsByBucket(mockWalkthroughItems, 'exterior_roof');

      expect(exteriorItems.length).toBeGreaterThan(0);
      exteriorItems.forEach((item) => {
        expect(item.bucket).toBe('exterior_roof');
      });
    });

    it('should return empty array for bucket with no items', () => {
      const emptyBucketItems = getItemsByBucket([], 'exterior_roof');
      expect(emptyBucketItems).toEqual([]);
    });
  });

  describe('getPhotoCountByBucket', () => {
    it('should count only photos in bucket', () => {
      const count = getPhotoCountByBucket(mockWalkthroughItems, 'exterior_roof');

      const manualCount = mockWalkthroughItems.filter(
        (item) => item.bucket === 'exterior_roof' && item.item_type === 'photo'
      ).length;

      expect(count).toBe(manualCount);
    });

    it('should return 0 for bucket with no photos', () => {
      const count = getPhotoCountByBucket([], 'exterior_roof');
      expect(count).toBe(0);
    });
  });

  describe('getMemoCountByBucket', () => {
    it('should count only voice memos in bucket', () => {
      const count = getMemoCountByBucket(mockWalkthroughItems, 'exterior_roof');

      const manualCount = mockWalkthroughItems.filter(
        (item) => item.bucket === 'exterior_roof' && item.item_type === 'voice_memo'
      ).length;

      expect(count).toBe(manualCount);
    });

    it('should return 0 for bucket with no memos', () => {
      const count = getMemoCountByBucket([], 'kitchen');
      expect(count).toBe(0);
    });
  });
});
