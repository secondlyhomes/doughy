import type { MessageChannel, MessageDirection, MessageStatus } from '../constants';

export interface MessagesTable {
  Row: {
    body: string
    channel: MessageChannel
    created_at: string
    direction: MessageDirection
    id: string
    lead_id: string
    status: MessageStatus
    subject: string | null
    testing: boolean | null
    updated_at: string
  }
  Insert: {
    body: string
    channel: MessageChannel
    created_at?: string
    direction: MessageDirection
    id?: string
    lead_id: string
    status?: MessageStatus
    subject?: string | null
    testing?: boolean | null
    updated_at?: string
  }
  Update: {
    body?: string
    channel?: MessageChannel
    created_at?: string
    direction?: MessageDirection
    id?: string
    lead_id?: string
    status?: MessageStatus
    subject?: string | null
    testing?: boolean | null
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "messages_lead_id_fkey"
      columns: ["lead_id"]
      isOneToOne: false
      referencedRelation: "leads"
      referencedColumns: ["id"]
    }
  ]
}

export interface ScheduledMessagesTable {
  Row: {
    channel: MessageChannel
    content: string
    created_at: string
    id: string
    lead_id: string
    scheduled_for: string
    status: string
    subject: string | null
    updated_at: string
    user_id: string
  }
  Insert: {
    channel: MessageChannel
    content: string
    created_at?: string
    id?: string
    lead_id: string
    scheduled_for: string
    status?: string
    subject?: string | null
    updated_at?: string
    user_id: string
  }
  Update: {
    channel?: MessageChannel
    content?: string
    created_at?: string
    id?: string
    lead_id?: string
    scheduled_for?: string
    status?: string
    subject?: string | null
    updated_at?: string
    user_id?: string
  }
  Relationships: []
}
