// src/features/admin/screens/admin-dashboard/types.ts
// Type definitions for admin dashboard components

export interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
  onPress?: () => void;
  cardColor?: string;
}

export interface SystemStatusItemProps {
  name: string;
  status: string;
  latency?: number | null;
  isLast?: boolean;
}

export interface SecurityHealthCardProps {
  score: number | null;
  totalKeys: number;
  keysNeedingAttention: number;
  onPress: () => void;
}

export interface DevToolsSectionProps {
  isSeeding: boolean;
  isClearing: boolean;
  onSeedTestUsers: () => void;
  onClearTestUsers: () => void;
}

export interface AccountSectionProps {
  isSigningOut: boolean;
  onSignOut: () => void;
}
