/**
 * FORUM Domain - Supabase 타입
 * 생성 시간: 2025-06-25T09:29:05.106Z
 * 도메인: forum
 * 
 * 🚀 Universal MCP Automation (Standalone)으로 생성됨
 */
// 📊 도메인별 테이블 통계:
//   forum: 27개 관련 테이블
//
// 🔄 자동 업데이트: npx tsx C:\G\mcp-automation\universal-mcp-automation.ts generate forum
// 🛠️ 수동 적용: 프로젝트별 스크립트 실행

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  donation: {
    Tables: {
      donation_activity_logs: {
        Row: {
          activity_type: string
          created_at: string | null
          description: string
          donation_id: string
          id: string
          metadata: Json | null
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          description: string
          donation_id: string
          id?: string
          metadata?: Json | null
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          description?: string
          donation_id?: string
          id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "donation_activity_logs_donation_id_fkey"
            columns: ["donation_id"]
            isOneToOne: false
            referencedRelation: "donations"
            referencedColumns: ["id"]
          },
        ]
      }
      donation_certificates: {
        Row: {
          certificate_number: string
          created_at: string | null
          donation_id: string
          donor_id: string
          id: string
          is_valid: boolean | null
          issue_date: string
          pdf_url: string | null
          tax_deductible_amount: number
          verification_hash: string
        }
        Insert: {
          certificate_number: string
          created_at?: string | null
          donation_id: string
          donor_id: string
          id?: string
          is_valid?: boolean | null
          issue_date?: string
          pdf_url?: string | null
          tax_deductible_amount?: number
          verification_hash: string
        }
        Update: {
          certificate_number?: string
          created_at?: string | null
          donation_id?: string
          donor_id?: string
          id?: string
          is_valid?: boolean | null
          issue_date?: string
          pdf_url?: string | null
          tax_deductible_amount?: number
          verification_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "donation_certificates_donation_id_fkey"
            columns: ["donation_id"]
            isOneToOne: false
            referencedRelation: "donations"
            referencedColumns: ["id"]
          },
        ]
      }
      donation_institutes: {
        Row: {
          category: string
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_verified: boolean | null
          name: string
          registration_number: string | null
          trust_score: number | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          category: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          name: string
          registration_number?: string | null
          trust_score?: number | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          category?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          name?: string
          registration_number?: string | null
          trust_score?: number | null
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      donations: {
        Row: {
          amount: number
          cancelled_at: string | null
          category: string
          certificate_id: string | null
          certificate_issued: boolean | null
          completed_at: string | null
          created_at: string | null
          delivery_address: string | null
          description: string | null
          donation_type: string
          donor_id: string
          id: string
          institute_id: string | null
          is_anonymous: boolean | null
          is_recurring: boolean | null
          metadata: Json | null
          opinion_leader_id: string | null
          pmc_amount: number
          recipient_info: Json | null
          recurring_period: string | null
          status: string
          support_message: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          cancelled_at?: string | null
          category: string
          certificate_id?: string | null
          certificate_issued?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          delivery_address?: string | null
          description?: string | null
          donation_type: string
          donor_id: string
          id?: string
          institute_id?: string | null
          is_anonymous?: boolean | null
          is_recurring?: boolean | null
          metadata?: Json | null
          opinion_leader_id?: string | null
          pmc_amount: number
          recipient_info?: Json | null
          recurring_period?: string | null
          status?: string
          support_message?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          cancelled_at?: string | null
          category?: string
          certificate_id?: string | null
          certificate_issued?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          delivery_address?: string | null
          description?: string | null
          donation_type?: string
          donor_id?: string
          id?: string
          institute_id?: string | null
          is_anonymous?: boolean | null
          is_recurring?: boolean | null
          metadata?: Json | null
          opinion_leader_id?: string | null
          pmc_amount?: number
          recipient_info?: Json | null
          recurring_period?: string | null
          status?: string
          support_message?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "donations_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "donation_institutes"
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
  economy: {
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
      individual_utility_parameters: {
        Row: {
          alpha: number
          beta: number
          created_at: string
          data_quality: string
          delta: number
          epsilon: number
          estimation_confidence: number
          estimation_method: string | null
          gamma: number
          last_estimation_date: string | null
          last_updated: string
          observation_count: number
          r_squared: number | null
          rho: number
          sigma: number
          theta: number
          updated_at: string
          user_id: string
        }
        Insert: {
          alpha?: number
          beta?: number
          created_at?: string
          data_quality?: string
          delta?: number
          epsilon?: number
          estimation_confidence?: number
          estimation_method?: string | null
          gamma?: number
          last_estimation_date?: string | null
          last_updated?: string
          observation_count?: number
          r_squared?: number | null
          rho?: number
          sigma?: number
          theta?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          alpha?: number
          beta?: number
          created_at?: string
          data_quality?: string
          delta?: number
          epsilon?: number
          estimation_confidence?: number
          estimation_method?: string | null
          gamma?: number
          last_estimation_date?: string | null
          last_updated?: string
          observation_count?: number
          r_squared?: number | null
          rho?: number
          sigma?: number
          theta?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      money_wave_effectiveness: {
        Row: {
          agency_cost_reduction: number | null
          analysis_id: string
          analysis_period_end: string
          analysis_period_start: string
          behavioral_bias_correction: number | null
          collective_intelligence_gain: number | null
          confidence_interval: number | null
          created_at: string
          decision_quality_improvement: number | null
          democratic_participation_increase: number | null
          employment_impact: number | null
          gdp_impact: number | null
          inequality_reduction: number | null
          information_asymmetry_reduction: number | null
          innovation_boost: number | null
          methodology: string | null
          productivity_gain: number | null
          public_welfare_enhancement: number | null
          social_learning_acceleration: number | null
          social_mobility_improvement: number | null
          statistical_significance: number | null
          transparency_improvement: number | null
          wave_id: string
        }
        Insert: {
          agency_cost_reduction?: number | null
          analysis_id?: string
          analysis_period_end: string
          analysis_period_start: string
          behavioral_bias_correction?: number | null
          collective_intelligence_gain?: number | null
          confidence_interval?: number | null
          created_at?: string
          decision_quality_improvement?: number | null
          democratic_participation_increase?: number | null
          employment_impact?: number | null
          gdp_impact?: number | null
          inequality_reduction?: number | null
          information_asymmetry_reduction?: number | null
          innovation_boost?: number | null
          methodology?: string | null
          productivity_gain?: number | null
          public_welfare_enhancement?: number | null
          social_learning_acceleration?: number | null
          social_mobility_improvement?: number | null
          statistical_significance?: number | null
          transparency_improvement?: number | null
          wave_id: string
        }
        Update: {
          agency_cost_reduction?: number | null
          analysis_id?: string
          analysis_period_end?: string
          analysis_period_start?: string
          behavioral_bias_correction?: number | null
          collective_intelligence_gain?: number | null
          confidence_interval?: number | null
          created_at?: string
          decision_quality_improvement?: number | null
          democratic_participation_increase?: number | null
          employment_impact?: number | null
          gdp_impact?: number | null
          inequality_reduction?: number | null
          information_asymmetry_reduction?: number | null
          innovation_boost?: number | null
          methodology?: string | null
          productivity_gain?: number | null
          public_welfare_enhancement?: number | null
          social_learning_acceleration?: number | null
          social_mobility_improvement?: number | null
          statistical_significance?: number | null
          transparency_improvement?: number | null
          wave_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "money_wave_effectiveness_wave_id_fkey"
            columns: ["wave_id"]
            isOneToOne: false
            referencedRelation: "money_wave_history"
            referencedColumns: ["wave_id"]
          },
        ]
      }
      money_wave_history: {
        Row: {
          affected_users_count: number
          agency_score: number | null
          created_at: string
          dormant_pmc_amount: number | null
          ebit_amount: number | null
          effectiveness_score: number | null
          entrepreneur_count: number | null
          error_details: string | null
          execution_date: string
          execution_parameters: Json | null
          gini_coefficient_after: number | null
          gini_coefficient_before: number | null
          information_transparency: number | null
          innovation_index: number | null
          job_creation_impact: number | null
          pmc_issued: number | null
          prediction_accuracy: number | null
          redistribution_targets: Json | null
          result_summary: Json | null
          social_learning_index: number | null
          social_welfare_improvement: number | null
          status: string
          total_economic_impact: number | null
          total_investment_pool: number | null
          trigger_event: string | null
          updated_at: string
          venture_success_rate: number | null
          wave_id: string
          wave_type: string
        }
        Insert: {
          affected_users_count?: number
          agency_score?: number | null
          created_at?: string
          dormant_pmc_amount?: number | null
          ebit_amount?: number | null
          effectiveness_score?: number | null
          entrepreneur_count?: number | null
          error_details?: string | null
          execution_date?: string
          execution_parameters?: Json | null
          gini_coefficient_after?: number | null
          gini_coefficient_before?: number | null
          information_transparency?: number | null
          innovation_index?: number | null
          job_creation_impact?: number | null
          pmc_issued?: number | null
          prediction_accuracy?: number | null
          redistribution_targets?: Json | null
          result_summary?: Json | null
          social_learning_index?: number | null
          social_welfare_improvement?: number | null
          status: string
          total_economic_impact?: number | null
          total_investment_pool?: number | null
          trigger_event?: string | null
          updated_at?: string
          venture_success_rate?: number | null
          wave_id?: string
          wave_type: string
        }
        Update: {
          affected_users_count?: number
          agency_score?: number | null
          created_at?: string
          dormant_pmc_amount?: number | null
          ebit_amount?: number | null
          effectiveness_score?: number | null
          entrepreneur_count?: number | null
          error_details?: string | null
          execution_date?: string
          execution_parameters?: Json | null
          gini_coefficient_after?: number | null
          gini_coefficient_before?: number | null
          information_transparency?: number | null
          innovation_index?: number | null
          job_creation_impact?: number | null
          pmc_issued?: number | null
          prediction_accuracy?: number | null
          redistribution_targets?: Json | null
          result_summary?: Json | null
          social_learning_index?: number | null
          social_welfare_improvement?: number | null
          status?: string
          total_economic_impact?: number | null
          total_investment_pool?: number | null
          trigger_event?: string | null
          updated_at?: string
          venture_success_rate?: number | null
          wave_id?: string
          wave_type?: string
        }
        Relationships: []
      }
      money_wave1_ebit_records: {
        Row: {
          agency_cost_reduction: number | null
          created_at: string
          ebit_amount: number
          operating_expenses: number | null
          organization_id: string | null
          organization_name: string
          pmc_allocation_rate: number
          pmc_issued: number
          record_id: string
          reporting_period_end: string
          reporting_period_start: string
          revenue: number | null
          transparency_bonus: number | null
          verification_method: string | null
          verification_status: string
          wave_id: string
        }
        Insert: {
          agency_cost_reduction?: number | null
          created_at?: string
          ebit_amount: number
          operating_expenses?: number | null
          organization_id?: string | null
          organization_name: string
          pmc_allocation_rate: number
          pmc_issued: number
          record_id?: string
          reporting_period_end: string
          reporting_period_start: string
          revenue?: number | null
          transparency_bonus?: number | null
          verification_method?: string | null
          verification_status: string
          wave_id: string
        }
        Update: {
          agency_cost_reduction?: number | null
          created_at?: string
          ebit_amount?: number
          operating_expenses?: number | null
          organization_id?: string | null
          organization_name?: string
          pmc_allocation_rate?: number
          pmc_issued?: number
          record_id?: string
          reporting_period_end?: string
          reporting_period_start?: string
          revenue?: number | null
          transparency_bonus?: number | null
          verification_method?: string | null
          verification_status?: string
          wave_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "money_wave1_ebit_records_wave_id_fkey"
            columns: ["wave_id"]
            isOneToOne: false
            referencedRelation: "money_wave_history"
            referencedColumns: ["wave_id"]
          },
        ]
      }
      money_wave2_redistribution_records: {
        Row: {
          created_at: string
          pigou_efficiency_gain: number | null
          pmc_amount: number
          rawls_justice_score: number | null
          record_id: string
          redistribution_reason: string
          social_impact_score: number | null
          source_user_id: string
          target_user_id: string
          wave_id: string
          welfare_improvement: number | null
        }
        Insert: {
          created_at?: string
          pigou_efficiency_gain?: number | null
          pmc_amount: number
          rawls_justice_score?: number | null
          record_id?: string
          redistribution_reason: string
          social_impact_score?: number | null
          source_user_id: string
          target_user_id: string
          wave_id: string
          welfare_improvement?: number | null
        }
        Update: {
          created_at?: string
          pigou_efficiency_gain?: number | null
          pmc_amount?: number
          rawls_justice_score?: number | null
          record_id?: string
          redistribution_reason?: string
          social_impact_score?: number | null
          source_user_id?: string
          target_user_id?: string
          wave_id?: string
          welfare_improvement?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "money_wave2_redistribution_records_wave_id_fkey"
            columns: ["wave_id"]
            isOneToOne: false
            referencedRelation: "money_wave_history"
            referencedColumns: ["wave_id"]
          },
        ]
      }
      money_wave3_entrepreneur_records: {
        Row: {
          created_at: string
          disruption_potential: number
          entrepreneur_id: string
          execution_capability: number
          expected_roi: number | null
          innovation_score: number
          investment_amount: number
          job_creation_potential: number | null
          kirzner_opportunity_index: number | null
          milestone_progress: number | null
          network_effect_potential: number
          record_id: string
          risk_assessment: number
          schumpeter_innovation_index: number | null
          social_impact_potential: number | null
          venture_proposal_id: string | null
          wave_id: string
        }
        Insert: {
          created_at?: string
          disruption_potential: number
          entrepreneur_id: string
          execution_capability: number
          expected_roi?: number | null
          innovation_score: number
          investment_amount: number
          job_creation_potential?: number | null
          kirzner_opportunity_index?: number | null
          milestone_progress?: number | null
          network_effect_potential: number
          record_id?: string
          risk_assessment: number
          schumpeter_innovation_index?: number | null
          social_impact_potential?: number | null
          venture_proposal_id?: string | null
          wave_id: string
        }
        Update: {
          created_at?: string
          disruption_potential?: number
          entrepreneur_id?: string
          execution_capability?: number
          expected_roi?: number | null
          innovation_score?: number
          investment_amount?: number
          job_creation_potential?: number | null
          kirzner_opportunity_index?: number | null
          milestone_progress?: number | null
          network_effect_potential?: number
          record_id?: string
          risk_assessment?: number
          schumpeter_innovation_index?: number | null
          social_impact_potential?: number | null
          venture_proposal_id?: string | null
          wave_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "money_wave3_entrepreneur_records_wave_id_fkey"
            columns: ["wave_id"]
            isOneToOne: false
            referencedRelation: "money_wave_history"
            referencedColumns: ["wave_id"]
          },
        ]
      }
      pmp_pmc_accounts: {
        Row: {
          created_at: string
          is_active: boolean
          last_updated: string
          pmc_balance: number
          pmp_balance: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          is_active?: boolean
          last_updated?: string
          pmc_balance?: number
          pmp_balance?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          is_active?: boolean
          last_updated?: string
          pmc_balance?: number
          pmp_balance?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pmp_pmc_transactions: {
        Row: {
          created_at: string
          description: string
          metadata: Json | null
          pmc_amount: number | null
          pmp_amount: number | null
          related_money_wave_id: string | null
          timestamp: string
          transaction_id: string
          transaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          metadata?: Json | null
          pmc_amount?: number | null
          pmp_amount?: number | null
          related_money_wave_id?: string | null
          timestamp?: string
          transaction_id?: string
          transaction_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          metadata?: Json | null
          pmc_amount?: number | null
          pmp_amount?: number | null
          related_money_wave_id?: string | null
          timestamp?: string
          transaction_id?: string
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pmp_pmc_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "pmp_pmc_accounts"
            referencedColumns: ["user_id"]
          },
        ]
      }
      social_welfare_parameters: {
        Row: {
          calculation_date: string
          confidence_interval: number | null
          created_at: string
          current_social_welfare: number | null
          gini_coefficient: number | null
          lambda: number
          mu: number
          nu: number
          omega: number
          parameter_id: string
          phi: number
          psi: number
          public_good_index: number | null
          sample_size: number
          social_mobility_index: number | null
          statistical_significance: number | null
          total_population: number
        }
        Insert: {
          calculation_date?: string
          confidence_interval?: number | null
          created_at?: string
          current_social_welfare?: number | null
          gini_coefficient?: number | null
          lambda?: number
          mu?: number
          nu?: number
          omega?: number
          parameter_id?: string
          phi?: number
          psi?: number
          public_good_index?: number | null
          sample_size: number
          social_mobility_index?: number | null
          statistical_significance?: number | null
          total_population: number
        }
        Update: {
          calculation_date?: string
          confidence_interval?: number | null
          created_at?: string
          current_social_welfare?: number | null
          gini_coefficient?: number | null
          lambda?: number
          mu?: number
          nu?: number
          omega?: number
          parameter_id?: string
          phi?: number
          psi?: number
          public_good_index?: number | null
          sample_size?: number
          social_mobility_index?: number | null
          statistical_significance?: number | null
          total_population?: number
        }
        Relationships: []
      }
      system_statistics: {
        Row: {
          active_account_count: number
          created_at: string
          gini_coefficient_pmc: number | null
          gini_coefficient_pmp: number | null
          id: number
          snapshot_date: string
          total_pmc_supply: number
          total_pmp_supply: number
          total_transaction_count: number
        }
        Insert: {
          active_account_count: number
          created_at?: string
          gini_coefficient_pmc?: number | null
          gini_coefficient_pmp?: number | null
          id?: number
          snapshot_date: string
          total_pmc_supply: number
          total_pmp_supply: number
          total_transaction_count: number
        }
        Update: {
          active_account_count?: number
          created_at?: string
          gini_coefficient_pmc?: number | null
          gini_coefficient_pmp?: number | null
          id?: number
          snapshot_date?: string
          total_pmc_supply?: number
          total_pmp_supply?: number
          total_transaction_count?: number
        }
        Relationships: []
      }
      transparency_reports: {
        Row: {
          created_at: string | null
          id: string
          impact_metrics: Json | null
          institute_id: string | null
          opinion_leader_id: string | null
          published_at: string | null
          report_period_end: string
          report_period_start: string
          report_url: string | null
          total_received: number
          total_used: number
          usage_breakdown: Json
        }
        Insert: {
          created_at?: string | null
          id?: string
          impact_metrics?: Json | null
          institute_id?: string | null
          opinion_leader_id?: string | null
          published_at?: string | null
          report_period_end: string
          report_period_start: string
          report_url?: string | null
          total_received?: number
          total_used?: number
          usage_breakdown: Json
        }
        Update: {
          created_at?: string | null
          id?: string
          impact_metrics?: Json | null
          institute_id?: string | null
          opinion_leader_id?: string | null
          published_at?: string | null
          report_period_end?: string
          report_period_start?: string
          report_url?: string | null
          total_received?: number
          total_used?: number
          usage_breakdown?: Json
        }
        Relationships: []
      }
      utility_estimation_inputs: {
        Row: {
          action_type: string
          action_value: number
          created_at: string
          input_id: string
          market_condition: string
          pmc_balance: number
          pmp_balance: number
          regret_level: number
          satisfaction_score: number
          social_context: string
          time_of_day: string
          timestamp: string
          user_id: string
          weekday: boolean
        }
        Insert: {
          action_type: string
          action_value: number
          created_at?: string
          input_id?: string
          market_condition: string
          pmc_balance: number
          pmp_balance: number
          regret_level: number
          satisfaction_score: number
          social_context: string
          time_of_day: string
          timestamp?: string
          user_id: string
          weekday: boolean
        }
        Update: {
          action_type?: string
          action_value?: number
          created_at?: string
          input_id?: string
          market_condition?: string
          pmc_balance?: number
          pmp_balance?: number
          regret_level?: number
          satisfaction_score?: number
          social_context?: string
          time_of_day?: string
          timestamp?: string
          user_id?: string
          weekday?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "utility_estimation_inputs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "individual_utility_parameters"
            referencedColumns: ["user_id"]
          },
        ]
      }
      utility_predictions: {
        Row: {
          confidence_interval_lower: number | null
          confidence_interval_upper: number | null
          created_at: string
          donation_amount: number | null
          expiry_date: string | null
          peer_group_average: number | null
          pmc_amount: number
          pmp_amount: number
          population_percentile: number | null
          predicted_utility: number
          prediction_accuracy: number | null
          prediction_date: string
          prediction_id: string
          scenario_description: string
          social_impact_score: number | null
          user_id: string
        }
        Insert: {
          confidence_interval_lower?: number | null
          confidence_interval_upper?: number | null
          created_at?: string
          donation_amount?: number | null
          expiry_date?: string | null
          peer_group_average?: number | null
          pmc_amount: number
          pmp_amount: number
          population_percentile?: number | null
          predicted_utility: number
          prediction_accuracy?: number | null
          prediction_date?: string
          prediction_id?: string
          scenario_description: string
          social_impact_score?: number | null
          user_id: string
        }
        Update: {
          confidence_interval_lower?: number | null
          confidence_interval_upper?: number | null
          created_at?: string
          donation_amount?: number | null
          expiry_date?: string | null
          peer_group_average?: number | null
          pmc_amount?: number
          pmp_amount?: number
          population_percentile?: number | null
          predicted_utility?: number
          prediction_accuracy?: number | null
          prediction_date?: string
          prediction_id?: string
          scenario_description?: string
          social_impact_score?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "utility_predictions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "individual_utility_parameters"
            referencedColumns: ["user_id"]
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
  forum: {
    Tables: {
      forum_activity_logs: {
        Row: {
          activity_type: string
          comment_id: string | null
          created_at: string | null
          description: string
          id: string
          metadata: Json | null
          pmp_earned: number | null
          post_id: string | null
          user_id: string
        }
        Insert: {
          activity_type: string
          comment_id?: string | null
          created_at?: string | null
          description: string
          id?: string
          metadata?: Json | null
          pmp_earned?: number | null
          post_id?: string | null
          user_id: string
        }
        Update: {
          activity_type?: string
          comment_id?: string | null
          created_at?: string | null
          description?: string
          id?: string
          metadata?: Json | null
          pmp_earned?: number | null
          post_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_activity_logs_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "forum_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_activity_logs_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_categories: {
        Row: {
          created_at: string | null
          description: string | null
          icon_url: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      forum_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string | null
          depth: number | null
          dislike_count: number | null
          id: string
          is_solution: boolean | null
          like_count: number | null
          metadata: Json | null
          parent_comment_id: string | null
          path: string
          pmp_earned: number | null
          post_id: string
          quality_score: number | null
          reply_count: number | null
          status: string
          updated_at: string | null
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string | null
          depth?: number | null
          dislike_count?: number | null
          id?: string
          is_solution?: boolean | null
          like_count?: number | null
          metadata?: Json | null
          parent_comment_id?: string | null
          path: string
          pmp_earned?: number | null
          post_id: string
          quality_score?: number | null
          reply_count?: number | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string | null
          depth?: number | null
          dislike_count?: number | null
          id?: string
          is_solution?: boolean | null
          like_count?: number | null
          metadata?: Json | null
          parent_comment_id?: string | null
          path?: string
          pmp_earned?: number | null
          post_id?: string
          quality_score?: number | null
          reply_count?: number | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "forum_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_post_tags: {
        Row: {
          created_at: string | null
          post_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string | null
          post_id: string
          tag_id: string
        }
        Update: {
          created_at?: string | null
          post_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_post_tags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_post_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "forum_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_posts: {
        Row: {
          author_id: string
          category_id: string
          comment_count: number | null
          content: string
          created_at: string | null
          dislike_count: number | null
          id: string
          is_locked: boolean | null
          is_pinned: boolean | null
          last_activity_at: string | null
          like_count: number | null
          metadata: Json | null
          pmp_earned: number | null
          post_type: string
          quality_score: number | null
          status: string
          tags: string[] | null
          title: string
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          author_id: string
          category_id: string
          comment_count?: number | null
          content: string
          created_at?: string | null
          dislike_count?: number | null
          id?: string
          is_locked?: boolean | null
          is_pinned?: boolean | null
          last_activity_at?: string | null
          like_count?: number | null
          metadata?: Json | null
          pmp_earned?: number | null
          post_type?: string
          quality_score?: number | null
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          author_id?: string
          category_id?: string
          comment_count?: number | null
          content?: string
          created_at?: string | null
          dislike_count?: number | null
          id?: string
          is_locked?: boolean | null
          is_pinned?: boolean | null
          last_activity_at?: string | null
          like_count?: number | null
          metadata?: Json | null
          pmp_earned?: number | null
          post_type?: string
          quality_score?: number | null
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "forum_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_tags: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          usage_count: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          usage_count?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          usage_count?: number | null
        }
        Relationships: []
      }
      forum_votes: {
        Row: {
          comment_id: string | null
          created_at: string | null
          id: string
          post_id: string | null
          updated_at: string | null
          user_id: string
          vote_type: string
        }
        Insert: {
          comment_id?: string | null
          created_at?: string | null
          id?: string
          post_id?: string | null
          updated_at?: string | null
          user_id: string
          vote_type: string
        }
        Update: {
          comment_id?: string | null
          created_at?: string | null
          id?: string
          post_id?: string | null
          updated_at?: string | null
          user_id?: string
          vote_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_votes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "forum_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_votes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
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
  investment: {
    Tables: {
      investment_categories: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          minimum_investment_default: number | null
          name: string
          parent_category_id: string | null
          pmc_reward_multiplier: number | null
          risk_multiplier: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          minimum_investment_default?: number | null
          name: string
          parent_category_id?: string | null
          pmc_reward_multiplier?: number | null
          risk_multiplier?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          minimum_investment_default?: number | null
          name?: string
          parent_category_id?: string | null
          pmc_reward_multiplier?: number | null
          risk_multiplier?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "investment_categories_parent_fkey"
            columns: ["parent_category_id"]
            isOneToOne: false
            referencedRelation: "investment_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      investment_opportunities: {
        Row: {
          category: string
          created_at: string | null
          creator_id: string
          current_amount: number | null
          description: string
          documents: Json | null
          expected_return_date: string | null
          expected_return_rate: number | null
          external_links: Json | null
          funding_end_date: string
          funding_start_date: string
          id: string
          investment_type: string
          maximum_investment: number | null
          minimum_investment: number
          money_wave_eligible: boolean | null
          performance_metrics: Json | null
          pmc_reward_pool: number | null
          pmp_required: boolean | null
          risk_level: number
          status: string
          subcategory: string | null
          tags: string[] | null
          target_amount: number
          title: string
          updated_at: string | null
          version: number | null
        }
        Insert: {
          category: string
          created_at?: string | null
          creator_id: string
          current_amount?: number | null
          description: string
          documents?: Json | null
          expected_return_date?: string | null
          expected_return_rate?: number | null
          external_links?: Json | null
          funding_end_date: string
          funding_start_date: string
          id?: string
          investment_type: string
          maximum_investment?: number | null
          minimum_investment: number
          money_wave_eligible?: boolean | null
          performance_metrics?: Json | null
          pmc_reward_pool?: number | null
          pmp_required?: boolean | null
          risk_level: number
          status?: string
          subcategory?: string | null
          tags?: string[] | null
          target_amount: number
          title: string
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          category?: string
          created_at?: string | null
          creator_id?: string
          current_amount?: number | null
          description?: string
          documents?: Json | null
          expected_return_date?: string | null
          expected_return_rate?: number | null
          external_links?: Json | null
          funding_end_date?: string
          funding_start_date?: string
          id?: string
          investment_type?: string
          maximum_investment?: number | null
          minimum_investment?: number
          money_wave_eligible?: boolean | null
          performance_metrics?: Json | null
          pmc_reward_pool?: number | null
          pmp_required?: boolean | null
          risk_level?: number
          status?: string
          subcategory?: string | null
          tags?: string[] | null
          target_amount?: number
          title?: string
          updated_at?: string | null
          version?: number | null
        }
        Relationships: []
      }
      investment_participations: {
        Row: {
          actual_return: number | null
          created_at: string | null
          currency_type: string
          expected_return: number | null
          id: string
          investment_amount: number
          investor_id: string
          opportunity_id: string
          performance_score: number | null
          pmc_amount: number | null
          pmp_amount: number | null
          return_date: string | null
          roi_percentage: number | null
          status: string
          updated_at: string | null
        }
        Insert: {
          actual_return?: number | null
          created_at?: string | null
          currency_type: string
          expected_return?: number | null
          id?: string
          investment_amount: number
          investor_id: string
          opportunity_id: string
          performance_score?: number | null
          pmc_amount?: number | null
          pmp_amount?: number | null
          return_date?: string | null
          roi_percentage?: number | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          actual_return?: number | null
          created_at?: string | null
          currency_type?: string
          expected_return?: number | null
          id?: string
          investment_amount?: number
          investor_id?: string
          opportunity_id?: string
          performance_score?: number | null
          pmc_amount?: number | null
          pmp_amount?: number | null
          return_date?: string | null
          roi_percentage?: number | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "investment_participations_opportunity_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "investment_opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      investment_performance_metrics: {
        Row: {
          burn_rate: number | null
          compliance_score: number | null
          created_at: string | null
          customer_acquisition_cost: number | null
          data_source: string | null
          ebitda: number | null
          environmental_impact_score: number | null
          id: string
          job_creation_count: number | null
          market_share: number | null
          measurement_date: string
          notes: string | null
          opportunity_id: string
          profit: number | null
          reporting_period_end: string
          reporting_period_start: string
          revenue: number | null
          risk_assessment: number | null
          runway_months: number | null
          social_impact_score: number | null
          user_growth_rate: number | null
          verification_status: string | null
        }
        Insert: {
          burn_rate?: number | null
          compliance_score?: number | null
          created_at?: string | null
          customer_acquisition_cost?: number | null
          data_source?: string | null
          ebitda?: number | null
          environmental_impact_score?: number | null
          id?: string
          job_creation_count?: number | null
          market_share?: number | null
          measurement_date?: string
          notes?: string | null
          opportunity_id: string
          profit?: number | null
          reporting_period_end: string
          reporting_period_start: string
          revenue?: number | null
          risk_assessment?: number | null
          runway_months?: number | null
          social_impact_score?: number | null
          user_growth_rate?: number | null
          verification_status?: string | null
        }
        Update: {
          burn_rate?: number | null
          compliance_score?: number | null
          created_at?: string | null
          customer_acquisition_cost?: number | null
          data_source?: string | null
          ebitda?: number | null
          environmental_impact_score?: number | null
          id?: string
          job_creation_count?: number | null
          market_share?: number | null
          measurement_date?: string
          notes?: string | null
          opportunity_id?: string
          profit?: number | null
          reporting_period_end?: string
          reporting_period_start?: string
          revenue?: number | null
          risk_assessment?: number | null
          runway_months?: number | null
          social_impact_score?: number | null
          user_growth_rate?: number | null
          verification_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "investment_performance_metrics_opportunity_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "investment_opportunities"
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
  prediction: {
    Tables: {
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
      prediction_settlements: {
        Row: {
          accuracy_score: number
          game_id: string
          prediction_id: string
          processed_at: string
          reward_amount: number
          settlement_id: string
          settlement_type: Database["public"]["Enums"]["settlement_type"]
          user_id: string
        }
        Insert: {
          accuracy_score: number
          game_id: string
          prediction_id: string
          processed_at?: string
          reward_amount: number
          settlement_id?: string
          settlement_type: Database["public"]["Enums"]["settlement_type"]
          user_id: string
        }
        Update: {
          accuracy_score?: number
          game_id?: string
          prediction_id?: string
          processed_at?: string
          reward_amount?: number
          settlement_id?: string
          settlement_type?: Database["public"]["Enums"]["settlement_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prediction_settlements_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "prediction_games"
            referencedColumns: ["game_id"]
          },
          {
            foreignKeyName: "prediction_settlements_prediction_id_fkey"
            columns: ["prediction_id"]
            isOneToOne: true
            referencedRelation: "predictions"
            referencedColumns: ["prediction_id"]
          },
        ]
      }
      prediction_statistics: {
        Row: {
          game_id: string
          last_updated: string
          option_distributions: Json
          total_bet_amount: number
          total_participants: number
          trend_data: Json
        }
        Insert: {
          game_id: string
          last_updated?: string
          option_distributions?: Json
          total_bet_amount?: number
          total_participants?: number
          trend_data?: Json
        }
        Update: {
          game_id?: string
          last_updated?: string
          option_distributions?: Json
          total_bet_amount?: number
          total_participants?: number
          trend_data?: Json
        }
        Relationships: [
          {
            foreignKeyName: "prediction_statistics_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: true
            referencedRelation: "prediction_games"
            referencedColumns: ["game_id"]
          },
        ]
      }
      prediction_trends: {
        Row: {
          created_at: string
          game_id: string
          snapshot_data: Json
          timestamp: string
          trend_id: string
        }
        Insert: {
          created_at?: string
          game_id: string
          snapshot_data: Json
          timestamp?: string
          trend_id?: string
        }
        Update: {
          created_at?: string
          game_id?: string
          snapshot_data?: Json
          timestamp?: string
          trend_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prediction_trends_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "prediction_games"
            referencedColumns: ["game_id"]
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
  public: {
    Tables: {
      [_ in never]: never
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
      calculate_prediction_accuracy: {
        Args: { p_user_id: string }
        Returns: number
      }
      calculate_reward_amount: {
        Args: { p_prediction_id: string; p_game_outcome: Json }
        Returns: number
      }
      get_active_games: {
        Args: { p_limit?: number }
        Returns: {
          id: string
          title: string
          description: string
          prediction_type: string
          status: string
          participant_count: number
          total_stake: number
          end_time: string
        }[]
      }
      get_user_prediction_history: {
        Args: { p_user_id: string; p_limit?: number }
        Returns: {
          prediction_id: string
          game_title: string
          prediction_data: Json
          stake: number
          confidence_level: number
          is_settled: boolean
          is_correct: boolean
          reward_amount: number
          created_at: string
        }[]
      }
      validate_pmp_balance: {
        Args: { p_user_id: string; p_required_amount: number }
        Returns: boolean
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
  study_cycle: {
    Tables: {
      sc_assessments: {
        Row: {
          completed_at: string | null
          id: string
          started_at: string
          status: string
          title: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          started_at?: string
          status?: string
          title: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          started_at?: string
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      sc_chapters: {
        Row: {
          created_at: string
          id: string
          order: number
          textbook_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          order: number
          textbook_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          order?: number
          textbook_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sc_chapters_textbook_id_fkey"
            columns: ["textbook_id"]
            isOneToOne: false
            referencedRelation: "sc_textbooks"
            referencedColumns: ["id"]
          },
        ]
      }
      sc_questions: {
        Row: {
          chapter_id: string
          created_at: string
          id: string
          options: Json | null
          question_text: string
          question_type: string
          solution_template: string | null
          updated_at: string
        }
        Insert: {
          chapter_id: string
          created_at?: string
          id?: string
          options?: Json | null
          question_text: string
          question_type: string
          solution_template?: string | null
          updated_at?: string
        }
        Update: {
          chapter_id?: string
          created_at?: string
          id?: string
          options?: Json | null
          question_text?: string
          question_type?: string
          solution_template?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sc_questions_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "sc_chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      sc_study_sessions: {
        Row: {
          chapter_id: string | null
          created_at: string
          duration_seconds: number | null
          end_time: string | null
          id: string
          start_time: string
          textbook_id: string
          user_id: string
        }
        Insert: {
          chapter_id?: string | null
          created_at?: string
          duration_seconds?: number | null
          end_time?: string | null
          id?: string
          start_time: string
          textbook_id: string
          user_id: string
        }
        Update: {
          chapter_id?: string | null
          created_at?: string
          duration_seconds?: number | null
          end_time?: string | null
          id?: string
          start_time?: string
          textbook_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sc_study_sessions_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "sc_chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sc_study_sessions_textbook_id_fkey"
            columns: ["textbook_id"]
            isOneToOne: false
            referencedRelation: "sc_textbooks"
            referencedColumns: ["id"]
          },
        ]
      }
      sc_textbooks: {
        Row: {
          cover_image_url: string | null
          created_at: string
          creator_id: string | null
          description: string | null
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          creator_id?: string | null
          description?: string | null
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          creator_id?: string | null
          description?: string | null
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      sc_user_answers: {
        Row: {
          assessment_id: string
          id: string
          is_correct: boolean | null
          question_id: string
          score: number | null
          submitted_at: string
          user_answer: string | null
          user_id: string
        }
        Insert: {
          assessment_id: string
          id?: string
          is_correct?: boolean | null
          question_id: string
          score?: number | null
          submitted_at?: string
          user_answer?: string | null
          user_id: string
        }
        Update: {
          assessment_id?: string
          id?: string
          is_correct?: boolean | null
          question_id?: string
          score?: number | null
          submitted_at?: string
          user_answer?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sc_user_answers_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "sc_assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sc_user_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "sc_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      sc_user_textbook_progress: {
        Row: {
          read_count: number
          textbook_id: string
          total_study_duration_seconds: number
          updated_at: string
          user_id: string
        }
        Insert: {
          read_count?: number
          textbook_id: string
          total_study_duration_seconds?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          read_count?: number
          textbook_id?: string
          total_study_duration_seconds?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sc_user_textbook_progress_textbook_id_fkey"
            columns: ["textbook_id"]
            isOneToOne: false
            referencedRelation: "sc_textbooks"
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
  user: {
    Tables: {
      behavioral_bias_profiles: {
        Row: {
          anchoring: number
          availability_heuristic: number
          confirmation_bias: number
          created_at: string
          endowment_effect: number
          herding: number
          hyperbolic_discounting: number
          loss_aversion: number
          measurement_count: number
          mental_accounting: number
          overconfidence: number
          profile_date: string
          recency_bias: number
          reliability_score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          anchoring?: number
          availability_heuristic?: number
          confirmation_bias?: number
          created_at?: string
          endowment_effect?: number
          herding?: number
          hyperbolic_discounting?: number
          loss_aversion?: number
          measurement_count?: number
          mental_accounting?: number
          overconfidence?: number
          profile_date?: string
          recency_bias?: number
          reliability_score?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          anchoring?: number
          availability_heuristic?: number
          confirmation_bias?: number
          created_at?: string
          endowment_effect?: number
          herding?: number
          hyperbolic_discounting?: number
          loss_aversion?: number
          measurement_count?: number
          mental_accounting?: number
          overconfidence?: number
          profile_date?: string
          recency_bias?: number
          reliability_score?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      opinion_leaders: {
        Row: {
          bio: string | null
          category: string
          created_at: string | null
          display_name: string
          follower_count: number | null
          id: string
          is_active: boolean | null
          profile_image_url: string | null
          total_support_received: number | null
          updated_at: string | null
          user_id: string
          verification_status: string | null
        }
        Insert: {
          bio?: string | null
          category: string
          created_at?: string | null
          display_name: string
          follower_count?: number | null
          id?: string
          is_active?: boolean | null
          profile_image_url?: string | null
          total_support_received?: number | null
          updated_at?: string | null
          user_id: string
          verification_status?: string | null
        }
        Update: {
          bio?: string | null
          category?: string
          created_at?: string | null
          display_name?: string
          follower_count?: number | null
          id?: string
          is_active?: boolean | null
          profile_image_url?: string | null
          total_support_received?: number | null
          updated_at?: string | null
          user_id?: string
          verification_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "opinion_leaders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_cluster_assignments: {
        Row: {
          assignment_date: string
          assignment_probability: number
          cluster_id: string
          distance_from_center: number | null
          user_id: string
        }
        Insert: {
          assignment_date?: string
          assignment_probability: number
          cluster_id: string
          distance_from_center?: number | null
          user_id: string
        }
        Update: {
          assignment_date?: string
          assignment_probability?: number
          cluster_id?: string
          distance_from_center?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_cluster_assignments_cluster_id_fkey"
            columns: ["cluster_id"]
            isOneToOne: false
            referencedRelation: "user_utility_clusters"
            referencedColumns: ["cluster_id"]
          },
        ]
      }
      user_utility_clusters: {
        Row: {
          center_alpha: number
          center_beta: number
          center_delta: number
          center_epsilon: number
          center_gamma: number
          cluster_description: string | null
          cluster_id: string
          cluster_name: string
          clustering_date: string
          created_at: string
          member_count: number
          risk_tolerance_level: string | null
          social_orientation: string | null
          typical_behavior_pattern: string | null
          variance_within_cluster: number | null
        }
        Insert: {
          center_alpha: number
          center_beta: number
          center_delta: number
          center_epsilon: number
          center_gamma: number
          cluster_description?: string | null
          cluster_id?: string
          cluster_name: string
          clustering_date?: string
          created_at?: string
          member_count?: number
          risk_tolerance_level?: string | null
          social_orientation?: string | null
          typical_behavior_pattern?: string | null
          variance_within_cluster?: number | null
        }
        Update: {
          center_alpha?: number
          center_beta?: number
          center_delta?: number
          center_epsilon?: number
          center_gamma?: number
          cluster_description?: string | null
          cluster_id?: string
          cluster_name?: string
          clustering_date?: string
          created_at?: string
          member_count?: number
          risk_tolerance_level?: string | null
          social_orientation?: string | null
          typical_behavior_pattern?: string | null
          variance_within_cluster?: number | null
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          is_active: boolean | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          username?: string | null
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

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  donation: {
    Enums: {},
  },
  economy: {
    Enums: {},
  },
  forum: {
    Enums: {},
  },
  investment: {
    Enums: {},
  },
  prediction: {
    Enums: {},
  },
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
  study_cycle: {
    Enums: {},
  },
  user: {
    Enums: {},
  },
} as const
