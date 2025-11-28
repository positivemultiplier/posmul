/**
 * Supabase Database Types - Generated from MCP
 *
 * 🔥 IMPORTANT: These types are auto-generated from the database schema
 * via Supabase MCP tools. Do NOT manually edit this file.
 *
 * Generation command: mcp_supabase2_generate_typescript_types
 * Last updated: 2025-01-27
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)";
  };
  public: {
    Tables: {
      monorepo_migration_status: {
        Row: {
          assignee: string | null;
          completion_percentage: number | null;
          created_at: string | null;
          id: string;
          issues_found: string[] | null;
          migration_phase: string;
          next_actions: string[] | null;
          notes: string | null;
          scripts_executed: string[] | null;
          status: string;
          typescript_errors_count: number | null;
          updated_at: string | null;
        };
        Insert: {
          assignee?: string | null;
          completion_percentage?: number | null;
          created_at?: string | null;
          id?: string;
          issues_found?: string[] | null;
          migration_phase: string;
          next_actions?: string[] | null;
          notes?: string | null;
          scripts_executed?: string[] | null;
          status: string;
          typescript_errors_count?: number | null;
          updated_at?: string | null;
        };
        Update: {
          assignee?: string | null;
          completion_percentage?: number | null;
          created_at?: string | null;
          id?: string;
          issues_found?: string[] | null;
          migration_phase?: string;
          next_actions?: string[] | null;
          notes?: string | null;
          scripts_executed?: string[] | null;
          status?: string;
          typescript_errors_count?: number | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      user_economic_balances: {
        Row: {
          created_at: string | null;
          id: string;
          investment_behavior_type: string | null;
          lifetime_pmc_earned: number;
          lifetime_pmp_earned: number;
          pmc_available: number;
          pmc_locked: number;
          pmc_total: number | null;
          pmp_available: number;
          pmp_locked: number;
          pmp_total: number | null;
          risk_tolerance_score: number | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          investment_behavior_type?: string | null;
          lifetime_pmc_earned?: number;
          lifetime_pmp_earned?: number;
          pmc_available?: number;
          pmc_locked?: number;
          pmc_total?: number | null;
          pmp_available?: number;
          pmp_locked?: number;
          pmp_total?: number | null;
          risk_tolerance_score?: number | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          investment_behavior_type?: string | null;
          lifetime_pmc_earned?: number;
          lifetime_pmp_earned?: number;
          pmc_available?: number;
          pmc_locked?: number;
          pmc_total?: number | null;
          pmp_available?: number;
          pmp_locked?: number;
          pmp_total?: number | null;
          risk_tolerance_score?: number | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      user_profiles: {
        Row: {
          account_status: string | null;
          avatar_url: string | null;
          bio: string | null;
          created_at: string | null;
          display_name: string;
          email_verified: boolean | null;
          id: string;
          last_active_at: string | null;
          notification_preferences: Json | null;
          onboarding_completed: boolean | null;
          pmc_balance: number;
          pmp_balance: number;
          privacy_settings: Json | null;
          updated_at: string | null;
          username: string;
        };
        Insert: {
          account_status?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string | null;
          display_name: string;
          email_verified?: boolean | null;
          id: string;
          last_active_at?: string | null;
          notification_preferences?: Json | null;
          onboarding_completed?: boolean | null;
          pmc_balance?: number;
          pmp_balance?: number;
          privacy_settings?: Json | null;
          updated_at?: string | null;
          username: string;
        };
        Update: {
          account_status?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string | null;
          display_name?: string;
          email_verified?: boolean | null;
          id?: string;
          last_active_at?: string | null;
          notification_preferences?: Json | null;
          onboarding_completed?: boolean | null;
          pmc_balance?: number;
          pmp_balance?: number;
          privacy_settings?: Json | null;
          updated_at?: string | null;
          username?: string;
        };
        Relationships: [];
      };
      user_reputation_metrics: {
        Row: {
          community_trust_level: number | null;
          created_at: string | null;
          forum_contribution_score: number | null;
          helpful_posts_count: number | null;
          id: string;
          investment_success_rate: number | null;
          overall_reputation_score: number | null;
          prediction_accuracy_rate: number | null;
          reputation_tier: string | null;
          roi_average: number | null;
          successful_predictions: number | null;
          total_investments_made: number | null;
          total_predictions_made: number | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          community_trust_level?: number | null;
          created_at?: string | null;
          forum_contribution_score?: number | null;
          helpful_posts_count?: number | null;
          id?: string;
          investment_success_rate?: number | null;
          overall_reputation_score?: number | null;
          prediction_accuracy_rate?: number | null;
          reputation_tier?: string | null;
          roi_average?: number | null;
          successful_predictions?: number | null;
          total_investments_made?: number | null;
          total_predictions_made?: number | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          community_trust_level?: number | null;
          created_at?: string | null;
          forum_contribution_score?: number | null;
          helpful_posts_count?: number | null;
          id?: string;
          investment_success_rate?: number | null;
          overall_reputation_score?: number | null;
          prediction_accuracy_rate?: number | null;
          reputation_tier?: string | null;
          roi_average?: number | null;
          successful_predictions?: number | null;
          total_investments_made?: number | null;
          total_predictions_made?: number | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      auto_update_game_status: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      calculate_current_odds: {
        Args: { p_game_id: string };
        Returns: {
          option_id: string;
          odds: number;
          probability: number;
        }[];
      };
      calculate_prediction_accuracy: {
        Args: { p_user_id: string };
        Returns: number;
      };
      calculate_reward_amount: {
        Args: { p_prediction_id: string; p_game_outcome: Json };
        Returns: number;
      };
      get_active_games: {
        Args: { p_limit?: number };
        Returns: {
          id: string;
          title: string;
          description: string;
          prediction_type: string;
          status: string;
          participant_count: number;
          total_stake: number;
          end_time: string;
        }[];
      };
      get_user_prediction_history: {
        Args: { p_user_id: string; p_limit?: number };
        Returns: {
          prediction_id: string;
          game_title: string;
          prediction_data: Json;
          stake: number;
          confidence_level: number;
          is_settled: boolean;
          is_correct: boolean;
          reward_amount: number;
          created_at: string;
        }[];
      };
      validate_pmp_balance: {
        Args: { p_user_id: string; p_required_amount: number };
        Returns: boolean;
      };
    };
    Enums: {
      game_status: "DRAFT" | "ACTIVE" | "CLOSED" | "SETTLED" | "CANCELLED";
      prediction_category:
        | "INVEST"
        | "SPORTS"
        | "ENTERTAINMENT"
        | "POLITICS"
        | "USER_PROPOSED";
      prediction_type: "BINARY" | "WIN_DRAW_LOSE" | "RANKING";
      settlement_type:
        | "WINNER_TAKE_ALL"
        | "PROPORTIONAL"
        | "CONFIDENCE_WEIGHTED"
        | "HYBRID";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      game_status: ["DRAFT", "ACTIVE", "CLOSED", "SETTLED", "CANCELLED"],
      prediction_category: [
        "INVEST",
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
} as const;
