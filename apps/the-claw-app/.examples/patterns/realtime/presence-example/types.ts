/**
 * Types for Presence Example
 */

export type UserStatus = 'online' | 'away' | 'offline';

export interface UserPresence {
  userId: string;
  username: string;
  avatarUrl?: string;
  status: UserStatus;
  lastSeen: string;
}

export interface PresenceState {
  onlineUsers: UserPresence[];
  myStatus: 'online' | 'away';
  isConnected: boolean;
  error: string | null;
}

export interface UsePresenceReturn extends PresenceState {
  toggleStatus: () => Promise<void>;
}
