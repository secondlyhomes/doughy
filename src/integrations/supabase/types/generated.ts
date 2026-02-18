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
    PostgrestVersion: "14.1"
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
          updated_at: string | null
        }
        Insert: {
          category: string
          date?: string
          id?: string
          metric_name: string
          metric_value: number
          updated_at?: string | null
        }
        Update: {
          category?: string
          date?: string
          id?: string
          metric_name?: string
          metric_value?: number
          updated_at?: string | null
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
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          id?: string
          last_updated?: string | null
          subscription_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          id?: string
          last_updated?: string | null
          subscription_id?: string | null
          updated_at?: string | null
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
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          subscription_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          subscription_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      billing_subscription_notifications: {
        Row: {
          channels: string[]
          created_at: string | null
          data: Json | null
          id: string
          is_sent: boolean | null
          scheduled_for: string
          sent_at: string | null
          subscription_id: string | null
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          channels: string[]
          created_at?: string | null
          data?: Json | null
          id?: string
          is_sent?: boolean | null
          scheduled_for: string
          sent_at?: string | null
          subscription_id?: string | null
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          channels?: string[]
          created_at?: string | null
          data?: Json | null
          id?: string
          is_sent?: boolean | null
          scheduled_for?: string
          sent_at?: string | null
          subscription_id?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      call_ai_suggestions: {
        Row: {
          call_id: string
          confidence: number
          context: string | null
          created_at: string
          id: string
          text: string
          type: string
          was_helpful: boolean | null
        }
        Insert: {
          call_id: string
          confidence: number
          context?: string | null
          created_at?: string
          id?: string
          text: string
          type: string
          was_helpful?: boolean | null
        }
        Update: {
          call_id?: string
          confidence?: number
          context?: string | null
          created_at?: string
          id?: string
          text?: string
          type?: string
          was_helpful?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "call_ai_suggestions_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "calls"
            referencedColumns: ["id"]
          },
        ]
      }
      call_summaries: {
        Row: {
          action_items: Json | null
          ai_model: string | null
          call_id: string
          created_at: string
          full_transcript: string | null
          id: string
          key_points: Json | null
          processing_time_ms: number | null
          sentiment: string | null
          summary: string | null
        }
        Insert: {
          action_items?: Json | null
          ai_model?: string | null
          call_id: string
          created_at?: string
          full_transcript?: string | null
          id?: string
          key_points?: Json | null
          processing_time_ms?: number | null
          sentiment?: string | null
          summary?: string | null
        }
        Update: {
          action_items?: Json | null
          ai_model?: string | null
          call_id?: string
          created_at?: string
          full_transcript?: string | null
          id?: string
          key_points?: Json | null
          processing_time_ms?: number | null
          sentiment?: string | null
          summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "call_summaries_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: true
            referencedRelation: "calls"
            referencedColumns: ["id"]
          },
        ]
      }
      call_transcript_segments: {
        Row: {
          call_id: string
          confidence: number | null
          created_at: string
          id: string
          speaker: string
          text: string
          timestamp_ms: number
        }
        Insert: {
          call_id: string
          confidence?: number | null
          created_at?: string
          id?: string
          speaker: string
          text: string
          timestamp_ms: number
        }
        Update: {
          call_id?: string
          confidence?: number | null
          created_at?: string
          id?: string
          speaker?: string
          text?: string
          timestamp_ms?: number
        }
        Relationships: [
          {
            foreignKeyName: "call_transcript_segments_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "calls"
            referencedColumns: ["id"]
          },
        ]
      }
      calls: {
        Row: {
          contact_id: string | null
          created_at: string
          direction: string
          duration_seconds: number | null
          ended_at: string | null
          id: string
          phone_number: string
          recording_url: string | null
          started_at: string | null
          status: string
          twilio_call_sid: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_id?: string | null
          created_at?: string
          direction: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          phone_number: string
          recording_url?: string | null
          started_at?: string | null
          status?: string
          twilio_call_sid?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          contact_id?: string | null
          created_at?: string
          direction?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          phone_number?: string
          recording_url?: string | null
          started_at?: string | null
          status?: string
          twilio_call_sid?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calls_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      comms_call_logs: {
        Row: {
          created_at: string
          duration_secs: number | null
          id: string
          lead_id: string
          recording_url: string | null
          summary: string | null
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          duration_secs?: number | null
          id?: string
          lead_id: string
          recording_url?: string | null
          summary?: string | null
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          duration_secs?: number | null
          id?: string
          lead_id?: string
          recording_url?: string | null
          summary?: string | null
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comms_call_logs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      comms_call_transcript_segments: {
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
            foreignKeyName: "comms_call_transcript_segments_transcript_id_fkey"
            columns: ["transcript_id"]
            isOneToOne: false
            referencedRelation: "comms_call_transcripts"
            referencedColumns: ["id"]
          },
        ]
      }
      comms_call_transcripts: {
        Row: {
          call_id: string | null
          created_at: string | null
          created_by: string | null
          duration: number | null
          id: string
          is_deleted: boolean | null
          is_lead_deleted: boolean | null
          lead_deleted_at: string | null
          lead_deleted_by: string | null
          lead_id: string
          recorded_at: string | null
          recording_url: string | null
          source: string
          status: Database["public"]["Enums"]["call_transcript_status"]
          summary: string | null
          title: string
          transcript_text: string
          updated_at: string | null
          user_id: string | null
          workspace_id: string | null
        }
        Insert: {
          call_id?: string | null
          created_at?: string | null
          created_by?: string | null
          duration?: number | null
          id?: string
          is_deleted?: boolean | null
          is_lead_deleted?: boolean | null
          lead_deleted_at?: string | null
          lead_deleted_by?: string | null
          lead_id: string
          recorded_at?: string | null
          recording_url?: string | null
          source: string
          status?: Database["public"]["Enums"]["call_transcript_status"]
          summary?: string | null
          title: string
          transcript_text: string
          updated_at?: string | null
          user_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          call_id?: string | null
          created_at?: string | null
          created_by?: string | null
          duration?: number | null
          id?: string
          is_deleted?: boolean | null
          is_lead_deleted?: boolean | null
          lead_deleted_at?: string | null
          lead_deleted_by?: string | null
          lead_id?: string
          recorded_at?: string | null
          recording_url?: string | null
          source?: string
          status?: Database["public"]["Enums"]["call_transcript_status"]
          summary?: string | null
          title?: string
          transcript_text?: string
          updated_at?: string | null
          user_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comms_call_transcripts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      comms_conversation_items: {
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
            foreignKeyName: "comms_conversation_items_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
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
          updated_at: string | null
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
          updated_at?: string | null
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
          updated_at?: string | null
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
          conversation_status: Database["public"]["Enums"]["conversation_status"]
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason: string | null
          deletion_scheduled_at: string | null
          direction: Database["public"]["Enums"]["message_direction"]
          id: string
          is_deleted: boolean | null
          is_lead_deleted: boolean | null
          is_testing: boolean | null
          lead_deleted_at: string | null
          lead_deleted_by: string | null
          lead_id: string
          status: Database["public"]["Enums"]["message_status"]
          subject: string | null
          updated_at: string
        }
        Insert: {
          body: string
          channel: Database["public"]["Enums"]["message_channel"]
          channel_extended?:
            | Database["public"]["Enums"]["channel_type_extended"]
            | null
          conversation_status?: Database["public"]["Enums"]["conversation_status"]
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          deletion_scheduled_at?: string | null
          direction: Database["public"]["Enums"]["message_direction"]
          id?: string
          is_deleted?: boolean | null
          is_lead_deleted?: boolean | null
          is_testing?: boolean | null
          lead_deleted_at?: string | null
          lead_deleted_by?: string | null
          lead_id: string
          status?: Database["public"]["Enums"]["message_status"]
          subject?: string | null
          updated_at?: string
        }
        Update: {
          body?: string
          channel?: Database["public"]["Enums"]["message_channel"]
          channel_extended?:
            | Database["public"]["Enums"]["channel_type_extended"]
            | null
          conversation_status?: Database["public"]["Enums"]["conversation_status"]
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          deletion_scheduled_at?: string | null
          direction?: Database["public"]["Enums"]["message_direction"]
          id?: string
          is_deleted?: boolean | null
          is_lead_deleted?: boolean | null
          is_testing?: boolean | null
          lead_deleted_at?: string | null
          lead_deleted_by?: string | null
          lead_id?: string
          status?: Database["public"]["Enums"]["message_status"]
          subject?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      comms_scheduled_messages: {
        Row: {
          channel: Database["public"]["Enums"]["message_channel"]
          content: string
          created_at: string
          id: string
          lead_id: string
          scheduled_for: string
          status: Database["public"]["Enums"]["scheduled_message_status"]
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
          status?: Database["public"]["Enums"]["scheduled_message_status"]
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
          status?: Database["public"]["Enums"]["scheduled_message_status"]
          subject?: string | null
          updated_at?: string
          user_id?: string
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
            referencedRelation: "contacts"
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
        Relationships: []
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
            referencedRelation: "contacts"
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
          group_name: string
          id: string
          is_encrypted: boolean | null
          key_ciphertext: string
          last_checked: string | null
          last_used: string | null
          service: string
          status: Database["public"]["Enums"]["security_api_key_status"]
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          group_name?: string
          id?: string
          is_encrypted?: boolean | null
          key_ciphertext: string
          last_checked?: string | null
          last_used?: string | null
          service: string
          status?: Database["public"]["Enums"]["security_api_key_status"]
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          group_name?: string
          id?: string
          is_encrypted?: boolean | null
          key_ciphertext?: string
          last_checked?: string | null
          last_used?: string | null
          service?: string
          status?: Database["public"]["Enums"]["security_api_key_status"]
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
          is_verified: boolean
          new_email: string
          previous_email: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          is_verified?: boolean
          new_email: string
          previous_email: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          is_verified?: boolean
          new_email?: string
          previous_email?: string
          updated_at?: string | null
          user_id?: string
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
          is_notified: boolean | null
          location: string | null
          severity: string
          updated_at: string | null
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
          is_notified?: boolean | null
          location?: string | null
          severity: string
          updated_at?: string | null
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
          is_notified?: boolean | null
          location?: string | null
          severity?: string
          updated_at?: string | null
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
          is_used: boolean
          token: string
          updated_at: string | null
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
          is_used?: boolean
          token: string
          updated_at?: string | null
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
          is_used?: boolean
          token?: string
          updated_at?: string | null
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
          updated_at: string | null
          user_id: string
        }
        Insert: {
          action: string
          field_name: string
          id?: string
          timestamp?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          action?: string
          field_name?: string
          id?: string
          timestamp?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      survey_step_views: {
        Row: {
          id: string
          step_id: string
          updated_at: string | null
          user_id: string
          viewed_at: string
        }
        Insert: {
          id?: string
          step_id: string
          updated_at?: string | null
          user_id: string
          viewed_at?: string
        }
        Update: {
          id?: string
          step_id?: string
          updated_at?: string | null
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
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description: string
          enabled_for_plan?: string[] | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string
          enabled_for_plan?: string[] | null
          updated_at?: string | null
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
          updated_at: string | null
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
          updated_at?: string | null
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
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      system_logs_settings: {
        Row: {
          created_at: string
          id: number
          is_auto_cleanup_enabled: boolean
          last_cleanup_at: string | null
          retention_days_error: number
          retention_days_info: number
          retention_days_security: number
          retention_days_warning: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: number
          is_auto_cleanup_enabled?: boolean
          last_cleanup_at?: string | null
          retention_days_error?: number
          retention_days_info?: number
          retention_days_security?: number
          retention_days_warning?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: number
          is_auto_cleanup_enabled?: boolean
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
          status: Database["public"]["Enums"]["scheduled_deletion_status"]
          updated_at: string | null
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
          status?: Database["public"]["Enums"]["scheduled_deletion_status"]
          updated_at?: string | null
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
          status?: Database["public"]["Enums"]["scheduled_deletion_status"]
          updated_at?: string | null
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
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          cost_cents?: number | null
          created_at?: string | null
          id?: string
          service: string
          tokens_used?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          cost_cents?: number | null
          created_at?: string | null
          id?: string
          service?: string
          tokens_used?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_email_preferences: {
        Row: {
          created_at: string | null
          email_frequency: string | null
          is_document_emails_enabled: boolean | null
          is_lead_update_emails_enabled: boolean | null
          is_marketing_emails_enabled: boolean | null
          is_property_emails_enabled: boolean | null
          is_reminder_emails_enabled: boolean | null
          is_security_emails_enabled: boolean | null
          is_unsubscribed_all: boolean | null
          is_welcome_emails_enabled: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_frequency?: string | null
          is_document_emails_enabled?: boolean | null
          is_lead_update_emails_enabled?: boolean | null
          is_marketing_emails_enabled?: boolean | null
          is_property_emails_enabled?: boolean | null
          is_reminder_emails_enabled?: boolean | null
          is_security_emails_enabled?: boolean | null
          is_unsubscribed_all?: boolean | null
          is_welcome_emails_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_frequency?: string | null
          is_document_emails_enabled?: boolean | null
          is_lead_update_emails_enabled?: boolean | null
          is_marketing_emails_enabled?: boolean | null
          is_property_emails_enabled?: boolean | null
          is_reminder_emails_enabled?: boolean | null
          is_security_emails_enabled?: boolean | null
          is_unsubscribed_all?: boolean | null
          is_welcome_emails_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string
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
      user_mfa_pending_setups: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          method: string
          secret: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          method: string
          secret: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          method?: string
          secret?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_mfa_recovery_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          is_used: boolean
          updated_at: string | null
          used_at: string | null
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_used?: boolean
          updated_at?: string | null
          used_at?: string | null
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_used?: boolean
          updated_at?: string | null
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
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean
          last_used_at?: string | null
          method: string
          secret: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean
          last_used_at?: string | null
          method?: string
          secret?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          is_read: boolean | null
          message: string
          read_at: string | null
          title: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message: string
          read_at?: string | null
          title: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message?: string
          read_at?: string | null
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_onboarding_statuses: {
        Row: {
          id: string
          is_complete: boolean
          is_email_verified: boolean
          is_profile_complete: boolean
          last_completed_step: string | null
          last_updated: string
          step_completed: number
          total_steps: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          is_complete?: boolean
          is_email_verified?: boolean
          is_profile_complete?: boolean
          last_completed_step?: string | null
          last_updated?: string
          step_completed?: number
          total_steps?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          is_complete?: boolean
          is_email_verified?: boolean
          is_profile_complete?: boolean
          last_completed_step?: string | null
          last_updated?: string
          step_completed?: number
          total_steps?: number
          updated_at?: string | null
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
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          description?: string | null
          id: string
          is_required?: boolean
          name: string
          order: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          description?: string | null
          id?: string
          is_required?: boolean
          name?: string
          order?: number
          updated_at?: string | null
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
          is_skipped: boolean | null
          monthly_property_volume: string | null
          newsletter_frequency: string | null
          primary_problem: string | null
          primary_role: string | null
          referral_source: string | null
          referral_source_other: string | null
          updated_at: string | null
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
          is_skipped?: boolean | null
          monthly_property_volume?: string | null
          newsletter_frequency?: string | null
          primary_problem?: string | null
          primary_role?: string | null
          referral_source?: string | null
          referral_source_other?: string | null
          updated_at?: string | null
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
          is_skipped?: boolean | null
          monthly_property_volume?: string | null
          newsletter_frequency?: string | null
          primary_problem?: string | null
          primary_role?: string | null
          referral_source?: string | null
          referral_source_other?: string | null
          updated_at?: string | null
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
          status: Database["public"]["Enums"]["user_plan_status"]
          tier: Database["public"]["Enums"]["plan_tier"] | null
          trial_ends_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          email_domain?: string | null
          last_login?: string | null
          monthly_token_cap?: number | null
          status?: Database["public"]["Enums"]["user_plan_status"]
          tier?: Database["public"]["Enums"]["plan_tier"] | null
          trial_ends_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          email_domain?: string | null
          last_login?: string | null
          monthly_token_cap?: number | null
          status?: Database["public"]["Enums"]["user_plan_status"]
          tier?: Database["public"]["Enums"]["plan_tier"] | null
          trial_ends_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_platform_settings: {
        Row: {
          active_platform: Database["public"]["Enums"]["user_platform"]
          created_at: string | null
          enabled_platforms: Database["public"]["Enums"]["user_platform"][]
          has_completed_investor_onboarding: boolean | null
          has_completed_landlord_onboarding: boolean | null
          id: string
          landlord_settings: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          active_platform?: Database["public"]["Enums"]["user_platform"]
          created_at?: string | null
          enabled_platforms?: Database["public"]["Enums"]["user_platform"][]
          has_completed_investor_onboarding?: boolean | null
          has_completed_landlord_onboarding?: boolean | null
          id?: string
          landlord_settings?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          active_platform?: Database["public"]["Enums"]["user_platform"]
          created_at?: string | null
          enabled_platforms?: Database["public"]["Enums"]["user_platform"][]
          has_completed_investor_onboarding?: boolean | null
          has_completed_landlord_onboarding?: boolean | null
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
          first_name: string | null
          id: string
          is_deleted: boolean | null
          is_email_verified: boolean | null
          is_onboarding_completed: boolean | null
          last_name: string | null
          name: string | null
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
          first_name?: string | null
          id: string
          is_deleted?: boolean | null
          is_email_verified?: boolean | null
          is_onboarding_completed?: boolean | null
          last_name?: string | null
          name?: string | null
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
          first_name?: string | null
          id?: string
          is_deleted?: boolean | null
          is_email_verified?: boolean | null
          is_onboarding_completed?: boolean | null
          last_name?: string | null
          name?: string | null
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
          action_taken_at: string | null
          email_id: string | null
          id: string
          is_action_taken: boolean | null
          reminder_type: string
          sent_at: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          action_taken_at?: string | null
          email_id?: string | null
          id?: string
          is_action_taken?: boolean | null
          reminder_type: string
          sent_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          action_taken_at?: string | null
          email_id?: string | null
          id?: string
          is_action_taken?: boolean | null
          reminder_type?: string
          sent_at?: string | null
          updated_at?: string | null
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
      user_retention_records: {
        Row: {
          cohort_date: string
          id: string
          original_count: number
          retained_count: number
          retention_days: number
          updated_at: string | null
        }
        Insert: {
          cohort_date: string
          id?: string
          original_count: number
          retained_count: number
          retention_days: number
          updated_at?: string | null
        }
        Update: {
          cohort_date?: string
          id?: string
          original_count?: number
          retained_count?: number
          retention_days?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          created_at: string | null
          current_period_end: string | null
          customer_id: string
          id: string
          is_cancel_at_period_end: boolean | null
          metadata: Json | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          plan_id: string | null
          status: Database["public"]["Enums"]["user_subscription_status"]
          subscription_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_period_end?: string | null
          customer_id: string
          id?: string
          is_cancel_at_period_end?: boolean | null
          metadata?: Json | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          plan_id?: string | null
          status?: Database["public"]["Enums"]["user_subscription_status"]
          subscription_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_period_end?: string | null
          customer_id?: string
          id?: string
          is_cancel_at_period_end?: boolean | null
          metadata?: Json | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          plan_id?: string | null
          status?: Database["public"]["Enums"]["user_subscription_status"]
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
          owner_id: string | null
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
          owner_id?: string | null
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
          owner_id?: string | null
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
      ai_auto_send_rules: {
        Row: {
          conditions: Json | null
          created_at: string | null
          description: string | null
          id: string | null
          is_active: boolean | null
          last_triggered_at: string | null
          name: string | null
          property_id: string | null
          template_id: string | null
          trigger_count: number | null
          trigger_event: string | null
          trigger_offset_hours: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          conditions?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          is_active?: boolean | null
          last_triggered_at?: string | null
          name?: string | null
          property_id?: string | null
          template_id?: string | null
          trigger_count?: number | null
          trigger_event?: string | null
          trigger_offset_hours?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          conditions?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          is_active?: boolean | null
          last_triggered_at?: string | null
          name?: string | null
          property_id?: string | null
          template_id?: string | null
          trigger_count?: number | null
          trigger_event?: string | null
          trigger_offset_hours?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_capture_items: {
        Row: {
          ai_confidence: number | null
          ai_extracted_data: Json | null
          ai_summary: string | null
          assigned_deal_id: string | null
          assigned_lead_id: string | null
          assigned_property_id: string | null
          content: string | null
          created_at: string | null
          duration_seconds: number | null
          file_name: string | null
          file_size: number | null
          file_url: string | null
          id: string | null
          metadata: Json | null
          mime_type: string | null
          source: string | null
          status: Database["public"]["Enums"]["capture_item_status"] | null
          suggested_lead_id: string | null
          suggested_property_id: string | null
          title: string | null
          transcript: string | null
          triaged_at: string | null
          triaged_by: string | null
          type: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          ai_confidence?: number | null
          ai_extracted_data?: Json | null
          ai_summary?: string | null
          assigned_deal_id?: string | null
          assigned_lead_id?: string | null
          assigned_property_id?: string | null
          content?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string | null
          metadata?: Json | null
          mime_type?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["capture_item_status"] | null
          suggested_lead_id?: string | null
          suggested_property_id?: string | null
          title?: string | null
          transcript?: string | null
          triaged_at?: string | null
          triaged_by?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          ai_confidence?: number | null
          ai_extracted_data?: Json | null
          ai_summary?: string | null
          assigned_deal_id?: string | null
          assigned_lead_id?: string | null
          assigned_property_id?: string | null
          content?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string | null
          metadata?: Json | null
          mime_type?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["capture_item_status"] | null
          suggested_lead_id?: string | null
          suggested_property_id?: string | null
          title?: string | null
          transcript?: string | null
          triaged_at?: string | null
          triaged_by?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_sessions: {
        Row: {
          context: Json | null
          created_at: string | null
          id: string | null
          tokens_used: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          context?: Json | null
          created_at?: string | null
          id?: string | null
          tokens_used?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          context?: Json | null
          created_at?: string | null
          id?: string | null
          tokens_used?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      contacts: {
        Row: {
          active_campaign_id: string | null
          address: Json | null
          best_contact_time: string | null
          campaign_status: Database["public"]["Enums"]["campaign_status"] | null
          campaign_touches_received: number | null
          city: string | null
          company: string | null
          contact_types:
            | Database["public"]["Enums"]["crm_contact_type"][]
            | null
          created_at: string | null
          email: string | null
          emails: Json | null
          first_name: string | null
          id: string | null
          is_deleted: boolean | null
          is_do_not_contact: boolean | null
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
          updated_at: string | null
          user_id: string | null
          workspace_id: string | null
          zip: string | null
        }
        Insert: {
          active_campaign_id?: string | null
          address?: Json | null
          best_contact_time?: string | null
          campaign_status?:
            | Database["public"]["Enums"]["campaign_status"]
            | null
          campaign_touches_received?: number | null
          city?: string | null
          company?: string | null
          contact_types?:
            | Database["public"]["Enums"]["crm_contact_type"][]
            | null
          created_at?: string | null
          email?: string | null
          emails?: Json | null
          first_name?: string | null
          id?: string | null
          is_deleted?: boolean | null
          is_do_not_contact?: boolean | null
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
          updated_at?: string | null
          user_id?: string | null
          workspace_id?: string | null
          zip?: string | null
        }
        Update: {
          active_campaign_id?: string | null
          address?: Json | null
          best_contact_time?: string | null
          campaign_status?:
            | Database["public"]["Enums"]["campaign_status"]
            | null
          campaign_touches_received?: number | null
          city?: string | null
          company?: string | null
          contact_types?:
            | Database["public"]["Enums"]["crm_contact_type"][]
            | null
          created_at?: string | null
          email?: string | null
          emails?: Json | null
          first_name?: string | null
          id?: string | null
          is_deleted?: boolean | null
          is_do_not_contact?: boolean | null
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
          updated_at?: string | null
          user_id?: string | null
          workspace_id?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      crm_skip_trace_results: {
        Row: {
          addresses: Json | null
          contact_id: string | null
          created_at: string | null
          credits_used: number | null
          data_points: Json | null
          emails: Json | null
          error_message: string | null
          id: string | null
          input_address: string | null
          input_city: string | null
          input_first_name: string | null
          input_last_name: string | null
          input_state: string | null
          input_zip: string | null
          lead_id: string | null
          match_confidence: number | null
          matched_property_id: string | null
          phones: Json | null
          properties_owned: Json | null
          property_id: string | null
          raw_response: Json | null
          status: Database["public"]["Enums"]["crm_skip_trace_status"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          addresses?: Json | null
          contact_id?: string | null
          created_at?: string | null
          credits_used?: number | null
          data_points?: Json | null
          emails?: Json | null
          error_message?: string | null
          id?: string | null
          input_address?: string | null
          input_city?: string | null
          input_first_name?: string | null
          input_last_name?: string | null
          input_state?: string | null
          input_zip?: string | null
          lead_id?: string | null
          match_confidence?: number | null
          matched_property_id?: string | null
          phones?: Json | null
          properties_owned?: Json | null
          property_id?: string | null
          raw_response?: Json | null
          status?: Database["public"]["Enums"]["crm_skip_trace_status"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          addresses?: Json | null
          contact_id?: string | null
          created_at?: string | null
          credits_used?: number | null
          data_points?: Json | null
          emails?: Json | null
          error_message?: string | null
          id?: string | null
          input_address?: string | null
          input_city?: string | null
          input_first_name?: string | null
          input_last_name?: string | null
          input_state?: string | null
          input_zip?: string | null
          lead_id?: string | null
          match_confidence?: number | null
          matched_property_id?: string | null
          phones?: Json | null
          properties_owned?: Json | null
          property_id?: string | null
          raw_response?: Json | null
          status?: Database["public"]["Enums"]["crm_skip_trace_status"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
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
      investor_comps: {
        Row: {
          address: string | null
          address_line_1: string | null
          address_line_2: string | null
          bathrooms: number | null
          bedrooms: number | null
          city: string | null
          created_at: string | null
          created_by: string | null
          days_on_market: number | null
          distance: number | null
          features_json: Json | null
          id: string | null
          lot_size: number | null
          price_per_sqft: number | null
          property_id: string | null
          sale_date: string | null
          sale_price: number | null
          source: string | null
          special_features: string | null
          square_feet: number | null
          state: string | null
          status: Database["public"]["Enums"]["re_comp_status"] | null
          updated_at: string | null
          workspace_id: string | null
          year_built: number | null
          zip: string | null
        }
        Insert: {
          address?: string | null
          address_line_1?: string | null
          address_line_2?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string | null
          created_at?: string | null
          created_by?: string | null
          days_on_market?: number | null
          distance?: number | null
          features_json?: Json | null
          id?: string | null
          lot_size?: number | null
          price_per_sqft?: number | null
          property_id?: string | null
          sale_date?: string | null
          sale_price?: number | null
          source?: string | null
          special_features?: string | null
          square_feet?: number | null
          state?: string | null
          status?: Database["public"]["Enums"]["re_comp_status"] | null
          updated_at?: string | null
          workspace_id?: string | null
          year_built?: number | null
          zip?: string | null
        }
        Update: {
          address?: string | null
          address_line_1?: string | null
          address_line_2?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string | null
          created_at?: string | null
          created_by?: string | null
          days_on_market?: number | null
          distance?: number | null
          features_json?: Json | null
          id?: string | null
          lot_size?: number | null
          price_per_sqft?: number | null
          property_id?: string | null
          sale_date?: string | null
          sale_price?: number | null
          source?: string | null
          special_features?: string | null
          square_feet?: number | null
          state?: string | null
          status?: Database["public"]["Enums"]["re_comp_status"] | null
          updated_at?: string | null
          workspace_id?: string | null
          year_built?: number | null
          zip?: string | null
        }
        Relationships: []
      }
      investor_deal_events: {
        Row: {
          created_at: string | null
          created_by: string | null
          deal_id: string | null
          description: string | null
          event_type: string | null
          id: string | null
          metadata: Json | null
          source: string | null
          title: string | null
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          deal_id?: string | null
          description?: string | null
          event_type?: string | null
          id?: string | null
          metadata?: Json | null
          source?: string | null
          title?: string | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          deal_id?: string | null
          description?: string | null
          event_type?: string | null
          id?: string | null
          metadata?: Json | null
          source?: string | null
          title?: string | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: []
      }
      investor_outreach_templates: {
        Row: {
          body: string | null
          category: string | null
          channel: string | null
          contact_type: string | null
          created_at: string | null
          id: string | null
          is_active: boolean | null
          is_system: boolean | null
          name: string | null
          response_rate: number | null
          subject: string | null
          updated_at: string | null
          use_count: number | null
          user_id: string | null
          variables: string[] | null
          workspace_id: string | null
        }
        Insert: {
          body?: string | null
          category?: string | null
          channel?: string | null
          contact_type?: string | null
          created_at?: string | null
          id?: string | null
          is_active?: boolean | null
          is_system?: boolean | null
          name?: string | null
          response_rate?: number | null
          subject?: string | null
          updated_at?: string | null
          use_count?: number | null
          user_id?: string | null
          variables?: string[] | null
          workspace_id?: string | null
        }
        Update: {
          body?: string | null
          category?: string | null
          channel?: string | null
          contact_type?: string | null
          created_at?: string | null
          id?: string | null
          is_active?: boolean | null
          is_system?: boolean | null
          name?: string | null
          response_rate?: number | null
          subject?: string | null
          updated_at?: string | null
          use_count?: number | null
          user_id?: string | null
          variables?: string[] | null
          workspace_id?: string | null
        }
        Relationships: []
      }
      landlord_guest_templates: {
        Row: {
          available_variables: Json | null
          body: string | null
          channel: Database["public"]["Enums"]["message_channel"] | null
          created_at: string | null
          id: string | null
          is_active: boolean | null
          is_auto_send: boolean | null
          last_used_at: string | null
          name: string | null
          notes: string | null
          property_id: string | null
          subject: string | null
          template_type:
            | Database["public"]["Enums"]["guest_template_type"]
            | null
          times_used: number | null
          trigger_hours_offset: number | null
          updated_at: string | null
          user_id: string | null
          workspace_id: string | null
        }
        Insert: {
          available_variables?: Json | null
          body?: string | null
          channel?: Database["public"]["Enums"]["message_channel"] | null
          created_at?: string | null
          id?: string | null
          is_active?: boolean | null
          is_auto_send?: boolean | null
          last_used_at?: string | null
          name?: string | null
          notes?: string | null
          property_id?: string | null
          subject?: string | null
          template_type?:
            | Database["public"]["Enums"]["guest_template_type"]
            | null
          times_used?: number | null
          trigger_hours_offset?: number | null
          updated_at?: string | null
          user_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          available_variables?: Json | null
          body?: string | null
          channel?: Database["public"]["Enums"]["message_channel"] | null
          created_at?: string | null
          id?: string | null
          is_active?: boolean | null
          is_auto_send?: boolean | null
          last_used_at?: string | null
          name?: string | null
          notes?: string | null
          property_id?: string | null
          subject?: string | null
          template_type?:
            | Database["public"]["Enums"]["guest_template_type"]
            | null
          times_used?: number | null
          trigger_hours_offset?: number | null
          updated_at?: string | null
          user_id?: string | null
          workspace_id?: string | null
        }
        Relationships: []
      }
      landlord_maintenance_records: {
        Row: {
          actual_cost: number | null
          booking_id: string | null
          category: Database["public"]["Enums"]["maintenance_category"] | null
          charge_to: Database["public"]["Enums"]["maintenance_charge_to"] | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          estimated_cost: number | null
          guest_charge_amount: number | null
          guest_charge_approved_at: string | null
          id: string | null
          inventory_item_id: string | null
          is_guest_charge_approved: boolean | null
          is_guest_chargeable: boolean | null
          location: string | null
          notes: string | null
          photos: Json | null
          priority: Database["public"]["Enums"]["maintenance_priority"] | null
          property_id: string | null
          receipt_amount: number | null
          receipt_url: string | null
          reported_at: string | null
          resolution_notes: string | null
          scheduled_at: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["maintenance_status"] | null
          title: string | null
          updated_at: string | null
          user_id: string | null
          vendor_id: string | null
          vendor_name: string | null
          vendor_phone: string | null
          work_order_number: string | null
          workspace_id: string | null
        }
        Insert: {
          actual_cost?: number | null
          booking_id?: string | null
          category?: Database["public"]["Enums"]["maintenance_category"] | null
          charge_to?:
            | Database["public"]["Enums"]["maintenance_charge_to"]
            | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          estimated_cost?: number | null
          guest_charge_amount?: number | null
          guest_charge_approved_at?: string | null
          id?: string | null
          inventory_item_id?: string | null
          is_guest_charge_approved?: boolean | null
          is_guest_chargeable?: boolean | null
          location?: string | null
          notes?: string | null
          photos?: Json | null
          priority?: Database["public"]["Enums"]["maintenance_priority"] | null
          property_id?: string | null
          receipt_amount?: number | null
          receipt_url?: string | null
          reported_at?: string | null
          resolution_notes?: string | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["maintenance_status"] | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
          vendor_id?: string | null
          vendor_name?: string | null
          vendor_phone?: string | null
          work_order_number?: string | null
          workspace_id?: string | null
        }
        Update: {
          actual_cost?: number | null
          booking_id?: string | null
          category?: Database["public"]["Enums"]["maintenance_category"] | null
          charge_to?:
            | Database["public"]["Enums"]["maintenance_charge_to"]
            | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          estimated_cost?: number | null
          guest_charge_amount?: number | null
          guest_charge_approved_at?: string | null
          id?: string | null
          inventory_item_id?: string | null
          is_guest_charge_approved?: boolean | null
          is_guest_chargeable?: boolean | null
          location?: string | null
          notes?: string | null
          photos?: Json | null
          priority?: Database["public"]["Enums"]["maintenance_priority"] | null
          property_id?: string | null
          receipt_amount?: number | null
          receipt_url?: string | null
          reported_at?: string | null
          resolution_notes?: string | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["maintenance_status"] | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
          vendor_id?: string | null
          vendor_name?: string | null
          vendor_phone?: string | null
          work_order_number?: string | null
          workspace_id?: string | null
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
        Returns: unknown
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
      calculate_settlement_deductions: {
        Args: { p_booking_id: string }
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
      check_cross_function_rate_limit: {
        Args: {
          p_burst_limit?: number
          p_channel?: string
          p_function_hourly_limit?: number
          p_function_name: string
          p_global_hourly_limit?: number
          p_user_id: string
        }
        Returns: {
          allowed: boolean
          current_count: number
          limit_type: string
          remaining: number
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
      decay_threat_scores: { Args: never; Returns: number }
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
      duckdb_fdw_handler: { Args: never; Returns: unknown }
      duckdb_fdw_meta: {
        Args: never
        Returns: {
          author: string
          name: string
          version: string
          website: string
        }[]
      }
      duckdb_fdw_validator: {
        Args: { catalog: unknown; options: string[] }
        Returns: undefined
      }
      embd_distance: { Args: { embd: unknown }; Returns: number }
      embd_in: { Args: { input: unknown }; Returns: unknown }
      embd_knn: { Args: { _left: unknown; _right: unknown }; Returns: boolean }
      embd_out: { Args: { input: unknown }; Returns: unknown }
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
      get_active_security_patterns: {
        Args: never
        Returns: {
          applies_to_channels: string[]
          description: string
          hit_count: number
          id: string
          pattern: string
          pattern_type: string
          severity: Database["public"]["Enums"]["openclaw_security_severity"]
        }[]
      }
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
      get_all_patterns_including_deleted: {
        Args: never
        Returns: {
          created_at: string
          deleted_at: string
          deleted_by: string
          description: string
          hit_count: number
          id: string
          is_active: boolean
          is_deleted: boolean
          last_hit_at: string
          pattern: string
          pattern_type: string
          severity: Database["public"]["Enums"]["openclaw_security_severity"]
        }[]
      }
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
          memory_type: Database["public"]["Enums"]["openclaw_episodic_type"]
          sentiment: string
          summary: string
        }[]
      }
      get_conversation_summary: {
        Args: { p_user_id: string }
        Returns: {
          active_conversations: number
          escalated_conversations: number
          pending_ai_queue: number
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
          email_frequency: string | null
          is_document_emails_enabled: boolean | null
          is_lead_update_emails_enabled: boolean | null
          is_marketing_emails_enabled: boolean | null
          is_property_emails_enabled: boolean | null
          is_reminder_emails_enabled: boolean | null
          is_security_emails_enabled: boolean | null
          is_unsubscribed_all: boolean | null
          is_welcome_emails_enabled: boolean | null
          updated_at: string | null
          user_id: string
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
          p_chunk_types?: Database["public"]["Enums"]["openclaw_chunk_type"][]
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
          created_at: string | null
          enabled_platforms: Database["public"]["Enums"]["user_platform"][]
          has_completed_investor_onboarding: boolean | null
          has_completed_landlord_onboarding: boolean | null
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
          total_days: number
          total_revenue: number
        }[]
      }
      get_recent_calls: {
        Args: { p_limit?: number; p_user_id: string }
        Returns: {
          contact_email: string
          contact_first_name: string
          contact_id: string
          contact_last_name: string
          contact_phone: string
          created_at: string
          direction: string
          duration_seconds: number
          ended_at: string
          id: string
          phone_number: string
          recording_url: string
          started_at: string
          status: string
          twilio_call_sid: string
          updated_at: string
          user_id: string
        }[]
      }
      get_sources_due_for_sync: {
        Args: { p_limit?: number }
        Returns: {
          config: Json
          id: string
          last_sync_at: string
          name: string
          source_type: Database["public"]["Enums"]["openclaw_knowledge_source_type"]
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
          most_common_event: Database["public"]["Enums"]["openclaw_security_event_type"]
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
      iceberg_fdw_handler: { Args: never; Returns: unknown }
      iceberg_fdw_meta: {
        Args: never
        Returns: {
          author: string
          name: string
          version: string
          website: string
        }[]
      }
      iceberg_fdw_validator: {
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
      is_circuit_breaker_open: {
        Args: { p_function_name?: string; p_user_id?: string }
        Returns: {
          is_open: boolean
          opened_at: string
          reason: string
          scope: string
        }[]
      }
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
          p_action_taken: Database["public"]["Enums"]["openclaw_security_action"]
          p_channel?: string
          p_detected_patterns?: string[]
          p_event_type: Database["public"]["Enums"]["openclaw_security_event_type"]
          p_metadata?: Json
          p_raw_input?: string
          p_risk_score?: number
          p_severity: Database["public"]["Enums"]["openclaw_security_severity"]
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
      metadata_filter: { Args: { _left: Json; _right: Json }; Returns: boolean }
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
      record_pattern_hit: { Args: { p_pattern_id: string }; Returns: undefined }
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
      render_guest_template: {
        Args: { p_template_body: string; p_variables: Json }
        Returns: string
      }
      reset_circuit_breaker: { Args: { p_scope: string }; Returns: boolean }
      reset_password_with_token: {
        Args: { new_password: string; reset_token: string }
        Returns: boolean
      }
      restore_deleted_user: { Args: { user_id: string }; Returns: boolean }
      restore_pattern: { Args: { p_pattern_id: string }; Returns: boolean }
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
      s3_vectors_fdw_handler: { Args: never; Returns: unknown }
      s3_vectors_fdw_meta: {
        Args: never
        Returns: {
          author: string
          name: string
          version: string
          website: string
        }[]
      }
      s3_vectors_fdw_validator: {
        Args: { catalog: unknown; options: string[] }
        Returns: undefined
      }
      s3vec_distance: { Args: { s3vec: unknown }; Returns: number }
      s3vec_in: { Args: { input: unknown }; Returns: unknown }
      s3vec_knn: { Args: { _left: unknown; _right: unknown }; Returns: boolean }
      s3vec_out: { Args: { input: unknown }; Returns: unknown }
      score_contact: { Args: { p_contact_id: string }; Returns: number }
      search_knowledge_chunks: {
        Args: {
          p_chunk_types?: Database["public"]["Enums"]["openclaw_chunk_type"][]
          p_limit?: number
          p_query_embedding: string
          p_similarity_threshold?: number
          p_user_id: string
        }
        Returns: {
          chunk_type: Database["public"]["Enums"]["openclaw_chunk_type"]
          content: string
          id: string
          metadata: Json
          similarity: number
          title: string
        }[]
      }
      search_knowledge_keyword: {
        Args: {
          p_chunk_types?: Database["public"]["Enums"]["openclaw_chunk_type"][]
          p_limit?: number
          p_query: string
          p_user_id: string
        }
        Returns: {
          chunk_type: Database["public"]["Enums"]["openclaw_chunk_type"]
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
      soft_delete_pattern: {
        Args: { p_deleted_by?: string; p_pattern_id: string }
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
          p_memory_type: Database["public"]["Enums"]["openclaw_episodic_type"]
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
          p_memory_type: Database["public"]["Enums"]["openclaw_user_memory_type"]
          p_property_id?: string
          p_source?: Database["public"]["Enums"]["openclaw_memory_source"]
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
          created_at: string | null
          enabled_platforms: Database["public"]["Enums"]["user_platform"][]
          has_completed_investor_onboarding: boolean | null
          has_completed_landlord_onboarding: boolean | null
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
      trip_circuit_breaker: {
        Args: {
          p_auto_close_minutes?: number
          p_reason: string
          p_scope: string
          p_user_id?: string
        }
        Returns: boolean
      }
      unlockrows: { Args: { "": string }; Returns: number }
      update_landlord_setting: {
        Args: { p_path: string[]; p_user_id: string; p_value: Json }
        Returns: {
          active_platform: Database["public"]["Enums"]["user_platform"]
          created_at: string | null
          enabled_platforms: Database["public"]["Enums"]["user_platform"][]
          has_completed_investor_onboarding: boolean | null
          has_completed_landlord_onboarding: boolean | null
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
      update_property_geo_point:
        | {
            Args: {
              p_latitude: number
              p_longitude: number
              p_property_id: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_latitude: number
              p_longitude: number
              p_property_id: string
            }
            Returns: Json
          }
      update_source_sync_status: {
        Args: {
          p_chunks_count?: number
          p_error?: string
          p_source_id: string
          p_status: Database["public"]["Enums"]["openclaw_sync_status"]
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
      update_user_threat_score: {
        Args: {
          p_event_type?: string
          p_score_delta: number
          p_user_id: string
        }
        Returns: {
          is_blocked: boolean
          is_flagged: boolean
          new_score: number
        }[]
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
      user_owned_workspace_ids: { Args: never; Returns: string[] }
      user_workspace_ids: { Args: never; Returns: string[] }
      verify_audit_hash_chain: {
        Args: { p_end_date?: string; p_start_date?: string }
        Returns: {
          created_at: string
          error_message: string
          id: string
          is_valid: boolean
        }[]
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
      agent_relationship_status: "new" | "active" | "dormant" | "preferred"
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
      assistant_job_status: "queued" | "running" | "succeeded" | "failed"
      booking_charge_status:
        | "pending"
        | "approved"
        | "disputed"
        | "deducted"
        | "waived"
        | "paid"
      booking_charge_type:
        | "damage"
        | "cleaning"
        | "missing_item"
        | "late_checkout"
        | "rule_violation"
        | "utility_overage"
        | "other"
      call_transcript_status: "active" | "archived" | "deleted"
      campaign_status:
        | "not_enrolled"
        | "active"
        | "paused"
        | "completed"
        | "opted_out"
      capture_item_status:
        | "pending"
        | "processing"
        | "ready"
        | "assigned"
        | "dismissed"
      channel_type_extended: "sms" | "email" | "call"
      commission_type: "flat_fee" | "percentage" | "referral_only"
      contact_method: "email" | "phone" | "text"
      content_type: "text" | "image" | "file" | "voice" | "video"
      conversation_status: "active" | "archive" | "resolved" | "escalated"
      crm_contact_source:
        | "furnishedfinder"
        | "airbnb"
        | "vrbo"
        | "turbotenant"
        | "zillow"
        | "facebook"
        | "whatsapp"
        | "direct"
        | "referral"
        | "craigslist"
        | "other"
        | "driving_for_dollars"
        | "direct_mail"
        | "cold_call"
        | "probate"
        | "wholesaler"
        | "mls"
      crm_contact_status:
        | "new"
        | "contacted"
        | "qualified"
        | "active"
        | "inactive"
        | "archived"
      crm_contact_type: "lead" | "guest" | "tenant" | "vendor" | "personal"
      crm_skip_trace_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
        | "no_results"
      deal_status: "active" | "won" | "lost" | "archived"
      deposit_settlement_status:
        | "pending"
        | "processed"
        | "returned"
        | "withheld"
        | "disputed"
      deposit_status: "pending" | "received" | "returned" | "forfeited"
      document_processing_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
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
      google_service: "gmail" | "calendar"
      guest_message_status:
        | "draft"
        | "queued"
        | "sent"
        | "delivered"
        | "read"
        | "failed"
        | "bounced"
      guest_template_type:
        | "check_in_instructions"
        | "checkout_reminder"
        | "house_rules"
        | "review_request"
        | "welcome"
        | "pre_arrival"
        | "during_stay"
        | "emergency_contact"
        | "custom"
      integration_provider: "seam" | "tracerfy"
      integration_status: "connected" | "disconnected" | "error"
      inventory_category:
        | "appliance"
        | "hvac"
        | "structure"
        | "plumbing"
        | "furniture"
        | "electronics"
        | "other"
      inventory_condition:
        | "excellent"
        | "good"
        | "fair"
        | "poor"
        | "needs_replacement"
      investor_campaign_status:
        | "draft"
        | "active"
        | "paused"
        | "completed"
        | "archived"
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
      investor_follow_up_status:
        | "scheduled"
        | "completed"
        | "cancelled"
        | "overdue"
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
      maintenance_category:
        | "plumbing"
        | "electrical"
        | "hvac"
        | "appliance"
        | "structural"
        | "pest_control"
        | "landscaping"
        | "cleaning"
        | "general"
        | "other"
      maintenance_charge_to: "owner" | "guest" | "warranty" | "insurance"
      maintenance_priority: "emergency" | "high" | "medium" | "low"
      maintenance_status:
        | "reported"
        | "scheduled"
        | "in_progress"
        | "completed"
        | "cancelled"
      message_channel: "email" | "sms"
      message_direction: "outbound" | "inbound"
      message_status: "sent" | "delivered" | "read" | "error"
      occupancy_status: "occupied" | "vacant" | "partial"
      openclaw_chunk_type:
        | "property_rule"
        | "response_example"
        | "sop"
        | "faq"
        | "policy"
        | "email_template"
        | "community_insight"
        | "training_material"
      openclaw_episodic_type:
        | "interaction_summary"
        | "preference_learned"
        | "issue_history"
        | "booking_context"
        | "relationship_note"
      openclaw_knowledge_category:
        | "platform_rules"
        | "best_practices"
        | "legal_requirements"
        | "faq_patterns"
        | "response_templates"
        | "community_wisdom"
      openclaw_knowledge_source_type:
        | "fibery"
        | "notion"
        | "google_docs"
        | "discord"
        | "email_history"
        | "manual"
        | "uploaded"
      openclaw_learning_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
      openclaw_memory_source:
        | "manual"
        | "learned"
        | "imported"
        | "inferred"
        | "system"
      openclaw_security_action: "allowed" | "sanitized" | "flagged" | "blocked"
      openclaw_security_event_type:
        | "injection_attempt"
        | "exfil_attempt"
        | "rate_limit"
        | "output_filtered"
        | "jailbreak_attempt"
        | "suspicious_pattern"
        | "auth_failure"
        | "impersonation"
      openclaw_security_severity: "low" | "medium" | "high" | "critical"
      openclaw_sync_status:
        | "pending"
        | "syncing"
        | "synced"
        | "error"
        | "paused"
      openclaw_user_memory_type:
        | "preference"
        | "writing_style"
        | "property_rule"
        | "response_pattern"
        | "contact_rule"
        | "template_override"
        | "personality_trait"
      payment_status: "paid" | "unpaid" | "failed" | "pending"
      plan_tier: "free" | "pro" | "enterprise"
      plantier: "free" | "starter" | "personal" | "professional" | "enterprise"
      re_comp_status: "active" | "pending" | "closed" | "expired" | "withdrawn"
      re_property_status:
        | "prospect"
        | "active"
        | "under_contract"
        | "closed"
        | "dead"
      relationship_status: "new" | "active" | "inactive" | "blacklisted"
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
      rental_email_provider: "gmail" | "outlook" | "forwarding"
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
      scheduled_deletion_status: "scheduled" | "completed" | "cancelled"
      scheduled_message_status: "pending" | "sent" | "failed" | "cancelled"
      seam_access_code_status:
        | "setting"
        | "set"
        | "removing"
        | "removed"
        | "failed"
      security_api_key_status: "unchecked" | "valid" | "invalid" | "revoked"
      seller_motivation: "hot" | "warm" | "cold" | "not_motivated"
      sms_opt_status: "opted_in" | "opted_out" | "pending" | "new"
      sync_status: "pending" | "syncing" | "success" | "error"
      turnover_status:
        | "pending"
        | "checkout_complete"
        | "cleaning_scheduled"
        | "cleaning_done"
        | "inspected"
        | "ready"
        | "cancelled"
      user_plan_status: "active" | "inactive" | "trial" | "cancelled"
      user_platform: "investor" | "landlord"
      user_role: "admin" | "standard" | "user" | "support" | "beta"
      user_subscription_status:
        | "active"
        | "canceled"
        | "past_due"
        | "trialing"
        | "incomplete"
      vendor_category:
        | "plumber"
        | "electrician"
        | "hvac"
        | "cleaner"
        | "handyman"
        | "locksmith"
        | "pest_control"
        | "landscaper"
        | "appliance_repair"
        | "pool_service"
        | "other"
      vendor_message_status:
        | "draft"
        | "sent"
        | "delivered"
        | "read"
        | "responded"
        | "failed"
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
      agent_relationship_status: ["new", "active", "dormant", "preferred"],
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
      assistant_job_status: ["queued", "running", "succeeded", "failed"],
      booking_charge_status: [
        "pending",
        "approved",
        "disputed",
        "deducted",
        "waived",
        "paid",
      ],
      booking_charge_type: [
        "damage",
        "cleaning",
        "missing_item",
        "late_checkout",
        "rule_violation",
        "utility_overage",
        "other",
      ],
      call_transcript_status: ["active", "archived", "deleted"],
      campaign_status: [
        "not_enrolled",
        "active",
        "paused",
        "completed",
        "opted_out",
      ],
      capture_item_status: [
        "pending",
        "processing",
        "ready",
        "assigned",
        "dismissed",
      ],
      channel_type_extended: ["sms", "email", "call"],
      commission_type: ["flat_fee", "percentage", "referral_only"],
      contact_method: ["email", "phone", "text"],
      content_type: ["text", "image", "file", "voice", "video"],
      conversation_status: ["active", "archive", "resolved", "escalated"],
      crm_contact_source: [
        "furnishedfinder",
        "airbnb",
        "vrbo",
        "turbotenant",
        "zillow",
        "facebook",
        "whatsapp",
        "direct",
        "referral",
        "craigslist",
        "other",
        "driving_for_dollars",
        "direct_mail",
        "cold_call",
        "probate",
        "wholesaler",
        "mls",
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
      crm_skip_trace_status: [
        "pending",
        "processing",
        "completed",
        "failed",
        "no_results",
      ],
      deal_status: ["active", "won", "lost", "archived"],
      deposit_settlement_status: [
        "pending",
        "processed",
        "returned",
        "withheld",
        "disputed",
      ],
      deposit_status: ["pending", "received", "returned", "forfeited"],
      document_processing_status: [
        "pending",
        "processing",
        "completed",
        "failed",
      ],
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
      google_service: ["gmail", "calendar"],
      guest_message_status: [
        "draft",
        "queued",
        "sent",
        "delivered",
        "read",
        "failed",
        "bounced",
      ],
      guest_template_type: [
        "check_in_instructions",
        "checkout_reminder",
        "house_rules",
        "review_request",
        "welcome",
        "pre_arrival",
        "during_stay",
        "emergency_contact",
        "custom",
      ],
      integration_provider: ["seam", "tracerfy"],
      integration_status: ["connected", "disconnected", "error"],
      inventory_category: [
        "appliance",
        "hvac",
        "structure",
        "plumbing",
        "furniture",
        "electronics",
        "other",
      ],
      inventory_condition: [
        "excellent",
        "good",
        "fair",
        "poor",
        "needs_replacement",
      ],
      investor_campaign_status: [
        "draft",
        "active",
        "paused",
        "completed",
        "archived",
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
      investor_follow_up_status: [
        "scheduled",
        "completed",
        "cancelled",
        "overdue",
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
      maintenance_category: [
        "plumbing",
        "electrical",
        "hvac",
        "appliance",
        "structural",
        "pest_control",
        "landscaping",
        "cleaning",
        "general",
        "other",
      ],
      maintenance_charge_to: ["owner", "guest", "warranty", "insurance"],
      maintenance_priority: ["emergency", "high", "medium", "low"],
      maintenance_status: [
        "reported",
        "scheduled",
        "in_progress",
        "completed",
        "cancelled",
      ],
      message_channel: ["email", "sms"],
      message_direction: ["outbound", "inbound"],
      message_status: ["sent", "delivered", "read", "error"],
      occupancy_status: ["occupied", "vacant", "partial"],
      openclaw_chunk_type: [
        "property_rule",
        "response_example",
        "sop",
        "faq",
        "policy",
        "email_template",
        "community_insight",
        "training_material",
      ],
      openclaw_episodic_type: [
        "interaction_summary",
        "preference_learned",
        "issue_history",
        "booking_context",
        "relationship_note",
      ],
      openclaw_knowledge_category: [
        "platform_rules",
        "best_practices",
        "legal_requirements",
        "faq_patterns",
        "response_templates",
        "community_wisdom",
      ],
      openclaw_knowledge_source_type: [
        "fibery",
        "notion",
        "google_docs",
        "discord",
        "email_history",
        "manual",
        "uploaded",
      ],
      openclaw_learning_status: [
        "pending",
        "processing",
        "completed",
        "failed",
      ],
      openclaw_memory_source: [
        "manual",
        "learned",
        "imported",
        "inferred",
        "system",
      ],
      openclaw_security_action: ["allowed", "sanitized", "flagged", "blocked"],
      openclaw_security_event_type: [
        "injection_attempt",
        "exfil_attempt",
        "rate_limit",
        "output_filtered",
        "jailbreak_attempt",
        "suspicious_pattern",
        "auth_failure",
        "impersonation",
      ],
      openclaw_security_severity: ["low", "medium", "high", "critical"],
      openclaw_sync_status: ["pending", "syncing", "synced", "error", "paused"],
      openclaw_user_memory_type: [
        "preference",
        "writing_style",
        "property_rule",
        "response_pattern",
        "contact_rule",
        "template_override",
        "personality_trait",
      ],
      payment_status: ["paid", "unpaid", "failed", "pending"],
      plan_tier: ["free", "pro", "enterprise"],
      plantier: ["free", "starter", "personal", "professional", "enterprise"],
      re_comp_status: ["active", "pending", "closed", "expired", "withdrawn"],
      re_property_status: [
        "prospect",
        "active",
        "under_contract",
        "closed",
        "dead",
      ],
      relationship_status: ["new", "active", "inactive", "blacklisted"],
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
      rental_email_provider: ["gmail", "outlook", "forwarding"],
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
      scheduled_deletion_status: ["scheduled", "completed", "cancelled"],
      scheduled_message_status: ["pending", "sent", "failed", "cancelled"],
      seam_access_code_status: [
        "setting",
        "set",
        "removing",
        "removed",
        "failed",
      ],
      security_api_key_status: ["unchecked", "valid", "invalid", "revoked"],
      seller_motivation: ["hot", "warm", "cold", "not_motivated"],
      sms_opt_status: ["opted_in", "opted_out", "pending", "new"],
      sync_status: ["pending", "syncing", "success", "error"],
      turnover_status: [
        "pending",
        "checkout_complete",
        "cleaning_scheduled",
        "cleaning_done",
        "inspected",
        "ready",
        "cancelled",
      ],
      user_plan_status: ["active", "inactive", "trial", "cancelled"],
      user_platform: ["investor", "landlord"],
      user_role: ["admin", "standard", "user", "support", "beta"],
      user_subscription_status: [
        "active",
        "canceled",
        "past_due",
        "trialing",
        "incomplete",
      ],
      vendor_category: [
        "plumber",
        "electrician",
        "hvac",
        "cleaner",
        "handyman",
        "locksmith",
        "pest_control",
        "landscaper",
        "appliance_repair",
        "pool_service",
        "other",
      ],
      vendor_message_status: [
        "draft",
        "sent",
        "delivered",
        "read",
        "responded",
        "failed",
      ],
    },
  },
} as const
