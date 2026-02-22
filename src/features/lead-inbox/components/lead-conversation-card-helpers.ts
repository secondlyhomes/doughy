// src/features/lead-inbox/components/lead-conversation-card-helpers.ts
// Channel helper utilities for LeadConversationCard

import {
  Mail,
  MessageSquare,
  Phone,
} from 'lucide-react-native';
import type { InvestorChannel } from '../types';

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

export function getChannelLabel(channel: InvestorChannel): string {
  switch (channel) {
    case 'email':
      return 'Email';
    case 'sms':
      return 'SMS';
    case 'whatsapp':
      return 'WhatsApp';
    case 'phone':
      return 'Phone';
    default:
      return channel;
  }
}
