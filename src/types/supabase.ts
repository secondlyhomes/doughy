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
      ai_jobs: {
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
      crm_contacts: {
        Row: {
          address: Json | null
          city: string | null
          company: string | null
          contact_types:
            | Database["public"]["Enums"]["crm_contact_type"][]
            | null
          created_at: string | null
          email: string | null
          emails: Json | null
          first_name: string | null
          id: string
          is_deleted: boolean | null
          job_title: string | null
          last_name: string | null
          metadata: Json | null
          notes: string | null
          phone: string | null
          phones: Json | null
          score: number | null
          source: Database["public"]["Enums"]["crm_contact_source"] | null
          state: string | null
          status: Database["public"]["Enums"]["crm_contact_status"] | null
          tags: string[] | null
          updated_at: string | null
          user_id: string | null
          zip: string | null
        }
        Insert: {
          address?: Json | null
          city?: string | null
          company?: string | null
          contact_types?:
            | Database["public"]["Enums"]["crm_contact_type"][]
            | null
          created_at?: string | null
          email?: string | null
          emails?: Json | null
          first_name?: string | null
          id?: string
          is_deleted?: boolean | null
          job_title?: string | null
          last_name?: string | null
          metadata?: Json | null
          notes?: string | null
          phone?: string | null
          phones?: Json | null
          score?: number | null
          source?: Database["public"]["Enums"]["crm_contact_source"] | null
          state?: string | null
          status?: Database["public"]["Enums"]["crm_contact_status"] | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string | null
          zip?: string | null
        }
        Update: {
          address?: Json | null
          city?: string | null
          company?: string | null
          contact_types?:
            | Database["public"]["Enums"]["crm_contact_type"][]
            | null
          created_at?: string | null
          email?: string | null
          emails?: Json | null
          first_name?: string | null
          id?: string
          is_deleted?: boolean | null
          job_title?: string | null
          last_name?: string | null
          metadata?: Json | null
          notes?: string | null
          phone?: string | null
          phones?: Json | null
          score?: number | null
          source?: Database["public"]["Enums"]["crm_contact_source"] | null
          state?: string | null
          status?: Database["public"]["Enums"]["crm_contact_status"] | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string | null
          zip?: string | null
        }
        Relationships: []
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
            referencedRelation: "leads"
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
      leads: {
        Row: {
          company: string | null
          created_at: string | null
          email: string | null
          id: string
          is_deleted: boolean | null
          name: string
          opt_status: string | null
          phone: string | null
          score: number | null
          status: string
          tags: string[] | null
          updated_at: string | null
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_deleted?: boolean | null
          name: string
          opt_status?: string | null
          phone?: string | null
          score?: number | null
          status?: string
          tags?: string[] | null
          updated_at?: string | null
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_deleted?: boolean | null
          name?: string
          opt_status?: string | null
          phone?: string | null
          score?: number | null
          status?: string
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: []
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
          id: string
          lot_size: number | null
          mls_id: string | null
          notes: string | null
          property_type: string | null
          purchase_price: number | null
          square_feet: number | null
          state: string
          status: string | null
          street_address: string | null
          street_address_2: string | null
          updated_at: string | null
          user_id: string
          year_built: number | null
          zip_code: string
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
          id?: string
          lot_size?: number | null
          mls_id?: string | null
          notes?: string | null
          property_type?: string | null
          purchase_price?: number | null
          square_feet?: number | null
          state: string
          status?: string | null
          street_address?: string | null
          street_address_2?: string | null
          updated_at?: string | null
          user_id: string
          year_built?: number | null
          zip_code: string
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
          id?: string
          lot_size?: number | null
          mls_id?: string | null
          notes?: string | null
          property_type?: string | null
          purchase_price?: number | null
          square_feet?: number | null
          state?: string
          status?: string | null
          street_address?: string | null
          street_address_2?: string | null
          updated_at?: string | null
          user_id?: string
          year_built?: number | null
          zip_code?: string
        }
        Relationships: []
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
      system_logs: {
        Row: {
          created_at: string | null
          details: Json | null
          id: string
          level: string
          message: string
          source: string
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          id?: string
          level: string
          message: string
          source: string
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          id?: string
          level?: string
          message?: string
          source?: string
        }
        Relationships: []
      }
      trial_devices: {
        Row: {
          created_at: string
          device_id: string
          first_seen: string
        }
        Insert: {
          created_at?: string
          device_id: string
          first_seen?: string
        }
        Update: {
          created_at?: string
          device_id?: string
          first_seen?: string
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
          avatar_url: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          name: string | null
          role: string | null
          settings: Json | null
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          name?: string | null
          role?: string | null
          settings?: Json | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          name?: string | null
          role?: string | null
          settings?: Json | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_booking_revenue: {
        Args: {
          p_end_date: string
          p_rate: number
          p_rate_type: Database["public"]["Enums"]["rental_rate_type"]
          p_start_date: string
        }
        Returns: number
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
      expire_ai_queue_items: { Args: never; Returns: number }
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
      get_next_available_date: {
        Args: { p_min_days?: number; p_property_id: string; p_room_id?: string }
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
      score_contact: { Args: { p_contact_id: string }; Returns: number }
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
    }
    Enums: {
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
      user_platform: "investor" | "landlord"
    }
    CompositeTypes: {
      [_ in never]: never
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
      user_platform: ["investor", "landlord"],
    },
  },
} as const
