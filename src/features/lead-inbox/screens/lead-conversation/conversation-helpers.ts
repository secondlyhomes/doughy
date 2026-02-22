// src/features/lead-inbox/screens/lead-conversation/conversation-helpers.ts
// Helper functions for lead conversation screen

import { Mail, MessageSquare, Phone } from 'lucide-react-native';

import type { InvestorChannel } from '../../types';

export function getChannelIcon(channel: InvestorChannel) {
  switch (channel) {
    case 'email':
      return Mail;
    case 'sms':
    case 'whatsapp':
      return MessageSquare;
    case 'phone':
      return Phone;
    default:
      return MessageSquare;
  }
}
