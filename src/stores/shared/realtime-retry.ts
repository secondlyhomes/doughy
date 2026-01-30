// src/stores/shared/realtime-retry.ts
// Shared realtime subscription retry logic for conversation stores
// Extracted to reduce duplication (~200 lines saved across both stores)

import { supabase } from '@/lib/supabase';

export interface RealtimeConfig {
  channelName: string;
  userId: string;
  tables: Array<{
    tableName: string;
    onEvent: (payload: Record<string, unknown>) => Promise<void>;
  }>;
  onStatusChange?: (status: SubscriptionStatus) => void;
}

export type SubscriptionStatus = {
  isSubscribed: boolean;
  isSubscribing: boolean;
  error: string | null;
};

export interface RealtimeSubscription {
  unsubscribe: () => void;
}

// Constants for retry logic
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 2000;
const RAPID_FAILURE_THRESHOLD = 5000; // ms
const MAX_RAPID_FAILURES = 3;

/**
 * Creates a realtime subscription with automatic retry and filter fallback logic.
 * Handles the complex retry/fallback behavior that was duplicated in both stores.
 *
 * @param config - Configuration for the subscription
 * @returns Cleanup function to unsubscribe
 */
export function createRealtimeSubscription(config: RealtimeConfig): () => void {
  const { channelName, userId, tables, onStatusChange } = config;

  let retryCount = 0;
  let currentChannel: ReturnType<typeof supabase.channel> | null = null;
  let isCleanedUp = false;
  let lastSubscribedAt = 0;
  let rapidFailureCount = 0;
  let useFilters = true;

  const updateStatus = (status: Partial<SubscriptionStatus>) => {
    onStatusChange?.({
      isSubscribed: false,
      isSubscribing: false,
      error: null,
      ...status,
    });
  };

  const subscribe = () => {
    if (isCleanedUp) return;

    const channelBuilder = supabase.channel(channelName);

    // Add listeners for each table
    for (const table of tables) {
      if (useFilters) {
        channelBuilder.on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: table.tableName,
            filter: `user_id=eq.${userId}`,
          },
          async (payload) => {
            if (isCleanedUp) return;
            if (__DEV__) {
              console.log(`[Real-time] ${table.tableName} change:`, payload.eventType);
            }
            try {
              await table.onEvent(payload.new as Record<string, unknown>);
            } catch (error) {
              console.warn(`[Real-time] Failed to handle ${table.tableName} event`, {
                error: error instanceof Error ? error.message : String(error),
              });
            }
          }
        );
      } else {
        // No filter - filter client-side
        channelBuilder.on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: table.tableName,
          },
          async (payload) => {
            if (isCleanedUp) return;
            const record = payload.new as Record<string, unknown>;
            // Client-side filter
            if (record?.user_id !== userId) return;

            if (__DEV__) {
              console.log(`[Real-time] ${table.tableName} change:`, payload.eventType);
            }
            try {
              await table.onEvent(record);
            } catch (error) {
              console.warn(`[Real-time] Failed to handle ${table.tableName} event`, {
                error: error instanceof Error ? error.message : String(error),
              });
            }
          }
        );
      }
    }

    currentChannel = channelBuilder.subscribe((status, error) => {
      if (isCleanedUp) return;

      if (status === 'SUBSCRIBED') {
        lastSubscribedAt = Date.now();
        retryCount = 0;
        rapidFailureCount = 0;
        updateStatus({ isSubscribed: true, isSubscribing: false, error: null });
        if (__DEV__) {
          console.log(
            `[Real-time] ${channelName} subscription active`,
            useFilters ? '(with filters)' : '(without filters)'
          );
        }
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        updateStatus({ isSubscribed: false });

        // Check for rapid failure
        const timeSinceSubscribed = Date.now() - lastSubscribedAt;
        if (lastSubscribedAt > 0 && timeSinceSubscribed < RAPID_FAILURE_THRESHOLD) {
          rapidFailureCount++;
        }

        // Check for mismatch error
        const errorMessage = error?.message || String(error) || '';
        const isMismatchError = errorMessage.includes('mismatch');

        // If mismatch with filters, try without filters
        if (isMismatchError && useFilters && !isCleanedUp) {
          if (__DEV__) {
            console.log(`[Real-time] ${channelName} filter mismatch, retrying without filters`);
          }
          useFilters = false;
          retryCount = 0;
          if (currentChannel) {
            supabase.removeChannel(currentChannel);
          }
          setTimeout(() => subscribe(), 500);
          return;
        }

        // Too many rapid failures - give up
        if (rapidFailureCount >= MAX_RAPID_FAILURES) {
          if (__DEV__) {
            console.log(`[Real-time] ${channelName} too many rapid failures, giving up`);
          }
          updateStatus({
            isSubscribing: false,
            error: 'Real-time updates unavailable. Pull to refresh for latest data.',
          });
          return;
        }

        // Retry with exponential backoff
        if (retryCount < MAX_RETRIES && !isCleanedUp) {
          const delay = BASE_DELAY_MS * Math.pow(2, retryCount);
          retryCount++;
          if (__DEV__) {
            console.log(`[Real-time] ${channelName} retrying in ${delay}ms (attempt ${retryCount})`);
          }
          setTimeout(() => {
            if (currentChannel && !isCleanedUp) {
              supabase.removeChannel(currentChannel);
              subscribe();
            }
          }, delay);
        } else if (!isCleanedUp) {
          updateStatus({
            isSubscribing: false,
            error: 'Real-time updates unavailable. Pull to refresh for latest data.',
          });
        }
      }
    });
  };

  // Start initial subscription
  updateStatus({ isSubscribing: true });
  subscribe();

  // Return cleanup function
  return () => {
    isCleanedUp = true;
    if (__DEV__) {
      console.log(`[Real-time] Unsubscribing from ${channelName}`);
    }
    if (currentChannel) {
      supabase.removeChannel(currentChannel);
    }
    updateStatus({ isSubscribed: false, isSubscribing: false, error: null });
  };
}

