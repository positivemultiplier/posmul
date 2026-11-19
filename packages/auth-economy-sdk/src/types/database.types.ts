// Auto-generated via Supabase MCP generate_typescript_types (2026-11-19)
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
    PostgrestVersion: "12.2.12"
  }
  public: {
    Tables: {
      calendar_events: {
        Row: {
          category: string
          created_at: string | null
          due_date: string
          id: string
          notes: string | null
          penalty_info: string | null
          penalty_warning: boolean | null
          period_cycle: string | null
          status: string | null
          title: string
        }
        Insert: {
          category: string
          created_at?: string | null
          due_date: string
          id?: string
          notes?: string | null
          penalty_info?: string | null
          penalty_warning?: boolean | null
          period_cycle?: string | null
          status?: string | null
          title: string
        }
        Update: {
          category?: string
          created_at?: string | null
          due_date?: string
          id?: string
          notes?: string | null
          penalty_info?: string | null
          penalty_warning?: boolean | null
          period_cycle?: string | null
          status?: string | null
          title?: string
        }
        Relationships: []
      }
      cloze_quizzes: {
        Row: {
          article_title: string
          blank_answer: string
          created_at: string | null
          exam_round: string | null
          explanation: string
          frequency: string | null
          id: string
          initial_hint: string | null
          law_name: string
          options: Json
          question_text: string
          subject: string
          theme: string
        }
        Insert: {
          article_title: string
          blank_answer: string
          created_at?: string | null
          exam_round?: string | null
          explanation: string
          frequency?: string | null
          id?: string
          initial_hint?: string | null
          law_name: string
          options?: Json
          question_text: string
          subject: string
          theme?: string
        }
        Update: {
          article_title?: string
          blank_answer?: string
          created_at?: string | null
          exam_round?: string | null
          explanation?: string
          frequency?: string | null
          id?: string
          initial_hint?: string | null
          law_name?: string
          options?: Json
          question_text?: string
          subject?: string
          theme?: string
        }
        Relationships: []
      }
      law_revisions: {
        Row: {
          action_points: Json | null
          after_text: string | null
          before_text: string | null
          created_at: string | null
          enforce_date: string
          id: string
          law_title: string
          revision_date: string
          summary: string
          tags: Json | null
        }
        Insert: {
          action_points?: Json | null
          after_text?: string | null
          before_text?: string | null
          created_at?: string | null
          enforce_date: string
          id?: string
          law_title: string
          revision_date: string
          summary: string
          tags?: Json | null
        }
        Update: {
          action_points?: Json | null
          after_text?: string | null
          before_text?: string | null
          created_at?: string | null
          enforce_date?: string
          id?: string
          law_title?: string
          revision_date?: string
          summary?: string
          tags?: Json | null
        }
        Relationships: []
      }
      live_study_sessions: {
        Row: {
          avatar_color: string | null
          created_at: string | null
          id: string
          is_studying: boolean | null
          last_ping_at: string | null
          status_message: string | null
          study_seconds: number | null
          subject: string
          total_today_minutes: number | null
          user_id: string | null
          user_name: string
        }
        Insert: {
          avatar_color?: string | null
          created_at?: string | null
          id?: string
          is_studying?: boolean | null
          last_ping_at?: string | null
          status_message?: string | null
          study_seconds?: number | null
          subject: string
          total_today_minutes?: number | null
          user_id?: string | null
          user_name: string
        }
        Update: {
          avatar_color?: string | null
          created_at?: string | null
          id?: string
          is_studying?: boolean | null
          last_ping_at?: string | null
          status_message?: string | null
          study_seconds?: number | null
          subject?: string
          total_today_minutes?: number | null
          user_id?: string | null
          user_name?: string
        }
        Relationships: []
      }
      patrol_checklists: {
        Row: {
          area: string
          check_standard: string
          created_at: string | null
          id: string
          is_checked: boolean | null
          item_name: string
          notes: string | null
          status: string | null
        }
        Insert: {
          area: string
          check_standard: string
          created_at?: string | null
          id?: string
          is_checked?: boolean | null
          item_name: string
          notes?: string | null
          status?: string | null
        }
        Update: {
          area?: string
          check_standard?: string
          created_at?: string | null
          id?: string
          is_checked?: boolean | null
          item_name?: string
          notes?: string | null
          status?: string | null
        }
        Relationships: []
      }
      study_cheers: {
        Row: {
          created_at: string | null
          id: string
          message: string
          user_name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          user_name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          user_name?: string
        }
        Relationships: []
      }
      study_schedules: {
        Row: {
          created_at: string | null
          id: string
          is_completed: boolean | null
          plan_date: string
          study_minutes: number | null
          subject: string
          title: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          plan_date?: string
          study_minutes?: number | null
          subject: string
          title: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          plan_date?: string
          study_minutes?: number | null
          subject?: string
          title?: string
        }
        Relationships: []
      }
      wrong_answers: {
        Row: {
          created_at: string | null
          id: string
          is_resolved: boolean | null
          last_wrong_answer: string | null
          quiz_id: string | null
          updated_at: string | null
          user_id: string | null
          wrong_count: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_resolved?: boolean | null
          last_wrong_answer?: string | null
          quiz_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          wrong_count?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_resolved?: boolean | null
          last_wrong_answer?: string | null
          quiz_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          wrong_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "wrong_answers_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "cloze_quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auto_update_game_status: { Args: never; Returns: undefined }
      calculate_current_odds: {
        Args: { p_game_id: string }
        Returns: {
          odds: number
          option_id: string
          probability: number
        }[]
      }
      calculate_prediction_accuracy: {
        Args: { p_user_id: string }
        Returns: number
      }
      calculate_reward_amount: {
        Args: { p_correct_option_id: string; p_prediction_id: string }
        Returns: number
      }
      deduct_challenge_pmp: {
        Args: {
          p_amount: number
          p_challenge_id: string
          p_reason?: string
          p_user_id: string
        }
        Returns: Json
      }
      dispute_challenge_settlement: {
        Args: { p_challenge_id: string; p_user_id: string }
        Returns: Json
      }
      finalize_challenge_settlement: {
        Args: {
          p_actor_user_id?: string
          p_challenge_id: string
          p_force_gg?: boolean
        }
        Returns: Json
      }
      get_active_games: {
        Args: { p_limit?: number }
        Returns: {
          description: string
          end_time: string
          id: string
          participant_count: number
          prediction_type: string
          status: string
          title: string
          total_stake: number
        }[]
      }
      get_economy_stats: { Args: never; Returns: Json }
      get_user_prediction_history: {
        Args: { p_limit?: number; p_user_id: string }
        Returns: {
          confidence_level: number
          created_at: string
          game_title: string
          is_correct: boolean
          is_settled: boolean
          prediction_data: Json
          prediction_id: string
          reward_amount: number
          stake: number
        }[]
      }
      grant_pmc: {
        Args: { p_amount: number; p_reason?: string; p_user_id: string }
        Returns: undefined
      }
      grant_pmp: {
        Args: { p_amount: number; p_reason?: string; p_user_id: string }
        Returns: undefined
      }
      participate_in_prediction_game:
        | {
            Args: {
              p_bet_amount: number
              p_confidence_level: number
              p_game_id: string
              p_prediction_data: Json
            }
            Returns: Json
          }
        | {
            Args: {
              p_bet_amount: number
              p_confidence_level?: number
              p_game_id: string
              p_prediction_data: Json
            }
            Returns: Json
          }
      process_expired_user_challenges: { Args: never; Returns: Json }
      propose_challenge_settlement: {
        Args: {
          p_challenge_id: string
          p_host_user_id: string
          p_winning_option_id: string
        }
        Returns: Json
      }
      settle_prediction: {
        Args: {
          p_is_winner: boolean
          p_prediction_id: string
          p_reward_amount?: number
        }
        Returns: undefined
      }
      settle_prediction_game: {
        Args: { p_correct_option_id: string; p_game_id: string }
        Returns: Json
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      validate_pmp_balance: {
        Args: { p_required_amount: number; p_user_id: string }
        Returns: boolean
      }
      void_challenge_refund_internal: {
        Args: { p_challenge_id: string; p_reason?: string }
        Returns: Json
      }
    }
    Enums: {
      game_status:
        | "DRAFT"
        | "ACTIVE"
        | "CLOSED"
        | "SETTLING"
        | "SETTLED"
        | "CANCELLED"
      prediction_category:
        | "INVEST"
        | "ECONOMY"
        | "SPORTS"
        | "ENTERTAINMENT"
        | "POLITICS"
        | "USER_PROPOSED"
      prediction_type: "BINARY" | "WIN_DRAW_LOSE" | "RANKING"
      settlement_type:
        | "WINNER_TAKE_ALL"
        | "PROPORTIONAL"
        | "CONFIDENCE_WEIGHTED"
        | "HYBRID"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      game_status: [
        "DRAFT",
        "ACTIVE",
        "CLOSED",
        "SETTLING",
        "SETTLED",
        "CANCELLED",
      ],
      prediction_category: [
        "INVEST",
        "ECONOMY",
        "SPORTS",
        "ENTERTAINMENT",
        "POLITICS",
        "USER_PROPOSED",
      ],
      prediction_type: ["BINARY", "WIN_DRAW_LOSE", "RANKING"],
      settlement_type: [
        "WINNER_TAKE_ALL",
        "PROPORTIONAL",
        "CONFIDENCE_WEIGHTED",
        "HYBRID",
      ],
    },
  },
} as const
