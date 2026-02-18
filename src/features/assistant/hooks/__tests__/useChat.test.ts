// Tests for useChat hook
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useChat, Message } from '../useChat';
import { AssistantContextSnapshot } from '../../types/context';

// Mock context for testing
const mockContext: AssistantContextSnapshot = {
  app: { version: '1.0.0', platform: 'ios' },
  user: { id: 'user-123', plan: 'pro', timezone: 'America/Chicago' },
  screen: { name: 'DealCockpit', route: '/deals/deal-123' },
  permissions: { canWrite: true, canSendForESign: false },
  focusMode: false,
  selection: { dealId: 'deal-123' },
  summary: { oneLiner: 'Analyzing deal at 123 Main St', lastUpdated: new Date().toISOString() },
  payload: { type: 'deal_cockpit' },
};

describe('useChat', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('initial state', () => {
    it('should start with empty messages', () => {
      const { result } = renderHook(() => useChat());

      expect(result.current.messages).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('sendMessage', () => {
    it('should add user message immediately', async () => {
      const { result } = renderHook(() => useChat());

      await act(async () => {
        result.current.sendMessage('Hello AI');
      });

      expect(result.current.messages.length).toBeGreaterThanOrEqual(1);
      expect(result.current.messages[0].role).toBe('user');
      expect(result.current.messages[0].content).toBe('Hello AI');
    });

    it('should set isLoading to true while processing', async () => {
      const { result } = renderHook(() => useChat());

      act(() => {
        result.current.sendMessage('Test message');
      });

      expect(result.current.isLoading).toBe(true);
    });

    it('should add assistant response after delay', async () => {
      const { result } = renderHook(() => useChat());

      await act(async () => {
        result.current.sendMessage('Test question');
      });

      // Fast-forward through the mock delay
      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(result.current.messages.length).toBe(2);
        expect(result.current.messages[1].role).toBe('assistant');
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should not send empty messages', async () => {
      const { result } = renderHook(() => useChat());

      await act(async () => {
        result.current.sendMessage('');
        result.current.sendMessage('   ');
      });

      expect(result.current.messages.length).toBe(0);
    });

    it('should trim message content', async () => {
      const { result } = renderHook(() => useChat());

      await act(async () => {
        result.current.sendMessage('  Trimmed message  ');
      });

      expect(result.current.messages[0].content).toBe('Trimmed message');
    });

    it('should include context metadata in user message', async () => {
      const { result } = renderHook(() => useChat());

      await act(async () => {
        result.current.sendMessage('Question about deal', mockContext);
      });

      const userMessage = result.current.messages[0];
      expect(userMessage.metadata).toBeDefined();
      expect(userMessage.metadata?.screen).toBe('DealCockpit');
      expect(userMessage.metadata?.dealId).toBe('deal-123');
    });

    it('should not include metadata when no context provided', async () => {
      const { result } = renderHook(() => useChat());

      await act(async () => {
        result.current.sendMessage('Generic question');
      });

      const userMessage = result.current.messages[0];
      expect(userMessage.metadata).toBeUndefined();
    });
  });

  describe('message structure', () => {
    it('should generate unique message IDs', async () => {
      const { result } = renderHook(() => useChat());

      await act(async () => {
        result.current.sendMessage('First');
      });

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      await act(async () => {
        result.current.sendMessage('Second');
      });

      const ids = result.current.messages.map((m) => m.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should include timestamp in messages', async () => {
      const { result } = renderHook(() => useChat());

      await act(async () => {
        result.current.sendMessage('Test');
      });

      expect(result.current.messages[0].createdAt).toBeDefined();
      expect(new Date(result.current.messages[0].createdAt).getTime()).not.toBeNaN();
    });

    it('should have user ID prefix for user messages', async () => {
      const { result } = renderHook(() => useChat());

      await act(async () => {
        result.current.sendMessage('User message');
      });

      expect(result.current.messages[0].id.startsWith('user-')).toBe(true);
    });

    it('should have assistant ID prefix for assistant messages', async () => {
      const { result } = renderHook(() => useChat());

      await act(async () => {
        result.current.sendMessage('Question');
      });

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        const assistantMessage = result.current.messages.find((m) => m.role === 'assistant');
        expect(assistantMessage?.id.startsWith('assistant-')).toBe(true);
      });
    });
  });

  describe('clearMessages', () => {
    it('should clear all messages', async () => {
      const { result } = renderHook(() => useChat());

      await act(async () => {
        result.current.sendMessage('Message 1');
      });

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(result.current.messages.length).toBe(2);
      });

      act(() => {
        result.current.clearMessages();
      });

      expect(result.current.messages).toEqual([]);
    });

    it('should also clear error state', async () => {
      const { result } = renderHook(() => useChat());

      // Trigger a message flow
      await act(async () => {
        result.current.sendMessage('Test');
      });

      act(() => {
        result.current.clearMessages();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('multiple messages', () => {
    it('should maintain message order', async () => {
      const { result } = renderHook(() => useChat());

      await act(async () => {
        result.current.sendMessage('First');
      });

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(result.current.messages.length).toBe(2);
      });

      await act(async () => {
        result.current.sendMessage('Second');
      });

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(result.current.messages.length).toBe(4);
      });

      expect(result.current.messages[0].content).toBe('First');
      expect(result.current.messages[1].role).toBe('assistant');
      expect(result.current.messages[2].content).toBe('Second');
      expect(result.current.messages[3].role).toBe('assistant');
    });
  });

  describe('assistant response', () => {
    it('should include contextUsed metadata', async () => {
      const { result } = renderHook(() => useChat());

      await act(async () => {
        result.current.sendMessage('With context', mockContext);
      });

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        const assistantMessage = result.current.messages.find((m) => m.role === 'assistant');
        expect(assistantMessage?.metadata?.contextUsed).toBe(true);
      });
    });

    it('should mark contextUsed as false when no context', async () => {
      const { result } = renderHook(() => useChat());

      await act(async () => {
        result.current.sendMessage('Without context');
      });

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        const assistantMessage = result.current.messages.find((m) => m.role === 'assistant');
        expect(assistantMessage?.metadata?.contextUsed).toBe(false);
      });
    });
  });
});
