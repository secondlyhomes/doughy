// src/features/lead-inbox/components/lead-message-bubble-types.ts
// Types for the LeadMessageBubble component

import type { InvestorMessage } from '../types';

export interface LeadMessageBubbleProps {
  message: InvestorMessage;
  onFeedback?: (messageId: string, feedback: 'thumbs_up' | 'thumbs_down') => void;
  showFeedback?: boolean;
  leadName?: string;
}

export type FeedbackType = 'thumbs_up' | 'thumbs_down';
