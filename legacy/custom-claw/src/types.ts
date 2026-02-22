// OpenClaw Server Types

// Gmail Pub/Sub notification data
export interface GmailPubSubMessage {
  message: {
    data: string; // Base64 encoded JSON
    messageId: string;
    publishTime: string;
  };
  subscription: string;
}

export interface GmailNotification {
  emailAddress: string;
  historyId: string;
}

// Gmail API types
export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  payload: {
    headers: Array<{ name: string; value: string }>;
    body?: { data?: string; size: number };
    parts?: GmailMessagePart[];
    mimeType: string;
  };
  internalDate: string;
}

export interface GmailMessagePart {
  partId: string;
  mimeType: string;
  filename?: string;
  headers: Array<{ name: string; value: string }>;
  body: { data?: string; size: number; attachmentId?: string };
  parts?: GmailMessagePart[];
}

export interface GmailHistoryRecord {
  id: string;
  messages?: Array<{ id: string; threadId: string }>;
  messagesAdded?: Array<{
    message: { id: string; threadId: string; labelIds: string[] };
  }>;
  labelsAdded?: Array<{
    message: { id: string; threadId: string };
    labelIds: string[];
  }>;
}

// User tokens stored in database
export interface UserGmailTokens {
  user_id: string;
  access_token: string;
  refresh_token: string;
  token_expiry: string;
  gmail_email: string;
  history_id: string;
  watch_expiration: string;
  created_at: string;
  updated_at: string;
}

// Email for processing
export interface IncomingEmail {
  from: string;
  to: string;
  subject: string;
  body: string;
  receivedAt: string;
  messageId?: string;
  threadId?: string;
}

// Edge function response types
export interface ParsedEmail {
  platform: string;
  replyMethod: 'email_reply' | 'direct_email' | 'platform_only' | 'messenger';
  contact: {
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phone: string | null;
    profession: string | null;
    employer: string | null;
  };
  inquiry: {
    message: string;
    propertyHint: string | null;
    dates: { start: string | null; end: string | null } | null;
  };
  metadata: Record<string, unknown>;
}

export interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  contact_types: string[];
  source: string;
  status: string;
}

export interface LeadScore {
  score: number;
  qualification: string;
  factors: Array<{ factor: string; impact: number; reason: string }>;
  recommendation: string;
}

export interface AIResponse {
  suggestedResponse: string;
  confidence: number;
  reason: string;
  requiresReview: boolean;
}

export interface WebhookResult {
  success: boolean;
  contactId?: string;
  conversationId?: string;
  messageId?: string;
  leadScore?: LeadScore;
  aiResponse?: AIResponse;
  action: 'auto_sent' | 'queued_for_review' | 'manual_required' | 'error';
  error?: string;
}

// User settings
export interface UserSettings {
  aiMode: 'autonomous' | 'assisted' | 'training' | 'off';
  confidenceThreshold: number;
  alwaysReviewTopics: string[];
  responseStyle: string;
}
