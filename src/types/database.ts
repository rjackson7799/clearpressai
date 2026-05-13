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
    PostgrestVersion: "14.5"
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
      audit_reports: {
        Row: {
          created_at: string
          created_by: string
          finalized_at: string | null
          id: string
          previous_version_id: string | null
          project_id: string
          report_id_display: string
          reviewer_comments: string | null
          status: string
          version: string
        }
        Insert: {
          created_at?: string
          created_by: string
          finalized_at?: string | null
          id?: string
          previous_version_id?: string | null
          project_id: string
          report_id_display: string
          reviewer_comments?: string | null
          status?: string
          version?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          finalized_at?: string | null
          id?: string
          previous_version_id?: string | null
          project_id?: string
          report_id_display?: string
          reviewer_comments?: string | null
          status?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_reports_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_reports_previous_version_id_fkey"
            columns: ["previous_version_id"]
            isOneToOne: false
            referencedRelation: "audit_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_reports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_reports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_signatures: {
        Row: {
          audit_report_id: string
          id: string
          signature_hash: string
          signed_at: string
          signer_id: string
          signer_name_snapshot: string
          signer_role_snapshot: string
        }
        Insert: {
          audit_report_id: string
          id?: string
          signature_hash: string
          signed_at?: string
          signer_id: string
          signer_name_snapshot: string
          signer_role_snapshot: string
        }
        Update: {
          audit_report_id?: string
          id?: string
          signature_hash?: string
          signed_at?: string
          signer_id?: string
          signer_name_snapshot?: string
          signer_role_snapshot?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_signatures_audit_report_id_fkey"
            columns: ["audit_report_id"]
            isOneToOne: false
            referencedRelation: "audit_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_signatures_signer_id_fkey"
            columns: ["signer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_trail_events: {
        Row: {
          actor_id: string | null
          actor_name_snapshot: string | null
          actor_type: string
          audit_report_id: string | null
          details: Json
          event_type: string
          id: string
          model_used: string | null
          occurred_at: string
          project_id: string
        }
        Insert: {
          actor_id?: string | null
          actor_name_snapshot?: string | null
          actor_type: string
          audit_report_id?: string | null
          details?: Json
          event_type: string
          id?: string
          model_used?: string | null
          occurred_at?: string
          project_id: string
        }
        Update: {
          actor_id?: string | null
          actor_name_snapshot?: string | null
          actor_type?: string
          audit_report_id?: string | null
          details?: Json
          event_type?: string
          id?: string
          model_used?: string | null
          occurred_at?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_trail_events_audit_report_id_fkey"
            columns: ["audit_report_id"]
            isOneToOne: false
            referencedRelation: "audit_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_trail_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_trail_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_voice_guidelines: {
        Row: {
          active: boolean
          client_id: string
          created_at: string
          guideline_text: string
          id: string
          source_reference_id: string | null
          source_type: string
        }
        Insert: {
          active?: boolean
          client_id: string
          created_at?: string
          guideline_text: string
          id?: string
          source_reference_id?: string | null
          source_type: string
        }
        Update: {
          active?: boolean
          client_id?: string
          created_at?: string
          guideline_text?: string
          id?: string
          source_reference_id?: string | null
          source_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_voice_guidelines_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_voice_guidelines_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "project_summary"
            referencedColumns: ["client_id"]
          },
        ]
      }
      brand_voice_profiles: {
        Row: {
          client_id: string
          created_at: string
          extraction_run_id: string | null
          id: string
          last_extracted_at: string | null
          length_norms: Json
          model_used: string | null
          notes: string | null
          preferred_vocabulary: Json
          prompt_version: string | null
          signature_phrases: Json
          stylistic_patterns: string
          tone_keywords: Json
          updated_at: string
          user_edited: boolean
          words_to_avoid: Json
        }
        Insert: {
          client_id: string
          created_at?: string
          extraction_run_id?: string | null
          id?: string
          last_extracted_at?: string | null
          length_norms?: Json
          model_used?: string | null
          notes?: string | null
          preferred_vocabulary?: Json
          prompt_version?: string | null
          signature_phrases?: Json
          stylistic_patterns?: string
          tone_keywords?: Json
          updated_at?: string
          user_edited?: boolean
          words_to_avoid?: Json
        }
        Update: {
          client_id?: string
          created_at?: string
          extraction_run_id?: string | null
          id?: string
          last_extracted_at?: string | null
          length_norms?: Json
          model_used?: string | null
          notes?: string | null
          preferred_vocabulary?: Json
          prompt_version?: string | null
          signature_phrases?: Json
          stylistic_patterns?: string
          tone_keywords?: Json
          updated_at?: string
          user_edited?: boolean
          words_to_avoid?: Json
        }
        Relationships: [
          {
            foreignKeyName: "brand_voice_profiles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_voice_profiles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "project_summary"
            referencedColumns: ["client_id"]
          },
        ]
      }
      brand_voice_samples: {
        Row: {
          byte_size: number
          client_id: string
          content_text: string | null
          filename: string
          id: string
          mime_type: string
          storage_path: string
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          byte_size: number
          client_id: string
          content_text?: string | null
          filename: string
          id?: string
          mime_type: string
          storage_path: string
          uploaded_at?: string
          uploaded_by: string
        }
        Update: {
          byte_size?: number
          client_id?: string
          content_text?: string | null
          filename?: string
          id?: string
          mime_type?: string
          storage_path?: string
          uploaded_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_voice_samples_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_voice_samples_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "project_summary"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "brand_voice_samples_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      client_feedback: {
        Row: {
          chosen_variant_id: string
          feedback_token_id: string
          free_text_comment: string | null
          id: string
          needs_rework: boolean
          submitted_at: string
          what_could_improve: Json
          what_worked: Json
        }
        Insert: {
          chosen_variant_id: string
          feedback_token_id: string
          free_text_comment?: string | null
          id?: string
          needs_rework?: boolean
          submitted_at?: string
          what_could_improve?: Json
          what_worked?: Json
        }
        Update: {
          chosen_variant_id?: string
          feedback_token_id?: string
          free_text_comment?: string | null
          id?: string
          needs_rework?: boolean
          submitted_at?: string
          what_could_improve?: Json
          what_worked?: Json
        }
        Relationships: [
          {
            foreignKeyName: "client_feedback_chosen_variant_id_fkey"
            columns: ["chosen_variant_id"]
            isOneToOne: false
            referencedRelation: "content_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_feedback_feedback_token_id_fkey"
            columns: ["feedback_token_id"]
            isOneToOne: false
            referencedRelation: "feedback_tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          created_at: string
          created_by: string
          id: string
          industry: string
          name: string
          name_en: string | null
          notes: string | null
          primary_contact_email: string | null
          primary_contact_name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          industry?: string
          name: string
          name_en?: string | null
          notes?: string | null
          primary_contact_email?: string | null
          primary_contact_name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          industry?: string
          name?: string
          name_en?: string | null
          notes?: string | null
          primary_contact_email?: string | null
          primary_contact_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_findings: {
        Row: {
          created_at: string
          explanation: string
          id: string
          paragraph_index: number | null
          regulation_reference: string
          resolution_status: string
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          source_text: string
          suggested_correction: string | null
          variant_id: string
        }
        Insert: {
          created_at?: string
          explanation: string
          id?: string
          paragraph_index?: number | null
          regulation_reference: string
          resolution_status?: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity: string
          source_text: string
          suggested_correction?: string | null
          variant_id: string
        }
        Update: {
          created_at?: string
          explanation?: string
          id?: string
          paragraph_index?: number | null
          regulation_reference?: string
          resolution_status?: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          source_text?: string
          suggested_correction?: string | null
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_findings_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_findings_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "content_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      content_items: {
        Row: {
          brief_constraints: string | null
          brief_data_points: Json
          brief_free_text: string
          brief_key_messages: Json
          brief_quotes: Json
          content_sub_type: string
          content_type: string
          created_at: string
          id: string
          language: string
          project_id: string
          variation_axis: string
        }
        Insert: {
          brief_constraints?: string | null
          brief_data_points?: Json
          brief_free_text: string
          brief_key_messages?: Json
          brief_quotes?: Json
          content_sub_type?: string
          content_type: string
          created_at?: string
          id?: string
          language?: string
          project_id: string
          variation_axis?: string
        }
        Update: {
          brief_constraints?: string | null
          brief_data_points?: Json
          brief_free_text?: string
          brief_key_messages?: Json
          brief_quotes?: Json
          content_sub_type?: string
          content_type?: string
          created_at?: string
          id?: string
          language?: string
          project_id?: string
          variation_axis?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      content_variants: {
        Row: {
          body_html: string | null
          body_text: string
          char_count: number
          content_item_id: string
          created_at: string
          generation_params: Json | null
          id: string
          internal_approved: boolean
          internal_approved_at: string | null
          internal_approved_by: string | null
          model_used: string
          reading_time_seconds: number
          updated_at: string
          variant_index: number
          variant_label: string
        }
        Insert: {
          body_html?: string | null
          body_text: string
          char_count?: number
          content_item_id: string
          created_at?: string
          generation_params?: Json | null
          id?: string
          internal_approved?: boolean
          internal_approved_at?: string | null
          internal_approved_by?: string | null
          model_used: string
          reading_time_seconds?: number
          updated_at?: string
          variant_index: number
          variant_label: string
        }
        Update: {
          body_html?: string | null
          body_text?: string
          char_count?: number
          content_item_id?: string
          created_at?: string
          generation_params?: Json | null
          id?: string
          internal_approved?: boolean
          internal_approved_at?: string | null
          internal_approved_by?: string | null
          model_used?: string
          reading_time_seconds?: number
          updated_at?: string
          variant_index?: number
          variant_label?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_variants_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_variants_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "project_summary"
            referencedColumns: ["content_item_id"]
          },
          {
            foreignKeyName: "content_variants_internal_approved_by_fkey"
            columns: ["internal_approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      deliveries: {
        Row: {
          attachment_format: string
          bcc_emails: Json
          body_html: string
          body_text: string | null
          cc_emails: Json
          created_at: string
          id: string
          project_id: string
          recipient_email: string
          recipient_name: string | null
          sent_at: string | null
          sent_by: string | null
          status: string
          subject: string
          variant_ids_attached: Json
        }
        Insert: {
          attachment_format?: string
          bcc_emails?: Json
          body_html: string
          body_text?: string | null
          cc_emails?: Json
          created_at?: string
          id?: string
          project_id: string
          recipient_email: string
          recipient_name?: string | null
          sent_at?: string | null
          sent_by?: string | null
          status?: string
          subject: string
          variant_ids_attached?: Json
        }
        Update: {
          attachment_format?: string
          bcc_emails?: Json
          body_html?: string
          body_text?: string | null
          cc_emails?: Json
          created_at?: string
          id?: string
          project_id?: string
          recipient_email?: string
          recipient_name?: string | null
          sent_at?: string | null
          sent_by?: string | null
          status?: string
          subject?: string
          variant_ids_attached?: Json
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_tokens: {
        Row: {
          created_at: string
          delivery_id: string
          expires_at: string
          id: string
          reminder_sent_at: string | null
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          delivery_id: string
          expires_at: string
          id?: string
          reminder_sent_at?: string | null
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          delivery_id?: string
          expires_at?: string
          id?: string
          reminder_sent_at?: string | null
          token?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_tokens_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "deliveries"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          client_id: string
          created_at: string
          created_by: string
          deadline: string | null
          id: string
          name: string
          status: string
          updated_at: string
          urgency: string
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by: string
          deadline?: string | null
          id?: string
          name: string
          status?: string
          updated_at?: string
          urgency?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string
          deadline?: string | null
          id?: string
          name?: string
          status?: string
          updated_at?: string
          urgency?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "project_summary"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_sends: {
        Row: {
          created_at: string
          delivery_id: string
          error_message: string | null
          id: string
          processed: boolean
          processed_at: string | null
          scheduled_for: string
        }
        Insert: {
          created_at?: string
          delivery_id: string
          error_message?: string | null
          id?: string
          processed?: boolean
          processed_at?: string | null
          scheduled_for: string
        }
        Update: {
          created_at?: string
          delivery_id?: string
          error_message?: string | null
          id?: string
          processed?: boolean
          processed_at?: string | null
          scheduled_for?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_sends_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "deliveries"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string
          full_name: string
          full_name_kana: string | null
          id: string
          language_pref: string
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          full_name_kana?: string | null
          id: string
          language_pref?: string
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          full_name_kana?: string | null
          id?: string
          language_pref?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      project_summary: {
        Row: {
          client_id: string | null
          client_name: string | null
          content_item_id: string | null
          content_sub_type: string | null
          content_type: string | null
          created_at: string | null
          deadline: string | null
          id: string | null
          last_generated_at: string | null
          name: string | null
          status: string | null
          urgency: string | null
          variants_approved: number | null
          variants_total: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      regenerate_variant: {
        Args: {
          p_body_text: string
          p_char_count: number
          p_content_item_id: string
          p_generation_params: Json
          p_model_used: string
          p_reading_time_seconds: number
          p_variant_index: number
          p_variant_label: string
        }
        Returns: {
          body_html: string | null
          body_text: string
          char_count: number
          content_item_id: string
          created_at: string
          generation_params: Json | null
          id: string
          internal_approved: boolean
          internal_approved_at: string | null
          internal_approved_by: string | null
          model_used: string
          reading_time_seconds: number
          updated_at: string
          variant_index: number
          variant_label: string
        }
        SetofOptions: {
          from: "*"
          to: "content_variants"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
