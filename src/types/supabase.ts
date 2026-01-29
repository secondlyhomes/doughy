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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      ai_confidence_adjustments: {
        Row: {
          approval_rate: number | null
          confidence_adjustment: number
          contact_type: string | null
          created_at: string | null
          edit_rate: number | null
          id: string
          last_calculated_at: string | null
          message_type: string | null
          rejection_rate: number | null
          sample_size: number
          topic: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          approval_rate?: number | null
          confidence_adjustment?: number
          contact_type?: string | null
          created_at?: string | null
          edit_rate?: number | null
          id?: string
          last_calculated_at?: string | null
          message_type?: string | null
          rejection_rate?: number | null
          sample_size?: number
          topic?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          approval_rate?: number | null
          confidence_adjustment?: number
          contact_type?: string | null
          created_at?: string | null
          edit_rate?: number | null
          id?: string
          last_calculated_at?: string | null
          message_type?: string | null
          rejection_rate?: number | null
          sample_size?: number
          topic?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_response_outcomes: {
        Row: {
          actions_suggested: string[] | null
          channel: string | null
          contact_id: string | null
          contact_type: string
          conversation_id: string | null
          created_at: string | null
          edit_severity: Database["public"]["Enums"]["ai_edit_severity"] | null
          final_response: string | null
          id: string
          initial_confidence: number
          message_id: string | null
          message_type: string
          outcome: Database["public"]["Enums"]["ai_outcome"]
          platform: string | null
          property_id: string | null
          response_time_seconds: number | null
          reviewed_at: string | null
          sensitive_topics_detected: string[] | null
          suggested_response: string
          topic: string
          user_id: string
        }
        Insert: {
          actions_suggested?: string[] | null
          channel?: string | null
          contact_id?: string | null
          contact_type: string
          conversation_id?: string | null
          created_at?: string | null
          edit_severity?: Database["public"]["Enums"]["ai_edit_severity"] | null
          final_response?: string | null
          id?: string
          initial_confidence: number
          message_id?: string | null
          message_type: string
          outcome: Database["public"]["Enums"]["ai_outcome"]
          platform?: string | null
          property_id?: string | null
          response_time_seconds?: number | null
          reviewed_at?: string | null
          sensitive_topics_detected?: string[] | null
          suggested_response: string
          topic: string
          user_id: string
        }
        Update: {
          actions_suggested?: string[] | null
          channel?: string | null
          contact_id?: string | null
          contact_type?: string
          conversation_id?: string | null
          created_at?: string | null
          edit_severity?: Database["public"]["Enums"]["ai_edit_severity"] | null
          final_response?: string | null
          id?: string
          initial_confidence?: number
          message_id?: string | null
          message_type?: string
          outcome?: Database["public"]["Enums"]["ai_outcome"]
          platform?: string | null
          property_id?: string | null
          response_time_seconds?: number | null
          reviewed_at?: string | null
          sensitive_topics_detected?: string[] | null
          suggested_response?: string
          topic?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_response_outcomes_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_response_outcomes_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "rental_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_response_outcomes_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "rental_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_response_outcomes_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "rental_properties"
            referencedColumns: ["id"]
          },
        ]
      }
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
      contact_opt_outs: {
        Row: {
          channel: Database["public"]["Enums"]["drip_channel"]
          contact_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          opt_in_reason: string | null
          opt_out_message: string | null
          opt_out_reason: string | null
          opted_in_at: string | null
          opted_out_at: string | null
          source_campaign_id: string | null
          source_touch_id: string | null
          user_id: string
        }
        Insert: {
          channel: Database["public"]["Enums"]["drip_channel"]
          contact_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          opt_in_reason?: string | null
          opt_out_message?: string | null
          opt_out_reason?: string | null
          opted_in_at?: string | null
          opted_out_at?: string | null
          source_campaign_id?: string | null
          source_touch_id?: string | null
          user_id: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["drip_channel"]
          contact_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          opt_in_reason?: string | null
          opt_out_message?: string | null
          opt_out_reason?: string | null
          opted_in_at?: string | null
          opted_out_at?: string | null
          source_campaign_id?: string | null
          source_touch_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_opt_outs_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_opt_outs_source_campaign_id_fkey"
            columns: ["source_campaign_id"]
            isOneToOne: false
            referencedRelation: "investor_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_opt_outs_source_touch_id_fkey"
            columns: ["source_touch_id"]
            isOneToOne: false
            referencedRelation: "drip_touch_log"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_touches: {
        Row: {
          callback_scheduled_at: string | null
          created_at: string
          deal_id: string | null
          id: string
          lead_id: string | null
          metadata: Json | null
          notes: string | null
          outcome: string
          property_id: string | null
          responded: boolean
          touch_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          callback_scheduled_at?: string | null
          created_at?: string
          deal_id?: string | null
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          notes?: string | null
          outcome: string
          property_id?: string | null
          responded?: boolean
          touch_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          callback_scheduled_at?: string | null
          created_at?: string
          deal_id?: string | null
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          notes?: string | null
          outcome?: string
          property_id?: string | null
          responded?: boolean
          touch_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_touches_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_touches_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_touches_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "re_properties"
            referencedColumns: ["id"]
          },
        ]
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
          active_campaign_id: string | null
          address: Json | null
          best_contact_time: string | null
          campaign_status: string | null
          campaign_touches_received: number | null
          city: string | null
          company: string | null
          contact_types:
            | Database["public"]["Enums"]["crm_contact_type"][]
            | null
          created_at: string
          do_not_contact: boolean | null
          email: string | null
          emails: Json | null
          first_name: string | null
          id: string
          is_deleted: boolean | null
          job_title: string | null
          last_campaign_touch_at: string | null
          last_name: string | null
          metadata: Json | null
          phone: string | null
          phones: Json | null
          preferred_channel: Database["public"]["Enums"]["drip_channel"] | null
          score: number | null
          sms_opt_status: Database["public"]["Enums"]["sms_opt_status"] | null
          source: Database["public"]["Enums"]["crm_contact_source"] | null
          state: string | null
          status: Database["public"]["Enums"]["crm_contact_status"] | null
          tags: string[] | null
          updated_at: string
          user_id: string | null
          zip: string | null
        }
        Insert: {
          active_campaign_id?: string | null
          address?: Json | null
          best_contact_time?: string | null
          campaign_status?: string | null
          campaign_touches_received?: number | null
          city?: string | null
          company?: string | null
          contact_types?:
            | Database["public"]["Enums"]["crm_contact_type"][]
            | null
          created_at?: string
          do_not_contact?: boolean | null
          email?: string | null
          emails?: Json | null
          first_name?: string | null
          id?: string
          is_deleted?: boolean | null
          job_title?: string | null
          last_campaign_touch_at?: string | null
          last_name?: string | null
          metadata?: Json | null
          phone?: string | null
          phones?: Json | null
          preferred_channel?: Database["public"]["Enums"]["drip_channel"] | null
          score?: number | null
          sms_opt_status?: Database["public"]["Enums"]["sms_opt_status"] | null
          source?: Database["public"]["Enums"]["crm_contact_source"] | null
          state?: string | null
          status?: Database["public"]["Enums"]["crm_contact_status"] | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string | null
          zip?: string | null
        }
        Update: {
          active_campaign_id?: string | null
          address?: Json | null
          best_contact_time?: string | null
          campaign_status?: string | null
          campaign_touches_received?: number | null
          city?: string | null
          company?: string | null
          contact_types?:
            | Database["public"]["Enums"]["crm_contact_type"][]
            | null
          created_at?: string
          do_not_contact?: boolean | null
          email?: string | null
          emails?: Json | null
          first_name?: string | null
          id?: string
          is_deleted?: boolean | null
          job_title?: string | null
          last_campaign_touch_at?: string | null
          last_name?: string | null
          metadata?: Json | null
          phone?: string | null
          phones?: Json | null
          preferred_channel?: Database["public"]["Enums"]["drip_channel"] | null
          score?: number | null
          sms_opt_status?: Database["public"]["Enums"]["sms_opt_status"] | null
          source?: Database["public"]["Enums"]["crm_contact_source"] | null
          state?: string | null
          status?: Database["public"]["Enums"]["crm_contact_status"] | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string | null
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_contacts_active_campaign_id_fkey"
            columns: ["active_campaign_id"]
            isOneToOne: false
            referencedRelation: "investor_campaigns"
            referencedColumns: ["id"]
          },
        ]
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
      drip_campaign_steps: {
        Row: {
          ai_tone: string | null
          call_script: string | null
          campaign_id: string
          channel: Database["public"]["Enums"]["drip_channel"]
          created_at: string | null
          delay_days: number
          delay_from_enrollment: boolean | null
          id: string
          is_active: boolean | null
          mail_piece_type: Database["public"]["Enums"]["mail_piece_type"] | null
          mail_template_id: string | null
          message_body: string | null
          return_address: Json | null
          skip_if_converted: boolean | null
          skip_if_responded: boolean | null
          step_number: number
          subject: string | null
          talking_points: string[] | null
          template_id: string | null
          updated_at: string | null
          use_ai_generation: boolean | null
        }
        Insert: {
          ai_tone?: string | null
          call_script?: string | null
          campaign_id: string
          channel: Database["public"]["Enums"]["drip_channel"]
          created_at?: string | null
          delay_days?: number
          delay_from_enrollment?: boolean | null
          id?: string
          is_active?: boolean | null
          mail_piece_type?:
            | Database["public"]["Enums"]["mail_piece_type"]
            | null
          mail_template_id?: string | null
          message_body?: string | null
          return_address?: Json | null
          skip_if_converted?: boolean | null
          skip_if_responded?: boolean | null
          step_number: number
          subject?: string | null
          talking_points?: string[] | null
          template_id?: string | null
          updated_at?: string | null
          use_ai_generation?: boolean | null
        }
        Update: {
          ai_tone?: string | null
          call_script?: string | null
          campaign_id?: string
          channel?: Database["public"]["Enums"]["drip_channel"]
          created_at?: string | null
          delay_days?: number
          delay_from_enrollment?: boolean | null
          id?: string
          is_active?: boolean | null
          mail_piece_type?:
            | Database["public"]["Enums"]["mail_piece_type"]
            | null
          mail_template_id?: string | null
          message_body?: string | null
          return_address?: Json | null
          skip_if_converted?: boolean | null
          skip_if_responded?: boolean | null
          step_number?: number
          subject?: string | null
          talking_points?: string[] | null
          template_id?: string | null
          updated_at?: string | null
          use_ai_generation?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "drip_campaign_steps_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "investor_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drip_campaign_steps_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "investor_outreach_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      drip_enrollments: {
        Row: {
          campaign_id: string
          completed_at: string | null
          contact_id: string
          converted_at: string | null
          converted_deal_id: string | null
          created_at: string | null
          current_step: number | null
          deal_id: string | null
          enrolled_at: string | null
          enrollment_context: Json | null
          id: string
          last_touch_at: string | null
          last_touch_channel: Database["public"]["Enums"]["drip_channel"] | null
          next_touch_at: string | null
          paused_at: string | null
          paused_reason: string | null
          responded_at: string | null
          response_channel: Database["public"]["Enums"]["drip_channel"] | null
          response_message: string | null
          resumed_at: string | null
          status: Database["public"]["Enums"]["drip_enrollment_status"] | null
          touches_delivered: number | null
          touches_failed: number | null
          touches_sent: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          campaign_id: string
          completed_at?: string | null
          contact_id: string
          converted_at?: string | null
          converted_deal_id?: string | null
          created_at?: string | null
          current_step?: number | null
          deal_id?: string | null
          enrolled_at?: string | null
          enrollment_context?: Json | null
          id?: string
          last_touch_at?: string | null
          last_touch_channel?:
            | Database["public"]["Enums"]["drip_channel"]
            | null
          next_touch_at?: string | null
          paused_at?: string | null
          paused_reason?: string | null
          responded_at?: string | null
          response_channel?: Database["public"]["Enums"]["drip_channel"] | null
          response_message?: string | null
          resumed_at?: string | null
          status?: Database["public"]["Enums"]["drip_enrollment_status"] | null
          touches_delivered?: number | null
          touches_failed?: number | null
          touches_sent?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          campaign_id?: string
          completed_at?: string | null
          contact_id?: string
          converted_at?: string | null
          converted_deal_id?: string | null
          created_at?: string | null
          current_step?: number | null
          deal_id?: string | null
          enrolled_at?: string | null
          enrollment_context?: Json | null
          id?: string
          last_touch_at?: string | null
          last_touch_channel?:
            | Database["public"]["Enums"]["drip_channel"]
            | null
          next_touch_at?: string | null
          paused_at?: string | null
          paused_reason?: string | null
          responded_at?: string | null
          response_channel?: Database["public"]["Enums"]["drip_channel"] | null
          response_message?: string | null
          resumed_at?: string | null
          status?: Database["public"]["Enums"]["drip_enrollment_status"] | null
          touches_delivered?: number | null
          touches_failed?: number | null
          touches_sent?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "drip_enrollments_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "investor_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drip_enrollments_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drip_enrollments_converted_deal_id_fkey"
            columns: ["converted_deal_id"]
            isOneToOne: false
            referencedRelation: "investor_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drip_enrollments_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "investor_deals"
            referencedColumns: ["id"]
          },
        ]
      }
      drip_touch_log: {
        Row: {
          channel: Database["public"]["Enums"]["drip_channel"]
          created_at: string | null
          delivered_at: string | null
          enrollment_id: string
          error_message: string | null
          external_message_id: string | null
          external_tracking_url: string | null
          failed_at: string | null
          id: string
          last_retry_at: string | null
          mail_cost: number | null
          mail_piece_type: Database["public"]["Enums"]["mail_piece_type"] | null
          mail_tracking_number: string | null
          message_body: string | null
          metadata: Json | null
          recipient_address: Json | null
          recipient_email: string | null
          recipient_phone: string | null
          response_at: string | null
          response_body: string | null
          response_received: boolean | null
          retry_count: number | null
          scheduled_at: string
          sent_at: string | null
          status: Database["public"]["Enums"]["drip_touch_status"] | null
          step_id: string
          subject: string | null
          user_id: string
        }
        Insert: {
          channel: Database["public"]["Enums"]["drip_channel"]
          created_at?: string | null
          delivered_at?: string | null
          enrollment_id: string
          error_message?: string | null
          external_message_id?: string | null
          external_tracking_url?: string | null
          failed_at?: string | null
          id?: string
          last_retry_at?: string | null
          mail_cost?: number | null
          mail_piece_type?:
            | Database["public"]["Enums"]["mail_piece_type"]
            | null
          mail_tracking_number?: string | null
          message_body?: string | null
          metadata?: Json | null
          recipient_address?: Json | null
          recipient_email?: string | null
          recipient_phone?: string | null
          response_at?: string | null
          response_body?: string | null
          response_received?: boolean | null
          retry_count?: number | null
          scheduled_at: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["drip_touch_status"] | null
          step_id: string
          subject?: string | null
          user_id: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["drip_channel"]
          created_at?: string | null
          delivered_at?: string | null
          enrollment_id?: string
          error_message?: string | null
          external_message_id?: string | null
          external_tracking_url?: string | null
          failed_at?: string | null
          id?: string
          last_retry_at?: string | null
          mail_cost?: number | null
          mail_piece_type?:
            | Database["public"]["Enums"]["mail_piece_type"]
            | null
          mail_tracking_number?: string | null
          message_body?: string | null
          metadata?: Json | null
          recipient_address?: Json | null
          recipient_email?: string | null
          recipient_phone?: string | null
          response_at?: string | null
          response_body?: string | null
          response_received?: boolean | null
          retry_count?: number | null
          scheduled_at?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["drip_touch_status"] | null
          step_id?: string
          subject?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "drip_touch_log_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "drip_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drip_touch_log_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "drip_campaign_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      investor_agents: {
        Row: {
          brokerage: string | null
          commission_preference: string | null
          contact_id: string | null
          created_at: string | null
          deal_types_interested: string[] | null
          deals_sourced: number | null
          email: string | null
          id: string
          last_contact_at: string | null
          last_deal_date: string | null
          license_number: string | null
          metadata: Json | null
          name: string
          next_follow_up_at: string | null
          notes: string | null
          phone: string | null
          preferred_contact_method: string | null
          relationship_status: string | null
          specializations: string[] | null
          target_markets: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          brokerage?: string | null
          commission_preference?: string | null
          contact_id?: string | null
          created_at?: string | null
          deal_types_interested?: string[] | null
          deals_sourced?: number | null
          email?: string | null
          id?: string
          last_contact_at?: string | null
          last_deal_date?: string | null
          license_number?: string | null
          metadata?: Json | null
          name: string
          next_follow_up_at?: string | null
          notes?: string | null
          phone?: string | null
          preferred_contact_method?: string | null
          relationship_status?: string | null
          specializations?: string[] | null
          target_markets?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          brokerage?: string | null
          commission_preference?: string | null
          contact_id?: string | null
          created_at?: string | null
          deal_types_interested?: string[] | null
          deals_sourced?: number | null
          email?: string | null
          id?: string
          last_contact_at?: string | null
          last_deal_date?: string | null
          license_number?: string | null
          metadata?: Json | null
          name?: string
          next_follow_up_at?: string | null
          notes?: string | null
          phone?: string | null
          preferred_contact_method?: string | null
          relationship_status?: string | null
          specializations?: string[] | null
          target_markets?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "investor_agents_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      investor_ai_confidence: {
        Row: {
          auto_send_enabled: boolean | null
          confidence_score: number | null
          created_at: string | null
          id: string
          lead_situation: string
          total_approvals: number | null
          total_edits: number | null
          total_rejections: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_send_enabled?: boolean | null
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          lead_situation: string
          total_approvals?: number | null
          total_edits?: number | null
          total_rejections?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_send_enabled?: boolean | null
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          lead_situation?: string
          total_approvals?: number | null
          total_edits?: number | null
          total_rejections?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      investor_ai_patterns: {
        Row: {
          confidence_impact: number | null
          created_at: string | null
          id: string
          lead_situation: string
          pattern_type: string
          pattern_value: string
          times_reinforced: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          confidence_impact?: number | null
          created_at?: string | null
          id?: string
          lead_situation: string
          pattern_type: string
          pattern_value: string
          times_reinforced?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          confidence_impact?: number | null
          created_at?: string | null
          id?: string
          lead_situation?: string
          pattern_type?: string
          pattern_value?: string
          times_reinforced?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      investor_ai_queue: {
        Row: {
          confidence: number
          conversation_id: string
          created_at: string | null
          detected_topics: string[] | null
          expires_at: string
          final_response: string | null
          id: string
          intent: string | null
          reasoning: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["ai_queue_status"]
          suggested_response: string
          trigger_message_id: string | null
          user_id: string
        }
        Insert: {
          confidence: number
          conversation_id: string
          created_at?: string | null
          detected_topics?: string[] | null
          expires_at?: string
          final_response?: string | null
          id?: string
          intent?: string | null
          reasoning?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["ai_queue_status"]
          suggested_response: string
          trigger_message_id?: string | null
          user_id: string
        }
        Update: {
          confidence?: number
          conversation_id?: string
          created_at?: string | null
          detected_topics?: string[] | null
          expires_at?: string
          final_response?: string | null
          id?: string
          intent?: string | null
          reasoning?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["ai_queue_status"]
          suggested_response?: string
          trigger_message_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "investor_ai_queue_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "investor_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investor_ai_queue_trigger_message_id_fkey"
            columns: ["trigger_message_id"]
            isOneToOne: false
            referencedRelation: "investor_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      investor_ai_response_outcomes: {
        Row: {
          channel: Database["public"]["Enums"]["investor_channel"] | null
          conversation_id: string
          created_at: string | null
          edit_severity: string | null
          feedback_notes: string | null
          final_response: string | null
          id: string
          lead_situation: string | null
          message_id: string | null
          original_confidence: number | null
          original_response: string | null
          outcome: string
          queue_item_id: string | null
          response_time_seconds: number | null
          user_id: string
        }
        Insert: {
          channel?: Database["public"]["Enums"]["investor_channel"] | null
          conversation_id: string
          created_at?: string | null
          edit_severity?: string | null
          feedback_notes?: string | null
          final_response?: string | null
          id?: string
          lead_situation?: string | null
          message_id?: string | null
          original_confidence?: number | null
          original_response?: string | null
          outcome: string
          queue_item_id?: string | null
          response_time_seconds?: number | null
          user_id: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["investor_channel"] | null
          conversation_id?: string
          created_at?: string | null
          edit_severity?: string | null
          feedback_notes?: string | null
          final_response?: string | null
          id?: string
          lead_situation?: string | null
          message_id?: string | null
          original_confidence?: number | null
          original_response?: string | null
          outcome?: string
          queue_item_id?: string | null
          response_time_seconds?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "investor_ai_response_outcomes_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "investor_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investor_ai_response_outcomes_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "investor_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investor_ai_response_outcomes_queue_item_id_fkey"
            columns: ["queue_item_id"]
            isOneToOne: false
            referencedRelation: "investor_ai_queue"
            referencedColumns: ["id"]
          },
        ]
      }
      investor_campaigns: {
        Row: {
          auto_convert_on_response: boolean | null
          auto_pause_on_response: boolean | null
          budget: number | null
          campaign_type: string
          converted_count: number | null
          cost_per_lead: number | null
          created_at: string | null
          deals_closed: number | null
          end_date: string | null
          enrolled_count: number | null
          follow_up_sequence: number[] | null
          id: string
          is_drip_campaign: boolean | null
          lead_type: Database["public"]["Enums"]["drip_lead_type"] | null
          leads_generated: number | null
          list_count: number | null
          list_source: string | null
          max_touches: number | null
          metadata: Json | null
          name: string
          notes: string | null
          opted_out_count: number | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          quiet_hours_timezone: string | null
          respect_weekends: boolean | null
          responded_count: number | null
          revenue: number | null
          roi_percent: number | null
          spent: number | null
          start_date: string | null
          status: string | null
          target_criteria: Json | null
          target_markets: string[] | null
          target_motivation:
            | Database["public"]["Enums"]["seller_motivation"]
            | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_convert_on_response?: boolean | null
          auto_pause_on_response?: boolean | null
          budget?: number | null
          campaign_type: string
          converted_count?: number | null
          cost_per_lead?: number | null
          created_at?: string | null
          deals_closed?: number | null
          end_date?: string | null
          enrolled_count?: number | null
          follow_up_sequence?: number[] | null
          id?: string
          is_drip_campaign?: boolean | null
          lead_type?: Database["public"]["Enums"]["drip_lead_type"] | null
          leads_generated?: number | null
          list_count?: number | null
          list_source?: string | null
          max_touches?: number | null
          metadata?: Json | null
          name: string
          notes?: string | null
          opted_out_count?: number | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          quiet_hours_timezone?: string | null
          respect_weekends?: boolean | null
          responded_count?: number | null
          revenue?: number | null
          roi_percent?: number | null
          spent?: number | null
          start_date?: string | null
          status?: string | null
          target_criteria?: Json | null
          target_markets?: string[] | null
          target_motivation?:
            | Database["public"]["Enums"]["seller_motivation"]
            | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_convert_on_response?: boolean | null
          auto_pause_on_response?: boolean | null
          budget?: number | null
          campaign_type?: string
          converted_count?: number | null
          cost_per_lead?: number | null
          created_at?: string | null
          deals_closed?: number | null
          end_date?: string | null
          enrolled_count?: number | null
          follow_up_sequence?: number[] | null
          id?: string
          is_drip_campaign?: boolean | null
          lead_type?: Database["public"]["Enums"]["drip_lead_type"] | null
          leads_generated?: number | null
          list_count?: number | null
          list_source?: string | null
          max_touches?: number | null
          metadata?: Json | null
          name?: string
          notes?: string | null
          opted_out_count?: number | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          quiet_hours_timezone?: string | null
          respect_weekends?: boolean | null
          responded_count?: number | null
          revenue?: number | null
          roi_percent?: number | null
          spent?: number | null
          start_date?: string | null
          status?: string | null
          target_criteria?: Json | null
          target_markets?: string[] | null
          target_motivation?:
            | Database["public"]["Enums"]["seller_motivation"]
            | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      investor_conversations: {
        Row: {
          ai_auto_respond: boolean | null
          ai_confidence_threshold: number | null
          ai_enabled: boolean | null
          channel: Database["public"]["Enums"]["investor_channel"]
          created_at: string | null
          deal_id: string | null
          external_thread_id: string | null
          id: string
          last_message_at: string | null
          last_message_preview: string | null
          lead_id: string
          property_id: string | null
          status: Database["public"]["Enums"]["investor_conversation_status"]
          unread_count: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_auto_respond?: boolean | null
          ai_confidence_threshold?: number | null
          ai_enabled?: boolean | null
          channel: Database["public"]["Enums"]["investor_channel"]
          created_at?: string | null
          deal_id?: string | null
          external_thread_id?: string | null
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          lead_id: string
          property_id?: string | null
          status?: Database["public"]["Enums"]["investor_conversation_status"]
          unread_count?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_auto_respond?: boolean | null
          ai_confidence_threshold?: number | null
          ai_enabled?: boolean | null
          channel?: Database["public"]["Enums"]["investor_channel"]
          created_at?: string | null
          deal_id?: string | null
          external_thread_id?: string | null
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          lead_id?: string
          property_id?: string | null
          status?: Database["public"]["Enums"]["investor_conversation_status"]
          unread_count?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "investor_conversations_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investor_conversations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investor_conversations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "re_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      investor_deals: {
        Row: {
          acquisition_cost: number | null
          ai_follow_up_scheduled_at: string | null
          ai_last_message_at: string | null
          ai_response_count: number | null
          arv: number | null
          asking_price: number | null
          close_date: string | null
          contingencies: string[] | null
          contract_date: string | null
          created_at: string | null
          deal_type: Database["public"]["Enums"]["investor_deal_type"] | null
          earnest_money: number | null
          id: string
          metadata: Json | null
          motivation: Database["public"]["Enums"]["seller_motivation"] | null
          motivation_score: number | null
          notes: string | null
          objections: string[] | null
          offer_price: number | null
          pain_points: string[] | null
          profit_estimate: number | null
          property_address: string
          property_city: string | null
          property_county: string | null
          property_state: string | null
          property_type: string | null
          property_zip: string | null
          repair_estimate: number | null
          seller_contact_id: string | null
          seller_email: string | null
          seller_name: string | null
          seller_phone: string | null
          source: Database["public"]["Enums"]["investor_lead_source"] | null
          source_campaign_id: string | null
          stage: Database["public"]["Enums"]["investor_deal_stage"] | null
          updated_at: string | null
          user_id: string
          wholesale_fee: number | null
        }
        Insert: {
          acquisition_cost?: number | null
          ai_follow_up_scheduled_at?: string | null
          ai_last_message_at?: string | null
          ai_response_count?: number | null
          arv?: number | null
          asking_price?: number | null
          close_date?: string | null
          contingencies?: string[] | null
          contract_date?: string | null
          created_at?: string | null
          deal_type?: Database["public"]["Enums"]["investor_deal_type"] | null
          earnest_money?: number | null
          id?: string
          metadata?: Json | null
          motivation?: Database["public"]["Enums"]["seller_motivation"] | null
          motivation_score?: number | null
          notes?: string | null
          objections?: string[] | null
          offer_price?: number | null
          pain_points?: string[] | null
          profit_estimate?: number | null
          property_address: string
          property_city?: string | null
          property_county?: string | null
          property_state?: string | null
          property_type?: string | null
          property_zip?: string | null
          repair_estimate?: number | null
          seller_contact_id?: string | null
          seller_email?: string | null
          seller_name?: string | null
          seller_phone?: string | null
          source?: Database["public"]["Enums"]["investor_lead_source"] | null
          source_campaign_id?: string | null
          stage?: Database["public"]["Enums"]["investor_deal_stage"] | null
          updated_at?: string | null
          user_id: string
          wholesale_fee?: number | null
        }
        Update: {
          acquisition_cost?: number | null
          ai_follow_up_scheduled_at?: string | null
          ai_last_message_at?: string | null
          ai_response_count?: number | null
          arv?: number | null
          asking_price?: number | null
          close_date?: string | null
          contingencies?: string[] | null
          contract_date?: string | null
          created_at?: string | null
          deal_type?: Database["public"]["Enums"]["investor_deal_type"] | null
          earnest_money?: number | null
          id?: string
          metadata?: Json | null
          motivation?: Database["public"]["Enums"]["seller_motivation"] | null
          motivation_score?: number | null
          notes?: string | null
          objections?: string[] | null
          offer_price?: number | null
          pain_points?: string[] | null
          profit_estimate?: number | null
          property_address?: string
          property_city?: string | null
          property_county?: string | null
          property_state?: string | null
          property_type?: string | null
          property_zip?: string | null
          repair_estimate?: number | null
          seller_contact_id?: string | null
          seller_email?: string | null
          seller_name?: string | null
          seller_phone?: string | null
          source?: Database["public"]["Enums"]["investor_lead_source"] | null
          source_campaign_id?: string | null
          stage?: Database["public"]["Enums"]["investor_deal_stage"] | null
          updated_at?: string | null
          user_id?: string
          wholesale_fee?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "investor_deals_seller_contact_id_fkey"
            columns: ["seller_contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      investor_follow_ups: {
        Row: {
          actual_message: string | null
          agent_id: string | null
          ai_generated_message: string | null
          campaign_id: string | null
          channel: string | null
          completed_at: string | null
          contact_id: string | null
          context: Json | null
          created_at: string | null
          deal_id: string | null
          follow_up_type: string
          id: string
          is_final_touch: boolean | null
          message_template: string | null
          scheduled_at: string
          sequence_position: number | null
          status: string | null
          user_id: string
        }
        Insert: {
          actual_message?: string | null
          agent_id?: string | null
          ai_generated_message?: string | null
          campaign_id?: string | null
          channel?: string | null
          completed_at?: string | null
          contact_id?: string | null
          context?: Json | null
          created_at?: string | null
          deal_id?: string | null
          follow_up_type: string
          id?: string
          is_final_touch?: boolean | null
          message_template?: string | null
          scheduled_at: string
          sequence_position?: number | null
          status?: string | null
          user_id: string
        }
        Update: {
          actual_message?: string | null
          agent_id?: string | null
          ai_generated_message?: string | null
          campaign_id?: string | null
          channel?: string | null
          completed_at?: string | null
          contact_id?: string | null
          context?: Json | null
          created_at?: string | null
          deal_id?: string | null
          follow_up_type?: string
          id?: string
          is_final_touch?: boolean | null
          message_template?: string | null
          scheduled_at?: string
          sequence_position?: number | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "investor_follow_ups_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "investor_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investor_follow_ups_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "investor_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investor_follow_ups_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investor_follow_ups_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "investor_deals"
            referencedColumns: ["id"]
          },
        ]
      }
      investor_messages: {
        Row: {
          ai_confidence: number | null
          ai_model: string | null
          content: string
          content_type: Database["public"]["Enums"]["content_type"]
          conversation_id: string
          created_at: string | null
          delivered_at: string | null
          direction: Database["public"]["Enums"]["message_direction"]
          failed_at: string | null
          failure_reason: string | null
          id: string
          metadata: Json | null
          read_at: string | null
          sent_by: Database["public"]["Enums"]["investor_sender"]
        }
        Insert: {
          ai_confidence?: number | null
          ai_model?: string | null
          content: string
          content_type?: Database["public"]["Enums"]["content_type"]
          conversation_id: string
          created_at?: string | null
          delivered_at?: string | null
          direction: Database["public"]["Enums"]["message_direction"]
          failed_at?: string | null
          failure_reason?: string | null
          id?: string
          metadata?: Json | null
          read_at?: string | null
          sent_by: Database["public"]["Enums"]["investor_sender"]
        }
        Update: {
          ai_confidence?: number | null
          ai_model?: string | null
          content?: string
          content_type?: Database["public"]["Enums"]["content_type"]
          conversation_id?: string
          created_at?: string | null
          delivered_at?: string | null
          direction?: Database["public"]["Enums"]["message_direction"]
          failed_at?: string | null
          failure_reason?: string | null
          id?: string
          metadata?: Json | null
          read_at?: string | null
          sent_by?: Database["public"]["Enums"]["investor_sender"]
        }
        Relationships: [
          {
            foreignKeyName: "investor_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "investor_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      investor_outreach_templates: {
        Row: {
          body: string
          category: string
          channel: string
          contact_type: string
          created_at: string | null
          id: string
          is_active: boolean | null
          is_system: boolean | null
          name: string
          response_rate: number | null
          subject: string | null
          updated_at: string | null
          use_count: number | null
          user_id: string | null
          variables: string[] | null
        }
        Insert: {
          body: string
          category: string
          channel: string
          contact_type: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          name: string
          response_rate?: number | null
          subject?: string | null
          updated_at?: string | null
          use_count?: number | null
          user_id?: string | null
          variables?: string[] | null
        }
        Update: {
          body?: string
          category?: string
          channel?: string
          contact_type?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          name?: string
          response_rate?: number | null
          subject?: string | null
          updated_at?: string | null
          use_count?: number | null
          user_id?: string | null
          variables?: string[] | null
        }
        Relationships: []
      }
      mail_credit_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string | null
          description: string | null
          id: string
          mail_piece_type: Database["public"]["Enums"]["mail_piece_type"] | null
          metadata: Json | null
          original_transaction_id: string | null
          package_name: string | null
          package_price: number | null
          pieces_count: number | null
          refund_reason: string | null
          stripe_payment_id: string | null
          touch_log_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string | null
          description?: string | null
          id?: string
          mail_piece_type?:
            | Database["public"]["Enums"]["mail_piece_type"]
            | null
          metadata?: Json | null
          original_transaction_id?: string | null
          package_name?: string | null
          package_price?: number | null
          pieces_count?: number | null
          refund_reason?: string | null
          stripe_payment_id?: string | null
          touch_log_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string | null
          description?: string | null
          id?: string
          mail_piece_type?:
            | Database["public"]["Enums"]["mail_piece_type"]
            | null
          metadata?: Json | null
          original_transaction_id?: string | null
          package_name?: string | null
          package_price?: number | null
          pieces_count?: number | null
          refund_reason?: string | null
          stripe_payment_id?: string | null
          touch_log_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mail_credit_transactions_original_transaction_id_fkey"
            columns: ["original_transaction_id"]
            isOneToOne: false
            referencedRelation: "mail_credit_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mail_credit_transactions_touch_log_id_fkey"
            columns: ["touch_log_id"]
            isOneToOne: false
            referencedRelation: "drip_touch_log"
            referencedColumns: ["id"]
          },
        ]
      }
      meta_dm_credentials: {
        Row: {
          created_at: string | null
          daily_dm_count: number | null
          daily_dm_reset_at: string | null
          hourly_dm_count: number | null
          hourly_dm_reset_at: string | null
          id: string
          instagram_account_id: string | null
          instagram_username: string | null
          is_active: boolean | null
          last_error: string | null
          last_error_at: string | null
          page_access_token: string
          page_id: string
          page_name: string | null
          permissions: string[] | null
          token_expires_at: string | null
          token_refreshed_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          daily_dm_count?: number | null
          daily_dm_reset_at?: string | null
          hourly_dm_count?: number | null
          hourly_dm_reset_at?: string | null
          id?: string
          instagram_account_id?: string | null
          instagram_username?: string | null
          is_active?: boolean | null
          last_error?: string | null
          last_error_at?: string | null
          page_access_token: string
          page_id: string
          page_name?: string | null
          permissions?: string[] | null
          token_expires_at?: string | null
          token_refreshed_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          daily_dm_count?: number | null
          daily_dm_reset_at?: string | null
          hourly_dm_count?: number | null
          hourly_dm_reset_at?: string | null
          id?: string
          instagram_account_id?: string | null
          instagram_username?: string | null
          is_active?: boolean | null
          last_error?: string | null
          last_error_at?: string | null
          page_access_token?: string
          page_id?: string
          page_name?: string | null
          permissions?: string[] | null
          token_expires_at?: string | null
          token_refreshed_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      moltbot_blocked_patterns: {
        Row: {
          applies_to_channels: string[] | null
          created_at: string | null
          created_by: string | null
          description: string | null
          hit_count: number | null
          id: string
          is_active: boolean | null
          last_hit_at: string | null
          pattern: string
          pattern_type: string
          severity: Database["public"]["Enums"]["moltbot_security_severity"]
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          applies_to_channels?: string[] | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          hit_count?: number | null
          id?: string
          is_active?: boolean | null
          last_hit_at?: string | null
          pattern: string
          pattern_type: string
          severity?: Database["public"]["Enums"]["moltbot_security_severity"]
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          applies_to_channels?: string[] | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          hit_count?: number | null
          id?: string
          is_active?: boolean | null
          last_hit_at?: string | null
          pattern?: string
          pattern_type?: string
          severity?: Database["public"]["Enums"]["moltbot_security_severity"]
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      moltbot_email_analysis: {
        Row: {
          analysis_type: string
          confidence: number | null
          created_at: string | null
          date_range_end: string | null
          date_range_start: string | null
          emails_analyzed: number | null
          id: string
          is_active: boolean | null
          results: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          analysis_type: string
          confidence?: number | null
          created_at?: string | null
          date_range_end?: string | null
          date_range_start?: string | null
          emails_analyzed?: number | null
          id?: string
          is_active?: boolean | null
          results: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          analysis_type?: string
          confidence?: number | null
          created_at?: string | null
          date_range_end?: string | null
          date_range_start?: string | null
          emails_analyzed?: number | null
          id?: string
          is_active?: boolean | null
          results?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      moltbot_episodic_memory: {
        Row: {
          contact_email: string | null
          contact_id: string | null
          contact_phone: string | null
          context: Json | null
          created_at: string | null
          expires_at: string | null
          id: string
          importance: number | null
          is_active: boolean | null
          key_facts: Json | null
          memory_type: Database["public"]["Enums"]["moltbot_episodic_type"]
          sentiment: string | null
          source_conversation_id: string | null
          source_message_ids: string[] | null
          summary: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          contact_email?: string | null
          contact_id?: string | null
          contact_phone?: string | null
          context?: Json | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          importance?: number | null
          is_active?: boolean | null
          key_facts?: Json | null
          memory_type: Database["public"]["Enums"]["moltbot_episodic_type"]
          sentiment?: string | null
          source_conversation_id?: string | null
          source_message_ids?: string[] | null
          summary: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          contact_email?: string | null
          contact_id?: string | null
          contact_phone?: string | null
          context?: Json | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          importance?: number | null
          is_active?: boolean | null
          key_facts?: Json | null
          memory_type?: Database["public"]["Enums"]["moltbot_episodic_type"]
          sentiment?: string | null
          source_conversation_id?: string | null
          source_message_ids?: string[] | null
          summary?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      moltbot_global_knowledge: {
        Row: {
          applies_to_channels: string[] | null
          applies_to_platforms: string[] | null
          applies_to_regions: string[] | null
          category: Database["public"]["Enums"]["moltbot_knowledge_category"]
          created_at: string | null
          id: string
          is_active: boolean | null
          key: string
          last_verified_at: string | null
          priority: number | null
          source_url: string | null
          updated_at: string | null
          value: Json
          verified_by: string | null
          version: number | null
        }
        Insert: {
          applies_to_channels?: string[] | null
          applies_to_platforms?: string[] | null
          applies_to_regions?: string[] | null
          category: Database["public"]["Enums"]["moltbot_knowledge_category"]
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          key: string
          last_verified_at?: string | null
          priority?: number | null
          source_url?: string | null
          updated_at?: string | null
          value: Json
          verified_by?: string | null
          version?: number | null
        }
        Update: {
          applies_to_channels?: string[] | null
          applies_to_platforms?: string[] | null
          applies_to_regions?: string[] | null
          category?: Database["public"]["Enums"]["moltbot_knowledge_category"]
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          key?: string
          last_verified_at?: string | null
          priority?: number | null
          source_url?: string | null
          updated_at?: string | null
          value?: Json
          verified_by?: string | null
          version?: number | null
        }
        Relationships: []
      }
      moltbot_ip_blocklist: {
        Row: {
          blocked_at: string | null
          blocked_by: string | null
          expires_at: string | null
          incident_count: number | null
          ip_address: unknown
          notes: string | null
          reason: string
          related_user_ids: string[] | null
          severity: Database["public"]["Enums"]["moltbot_security_severity"]
        }
        Insert: {
          blocked_at?: string | null
          blocked_by?: string | null
          expires_at?: string | null
          incident_count?: number | null
          ip_address: unknown
          notes?: string | null
          reason: string
          related_user_ids?: string[] | null
          severity?: Database["public"]["Enums"]["moltbot_security_severity"]
        }
        Update: {
          blocked_at?: string | null
          blocked_by?: string | null
          expires_at?: string | null
          incident_count?: number | null
          ip_address?: unknown
          notes?: string | null
          reason?: string
          related_user_ids?: string[] | null
          severity?: Database["public"]["Enums"]["moltbot_security_severity"]
        }
        Relationships: []
      }
      moltbot_knowledge_chunk_tags: {
        Row: {
          chunk_id: string
          tag_id: string
        }
        Insert: {
          chunk_id: string
          tag_id: string
        }
        Update: {
          chunk_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "moltbot_knowledge_chunk_tags_chunk_id_fkey"
            columns: ["chunk_id"]
            isOneToOne: false
            referencedRelation: "moltbot_knowledge_chunks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moltbot_knowledge_chunk_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "moltbot_knowledge_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      moltbot_knowledge_chunks: {
        Row: {
          chunk_type: Database["public"]["Enums"]["moltbot_chunk_type"]
          content: string
          content_hash: string | null
          created_at: string | null
          embedding: string | null
          external_id: string | null
          external_path: string | null
          external_url: string | null
          id: string
          last_used_at: string | null
          metadata: Json | null
          relevance_score: number | null
          source_id: string
          synced_at: string | null
          title: string | null
          token_count: number | null
          updated_at: string | null
          use_count: number | null
          user_id: string
        }
        Insert: {
          chunk_type: Database["public"]["Enums"]["moltbot_chunk_type"]
          content: string
          content_hash?: string | null
          created_at?: string | null
          embedding?: string | null
          external_id?: string | null
          external_path?: string | null
          external_url?: string | null
          id?: string
          last_used_at?: string | null
          metadata?: Json | null
          relevance_score?: number | null
          source_id: string
          synced_at?: string | null
          title?: string | null
          token_count?: number | null
          updated_at?: string | null
          use_count?: number | null
          user_id: string
        }
        Update: {
          chunk_type?: Database["public"]["Enums"]["moltbot_chunk_type"]
          content?: string
          content_hash?: string | null
          created_at?: string | null
          embedding?: string | null
          external_id?: string | null
          external_path?: string | null
          external_url?: string | null
          id?: string
          last_used_at?: string | null
          metadata?: Json | null
          relevance_score?: number | null
          source_id?: string
          synced_at?: string | null
          title?: string | null
          token_count?: number | null
          updated_at?: string | null
          use_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "moltbot_knowledge_chunks_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "moltbot_knowledge_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      moltbot_knowledge_sources: {
        Row: {
          config: Json
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          last_sync_error: string | null
          name: string
          next_sync_at: string | null
          source_type: Database["public"]["Enums"]["moltbot_knowledge_source_type"]
          sync_frequency: string | null
          sync_status: Database["public"]["Enums"]["moltbot_sync_status"] | null
          total_chunks: number | null
          total_tokens: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          config?: Json
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          last_sync_error?: string | null
          name: string
          next_sync_at?: string | null
          source_type: Database["public"]["Enums"]["moltbot_knowledge_source_type"]
          sync_frequency?: string | null
          sync_status?:
            | Database["public"]["Enums"]["moltbot_sync_status"]
            | null
          total_chunks?: number | null
          total_tokens?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          config?: Json
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          last_sync_error?: string | null
          name?: string
          next_sync_at?: string | null
          source_type?: Database["public"]["Enums"]["moltbot_knowledge_source_type"]
          sync_frequency?: string | null
          sync_status?:
            | Database["public"]["Enums"]["moltbot_sync_status"]
            | null
          total_chunks?: number | null
          total_tokens?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      moltbot_knowledge_tags: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          use_count: number | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          use_count?: number | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          use_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      moltbot_learning_queue: {
        Row: {
          contact_id: string | null
          conversation_id: string | null
          created_at: string | null
          error_message: string | null
          extracted_learnings: Json | null
          final_response: string | null
          id: string
          original_response: string
          outcome: string
          outcome_id: string
          processed_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          contact_id?: string | null
          conversation_id?: string | null
          created_at?: string | null
          error_message?: string | null
          extracted_learnings?: Json | null
          final_response?: string | null
          id?: string
          original_response: string
          outcome: string
          outcome_id: string
          processed_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          contact_id?: string | null
          conversation_id?: string | null
          created_at?: string | null
          error_message?: string | null
          extracted_learnings?: Json | null
          final_response?: string | null
          id?: string
          original_response?: string
          outcome?: string
          outcome_id?: string
          processed_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      moltbot_rate_limits: {
        Row: {
          channel: string
          last_request_at: string | null
          request_count: number | null
          user_id: string
          window_start: string
        }
        Insert: {
          channel: string
          last_request_at?: string | null
          request_count?: number | null
          user_id: string
          window_start: string
        }
        Update: {
          channel?: string
          last_request_at?: string | null
          request_count?: number | null
          user_id?: string
          window_start?: string
        }
        Relationships: []
      }
      moltbot_response_examples: {
        Row: {
          category: string
          context: Json | null
          created_at: string | null
          id: string
          is_active: boolean | null
          is_verified: boolean | null
          last_used_at: string | null
          outcome: string | null
          rating: number | null
          response: string
          source: string
          source_conversation_id: string | null
          subcategory: string | null
          topic: string | null
          trigger_message: string
          updated_at: string | null
          use_count: number | null
          user_id: string
        }
        Insert: {
          category: string
          context?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          last_used_at?: string | null
          outcome?: string | null
          rating?: number | null
          response: string
          source: string
          source_conversation_id?: string | null
          subcategory?: string | null
          topic?: string | null
          trigger_message: string
          updated_at?: string | null
          use_count?: number | null
          user_id: string
        }
        Update: {
          category?: string
          context?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          last_used_at?: string | null
          outcome?: string | null
          rating?: number | null
          response?: string
          source?: string
          source_conversation_id?: string | null
          subcategory?: string | null
          topic?: string | null
          trigger_message?: string
          updated_at?: string | null
          use_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      moltbot_security_log: {
        Row: {
          action_taken: Database["public"]["Enums"]["moltbot_security_action"]
          channel: string | null
          contact_id: string | null
          conversation_id: string | null
          created_at: string | null
          detected_patterns: string[] | null
          endpoint: string | null
          event_type: Database["public"]["Enums"]["moltbot_security_event_type"]
          id: string
          ip_address: unknown
          metadata: Json | null
          platform: string | null
          raw_input: string | null
          risk_score: number | null
          sanitized_input: string | null
          severity: Database["public"]["Enums"]["moltbot_security_severity"]
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action_taken: Database["public"]["Enums"]["moltbot_security_action"]
          channel?: string | null
          contact_id?: string | null
          conversation_id?: string | null
          created_at?: string | null
          detected_patterns?: string[] | null
          endpoint?: string | null
          event_type: Database["public"]["Enums"]["moltbot_security_event_type"]
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          platform?: string | null
          raw_input?: string | null
          risk_score?: number | null
          sanitized_input?: string | null
          severity: Database["public"]["Enums"]["moltbot_security_severity"]
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action_taken?: Database["public"]["Enums"]["moltbot_security_action"]
          channel?: string | null
          contact_id?: string | null
          conversation_id?: string | null
          created_at?: string | null
          detected_patterns?: string[] | null
          endpoint?: string | null
          event_type?: Database["public"]["Enums"]["moltbot_security_event_type"]
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          platform?: string | null
          raw_input?: string | null
          risk_score?: number | null
          sanitized_input?: string | null
          severity?: Database["public"]["Enums"]["moltbot_security_severity"]
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      moltbot_sync_history: {
        Row: {
          chunks_added: number | null
          chunks_deleted: number | null
          chunks_updated: number | null
          completed_at: string | null
          created_at: string | null
          error_details: Json | null
          error_message: string | null
          id: string
          source_id: string
          started_at: string
          status: string
          user_id: string
        }
        Insert: {
          chunks_added?: number | null
          chunks_deleted?: number | null
          chunks_updated?: number | null
          completed_at?: string | null
          created_at?: string | null
          error_details?: Json | null
          error_message?: string | null
          id?: string
          source_id: string
          started_at: string
          status: string
          user_id: string
        }
        Update: {
          chunks_added?: number | null
          chunks_deleted?: number | null
          chunks_updated?: number | null
          completed_at?: string | null
          created_at?: string | null
          error_details?: Json | null
          error_message?: string | null
          id?: string
          source_id?: string
          started_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "moltbot_sync_history_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "moltbot_knowledge_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      moltbot_user_memory: {
        Row: {
          channel: string | null
          confidence: number | null
          contact_type: string | null
          created_at: string | null
          external_source_id: string | null
          external_source_type: string | null
          id: string
          key: string
          last_used_at: string | null
          learned_from_outcome_id: string | null
          memory_type: Database["public"]["Enums"]["moltbot_user_memory_type"]
          property_id: string | null
          source: Database["public"]["Enums"]["moltbot_memory_source"] | null
          success_count: number | null
          updated_at: string | null
          use_count: number | null
          user_id: string
          value: Json
        }
        Insert: {
          channel?: string | null
          confidence?: number | null
          contact_type?: string | null
          created_at?: string | null
          external_source_id?: string | null
          external_source_type?: string | null
          id?: string
          key: string
          last_used_at?: string | null
          learned_from_outcome_id?: string | null
          memory_type: Database["public"]["Enums"]["moltbot_user_memory_type"]
          property_id?: string | null
          source?: Database["public"]["Enums"]["moltbot_memory_source"] | null
          success_count?: number | null
          updated_at?: string | null
          use_count?: number | null
          user_id: string
          value: Json
        }
        Update: {
          channel?: string | null
          confidence?: number | null
          contact_type?: string | null
          created_at?: string | null
          external_source_id?: string | null
          external_source_type?: string | null
          id?: string
          key?: string
          last_used_at?: string | null
          learned_from_outcome_id?: string | null
          memory_type?: Database["public"]["Enums"]["moltbot_user_memory_type"]
          property_id?: string | null
          source?: Database["public"]["Enums"]["moltbot_memory_source"] | null
          success_count?: number | null
          updated_at?: string | null
          use_count?: number | null
          user_id?: string
          value?: Json
        }
        Relationships: []
      }
      postgrid_credentials: {
        Row: {
          created_at: string | null
          default_mail_class: string | null
          id: string
          is_active: boolean | null
          last_mail_sent_at: string | null
          return_address_line1: string | null
          return_address_line2: string | null
          return_city: string | null
          return_company: string | null
          return_name: string | null
          return_state: string | null
          return_zip: string | null
          updated_at: string | null
          user_id: string
          webhook_secret: string | null
        }
        Insert: {
          created_at?: string | null
          default_mail_class?: string | null
          id?: string
          is_active?: boolean | null
          last_mail_sent_at?: string | null
          return_address_line1?: string | null
          return_address_line2?: string | null
          return_city?: string | null
          return_company?: string | null
          return_name?: string | null
          return_state?: string | null
          return_zip?: string | null
          updated_at?: string | null
          user_id: string
          webhook_secret?: string | null
        }
        Update: {
          created_at?: string | null
          default_mail_class?: string | null
          id?: string
          is_active?: boolean | null
          last_mail_sent_at?: string | null
          return_address_line1?: string | null
          return_address_line2?: string | null
          return_city?: string | null
          return_company?: string | null
          return_name?: string | null
          return_state?: string | null
          return_zip?: string | null
          updated_at?: string | null
          user_id?: string
          webhook_secret?: string | null
        }
        Relationships: []
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
      rental_ai_queue: {
        Row: {
          alternatives: Json | null
          confidence: number
          conversation_id: string
          created_at: string | null
          detected_topics: string[] | null
          expires_at: string
          final_response: string | null
          id: string
          intent: string | null
          reasoning: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          sent_message_id: string | null
          status: Database["public"]["Enums"]["rental_ai_queue_status"]
          suggested_response: string
          trigger_message_id: string | null
          user_id: string
        }
        Insert: {
          alternatives?: Json | null
          confidence: number
          conversation_id: string
          created_at?: string | null
          detected_topics?: string[] | null
          expires_at?: string
          final_response?: string | null
          id?: string
          intent?: string | null
          reasoning?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sent_message_id?: string | null
          status?: Database["public"]["Enums"]["rental_ai_queue_status"]
          suggested_response: string
          trigger_message_id?: string | null
          user_id: string
        }
        Update: {
          alternatives?: Json | null
          confidence?: number
          conversation_id?: string
          created_at?: string | null
          detected_topics?: string[] | null
          expires_at?: string
          final_response?: string | null
          id?: string
          intent?: string | null
          reasoning?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sent_message_id?: string | null
          status?: Database["public"]["Enums"]["rental_ai_queue_status"]
          suggested_response?: string
          trigger_message_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rental_ai_queue_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "rental_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_ai_queue_sent_message_id_fkey"
            columns: ["sent_message_id"]
            isOneToOne: false
            referencedRelation: "rental_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_ai_queue_trigger_message_id_fkey"
            columns: ["trigger_message_id"]
            isOneToOne: false
            referencedRelation: "rental_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_bookings: {
        Row: {
          booking_type: Database["public"]["Enums"]["rental_booking_type"]
          cancellation_reason: string | null
          cancelled_at: string | null
          check_in_time: string | null
          check_out_time: string | null
          confirmed_at: string | null
          contact_id: string
          created_at: string | null
          deposit: number | null
          deposit_status: string | null
          end_date: string | null
          external_booking_id: string | null
          guest_notes: string | null
          id: string
          internal_notes: string | null
          notes: string | null
          property_id: string
          rate: number
          rate_type: Database["public"]["Enums"]["rental_rate_type"]
          room_id: string | null
          source: string | null
          start_date: string
          status: Database["public"]["Enums"]["rental_booking_status"]
          total_amount: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          booking_type?: Database["public"]["Enums"]["rental_booking_type"]
          cancellation_reason?: string | null
          cancelled_at?: string | null
          check_in_time?: string | null
          check_out_time?: string | null
          confirmed_at?: string | null
          contact_id: string
          created_at?: string | null
          deposit?: number | null
          deposit_status?: string | null
          end_date?: string | null
          external_booking_id?: string | null
          guest_notes?: string | null
          id?: string
          internal_notes?: string | null
          notes?: string | null
          property_id: string
          rate: number
          rate_type: Database["public"]["Enums"]["rental_rate_type"]
          room_id?: string | null
          source?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["rental_booking_status"]
          total_amount?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          booking_type?: Database["public"]["Enums"]["rental_booking_type"]
          cancellation_reason?: string | null
          cancelled_at?: string | null
          check_in_time?: string | null
          check_out_time?: string | null
          confirmed_at?: string | null
          contact_id?: string
          created_at?: string | null
          deposit?: number | null
          deposit_status?: string | null
          end_date?: string | null
          external_booking_id?: string | null
          guest_notes?: string | null
          id?: string
          internal_notes?: string | null
          notes?: string | null
          property_id?: string
          rate?: number
          rate_type?: Database["public"]["Enums"]["rental_rate_type"]
          room_id?: string | null
          source?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["rental_booking_status"]
          total_amount?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rental_bookings_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_bookings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "rental_properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_bookings_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rental_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_conversations: {
        Row: {
          ai_auto_respond: boolean | null
          ai_confidence_threshold: number | null
          ai_enabled: boolean | null
          ai_personality: string | null
          booking_id: string | null
          channel: Database["public"]["Enums"]["rental_channel"]
          contact_id: string
          created_at: string | null
          external_thread_id: string | null
          id: string
          last_message_at: string | null
          last_message_preview: string | null
          message_count: number | null
          platform: Database["public"]["Enums"]["rental_platform"] | null
          property_id: string | null
          status: Database["public"]["Enums"]["rental_conversation_status"]
          subject: string | null
          unread_count: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_auto_respond?: boolean | null
          ai_confidence_threshold?: number | null
          ai_enabled?: boolean | null
          ai_personality?: string | null
          booking_id?: string | null
          channel: Database["public"]["Enums"]["rental_channel"]
          contact_id: string
          created_at?: string | null
          external_thread_id?: string | null
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          message_count?: number | null
          platform?: Database["public"]["Enums"]["rental_platform"] | null
          property_id?: string | null
          status?: Database["public"]["Enums"]["rental_conversation_status"]
          subject?: string | null
          unread_count?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_auto_respond?: boolean | null
          ai_confidence_threshold?: number | null
          ai_enabled?: boolean | null
          ai_personality?: string | null
          booking_id?: string | null
          channel?: Database["public"]["Enums"]["rental_channel"]
          contact_id?: string
          created_at?: string | null
          external_thread_id?: string | null
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          message_count?: number | null
          platform?: Database["public"]["Enums"]["rental_platform"] | null
          property_id?: string | null
          status?: Database["public"]["Enums"]["rental_conversation_status"]
          subject?: string | null
          unread_count?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rental_conversations_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "rental_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_conversations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_conversations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "rental_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_integrations: {
        Row: {
          bookings_synced: number | null
          connected_at: string | null
          contacts_synced: number | null
          created_at: string | null
          credentials: Json | null
          disconnected_at: string | null
          id: string
          last_sync_at: string | null
          last_sync_error: string | null
          last_sync_status: string | null
          messages_synced: number | null
          name: string | null
          platform: Database["public"]["Enums"]["rental_platform"]
          settings: Json | null
          status: Database["public"]["Enums"]["rental_integration_status"]
          sync_enabled: boolean | null
          sync_frequency_minutes: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bookings_synced?: number | null
          connected_at?: string | null
          contacts_synced?: number | null
          created_at?: string | null
          credentials?: Json | null
          disconnected_at?: string | null
          id?: string
          last_sync_at?: string | null
          last_sync_error?: string | null
          last_sync_status?: string | null
          messages_synced?: number | null
          name?: string | null
          platform: Database["public"]["Enums"]["rental_platform"]
          settings?: Json | null
          status?: Database["public"]["Enums"]["rental_integration_status"]
          sync_enabled?: boolean | null
          sync_frequency_minutes?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bookings_synced?: number | null
          connected_at?: string | null
          contacts_synced?: number | null
          created_at?: string | null
          credentials?: Json | null
          disconnected_at?: string | null
          id?: string
          last_sync_at?: string | null
          last_sync_error?: string | null
          last_sync_status?: string | null
          messages_synced?: number | null
          name?: string | null
          platform?: Database["public"]["Enums"]["rental_platform"]
          settings?: Json | null
          status?: Database["public"]["Enums"]["rental_integration_status"]
          sync_enabled?: boolean | null
          sync_frequency_minutes?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      rental_messages: {
        Row: {
          ai_completion_tokens: number | null
          ai_confidence: number | null
          ai_model: string | null
          ai_prompt_tokens: number | null
          approved_at: string | null
          approved_by: string | null
          attachments: Json | null
          content: string
          content_type: Database["public"]["Enums"]["rental_message_content_type"]
          conversation_id: string
          created_at: string | null
          delivered_at: string | null
          direction: Database["public"]["Enums"]["rental_message_direction"]
          edited_content: string | null
          failed_at: string | null
          failure_reason: string | null
          id: string
          metadata: Json | null
          read_at: string | null
          requires_approval: boolean | null
          sent_by: Database["public"]["Enums"]["rental_message_sender"]
        }
        Insert: {
          ai_completion_tokens?: number | null
          ai_confidence?: number | null
          ai_model?: string | null
          ai_prompt_tokens?: number | null
          approved_at?: string | null
          approved_by?: string | null
          attachments?: Json | null
          content: string
          content_type?: Database["public"]["Enums"]["rental_message_content_type"]
          conversation_id: string
          created_at?: string | null
          delivered_at?: string | null
          direction: Database["public"]["Enums"]["rental_message_direction"]
          edited_content?: string | null
          failed_at?: string | null
          failure_reason?: string | null
          id?: string
          metadata?: Json | null
          read_at?: string | null
          requires_approval?: boolean | null
          sent_by: Database["public"]["Enums"]["rental_message_sender"]
        }
        Update: {
          ai_completion_tokens?: number | null
          ai_confidence?: number | null
          ai_model?: string | null
          ai_prompt_tokens?: number | null
          approved_at?: string | null
          approved_by?: string | null
          attachments?: Json | null
          content?: string
          content_type?: Database["public"]["Enums"]["rental_message_content_type"]
          conversation_id?: string
          created_at?: string | null
          delivered_at?: string | null
          direction?: Database["public"]["Enums"]["rental_message_direction"]
          edited_content?: string | null
          failed_at?: string | null
          failure_reason?: string | null
          id?: string
          metadata?: Json | null
          read_at?: string | null
          requires_approval?: boolean | null
          sent_by?: Database["public"]["Enums"]["rental_message_sender"]
        }
        Relationships: [
          {
            foreignKeyName: "rental_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "rental_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_properties: {
        Row: {
          address: string
          address_line_2: string | null
          amenities: string[] | null
          base_rate: number
          bathrooms: number
          bedrooms: number
          city: string
          cleaning_fee: number | null
          country: string | null
          created_at: string | null
          description: string | null
          house_rules: Json | null
          id: string
          internal_notes: string | null
          listing_urls: Json | null
          name: string
          property_type: Database["public"]["Enums"]["rental_property_type"]
          rate_type: Database["public"]["Enums"]["rental_rate_type"]
          rental_type: Database["public"]["Enums"]["rental_type"]
          room_by_room_enabled: boolean | null
          security_deposit: number | null
          square_feet: number | null
          state: string
          status: Database["public"]["Enums"]["rental_property_status"]
          updated_at: string | null
          user_id: string
          zip: string
        }
        Insert: {
          address: string
          address_line_2?: string | null
          amenities?: string[] | null
          base_rate: number
          bathrooms?: number
          bedrooms?: number
          city: string
          cleaning_fee?: number | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          house_rules?: Json | null
          id?: string
          internal_notes?: string | null
          listing_urls?: Json | null
          name: string
          property_type?: Database["public"]["Enums"]["rental_property_type"]
          rate_type?: Database["public"]["Enums"]["rental_rate_type"]
          rental_type?: Database["public"]["Enums"]["rental_type"]
          room_by_room_enabled?: boolean | null
          security_deposit?: number | null
          square_feet?: number | null
          state: string
          status?: Database["public"]["Enums"]["rental_property_status"]
          updated_at?: string | null
          user_id: string
          zip: string
        }
        Update: {
          address?: string
          address_line_2?: string | null
          amenities?: string[] | null
          base_rate?: number
          bathrooms?: number
          bedrooms?: number
          city?: string
          cleaning_fee?: number | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          house_rules?: Json | null
          id?: string
          internal_notes?: string | null
          listing_urls?: Json | null
          name?: string
          property_type?: Database["public"]["Enums"]["rental_property_type"]
          rate_type?: Database["public"]["Enums"]["rental_rate_type"]
          rental_type?: Database["public"]["Enums"]["rental_type"]
          room_by_room_enabled?: boolean | null
          security_deposit?: number | null
          square_feet?: number | null
          state?: string
          status?: Database["public"]["Enums"]["rental_property_status"]
          updated_at?: string | null
          user_id?: string
          zip?: string
        }
        Relationships: []
      }
      rental_rooms: {
        Row: {
          amenities: string[] | null
          available_date: string | null
          created_at: string | null
          current_booking_id: string | null
          description: string | null
          has_private_bath: boolean | null
          has_private_entrance: boolean | null
          id: string
          monthly_rate: number
          name: string
          property_id: string
          size_sqft: number | null
          status: Database["public"]["Enums"]["rental_room_status"]
          updated_at: string | null
          utilities_included: boolean | null
          weekly_rate: number | null
        }
        Insert: {
          amenities?: string[] | null
          available_date?: string | null
          created_at?: string | null
          current_booking_id?: string | null
          description?: string | null
          has_private_bath?: boolean | null
          has_private_entrance?: boolean | null
          id?: string
          monthly_rate: number
          name: string
          property_id: string
          size_sqft?: number | null
          status?: Database["public"]["Enums"]["rental_room_status"]
          updated_at?: string | null
          utilities_included?: boolean | null
          weekly_rate?: number | null
        }
        Update: {
          amenities?: string[] | null
          available_date?: string | null
          created_at?: string | null
          current_booking_id?: string | null
          description?: string | null
          has_private_bath?: boolean | null
          has_private_entrance?: boolean | null
          id?: string
          monthly_rate?: number
          name?: string
          property_id?: string
          size_sqft?: number | null
          status?: Database["public"]["Enums"]["rental_room_status"]
          updated_at?: string | null
          utilities_included?: boolean | null
          weekly_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_rental_rooms_current_booking"
            columns: ["current_booking_id"]
            isOneToOne: false
            referencedRelation: "rental_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_rooms_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "rental_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_templates: {
        Row: {
          ai_use_as_example: boolean | null
          category: string
          channel: Database["public"]["Enums"]["rental_channel"] | null
          content: string
          created_at: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          last_used_at: string | null
          name: string
          subject: string | null
          updated_at: string | null
          use_count: number | null
          user_id: string
        }
        Insert: {
          ai_use_as_example?: boolean | null
          category: string
          channel?: Database["public"]["Enums"]["rental_channel"] | null
          content: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          last_used_at?: string | null
          name: string
          subject?: string | null
          updated_at?: string | null
          use_count?: number | null
          user_id: string
        }
        Update: {
          ai_use_as_example?: boolean | null
          category?: string
          channel?: Database["public"]["Enums"]["rental_channel"] | null
          content?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          last_used_at?: string | null
          name?: string
          subject?: string | null
          updated_at?: string | null
          use_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      seam_access_codes: {
        Row: {
          booking_id: string | null
          code: string
          code_type: string
          contact_id: string | null
          created_at: string | null
          device_id: string
          ends_at: string | null
          error_message: string | null
          id: string
          last_used_at: string | null
          name: string
          seam_access_code_id: string | null
          sent_at: string | null
          sent_to_guest: boolean | null
          starts_at: string | null
          status: string
          times_used: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          booking_id?: string | null
          code: string
          code_type?: string
          contact_id?: string | null
          created_at?: string | null
          device_id: string
          ends_at?: string | null
          error_message?: string | null
          id?: string
          last_used_at?: string | null
          name: string
          seam_access_code_id?: string | null
          sent_at?: string | null
          sent_to_guest?: boolean | null
          starts_at?: string | null
          status?: string
          times_used?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          booking_id?: string | null
          code?: string
          code_type?: string
          contact_id?: string | null
          created_at?: string | null
          device_id?: string
          ends_at?: string | null
          error_message?: string | null
          id?: string
          last_used_at?: string | null
          name?: string
          seam_access_code_id?: string | null
          sent_at?: string | null
          sent_to_guest?: boolean | null
          starts_at?: string | null
          status?: string
          times_used?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seam_access_codes_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "rental_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seam_access_codes_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seam_access_codes_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "seam_connected_devices"
            referencedColumns: ["id"]
          },
        ]
      }
      seam_connected_devices: {
        Row: {
          battery_level: number | null
          capabilities: Json | null
          created_at: string | null
          device_name: string
          device_type: string
          id: string
          is_online: boolean | null
          last_synced_at: string | null
          manufacturer: string | null
          model: string | null
          property_id: string | null
          seam_device_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          battery_level?: number | null
          capabilities?: Json | null
          created_at?: string | null
          device_name: string
          device_type: string
          id?: string
          is_online?: boolean | null
          last_synced_at?: string | null
          manufacturer?: string | null
          model?: string | null
          property_id?: string | null
          seam_device_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          battery_level?: number | null
          capabilities?: Json | null
          created_at?: string | null
          device_name?: string
          device_type?: string
          id?: string
          is_online?: boolean | null
          last_synced_at?: string | null
          manufacturer?: string | null
          model?: string | null
          property_id?: string | null
          seam_device_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seam_connected_devices_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "rental_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      seam_lock_events: {
        Row: {
          access_code_id: string | null
          created_at: string | null
          details: Json | null
          device_id: string
          event_type: string
          id: string
          occurred_at: string | null
          triggered_by: string | null
          user_id: string
        }
        Insert: {
          access_code_id?: string | null
          created_at?: string | null
          details?: Json | null
          device_id: string
          event_type: string
          id?: string
          occurred_at?: string | null
          triggered_by?: string | null
          user_id: string
        }
        Update: {
          access_code_id?: string | null
          created_at?: string | null
          details?: Json | null
          device_id?: string
          event_type?: string
          id?: string
          occurred_at?: string | null
          triggered_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seam_lock_events_access_code_id_fkey"
            columns: ["access_code_id"]
            isOneToOne: false
            referencedRelation: "seam_access_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seam_lock_events_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "seam_connected_devices"
            referencedColumns: ["id"]
          },
        ]
      }
      seam_workspaces: {
        Row: {
          connected_at: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          last_webhook_at: string | null
          seam_workspace_id: string
          updated_at: string | null
          user_id: string
          webhook_secret: string | null
        }
        Insert: {
          connected_at?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_webhook_at?: string | null
          seam_workspace_id: string
          updated_at?: string | null
          user_id: string
          webhook_secret?: string | null
        }
        Update: {
          connected_at?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_webhook_at?: string | null
          seam_workspace_id?: string
          updated_at?: string | null
          user_id?: string
          webhook_secret?: string | null
        }
        Relationships: []
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
      user_gmail_tokens: {
        Row: {
          access_token: string
          created_at: string
          gmail_email: string
          history_id: string
          refresh_token: string
          token_expiry: string
          updated_at: string
          user_id: string
          watch_expiration: string
        }
        Insert: {
          access_token: string
          created_at?: string
          gmail_email: string
          history_id?: string
          refresh_token: string
          token_expiry: string
          updated_at?: string
          user_id: string
          watch_expiration?: string
        }
        Update: {
          access_token?: string
          created_at?: string
          gmail_email?: string
          history_id?: string
          refresh_token?: string
          token_expiry?: string
          updated_at?: string
          user_id?: string
          watch_expiration?: string
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
      user_mail_credits: {
        Row: {
          balance: number | null
          created_at: string | null
          id: string
          lifetime_purchased: number | null
          lifetime_used: number | null
          low_balance_alert_sent_at: string | null
          low_balance_threshold: number | null
          reserved: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance?: number | null
          created_at?: string | null
          id?: string
          lifetime_purchased?: number | null
          lifetime_used?: number | null
          low_balance_alert_sent_at?: string | null
          low_balance_threshold?: number | null
          reserved?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance?: number | null
          created_at?: string | null
          id?: string
          lifetime_purchased?: number | null
          lifetime_used?: number | null
          low_balance_alert_sent_at?: string | null
          low_balance_threshold?: number | null
          reserved?: number | null
          updated_at?: string | null
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
      user_platform_settings: {
        Row: {
          active_platform: Database["public"]["Enums"]["user_platform"]
          completed_investor_onboarding: boolean | null
          completed_landlord_onboarding: boolean | null
          created_at: string | null
          enabled_platforms: Database["public"]["Enums"]["user_platform"][]
          id: string
          landlord_settings: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          active_platform?: Database["public"]["Enums"]["user_platform"]
          completed_investor_onboarding?: boolean | null
          completed_landlord_onboarding?: boolean | null
          created_at?: string | null
          enabled_platforms?: Database["public"]["Enums"]["user_platform"][]
          id?: string
          landlord_settings?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          active_platform?: Database["public"]["Enums"]["user_platform"]
          completed_investor_onboarding?: boolean | null
          completed_landlord_onboarding?: boolean | null
          created_at?: string | null
          enabled_platforms?: Database["public"]["Enums"]["user_platform"][]
          id?: string
          landlord_settings?: Json | null
          updated_at?: string | null
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
      add_mail_credits: {
        Args: { p_amount: number; p_description?: string; p_user_id: string }
        Returns: boolean
      }
      add_mail_credits_refund: {
        Args: { p_amount: number; p_reason?: string; p_user_id: string }
        Returns: boolean
      }
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
      advance_enrollment_step: {
        Args: { p_enrollment_id: string; p_touch_log_id?: string }
        Returns: {
          campaign_id: string
          completed_at: string | null
          contact_id: string
          converted_at: string | null
          converted_deal_id: string | null
          created_at: string | null
          current_step: number | null
          deal_id: string | null
          enrolled_at: string | null
          enrollment_context: Json | null
          id: string
          last_touch_at: string | null
          last_touch_channel: Database["public"]["Enums"]["drip_channel"] | null
          next_touch_at: string | null
          paused_at: string | null
          paused_reason: string | null
          responded_at: string | null
          response_channel: Database["public"]["Enums"]["drip_channel"] | null
          response_message: string | null
          resumed_at: string | null
          status: Database["public"]["Enums"]["drip_enrollment_status"] | null
          touches_delivered: number | null
          touches_failed: number | null
          touches_sent: number | null
          updated_at: string | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "drip_enrollments"
          isOneToOne: true
          isSetofReturn: false
        }
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
      calculate_adaptive_confidence: {
        Args: {
          p_base_confidence: number
          p_contact_type: string
          p_message_type: string
          p_topic: string
          p_user_id: string
        }
        Returns: number
      }
      calculate_booking_revenue: {
        Args: {
          p_end_date: string
          p_rate: number
          p_rate_type: Database["public"]["Enums"]["rental_rate_type"]
          p_start_date: string
        }
        Returns: number
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
      check_rate_limit: {
        Args: {
          p_burst_limit?: number
          p_channel: string
          p_hourly_limit?: number
          p_user_id: string
        }
        Returns: {
          allowed: boolean
          current_count: number
          remaining: number
          window_type: string
        }[]
      }
      check_rental_availability: {
        Args: {
          p_end_date?: string
          p_exclude_booking_id?: string
          p_property_id: string
          p_room_id?: string
          p_start_date?: string
        }
        Returns: {
          available: boolean
          conflict_count: number
          conflicts: Json
        }[]
      }
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
      cleanup_old_rate_limits: { Args: never; Returns: number }
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
      deduct_mail_credits: {
        Args: {
          p_amount: number
          p_description?: string
          p_mail_piece_type: Database["public"]["Enums"]["mail_piece_type"]
          p_pieces_count?: number
          p_touch_log_id: string
          p_user_id: string
        }
        Returns: boolean
      }
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
      expire_ai_queue_items: { Args: never; Returns: number }
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
      get_contact_episodic_memories: {
        Args: { p_contact_id: string; p_limit?: number; p_user_id: string }
        Returns: {
          created_at: string
          importance: number
          key_facts: Json
          memory_type: Database["public"]["Enums"]["moltbot_episodic_type"]
          sentiment: string
          summary: string
        }[]
      }
      get_conversation_summary: {
        Args: { p_user_id: string }
        Returns: {
          active_conversations: number
          escalated_conversations: number
          pending_ai_responses: number
          total_conversations: number
          unread_messages: number
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
      get_default_landlord_settings: { Args: never; Returns: Json }
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
      get_due_drip_enrollments: {
        Args: { p_limit?: number }
        Returns: {
          campaign_id: string
          campaign_name: string
          contact_email: string
          contact_first_name: string
          contact_id: string
          contact_last_name: string
          contact_phone: string
          current_step: number
          enrollment_id: string
          user_id: string
        }[]
      }
      get_effective_confidence_threshold: {
        Args: { p_contact_type: string; p_topic?: string; p_user_id: string }
        Returns: number
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
      get_knowledge_context: {
        Args: {
          p_chunk_types?: Database["public"]["Enums"]["moltbot_chunk_type"][]
          p_limit?: number
          p_max_tokens?: number
          p_query_embedding?: string
          p_query_text?: string
          p_user_id: string
        }
        Returns: string
      }
      get_landlord_setting: {
        Args: { p_path: string[]; p_user_id: string }
        Returns: Json
      }
      get_lead_last_touch: { Args: { p_lead_id: string }; Returns: string }
      get_lead_responsiveness: { Args: { p_lead_id: string }; Returns: number }
      get_lead_touch_count: { Args: { p_lead_id: string }; Returns: number }
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
      get_next_available_date: {
        Args: { p_min_days?: number; p_property_id: string; p_room_id?: string }
        Returns: string
      }
      get_or_create_investor_conversation: {
        Args: {
          p_channel: Database["public"]["Enums"]["investor_channel"]
          p_deal_id?: string
          p_external_thread_id?: string
          p_lead_id: string
          p_property_id?: string
          p_user_id: string
        }
        Returns: string
      }
      get_or_create_platform_settings: {
        Args: { p_user_id: string }
        Returns: {
          active_platform: Database["public"]["Enums"]["user_platform"]
          completed_investor_onboarding: boolean | null
          completed_landlord_onboarding: boolean | null
          created_at: string | null
          enabled_platforms: Database["public"]["Enums"]["user_platform"][]
          id: string
          landlord_settings: Json | null
          updated_at: string | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "user_platform_settings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_property_occupancy: {
        Args: {
          p_end_date?: string
          p_property_id: string
          p_start_date?: string
        }
        Returns: {
          booking_count: number
          occupancy_rate: number
          occupied_days: number
          revenue: number
          total_days: number
        }[]
      }
      get_sources_due_for_sync: {
        Args: { p_limit?: number }
        Returns: {
          config: Json
          id: string
          last_sync_at: string
          name: string
          source_type: Database["public"]["Enums"]["moltbot_knowledge_source_type"]
          user_id: string
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
      get_user_memory_context: {
        Args: {
          p_channel?: string
          p_contact_type?: string
          p_property_id?: string
          p_user_id: string
        }
        Returns: Json
      }
      get_user_role: { Args: never; Returns: string }
      get_user_security_summary: {
        Args: { p_user_id: string }
        Returns: {
          blocked_events: number
          critical_events: number
          high_events: number
          last_event_at: string
          most_common_event: Database["public"]["Enums"]["moltbot_security_event_type"]
          total_events: number
        }[]
      }
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
      increment_campaign_enrolled_count: {
        Args: { p_campaign_id: string; p_count?: number }
        Returns: undefined
      }
      increment_contact_touches: {
        Args: { p_contact_id: string; p_touch_time?: string }
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
      is_contact_opted_out: {
        Args: {
          p_channel: Database["public"]["Enums"]["drip_channel"]
          p_contact_id: string
        }
        Returns: boolean
      }
      is_ip_blocked: { Args: { p_ip_address: unknown }; Returns: boolean }
      is_resource_owner: {
        Args: { resource_user_id: string }
        Returns: boolean
      }
      is_within_quiet_hours: {
        Args: {
          p_quiet_end: string
          p_quiet_start: string
          p_timezone?: string
        }
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
      log_lock_event: {
        Args: {
          p_access_code_id?: string
          p_details?: Json
          p_device_id: string
          p_event_type: string
          p_triggered_by?: string
          p_user_id: string
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
      log_security_event: {
        Args: {
          p_action_taken: Database["public"]["Enums"]["moltbot_security_action"]
          p_channel?: string
          p_detected_patterns?: string[]
          p_event_type: Database["public"]["Enums"]["moltbot_security_event_type"]
          p_metadata?: Json
          p_raw_input?: string
          p_risk_score?: number
          p_severity: Database["public"]["Enums"]["moltbot_security_severity"]
          p_user_id: string
        }
        Returns: string
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
      merge_landlord_settings: { Args: { existing: Json }; Returns: Json }
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
      queue_learning_opportunity: {
        Args: {
          p_contact_id: string
          p_conversation_id: string
          p_final_response: string
          p_original_response: string
          p_outcome: string
          p_outcome_id: string
          p_user_id: string
        }
        Returns: string
      }
      recalculate_confidence_adjustments: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      record_chunk_usage: { Args: { p_chunk_id: string }; Returns: undefined }
      record_memory_usage: {
        Args: { p_memory_id: string; p_was_successful?: boolean }
        Returns: undefined
      }
      record_opt_out: {
        Args: {
          p_campaign_id?: string
          p_channel: Database["public"]["Enums"]["drip_channel"]
          p_contact_id: string
          p_message?: string
          p_reason?: string
          p_touch_id?: string
          p_user_id: string
        }
        Returns: string
      }
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
      score_contact: { Args: { p_contact_id: string }; Returns: number }
      search_knowledge_chunks: {
        Args: {
          p_chunk_types?: Database["public"]["Enums"]["moltbot_chunk_type"][]
          p_limit?: number
          p_query_embedding: string
          p_similarity_threshold?: number
          p_user_id: string
        }
        Returns: {
          chunk_type: Database["public"]["Enums"]["moltbot_chunk_type"]
          content: string
          id: string
          metadata: Json
          similarity: number
          title: string
        }[]
      }
      search_knowledge_keyword: {
        Args: {
          p_chunk_types?: Database["public"]["Enums"]["moltbot_chunk_type"][]
          p_limit?: number
          p_query: string
          p_user_id: string
        }
        Returns: {
          chunk_type: Database["public"]["Enums"]["moltbot_chunk_type"]
          content: string
          id: string
          metadata: Json
          relevance: number
          title: string
        }[]
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
      should_notify_for_response: {
        Args: {
          p_contact_type: string
          p_user_id: string
          p_was_auto_sent: boolean
        }
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
      store_episodic_memory: {
        Args: {
          p_contact_id: string
          p_conversation_id?: string
          p_expires_in_days?: number
          p_importance?: number
          p_key_facts?: Json
          p_memory_type: Database["public"]["Enums"]["moltbot_episodic_type"]
          p_sentiment?: string
          p_summary: string
          p_user_id: string
        }
        Returns: string
      }
      store_user_memory: {
        Args: {
          p_channel?: string
          p_confidence?: number
          p_contact_type?: string
          p_key: string
          p_memory_type: Database["public"]["Enums"]["moltbot_user_memory_type"]
          p_property_id?: string
          p_source?: Database["public"]["Enums"]["moltbot_memory_source"]
          p_user_id: string
          p_value: Json
        }
        Returns: string
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
      switch_platform: {
        Args: {
          p_platform: Database["public"]["Enums"]["user_platform"]
          p_user_id: string
        }
        Returns: {
          active_platform: Database["public"]["Enums"]["user_platform"]
          completed_investor_onboarding: boolean | null
          completed_landlord_onboarding: boolean | null
          created_at: string | null
          enabled_platforms: Database["public"]["Enums"]["user_platform"][]
          id: string
          landlord_settings: Json | null
          updated_at: string | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "user_platform_settings"
          isOneToOne: true
          isSetofReturn: false
        }
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
      topic_requires_review: {
        Args: { p_topic: string; p_user_id: string }
        Returns: boolean
      }
      unlockrows: { Args: { "": string }; Returns: number }
      update_landlord_setting: {
        Args: { p_path: string[]; p_user_id: string; p_value: Json }
        Returns: {
          active_platform: Database["public"]["Enums"]["user_platform"]
          completed_investor_onboarding: boolean | null
          completed_landlord_onboarding: boolean | null
          created_at: string | null
          enabled_platforms: Database["public"]["Enums"]["user_platform"][]
          id: string
          landlord_settings: Json | null
          updated_at: string | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "user_platform_settings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_lead_field: {
        Args: { field_name: string; field_value: string; lead_id: string }
        Returns: Json
      }
      update_property_geo_point: {
        Args: { p_latitude: number; p_longitude: number; p_property_id: string }
        Returns: Json
      }
      update_source_sync_status: {
        Args: {
          p_chunks_count?: number
          p_error?: string
          p_source_id: string
          p_status: Database["public"]["Enums"]["moltbot_sync_status"]
        }
        Returns: undefined
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
      ai_edit_severity: "none" | "minor" | "major"
      ai_mode: "training" | "assisted" | "autonomous"
      ai_outcome: "auto_sent" | "approved" | "edited" | "rejected"
      ai_queue_status:
        | "pending"
        | "approved"
        | "edited"
        | "rejected"
        | "expired"
        | "sent"
      ai_response_style: "friendly" | "professional" | "brief"
      channel_type_extended: "sms" | "email" | "call"
      content_type: "text" | "image" | "file" | "voice" | "video"
      crm_contact_source:
        | "furnishedfinder"
        | "airbnb"
        | "turbotenant"
        | "zillow"
        | "facebook"
        | "whatsapp"
        | "direct"
        | "referral"
        | "craigslist"
        | "other"
      crm_contact_status:
        | "new"
        | "contacted"
        | "qualified"
        | "active"
        | "inactive"
        | "archived"
      crm_contact_type: "lead" | "guest" | "tenant" | "vendor" | "personal"
      drip_channel:
        | "sms"
        | "email"
        | "direct_mail"
        | "meta_dm"
        | "phone_reminder"
      drip_enrollment_status:
        | "active"
        | "paused"
        | "completed"
        | "responded"
        | "converted"
        | "opted_out"
        | "bounced"
        | "expired"
      drip_lead_type:
        | "preforeclosure"
        | "probate"
        | "divorce"
        | "tired_landlord"
        | "vacant_property"
        | "tax_lien"
        | "absentee_owner"
        | "code_violation"
        | "high_equity"
        | "expired_listing"
        | "general"
      drip_touch_status:
        | "pending"
        | "sending"
        | "sent"
        | "delivered"
        | "failed"
        | "skipped"
        | "bounced"
      investor_channel: "sms" | "email" | "whatsapp" | "phone"
      investor_conversation_status:
        | "active"
        | "resolved"
        | "escalated"
        | "archived"
      investor_deal_stage:
        | "lead"
        | "prospect"
        | "appointment_set"
        | "offer_made"
        | "under_contract"
        | "due_diligence"
        | "closed"
        | "dead"
      investor_deal_type:
        | "wholesale"
        | "fix_and_flip"
        | "buy_and_hold"
        | "subject_to"
        | "creative_finance"
        | "land"
        | "commercial"
      investor_lead_source:
        | "direct_mail"
        | "cold_call"
        | "driving_for_dollars"
        | "propstream"
        | "batchleads"
        | "listsource"
        | "referral"
        | "agent_referral"
        | "website"
        | "sms_campaign"
        | "facebook_ads"
        | "bandit_signs"
        | "other"
      investor_sender: "lead" | "ai" | "user"
      lead_status:
        | "active"
        | "inactive"
        | "do_not_contact"
        | "new"
        | "follow-up"
      mail_piece_type:
        | "postcard_4x6"
        | "postcard_6x9"
        | "postcard_6x11"
        | "yellow_letter"
        | "letter_1_page"
        | "letter_2_page"
      message_channel: "email" | "sms"
      message_direction: "outbound" | "inbound"
      message_status: "sent" | "delivered" | "read" | "error"
      moltbot_chunk_type:
        | "property_rule"
        | "response_example"
        | "sop"
        | "faq"
        | "policy"
        | "email_template"
        | "community_insight"
        | "training_material"
      moltbot_episodic_type:
        | "interaction_summary"
        | "preference_learned"
        | "issue_history"
        | "booking_context"
        | "relationship_note"
      moltbot_knowledge_category:
        | "platform_rules"
        | "best_practices"
        | "legal_requirements"
        | "faq_patterns"
        | "response_templates"
        | "community_wisdom"
      moltbot_knowledge_source_type:
        | "fibery"
        | "notion"
        | "google_docs"
        | "discord"
        | "email_history"
        | "manual"
        | "uploaded"
      moltbot_memory_source:
        | "manual"
        | "learned"
        | "imported"
        | "inferred"
        | "system"
      moltbot_security_action: "allowed" | "sanitized" | "flagged" | "blocked"
      moltbot_security_event_type:
        | "injection_attempt"
        | "exfil_attempt"
        | "rate_limit"
        | "output_filtered"
        | "jailbreak_attempt"
        | "suspicious_pattern"
        | "auth_failure"
        | "impersonation"
      moltbot_security_severity: "low" | "medium" | "high" | "critical"
      moltbot_sync_status: "pending" | "syncing" | "synced" | "error" | "paused"
      moltbot_user_memory_type:
        | "preference"
        | "writing_style"
        | "property_rule"
        | "response_pattern"
        | "contact_rule"
        | "template_override"
        | "personality_trait"
      plan_tier: "free" | "pro" | "enterprise"
      plantier: "free" | "starter" | "personal" | "professional" | "enterprise"
      rental_ai_queue_status:
        | "pending"
        | "approved"
        | "edited"
        | "rejected"
        | "expired"
        | "sent"
      rental_booking_status:
        | "inquiry"
        | "pending"
        | "confirmed"
        | "active"
        | "completed"
        | "cancelled"
      rental_booking_type: "reservation" | "lease"
      rental_channel:
        | "whatsapp"
        | "telegram"
        | "email"
        | "sms"
        | "imessage"
        | "discord"
        | "webchat"
        | "phone"
      rental_conversation_status:
        | "active"
        | "resolved"
        | "escalated"
        | "archived"
      rental_integration_status:
        | "connected"
        | "disconnected"
        | "error"
        | "pending"
      rental_message_content_type: "text" | "image" | "file" | "voice" | "video"
      rental_message_direction: "inbound" | "outbound"
      rental_message_sender: "contact" | "ai" | "user"
      rental_platform:
        | "furnishedfinder"
        | "airbnb"
        | "turbotenant"
        | "zillow"
        | "facebook"
        | "craigslist"
        | "direct"
        | "referral"
        | "other"
      rental_property_status: "active" | "inactive" | "maintenance"
      rental_property_type:
        | "single_family"
        | "multi_family"
        | "condo"
        | "apartment"
        | "townhouse"
        | "room"
      rental_rate_type: "nightly" | "weekly" | "monthly"
      rental_room_status:
        | "available"
        | "occupied"
        | "maintenance"
        | "unavailable"
      rental_type: "str" | "mtr" | "ltr"
      seller_motivation: "hot" | "warm" | "cold" | "not_motivated"
      sms_opt_status: "opted_in" | "opted_out" | "pending" | "new"
      user_platform: "investor" | "landlord"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      ai_edit_severity: ["none", "minor", "major"],
      ai_mode: ["training", "assisted", "autonomous"],
      ai_outcome: ["auto_sent", "approved", "edited", "rejected"],
      ai_queue_status: [
        "pending",
        "approved",
        "edited",
        "rejected",
        "expired",
        "sent",
      ],
      ai_response_style: ["friendly", "professional", "brief"],
      channel_type_extended: ["sms", "email", "call"],
      content_type: ["text", "image", "file", "voice", "video"],
      crm_contact_source: [
        "furnishedfinder",
        "airbnb",
        "turbotenant",
        "zillow",
        "facebook",
        "whatsapp",
        "direct",
        "referral",
        "craigslist",
        "other",
      ],
      crm_contact_status: [
        "new",
        "contacted",
        "qualified",
        "active",
        "inactive",
        "archived",
      ],
      crm_contact_type: ["lead", "guest", "tenant", "vendor", "personal"],
      drip_channel: [
        "sms",
        "email",
        "direct_mail",
        "meta_dm",
        "phone_reminder",
      ],
      drip_enrollment_status: [
        "active",
        "paused",
        "completed",
        "responded",
        "converted",
        "opted_out",
        "bounced",
        "expired",
      ],
      drip_lead_type: [
        "preforeclosure",
        "probate",
        "divorce",
        "tired_landlord",
        "vacant_property",
        "tax_lien",
        "absentee_owner",
        "code_violation",
        "high_equity",
        "expired_listing",
        "general",
      ],
      drip_touch_status: [
        "pending",
        "sending",
        "sent",
        "delivered",
        "failed",
        "skipped",
        "bounced",
      ],
      investor_channel: ["sms", "email", "whatsapp", "phone"],
      investor_conversation_status: [
        "active",
        "resolved",
        "escalated",
        "archived",
      ],
      investor_deal_stage: [
        "lead",
        "prospect",
        "appointment_set",
        "offer_made",
        "under_contract",
        "due_diligence",
        "closed",
        "dead",
      ],
      investor_deal_type: [
        "wholesale",
        "fix_and_flip",
        "buy_and_hold",
        "subject_to",
        "creative_finance",
        "land",
        "commercial",
      ],
      investor_lead_source: [
        "direct_mail",
        "cold_call",
        "driving_for_dollars",
        "propstream",
        "batchleads",
        "listsource",
        "referral",
        "agent_referral",
        "website",
        "sms_campaign",
        "facebook_ads",
        "bandit_signs",
        "other",
      ],
      investor_sender: ["lead", "ai", "user"],
      lead_status: ["active", "inactive", "do_not_contact", "new", "follow-up"],
      mail_piece_type: [
        "postcard_4x6",
        "postcard_6x9",
        "postcard_6x11",
        "yellow_letter",
        "letter_1_page",
        "letter_2_page",
      ],
      message_channel: ["email", "sms"],
      message_direction: ["outbound", "inbound"],
      message_status: ["sent", "delivered", "read", "error"],
      moltbot_chunk_type: [
        "property_rule",
        "response_example",
        "sop",
        "faq",
        "policy",
        "email_template",
        "community_insight",
        "training_material",
      ],
      moltbot_episodic_type: [
        "interaction_summary",
        "preference_learned",
        "issue_history",
        "booking_context",
        "relationship_note",
      ],
      moltbot_knowledge_category: [
        "platform_rules",
        "best_practices",
        "legal_requirements",
        "faq_patterns",
        "response_templates",
        "community_wisdom",
      ],
      moltbot_knowledge_source_type: [
        "fibery",
        "notion",
        "google_docs",
        "discord",
        "email_history",
        "manual",
        "uploaded",
      ],
      moltbot_memory_source: [
        "manual",
        "learned",
        "imported",
        "inferred",
        "system",
      ],
      moltbot_security_action: ["allowed", "sanitized", "flagged", "blocked"],
      moltbot_security_event_type: [
        "injection_attempt",
        "exfil_attempt",
        "rate_limit",
        "output_filtered",
        "jailbreak_attempt",
        "suspicious_pattern",
        "auth_failure",
        "impersonation",
      ],
      moltbot_security_severity: ["low", "medium", "high", "critical"],
      moltbot_sync_status: ["pending", "syncing", "synced", "error", "paused"],
      moltbot_user_memory_type: [
        "preference",
        "writing_style",
        "property_rule",
        "response_pattern",
        "contact_rule",
        "template_override",
        "personality_trait",
      ],
      plan_tier: ["free", "pro", "enterprise"],
      plantier: ["free", "starter", "personal", "professional", "enterprise"],
      rental_ai_queue_status: [
        "pending",
        "approved",
        "edited",
        "rejected",
        "expired",
        "sent",
      ],
      rental_booking_status: [
        "inquiry",
        "pending",
        "confirmed",
        "active",
        "completed",
        "cancelled",
      ],
      rental_booking_type: ["reservation", "lease"],
      rental_channel: [
        "whatsapp",
        "telegram",
        "email",
        "sms",
        "imessage",
        "discord",
        "webchat",
        "phone",
      ],
      rental_conversation_status: [
        "active",
        "resolved",
        "escalated",
        "archived",
      ],
      rental_integration_status: [
        "connected",
        "disconnected",
        "error",
        "pending",
      ],
      rental_message_content_type: ["text", "image", "file", "voice", "video"],
      rental_message_direction: ["inbound", "outbound"],
      rental_message_sender: ["contact", "ai", "user"],
      rental_platform: [
        "furnishedfinder",
        "airbnb",
        "turbotenant",
        "zillow",
        "facebook",
        "craigslist",
        "direct",
        "referral",
        "other",
      ],
      rental_property_status: ["active", "inactive", "maintenance"],
      rental_property_type: [
        "single_family",
        "multi_family",
        "condo",
        "apartment",
        "townhouse",
        "room",
      ],
      rental_rate_type: ["nightly", "weekly", "monthly"],
      rental_room_status: [
        "available",
        "occupied",
        "maintenance",
        "unavailable",
      ],
      rental_type: ["str", "mtr", "ltr"],
      seller_motivation: ["hot", "warm", "cold", "not_motivated"],
      sms_opt_status: ["opted_in", "opted_out", "pending", "new"],
      user_platform: ["investor", "landlord"],
      user_role: ["admin", "standard", "user", "support", "beta"],
    },
  },
} as const
