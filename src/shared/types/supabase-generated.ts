/**
 * PosMul Platform - Supabase 자동 생성 타입
 * 생성 시간: 2025-06-23T03:02:19.429Z
 * 프로젝트: fabyagohqqnusmnwekuc
 * 
 * 🔥 수동 편집 금지! 이 파일은 자동 생성됩니다.
 * 🔥 MCP mcp_supabase_generate_typescript_types 결과 기반
 */

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
      account_activity_stats: {
        Row: {
          average_activity_score: number
          created_at: string
          last_login_date: string | null
          last_transaction_date: string | null
          total_pmc_converted: number
          total_pmp_earned: number
          transaction_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          average_activity_score?: number
          created_at?: string
          last_login_date?: string | null
          last_transaction_date?: string | null
          total_pmc_converted?: number
          total_pmp_earned?: number
          transaction_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          average_activity_score?: number
          created_at?: string
          last_login_date?: string | null
          last_transaction_date?: string | null
          total_pmc_converted?: number
          total_pmp_earned?: number
          transaction_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_activity_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "pmp_pmc_accounts"
            referencedColumns: ["user_id"]
          },
        ]
      }
      predictions: {
        Row: {
          bet_amount: number
          confidence_level: number
          created_at: string
          expected_reward: number
          game_id: string
          is_active: boolean
          odds_at_time: number
          prediction_data: Json
          prediction_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bet_amount: number
          confidence_level: number
          created_at?: string
          expected_reward: number
          game_id: string
          is_active?: boolean
          odds_at_time: number
          prediction_data: Json
          prediction_id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bet_amount?: number
          confidence_level?: number
          created_at?: string
          expected_reward?: number
          game_id?: string
          is_active?: boolean
          odds_at_time?: number
          prediction_data?: Json
          prediction_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "predictions_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "prediction_games"
            referencedColumns: ["game_id"]
          },
          {
            foreignKeyName: "predictions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "pmp_pmc_accounts"
            referencedColumns: ["user_id"]
          },
        ]
      }
      prediction_games: {
        Row: {
          actual_result: Json | null
          category: Database["public"]["Enums"]["prediction_category"]
          created_at: string
          creator_id: string
          data_source: string | null
          description: string
          difficulty: number
          external_id: string | null
          game_id: string
          game_options: Json
          max_bet_amount: number
          metadata: Json | null
          min_bet_amount: number
          prediction_type: Database["public"]["Enums"]["prediction_type"]
          registration_end: string
          registration_start: string
          settlement_date: string
          status: Database["public"]["Enums"]["game_status"]
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          actual_result?: Json | null
          category: Database["public"]["Enums"]["prediction_category"]
          created_at?: string
          creator_id: string
          data_source?: string | null
          description: string
          difficulty: number
          external_id?: string | null
          game_id?: string
          game_options: Json
          max_bet_amount: number
          metadata?: Json | null
          min_bet_amount: number
          prediction_type: Database["public"]["Enums"]["prediction_type"]
          registration_end: string
          registration_start: string
          settlement_date: string
          status?: Database["public"]["Enums"]["game_status"]
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          actual_result?: Json | null
          category?: Database["public"]["Enums"]["prediction_category"]
          created_at?: string
          creator_id?: string
          data_source?: string | null
          description?: string
          difficulty?: number
          external_id?: string | null
          game_id?: string
          game_options?: Json
          max_bet_amount?: number
          metadata?: Json | null
          min_bet_amount?: number
          prediction_type?: Database["public"]["Enums"]["prediction_type"]
          registration_end?: string
          registration_start?: string
          settlement_date?: string
          status?: Database["public"]["Enums"]["game_status"]
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auto_update_game_status: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      calculate_current_odds: {
        Args: { p_game_id: string }
        Returns: {
          option_id: string
          odds: number
          probability: number
        }[]
      }
    }
    Enums: {
      game_status: "DRAFT" | "ACTIVE" | "CLOSED" | "SETTLED" | "CANCELLED"
      prediction_category:
        | "INVEST"
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
} as const