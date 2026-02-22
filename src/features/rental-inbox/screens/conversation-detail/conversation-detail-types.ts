// Conversation detail types and constants

import {
  MessageSquare,
  Mail,
  Phone,
} from 'lucide-react-native';

import type { Channel } from '@/stores/rental-conversations-store';

// Channel icon mapping
export const CHANNEL_ICONS: Partial<
  Record<Channel, React.ComponentType<{ size: number; color: string }>>
> = {
  whatsapp: MessageSquare,
  telegram: MessageSquare,
  email: Mail,
  sms: Phone,
  imessage: MessageSquare,
  discord: MessageSquare,
  webchat: MessageSquare,
  phone: Phone,
};

export interface ConversationDetailScreenProps {
  conversationId: string;
}