/**
 * Creates a message-specific realtime subscription with retry logic.
 * Used for subscribing to new messages in a specific conversation.
 *
 * @param conversationId - The conversation to subscribe to
 * @param tableName - The messages table name
 * @param onNewMessage - Callback when a new message arrives
 * @returns Cleanup function to unsubscribe
 */
export function createMessageSubscription(
  conversationId: string,
  tableName: string,
  onNewMessage: (message: Record<string, unknown>) => void
): () => void {
  let isCleanedUp = false;
  let channel: ReturnType<typeof supabase.channel> | null = null;
  let useFilter = true;
  let retryCount = 0;
  const maxRetries = 2;

  const subscribe = () => {
    if (isCleanedUp) return;

    const channelBuilder = supabase.channel(`${tableName}-${conversationId}`);

    if (useFilter) {
      channelBuilder.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: tableName,
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          if (isCleanedUp) return;
          handleNewMessage(payload.new as Record<string, unknown>);
        }
      );
    } else {
      channelBuilder.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: tableName,
        },
        (payload) => {
          if (isCleanedUp) return;
          const newMessage = payload.new as Record<string, unknown>;
          if (newMessage?.conversation_id !== conversationId) return;
          handleNewMessage(newMessage);
        }
      );
    }

    channel = channelBuilder.subscribe((status, error) => {
      if (isCleanedUp) return;

      if (status === 'SUBSCRIBED') {
        retryCount = 0;
        if (__DEV__) {
          console.log(`[Real-time] ${tableName} subscription active for ${conversationId}`);
        }
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        const errorMessage = error?.message || String(error) || '';
        const isMismatchError = errorMessage.includes('mismatch');

        if (isMismatchError && useFilter && !isCleanedUp) {
          if (__DEV__) {
            console.log(`[Real-time] ${tableName} filter mismatch, retrying without filter`);
          }
          useFilter = false;
          if (channel) {
            supabase.removeChannel(channel);
          }
          setTimeout(() => subscribe(), 500);
          return;
        }

        if (retryCount < maxRetries && !isCleanedUp) {
          retryCount++;
          if (channel) {
            supabase.removeChannel(channel);
          }
          setTimeout(() => subscribe(), 2000 * retryCount);
          return;
        }

        if (__DEV__) {
          console.log(`[Real-time] ${tableName} subscription gave up for ${conversationId}`);
        }
      }
    });
  };

  const handleNewMessage = (newMessage: Record<string, unknown>) => {
    if (!newMessage?.id || !newMessage?.conversation_id || !newMessage?.content) {
      if (__DEV__) {
        console.log('[Real-time] Invalid message payload, skipping');
      }
      return;
    }

    if (__DEV__) {
      console.log('[Real-time] New message received:', newMessage.id);
    }

    onNewMessage(newMessage);
  };

  subscribe();

  return () => {
    isCleanedUp = true;
    if (__DEV__) {
      console.log(`[Real-time] Unsubscribing from ${tableName} for ${conversationId}`);
    }
    if (channel) {
      supabase.removeChannel(channel);
    }
  };
}
