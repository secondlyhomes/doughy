// src/features/capture/screens/capture-screen-types.ts
// Types and constants for the Capture screen

export type TabKey = 'queue' | 'history';

export interface CaptureActionProps {
  icon: React.ComponentType<{ size: number; color: string }>;
  label: string;
  color: string;
  onPress: () => void;
}

// Tab configuration
export const TABS: { key: TabKey; label: string }[] = [
  { key: 'queue', label: 'Queue' },
  { key: 'history', label: 'History' },
];
