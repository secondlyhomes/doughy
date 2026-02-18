// src/features/admin/screens/ai-security-dashboard/types.ts
// Type definitions for AI Security Dashboard

export interface CircuitBreakerState {
  scope: string;
  isOpen: boolean;
  openedAt: string | null;
  openedBy: string | null;
  reason: string | null;
  autoCloseAt: string | null;
}

export interface UserThreatScore {
  userId: string;
  currentScore: number;
  events24h: number;
  lastEventAt: string | null;
  isFlagged: boolean;
  userEmail?: string;
}

export interface SecurityEvent {
  id: string;
  createdAt: string;
  userId: string | null;
  action: string;
  threatLevel: string;
  details: Record<string, unknown>;
  userEmail?: string;
}

export interface SecurityPattern {
  id: string;
  pattern: string;
  severity: string;
  threatType: string;
  description: string | null;
  isActive: boolean;
  hitCount: number;
}

export interface SecurityStats {
  openBreakers: number;
  flaggedUsers: number;
  criticalEvents: number;
  activePatterns: number;
}
