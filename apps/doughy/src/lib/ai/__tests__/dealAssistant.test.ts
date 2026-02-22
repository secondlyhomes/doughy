// Tests for dealAssistant AI service
import { callDealAssistant, generateActionRecommendation, draftCommunication } from '../dealAssistant';
import { AssistantContextSnapshot } from '@/features/assistant/types/context';

// Mock context for testing
const mockDealCockpitContext: AssistantContextSnapshot = {
  app: { version: '1.0.0', platform: 'ios' },
  user: { id: 'user-123', plan: 'pro', timezone: 'America/Chicago' },
  screen: { name: 'DealCockpit', route: '/deals/deal-123' },
  permissions: {
    canWrite: true,
    canSendForESign: true,
    canGenerateReports: true,
  },
  focusMode: false,
  selection: { dealId: 'deal-123' },
  summary: {
    oneLiner: '123 Main St • Analyzing • Next: Get repair estimate',
    lastUpdated: new Date().toISOString(),
  },
  payload: {
    type: 'deal_cockpit',
    deal: {
      id: 'deal-123',
      stage: 'analyzing',
      strategy: 'fix_and_flip',
      nextAction: {
        label: 'Get repair estimate',
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        isOverdue: false,
      },
      numbers: {
        mao: {
          value: 185000,
          confidence: 'high',
          sourceCount: 5,
        },
        profit: {
          value: 45000,
          confidence: 'med',
          sourceCount: 1,
        },
        risk: {
          value: 3,
          band: 'med',
        },
      },
      property: {
        address: '123 Main St, Chicago IL',
        arv: 250000,
        repairCost: 40000,
      },
      lead: {
        name: 'John Seller',
        motivation: 'Needs to sell quickly due to relocation',
      },
    },
    missingInfo: [
      { key: 'rent', label: 'Rent Estimate', severity: 'med' },
    ],
    recentEvents: [
      {
        eventId: 'event-1',
        type: 'stage_change',
        title: 'Stage changed to Analyzing',
        ts: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
};

const mockPropertyContext: AssistantContextSnapshot = {
  ...mockDealCockpitContext,
  screen: { name: 'PropertyDetail', route: '/properties/prop-123' },
  payload: {
    type: 'property_detail',
    propertyId: 'prop-123',
    property: {
      address: '456 Oak Ave, Chicago IL',
      type: 'single_family',
      bedrooms: 3,
      bathrooms: 2,
      sqft: 1800,
      yearBuilt: 1985,
      arv: 280000,
      purchasePrice: 180000,
      repairCost: 45000,
    },
    analysisMetrics: {
      mao: 185000,
      profit: 50000,
      roi: 27.8,
      capRate: 8.5,
      cashFlow: 450,
    },
  },
};

describe('dealAssistant', () => {
  describe('callDealAssistant', () => {
    it('should return a response with content', async () => {
      const response = await callDealAssistant(
        'What should I focus on?',
        mockDealCockpitContext
      );

      expect(response).toHaveProperty('content');
      expect(typeof response.content).toBe('string');
      expect(response.content.length).toBeGreaterThan(0);
    });

    it('should return confidence level', async () => {
      const response = await callDealAssistant(
        'Analyze this deal',
        mockDealCockpitContext
      );

      expect(response).toHaveProperty('confidence');
      expect(['high', 'medium', 'low']).toContain(response.confidence);
    });

    it('should extract suggested actions from response', async () => {
      const response = await callDealAssistant(
        'What should I do next?',
        mockDealCockpitContext
      );

      // Should have suggested actions (in mock mode)
      expect(response.suggestedActions).toBeDefined();
      expect(Array.isArray(response.suggestedActions)).toBe(true);
    });

    it('should handle conversation history', async () => {
      const history = [
        { role: 'user' as const, content: 'Tell me about this property' },
        { role: 'assistant' as const, content: 'This is a 3/2 single family home...' },
      ];

      const response = await callDealAssistant(
        'What are the risks?',
        mockDealCockpitContext,
        history
      );

      expect(response.content).toBeTruthy();
    });

    it('should work with different screen contexts', async () => {
      const dealResponse = await callDealAssistant(
        'Analyze this deal',
        mockDealCockpitContext
      );

      const propertyResponse = await callDealAssistant(
        'Analyze this property',
        mockPropertyContext
      );

      expect(dealResponse.content).toBeTruthy();
      expect(propertyResponse.content).toBeTruthy();
    });

    it('should assess confidence based on missing info', async () => {
      // Context with lots of missing info
      const incompleteDealContext: AssistantContextSnapshot = {
        ...mockDealCockpitContext,
        payload: {
          ...mockDealCockpitContext.payload,
          type: 'deal_cockpit',
          missingInfo: [
            { key: 'arv', label: 'ARV', severity: 'high' },
            { key: 'repairs', label: 'Repairs', severity: 'high' },
            { key: 'strategy', label: 'Strategy', severity: 'high' },
          ],
        },
      };

      const response = await callDealAssistant(
        'What should I do?',
        incompleteDealContext
      );

      // Should have low confidence with lots of missing high-priority info
      expect(response.confidence).toBe('low');
    });
  });

  describe('generateActionRecommendation', () => {
    it('should generate action with rationale and priority', async () => {
      const recommendation = await generateActionRecommendation(mockDealCockpitContext);

      expect(recommendation).toHaveProperty('action');
      expect(recommendation).toHaveProperty('rationale');
      expect(recommendation).toHaveProperty('priority');
      expect(['high', 'medium', 'low']).toContain(recommendation.priority);
    });

    it('should prioritize overdue actions', async () => {
      const overdueContext: AssistantContextSnapshot = {
        ...mockDealCockpitContext,
        payload: {
          ...mockDealCockpitContext.payload,
          type: 'deal_cockpit',
          deal: {
            ...mockDealCockpitContext.payload.deal,
            nextAction: {
              label: 'Call seller',
              dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
              isOverdue: true,
            },
          },
        },
      };

      const recommendation = await generateActionRecommendation(overdueContext);

      expect(recommendation.priority).toBe('high');
    });

    it('should recommend completing underwriting when missing critical data', async () => {
      const missingDataContext: AssistantContextSnapshot = {
        ...mockDealCockpitContext,
        payload: {
          ...mockDealCockpitContext.payload,
          type: 'deal_cockpit',
          missingInfo: [
            { key: 'arv', label: 'ARV', severity: 'high' },
            { key: 'repairs', label: 'Repairs', severity: 'high' },
          ],
        },
      };

      const recommendation = await generateActionRecommendation(missingDataContext);

      expect(recommendation.priority).toBe('high');
      expect(recommendation.action.toLowerCase()).toContain('underwriting');
    });
  });

  describe('draftCommunication', () => {
    it('should draft email text', async () => {
      const draft = await draftCommunication('email', mockDealCockpitContext);

      expect(typeof draft).toBe('string');
      expect(draft.length).toBeGreaterThan(50);
      // Email should have subject line
      expect(draft.toLowerCase()).toContain('subject');
    });

    it('should draft SMS text', async () => {
      const draft = await draftCommunication('sms', mockDealCockpitContext);

      expect(typeof draft).toBe('string');
      // SMS should be shorter than email
      expect(draft.length).toBeLessThan(500);
    });

    it('should draft offer text', async () => {
      const draft = await draftCommunication('offer_text', mockDealCockpitContext);

      expect(typeof draft).toBe('string');
      expect(draft.toLowerCase()).toContain('option');
    });

    it('should accept custom instructions', async () => {
      const draft = await draftCommunication(
        'email',
        mockDealCockpitContext,
        'Focus on their timeline concerns'
      );

      expect(typeof draft).toBe('string');
      expect(draft.length).toBeGreaterThan(50);
    });
  });

  describe('context compression', () => {
    it('should compress deal context efficiently', async () => {
      // This is tested indirectly through callDealAssistant
      // The compressed context should contain key info but be concise
      const response = await callDealAssistant(
        'Summarize this deal',
        mockDealCockpitContext
      );

      // Should get a response even with complex context
      expect(response.content).toBeTruthy();
    });

    it('should handle minimal context', async () => {
      const minimalContext: AssistantContextSnapshot = {
        ...mockDealCockpitContext,
        payload: {
          type: 'generic',
          screenName: 'Home',
        },
      };

      const response = await callDealAssistant('Hello', minimalContext);

      expect(response.content).toBeTruthy();
    });
  });
});
