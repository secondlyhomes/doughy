// src/features/vendors/components/message-vendor-types.ts
// Types for the MessageVendorSheet component family

import { Vendor } from '../types';

export type MessageChannel = 'sms' | 'email' | 'phone';

export interface MessageContext {
  type: 'maintenance' | 'turnover' | 'general';
  propertyAddress?: string;
  issueTitle?: string;
  issueDescription?: string;
  scheduledDate?: string;
  urgency?: 'emergency' | 'urgent' | 'normal';
}

export interface OutboundMessage {
  channel: MessageChannel;
  subject?: string;
  body: string;
  aiComposed: boolean;
}

export interface MessageVendorSheetProps {
  visible: boolean;
  onClose: () => void;
  vendor: Vendor | null;
  /** Context for AI to compose message */
  context?: MessageContext;
  onSend?: (message: OutboundMessage) => Promise<void>;
}

export interface ChannelOption {
  value: MessageChannel;
  label: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  disabled: boolean;
}
