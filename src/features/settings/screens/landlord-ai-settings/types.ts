// src/features/settings/screens/landlord-ai-settings/types.ts
// Type definitions for landlord AI settings components

import type { AIMode, ResponseStyle } from '@/stores/landlord-settings-store';

export interface AIModeInfo {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export interface ResponseStyleInfo {
  title: string;
  example: string;
}

export interface ReviewTopic {
  key: string;
  label: string;
  description: string;
}

export interface SettingSectionProps {
  children: React.ReactNode;
  title: string;
}

export interface ToggleSectionRowProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  isLast?: boolean;
}

export type AIModeInfoMap = Record<AIMode, AIModeInfo>;
export type ResponseStyleInfoMap = Record<ResponseStyle, ResponseStyleInfo>;
