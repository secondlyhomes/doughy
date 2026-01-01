export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
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
      api_health_checks: {
        Row: {
          group_name: string
          id: string
          last_checked: string | null
          latency: number | null
          message: string | null
          service: string
          status: string
        }
        Insert: {
          group_name?: string
          id?: string
          last_checked?: string | null
          latency?: number | null
          message?: string | null
          service: string
          status?: string
        }
        Update: {
          group_name?: string
          id?: string
          last_checked?: string | null
          latency?: number | null
          message?: string | null
          service?: string
          status?: string
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          created_at: string | null
          description: string | null
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
        Relationships: [
          {
            foreignKeyName: "api_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_orphaned_auth_view"
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
        Relationships: [
          {
            foreignKeyName: "assistant_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_orphaned_auth_view"
            referencedColumns: ["id"]
          },
        ]
      }
      calls: {
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
            referencedRelation: "lead_conversations"
            referencedColumns: ["lead_id"]
          },
          {
            foreignKeyName: "calls_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
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
      feature_flags: {
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
      feature_usage_stats: {
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
      lead_contacts: {
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
          {
            foreignKeyName: "lead_contacts_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "lead_conversations"
            referencedColumns: ["lead_id"]
          },
          {
            foreignKeyName: "lead_contacts_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
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
        Relationships: [
          {
            foreignKeyName: "leads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_orphaned_auth_view"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          channel: Database["public"]["Enums"]["message_channel"]
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
            foreignKeyName: "messages_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "admin_orphaned_auth_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "lead_conversations"
            referencedColumns: ["lead_id"]
          },
          {
            foreignKeyName: "messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      messages_archive: {
        Row: {
          body: string
          channel: Database["public"]["Enums"]["message_channel"]
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason: string | null
          direction: Database["public"]["Enums"]["message_direction"]
          id: string
          is_deleted: boolean | null
          lead_id: string
          status: Database["public"]["Enums"]["message_status"]
          subject: string | null
          testing: boolean | null
          updated_at: string
        }
        Insert: {
          body: string
          channel: Database["public"]["Enums"]["message_channel"]
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          direction: Database["public"]["Enums"]["message_direction"]
          id: string
          is_deleted?: boolean | null
          lead_id: string
          status?: Database["public"]["Enums"]["message_status"]
          subject?: string | null
          testing?: boolean | null
          updated_at?: string
        }
        Update: {
          body?: string
          channel?: Database["public"]["Enums"]["message_channel"]
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          direction?: Database["public"]["Enums"]["message_direction"]
          id?: string
          is_deleted?: boolean | null
          lead_id?: string
          status?: Database["public"]["Enums"]["message_status"]
          subject?: string | null
          testing?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      oauth_tokens: {
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
        Relationships: [
          {
            foreignKeyName: "oauth_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_orphaned_auth_view"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_type: string | null
          created_at: string | null
          email: string
          first_name: string | null
          id: string
          is_deleted: boolean | null
          last_name: string | null
          name: string | null
          original_email: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          account_type?: string | null
          created_at?: string | null
          email: string
          first_name?: string | null
          id: string
          is_deleted?: boolean | null
          last_name?: string | null
          name?: string | null
          original_email?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          account_type?: string | null
          created_at?: string | null
          email?: string
          first_name?: string | null
          id?: string
          is_deleted?: boolean | null
          last_name?: string | null
          name?: string | null
          original_email?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "admin_orphaned_auth_view"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
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
        Relationships: [
          {
            foreignKeyName: "fk_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_orphaned_auth_view"
            referencedColumns: ["id"]
          },
        ]
      }
      re_comps: {
        Row: {
          address: string
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
            referencedRelation: "workspace"
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
            referencedRelation: "workspace"
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
            foreignKeyName: "re_lead_properties_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_orphaned_auth_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "re_lead_properties_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspace"
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
          created_at: string | null
          created_by: string | null
          geo_point: unknown | null
          id: string
          lot_size: number | null
          mls_id: string | null
          notes: string | null
          property_type: string | null
          purchase_price: number | null
          square_feet: number | null
          state: string
          status: string | null
          tags: string[] | null
          updated_at: string | null
          user_id: string
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
          created_at?: string | null
          created_by?: string | null
          geo_point?: unknown | null
          id?: string
          lot_size?: number | null
          mls_id?: string | null
          notes?: string | null
          property_type?: string | null
          purchase_price?: number | null
          square_feet?: number | null
          state: string
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id: string
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
          created_at?: string | null
          created_by?: string | null
          geo_point?: unknown | null
          id?: string
          lot_size?: number | null
          mls_id?: string | null
          notes?: string | null
          property_type?: string | null
          purchase_price?: number | null
          square_feet?: number | null
          state?: string
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string
          workspace_id?: string | null
          year_built?: number | null
          zip?: string
        }
        Relationships: [
          {
            foreignKeyName: "re_properties_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspace"
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
            referencedRelation: "workspace"
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
            referencedRelation: "workspace"
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
            referencedRelation: "workspace"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_messages: {
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
        Relationships: [
          {
            foreignKeyName: "scheduled_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_orphaned_auth_view"
            referencedColumns: ["id"]
          },
        ]
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
      system_logs: {
        Row: {
          client_info: Json | null
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          level: string
          message: string
          request_id: string | null
          session_id: string | null
          source: string
          user_id: string | null
        }
        Insert: {
          client_info?: Json | null
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          level: string
          message: string
          request_id?: string | null
          session_id?: string | null
          source: string
          user_id?: string | null
        }
        Update: {
          client_info?: Json | null
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          level?: string
          message?: string
          request_id?: string | null
          session_id?: string | null
          source?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_orphaned_auth_view"
            referencedColumns: ["id"]
          },
        ]
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
      transcript_segments: {
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
          },
        ]
      }
      transcripts: {
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
            foreignKeyName: "transcripts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_orphaned_auth_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transcripts_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "lead_conversations"
            referencedColumns: ["lead_id"]
          },
          {
            foreignKeyName: "transcripts_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_logs: {
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
        Relationships: [
          {
            foreignKeyName: "usage_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_orphaned_auth_view"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "user_import_mappings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_orphaned_auth_view"
            referencedColumns: ["id"]
          },
        ]
      }
      user_plans: {
        Row: {
          email_domain: string | null
          last_login: string | null
          monthly_token_cap: number | null
          status: string | null
          tier: Database["public"]["Enums"]["plan_tier"] | null
          user_id: string
        }
        Insert: {
          email_domain?: string | null
          last_login?: string | null
          monthly_token_cap?: number | null
          status?: string | null
          tier?: Database["public"]["Enums"]["plan_tier"] | null
          user_id: string
        }
        Update: {
          email_domain?: string | null
          last_login?: string | null
          monthly_token_cap?: number | null
          status?: string | null
          tier?: Database["public"]["Enums"]["plan_tier"] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "admin_orphaned_auth_view"
            referencedColumns: ["id"]
          },
        ]
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
      workspace: {
        Row: {
          created_at: string | null
          id: string
          name: string
          owner_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          owner_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          owner_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workspace_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "admin_orphaned_auth_view"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      admin_orphaned_auth_view: {
        Row: {
          created_at: string | null
          email: string | null
          id: string | null
          issue: string | null
          last_sign_in_at: string | null
        }
        Relationships: []
      }
      geography_columns: {
        Row: {
          coord_dimension: number | null
          f_geography_column: unknown | null
          f_table_catalog: unknown | null
          f_table_name: unknown | null
          f_table_schema: unknown | null
          srid: number | null
          type: string | null
        }
        Relationships: []
      }
      geometry_columns: {
        Row: {
          coord_dimension: number | null
          f_geometry_column: unknown | null
          f_table_catalog: string | null
          f_table_name: unknown | null
          f_table_schema: unknown | null
          srid: number | null
          type: string | null
        }
        Insert: {
          coord_dimension?: number | null
          f_geometry_column?: unknown | null
          f_table_catalog?: string | null
          f_table_name?: unknown | null
          f_table_schema?: unknown | null
          srid?: number | null
          type?: string | null
        }
        Update: {
          coord_dimension?: number | null
          f_geometry_column?: unknown | null
          f_table_catalog?: string | null
          f_table_name?: unknown | null
          f_table_schema?: unknown | null
          srid?: number | null
          type?: string | null
        }
        Relationships: []
      }
      lead_conversations: {
        Row: {
          active_message_count: number | null
          deleted_message_count: number | null
          has_conversation: boolean | null
          last_message_channel:
            | Database["public"]["Enums"]["message_channel"]
            | null
          last_message_content: string | null
          last_message_date: string | null
          last_message_direction:
            | Database["public"]["Enums"]["message_direction"]
            | null
          lead_id: string | null
          lead_name: string | null
          lead_status: Database["public"]["Enums"]["lead_status"] | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_orphaned_auth_view"
            referencedColumns: ["id"]
          },
        ]
      }
      v_active_users: {
        Row: {
          created_at: string | null
          email: string | null
          id: string | null
          is_deleted: boolean | null
          role: Database["public"]["Enums"]["user_role"] | null
          workspace_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          is_deleted?: boolean | null
          role?: Database["public"]["Enums"]["user_role"] | null
          workspace_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          is_deleted?: boolean | null
          role?: Database["public"]["Enums"]["user_role"] | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "admin_orphaned_auth_view"
            referencedColumns: ["id"]
          },
        ]
      }
      v_current_google_token: {
        Row: {
          access_token: string | null
          created_at: string | null
          expiry_date: string | null
          id: string | null
          provider: string | null
          raw_token: Json | null
          refresh_token: string | null
          scopes: string[] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          access_token?: string | null
          created_at?: string | null
          expiry_date?: string | null
          id?: string | null
          provider?: string | null
          raw_token?: Json | null
          refresh_token?: string | null
          scopes?: string[] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          access_token?: string | null
          created_at?: string | null
          expiry_date?: string | null
          id?: string | null
          provider?: string | null
          raw_token?: Json | null
          refresh_token?: string | null
          scopes?: string[] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "oauth_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_orphaned_auth_view"
            referencedColumns: ["id"]
          },
        ]
      }
      v_deleted_users: {
        Row: {
          created_at: string | null
          email: string | null
          id: string | null
          is_deleted: boolean | null
          role: Database["public"]["Enums"]["user_role"] | null
          workspace_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          is_deleted?: boolean | null
          role?: Database["public"]["Enums"]["user_role"] | null
          workspace_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          is_deleted?: boolean | null
          role?: Database["public"]["Enums"]["user_role"] | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "admin_orphaned_auth_view"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      _postgis_deprecate: {
        Args: { oldname: string; newname: string; version: string }
        Returns: undefined
      }
      _postgis_index_extent: {
        Args: { tbl: unknown; col: string }
        Returns: unknown
      }
      _postgis_pgsql_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      _postgis_scripts_pgsql_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      _postgis_selectivity: {
        Args: { tbl: unknown; att_name: string; geom: unknown; mode?: string }
        Returns: number
      }
      _st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_bestsrid: {
        Args: { "": unknown }
        Returns: number
      }
      _st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_coveredby: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_covers: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
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
      _st_equals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
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
      _st_pointoutside: {
        Args: { "": unknown }
        Returns: unknown
      }
      _st_sortablehash: {
        Args: { geom: unknown }
        Returns: number
      }
      _st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_voronoi: {
        Args: {
          g1: unknown
          clip?: unknown
          tolerance?: number
          return_polygons?: boolean
        }
        Returns: unknown
      }
      _st_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      addauth: {
        Args: { "": string }
        Returns: boolean
      }
      addgeometrycolumn: {
        Args:
          | {
              catalog_name: string
              schema_name: string
              table_name: string
              column_name: string
              new_srid_in: number
              new_type: string
              new_dim: number
              use_typmod?: boolean
            }
          | {
              schema_name: string
              table_name: string
              column_name: string
              new_srid: number
              new_type: string
              new_dim: number
              use_typmod?: boolean
            }
          | {
              table_name: string
              column_name: string
              new_srid: number
              new_type: string
              new_dim: number
              use_typmod?: boolean
            }
        Returns: string
      }
      admin_check_orphaned_users: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          email: string
          created_at: string
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
      box: {
        Args: { "": unknown } | { "": unknown }
        Returns: unknown
      }
      box2d: {
        Args: { "": unknown } | { "": unknown }
        Returns: unknown
      }
      box2d_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      box2d_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      box2df_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      box2df_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      box3d: {
        Args: { "": unknown } | { "": unknown }
        Returns: unknown
      }
      box3d_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      box3d_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      box3dtobox: {
        Args: { "": unknown }
        Returns: unknown
      }
      bytea: {
        Args: { "": unknown } | { "": unknown }
        Returns: string
      }
      check_api_health: {
        Args: { api_service: string }
        Returns: Json
      }
      cleanup_deleted_messages: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      delete_transcript_messages: {
        Args: { transcript_id_param: string }
        Returns: undefined
      }
      disablelongtransactions: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      dropgeometrycolumn: {
        Args:
          | {
              catalog_name: string
              schema_name: string
              table_name: string
              column_name: string
            }
          | { schema_name: string; table_name: string; column_name: string }
          | { table_name: string; column_name: string }
        Returns: string
      }
      dropgeometrytable: {
        Args:
          | { catalog_name: string; schema_name: string; table_name: string }
          | { schema_name: string; table_name: string }
          | { table_name: string }
        Returns: string
      }
      enablelongtransactions: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      equals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      extract_email_domain: {
        Args: { email: string }
        Returns: string
      }
      force_delete_user_by_email: {
        Args: { email_address: string }
        Returns: string
      }
      geography: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      geography_analyze: {
        Args: { "": unknown }
        Returns: boolean
      }
      geography_gist_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      geography_gist_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      geography_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      geography_send: {
        Args: { "": unknown }
        Returns: string
      }
      geography_spgist_compress_nd: {
        Args: { "": unknown }
        Returns: unknown
      }
      geography_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      geography_typmod_out: {
        Args: { "": number }
        Returns: unknown
      }
      geometry: {
        Args:
          | { "": string }
          | { "": string }
          | { "": unknown }
          | { "": unknown }
          | { "": unknown }
          | { "": unknown }
          | { "": unknown }
          | { "": unknown }
        Returns: unknown
      }
      geometry_above: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_analyze: {
        Args: { "": unknown }
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
      geometry_gist_compress_2d: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_gist_compress_nd: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_gist_decompress_2d: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_gist_decompress_nd: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_gist_sortsupport_2d: {
        Args: { "": unknown }
        Returns: undefined
      }
      geometry_gt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_hash: {
        Args: { "": unknown }
        Returns: number
      }
      geometry_in: {
        Args: { "": unknown }
        Returns: unknown
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
      geometry_out: {
        Args: { "": unknown }
        Returns: unknown
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
      geometry_recv: {
        Args: { "": unknown }
        Returns: unknown
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
      geometry_send: {
        Args: { "": unknown }
        Returns: string
      }
      geometry_sortsupport: {
        Args: { "": unknown }
        Returns: undefined
      }
      geometry_spgist_compress_2d: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_spgist_compress_3d: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_spgist_compress_nd: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      geometry_typmod_out: {
        Args: { "": number }
        Returns: unknown
      }
      geometry_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometrytype: {
        Args: { "": unknown } | { "": unknown }
        Returns: string
      }
      geomfromewkb: {
        Args: { "": string }
        Returns: unknown
      }
      geomfromewkt: {
        Args: { "": string }
        Returns: unknown
      }
      get_data_dictionary: {
        Args: { schema_name: string }
        Returns: {
          table_name: string
          column_name: string
          data_type: string
          is_nullable: string
          column_default: string
        }[]
      }
      get_detailed_log_statistics: {
        Args: Record<PropertyKey, never>
        Returns: {
          level: string
          count: number
          last_24h: number
          last_7d: number
          avg_per_day: number
          source: string
          source_count: number
        }[]
      }
      get_log_size_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_size_bytes: number
          estimated_mb: number
          row_count: number
          avg_row_size_bytes: number
        }[]
      }
      get_log_statistics: {
        Args: Record<PropertyKey, never>
        Returns: {
          level: string
          count: number
        }[]
      }
      get_proj4_from_srid: {
        Args: { "": number }
        Returns: string
      }
      get_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      gettransactionid: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      gidx_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gidx_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      insert_oauth_token: {
        Args: {
          p_user_id: string
          p_provider: string
          p_access_token: string
          p_refresh_token: string
          p_expiry_date: string
          p_scopes: string[]
          p_raw_token: Json
        }
        Returns: boolean
      }
      is_admin: {
        Args: { uid: string }
        Returns: boolean
      }
      is_allowed_admin_domain: {
        Args: { email: string }
        Returns: boolean
      }
      json: {
        Args: { "": unknown }
        Returns: Json
      }
      jsonb: {
        Args: { "": unknown }
        Returns: Json
      }
      longtransactionsenabled: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      path: {
        Args: { "": unknown }
        Returns: unknown
      }
      pgis_asflatgeobuf_finalfn: {
        Args: { "": unknown }
        Returns: string
      }
      pgis_asgeobuf_finalfn: {
        Args: { "": unknown }
        Returns: string
      }
      pgis_asmvt_finalfn: {
        Args: { "": unknown }
        Returns: string
      }
      pgis_asmvt_serialfn: {
        Args: { "": unknown }
        Returns: string
      }
      pgis_geometry_clusterintersecting_finalfn: {
        Args: { "": unknown }
        Returns: unknown[]
      }
      pgis_geometry_clusterwithin_finalfn: {
        Args: { "": unknown }
        Returns: unknown[]
      }
      pgis_geometry_collect_finalfn: {
        Args: { "": unknown }
        Returns: unknown
      }
      pgis_geometry_makeline_finalfn: {
        Args: { "": unknown }
        Returns: unknown
      }
      pgis_geometry_polygonize_finalfn: {
        Args: { "": unknown }
        Returns: unknown
      }
      pgis_geometry_union_parallel_finalfn: {
        Args: { "": unknown }
        Returns: unknown
      }
      pgis_geometry_union_parallel_serialfn: {
        Args: { "": unknown }
        Returns: string
      }
      point: {
        Args: { "": unknown }
        Returns: unknown
      }
      polygon: {
        Args: { "": unknown }
        Returns: unknown
      }
      populate_geometry_columns: {
        Args:
          | { tbl_oid: unknown; use_typmod?: boolean }
          | { use_typmod?: boolean }
        Returns: string
      }
      postgis_addbbox: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_constraint_dims: {
        Args: { geomschema: string; geomtable: string; geomcolumn: string }
        Returns: number
      }
      postgis_constraint_srid: {
        Args: { geomschema: string; geomtable: string; geomcolumn: string }
        Returns: number
      }
      postgis_constraint_type: {
        Args: { geomschema: string; geomtable: string; geomcolumn: string }
        Returns: string
      }
      postgis_dropbbox: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_extensions_upgrade: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_full_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_geos_noop: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_geos_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_getbbox: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_hasbbox: {
        Args: { "": unknown }
        Returns: boolean
      }
      postgis_index_supportfn: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_lib_build_date: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_lib_revision: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_lib_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_libjson_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_liblwgeom_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_libprotobuf_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_libxml_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_noop: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_proj_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_scripts_build_date: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_scripts_installed: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_scripts_released: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_svn_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_type_name: {
        Args: {
          geomname: string
          coord_dimension: number
          use_new_name?: boolean
        }
        Returns: string
      }
      postgis_typmod_dims: {
        Args: { "": number }
        Returns: number
      }
      postgis_typmod_srid: {
        Args: { "": number }
        Returns: number
      }
      postgis_typmod_type: {
        Args: { "": number }
        Returns: string
      }
      postgis_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_wagyu_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      restore_deleted_user: {
        Args: { user_id: string }
        Returns: boolean
      }
      spheroid_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      spheroid_out: {
        Args: { "": unknown }
        Returns: unknown
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
      st_3dlength: {
        Args: { "": unknown }
        Returns: number
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
      st_3dperimeter: {
        Args: { "": unknown }
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
      st_angle: {
        Args:
          | { line1: unknown; line2: unknown }
          | { pt1: unknown; pt2: unknown; pt3: unknown; pt4?: unknown }
        Returns: number
      }
      st_area: {
        Args:
          | { "": string }
          | { "": unknown }
          | { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_area2d: {
        Args: { "": unknown }
        Returns: number
      }
      st_asbinary: {
        Args: { "": unknown } | { "": unknown }
        Returns: string
      }
      st_asencodedpolyline: {
        Args: { geom: unknown; nprecision?: number }
        Returns: string
      }
      st_asewkb: {
        Args: { "": unknown }
        Returns: string
      }
      st_asewkt: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      st_asgeojson: {
        Args:
          | { "": string }
          | { geog: unknown; maxdecimaldigits?: number; options?: number }
          | { geom: unknown; maxdecimaldigits?: number; options?: number }
          | {
              r: Record<string, unknown>
              geom_column?: string
              maxdecimaldigits?: number
              pretty_bool?: boolean
            }
        Returns: string
      }
      st_asgml: {
        Args:
          | { "": string }
          | {
              geog: unknown
              maxdecimaldigits?: number
              options?: number
              nprefix?: string
              id?: string
            }
          | { geom: unknown; maxdecimaldigits?: number; options?: number }
          | {
              version: number
              geog: unknown
              maxdecimaldigits?: number
              options?: number
              nprefix?: string
              id?: string
            }
          | {
              version: number
              geom: unknown
              maxdecimaldigits?: number
              options?: number
              nprefix?: string
              id?: string
            }
        Returns: string
      }
      st_ashexewkb: {
        Args: { "": unknown }
        Returns: string
      }
      st_askml: {
        Args:
          | { "": string }
          | { geog: unknown; maxdecimaldigits?: number; nprefix?: string }
          | { geom: unknown; maxdecimaldigits?: number; nprefix?: string }
        Returns: string
      }
      st_aslatlontext: {
        Args: { geom: unknown; tmpl?: string }
        Returns: string
      }
      st_asmarc21: {
        Args: { geom: unknown; format?: string }
        Returns: string
      }
      st_asmvtgeom: {
        Args: {
          geom: unknown
          bounds: unknown
          extent?: number
          buffer?: number
          clip_geom?: boolean
        }
        Returns: unknown
      }
      st_assvg: {
        Args:
          | { "": string }
          | { geog: unknown; rel?: number; maxdecimaldigits?: number }
          | { geom: unknown; rel?: number; maxdecimaldigits?: number }
        Returns: string
      }
      st_astext: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      st_astwkb: {
        Args:
          | {
              geom: unknown[]
              ids: number[]
              prec?: number
              prec_z?: number
              prec_m?: number
              with_sizes?: boolean
              with_boxes?: boolean
            }
          | {
              geom: unknown
              prec?: number
              prec_z?: number
              prec_m?: number
              with_sizes?: boolean
              with_boxes?: boolean
            }
        Returns: string
      }
      st_asx3d: {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_azimuth: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_boundary: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_boundingdiagonal: {
        Args: { geom: unknown; fits?: boolean }
        Returns: unknown
      }
      st_buffer: {
        Args:
          | { geom: unknown; radius: number; options?: string }
          | { geom: unknown; radius: number; quadsegs: number }
        Returns: unknown
      }
      st_buildarea: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_centroid: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      st_cleangeometry: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_clipbybox2d: {
        Args: { geom: unknown; box: unknown }
        Returns: unknown
      }
      st_closestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_clusterintersecting: {
        Args: { "": unknown[] }
        Returns: unknown[]
      }
      st_collect: {
        Args: { "": unknown[] } | { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_collectionextract: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_collectionhomogenize: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_concavehull: {
        Args: {
          param_geom: unknown
          param_pctconvex: number
          param_allow_holes?: boolean
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
      st_convexhull: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_coorddim: {
        Args: { geometry: unknown }
        Returns: number
      }
      st_coveredby: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_covers: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_curvetoline: {
        Args: { geom: unknown; tol?: number; toltype?: number; flags?: number }
        Returns: unknown
      }
      st_delaunaytriangles: {
        Args: { g1: unknown; tolerance?: number; flags?: number }
        Returns: unknown
      }
      st_difference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_dimension: {
        Args: { "": unknown }
        Returns: number
      }
      st_disjoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_distance: {
        Args:
          | { geog1: unknown; geog2: unknown; use_spheroid?: boolean }
          | { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_distancesphere: {
        Args:
          | { geom1: unknown; geom2: unknown }
          | { geom1: unknown; geom2: unknown; radius: number }
        Returns: number
      }
      st_distancespheroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_dump: {
        Args: { "": unknown }
        Returns: Database["public"]["CompositeTypes"]["geometry_dump"][]
      }
      st_dumppoints: {
        Args: { "": unknown }
        Returns: Database["public"]["CompositeTypes"]["geometry_dump"][]
      }
      st_dumprings: {
        Args: { "": unknown }
        Returns: Database["public"]["CompositeTypes"]["geometry_dump"][]
      }
      st_dumpsegments: {
        Args: { "": unknown }
        Returns: Database["public"]["CompositeTypes"]["geometry_dump"][]
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
      st_endpoint: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_envelope: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_equals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_expand: {
        Args:
          | { box: unknown; dx: number; dy: number }
          | { box: unknown; dx: number; dy: number; dz?: number }
          | { geom: unknown; dx: number; dy: number; dz?: number; dm?: number }
        Returns: unknown
      }
      st_exteriorring: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_flipcoordinates: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_force2d: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_force3d: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force3dm: {
        Args: { geom: unknown; mvalue?: number }
        Returns: unknown
      }
      st_force3dz: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force4d: {
        Args: { geom: unknown; zvalue?: number; mvalue?: number }
        Returns: unknown
      }
      st_forcecollection: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_forcecurve: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_forcepolygonccw: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_forcepolygoncw: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_forcerhr: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_forcesfs: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_generatepoints: {
        Args:
          | { area: unknown; npoints: number }
          | { area: unknown; npoints: number; seed: number }
        Returns: unknown
      }
      st_geogfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_geogfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_geographyfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_geohash: {
        Args:
          | { geog: unknown; maxchars?: number }
          | { geom: unknown; maxchars?: number }
        Returns: string
      }
      st_geomcollfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomcollfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_geometricmedian: {
        Args: {
          g: unknown
          tolerance?: number
          max_iter?: number
          fail_if_not_converged?: boolean
        }
        Returns: unknown
      }
      st_geometryfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_geometrytype: {
        Args: { "": unknown }
        Returns: string
      }
      st_geomfromewkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfromewkt: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfromgeojson: {
        Args: { "": Json } | { "": Json } | { "": string }
        Returns: unknown
      }
      st_geomfromgml: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfromkml: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfrommarc21: {
        Args: { marc21xml: string }
        Returns: unknown
      }
      st_geomfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfromtwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_gmltosql: {
        Args: { "": string }
        Returns: unknown
      }
      st_hasarc: {
        Args: { geometry: unknown }
        Returns: boolean
      }
      st_hausdorffdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_hexagon: {
        Args: { size: number; cell_i: number; cell_j: number; origin?: unknown }
        Returns: unknown
      }
      st_hexagongrid: {
        Args: { size: number; bounds: unknown }
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
      st_intersects: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_isclosed: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_iscollection: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_isempty: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_ispolygonccw: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_ispolygoncw: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_isring: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_issimple: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_isvalid: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_isvaliddetail: {
        Args: { geom: unknown; flags?: number }
        Returns: Database["public"]["CompositeTypes"]["valid_detail"]
      }
      st_isvalidreason: {
        Args: { "": unknown }
        Returns: string
      }
      st_isvalidtrajectory: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_length: {
        Args:
          | { "": string }
          | { "": unknown }
          | { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_length2d: {
        Args: { "": unknown }
        Returns: number
      }
      st_letters: {
        Args: { letters: string; font?: Json }
        Returns: unknown
      }
      st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      st_linefromencodedpolyline: {
        Args: { txtin: string; nprecision?: number }
        Returns: unknown
      }
      st_linefrommultipoint: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_linefromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_linefromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_linelocatepoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_linemerge: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_linestringfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_linetocurve: {
        Args: { geometry: unknown }
        Returns: unknown
      }
      st_locatealong: {
        Args: { geometry: unknown; measure: number; leftrightoffset?: number }
        Returns: unknown
      }
      st_locatebetween: {
        Args: {
          geometry: unknown
          frommeasure: number
          tomeasure: number
          leftrightoffset?: number
        }
        Returns: unknown
      }
      st_locatebetweenelevations: {
        Args: { geometry: unknown; fromelevation: number; toelevation: number }
        Returns: unknown
      }
      st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_m: {
        Args: { "": unknown }
        Returns: number
      }
      st_makebox2d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makeline: {
        Args: { "": unknown[] } | { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makepolygon: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_makevalid: {
        Args: { "": unknown } | { geom: unknown; params: string }
        Returns: unknown
      }
      st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_maximuminscribedcircle: {
        Args: { "": unknown }
        Returns: Record<string, unknown>
      }
      st_memsize: {
        Args: { "": unknown }
        Returns: number
      }
      st_minimumboundingcircle: {
        Args: { inputgeom: unknown; segs_per_quarter?: number }
        Returns: unknown
      }
      st_minimumboundingradius: {
        Args: { "": unknown }
        Returns: Record<string, unknown>
      }
      st_minimumclearance: {
        Args: { "": unknown }
        Returns: number
      }
      st_minimumclearanceline: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_mlinefromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_mlinefromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_mpointfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_mpointfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_mpolyfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_mpolyfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_multi: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_multilinefromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_multilinestringfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_multipointfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_multipointfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_multipolyfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_multipolygonfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_ndims: {
        Args: { "": unknown }
        Returns: number
      }
      st_node: {
        Args: { g: unknown }
        Returns: unknown
      }
      st_normalize: {
        Args: { geom: unknown }
        Returns: unknown
      }
      st_npoints: {
        Args: { "": unknown }
        Returns: number
      }
      st_nrings: {
        Args: { "": unknown }
        Returns: number
      }
      st_numgeometries: {
        Args: { "": unknown }
        Returns: number
      }
      st_numinteriorring: {
        Args: { "": unknown }
        Returns: number
      }
      st_numinteriorrings: {
        Args: { "": unknown }
        Returns: number
      }
      st_numpatches: {
        Args: { "": unknown }
        Returns: number
      }
      st_numpoints: {
        Args: { "": unknown }
        Returns: number
      }
      st_offsetcurve: {
        Args: { line: unknown; distance: number; params?: string }
        Returns: unknown
      }
      st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_orientedenvelope: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_perimeter: {
        Args: { "": unknown } | { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_perimeter2d: {
        Args: { "": unknown }
        Returns: number
      }
      st_pointfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_pointfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_pointm: {
        Args: {
          xcoordinate: number
          ycoordinate: number
          mcoordinate: number
          srid?: number
        }
        Returns: unknown
      }
      st_pointonsurface: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_points: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_pointz: {
        Args: {
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
          srid?: number
        }
        Returns: unknown
      }
      st_pointzm: {
        Args: {
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
          mcoordinate: number
          srid?: number
        }
        Returns: unknown
      }
      st_polyfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_polyfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_polygonfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_polygonfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_polygonize: {
        Args: { "": unknown[] }
        Returns: unknown
      }
      st_project: {
        Args: { geog: unknown; distance: number; azimuth: number }
        Returns: unknown
      }
      st_quantizecoordinates: {
        Args: {
          g: unknown
          prec_x: number
          prec_y?: number
          prec_z?: number
          prec_m?: number
        }
        Returns: unknown
      }
      st_reduceprecision: {
        Args: { geom: unknown; gridsize: number }
        Returns: unknown
      }
      st_relate: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: string
      }
      st_removerepeatedpoints: {
        Args: { geom: unknown; tolerance?: number }
        Returns: unknown
      }
      st_reverse: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_segmentize: {
        Args: { geog: unknown; max_segment_length: number }
        Returns: unknown
      }
      st_setsrid: {
        Args: { geog: unknown; srid: number } | { geom: unknown; srid: number }
        Returns: unknown
      }
      st_sharedpaths: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_shiftlongitude: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_shortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_simplifypolygonhull: {
        Args: { geom: unknown; vertex_fraction: number; is_outer?: boolean }
        Returns: unknown
      }
      st_split: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_square: {
        Args: { size: number; cell_i: number; cell_j: number; origin?: unknown }
        Returns: unknown
      }
      st_squaregrid: {
        Args: { size: number; bounds: unknown }
        Returns: Record<string, unknown>[]
      }
      st_srid: {
        Args: { geog: unknown } | { geom: unknown }
        Returns: number
      }
      st_startpoint: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_subdivide: {
        Args: { geom: unknown; maxvertices?: number; gridsize?: number }
        Returns: unknown[]
      }
      st_summary: {
        Args: { "": unknown } | { "": unknown }
        Returns: string
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
          zoom: number
          x: number
          y: number
          bounds?: unknown
          margin?: number
        }
        Returns: unknown
      }
      st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_transform: {
        Args:
          | { geom: unknown; from_proj: string; to_proj: string }
          | { geom: unknown; from_proj: string; to_srid: number }
          | { geom: unknown; to_proj: string }
        Returns: unknown
      }
      st_triangulatepolygon: {
        Args: { g1: unknown }
        Returns: unknown
      }
      st_union: {
        Args:
          | { "": unknown[] }
          | { geom1: unknown; geom2: unknown }
          | { geom1: unknown; geom2: unknown; gridsize: number }
        Returns: unknown
      }
      st_voronoilines: {
        Args: { g1: unknown; tolerance?: number; extend_to?: unknown }
        Returns: unknown
      }
      st_voronoipolygons: {
        Args: { g1: unknown; tolerance?: number; extend_to?: unknown }
        Returns: unknown
      }
      st_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_wkbtosql: {
        Args: { wkb: string }
        Returns: unknown
      }
      st_wkttosql: {
        Args: { "": string }
        Returns: unknown
      }
      st_wrapx: {
        Args: { geom: unknown; wrap: number; move: number }
        Returns: unknown
      }
      st_x: {
        Args: { "": unknown }
        Returns: number
      }
      st_xmax: {
        Args: { "": unknown }
        Returns: number
      }
      st_xmin: {
        Args: { "": unknown }
        Returns: number
      }
      st_y: {
        Args: { "": unknown }
        Returns: number
      }
      st_ymax: {
        Args: { "": unknown }
        Returns: number
      }
      st_ymin: {
        Args: { "": unknown }
        Returns: number
      }
      st_z: {
        Args: { "": unknown }
        Returns: number
      }
      st_zmax: {
        Args: { "": unknown }
        Returns: number
      }
      st_zmflag: {
        Args: { "": unknown }
        Returns: number
      }
      st_zmin: {
        Args: { "": unknown }
        Returns: number
      }
      text: {
        Args: { "": unknown }
        Returns: string
      }
      unlockrows: {
        Args: { "": string }
        Returns: number
      }
      update_lead_field: {
        Args: { lead_id: string; field_name: string; field_value: string }
        Returns: Json
      }
      updategeometrysrid: {
        Args: {
          catalogn_name: string
          schema_name: string
          table_name: string
          column_name: string
          new_srid_in: number
        }
        Returns: string
      }
    }
    Enums: {
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
      sms_opt_status: "opted_in" | "opted_out" | "pending" | "new"
      user_role: "admin" | "standard" | "user" | "support"
    }
    CompositeTypes: {
      geometry_dump: {
        path: number[] | null
        geom: unknown | null
      }
      valid_detail: {
        valid: boolean | null
        reason: string | null
        location: unknown | null
      }
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      lead_status: ["active", "inactive", "do_not_contact", "new", "follow-up"],
      message_channel: ["email", "sms"],
      message_direction: ["outbound", "inbound"],
      message_status: ["sent", "delivered", "read", "error"],
      plan_tier: ["free", "pro", "enterprise"],
      sms_opt_status: ["opted_in", "opted_out", "pending", "new"],
      user_role: ["admin", "standard", "user", "support"],
    },
  },
} as const
