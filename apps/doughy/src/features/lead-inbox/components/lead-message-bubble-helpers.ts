// src/features/lead-inbox/components/lead-message-bubble-helpers.ts
// Helper functions for LeadMessageBubble

import { Bot, User } from 'lucide-react-native';
import type { InvestorSender } from '../types';

export function getSenderIcon(sentBy: InvestorSender) {
  switch (sentBy) {
    case 'ai':
      return Bot;
    case 'lead':
    case 'user':
    default:
      return User;
  }
}

export function getSenderLabel(sentBy: InvestorSender, leadName?: string): string {
  switch (sentBy) {
    case 'ai':
      return 'OpenClaw AI';
    case 'lead':
      return leadName || 'Lead';
    case 'user':
      return 'You';
    default:
      return sentBy;
  }
}
