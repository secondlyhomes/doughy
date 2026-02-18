# Presence Indicators

## Overview

Presence indicators show real-time user activity: who's online, who's typing, who's viewing a document, and last seen timestamps. This guide provides production-ready patterns for all presence use cases.

## Online/Offline Status

### Basic Online Status

Track which users are currently online:

```typescript
import { useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';

interface UserPresence {
  userId: string;
  username: string;
  avatarUrl?: string;
  status: 'online' | 'away' | 'offline';
  lastSeen: string;
}

export function useOnlineStatus(roomId: string = 'global') {
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([]);
  const [myStatus, setMyStatus] = useState<'online' | 'away'>('online');

  useEffect(() => {
    const channel = supabase.channel(`presence:${roomId}`);

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<UserPresence>();
        const users = Object.values(state)
          .flat()
          .filter((user) => user.status !== 'offline');
        setOnlineUsers(users);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        console.log('User joined:', newPresences);
        setOnlineUsers((prev) => [...prev, ...(newPresences as UserPresence[])]);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        console.log('User left:', leftPresences);
        const leftIds = leftPresences.map((p: UserPresence) => p.userId);
        setOnlineUsers((prev) => prev.filter((user) => !leftIds.includes(user.userId)));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const user = await supabase.auth.getUser();
          if (user.data.user) {
            await channel.track({
              userId: user.data.user.id,
              username: user.data.user.email || 'Anonymous',
              avatarUrl: user.data.user.user_metadata?.avatar_url,
              status: myStatus,
              lastSeen: new Date().toISOString(),
            });
          }
        }
      });

    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
    };
  }, [roomId, myStatus]);

  const updateStatus = async (newStatus: 'online' | 'away') => {
    setMyStatus(newStatus);
    const user = await supabase.auth.getUser();
    if (!user.data.user) return;

    const channel = supabase.channel(`presence:${roomId}`);
    await channel.track({
      userId: user.data.user.id,
      username: user.data.user.email || 'Anonymous',
      avatarUrl: user.data.user.user_metadata?.avatar_url,
      status: newStatus,
      lastSeen: new Date().toISOString(),
    });
  };

  return { onlineUsers, myStatus, updateStatus };
}
```

### Auto Away Detection

Automatically set status to "away" after inactivity:

```typescript
export function useAutoAway(
  roomId: string,
  awayAfterMs: number = 5 * 60 * 1000 // 5 minutes
) {
  const [status, setStatus] = useState<'online' | 'away'>('online');
  const [lastActivity, setLastActivity] = useState(Date.now());

  useEffect(() => {
    const handleActivity = () => {
      setLastActivity(Date.now());
      if (status === 'away') {
        setStatus('online');
      }
    };

    // Track user activity
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach((event) => {
      document.addEventListener(event, handleActivity);
    });

    // Check for inactivity
    const interval = setInterval(() => {
      if (Date.now() - lastActivity > awayAfterMs) {
        setStatus('away');
      }
    }, 30000); // Check every 30 seconds

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
      clearInterval(interval);
    };
  }, [lastActivity, status, awayAfterMs]);

  useEffect(() => {
    const channel = supabase.channel(`presence:${roomId}`);

    channel.subscribe(async (channelStatus) => {
      if (channelStatus === 'SUBSCRIBED') {
        const user = await supabase.auth.getUser();
        if (user.data.user) {
          await channel.track({
            userId: user.data.user.id,
            username: user.data.user.email || 'Anonymous',
            status,
            lastSeen: new Date().toISOString(),
          });
        }
      }
    });

    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
    };
  }, [roomId, status]);

  return { status, setStatus };
}
```

## Typing Indicators

### Real-Time Typing Status

Show when users are typing:

```typescript
export function useTypingIndicator(channelId: string) {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const channel = supabase.channel(`typing:${channelId}`);

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<{ username: string; typing: boolean }>();
        const typing = Object.values(state)
          .flat()
          .filter((user) => user.typing)
          .map((user) => user.username);
        setTypingUsers(typing);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelId]);

  const startTyping = async () => {
    if (isTyping) return;

    setIsTyping(true);
    const user = await supabase.auth.getUser();
    if (!user.data.user) return;

    const channel = supabase.channel(`typing:${channelId}`);
    await channel.track({
      username: user.data.user.email || 'Anonymous',
      typing: true,
    });
  };

  const stopTyping = async () => {
    if (!isTyping) return;

    setIsTyping(false);
    const user = await supabase.auth.getUser();
    if (!user.data.user) return;

    const channel = supabase.channel(`typing:${channelId}`);
    await channel.track({
      username: user.data.user.email || 'Anonymous',
      typing: false,
    });
  };

  const handleTyping = () => {
    startTyping();

    // Auto-stop typing after 3 seconds of inactivity
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      stopTyping();
    };
  }, []);

  return {
    typingUsers,
    handleTyping,
    startTyping,
    stopTyping,
  };
}
```

