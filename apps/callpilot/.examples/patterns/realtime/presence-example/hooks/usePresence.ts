/**
 * usePresence Hook
 *
 * Manages real-time presence state, subscriptions, and status toggling.
 */

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/services/supabase';
import type { UserPresence, UsePresenceReturn } from '../types';

const CHANNEL_NAME = 'presence-example';

export function usePresence(): UsePresenceReturn {
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([]);
  const [myStatus, setMyStatus] = useState<'online' | 'away'>('online');
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const channel = supabase.channel(CHANNEL_NAME);

    const handleSync = () => {
      const state = channel.presenceState<UserPresence>();
      const users = Object.values(state)
        .flat()
        .filter((user) => user.status !== 'offline')
        .sort((a, b) => a.username.localeCompare(b.username));

      setOnlineUsers(users);
      setIsConnected(true);
      setError(null);
    };

    const handleJoin = ({ newPresences }: { key: string; newPresences: UserPresence[] }) => {
      console.log('User joined:', newPresences);
      setOnlineUsers((prev) => {
        const filtered = prev.filter(
          (user) => !newPresences.some((nu) => nu.userId === user.userId)
        );
        return [...filtered, ...newPresences].sort((a, b) =>
          a.username.localeCompare(b.username)
        );
      });
    };

    const handleLeave = ({ leftPresences }: { key: string; leftPresences: UserPresence[] }) => {
      console.log('User left:', leftPresences);
      const leftIds = leftPresences.map((p) => p.userId);
      setOnlineUsers((prev) => prev.filter((user) => !leftIds.includes(user.userId)));
    };

    const trackCurrentUser = async () => {
      const user = await supabase.auth.getUser();
      if (user.data.user) {
        await channel.track({
          userId: user.data.user.id,
          username: user.data.user.email?.split('@')[0] || 'Anonymous',
          avatarUrl: user.data.user.user_metadata?.avatar_url,
          status: myStatus,
          lastSeen: new Date().toISOString(),
        });
      }
    };

    const handleSubscription = async (status: string, err?: Error) => {
      console.log('Subscription status:', status, err);

      if (status === 'SUBSCRIBED') {
        setIsConnected(true);
        setError(null);
        await trackCurrentUser();
      } else if (status === 'CHANNEL_ERROR') {
        setIsConnected(false);
        setError('Connection error. Retrying...');
      } else if (status === 'TIMED_OUT') {
        setIsConnected(false);
        setError('Connection timed out. Retrying...');
      }
    };

    channel
      .on('presence', { event: 'sync' }, handleSync)
      .on('presence', { event: 'join' }, handleJoin)
      .on('presence', { event: 'leave' }, handleLeave)
      .subscribe(handleSubscription);

    return () => {
      console.log('Cleaning up presence subscription');
      channel.untrack();
      supabase.removeChannel(channel);
    };
  }, [myStatus]);

  const toggleStatus = useCallback(async () => {
    const newStatus = myStatus === 'online' ? 'away' : 'online';
    setMyStatus(newStatus);

    const user = await supabase.auth.getUser();
    if (!user.data.user) return;

    const channel = supabase.channel(CHANNEL_NAME);
    await channel.track({
      userId: user.data.user.id,
      username: user.data.user.email?.split('@')[0] || 'Anonymous',
      avatarUrl: user.data.user.user_metadata?.avatar_url,
      status: newStatus,
      lastSeen: new Date().toISOString(),
    });
  }, [myStatus]);

  return {
    onlineUsers,
    myStatus,
    isConnected,
    error,
    toggleStatus,
  };
}
