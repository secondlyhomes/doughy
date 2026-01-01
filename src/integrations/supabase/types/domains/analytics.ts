import type { Json } from '../common';

export interface AssistantSessionsTable {
  Row: {
    context: Json | null
    created_at: string | null
    id: string
    tokens_used: number | null
    user_id: string | null
  }
  Insert: {
    context?: Json | null
    created_at?: string | null
    id?: string
    tokens_used?: number | null
    user_id?: string | null
  }
  Update: {
    context?: Json | null
    created_at?: string | null
    id?: string
    tokens_used?: number | null
    user_id?: string | null
  }
  Relationships: []
}

export interface CallsTable {
  Row: {
    created_at: string
    duration_secs: number | null
    id: string
    lead_id: string
    recording_url: string | null
    summary: string | null
    updated_at: string
  }
  Insert: {
    created_at?: string
    duration_secs?: number | null
    id?: string
    lead_id: string
    recording_url?: string | null
    summary?: string | null
    updated_at?: string
  }
  Update: {
    created_at?: string
    duration_secs?: number | null
    id?: string
    lead_id?: string
    recording_url?: string | null
    summary?: string | null
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "calls_lead_id_fkey"
      columns: ["lead_id"]
      isOneToOne: false
      referencedRelation: "leads"
      referencedColumns: ["id"]
    }
  ]
}

export interface TranscriptsTable {
  Row: {
    call_id: string | null
    created_at: string | null
    created_by: string | null
    duration: number | null
    id: string
    is_deleted: boolean | null
    lead_id: string
    recording_url: string | null
    source: string
    status: string | null
    summary: string | null
    title: string
    transcript_text: string
    updated_at: string | null
  }
  Insert: {
    call_id?: string | null
    created_at?: string | null
    created_by?: string | null
    duration?: number | null
    id?: string
    is_deleted?: boolean | null
    lead_id: string
    recording_url?: string | null
    source: string
    status?: string | null
    summary?: string | null
    title: string
    transcript_text: string
    updated_at?: string | null
  }
  Update: {
    call_id?: string | null
    created_at?: string | null
    created_by?: string | null
    duration?: number | null
    id?: string
    is_deleted?: boolean | null
    lead_id?: string
    recording_url?: string | null
    source?: string
    status?: string | null
    summary?: string | null
    title?: string
    transcript_text?: string
    updated_at?: string | null
  }
  Relationships: [
    {
      foreignKeyName: "transcripts_lead_id_fkey"
      columns: ["lead_id"]
      isOneToOne: false
      referencedRelation: "leads"
      referencedColumns: ["id"]
    }
  ]
}

export interface TranscriptSegmentsTable {
  Row: {
    content: string
    created_at: string | null
    end_time: number | null
    id: string
    segment_number: number
    speaker: string | null
    start_time: number | null
    transcript_id: string
    updated_at: string | null
  }
  Insert: {
    content: string
    created_at?: string | null
    end_time?: number | null
    id?: string
    segment_number: number
    speaker?: string | null
    start_time?: number | null
    transcript_id: string
    updated_at?: string | null
  }
  Update: {
    content?: string
    created_at?: string | null
    end_time?: number | null
    id?: string
    segment_number?: number
    speaker?: string | null
    start_time?: number | null
    transcript_id?: string
    updated_at?: string | null
  }
  Relationships: [
    {
      foreignKeyName: "transcript_segments_transcript_id_fkey"
      columns: ["transcript_id"]
      isOneToOne: false
      referencedRelation: "transcripts"
      referencedColumns: ["id"]
    }
  ]
}