### Typing Indicator Component

Display typing indicator in UI:

```typescript
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface TypingIndicatorProps {
  usernames: string[];
}

export function TypingIndicator({ usernames }: TypingIndicatorProps) {
  if (usernames.length === 0) return null;

  const text =
    usernames.length === 1
      ? `${usernames[0]} is typing...`
      : usernames.length === 2
      ? `${usernames[0]} and ${usernames[1]} are typing...`
      : `${usernames[0]} and ${usernames.length - 1} others are typing...`;

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{text}</Text>
      <View style={styles.dots}>
        <TypingDot delay={0} />
        <TypingDot delay={200} />
        <TypingDot delay={400} />
      </View>
    </View>
  );
}

function TypingDot({ delay }: { delay: number }) {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: withRepeat(
      withSequence(
        withTiming(0.3, { duration: 400 }),
        withTiming(1, { duration: 400 })
      ),
      -1,
      false
    ),
  }));

  return <Animated.View style={[styles.dot, animatedStyle]} />;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  text: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
  },
  dots: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#666',
  },
});
```

## Viewing Indicators

### Document Viewers

Track who's viewing a document:

```typescript
interface Viewer {
  userId: string;
  username: string;
  avatarUrl?: string;
  viewingSince: string;
}

export function useDocumentViewers(documentId: string) {
  const [viewers, setViewers] = useState<Viewer[]>([]);

  useEffect(() => {
    const channel = supabase.channel(`document:${documentId}:viewers`);

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<Viewer>();
        const activeViewers = Object.values(state).flat();
        setViewers(activeViewers);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        setViewers((prev) => [...prev, ...(newPresences as Viewer[])]);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        const leftIds = leftPresences.map((p: Viewer) => p.userId);
        setViewers((prev) => prev.filter((v) => !leftIds.includes(v.userId)));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const user = await supabase.auth.getUser();
          if (user.data.user) {
            await channel.track({
              userId: user.data.user.id,
              username: user.data.user.email || 'Anonymous',
              avatarUrl: user.data.user.user_metadata?.avatar_url,
              viewingSince: new Date().toISOString(),
            });
          }
        }
      });

    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
    };
  }, [documentId]);

  return viewers;
}
```

### Viewer Avatars Component

Display stacked avatars of viewers:

```typescript
import { View, Image, Text, StyleSheet } from 'react-native';

interface ViewerAvatarsProps {
  viewers: Viewer[];
  maxDisplay?: number;
}

export function ViewerAvatars({ viewers, maxDisplay = 3 }: ViewerAvatarsProps) {
  const displayViewers = viewers.slice(0, maxDisplay);
  const remainingCount = viewers.length - maxDisplay;

  return (
    <View style={styles.container}>
      {displayViewers.map((viewer, index) => (
        <View
          key={viewer.userId}
          style={[styles.avatarContainer, { marginLeft: index > 0 ? -8 : 0 }]}
        >
          {viewer.avatarUrl ? (
            <Image source={{ uri: viewer.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>
                {viewer.username[0].toUpperCase()}
              </Text>
            </View>
          )}
        </View>
      ))}
      {remainingCount > 0 && (
        <View style={[styles.avatarContainer, styles.avatarPlaceholder, { marginLeft: -8 }]}>
          <Text style={styles.avatarInitial}>+{remainingCount}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    borderWidth: 2,
    borderColor: 'white',
    borderRadius: 16,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4ECDC4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
```

## Last Seen Timestamps

### Track Last Seen

Store and display when users were last active:

```typescript
import { useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';

interface UserActivity {
  userId: string;
  lastSeen: string;
  isOnline: boolean;
}

export function useLastSeen(userId: string) {
  const [activity, setActivity] = useState<UserActivity | null>(null);

  useEffect(() => {
    // Initial fetch
    fetchLastSeen();

    // Subscribe to updates
    const channel = supabase
      .channel(`user:${userId}:activity`)
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<UserActivity>();
        const userActivity = Object.values(state).flat()[0];
        if (userActivity) {
          setActivity(userActivity);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const fetchLastSeen = async () => {
    const { data, error } = await supabase
      .from('user_activity')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (data && !error) {
      setActivity({
        userId: data.user_id,
        lastSeen: data.last_seen,
        isOnline: data.is_online,
      });
    }
  };

  const updateLastSeen = async () => {
    await supabase.from('user_activity').upsert({
      user_id: userId,
      last_seen: new Date().toISOString(),
      is_online: true,
    });
  };

  return { activity, updateLastSeen };
}
```

### Format Last Seen

Display relative time for last seen:

