/**
 * useChat Hook
 *
 * Manages real-time chat state including:
 * - Message fetching and subscriptions
 * - Presence tracking
 * - Typing indicators
 * - Message sending
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/services/supabase';
import type { Message, TypingUser, ChatState } from '../types';

export function useChat(roomId: string) {
  const [state, setState] = useState<ChatState>({
    messages: [],
    newMessage: '',
    isLoading: true,
    isSending: false,
    isConnected: false,
    onlineCount: 0,
    typingUsers: [],
    currentUserId: '',
    currentUsername: '',
  });

  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const updateState = useCallback((updates: Partial<ChatState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const initializeUser = useCallback(async () => {
    const user = await supabase.auth.getUser();
    if (user.data.user) {
      updateState({
        currentUserId: user.data.user.id,
        currentUsername: user.data.user.email?.split('@')[0] || 'Anonymous',
      });
    }
  }, [updateState]);

  const fetchMessages = useCallback(async () => {
    try {
      updateState({ isLoading: true });
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) throw error;
      updateState({ messages: data || [], isLoading: false });
    } catch (error) {
      console.error('Error fetching messages:', error);
      updateState({ isLoading: false });
    }
  }, [roomId, updateState]);

  const updateTypingStatus = useCallback(
    async (isTyping: boolean) => {
      if (!state.currentUsername) return;
      const channel = supabase.channel(`chat:${roomId}:typing`);
      await channel.track({ username: state.currentUsername, typing: isTyping });
    },
    [roomId, state.currentUsername]
  );

  const sendMessage = useCallback(async () => {
    if (!state.newMessage.trim() || !state.currentUserId) return;

    const messageText = state.newMessage.trim();
    updateState({ newMessage: '', isSending: true });
    await updateTypingStatus(false);

    try {
      const { error } = await supabase.from('messages').insert({
        room_id: roomId,
        user_id: state.currentUserId,
        username: state.currentUsername,
        content: messageText,
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error sending message:', error);
      updateState({ newMessage: messageText });
    } finally {
      updateState({ isSending: false });
    }
  }, [roomId, state.newMessage, state.currentUserId, state.currentUsername, updateState, updateTypingStatus]);

  const handleTextChange = useCallback(
    (text: string) => {
      updateState({ newMessage: text });

      if (text.length > 0) {
        updateTypingStatus(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => updateTypingStatus(false), 3000);
      } else {
        updateTypingStatus(false);
      }
    },
    [updateState, updateTypingStatus]
  );

  useEffect(() => {
    initializeUser();
    fetchMessages();

    const messagesChannel = supabase
      .channel(`chat:${roomId}:messages`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` },
        (payload) => {
          const newMsg = payload.new as Message;
          setState((prev) => {
            if (prev.messages.some((m) => m.id === newMsg.id)) return prev;
            return { ...prev, messages: [...prev.messages, newMsg] };
          });
        }
      )
      .subscribe((status) => {
        updateState({ isConnected: status === 'SUBSCRIBED' });
      });

    const presenceChannel = supabase
      .channel(`chat:${roomId}:presence`)
      .on('presence', { event: 'sync' }, () => {
        updateState({ onlineCount: Object.keys(presenceChannel.presenceState()).length });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const user = await supabase.auth.getUser();
          if (user.data.user) {
            await presenceChannel.track({
              userId: user.data.user.id,
              username: user.data.user.email?.split('@')[0] || 'Anonymous',
              online_at: new Date().toISOString(),
            });
          }
        }
      });

    const typingChannel = supabase
      .channel(`chat:${roomId}:typing`)
      .on('presence', { event: 'sync' }, () => {
        const typingState = typingChannel.presenceState<TypingUser>();
        const typing = Object.values(typingState)
          .flat()
          .filter((user) => user.typing)
          .map((user) => user.username);
        updateState({ typingUsers: typing });
      })
      .subscribe();

    return () => {
      messagesChannel.untrack();
      presenceChannel.untrack();
      typingChannel.untrack();
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(presenceChannel);
      supabase.removeChannel(typingChannel);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [roomId, initializeUser, fetchMessages, updateState]);

  return {
    ...state,
    sendMessage,
    handleTextChange,
  };
}
