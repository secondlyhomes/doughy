// Tests for useAssistantContext hook
import { renderHook } from '@testing-library/react-native';
import { useAssistantContext } from '../useAssistantContext';

// Mock dependencies
jest.mock('expo-router', () => ({
  usePathname: jest.fn(() => '/deals/deal-123'),
  useLocalSearchParams: jest.fn(() => ({ dealId: 'deal-123' })),
}));

jest.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: jest.fn(() => ({
    profile: { id: 'user-123', role: 'admin' },
    isAuthenticated: true,
  })),
}));

jest.mock('@/features/deals/hooks/useDeals', () => ({
  useDeal: jest.fn(() => ({
    deal: {
      id: 'deal-123',
      stage: 'analyzing',
      strategy: 'fix_and_flip',
      property: {
        address: '123 Main St',
        arv: 250000,
        repair_cost: 40000,
      },
      lead: {
        name: 'John Seller',
      },
    },
  })),
}));

jest.mock('@/features/real-estate/hooks/useProperties', () => ({
  useProperty: jest.fn(() => ({
    property: null,
  })),
}));

jest.mock('@/features/deals/hooks/useNextAction', () => ({
  useNextAction: jest.fn(() => ({
    action: 'Get repair estimate',
    category: 'analyze',
    priority: 'high',
    isOverdue: false,
  })),
}));

jest.mock('@/features/real-estate/hooks/useDealAnalysis', () => ({
  useDealAnalysis: jest.fn(() => ({
    mao: 185000,
    netProfit: 45000,
    roi: 24.3,
  })),
}));

jest.mock('@/features/deals/hooks/useDealEvents', () => ({
  useDealEvents: jest.fn(() => ({
    recentEvents: [
      {
        id: 'event-1',
        event_type: 'stage_change',
        title: 'Stage changed',
        created_at: new Date().toISOString(),
      },
    ],
  })),
}));

describe('useAssistantContext', () => {
  it('should build context with app and user info', () => {
    const { result } = renderHook(() => useAssistantContext());

    expect(result.current.app).toBeDefined();
    expect(result.current.app.version).toBeDefined();
    expect(result.current.app.platform).toBeDefined();

    expect(result.current.user).toBeDefined();
    expect(result.current.user.id).toBe('user-123');
    expect(result.current.user.plan).toBe('elite'); // Admin gets elite
  });

  it('should detect screen name from pathname', () => {
    const { result } = renderHook(() => useAssistantContext());

    expect(result.current.screen.name).toBe('DealCockpit');
    expect(result.current.screen.route).toBe('/deals/deal-123');
  });

  it('should build deal cockpit payload with deal data', () => {
    const { result } = renderHook(() => useAssistantContext());

    expect(result.current.payload.type).toBe('deal_cockpit');

    if (result.current.payload.type === 'deal_cockpit') {
      expect(result.current.payload.deal.id).toBe('deal-123');
      expect(result.current.payload.deal.stage).toBe('analyzing');
      expect(result.current.payload.deal.nextAction).toBeDefined();
    }
  });

  it('should include deal numbers when available', () => {
    const { result } = renderHook(() => useAssistantContext());

    if (result.current.payload.type === 'deal_cockpit') {
      expect(result.current.payload.deal.numbers.mao).toBeDefined();
      expect(result.current.payload.deal.numbers.mao?.value).toBe(185000);
    }
  });

  it('should identify missing info', () => {
    const { result } = renderHook(() => useAssistantContext());

    if (result.current.payload.type === 'deal_cockpit') {
      expect(result.current.payload.missingInfo).toBeDefined();
      // Depends on what's missing in mock deal
      expect(Array.isArray(result.current.payload.missingInfo)).toBe(true);
    }
  });

  it('should include recent events', () => {
    const { result } = renderHook(() => useAssistantContext());

    if (result.current.payload.type === 'deal_cockpit') {
      expect(result.current.payload.recentEvents).toBeDefined();
      expect(result.current.payload.recentEvents.length).toBeGreaterThan(0);
    }
  });

  it('should generate contextual summary', () => {
    const { result } = renderHook(() => useAssistantContext());

    expect(result.current.summary.oneLiner).toBeDefined();
    expect(result.current.summary.oneLiner.length).toBeGreaterThan(0);
    expect(result.current.summary.lastUpdated).toBeDefined();
  });

  it('should set permissions based on user role', () => {
    const { result } = renderHook(() => useAssistantContext());

    expect(result.current.permissions.canWrite).toBe(true);
    expect(result.current.permissions.canSendForESign).toBe(true); // Admin
  });

  it('should handle focus mode option', () => {
    const { result } = renderHook(() => useAssistantContext({ focusMode: true }));

    expect(result.current.focusMode).toBe(true);
  });

  it('should handle empty context when not authenticated', () => {
    // Mock unauthenticated state
    const useAuth = require('@/features/auth/hooks/useAuth').useAuth;
    useAuth.mockReturnValueOnce({
      profile: null,
      isAuthenticated: false,
    });

    const { result } = renderHook(() => useAssistantContext());

    expect(result.current.payload.type).toBe('generic');
  });
});

describe('screen name detection', () => {
  it('should detect QuickUnderwrite screen', () => {
    const usePathname = require('expo-router').usePathname;
    usePathname.mockReturnValue('/deals/deal-123/underwrite');

    const { result } = renderHook(() => useAssistantContext());

    expect(result.current.screen.name).toBe('QuickUnderwrite');
  });

  it('should detect OfferBuilder screen', () => {
    const usePathname = require('expo-router').usePathname;
    usePathname.mockReturnValue('/deals/deal-123/offer');

    const { result } = renderHook(() => useAssistantContext());

    expect(result.current.screen.name).toBe('OfferBuilder');
  });

  it('should detect FieldMode screen', () => {
    const usePathname = require('expo-router').usePathname;
    usePathname.mockReturnValue('/deals/deal-123/field-mode');

    const { result } = renderHook(() => useAssistantContext());

    expect(result.current.screen.name).toBe('FieldMode');
  });

  it('should detect PropertyDetail screen', () => {
    const usePathname = require('expo-router').usePathname;
    usePathname.mockReturnValue('/properties/prop-456');

    const { result } = renderHook(() => useAssistantContext());

    expect(result.current.screen.name).toBe('PropertyDetail');
  });

  it('should detect Inbox screen', () => {
    const usePathname = require('expo-router').usePathname;
    usePathname.mockReturnValue('/');

    const { result } = renderHook(() => useAssistantContext());

    expect(result.current.screen.name).toBe('Inbox');
  });
});

describe('payload generators', () => {
  it('should use DealsList payload for deals list', () => {
    const usePathname = require('expo-router').usePathname;
    usePathname.mockReturnValue('/deals');
    const useLocalSearchParams = require('expo-router').useLocalSearchParams;
    useLocalSearchParams.mockReturnValue({});

    const { result } = renderHook(() => useAssistantContext());

    expect(result.current.screen.name).toBe('DealsList');
    expect(result.current.payload.type).toBe('generic');
  });

  it('should use generic payload for unknown screens', () => {
    const usePathname = require('expo-router').usePathname;
    usePathname.mockReturnValue('/some/unknown/path');

    const { result } = renderHook(() => useAssistantContext());

    expect(result.current.payload.type).toBe('generic');
  });
});
