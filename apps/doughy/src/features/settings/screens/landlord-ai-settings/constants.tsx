// src/features/settings/screens/landlord-ai-settings/constants.tsx
// Constants and configuration for landlord AI settings

import React from 'react';
import { Brain, Eye, Zap } from 'lucide-react-native';
import type { AIMode, ResponseStyle } from '@/stores/landlord-settings-store';
import type { AIModeInfoMap, ResponseStyleInfoMap, ReviewTopic } from './types';

export const AI_MODE_INFO: AIModeInfoMap = {
  training: {
    icon: <Brain size={24} />,
    title: 'Training Mode',
    description: 'Queue most responses for your review. The AI learns from every action you take. Best for initial setup.',
  },
  assisted: {
    icon: <Eye size={24} />,
    title: 'Assisted Mode',
    description: 'Auto-send high-confidence responses, queue uncertain ones for review. Balanced control + automation.',
  },
  autonomous: {
    icon: <Zap size={24} />,
    title: 'Autonomous Mode',
    description: 'Handle almost everything automatically. Only escalates truly sensitive topics. Hands-off management.',
  },
};

export const RESPONSE_STYLE_INFO: ResponseStyleInfoMap = {
  friendly: {
    title: 'Friendly',
    example: 'Hi Sarah! Great to hear from you...',
  },
  professional: {
    title: 'Professional',
    example: 'Dear Ms. Johnson, Thank you for your inquiry...',
  },
  brief: {
    title: 'Brief',
    example: 'Available Feb 1-30. $2,400/mo. Questions?',
  },
};

export const REVIEW_TOPICS: ReviewTopic[] = [
  { key: 'refund', label: 'Refunds', description: 'Any discussion of refunds or money back' },
  { key: 'discount', label: 'Discounts', description: 'Requests for reduced pricing' },
  { key: 'complaint', label: 'Complaints', description: 'Guest dissatisfaction or issues' },
  { key: 'cancellation', label: 'Cancellations', description: 'Booking cancellation requests' },
  { key: 'damage', label: 'Damage Reports', description: 'Property damage discussions' },
  { key: 'security_deposit', label: 'Security Deposits', description: 'Deposit-related questions' },
  { key: 'maintenance', label: 'Maintenance', description: 'Repair requests and issues' },
  { key: 'extension', label: 'Stay Extensions', description: 'Requests to extend booking' },
];

export const AI_MODES: AIMode[] = ['training', 'assisted', 'autonomous'];
export const RESPONSE_STYLES: ResponseStyle[] = ['friendly', 'professional', 'brief'];
