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
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          level: string
          message: string | null
          meta: Json | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          level?: string
          message?: string | null
          meta?: Json | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          level?: string
          message?: string | null
          meta?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      agent_settings: {
        Row: {
          ai_extra_instructions: string | null
          autopilot_enabled: boolean
          content_pillars: string[]
          daily_post_time: string
          notify_email: boolean
          posts_per_week: number
          preferred_hashtags: string[]
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_extra_instructions?: string | null
          autopilot_enabled?: boolean
          content_pillars?: string[]
          daily_post_time?: string
          notify_email?: boolean
          posts_per_week?: number
          preferred_hashtags?: string[]
          timezone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_extra_instructions?: string | null
          autopilot_enabled?: boolean
          content_pillars?: string[]
          daily_post_time?: string
          notify_email?: boolean
          posts_per_week?: number
          preferred_hashtags?: string[]
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      linkedin_accounts: {
        Row: {
          access_token: string
          created_at: string
          expires_at: string | null
          id: string
          linkedin_name: string | null
          linkedin_picture: string | null
          linkedin_urn: string
          refresh_token: string | null
          scope: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          expires_at?: string | null
          id?: string
          linkedin_name?: string | null
          linkedin_picture?: string | null
          linkedin_urn: string
          refresh_token?: string | null
          scope?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          linkedin_name?: string | null
          linkedin_picture?: string | null
          linkedin_urn?: string
          refresh_token?: string | null
          scope?: string | null
          user_id?: string
        }
        Relationships: []
      }
      post_analytics: {
        Row: {
          captured_at: string
          clicks: number | null
          comments: number | null
          id: string
          impressions: number | null
          likes: number | null
          post_id: string
          shares: number | null
          user_id: string
        }
        Insert: {
          captured_at?: string
          clicks?: number | null
          comments?: number | null
          id?: string
          impressions?: number | null
          likes?: number | null
          post_id: string
          shares?: number | null
          user_id: string
        }
        Update: {
          captured_at?: string
          clicks?: number | null
          comments?: number | null
          id?: string
          impressions?: number | null
          likes?: number | null
          post_id?: string
          shares?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_analytics_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          content: string
          content_hash: string | null
          created_at: string
          error_message: string | null
          hashtags: string[] | null
          hook: string | null
          id: string
          linkedin_post_url: string | null
          linkedin_post_urn: string | null
          media_urls: string[] | null
          published_at: string | null
          retry_count: number
          scheduled_for: string | null
          status: Database["public"]["Enums"]["post_status"]
          topic: string | null
          type: Database["public"]["Enums"]["post_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          content_hash?: string | null
          created_at?: string
          error_message?: string | null
          hashtags?: string[] | null
          hook?: string | null
          id?: string
          linkedin_post_url?: string | null
          linkedin_post_urn?: string | null
          media_urls?: string[] | null
          published_at?: string | null
          retry_count?: number
          scheduled_for?: string | null
          status?: Database["public"]["Enums"]["post_status"]
          topic?: string | null
          type?: Database["public"]["Enums"]["post_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          content_hash?: string | null
          created_at?: string
          error_message?: string | null
          hashtags?: string[] | null
          hook?: string | null
          id?: string
          linkedin_post_url?: string | null
          linkedin_post_urn?: string | null
          media_urls?: string[] | null
          published_at?: string | null
          retry_count?: number
          scheduled_for?: string | null
          status?: Database["public"]["Enums"]["post_status"]
          topic?: string | null
          type?: Database["public"]["Enums"]["post_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          brand_voice: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          niche: string | null
          target_audience: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          brand_voice?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          niche?: string | null
          target_audience?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          brand_voice?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          niche?: string | null
          target_audience?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      post_status:
        | "draft"
        | "scheduled"
        | "publishing"
        | "published"
        | "failed"
        | "cancelled"
      post_type: "text" | "image" | "carousel" | "article"
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
      post_status: [
        "draft",
        "scheduled",
        "publishing",
        "published",
        "failed",
        "cancelled",
      ],
      post_type: ["text", "image", "carousel", "article"],
    },
  },
} as const
