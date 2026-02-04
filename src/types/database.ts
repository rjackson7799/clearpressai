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
      approvals: {
        Row: {
          content_item_id: string
          created_at: string | null
          feedback: string | null
          id: string
          status: string
          user_id: string
          version_id: string
        }
        Insert: {
          content_item_id: string
          created_at?: string | null
          feedback?: string | null
          id?: string
          status: string
          user_id: string
          version_id: string
        }
        Update: {
          content_item_id?: string
          created_at?: string | null
          feedback?: string | null
          id?: string
          status?: string
          user_id?: string
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "approvals_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approvals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approvals_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "content_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown
          new_values: Json | null
          old_values: Json | null
          organization_id: string
          resource_id: string | null
          resource_type: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          organization_id: string
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          organization_id?: string
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      client_industries: {
        Row: {
          client_id: string
          created_at: string | null
          id: string
          industry_id: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          id?: string
          industry_id: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          id?: string
          industry_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_industries_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_industries_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "industries"
            referencedColumns: ["id"]
          },
        ]
      }
      client_suggestions: {
        Row: {
          after_text: string
          before_text: string
          content_item_id: string
          created_at: string | null
          id: string
          position: Json
          reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          user_id: string
          version_id: string
        }
        Insert: {
          after_text: string
          before_text: string
          content_item_id: string
          created_at?: string | null
          id?: string
          position: Json
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          user_id: string
          version_id: string
        }
        Update: {
          after_text?: string
          before_text?: string
          content_item_id?: string
          created_at?: string | null
          id?: string
          position?: Json
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          user_id?: string
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_suggestions_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_suggestions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_suggestions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_suggestions_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "content_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      client_users: {
        Row: {
          client_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_users_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          logo_url: string | null
          name: string
          organization_id: string
          settings: Json | null
          style_profile: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          organization_id: string
          settings?: Json | null
          style_profile?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          organization_id?: string
          settings?: Json | null
          style_profile?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          content_item_id: string
          created_at: string | null
          id: string
          parent_id: string | null
          position: Json | null
          resolved: boolean | null
          updated_at: string | null
          user_id: string
          version_id: string | null
        }
        Insert: {
          content: string
          content_item_id: string
          created_at?: string | null
          id?: string
          parent_id?: string | null
          position?: Json | null
          resolved?: boolean | null
          updated_at?: string | null
          user_id: string
          version_id?: string | null
        }
        Update: {
          content?: string
          content_item_id?: string
          created_at?: string | null
          id?: string
          parent_id?: string | null
          position?: Json | null
          resolved?: boolean | null
          updated_at?: string | null
          user_id?: string
          version_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "content_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      content_items: {
        Row: {
          created_at: string | null
          created_by: string
          current_version_id: string | null
          id: string
          locked_at: string | null
          locked_by: string | null
          project_id: string
          settings: Json | null
          status: Database["public"]["Enums"]["content_status"] | null
          title: string
          type: Database["public"]["Enums"]["content_type"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          current_version_id?: string | null
          id?: string
          locked_at?: string | null
          locked_by?: string | null
          project_id: string
          settings?: Json | null
          status?: Database["public"]["Enums"]["content_status"] | null
          title: string
          type: Database["public"]["Enums"]["content_type"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          current_version_id?: string | null
          id?: string
          locked_at?: string | null
          locked_by?: string | null
          project_id?: string
          settings?: Json | null
          status?: Database["public"]["Enums"]["content_status"] | null
          title?: string
          type?: Database["public"]["Enums"]["content_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_items_current_version_fkey"
            columns: ["current_version_id"]
            isOneToOne: false
            referencedRelation: "content_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_items_locked_by_fkey"
            columns: ["locked_by"]
            isOneToOne: false
            referencedRelation: "users"
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
      content_versions: {
        Row: {
          compliance_details: Json | null
          compliance_score: number | null
          content: Json
          content_item_id: string
          created_at: string | null
          created_by: string
          generation_params: Json | null
          id: string
          is_milestone: boolean | null
          milestone_name: string | null
          version_number: number
          word_count: number | null
        }
        Insert: {
          compliance_details?: Json | null
          compliance_score?: number | null
          content: Json
          content_item_id: string
          created_at?: string | null
          created_by: string
          generation_params?: Json | null
          id?: string
          is_milestone?: boolean | null
          milestone_name?: string | null
          version_number?: number
          word_count?: number | null
        }
        Update: {
          compliance_details?: Json | null
          compliance_score?: number | null
          content?: Json
          content_item_id?: string
          created_at?: string | null
          created_by?: string
          generation_params?: Json | null
          id?: string
          is_milestone?: boolean | null
          milestone_name?: string | null
          version_number?: number
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "content_versions_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      files: {
        Row: {
          category: string | null
          client_id: string | null
          content_text: string | null
          created_at: string | null
          extracted_at: string | null
          extraction_status: string | null
          id: string
          mime_type: string
          name: string
          organization_id: string
          project_id: string | null
          size_bytes: number
          storage_path: string
          uploaded_by: string
        }
        Insert: {
          category?: string | null
          client_id?: string | null
          content_text?: string | null
          created_at?: string | null
          extracted_at?: string | null
          extraction_status?: string | null
          id?: string
          mime_type: string
          name: string
          organization_id: string
          project_id?: string | null
          size_bytes: number
          storage_path: string
          uploaded_by: string
        }
        Update: {
          category?: string | null
          client_id?: string | null
          content_text?: string | null
          created_at?: string | null
          extracted_at?: string | null
          extraction_status?: string | null
          id?: string
          mime_type?: string
          name?: string
          organization_id?: string
          project_id?: string | null
          size_bytes?: number
          storage_path?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "files_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      industries: {
        Row: {
          compliance_rules: string | null
          config: Json | null
          created_at: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name_en: string
          name_ja: string
          prompts: Json | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          compliance_rules?: string | null
          config?: Json | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name_en: string
          name_ja: string
          prompts?: Json | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          compliance_rules?: string | null
          config?: Json | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name_en?: string
          name_ja?: string
          prompts?: Json | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string | null
          id: string
          metadata: Json | null
          read: boolean | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          read?: boolean | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          read?: boolean | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string | null
          id: string
          logo_url: string | null
          name: string
          settings: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name: string
          settings?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          settings?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          brief: string
          client_id: string
          created_at: string | null
          created_by: string
          expanded_brief: Json | null
          id: string
          name: string
          organization_id: string
          status: Database["public"]["Enums"]["project_status"] | null
          target_date: string | null
          updated_at: string | null
          urgency: Database["public"]["Enums"]["urgency_level"] | null
        }
        Insert: {
          brief: string
          client_id: string
          created_at?: string | null
          created_by: string
          expanded_brief?: Json | null
          id?: string
          name: string
          organization_id: string
          status?: Database["public"]["Enums"]["project_status"] | null
          target_date?: string | null
          updated_at?: string | null
          urgency?: Database["public"]["Enums"]["urgency_level"] | null
        }
        Update: {
          brief?: string
          client_id?: string
          created_at?: string | null
          created_by?: string
          expanded_brief?: Json | null
          id?: string
          name?: string
          organization_id?: string
          status?: Database["public"]["Enums"]["project_status"] | null
          target_date?: string | null
          updated_at?: string | null
          urgency?: Database["public"]["Enums"]["urgency_level"] | null
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
            foreignKeyName: "projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          name: string
          organization_id: string
          preferences: Json | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          id: string
          is_active?: boolean | null
          name: string
          organization_id: string
          preferences?: Json | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string
          preferences?: Json | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_organization_id: { Args: never; Returns: string }
      has_project_access: { Args: { project_id: string }; Returns: boolean }
      is_pr_admin: { Args: never; Returns: boolean }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      content_status:
        | "draft"
        | "submitted"
        | "in_review"
        | "needs_revision"
        | "approved"
      content_type:
        | "press_release"
        | "blog_post"
        | "social_media"
        | "internal_memo"
        | "faq"
        | "executive_statement"
      notification_type:
        | "project_request"
        | "content_submitted"
        | "comment_added"
        | "approval_needed"
        | "content_approved"
        | "deadline_reminder"
      project_status:
        | "requested"
        | "in_progress"
        | "in_review"
        | "approved"
        | "completed"
        | "archived"
      urgency_level: "standard" | "priority" | "urgent" | "crisis"
      user_role: "pr_admin" | "pr_staff" | "client_user"
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
      content_status: [
        "draft",
        "submitted",
        "in_review",
        "needs_revision",
        "approved",
      ],
      content_type: [
        "press_release",
        "blog_post",
        "social_media",
        "internal_memo",
        "faq",
        "executive_statement",
      ],
      notification_type: [
        "project_request",
        "content_submitted",
        "comment_added",
        "approval_needed",
        "content_approved",
        "deadline_reminder",
      ],
      project_status: [
        "requested",
        "in_progress",
        "in_review",
        "approved",
        "completed",
        "archived",
      ],
      urgency_level: ["standard", "priority", "urgent", "crisis"],
      user_role: ["pr_admin", "pr_staff", "client_user"],
    },
  },
} as const
