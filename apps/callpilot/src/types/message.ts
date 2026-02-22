/**
 * Message Types
 *
 * UI message types adapted from doughy-ai's messageTypes.ts.
 * Database model uses Communication from communication.ts;
 * Message is the UI model for rendering in chat threads.
 */

import type { Communication, CommunicationChannel } from './communication';

export type UIMessageType = 'text' | 'email' | 'call' | 'ai_call' | 'system';
export type MessageDirection = 'incoming' | 'outgoing';
export type MessageStatus = 'sent' | 'delivered' | 'read' | 'error';
export type MessageSender = 'user' | 'ai' | 'contact';

export interface Message {
  id: string;
  contactId: string;
  type: UIMessageType;
  channel: CommunicationChannel;
  content: string;
  timestamp: string;
  sender: string;
  sentBy: MessageSender;
  direction: MessageDirection;
  status: MessageStatus;
  subject: string | null;
  duration: number | null;
  /** AI call result metadata */
  aiCallMeta?: AICallMeta | null;
}

/** Metadata for inline AI call result cards */
export interface AICallMeta {
  callId: string;
  durationMinutes: number;
  summary: string;
  outcome: string;
}

export interface Conversation {
  id: string;
  contactId: string;
  contactName: string;
  lastMessage: string;
  lastMessageDate: string;
  lastMessageChannel: 'sms' | 'email';
  lastMessageDirection: MessageDirection;
  unreadCount: number;
  module: 'investor' | 'landlord' | null;
}

/** Map a CommunicationChannel to a UIMessageType for rendering */
export function mapChannelToUIType(channel: CommunicationChannel): UIMessageType {
  switch (channel) {
    case 'sms':
    case 'whatsapp':
      return 'text';
    case 'email':
      return 'email';
    case 'call':
    case 'transcript':
      return 'call';
    default:
      return 'text';
  }
}

/** Convert a Communication record to a UI Message */
export function convertCommunicationToMessage(comm: Communication): Message {
  return {
    id: comm.id,
    contactId: comm.contactId,
    type: mapChannelToUIType(comm.channel),
    channel: comm.channel,
    content: comm.body,
    timestamp: comm.createdAt,
    sender: comm.direction === 'outgoing' ? 'You' : 'Contact',
    sentBy: comm.direction === 'outgoing' ? 'user' : 'contact',
    direction: comm.direction,
    status: comm.status,
    subject: comm.subject,
    duration: comm.duration,
  };
}
