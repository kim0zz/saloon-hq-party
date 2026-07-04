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
      announcement_comments: {
        Row: {
          announcement_id: string
          content: string
          created_at: string
          guest_id: string | null
          id: string
        }
        Insert: {
          announcement_id: string
          content: string
          created_at?: string
          guest_id?: string | null
          id?: string
        }
        Update: {
          announcement_id?: string
          content?: string
          created_at?: string
          guest_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_comments_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcement_comments_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          content: string
          created_at: string
          created_by_admin: boolean
          id: string
          pinned: boolean
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by_admin?: boolean
          id?: string
          pinned?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by_admin?: boolean
          id?: string
          pinned?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      guests: {
        Row: {
          attendance_status: string
          avatar_type: string
          avatar_url: string | null
          claimed_at: string | null
          claimed_by_session_id: string | null
          created_at: string
          display_name: string
          id: string
          is_tournament_player: boolean
          updated_at: string
          wanted_for: string
        }
        Insert: {
          attendance_status?: string
          avatar_type?: string
          avatar_url?: string | null
          claimed_at?: string | null
          claimed_by_session_id?: string | null
          created_at?: string
          display_name: string
          id?: string
          is_tournament_player?: boolean
          updated_at?: string
          wanted_for?: string
        }
        Update: {
          attendance_status?: string
          avatar_type?: string
          avatar_url?: string | null
          claimed_at?: string | null
          claimed_by_session_id?: string | null
          created_at?: string
          display_name?: string
          id?: string
          is_tournament_player?: boolean
          updated_at?: string
          wanted_for?: string
        }
        Relationships: []
      }
      party_photos: {
        Row: {
          caption: string | null
          created_at: string
          file_url: string
          guest_id: string | null
          id: string
          is_hidden: boolean
        }
        Insert: {
          caption?: string | null
          created_at?: string
          file_url: string
          guest_id?: string | null
          id?: string
          is_hidden?: boolean
        }
        Update: {
          caption?: string | null
          created_at?: string
          file_url?: string
          guest_id?: string | null
          id?: string
          is_hidden?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "party_photos_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
      projector_state: {
        Row: {
          current_screen: string
          id: string
          last_call_to_table_match_id: string | null
          mode: string
          rotation_interval_seconds: number
          selected_announcement_id: string | null
          selected_match_id: string | null
          sound_enabled: boolean
          updated_at: string
        }
        Insert: {
          current_screen?: string
          id?: string
          last_call_to_table_match_id?: string | null
          mode?: string
          rotation_interval_seconds?: number
          selected_announcement_id?: string | null
          selected_match_id?: string | null
          sound_enabled?: boolean
          updated_at?: string
        }
        Update: {
          current_screen?: string
          id?: string
          last_call_to_table_match_id?: string | null
          mode?: string
          rotation_interval_seconds?: number
          selected_announcement_id?: string | null
          selected_match_id?: string | null
          sound_enabled?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      teams: {
        Row: {
          created_at: string
          id: string
          name: string
          player_1_guest_id: string | null
          player_2_guest_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          player_1_guest_id?: string | null
          player_2_guest_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          player_1_guest_id?: string | null
          player_2_guest_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_player_1_guest_id_fkey"
            columns: ["player_1_guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_player_2_guest_id_fkey"
            columns: ["player_2_guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_matches: {
        Row: {
          created_at: string
          group_name: string | null
          id: string
          next_match_id: string | null
          phase: string
          scheduled_order: number
          score_a: number
          score_b: number
          status: string
          team_a_id: string | null
          team_b_id: string | null
          updated_at: string
          winner_team_id: string | null
        }
        Insert: {
          created_at?: string
          group_name?: string | null
          id?: string
          next_match_id?: string | null
          phase?: string
          scheduled_order?: number
          score_a?: number
          score_b?: number
          status?: string
          team_a_id?: string | null
          team_b_id?: string | null
          updated_at?: string
          winner_team_id?: string | null
        }
        Update: {
          created_at?: string
          group_name?: string | null
          id?: string
          next_match_id?: string | null
          phase?: string
          scheduled_order?: number
          score_a?: number
          score_b?: number
          status?: string
          team_a_id?: string | null
          team_b_id?: string | null
          updated_at?: string
          winner_team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tournament_matches_team_a_id_fkey"
            columns: ["team_a_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_matches_team_b_id_fkey"
            columns: ["team_b_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_matches_winner_team_id_fkey"
            columns: ["winner_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      wall_posts: {
        Row: {
          content: string
          created_at: string
          guest_id: string | null
          id: string
          is_hidden: boolean
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          guest_id?: string | null
          id?: string
          is_hidden?: boolean
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          guest_id?: string | null
          id?: string
          is_hidden?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wall_posts_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
  public: {
    Enums: {},
  },
} as const
