export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      [_ in never]: never;
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

type DefaultSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
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