```typescript
export function formatLastSeen(lastSeen: string): string {
  const now = new Date();
  const lastSeenDate = new Date(lastSeen);
  const diffMs = now.getTime() - lastSeenDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return lastSeenDate.toLocaleDateString();
}

export function LastSeenText({ lastSeen, isOnline }: { lastSeen: string; isOnline: boolean }) {
  if (isOnline) {
    return <Text style={styles.online}>Online</Text>;
  }

  return <Text style={styles.offline}>Last seen {formatLastSeen(lastSeen)}</Text>;
}

const styles = StyleSheet.create({
  online: {
    fontSize: 12,
    color: '#4ECDC4',
  },
  offline: {
    fontSize: 12,
    color: '#999',
  },
});
```

## Presence with Persistence

### Store Presence in Database

Persist presence data for offline access:

```sql
-- Migration: create user_activity table
CREATE TABLE user_activity (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_online BOOLEAN NOT NULL DEFAULT false,
  status TEXT DEFAULT 'offline',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for queries
CREATE INDEX idx_user_activity_online ON user_activity(is_online);
CREATE INDEX idx_user_activity_last_seen ON user_activity(last_seen);

-- RLS policies
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view user activity"
  ON user_activity FOR SELECT
  USING (true);

CREATE POLICY "Users can update own activity"
  ON user_activity FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity"
  ON user_activity FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### Hybrid Presence Hook

Combine real-time presence with database persistence:

```typescript
export function useHybridPresence(roomId: string) {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [allUsers, setAllUsers] = useState<UserActivity[]>([]);

  useEffect(() => {
    // Fetch persisted activity
    fetchUserActivity();

    // Real-time presence
    const channel = supabase.channel(`presence:${roomId}`);

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<UserPresence>();
        const online = Object.values(state)
          .flat()
          .map((u) => u.userId);
        setOnlineUsers(new Set(online));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const user = await supabase.auth.getUser();
          if (user.data.user) {
            // Track in real-time
            await channel.track({
              userId: user.data.user.id,
              username: user.data.user.email || 'Anonymous',
              status: 'online',
              lastSeen: new Date().toISOString(),
            });

            // Persist to database
            await supabase.from('user_activity').upsert({
              user_id: user.data.user.id,
              last_seen: new Date().toISOString(),
              is_online: true,
              status: 'online',
            });
          }
        }
      });

    // Update database on unmount
    return () => {
      updateOfflineStatus();
      channel.untrack();
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  const fetchUserActivity = async () => {
    const { data, error } = await supabase
      .from('user_activity')
      .select('*')
      .order('last_seen', { ascending: false });

    if (data && !error) {
      setAllUsers(data);
    }
  };

  const updateOfflineStatus = async () => {
    const user = await supabase.auth.getUser();
    if (user.data.user) {
      await supabase.from('user_activity').update({
        is_online: false,
        last_seen: new Date().toISOString(),
      }).eq('user_id', user.data.user.id);
    }
  };

  return {
    onlineUsers,
    allUsers: allUsers.map((user) => ({
      ...user,
      isOnline: onlineUsers.has(user.user_id),
    })),
  };
}
```

## Battery-Efficient Presence

### Throttle Presence Updates

Reduce battery usage by throttling updates:

```typescript
import { useRef, useCallback } from 'react';

export function useThrottledPresence(
  channelName: string,
  throttleMs: number = 5000
) {
  const lastUpdateRef = useRef(0);
  const pendingUpdateRef = useRef(false);

  const updatePresence = useCallback(
    async (data: any) => {
      const now = Date.now();
      const timeSinceLastUpdate = now - lastUpdateRef.current;

      if (timeSinceLastUpdate >= throttleMs) {
        // Update immediately
        const channel = supabase.channel(channelName);
        await channel.track(data);
        lastUpdateRef.current = now;
        pendingUpdateRef.current = false;
      } else if (!pendingUpdateRef.current) {
        // Schedule update
        pendingUpdateRef.current = true;
        setTimeout(async () => {
          const channel = supabase.channel(channelName);
          await channel.track(data);
          lastUpdateRef.current = Date.now();
          pendingUpdateRef.current = false;
        }, throttleMs - timeSinceLastUpdate);
      }
    },
    [channelName, throttleMs]
  );

  return { updatePresence };
}
```

## Best Practices

1. **Clean Up**: Always untrack presence on unmount
2. **Throttle Updates**: Don't update presence on every keystroke
3. **Handle Offline**: Gracefully handle disconnections
4. **Show Status**: Display connection status to users
5. **Persist Data**: Store important presence data in database
6. **Limit Scope**: Use room-specific channels, not global
7. **Battery Aware**: Reduce update frequency on mobile

## Security Considerations

1. Only expose necessary user information
2. Don't broadcast sensitive data via presence
3. Validate all presence payloads
4. Rate limit presence updates
5. Consider privacy settings (users can opt out)

## See Also

- [Real-Time Subscriptions](./realtime-subscriptions.md)
- [Collaborative Editing](./collaborative-editing.md)
- [Example: Presence Component](./PresenceExample.tsx)
