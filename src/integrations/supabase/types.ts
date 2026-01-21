export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      analytics_feature_usage_stats: {
        Row: {
          date: string
          feature_name: string
          id: string
          unique_users: number
          usage_count: number
        }
        Insert: {
          date?: string
          feature_name: string
          id?: string
          unique_users?: number
          usage_count?: number
        }
        Update: {
          date?: string
          feature_name?: string
          id?: string
          unique_users?: number
          usage_count?: number
        }
        Relationships: []
      }
      analytics_metrics: {
        Row: {
          category: string
          date: string
          id: string
          metric_name: string
          metric_value: number
        }
        Insert: {
          category: string
          date?: string
          id?: string
          metric_name: string
          metric_value: number
        }
        Update: {
          category?: string
          date?: string
          id?: string
          metric_name?: string
          metric_value?: number
        }
        Relationships: []
      }
      assistant_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          deal_id: string | null
          error_message: string | null
          id: string
          input_json: Json | null
          job_type: string
          progress: number
          result_artifact_ids: string[] | null
          result_json: Json | null
          started_at: string | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          deal_id?: string | null
          error_message?: string | null
          id?: string
          input_json?: Json | null
          job_type: string
          progress?: number
          result_artifact_ids?: string[] | null
          result_json?: Json | null
          started_at?: string | null
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          deal_id?: string | null
          error_message?: string | null
          id?: string
          input_json?: Json | null
          job_type?: string
          progress?: number
          result_artifact_ids?: string[] | null
          result_json?: Json | null
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_jobs_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      assistant_sessions: {
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
      billing_stripe_customers: {
        Row: {
          created_at: string | null
          customer_id: string
          id: string
          last_updated: string | null
          subscription_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          id?: string
          last_updated?: string | null
          subscription_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          id?: string
          last_updated?: string | null
          subscription_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      billing_stripe_products: {
        Row: {
          created_at: string | null
          display_name: string
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          reference_id: string | null
          sort_order: number | null
          stripe_price_id_monthly: string
          stripe_price_id_yearly: string
          stripe_product_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_name: string
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          reference_id?: string | null
          sort_order?: number | null
          stripe_price_id_monthly: string
          stripe_price_id_yearly: string
          stripe_product_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_name?: string
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          reference_id?: string | null
          sort_order?: number | null
          stripe_price_id_monthly?: string
          stripe_price_id_yearly?: string
          stripe_product_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      billing_subscription_events: {
        Row: {
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          subscription_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          subscription_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          subscription_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      billing_subscription_notifications: {
        Row: {
          channels: string[]
          created_at: string | null
          data: Json | null
          id: string
          scheduled_for: string
          sent: boolean | null
          sent_at: string | null
          subscription_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          channels: string[]
          created_at?: string | null
          data?: Json | null
          id?: string
          scheduled_for: string
          sent?: boolean | null
          sent_at?: string | null
          subscription_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          channels?: string[]
          created_at?: string | null
          data?: Json | null
          id?: string
          scheduled_for?: string
          sent?: boolean | null
          sent_at?: string | null
          subscription_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      call_logs: {
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
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      call_transcript_segments: {
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
            referencedRelation: "call_transcripts"
            referencedColumns: ["id"]
          },
        ]
      }
      call_transcripts: {
        Row: {
          call_id: string | null
          created_at: string | null
          created_by: string | null
          duration: number | null
          id: string
          is_deleted: boolean | null
          lead_deleted: boolean | null
          lead_deleted_at: string | null
          lead_deleted_by: string | null
          lead_id: string
          recorded_at: string | null
          recording_url: string | null
          source: string
          status: string | null
          summary: string | null
          title: string
          transcript_text: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          call_id?: string | null
          created_at?: string | null
          created_by?: string | null
          duration?: number | null
          id?: string
          is_deleted?: boolean | null
          lead_deleted?: boolean | null
          lead_deleted_at?: string | null
          lead_deleted_by?: string | null
          lead_id: string
          recorded_at?: string | null
          recording_url?: string | null
          source: string
          status?: string | null
          summary?: string | null
          title: string
          transcript_text: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          call_id?: string | null
          created_at?: string | null
          created_by?: string | null
          duration?: number | null
          id?: string
          is_deleted?: boolean | null
          lead_deleted?: boolean | null
          lead_deleted_at?: string | null
          lead_deleted_by?: string | null
          lead_id?: string
          recorded_at?: string | null
          recording_url?: string | null
          source?: string
          status?: string | null
          summary?: string | null
          title?: string
          transcript_text?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transcripts_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      capture_items: {
        Row: {
          ai_confidence: number | null
          ai_extracted_data: Json | null
          ai_summary: string | null
          assigned_deal_id: string | null
          assigned_lead_id: string | null
          assigned_property_id: string | null
          content: string | null
          created_at: string
          duration_seconds: number | null
          file_name: string | null
          file_size: number | null
          file_url: string | null
          id: string
          metadata: Json | null
          mime_type: string | null
          source: string | null
          status: string
          suggested_lead_id: string | null
          suggested_property_id: string | null
          title: string | null
          transcript: string | null
          triaged_at: string | null
          triaged_by: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_confidence?: number | null
          ai_extracted_data?: Json | null
          ai_summary?: string | null
          assigned_deal_id?: string | null
          assigned_lead_id?: string | null
          assigned_property_id?: string | null
          content?: string | null
          created_at?: string
          duration_seconds?: number | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          source?: string | null
          status?: string
          suggested_lead_id?: string | null
          suggested_property_id?: string | null
          title?: string | null
          transcript?: string | null
          triaged_at?: string | null
          triaged_by?: string | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_confidence?: number | null
          ai_extracted_data?: Json | null
          ai_summary?: string | null
          assigned_deal_id?: string | null
          assigned_lead_id?: string | null
          assigned_property_id?: string | null
          content?: string | null
          created_at?: string
          duration_seconds?: number | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          source?: string | null
          status?: string
          suggested_lead_id?: string | null
          suggested_property_id?: string | null
          title?: string | null
          transcript?: string | null
          triaged_at?: string | null
          triaged_by?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "capture_items_assigned_deal_id_fkey"
            columns: ["assigned_deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "capture_items_assigned_lead_id_fkey"
            columns: ["assigned_lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "capture_items_assigned_property_id_fkey"
            columns: ["assigned_property_id"]
            isOneToOne: false
            referencedRelation: "re_properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "capture_items_suggested_lead_id_fkey"
            columns: ["suggested_lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "capture_items_suggested_property_id_fkey"
            columns: ["suggested_property_id"]
            isOneToOne: false
            referencedRelation: "re_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      comms_email_logs: {
        Row: {
          clicked_at: string | null
          created_at: string | null
          email_type: string
          external_id: string | null
          id: string
          metadata: Json | null
          opened_at: string | null
          recipient: string
          status: string
          subject: string
          template_id: string | null
          user_id: string | null
        }
        Insert: {
          clicked_at?: string | null
          created_at?: string | null
          email_type: string
          external_id?: string | null
          id?: string
          metadata?: Json | null
          opened_at?: string | null
          recipient: string
          status: string
          subject: string
          template_id?: string | null
          user_id?: string | null
        }
        Update: {
          clicked_at?: string | null
          created_at?: string | null
          email_type?: string
          external_id?: string | null
          id?: string
          metadata?: Json | null
          opened_at?: string | null
          recipient?: string
          status?: string
          subject?: string
          template_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      comms_messages: {
        Row: {
          body: string
          channel: Database["public"]["Enums"]["message_channel"]
          channel_extended:
            | Database["public"]["Enums"]["channel_type_extended"]
            | null
          conversation_status: string
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason: string | null
          deletion_scheduled_at: string | null
          direction: Database["public"]["Enums"]["message_direction"]
          id: string
          is_deleted: boolean | null
          lead_deleted: boolean | null
          lead_deleted_at: string | null
          lead_deleted_by: string | null
          lead_id: string
          status: Database["public"]["Enums"]["message_status"]
          subject: string | null
          testing: boolean | null
          updated_at: string
        }
        Insert: {
          body: string
          channel: Database["public"]["Enums"]["message_channel"]
          channel_extended?:
            | Database["public"]["Enums"]["channel_type_extended"]
            | null
          conversation_status?: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          deletion_scheduled_at?: string | null
          direction: Database["public"]["Enums"]["message_direction"]
          id?: string
          is_deleted?: boolean | null
          lead_deleted?: boolean | null
          lead_deleted_at?: string | null
          lead_deleted_by?: string | null
          lead_id: string
          status?: Database["public"]["Enums"]["message_status"]
          subject?: string | null
          testing?: boolean | null
          updated_at?: string
        }
        Update: {
          body?: string
          channel?: Database["public"]["Enums"]["message_channel"]
          channel_extended?:
            | Database["public"]["Enums"]["channel_type_extended"]
            | null
          conversation_status?: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          deletion_scheduled_at?: string | null
          direction?: Database["public"]["Enums"]["message_direction"]
          id?: string
          is_deleted?: boolean | null
          lead_deleted?: boolean | null
          lead_deleted_at?: string | null
          lead_deleted_by?: string | null
          lead_id?: string
          status?: Database["public"]["Enums"]["message_status"]
          subject?: string | null
          testing?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      comms_scheduled_messages: {
        Row: {
          channel: Database["public"]["Enums"]["message_channel"]
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
          channel: Database["public"]["Enums"]["message_channel"]
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
          channel?: Database["public"]["Enums"]["message_channel"]
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
      conversation_items: {
        Row: {
          action_items: string[] | null
          ai_summary: string | null
          content: string | null
          created_at: string | null
          deal_id: string | null
          direction: string | null
          duration_seconds: number | null
          email_address: string | null
          id: string
          is_archived: boolean | null
          key_phrases: string[] | null
          lead_id: string | null
          occurred_at: string | null
          phone_number: string | null
          sentiment: string | null
          subject: string | null
          transcript: string | null
          twilio_message_sid: string | null
          type: string
          updated_at: string | null
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          action_items?: string[] | null
          ai_summary?: string | null
          content?: string | null
          created_at?: string | null
          deal_id?: string | null
          direction?: string | null
          duration_seconds?: number | null
          email_address?: string | null
          id?: string
          is_archived?: boolean | null
          key_phrases?: string[] | null
          lead_id?: string | null
          occurred_at?: string | null
          phone_number?: string | null
          sentiment?: string | null
          subject?: string | null
          transcript?: string | null
          twilio_message_sid?: string | null
          type: string
          updated_at?: string | null
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          action_items?: string[] | null
          ai_summary?: string | null
          content?: string | null
          created_at?: string | null
          deal_id?: string | null
          direction?: string | null
          duration_seconds?: number | null
          email_address?: string | null
          id?: string
          is_archived?: boolean | null
          key_phrases?: string[] | null
          lead_id?: string | null
          occurred_at?: string | null
          phone_number?: string | null
          sentiment?: string | null
          subject?: string | null
          transcript?: string | null
          twilio_message_sid?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_items_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_items_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_items_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_contacts: {
        Row: {
          address: Json | null
          city: string | null
          company: string | null
          created_at: string
          email: string | null
          emails: Json | null
          first_name: string | null
          id: string
          is_deleted: boolean | null
          job_title: string | null
          last_name: string | null
          phone: string | null
          phones: Json | null
          sms_opt_status: Database["public"]["Enums"]["sms_opt_status"] | null
          state: string | null
          updated_at: string
          zip: string | null
        }
        Insert: {
          address?: Json | null
          city?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          emails?: Json | null
          first_name?: string | null
          id?: string
          is_deleted?: boolean | null
          job_title?: string | null
          last_name?: string | null
          phone?: string | null
          phones?: Json | null
          sms_opt_status?: Database["public"]["Enums"]["sms_opt_status"] | null
          state?: string | null
          updated_at?: string
          zip?: string | null
        }
        Update: {
          address?: Json | null
          city?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          emails?: Json | null
          first_name?: string | null
          id?: string
          is_deleted?: boolean | null
          job_title?: string | null
          last_name?: string | null
          phone?: string | null
          phones?: Json | null
          sms_opt_status?: Database["public"]["Enums"]["sms_opt_status"] | null
          state?: string | null
          updated_at?: string
          zip?: string | null
        }
        Relationships: []
      }
      crm_lead_contacts: {
        Row: {
          contact_id: string
          created_at: string
          id: string
          is_primary: boolean | null
          lead_id: string
          role: string | null
          updated_at: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          id?: string
          is_primary?: boolean | null
          lead_id: string
          role?: string | null
          updated_at?: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          id?: string
          is_primary?: boolean | null
          lead_id?: string
          role?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_contacts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_contacts_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_lead_notes: {
        Row: {
          content: string
          created_at: string | null
          id: string
          lead_id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          lead_id: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          lead_id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_notes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_leads: {
        Row: {
          address_line_1: string | null
          address_line_2: string | null
          city: string | null
          company: string | null
          created_at: string | null
          email: string | null
          email_opt_status: Database["public"]["Enums"]["sms_opt_status"] | null
          email_opt_status_updated_at: string | null
          emails: Json | null
          has_conversation: boolean | null
          id: string
          import_id: string | null
          inserted_at: string
          is_deleted: boolean | null
          name: string
          opt_status: Database["public"]["Enums"]["sms_opt_status"] | null
          opt_status_updated_at: string | null
          phone: string | null
          phone_opt_status: Database["public"]["Enums"]["sms_opt_status"] | null
          phone_opt_status_updated_at: string | null
          phones: Json | null
          score: number | null
          state: string | null
          status: Database["public"]["Enums"]["lead_status"]
          tags: string[] | null
          text_opt_status: Database["public"]["Enums"]["sms_opt_status"] | null
          text_opt_status_updated_at: string | null
          updated_at: string
          user_id: string | null
          workspace_id: string | null
          zip: string | null
        }
        Insert: {
          address_line_1?: string | null
          address_line_2?: string | null
          city?: string | null
          company?: string | null
          created_at?: string | null
          email?: string | null
          email_opt_status?:
            | Database["public"]["Enums"]["sms_opt_status"]
            | null
          email_opt_status_updated_at?: string | null
          emails?: Json | null
          has_conversation?: boolean | null
          id?: string
          import_id?: string | null
          inserted_at?: string
          is_deleted?: boolean | null
          name: string
          opt_status?: Database["public"]["Enums"]["sms_opt_status"] | null
          opt_status_updated_at?: string | null
          phone?: string | null
          phone_opt_status?:
            | Database["public"]["Enums"]["sms_opt_status"]
            | null
          phone_opt_status_updated_at?: string | null
          phones?: Json | null
          score?: number | null
          state?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          tags?: string[] | null
          text_opt_status?: Database["public"]["Enums"]["sms_opt_status"] | null
          text_opt_status_updated_at?: string | null
          updated_at?: string
          user_id?: string | null
          workspace_id?: string | null
          zip?: string | null
        }
        Update: {
          address_line_1?: string | null
          address_line_2?: string | null
          city?: string | null
          company?: string | null
          created_at?: string | null
          email?: string | null
          email_opt_status?:
            | Database["public"]["Enums"]["sms_opt_status"]
            | null
          email_opt_status_updated_at?: string | null
          emails?: Json | null
          has_conversation?: boolean | null
          id?: string
          import_id?: string | null
          inserted_at?: string
          is_deleted?: boolean | null
          name?: string
          opt_status?: Database["public"]["Enums"]["sms_opt_status"] | null
          opt_status_updated_at?: string | null
          phone?: string | null
          phone_opt_status?:
            | Database["public"]["Enums"]["sms_opt_status"]
            | null
          phone_opt_status_updated_at?: string | null
          phones?: Json | null
          score?: number | null
          state?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          tags?: string[] | null
          text_opt_status?: Database["public"]["Enums"]["sms_opt_status"] | null
          text_opt_status_updated_at?: string | null
          updated_at?: string
          user_id?: string | null
          workspace_id?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      deal_events: {
        Row: {
          created_at: string
          created_by: string | null
          deal_id: string
          description: string | null
          event_type: string
          id: string
          metadata: Json | null
          source: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deal_id: string
          description?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          source?: string
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deal_id?: string
          description?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          source?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_events_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          created_at: string | null
          estimated_value: number | null
          expected_close_date: string | null
          id: string
          lead_id: string | null
          next_action: string | null
          next_action_due: string | null
          notes: string | null
          probability: number | null
          property_id: string | null
          stage: string
          status: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          estimated_value?: number | null
          expected_close_date?: string | null
          id?: string
          lead_id?: string | null
          next_action?: string | null
          next_action_due?: string | null
          notes?: string | null
          probability?: number | null
          property_id?: string | null
          stage?: string
          status?: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          estimated_value?: number | null
          expected_close_date?: string | null
          id?: string
          lead_id?: string | null
          next_action?: string | null
          next_action_due?: string | null
          notes?: string | null
          probability?: number | null
          property_id?: string | null
          stage?: string
          status?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "re_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      re_buying_criteria: {
        Row: {
          buyer_credit_pct: number
          buyers_profit_pct: number
          closing_expenses_pct: number
          created_at: string
          holding_months: number
          id: string
          max_interest_rate: number
          max_ltv_pct: number
          min_cap_rate_pct: number
          min_coc_pct: number
          misc_contingency_pct: number
          monthly_holding_cost: number
          selling_commission_pct: number
          updated_at: string
          user_id: string
          your_profit_pct: number
        }
        Insert: {
          buyer_credit_pct?: number
          buyers_profit_pct?: number
          closing_expenses_pct?: number
          created_at?: string
          holding_months?: number
          id?: string
          max_interest_rate?: number
          max_ltv_pct?: number
          min_cap_rate_pct?: number
          min_coc_pct?: number
          misc_contingency_pct?: number
          monthly_holding_cost?: number
          selling_commission_pct?: number
          updated_at?: string
          user_id: string
          your_profit_pct?: number
        }
        Update: {
          buyer_credit_pct?: number
          buyers_profit_pct?: number
          closing_expenses_pct?: number
          created_at?: string
          holding_months?: number
          id?: string
          max_interest_rate?: number
          max_ltv_pct?: number
          min_cap_rate_pct?: number
          min_coc_pct?: number
          misc_contingency_pct?: number
          monthly_holding_cost?: number
          selling_commission_pct?: number
          updated_at?: string
          user_id?: string
          your_profit_pct?: number
        }
        Relationships: []
      }
      re_comps: {
        Row: {
          address: string
          address_line_1: string | null
          address_line_2: string | null
          bathrooms: number | null
          bedrooms: number | null
          city: string
          created_at: string | null
          created_by: string | null
          days_on_market: number | null
          distance: number | null
          features_json: Json | null
          id: string
          lot_size: number | null
          price_per_sqft: number | null
          property_id: string
          sale_date: string | null
          sale_price: number | null
          source: string | null
          special_features: string | null
          square_feet: number | null
          state: string
          status: string | null
          updated_at: string | null
          workspace_id: string | null
          year_built: number | null
          zip: string
        }
        Insert: {
          address: string
          address_line_1?: string | null
          address_line_2?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          city: string
          created_at?: string | null
          created_by?: string | null
          days_on_market?: number | null
          distance?: number | null
          features_json?: Json | null
          id?: string
          lot_size?: number | null
          price_per_sqft?: number | null
          property_id: string
          sale_date?: string | null
          sale_price?: number | null
          source?: string | null
          special_features?: string | null
          square_feet?: number | null
          state: string
          status?: string | null
          updated_at?: string | null
          workspace_id?: string | null
          year_built?: number | null
          zip: string
        }
        Update: {
          address?: string
          address_line_1?: string | null
          address_line_2?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string
          created_at?: string | null
          created_by?: string | null
          days_on_market?: number | null
          distance?: number | null
          features_json?: Json | null
          id?: string
          lot_size?: number | null
          price_per_sqft?: number | null
          property_id?: string
          sale_date?: string | null
          sale_price?: number | null
          source?: string | null
          special_features?: string | null
          square_feet?: number | null
          state?: string
          status?: string | null
          updated_at?: string | null
          workspace_id?: string | null
          year_built?: number | null
          zip?: string
        }
        Relationships: [
          {
            foreignKeyName: "re_comps_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "re_properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "re_comps_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      re_document_embeddings: {
        Row: {
          chunk_index: number
          content_chunk: string
          created_at: string | null
          document_id: string
          embedding: string | null
          id: string
        }
        Insert: {
          chunk_index: number
          content_chunk: string
          created_at?: string | null
          document_id: string
          embedding?: string | null
          id?: string
        }
        Update: {
          chunk_index?: number
          content_chunk?: string
          created_at?: string | null
          document_id?: string
          embedding?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "re_document_embeddings_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "re_property_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      re_document_processing_queue: {
        Row: {
          created_at: string | null
          document_id: string
          error_message: string | null
          id: string
          processed_at: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          document_id: string
          error_message?: string | null
          id?: string
          processed_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          document_id?: string
          error_message?: string | null
          id?: string
          processed_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "re_document_processing_queue_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "re_property_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      re_documents: {
        Row: {
          content_type: string | null
          created_at: string | null
          deal_id: string | null
          file_size: number | null
          file_url: string
          id: string
          property_id: string | null
          title: string
          type: string
          updated_at: string | null
          uploaded_by: string | null
          user_id: string
        }
        Insert: {
          content_type?: string | null
          created_at?: string | null
          deal_id?: string | null
          file_size?: number | null
          file_url: string
          id?: string
          property_id?: string | null
          title: string
          type: string
          updated_at?: string | null
          uploaded_by?: string | null
          user_id: string
        }
        Update: {
          content_type?: string | null
          created_at?: string | null
          deal_id?: string | null
          file_size?: number | null
          file_url?: string
          id?: string
          property_id?: string | null
          title?: string
          type?: string
          updated_at?: string | null
          uploaded_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "re_documents_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "re_documents_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "re_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      re_financing_scenarios: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          input_json: Json
          is_primary: boolean | null
          name: string
          property_id: string
          pros_cons: string | null
          result_json: Json | null
          scenario_type: string | null
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          input_json: Json
          is_primary?: boolean | null
          name: string
          property_id: string
          pros_cons?: string | null
          result_json?: Json | null
          scenario_type?: string | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          input_json?: Json
          is_primary?: boolean | null
          name?: string
          property_id?: string
          pros_cons?: string | null
          result_json?: Json | null
          scenario_type?: string | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "re_financing_scenarios_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "re_properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "re_financing_scenarios_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      re_lead_properties: {
        Row: {
          created_at: string | null
          is_primary: boolean | null
          lead_id: string
          notes: string | null
          property_id: string
          relationship: string | null
          updated_at: string | null
          user_id: string | null
          workspace_id: string | null
        }
        Insert: {
          created_at?: string | null
          is_primary?: boolean | null
          lead_id: string
          notes?: string | null
          property_id: string
          relationship?: string | null
          updated_at?: string | null
          user_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          created_at?: string | null
          is_primary?: boolean | null
          lead_id?: string
          notes?: string | null
          property_id?: string
          relationship?: string | null
          updated_at?: string | null
          user_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "re_lead_properties_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "re_properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "re_lead_properties_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      re_portfolio_entries: {
        Row: {
          acquisition_date: string
          acquisition_price: number
          acquisition_source: string
          created_at: string | null
          deal_id: string | null
          group_id: string | null
          id: string
          is_active: boolean | null
          monthly_expenses: number | null
          monthly_rent: number | null
          notes: string | null
          ownership_percent: number | null
          projected_monthly_expenses: number | null
          projected_monthly_rent: number | null
          property_id: string
          property_manager_name: string | null
          property_manager_phone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          acquisition_date: string
          acquisition_price: number
          acquisition_source?: string
          created_at?: string | null
          deal_id?: string | null
          group_id?: string | null
          id?: string
          is_active?: boolean | null
          monthly_expenses?: number | null
          monthly_rent?: number | null
          notes?: string | null
          ownership_percent?: number | null
          projected_monthly_expenses?: number | null
          projected_monthly_rent?: number | null
          property_id: string
          property_manager_name?: string | null
          property_manager_phone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          acquisition_date?: string
          acquisition_price?: number
          acquisition_source?: string
          created_at?: string | null
          deal_id?: string | null
          group_id?: string | null
          id?: string
          is_active?: boolean | null
          monthly_expenses?: number | null
          monthly_rent?: number | null
          notes?: string | null
          ownership_percent?: number | null
          projected_monthly_expenses?: number | null
          projected_monthly_rent?: number | null
          property_id?: string
          property_manager_name?: string | null
          property_manager_phone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "re_portfolio_entries_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "re_portfolio_entries_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "re_portfolio_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "re_portfolio_entries_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "re_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      re_portfolio_groups: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          name: string
          sort_order: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
          sort_order?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
          sort_order?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      re_portfolio_monthly_records: {
        Row: {
          created_at: string | null
          expenses: Json | null
          id: string
          month: string
          notes: string | null
          occupancy_status: string | null
          portfolio_entry_id: string
          rent_collected: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          expenses?: Json | null
          id?: string
          month: string
          notes?: string | null
          occupancy_status?: string | null
          portfolio_entry_id: string
          rent_collected?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          expenses?: Json | null
          id?: string
          month?: string
          notes?: string | null
          occupancy_status?: string | null
          portfolio_entry_id?: string
          rent_collected?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "re_portfolio_monthly_records_portfolio_entry_id_fkey"
            columns: ["portfolio_entry_id"]
            isOneToOne: false
            referencedRelation: "re_portfolio_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      re_portfolio_mortgages: {
        Row: {
          created_at: string | null
          current_balance: number
          escrow_amount: number | null
          id: string
          interest_rate: number
          is_primary: boolean | null
          lender_name: string | null
          loan_type: string | null
          maturity_date: string | null
          monthly_payment: number
          notes: string | null
          original_balance: number
          portfolio_entry_id: string
          start_date: string
          term_months: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_balance: number
          escrow_amount?: number | null
          id?: string
          interest_rate: number
          is_primary?: boolean | null
          lender_name?: string | null
          loan_type?: string | null
          maturity_date?: string | null
          monthly_payment: number
          notes?: string | null
          original_balance: number
          portfolio_entry_id: string
          start_date: string
          term_months?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_balance?: number
          escrow_amount?: number | null
          id?: string
          interest_rate?: number
          is_primary?: boolean | null
          lender_name?: string | null
          loan_type?: string | null
          maturity_date?: string | null
          monthly_payment?: number
          notes?: string | null
          original_balance?: number
          portfolio_entry_id?: string
          start_date?: string
          term_months?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "re_portfolio_mortgages_portfolio_entry_id_fkey"
            columns: ["portfolio_entry_id"]
            isOneToOne: false
            referencedRelation: "re_portfolio_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      re_portfolio_valuations: {
        Row: {
          created_at: string | null
          estimated_value: number
          id: string
          metadata: Json | null
          notes: string | null
          property_id: string
          source: string | null
          updated_at: string | null
          valuation_date: string
        }
        Insert: {
          created_at?: string | null
          estimated_value: number
          id?: string
          metadata?: Json | null
          notes?: string | null
          property_id: string
          source?: string | null
          updated_at?: string | null
          valuation_date: string
        }
        Update: {
          created_at?: string | null
          estimated_value?: number
          id?: string
          metadata?: Json | null
          notes?: string | null
          property_id?: string
          source?: string | null
          updated_at?: string | null
          valuation_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "re_portfolio_valuations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "re_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      re_properties: {
        Row: {
          address_line_1: string
          address_line_2: string | null
          arv: number | null
          bathrooms: number | null
          bedrooms: number | null
          city: string
          county: string | null
          created_at: string | null
          created_by: string | null
          geo_point: unknown
          hoa: boolean | null
          id: string
          import_id: string | null
          lead_id: string | null
          lot_size: number | null
          mls_id: string | null
          notes: string | null
          owner_occupied: boolean | null
          profile_id: string | null
          property_type: string | null
          purchase_price: number | null
          square_feet: number | null
          state: string
          status: string | null
          tags: string[] | null
          updated_at: string | null
          user_id: string
          vacant: boolean | null
          workspace_id: string | null
          year_built: number | null
          zip: string
        }
        Insert: {
          address_line_1: string
          address_line_2?: string | null
          arv?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          city: string
          county?: string | null
          created_at?: string | null
          created_by?: string | null
          geo_point?: unknown
          hoa?: boolean | null
          id?: string
          import_id?: string | null
          lead_id?: string | null
          lot_size?: number | null
          mls_id?: string | null
          notes?: string | null
          owner_occupied?: boolean | null
          profile_id?: string | null
          property_type?: string | null
          purchase_price?: number | null
          square_feet?: number | null
          state: string
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id: string
          vacant?: boolean | null
          workspace_id?: string | null
          year_built?: number | null
          zip: string
        }
        Update: {
          address_line_1?: string
          address_line_2?: string | null
          arv?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string
          county?: string | null
          created_at?: string | null
          created_by?: string | null
          geo_point?: unknown
          hoa?: boolean | null
          id?: string
          import_id?: string | null
          lead_id?: string | null
          lot_size?: number | null
          mls_id?: string | null
          notes?: string | null
          owner_occupied?: boolean | null
          profile_id?: string | null
          property_type?: string | null
          purchase_price?: number | null
          square_feet?: number | null
          state?: string
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string
          vacant?: boolean | null
          workspace_id?: string | null
          year_built?: number | null
          zip?: string
        }
        Relationships: [
          {
            foreignKeyName: "re_properties_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "re_properties_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "re_properties_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      re_property_analyses: {
        Row: {
          analysis_type: string | null
          created_at: string | null
          created_by: string | null
          id: string
          input_json: Json
          name: string | null
          property_id: string
          result_json: Json
          tokens_used: number | null
          workspace_id: string | null
        }
        Insert: {
          analysis_type?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          input_json: Json
          name?: string | null
          property_id: string
          result_json: Json
          tokens_used?: number | null
          workspace_id?: string | null
        }
        Update: {
          analysis_type?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          input_json?: Json
          name?: string | null
          property_id?: string
          result_json?: Json
          tokens_used?: number | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "re_property_analyses_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "re_properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "re_property_analyses_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      re_property_debt: {
        Row: {
          additional_liens: number | null
          created_at: string | null
          created_by: string | null
          estimated_arv: number | null
          id: string
          notes: string | null
          property_id: string
          repair_estimate: number | null
          total_assessed_value: number | null
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          additional_liens?: number | null
          created_at?: string | null
          created_by?: string | null
          estimated_arv?: number | null
          id?: string
          notes?: string | null
          property_id: string
          repair_estimate?: number | null
          total_assessed_value?: number | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          additional_liens?: number | null
          created_at?: string | null
          created_by?: string | null
          estimated_arv?: number | null
          id?: string
          notes?: string | null
          property_id?: string
          repair_estimate?: number | null
          total_assessed_value?: number | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "re_property_debt_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: true
            referencedRelation: "re_properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "re_property_debt_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      re_property_documents: {
        Row: {
          content_type: string
          created_at: string | null
          description: string | null
          file_path: string
          file_size: number
          file_type: string
          id: string
          is_archived: boolean | null
          name: string
          property_id: string
          tags: string[] | null
          updated_at: string | null
          uploaded_by: string | null
          workspace_id: string | null
        }
        Insert: {
          content_type: string
          created_at?: string | null
          description?: string | null
          file_path: string
          file_size: number
          file_type: string
          id?: string
          is_archived?: boolean | null
          name: string
          property_id: string
          tags?: string[] | null
          updated_at?: string | null
          uploaded_by?: string | null
          workspace_id?: string | null
        }
        Update: {
          content_type?: string
          created_at?: string | null
          description?: string | null
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          is_archived?: boolean | null
          name?: string
          property_id?: string
          tags?: string[] | null
          updated_at?: string | null
          uploaded_by?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "re_property_documents_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "re_properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "re_property_documents_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      re_property_images: {
        Row: {
          created_at: string | null
          filename: string | null
          id: string
          is_primary: boolean | null
          label: string | null
          property_id: string
          uploaded_by: string | null
          url: string
          workspace_id: string | null
        }
        Insert: {
          created_at?: string | null
          filename?: string | null
          id?: string
          is_primary?: boolean | null
          label?: string | null
          property_id: string
          uploaded_by?: string | null
          url: string
          workspace_id?: string | null
        }
        Update: {
          created_at?: string | null
          filename?: string | null
          id?: string
          is_primary?: boolean | null
          label?: string | null
          property_id?: string
          uploaded_by?: string | null
          url?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "re_property_images_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "re_properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "re_property_images_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      re_property_mortgages: {
        Row: {
          arrears: number | null
          created_at: string | null
          created_by: string | null
          id: string
          interest_rate: number | null
          is_active: boolean | null
          lender_name: string | null
          loan_amount: number | null
          loan_type: string | null
          monthly_payment: number | null
          mortgage_name: string
          notes: string | null
          property_id: string
          start_date: string | null
          term_years: number | null
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          arrears?: number | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          interest_rate?: number | null
          is_active?: boolean | null
          lender_name?: string | null
          loan_amount?: number | null
          loan_type?: string | null
          monthly_payment?: number | null
          mortgage_name: string
          notes?: string | null
          property_id: string
          start_date?: string | null
          term_years?: number | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          arrears?: number | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          interest_rate?: number | null
          is_active?: boolean | null
          lender_name?: string | null
          loan_amount?: number | null
          loan_type?: string | null
          monthly_payment?: number | null
          mortgage_name?: string
          notes?: string | null
          property_id?: string
          start_date?: string | null
          term_years?: number | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "re_property_mortgages_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "re_properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "re_property_mortgages_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      re_repair_estimates: {
        Row: {
          category: string | null
          completed: boolean | null
          created_at: string | null
          created_by: string | null
          description: string
          estimate: number
          id: string
          notes: string | null
          priority: string | null
          property_id: string
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          category?: string | null
          completed?: boolean | null
          created_at?: string | null
          created_by?: string | null
          description: string
          estimate: number
          id?: string
          notes?: string | null
          priority?: string | null
          property_id: string
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          category?: string | null
          completed?: boolean | null
          created_at?: string | null
          created_by?: string | null
          description?: string
          estimate?: number
          id?: string
          notes?: string | null
          priority?: string | null
          property_id?: string
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "re_repair_estimates_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "re_properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "re_repair_estimates_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      secure_spatial_ref_sys: {
        Row: {
          auth_name: string | null
          auth_srid: number | null
          proj4text: string | null
          srid: number | null
          srtext: string | null
        }
        Insert: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid?: number | null
          srtext?: string | null
        }
        Update: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid?: number | null
          srtext?: string | null
        }
        Relationships: []
      }
      security_api_keys: {
        Row: {
          created_at: string | null
          description: string | null
          encrypted: boolean | null
          group_name: string
          id: string
          key_ciphertext: string
          last_checked: string | null
          last_used: string | null
          service: string
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          encrypted?: boolean | null
          group_name?: string
          id?: string
          key_ciphertext: string
          last_checked?: string | null
          last_used?: string | null
          service: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          encrypted?: boolean | null
          group_name?: string
          id?: string
          key_ciphertext?: string
          last_checked?: string | null
          last_used?: string | null
          service?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      security_email_change_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          id: string
          new_email: string
          previous_email: string
          user_id: string
          verified: boolean
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_email: string
          previous_email: string
          user_id: string
          verified?: boolean
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_email?: string
          previous_email?: string
          user_id?: string
          verified?: boolean
        }
        Relationships: []
      }
      security_event_logs: {
        Row: {
          created_at: string | null
          email_id: string | null
          event_data: Json | null
          event_type: string
          id: string
          ip_address: string | null
          location: string | null
          notified: boolean | null
          severity: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email_id?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          ip_address?: string | null
          location?: string | null
          notified?: boolean | null
          severity: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email_id?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          ip_address?: string | null
          location?: string | null
          notified?: boolean | null
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_event_logs_email_id_fkey"
            columns: ["email_id"]
            isOneToOne: false
            referencedRelation: "comms_email_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      security_oauth_tokens: {
        Row: {
          access_token: string
          created_at: string | null
          expiry_date: string
          id: string
          provider: string
          raw_token: Json
          refresh_token: string
          scopes: string[]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string | null
          expiry_date: string
          id?: string
          provider: string
          raw_token: Json
          refresh_token: string
          scopes: string[]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string | null
          expiry_date?: string
          id?: string
          provider?: string
          raw_token?: Json
          refresh_token?: string
          scopes?: string[]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      security_reset_tokens: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string
          id: string
          ip_address: string | null
          token: string
          used: boolean
          used_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at: string
          id?: string
          ip_address?: string | null
          token: string
          used?: boolean
          used_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          ip_address?: string | null
          token?: string
          used?: boolean
          used_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      spatial_ref_sys: {
        Row: {
          auth_name: string | null
          auth_srid: number | null
          proj4text: string | null
          srid: number
          srtext: string | null
        }
        Insert: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid: number
          srtext?: string | null
        }
        Update: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid?: number
          srtext?: string | null
        }
        Relationships: []
      }
      survey_analytics: {
        Row: {
          count: number
          field_name: string
          field_value: string
          id: string
          updated_at: string
        }
        Insert: {
          count?: number
          field_name: string
          field_value: string
          id?: string
          updated_at?: string
        }
        Update: {
          count?: number
          field_name?: string
          field_value?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      survey_interactions: {
        Row: {
          action: string
          field_name: string
          id: string
          timestamp: string
          user_id: string
        }
        Insert: {
          action: string
          field_name: string
          id?: string
          timestamp?: string
          user_id: string
        }
        Update: {
          action?: string
          field_name?: string
          id?: string
          timestamp?: string
          user_id?: string
        }
        Relationships: []
      }
      survey_step_views: {
        Row: {
          id: string
          step_id: string
          user_id: string
          viewed_at: string
        }
        Insert: {
          id?: string
          step_id: string
          user_id: string
          viewed_at?: string
        }
        Update: {
          id?: string
          step_id?: string
          user_id?: string
          viewed_at?: string
        }
        Relationships: []
      }
      system_feature_flags: {
        Row: {
          code: string
          created_at: string | null
          description: string
          enabled_for_plan: string[] | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description: string
          enabled_for_plan?: string[] | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string
          enabled_for_plan?: string[] | null
        }
        Relationships: []
      }
      system_logs: {
        Row: {
          client_info: Json | null
          context: Json | null
          created_at: string
          details: Json | null
          environment: string | null
          error_code: string | null
          id: string
          ip_address: string | null
          level: string
          message: string
          request_id: string | null
          session_id: string | null
          severity: number | null
          source: string
          stack_trace: string | null
          user_id: string | null
        }
        Insert: {
          client_info?: Json | null
          context?: Json | null
          created_at?: string
          details?: Json | null
          environment?: string | null
          error_code?: string | null
          id?: string
          ip_address?: string | null
          level: string
          message: string
          request_id?: string | null
          session_id?: string | null
          severity?: number | null
          source: string
          stack_trace?: string | null
          user_id?: string | null
        }
        Update: {
          client_info?: Json | null
          context?: Json | null
          created_at?: string
          details?: Json | null
          environment?: string | null
          error_code?: string | null
          id?: string
          ip_address?: string | null
          level?: string
          message?: string
          request_id?: string | null
          session_id?: string | null
          severity?: number | null
          source?: string
          stack_trace?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      system_logs_settings: {
        Row: {
          auto_cleanup_enabled: boolean
          created_at: string
          id: number
          last_cleanup_at: string | null
          retention_days_error: number
          retention_days_info: number
          retention_days_security: number
          retention_days_warning: number
          updated_at: string
        }
        Insert: {
          auto_cleanup_enabled?: boolean
          created_at?: string
          id?: number
          last_cleanup_at?: string | null
          retention_days_error?: number
          retention_days_info?: number
          retention_days_security?: number
          retention_days_warning?: number
          updated_at?: string
        }
        Update: {
          auto_cleanup_enabled?: boolean
          created_at?: string
          id?: number
          last_cleanup_at?: string | null
          retention_days_error?: number
          retention_days_info?: number
          retention_days_security?: number
          retention_days_warning?: number
          updated_at?: string
        }
        Relationships: []
      }
      system_rate_limits: {
        Row: {
          created_at: string
          id: string
          last_reset: string
          request_type: string
          requests_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_reset?: string
          request_type: string
          requests_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_reset?: string
          request_type?: string
          requests_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      system_scheduled_deletions: {
        Row: {
          admin_notes: string | null
          cancelled_at: string | null
          completed_at: string | null
          id: string
          reason: string | null
          requested_at: string
          scheduled_for: string
          status: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          id?: string
          reason?: string | null
          requested_at?: string
          scheduled_for: string
          status: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          id?: string
          reason?: string | null
          requested_at?: string
          scheduled_for?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      system_usage_logs: {
        Row: {
          cost_cents: number | null
          created_at: string | null
          id: string
          service: string
          tokens_used: number | null
          user_id: string | null
        }
        Insert: {
          cost_cents?: number | null
          created_at?: string | null
          id?: string
          service: string
          tokens_used?: number | null
          user_id?: string | null
        }
        Update: {
          cost_cents?: number | null
          created_at?: string | null
          id?: string
          service?: string
          tokens_used?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_email_preferences: {
        Row: {
          created_at: string | null
          document_emails: boolean | null
          email_frequency: string | null
          lead_update_emails: boolean | null
          marketing_emails: boolean | null
          property_emails: boolean | null
          reminder_emails: boolean | null
          security_emails: boolean | null
          unsubscribed_all: boolean | null
          updated_at: string | null
          user_id: string
          welcome_emails: boolean | null
        }
        Insert: {
          created_at?: string | null
          document_emails?: boolean | null
          email_frequency?: string | null
          lead_update_emails?: boolean | null
          marketing_emails?: boolean | null
          property_emails?: boolean | null
          reminder_emails?: boolean | null
          security_emails?: boolean | null
          unsubscribed_all?: boolean | null
          updated_at?: string | null
          user_id: string
          welcome_emails?: boolean | null
        }
        Update: {
          created_at?: string | null
          document_emails?: boolean | null
          email_frequency?: string | null
          lead_update_emails?: boolean | null
          marketing_emails?: boolean | null
          property_emails?: boolean | null
          reminder_emails?: boolean | null
          security_emails?: boolean | null
          unsubscribed_all?: boolean | null
          updated_at?: string | null
          user_id?: string
          welcome_emails?: boolean | null
        }
        Relationships: []
      }
      user_import_mappings: {
        Row: {
          created_at: string
          id: string
          mapping: Json
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mapping: Json
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          mapping?: Json
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_mfa_pending_setup: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          method: string
          secret: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          method: string
          secret: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          method?: string
          secret?: string
          user_id?: string
        }
        Relationships: []
      }
      user_mfa_recovery_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          used: boolean
          used_at: string | null
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          used?: boolean
          used_at?: string | null
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          used?: boolean
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_mfa_settings: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean
          last_used_at: string | null
          method: string
          secret: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean
          last_used_at?: string | null
          method: string
          secret: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean
          last_used_at?: string | null
          method?: string
          secret?: string
          user_id?: string
        }
        Relationships: []
      }
      user_notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          message: string
          read: boolean | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message: string
          read?: boolean | null
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message?: string
          read?: boolean | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_onboarding_status: {
        Row: {
          email_verified: boolean
          id: string
          is_complete: boolean
          last_completed_step: string | null
          last_updated: string
          profile_complete: boolean
          step_completed: number
          total_steps: number
          user_id: string
        }
        Insert: {
          email_verified?: boolean
          id?: string
          is_complete?: boolean
          last_completed_step?: string | null
          last_updated?: string
          profile_complete?: boolean
          step_completed?: number
          total_steps?: number
          user_id: string
        }
        Update: {
          email_verified?: boolean
          id?: string
          is_complete?: boolean
          last_completed_step?: string | null
          last_updated?: string
          profile_complete?: boolean
          step_completed?: number
          total_steps?: number
          user_id?: string
        }
        Relationships: []
      }
      user_onboarding_steps: {
        Row: {
          completed_at: string | null
          description: string | null
          id: string
          is_required: boolean
          name: string
          order: number
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          description?: string | null
          id: string
          is_required?: boolean
          name: string
          order: number
          user_id: string
        }
        Update: {
          completed_at?: string | null
          description?: string | null
          id?: string
          is_required?: boolean
          name?: string
          order?: number
          user_id?: string
        }
        Relationships: []
      }
      user_onboarding_surveys: {
        Row: {
          competitor_tools: string[] | null
          competitor_tools_other: string | null
          completed_at: string | null
          created_at: string
          experience_level: string | null
          feature_interests: string[] | null
          id: string
          investment_strategy: string | null
          is_interested_in_training: boolean | null
          monthly_property_volume: string | null
          newsletter_frequency: string | null
          primary_problem: string | null
          primary_role: string | null
          referral_source: string | null
          referral_source_other: string | null
          skipped: boolean | null
          usage_intent: string | null
          user_id: string
        }
        Insert: {
          competitor_tools?: string[] | null
          competitor_tools_other?: string | null
          completed_at?: string | null
          created_at?: string
          experience_level?: string | null
          feature_interests?: string[] | null
          id?: string
          investment_strategy?: string | null
          is_interested_in_training?: boolean | null
          monthly_property_volume?: string | null
          newsletter_frequency?: string | null
          primary_problem?: string | null
          primary_role?: string | null
          referral_source?: string | null
          referral_source_other?: string | null
          skipped?: boolean | null
          usage_intent?: string | null
          user_id: string
        }
        Update: {
          competitor_tools?: string[] | null
          competitor_tools_other?: string | null
          completed_at?: string | null
          created_at?: string
          experience_level?: string | null
          feature_interests?: string[] | null
          id?: string
          investment_strategy?: string | null
          is_interested_in_training?: boolean | null
          monthly_property_volume?: string | null
          newsletter_frequency?: string | null
          primary_problem?: string | null
          primary_role?: string | null
          referral_source?: string | null
          referral_source_other?: string | null
          skipped?: boolean | null
          usage_intent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_plans: {
        Row: {
          email_domain: string | null
          last_login: string | null
          monthly_token_cap: number | null
          status: string | null
          tier: Database["public"]["Enums"]["plan_tier"] | null
          trial_ends_at: string | null
          user_id: string
        }
        Insert: {
          email_domain?: string | null
          last_login?: string | null
          monthly_token_cap?: number | null
          status?: string | null
          tier?: Database["public"]["Enums"]["plan_tier"] | null
          trial_ends_at?: string | null
          user_id: string
        }
        Update: {
          email_domain?: string | null
          last_login?: string | null
          monthly_token_cap?: number | null
          status?: string | null
          tier?: Database["public"]["Enums"]["plan_tier"] | null
          trial_ends_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          account_type: string
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason: string | null
          email: string
          email_verified: boolean | null
          first_name: string | null
          id: string
          is_deleted: boolean | null
          last_name: string | null
          name: string | null
          onboarding_completed: boolean | null
          original_email: string | null
          original_id: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          account_type?: string
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          email: string
          email_verified?: boolean | null
          first_name?: string | null
          id: string
          is_deleted?: boolean | null
          last_name?: string | null
          name?: string | null
          onboarding_completed?: boolean | null
          original_email?: string | null
          original_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          account_type?: string
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          email?: string
          email_verified?: boolean | null
          first_name?: string | null
          id?: string
          is_deleted?: boolean | null
          last_name?: string | null
          name?: string | null
          onboarding_completed?: boolean | null
          original_email?: string | null
          original_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: []
      }
      user_reminder_logs: {
        Row: {
          action_taken: boolean | null
          action_taken_at: string | null
          email_id: string | null
          id: string
          reminder_type: string
          sent_at: string | null
          user_id: string | null
        }
        Insert: {
          action_taken?: boolean | null
          action_taken_at?: string | null
          email_id?: string | null
          id?: string
          reminder_type: string
          sent_at?: string | null
          user_id?: string | null
        }
        Update: {
          action_taken?: boolean | null
          action_taken_at?: string | null
          email_id?: string | null
          id?: string
          reminder_type?: string
          sent_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reminder_logs_email_id_fkey"
            columns: ["email_id"]
            isOneToOne: false
            referencedRelation: "comms_email_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      user_reminder_states: {
        Row: {
          created_at: string | null
          id: string
          next_reminder_at: string | null
          reminder_count: number | null
          reminder_type: string
          state: Json | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          next_reminder_at?: string | null
          reminder_count?: number | null
          reminder_type: string
          state?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          next_reminder_at?: string | null
          reminder_count?: number | null
          reminder_type?: string
          state?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_retention: {
        Row: {
          cohort_date: string
          id: string
          original_count: number
          retained_count: number
          retention_days: number
        }
        Insert: {
          cohort_date: string
          id?: string
          original_count: number
          retained_count: number
          retention_days: number
        }
        Update: {
          cohort_date?: string
          id?: string
          original_count?: number
          retained_count?: number
          retention_days?: number
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          customer_id: string
          id: string
          metadata: Json | null
          payment_status: string
          plan_id: string | null
          status: string
          subscription_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          customer_id: string
          id?: string
          metadata?: Json | null
          payment_status: string
          plan_id?: string | null
          status: string
          subscription_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          customer_id?: string
          id?: string
          metadata?: Json | null
          payment_status?: string
          plan_id?: string | null
          status?: string
          subscription_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      workspace_members: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          role: string
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          role?: string
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          role?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          owner_id: string
          settings: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active: boolean
          name: string
          owner_id: string
          settings?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          owner_id?: string
          settings?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      wrappers_fdw_stats: {
        Row: {
          bytes_in: number | null
          bytes_out: number | null
          create_times: number | null
          created_at: string
          fdw_name: string
          metadata: Json | null
          rows_in: number | null
          rows_out: number | null
          updated_at: string
        }
        Insert: {
          bytes_in?: number | null
          bytes_out?: number | null
          create_times?: number | null
          created_at?: string
          fdw_name: string
          metadata?: Json | null
          rows_in?: number | null
          rows_out?: number | null
          updated_at?: string
        }
        Update: {
          bytes_in?: number | null
          bytes_out?: number | null
          create_times?: number | null
          created_at?: string
          fdw_name?: string
          metadata?: Json | null
          rows_in?: number | null
          rows_out?: number | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      geography_columns: {
        Row: {
          coord_dimension: number | null
          f_geography_column: unknown
          f_table_catalog: unknown
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Relationships: []
      }
      geometry_columns: {
        Row: {
          coord_dimension: number | null
          f_geometry_column: unknown
          f_table_catalog: string | null
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Insert: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Update: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      _postgis_deprecate: {
        Args: { newname: string; oldname: string; version: string }
        Returns: undefined
      }
      _postgis_index_extent: {
        Args: { col: string; tbl: unknown }
        Returns: unknown
      }
      _postgis_pgsql_version: { Args: never; Returns: string }
      _postgis_scripts_pgsql_version: { Args: never; Returns: string }
      _postgis_selectivity: {
        Args: { att_name: string; geom: unknown; mode?: string; tbl: unknown }
        Returns: number
      }
      _postgis_stats: {
        Args: { ""?: string; att_name: string; tbl: unknown }
        Returns: string
      }
      _st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      _st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_intersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      _st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      _st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      _st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_sortablehash: { Args: { geom: unknown }; Returns: number }
      _st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_voronoi: {
        Args: {
          clip?: unknown
          g1: unknown
          return_polygons?: boolean
          tolerance?: number
        }
        Returns: unknown
      }
      _st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      addauth: { Args: { "": string }; Returns: boolean }
      addgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              new_dim: number
              new_srid_in: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
      admin_check_orphaned_users: {
        Args: never
        Returns: {
          created_at: string
          email: string
          id: string
        }[]
      }
      admin_create_profile_for_user: {
        Args: { user_email: string }
        Returns: string
      }
      admin_delete_orphaned_user: {
        Args: { user_email: string }
        Returns: string
      }
      airtable_fdw_handler: { Args: never; Returns: unknown }
      airtable_fdw_meta: {
        Args: never
        Returns: {
          author: string
          name: string
          version: string
          website: string
        }[]
      }
      airtable_fdw_validator: {
        Args: { catalog: unknown; options: string[] }
        Returns: undefined
      }
      anonymize_deleted_user: {
        Args: { user_id_param: string }
        Returns: boolean
      }
      auth0_fdw_handler: { Args: never; Returns: unknown }
      auth0_fdw_meta: {
        Args: never
        Returns: {
          author: string
          name: string
          version: string
          website: string
        }[]
      }
      auth0_fdw_validator: {
        Args: { catalog: unknown; options: string[] }
        Returns: undefined
      }
      big_query_fdw_handler: { Args: never; Returns: unknown }
      big_query_fdw_meta: {
        Args: never
        Returns: {
          author: string
          name: string
          version: string
          website: string
        }[]
      }
      big_query_fdw_validator: {
        Args: { catalog: unknown; options: string[] }
        Returns: undefined
      }
      check_api_health: { Args: { api_service: string }; Returns: Json }
      check_auth_rls_initplan_issues: {
        Args: never
        Returns: {
          cmd: string
          issue: string
          policy_name: string
          query_using: string
          schema_name: string
          table_name: string
        }[]
      }
      check_auth_rls_performance: {
        Args: never
        Returns: {
          cmd: string
          policy_name: string
          query_using: string
          schema_name: string
          table_name: string
        }[]
      }
      check_duplicate_indexes: {
        Args: never
        Returns: {
          duplicated_by: string
          index_name: string
          schema_name: string
          table_name: string
        }[]
      }
      check_email_available: { Args: { check_email: string }; Returns: boolean }
      check_profiles_recursion: { Args: never; Returns: string }
      check_rls_enabled: {
        Args: never
        Returns: {
          rls_enabled: boolean
          table_name: string
          table_schema: string
        }[]
      }
      check_user_mfa_enabled: {
        Args: { check_user_id: string }
        Returns: boolean
      }
      check_user_subscription_status: {
        Args: { p_user_id: string }
        Returns: Json
      }
      clean_expired_reset_tokens: { Args: never; Returns: number }
      clean_system_logs:
        | {
            Args: { days_to_keep?: number; log_level?: string }
            Returns: number
          }
        | {
            Args: { dry_run?: boolean; retention_days?: number }
            Returns: number
          }
      cleanup_deleted_messages: { Args: never; Returns: undefined }
      cleanup_expired_mfa_setups: { Args: never; Returns: number }
      click_house_fdw_handler: { Args: never; Returns: unknown }
      click_house_fdw_meta: {
        Args: never
        Returns: {
          author: string
          name: string
          version: string
          website: string
        }[]
      }
      click_house_fdw_validator: {
        Args: { catalog: unknown; options: string[] }
        Returns: undefined
      }
      cognito_fdw_handler: { Args: never; Returns: unknown }
      cognito_fdw_meta: {
        Args: never
        Returns: {
          author: string
          name: string
          version: string
          website: string
        }[]
      }
      cognito_fdw_validator: {
        Args: { catalog: unknown; options: string[] }
        Returns: undefined
      }
      decrypt_api_key: { Args: { key_encrypted: string }; Returns: string }
      delete_all_logs: {
        Args: { log_level?: string }
        Returns: {
          count: number
        }[]
      }
      delete_old_logs: {
        Args: { cutoff_date: string; log_level: string }
        Returns: {
          count: number
        }[]
      }
      delete_transcript_messages: {
        Args: { transcript_id_param: string }
        Returns: undefined
      }
      disablelongtransactions: { Args: never; Returns: string }
      dropgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { column_name: string; table_name: string }; Returns: string }
      dropgeometrytable:
        | {
            Args: {
              catalog_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { schema_name: string; table_name: string }; Returns: string }
        | { Args: { table_name: string }; Returns: string }
      enablelongtransactions: { Args: never; Returns: string }
      encrypt_api_key: { Args: { key_plain: string }; Returns: string }
      ensure_user_workspace: { Args: never; Returns: string }
      equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      extract_email_domain: { Args: { email: string }; Returns: string }
      firebase_fdw_handler: { Args: never; Returns: unknown }
      firebase_fdw_meta: {
        Args: never
        Returns: {
          author: string
          name: string
          version: string
          website: string
        }[]
      }
      firebase_fdw_validator: {
        Args: { catalog: unknown; options: string[] }
        Returns: undefined
      }
      force_delete_user_by_email: {
        Args: { email_address: string }
        Returns: string
      }
      generate_unique_email: { Args: { original: string }; Returns: string }
      geometry: { Args: { "": string }; Returns: unknown }
      geometry_above: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_below: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_cmp: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_contained_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_distance_box: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_distance_centroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_eq: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_ge: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_gt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_le: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_left: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_lt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overabove: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overbelow: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overleft: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overright: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_right: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geomfromewkt: { Args: { "": string }; Returns: unknown }
      get_active_stripe_plans: {
        Args: never
        Returns: {
          created_at: string | null
          display_name: string
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          reference_id: string | null
          sort_order: number | null
          stripe_price_id_monthly: string
          stripe_price_id_yearly: string
          stripe_product_id: string
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "billing_stripe_products"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_active_workspace: { Args: { user_uuid: string }; Returns: string }
      get_common_journey_patterns: {
        Args: { limit_count?: number }
        Returns: {
          count: number
          experience_level: string
          primary_role: string
          usage_intent: string
        }[]
      }
      get_data_dictionary: {
        Args: { schema_name: string }
        Returns: {
          column_default: string
          column_name: string
          data_type: string
          is_nullable: string
          table_name: string
        }[]
      }
      get_detailed_log_statistics: {
        Args: never
        Returns: {
          avg_per_day: number
          count: number
          last_24h: number
          last_7d: number
          level: string
          source: string
          source_count: number
        }[]
      }
      get_email_preferences: {
        Args: { p_user_id: string }
        Returns: {
          created_at: string | null
          document_emails: boolean | null
          email_frequency: string | null
          lead_update_emails: boolean | null
          marketing_emails: boolean | null
          property_emails: boolean | null
          reminder_emails: boolean | null
          security_emails: boolean | null
          unsubscribed_all: boolean | null
          updated_at: string | null
          user_id: string
          welcome_emails: boolean | null
        }[]
        SetofOptions: {
          from: "*"
          to: "user_email_preferences"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_log_size_stats: {
        Args: never
        Returns: {
          avg_row_size_bytes: number
          estimated_mb: number
          row_count: number
          total_size_bytes: number
        }[]
      }
      get_log_statistics: {
        Args: never
        Returns: {
          count: number
          level: string
        }[]
      }
      get_stripe_price_id: {
        Args: { is_yearly: boolean; plan_name: string }
        Returns: string
      }
      get_survey_completion_by_cohort: {
        Args: { days_back?: number }
        Returns: {
          completed_survey: number
          completion_rate: number
          signup_date: string
          total_users: number
        }[]
      }
      get_system_logs_settings: { Args: never; Returns: Json }
      get_user_role: { Args: never; Returns: string }
      get_user_workspace:
        | { Args: never; Returns: string }
        | { Args: { p_user_id: string }; Returns: string }
      get_wrappers_fdw_stats: { Args: never; Returns: Json }
      gettransactionid: { Args: never; Returns: unknown }
      has_pending_deletion: {
        Args: { user_id_param: string }
        Returns: boolean
      }
      hello_world_fdw_handler: { Args: never; Returns: unknown }
      hello_world_fdw_meta: {
        Args: never
        Returns: {
          author: string
          name: string
          version: string
          website: string
        }[]
      }
      hello_world_fdw_validator: {
        Args: { catalog: unknown; options: string[] }
        Returns: undefined
      }
      insert_oauth_token: {
        Args: {
          p_access_token: string
          p_expiry_date: string
          p_provider: string
          p_raw_token: Json
          p_refresh_token: string
          p_scopes: string[]
          p_user_id: string
        }
        Returns: boolean
      }
      is_admin:
        | { Args: never; Returns: boolean }
        | { Args: { uid: string }; Returns: boolean }
      is_admin_non_recursive: { Args: never; Returns: boolean }
      is_admin_safe: { Args: never; Returns: boolean }
      is_admin_simple: { Args: never; Returns: boolean }
      is_admin_user:
        | { Args: never; Returns: boolean }
        | { Args: { user_id: string }; Returns: boolean }
      is_allowed_admin_domain: { Args: { email: string }; Returns: boolean }
      is_resource_owner: {
        Args: { resource_user_id: string }
        Returns: boolean
      }
      is_workspace_member: { Args: { workspace_id: string }; Returns: boolean }
      log_auth_event: {
        Args: { event_type: string; metadata?: Json; user_id?: string }
        Returns: string
      }
      log_error:
        | {
            Args: {
              details?: Json
              error_code?: string
              message: string
              metadata?: Json
              source?: string
              user_id?: string
            }
            Returns: string
          }
        | {
            Args: {
              p_details?: Json
              p_error_code?: string
              p_message: string
              p_source: string
              p_user_id?: string
            }
            Returns: string
          }
      log_info:
        | {
            Args: {
              details?: Json
              message: string
              metadata?: Json
              source?: string
              user_id?: string
            }
            Returns: string
          }
        | {
            Args: {
              p_details?: Json
              p_message: string
              p_source: string
              p_user_id?: string
            }
            Returns: string
          }
      log_migration_step:
        | {
            Args: {
              message?: string
              metadata?: Json
              migration_name: string
              status: string
              step_name: string
            }
            Returns: string
          }
        | { Args: { step_description: string }; Returns: string }
      log_security:
        | {
            Args: {
              details?: Json
              message: string
              metadata?: Json
              source?: string
              user_id?: string
            }
            Returns: string
          }
        | {
            Args: {
              p_details?: Json
              p_message: string
              p_source: string
              p_user_id?: string
            }
            Returns: string
          }
      log_security_event: {
        Args: {
          details_param?: Json
          event_type: string
          user_id_param: string
        }
        Returns: undefined
      }
      log_subscription_event: {
        Args: {
          p_event_data: Json
          p_event_type: string
          p_subscription_id: string
          p_user_id: string
        }
        Returns: string
      }
      log_warning:
        | {
            Args: {
              details?: Json
              message: string
              metadata?: Json
              source?: string
              user_id?: string
            }
            Returns: string
          }
        | {
            Args: {
              p_details?: Json
              p_message: string
              p_source: string
              p_user_id?: string
            }
            Returns: string
          }
      logflare_fdw_handler: { Args: never; Returns: unknown }
      logflare_fdw_meta: {
        Args: never
        Returns: {
          author: string
          name: string
          version: string
          website: string
        }[]
      }
      logflare_fdw_validator: {
        Args: { catalog: unknown; options: string[] }
        Returns: undefined
      }
      longtransactionsenabled: { Args: never; Returns: boolean }
      mark_all_notifications_read: { Args: never; Returns: number }
      mark_api_keys_as_encrypted: { Args: never; Returns: undefined }
      mark_notification_read: {
        Args: { p_notification_id: string }
        Returns: boolean
      }
      mssql_fdw_handler: { Args: never; Returns: unknown }
      mssql_fdw_meta: {
        Args: never
        Returns: {
          author: string
          name: string
          version: string
          website: string
        }[]
      }
      mssql_fdw_validator: {
        Args: { catalog: unknown; options: string[] }
        Returns: undefined
      }
      normalize_email: { Args: { input_email: string }; Returns: string }
      populate_geometry_columns:
        | { Args: { tbl_oid: unknown; use_typmod?: boolean }; Returns: number }
        | { Args: { use_typmod?: boolean }; Returns: string }
      postgis_constraint_dims: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_srid: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_type: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: string
      }
      postgis_extensions_upgrade: { Args: never; Returns: string }
      postgis_full_version: { Args: never; Returns: string }
      postgis_geos_version: { Args: never; Returns: string }
      postgis_lib_build_date: { Args: never; Returns: string }
      postgis_lib_revision: { Args: never; Returns: string }
      postgis_lib_version: { Args: never; Returns: string }
      postgis_libjson_version: { Args: never; Returns: string }
      postgis_liblwgeom_version: { Args: never; Returns: string }
      postgis_libprotobuf_version: { Args: never; Returns: string }
      postgis_libxml_version: { Args: never; Returns: string }
      postgis_proj_version: { Args: never; Returns: string }
      postgis_scripts_build_date: { Args: never; Returns: string }
      postgis_scripts_installed: { Args: never; Returns: string }
      postgis_scripts_released: { Args: never; Returns: string }
      postgis_svn_version: { Args: never; Returns: string }
      postgis_type_name: {
        Args: {
          coord_dimension: number
          geomname: string
          use_new_name?: boolean
        }
        Returns: string
      }
      postgis_version: { Args: never; Returns: string }
      postgis_wagyu_version: { Args: never; Returns: string }
      process_scheduled_deletions: { Args: never; Returns: number }
      redis_fdw_handler: { Args: never; Returns: unknown }
      redis_fdw_meta: {
        Args: never
        Returns: {
          author: string
          name: string
          version: string
          website: string
        }[]
      }
      redis_fdw_validator: {
        Args: { catalog: unknown; options: string[] }
        Returns: undefined
      }
      reset_password_with_token: {
        Args: { new_password: string; reset_token: string }
        Returns: boolean
      }
      restore_deleted_user: { Args: { user_id: string }; Returns: boolean }
      s3_fdw_handler: { Args: never; Returns: unknown }
      s3_fdw_meta: {
        Args: never
        Returns: {
          author: string
          name: string
          version: string
          website: string
        }[]
      }
      s3_fdw_validator: {
        Args: { catalog: unknown; options: string[] }
        Returns: undefined
      }
      search_re_document_content: {
        Args: {
          match_count?: number
          match_threshold?: number
          property_id: string
          query_embedding: string
        }
        Returns: {
          content_chunk: string
          document_id: string
          document_name: string
          similarity: number
        }[]
      }
      set_active_workspace: {
        Args: { p_user_id: string; p_workspace_id: string }
        Returns: boolean
      }
      st_3dclosestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3ddistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_3dlongestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmakebox: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmaxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dshortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_addpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_angle:
        | { Args: { line1: unknown; line2: unknown }; Returns: number }
        | {
            Args: { pt1: unknown; pt2: unknown; pt3: unknown; pt4?: unknown }
            Returns: number
          }
      st_area:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_asencodedpolyline: {
        Args: { geom: unknown; nprecision?: number }
        Returns: string
      }
      st_asewkt: { Args: { "": string }; Returns: string }
      st_asgeojson:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: {
              geom_column?: string
              maxdecimaldigits?: number
              pretty_bool?: boolean
              r: Record<string, unknown>
            }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_asgml:
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
            }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
      st_askml:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_aslatlontext: {
        Args: { geom: unknown; tmpl?: string }
        Returns: string
      }
      st_asmarc21: { Args: { format?: string; geom: unknown }; Returns: string }
      st_asmvtgeom: {
        Args: {
          bounds: unknown
          buffer?: number
          clip_geom?: boolean
          extent?: number
          geom: unknown
        }
        Returns: unknown
      }
      st_assvg:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_astext: { Args: { "": string }; Returns: string }
      st_astwkb:
        | {
            Args: {
              geom: unknown
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown[]
              ids: number[]
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
      st_asx3d: {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_azimuth:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: number }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_boundingdiagonal: {
        Args: { fits?: boolean; geom: unknown }
        Returns: unknown
      }
      st_buffer:
        | {
            Args: { geom: unknown; options?: string; radius: number }
            Returns: unknown
          }
        | {
            Args: { geom: unknown; quadsegs: number; radius: number }
            Returns: unknown
          }
      st_centroid: { Args: { "": string }; Returns: unknown }
      st_clipbybox2d: {
        Args: { box: unknown; geom: unknown }
        Returns: unknown
      }
      st_closestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_collect: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_concavehull: {
        Args: {
          param_allow_holes?: boolean
          param_geom: unknown
          param_pctconvex: number
        }
        Returns: unknown
      }
      st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_coorddim: { Args: { geometry: unknown }; Returns: number }
      st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_crosses: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_curvetoline: {
        Args: { flags?: number; geom: unknown; tol?: number; toltype?: number }
        Returns: unknown
      }
      st_delaunaytriangles: {
        Args: { flags?: number; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_difference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_disjoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_distance:
        | {
            Args: { geog1: unknown; geog2: unknown; use_spheroid?: boolean }
            Returns: number
          }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_distancesphere:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
        | {
            Args: { geom1: unknown; geom2: unknown; radius: number }
            Returns: number
          }
      st_distancespheroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_expand:
        | { Args: { box: unknown; dx: number; dy: number }; Returns: unknown }
        | {
            Args: { box: unknown; dx: number; dy: number; dz?: number }
            Returns: unknown
          }
        | {
            Args: {
              dm?: number
              dx: number
              dy: number
              dz?: number
              geom: unknown
            }
            Returns: unknown
          }
      st_force3d: { Args: { geom: unknown; zvalue?: number }; Returns: unknown }
      st_force3dm: {
        Args: { geom: unknown; mvalue?: number }
        Returns: unknown
      }
      st_force3dz: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force4d: {
        Args: { geom: unknown; mvalue?: number; zvalue?: number }
        Returns: unknown
      }
      st_generatepoints:
        | { Args: { area: unknown; npoints: number }; Returns: unknown }
        | {
            Args: { area: unknown; npoints: number; seed: number }
            Returns: unknown
          }
      st_geogfromtext: { Args: { "": string }; Returns: unknown }
      st_geographyfromtext: { Args: { "": string }; Returns: unknown }
      st_geohash:
        | { Args: { geog: unknown; maxchars?: number }; Returns: string }
        | { Args: { geom: unknown; maxchars?: number }; Returns: string }
      st_geomcollfromtext: { Args: { "": string }; Returns: unknown }
      st_geometricmedian: {
        Args: {
          fail_if_not_converged?: boolean
          g: unknown
          max_iter?: number
          tolerance?: number
        }
        Returns: unknown
      }
      st_geometryfromtext: { Args: { "": string }; Returns: unknown }
      st_geomfromewkt: { Args: { "": string }; Returns: unknown }
      st_geomfromgeojson:
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": string }; Returns: unknown }
      st_geomfromgml: { Args: { "": string }; Returns: unknown }
      st_geomfromkml: { Args: { "": string }; Returns: unknown }
      st_geomfrommarc21: { Args: { marc21xml: string }; Returns: unknown }
      st_geomfromtext: { Args: { "": string }; Returns: unknown }
      st_gmltosql: { Args: { "": string }; Returns: unknown }
      st_hasarc: { Args: { geometry: unknown }; Returns: boolean }
      st_hausdorffdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_hexagon: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_hexagongrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_interpolatepoint: {
        Args: { line: unknown; point: unknown }
        Returns: number
      }
      st_intersection: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_intersects:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_isvaliddetail: {
        Args: { flags?: number; geom: unknown }
        Returns: Database["public"]["CompositeTypes"]["valid_detail"]
        SetofOptions: {
          from: "*"
          to: "valid_detail"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      st_length:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_letters: { Args: { font?: Json; letters: string }; Returns: unknown }
      st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      st_linefromencodedpolyline: {
        Args: { nprecision?: number; txtin: string }
        Returns: unknown
      }
      st_linefromtext: { Args: { "": string }; Returns: unknown }
      st_linelocatepoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_linetocurve: { Args: { geometry: unknown }; Returns: unknown }
      st_locatealong: {
        Args: { geometry: unknown; leftrightoffset?: number; measure: number }
        Returns: unknown
      }
      st_locatebetween: {
        Args: {
          frommeasure: number
          geometry: unknown
          leftrightoffset?: number
          tomeasure: number
        }
        Returns: unknown
      }
      st_locatebetweenelevations: {
        Args: { fromelevation: number; geometry: unknown; toelevation: number }
        Returns: unknown
      }
      st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makebox2d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makeline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makevalid: {
        Args: { geom: unknown; params: string }
        Returns: unknown
      }
      st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_minimumboundingcircle: {
        Args: { inputgeom: unknown; segs_per_quarter?: number }
        Returns: unknown
      }
      st_mlinefromtext: { Args: { "": string }; Returns: unknown }
      st_mpointfromtext: { Args: { "": string }; Returns: unknown }
      st_mpolyfromtext: { Args: { "": string }; Returns: unknown }
      st_multilinestringfromtext: { Args: { "": string }; Returns: unknown }
      st_multipointfromtext: { Args: { "": string }; Returns: unknown }
      st_multipolygonfromtext: { Args: { "": string }; Returns: unknown }
      st_node: { Args: { g: unknown }; Returns: unknown }
      st_normalize: { Args: { geom: unknown }; Returns: unknown }
      st_offsetcurve: {
        Args: { distance: number; line: unknown; params?: string }
        Returns: unknown
      }
      st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_perimeter: {
        Args: { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_pointfromtext: { Args: { "": string }; Returns: unknown }
      st_pointm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
        }
        Returns: unknown
      }
      st_pointz: {
        Args: {
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_pointzm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_polyfromtext: { Args: { "": string }; Returns: unknown }
      st_polygonfromtext: { Args: { "": string }; Returns: unknown }
      st_project: {
        Args: { azimuth: number; distance: number; geog: unknown }
        Returns: unknown
      }
      st_quantizecoordinates: {
        Args: {
          g: unknown
          prec_m?: number
          prec_x: number
          prec_y?: number
          prec_z?: number
        }
        Returns: unknown
      }
      st_reduceprecision: {
        Args: { geom: unknown; gridsize: number }
        Returns: unknown
      }
      st_relate: { Args: { geom1: unknown; geom2: unknown }; Returns: string }
      st_removerepeatedpoints: {
        Args: { geom: unknown; tolerance?: number }
        Returns: unknown
      }
      st_segmentize: {
        Args: { geog: unknown; max_segment_length: number }
        Returns: unknown
      }
      st_setsrid:
        | { Args: { geog: unknown; srid: number }; Returns: unknown }
        | { Args: { geom: unknown; srid: number }; Returns: unknown }
      st_sharedpaths: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_shortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_simplifypolygonhull: {
        Args: { geom: unknown; is_outer?: boolean; vertex_fraction: number }
        Returns: unknown
      }
      st_split: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_square: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_squaregrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_srid:
        | { Args: { geog: unknown }; Returns: number }
        | { Args: { geom: unknown }; Returns: number }
      st_subdivide: {
        Args: { geom: unknown; gridsize?: number; maxvertices?: number }
        Returns: unknown[]
      }
      st_swapordinates: {
        Args: { geom: unknown; ords: unknown }
        Returns: unknown
      }
      st_symdifference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_symmetricdifference: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_tileenvelope: {
        Args: {
          bounds?: unknown
          margin?: number
          x: number
          y: number
          zoom: number
        }
        Returns: unknown
      }
      st_touches: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_transform:
        | {
            Args: { from_proj: string; geom: unknown; to_proj: string }
            Returns: unknown
          }
        | {
            Args: { from_proj: string; geom: unknown; to_srid: number }
            Returns: unknown
          }
        | { Args: { geom: unknown; to_proj: string }; Returns: unknown }
      st_triangulatepolygon: { Args: { g1: unknown }; Returns: unknown }
      st_union:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
        | {
            Args: { geom1: unknown; geom2: unknown; gridsize: number }
            Returns: unknown
          }
      st_voronoilines: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_voronoipolygons: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_wkbtosql: { Args: { wkb: string }; Returns: unknown }
      st_wkttosql: { Args: { "": string }; Returns: unknown }
      st_wrapx: {
        Args: { geom: unknown; move: number; wrap: number }
        Returns: unknown
      }
      stripe_fdw_handler: { Args: never; Returns: unknown }
      stripe_fdw_meta: {
        Args: never
        Returns: {
          author: string
          name: string
          version: string
          website: string
        }[]
      }
      stripe_fdw_validator: {
        Args: { catalog: unknown; options: string[] }
        Returns: undefined
      }
      system_log: {
        Args: {
          p_context?: Json
          p_details?: Json
          p_error_code?: string
          p_level: string
          p_message: string
          p_source: string
          p_user_id?: string
        }
        Returns: string
      }
      test_email_logs_admin_access: {
        Args: never
        Returns: {
          access_granted: boolean
          admin_check: boolean
          admin_role: string
          email_logs_count: number
        }[]
      }
      test_log_cleanup: {
        Args: { cutoff_date: string; log_level: string }
        Returns: {
          count: number
        }[]
      }
      test_resend_email_access: {
        Args: never
        Returns: {
          access_granted: boolean
          error_message: string
          row_count: number
          table_name: string
        }[]
      }
      toggle_email_preference: {
        Args: { p_preference: string; p_user_id: string; p_value: boolean }
        Returns: boolean
      }
      unlockrows: { Args: { "": string }; Returns: number }
      update_lead_field: {
        Args: { field_name: string; field_value: string; lead_id: string }
        Returns: Json
      }
      update_property_geo_point: {
        Args: { p_latitude: number; p_longitude: number; p_property_id: string }
        Returns: Json
      }
      update_system_logs_setting:
        | {
            Args: { p_setting_name: string; p_setting_value: string }
            Returns: boolean
          }
        | {
            Args: { setting_name: string; setting_value: number }
            Returns: boolean
          }
      updategeometrysrid: {
        Args: {
          catalogn_name: string
          column_name: string
          new_srid_in: number
          schema_name: string
          table_name: string
        }
        Returns: string
      }
      verify_security_fixes: {
        Args: never
        Returns: {
          function_name: string
          function_type: string
          has_search_path: boolean
          language_name: string
          schema_name: string
        }[]
      }
      verify_workspace_recursion_fix: { Args: never; Returns: string }
      wasm_fdw_handler: { Args: never; Returns: unknown }
      wasm_fdw_meta: {
        Args: never
        Returns: {
          author: string
          name: string
          version: string
          website: string
        }[]
      }
      wasm_fdw_validator: {
        Args: { catalog: unknown; options: string[] }
        Returns: undefined
      }
      workspace_member_auth: { Args: never; Returns: boolean }
    }
    Enums: {
      channel_type_extended: "sms" | "email" | "call"
      lead_status:
        | "active"
        | "inactive"
        | "do_not_contact"
        | "new"
        | "follow-up"
      message_channel: "email" | "sms"
      message_direction: "outbound" | "inbound"
      message_status: "sent" | "delivered" | "read" | "error"
      plan_tier: "free" | "pro" | "enterprise"
      plantier: "free" | "starter" | "personal" | "professional" | "enterprise"
      sms_opt_status: "opted_in" | "opted_out" | "pending" | "new"
      user_role: "admin" | "standard" | "user" | "support" | "beta"
    }
    CompositeTypes: {
      geometry_dump: {
        path: number[] | null
        geom: unknown
      }
      valid_detail: {
        valid: boolean | null
        reason: string | null
        location: unknown
      }
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      channel_type_extended: ["sms", "email", "call"],
      lead_status: ["active", "inactive", "do_not_contact", "new", "follow-up"],
      message_channel: ["email", "sms"],
      message_direction: ["outbound", "inbound"],
      message_status: ["sent", "delivered", "read", "error"],
      plan_tier: ["free", "pro", "enterprise"],
      plantier: ["free", "starter", "personal", "professional", "enterprise"],
      sms_opt_status: ["opted_in", "opted_out", "pending", "new"],
      user_role: ["admin", "standard", "user", "support", "beta"],
    },
  },
} as const

