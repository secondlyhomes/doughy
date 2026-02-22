// src/features/assistant/components/deal-assistant-types.ts
// Types and constants for the DealAssistant component

import { Zap, MessageCircle, Clock } from 'lucide-react-native';

// UI Constants
export const TAB_BAR_HEIGHT = 80; // Approximate tab bar height
export const MIN_BUBBLE_TOP_OFFSET = 100; // Minimum distance from top

export type TabId = 'actions' | 'ask' | 'jobs';

export interface TabConfig {
  id: TabId;
  label: string;
  icon: React.ComponentType<any>;
}

export const TABS: TabConfig[] = [
  { id: 'actions', label: 'Actions', icon: Zap },
  { id: 'ask', label: 'Ask', icon: MessageCircle },
  { id: 'jobs', label: 'Jobs', icon: Clock },
];

export interface DealAssistantProps {
  /** Current deal ID (optional - shows empty state if not set) */
  dealId?: string;
  /** Callback when assistant state changes */
  onStateChange?: (isOpen: boolean) => void;
}
