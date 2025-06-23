const { generateUniversalTypes } = require("./universal-mcp-automation.ts");

// MCP에서 받은 완전한 타입
const mcpResult = `export type Json =
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
      // ... (전체 타입이 너무 길어서 축약)
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
      // ... 더 많은 함수들
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
}`;

// 범용 자동화 시스템 실행
async function applyTypes() {
  try {
    const result = await generateUniversalTypes("posmul", mcpResult);

    if (result.success) {
      console.log("🎉 범용 자동화 시스템 적용 완료!");
      console.log(`📁 파일: ${result.outputPath}`);
      console.log(`📊 크기: ${result.fileSize} KB`);
      console.log(`🏗️ 도메인: ${result.domains.length}개`);
      console.log(`📋 테이블: ${result.tableCount}개`);
    } else {
      console.error("❌ 타입 적용 실패");
    }
  } catch (error) {
    console.error("❌ 오류 발생:", error);
  }
}

applyTypes();
