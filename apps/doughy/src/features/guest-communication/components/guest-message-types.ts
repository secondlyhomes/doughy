// src/features/guest-communication/components/guest-message-types.ts
// Shared types for GuestMessageSheet sub-components

import { MessageChannel, MessageContext } from '../types';

export interface GuestMessageSheetProps {
  visible: boolean;
  onClose: () => void;
  bookingId: string;
  contactId: string;
  /** Contact info for sending */
  contact: {
    first_name?: string | null;
    last_name?: string | null;
    phone?: string | null;
    email?: string | null;
  };
  /** Context for variable substitution */
  context: MessageContext;
  /** Property ID for filtering templates */
  propertyId?: string;
  onSend?: () => void;
}
