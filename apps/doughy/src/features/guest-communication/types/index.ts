// src/features/guest-communication/types/index.ts
// Type definitions for guest communication feature

/** Message template types */
export type GuestTemplateType =
  | 'check_in_instructions'
  | 'checkout_reminder'
  | 'house_rules'
  | 'review_request'
  | 'custom';

/** Message channel */
export type MessageChannel = 'sms' | 'email';

/** Template type configuration */
export interface TemplateTypeConfig {
  label: string;
  description: string;
  emoji: string;
  defaultSubject?: string;
  suggestedVariables: string[];
}

export const TEMPLATE_TYPE_CONFIG: Record<GuestTemplateType, TemplateTypeConfig> = {
  check_in_instructions: {
    label: 'Check-in Instructions',
    description: 'Sent before guest arrival with access details',
    emoji: '🔑',
    defaultSubject: 'Your Check-in Instructions',
    suggestedVariables: ['guest_name', 'property_name', 'property_address', 'access_code', 'check_in_time', 'wifi_name', 'wifi_password'],
  },
  checkout_reminder: {
    label: 'Checkout Reminder',
    description: 'Sent before guest departure',
    emoji: '👋',
    defaultSubject: 'Checkout Reminder',
    suggestedVariables: ['guest_name', 'checkout_time', 'checkout_instructions'],
  },
  house_rules: {
    label: 'House Rules',
    description: 'Property rules and guidelines',
    emoji: '📋',
    defaultSubject: 'House Rules & Guidelines',
    suggestedVariables: ['guest_name', 'property_name', 'quiet_hours', 'max_guests', 'parking_info'],
  },
  review_request: {
    label: 'Review Request',
    description: 'Ask for a review after checkout',
    emoji: '⭐',
    defaultSubject: 'How was your stay?',
    suggestedVariables: ['guest_name', 'property_name', 'review_link'],
  },
  custom: {
    label: 'Custom',
    description: 'Custom message template',
    emoji: '✉️',
    suggestedVariables: ['guest_name', 'property_name', 'property_address'],
  },
};

/** Available template variables */
export const TEMPLATE_VARIABLES = {
  guest_name: { label: 'Guest Name', example: 'John Smith' },
  guest_first_name: { label: 'Guest First Name', example: 'John' },
  property_name: { label: 'Property Name', example: 'Beach House' },
  property_address: { label: 'Property Address', example: '123 Ocean Dr, Miami, FL' },
  access_code: { label: 'Access Code', example: '1234' },
  check_in_time: { label: 'Check-in Time', example: '3:00 PM' },
  check_in_date: { label: 'Check-in Date', example: 'January 15, 2024' },
  checkout_time: { label: 'Checkout Time', example: '11:00 AM' },
  checkout_date: { label: 'Checkout Date', example: 'January 20, 2024' },
  wifi_name: { label: 'WiFi Name', example: 'BeachHouse_5G' },
  wifi_password: { label: 'WiFi Password', example: 'welcome123' },
  quiet_hours: { label: 'Quiet Hours', example: '10 PM - 8 AM' },
  max_guests: { label: 'Max Guests', example: '6' },
  parking_info: { label: 'Parking Info', example: 'Free parking in driveway' },
  checkout_instructions: { label: 'Checkout Instructions', example: 'Please leave keys on counter' },
  review_link: { label: 'Review Link', example: 'https://airbnb.com/review/123' },
  host_name: { label: 'Host Name', example: 'Property Manager' },
  host_phone: { label: 'Host Phone', example: '(555) 123-4567' },
};

/** Guest message template */
export interface GuestMessageTemplate {
  id: string;
  user_id: string;
  type: GuestTemplateType;
  name: string;
  subject?: string;
  body: string;
  channel: MessageChannel;
  is_active: boolean;
  property_id?: string | null; // null = applies to all properties
  created_at: string;
  updated_at: string;
}

/** Guest message (sent message record) */
export interface GuestMessage {
  id: string;
  user_id: string;
  template_id?: string | null;
  booking_id: string;
  contact_id: string;
  channel: MessageChannel;
  subject?: string;
  body: string;
  variables_used?: Record<string, string>;
  sent_at: string;
  delivered_at?: string | null;
  read_at?: string | null;
  error?: string | null;
  created_at: string;
}

/** Auto-send rule configuration */
export interface AutoSendRule {
  id: string;
  user_id: string;
  template_id: string;
  property_id?: string | null;
  trigger: 'before_check_in' | 'after_check_in' | 'before_checkout' | 'after_checkout';
  hours_offset: number; // Hours before/after the trigger
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Input for creating a template */
export interface CreateTemplateInput {
  type: GuestTemplateType;
  name: string;
  subject?: string;
  body: string;
  channel: MessageChannel;
  property_id?: string;
}

/** Input for sending a message */
export interface SendMessageInput {
  booking_id: string;
  contact_id: string;
  template_id?: string;
  channel: MessageChannel;
  subject?: string;
  body: string;
  variables?: Record<string, string>;
}

/** Context for variable substitution */
export interface MessageContext {
  guest?: {
    first_name?: string;
    last_name?: string;
  };
  property?: {
    name?: string;
    address?: string;
    city?: string;
    state?: string;
    wifi_name?: string;
    wifi_password?: string;
  };
  booking?: {
    start_date?: string;
    end_date?: string;
    check_in_time?: string;
    checkout_time?: string;
    access_code?: string;
  };
  host?: {
    name?: string;
    phone?: string;
  };
}
