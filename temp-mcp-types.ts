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
      account_activity_stats: {
        Row: {
          average_activity_score: number;
          created_at: string;
          last_login_date: string | null;
          last_transaction_date: string | null;
          total_pmc_converted: number;
          total_pmp_earned: number;
          transaction_count: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          average_activity_score?: number;
          created_at?: string;
          last_login_date?: string | null;
          last_transaction_date?: string | null;
          total_pmc_converted?: number;
          total_pmp_earned?: number;
          transaction_count?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          average_activity_score?: number;
          created_at?: string;
          last_login_date?: string | null;
          last_transaction_date?: string | null;
          total_pmc_converted?: number;
          total_pmp_earned?: number;
          transaction_count?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "account_activity_stats_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "pmp_pmc_accounts";
            referencedColumns: ["user_id"];
          }
        ];
      };
      behavioral_bias_profiles: {
        Row: {
          anchoring: number;
          availability_heuristic: number;
          confirmation_bias: number;
          created_at: string;
          endowment_effect: number;
          herding: number;
          hyperbolic_discounting: number;
          loss_aversion: number;
          measurement_count: number;
          mental_accounting: number;
          overconfidence: number;
          profile_date: string;
          recency_bias: number;
          reliability_score: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          anchoring?: number;
          availability_heuristic?: number;
          confirmation_bias?: number;
          created_at?: string;
          endowment_effect?: number;
          herding?: number;
          hyperbolic_discounting?: number;
          loss_aversion?: number;
          measurement_count?: number;
          mental_accounting?: number;
          overconfidence?: number;
          profile_date?: string;
          recency_bias?: number;
          reliability_score?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          anchoring?: number;
          availability_heuristic?: number;
          confirmation_bias?: number;
          created_at?: string;
          endowment_effect?: number;
          herding?: number;
          hyperbolic_discounting?: number;
          loss_aversion?: number;
          measurement_count?: number;
          mental_accounting?: number;
          overconfidence?: number;
          profile_date?: string;
          recency_bias?: number;
          reliability_score?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      // ... 다른 테이블들 (abbreviated for brevity)
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
      // ... 다른 함수들
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

// ... 기타 타입 헬퍼들
