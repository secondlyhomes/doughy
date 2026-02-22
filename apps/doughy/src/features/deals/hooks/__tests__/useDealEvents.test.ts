// Tests for useDealEvents hook
// Zone B: Task B2 - Deal events/timeline system

import { logDealEvent, LogEventInput } from '../useDealEvents';
import { DealEvent, DealEventType, KEY_EVENT_TYPES, EVENT_TYPE_CONFIG } from '../../types/events';

// We test the pure functions and types since the hook itself requires React Query context

describe('useDealEvents - Types and Utilities', () => {
  describe('DealEventType', () => {
    const allEventTypes: DealEventType[] = [
      'stage_change',
      'next_action_set',
      'offer_created',
      'offer_sent',
      'offer_countered',
      'walkthrough_started',
      'walkthrough_completed',
      'assumption_updated',
      'seller_report_generated',
      'document_uploaded',
      'document_signed',
      'risk_score_changed',
      'note',
      'ai_action_applied',
      'ai_job_completed',
    ];

    it('should have all expected event types', () => {
      allEventTypes.forEach((type) => {
        expect(EVENT_TYPE_CONFIG[type]).toBeDefined();
      });
    });

    it('should have correct structure for each event type config', () => {
      allEventTypes.forEach((type) => {
        const config = EVENT_TYPE_CONFIG[type];
        expect(config.label).toBeDefined();
        expect(typeof config.label).toBe('string');
        expect(config.iconName).toBeDefined();
        expect(typeof config.iconName).toBe('string');
        expect(config.colorKey).toBeDefined();
        expect(typeof config.colorKey).toBe('string');
      });
    });
  });

  describe('KEY_EVENT_TYPES', () => {
    it('should include key events for Focus Mode', () => {
      expect(KEY_EVENT_TYPES).toContain('stage_change');
      expect(KEY_EVENT_TYPES).toContain('offer_sent');
      expect(KEY_EVENT_TYPES).toContain('walkthrough_completed');
      expect(KEY_EVENT_TYPES).toContain('seller_report_generated');
    });

    it('should not include minor events', () => {
      expect(KEY_EVENT_TYPES).not.toContain('note');
      expect(KEY_EVENT_TYPES).not.toContain('next_action_set');
      expect(KEY_EVENT_TYPES).not.toContain('assumption_updated');
    });
  });

  describe('logDealEvent function', () => {
    it('should accept valid event input', async () => {
      const input: LogEventInput = {
        deal_id: 'deal-123',
        event_type: 'note',
        title: 'Test note',
        description: 'Test description',
        source: 'user',
      };

      // In mock mode, this should succeed
      const result = await logDealEvent(input);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.deal_id).toBe('deal-123');
      expect(result.event_type).toBe('note');
      expect(result.title).toBe('Test note');
      expect(result.source).toBe('user');
      expect(result.created_at).toBeDefined();
    });

    it('should default source to system when not provided', async () => {
      const input: LogEventInput = {
        deal_id: 'deal-456',
        event_type: 'stage_change',
        title: 'Stage changed',
      };

      const result = await logDealEvent(input);

      expect(result.source).toBe('system');
    });

    it('should accept ai as source', async () => {
      const input: LogEventInput = {
        deal_id: 'deal-789',
        event_type: 'ai_action_applied',
        title: 'AI applied changes',
        source: 'ai',
        metadata: { patch_set_id: 'ps_123' },
      };

      const result = await logDealEvent(input);

      expect(result.source).toBe('ai');
      expect(result.metadata).toEqual({ patch_set_id: 'ps_123' });
    });

    it('should handle metadata correctly', async () => {
      const input: LogEventInput = {
        deal_id: 'deal-999',
        event_type: 'stage_change',
        title: 'Stage changed',
        metadata: {
          from: 'new',
          to: 'contacted',
        },
      };

      const result = await logDealEvent(input);

      expect(result.metadata).toEqual({
        from: 'new',
        to: 'contacted',
      });
    });
  });

  describe('DealEvent interface', () => {
    it('should have correct shape', () => {
      const event: DealEvent = {
        id: 'event-123',
        deal_id: 'deal-456',
        event_type: 'note',
        title: 'Test event',
        description: 'Test description',
        metadata: { key: 'value' },
        source: 'user',
        created_by: 'user-789',
        created_at: new Date().toISOString(),
      };

      expect(event.id).toBe('event-123');
      expect(event.deal_id).toBe('deal-456');
      expect(event.event_type).toBe('note');
      expect(event.title).toBe('Test event');
      expect(event.source).toBe('user');
    });

    it('should allow optional fields to be undefined', () => {
      const event: DealEvent = {
        id: 'event-123',
        deal_id: 'deal-456',
        event_type: 'note',
        title: 'Test event',
        source: 'system',
        created_at: new Date().toISOString(),
      };

      expect(event.description).toBeUndefined();
      expect(event.metadata).toBeUndefined();
      expect(event.created_by).toBeUndefined();
    });
  });
});

describe('Event Type Display Config', () => {
  it('should have unique labels for each event type', () => {
    const labels = Object.values(EVENT_TYPE_CONFIG).map((c) => c.label);
    const uniqueLabels = new Set(labels);
    expect(labels.length).toBe(uniqueLabels.size);
  });

  it('should use valid color keys', () => {
    const validColorKeys = ['primary', 'info', 'success', 'warning', 'destructive', 'mutedForeground'];
    Object.values(EVENT_TYPE_CONFIG).forEach((config) => {
      expect(validColorKeys).toContain(config.colorKey);
    });
  });
});
