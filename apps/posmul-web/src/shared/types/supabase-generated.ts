export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  oauth_provider: {
    Tables: {
      auth_codes: {
        Row: {
          client_id: string | null
          code: string
          expires_at: string
          redirect_uri: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          client_id?: string | null
          code?: string
          expires_at: string
          redirect_uri: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          client_id?: string | null
          code?: string
          expires_at?: string
          redirect_uri?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "auth_codes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          }
        ]
      }
      clients: {
        Row: {
          created_at: string | null
          id: string
          name: string
          redirect_uris: string[]
          secret: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          redirect_uris: string[]
          secret: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          redirect_uris?: string[]
          secret?: string
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
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      monorepo_migration_status: {
        Row: {
          assignee: string | null
          completion_percentage: number | null
          created_at: string | null
          id: string
          issues_found: string[] | null
          migration_phase: string
          next_actions: string[] | null
          notes: string | null
          scripts_executed: string[] | null
          status: string
          typescript_errors_count: number | null
          updated_at: string | null
        }
        Insert: {
          assignee?: string | null
          completion_percentage?: number | null
          created_at?: string | null
          id?: string
          issues_found?: string[] | null
          migration_phase: string
          next_actions?: string[] | null
          notes?: string | null
          scripts_executed?: string[] | null
          status: string
          typescript_errors_count?: number | null
          updated_at?: string | null
        }
        Update: {
          assignee?: string | null
          completion_percentage?: number | null
          created_at?: string | null
          id?: string
          issues_found?: string[] | null
          migration_phase?: string
          next_actions?: string[] | null
          notes?: string | null
          scripts_executed?: string[] | null
          status?: string
          typescript_errors_count?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_reputation_metrics: {
        Row: {
          community_trust_level: number | null
          created_at: string | null
          forum_contribution_score: number | null
          helpful_posts_count: number | null
          id: string
          investment_success_rate: number | null
          overall_reputation_score: number | null
          prediction_accuracy_rate: number | null
          reputation_tier: string | null
          roi_average: number | null
          successful_predictions: number | null
          total_investments_made: number | null
          total_predictions_made: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          community_trust_level?: number | null
          created_at?: string | null
          forum_contribution_score?: number | null
          helpful_posts_count?: number | null
          id?: string
          investment_success_rate?: number | null
          overall_reputation_score?: number | null
          prediction_accuracy_rate?: number | null
          reputation_tier?: string | null
          roi_average?: number | null
          successful_predictions?: number | null
          total_investments_made?: number | null
          total_predictions_made?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          community_trust_level?: number | null
          created_at?: string | null
          forum_contribution_score?: number | null
          helpful_posts_count?: number | null
          id?: string
          investment_success_rate?: number | null
          overall_reputation_score?: number | null
          prediction_accuracy_rate?: number | null
          reputation_tier?: string | null
          roi_average?: number | null
          successful_predictions?: number | null
          total_investments_made?: number | null
          total_predictions_made?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      user_profiles_with_balance: {
        Row: {
          account_status: string | null
          avatar_url: string | null
          email: string | null
          full_name: string | null
          id: string | null
          last_login: string | null
          pmc_balance: number | null
          pmp_balance: number | null
          role: string | null
          username: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
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

export type Tables<
  PublicTableNameOrOptions extends
  | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
  | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
  ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
    Database[PublicTableNameOrOptions["schema"]]["Views"])
  : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
    Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
    Database["public"]["Views"])
  ? (Database["public"]["Tables"] &
    Database["public"]["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
  | keyof Database["public"]["Enums"]
  | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
  ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
  : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
  ? Database["public"]["Enums"][PublicEnumNameOrOptions]
  : never
