/**
 * PosMul AI-era 직접민주주의 플랫폼 - Supabase 자동 생성 타입
 * 
 * 🕒 생성 시간: 2025-06-24T15:09:13.422Z
 * 🆔 프로젝트 ID: fabyagohqqnusmnwekuc
 * 🏗️ 적용 도메인: prediction, economy, investment, donation, forum, auth, user, payment
 * 
 * 🔥 수동 편집 금지! 이 파일은 자동 생성됩니다.
 * 🔥 MCP mcp_supabase_generate_typescript_types 결과 기반
 * 
 * 🚀 Universal MCP Automation System으로 생성됨
 */

// 📊 도메인별 테이블 통계:
//   prediction: 5개 관련 테이블
//   economy: 13개 관련 테이블  
//   investment: 4개 관련 테이블
//   donation: 4개 관련 테이블
//   forum: 7개 관련 테이블
//   auth: 1개 관련 테이블
//   user: 3개 관련 테이블
//   payment: 2개 관련 테이블 (PMP/PMC)
//
// 🔄 자동 업데이트: npm run generate-types
// 🛠️ 수동 적용: node scripts/apply-mcp-types.js

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
      // ... 39개 테이블 모두 포함 (간략화)
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auto_update_game_status: {
        Args: Record<PropertyKey, never>
        Returns: undefined
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
}