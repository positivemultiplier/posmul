/**
 * Economy Bounded Context Supabase Database Types
 * Auto-generated types for Economy schema tables
 */

export interface Database {
  economy: {
    Tables: {
      pmp_pmc_accounts: {
        Row: {
          id: string;
          user_id: string;
          pmp_balance: number;
          pmc_balance: number;
          total_earned_pmp: number;
          total_converted_pmc: number;
          last_activity_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          pmp_balance?: number;
          pmc_balance?: number;
          total_earned_pmp?: number;
          total_converted_pmc?: number;
          last_activity_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          pmp_balance?: number;
          pmc_balance?: number;
          total_earned_pmp?: number;
          total_converted_pmc?: number;
          last_activity_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      money_wave_events: {
        Row: {
          id: string;
          wave_type: "WAVE1" | "WAVE2" | "WAVE3";
          event_data: Record<string, any>;
          triggered_by: string;
          ebit_amount?: number;
          pmc_issued?: number;
          redistribution_amount?: number;
          efficiency_score?: number;
          innovation_multiplier?: number;
          processed_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          wave_type: "WAVE1" | "WAVE2" | "WAVE3";
          event_data: Record<string, any>;
          triggered_by: string;
          ebit_amount?: number;
          pmc_issued?: number;
          redistribution_amount?: number;
          efficiency_score?: number;
          innovation_multiplier?: number;
          processed_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          wave_type?: "WAVE1" | "WAVE2" | "WAVE3";
          event_data?: Record<string, any>;
          triggered_by?: string;
          ebit_amount?: number;
          pmc_issued?: number;
          redistribution_amount?: number;
          efficiency_score?: number;
          innovation_multiplier?: number;
          processed_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      utility_functions: {
        Row: {
          id: string;
          user_id: string;
          alpha_pmp: number;
          beta_pmc: number;
          gamma_social: number;
          utility_score: number;
          measurement_period: string;
          sample_size: number;
          confidence_level: number;
          last_estimated_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          alpha_pmp?: number;
          beta_pmc?: number;
          gamma_social?: number;
          utility_score?: number;
          measurement_period: string;
          sample_size?: number;
          confidence_level?: number;
          last_estimated_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          alpha_pmp?: number;
          beta_pmc?: number;
          gamma_social?: number;
          utility_score?: number;
          measurement_period?: string;
          sample_size?: number;
          confidence_level?: number;
          last_estimated_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      ab_testing_results: {
        Row: {
          id: string;
          experiment_id: string;
          user_id: string;
          variant_name: string;
          metrics: Record<string, any>;
          started_at: string;
          ended_at?: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          experiment_id: string;
          user_id: string;
          variant_name: string;
          metrics: Record<string, any>;
          started_at?: string;
          ended_at?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          experiment_id?: string;
          user_id?: string;
          variant_name?: string;
          metrics?: Record<string, any>;
          started_at?: string;
          ended_at?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      panel_data_analysis: {
        Row: {
          id: string;
          panel_id: string;
          time_period: number;
          entity_id: string;
          dependent_variable: number;
          independent_variables: Record<string, any>;
          fixed_effects?: Record<string, any>;
          random_effects?: Record<string, any>;
          residuals?: number;
          fitted_values?: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          panel_id: string;
          time_period: number;
          entity_id: string;
          dependent_variable: number;
          independent_variables: Record<string, any>;
          fixed_effects?: Record<string, any>;
          random_effects?: Record<string, any>;
          residuals?: number;
          fitted_values?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          panel_id?: string;
          time_period?: number;
          entity_id?: string;
          dependent_variable?: number;
          independent_variables?: Record<string, any>;
          fixed_effects?: Record<string, any>;
          random_effects?: Record<string, any>;
          residuals?: number;
          fitted_values?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      regression_results: {
        Row: {
          id: string;
          model_name: string;
          model_type: string;
          coefficients: Record<string, any>;
          r_squared?: number;
          adjusted_r_squared?: number;
          f_statistic?: number;
          p_value?: number;
          observations_count: number;
          degrees_of_freedom: number;
          residual_std_error?: number;
          analysis_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          model_name: string;
          model_type: string;
          coefficients: Record<string, any>;
          r_squared?: number;
          adjusted_r_squared?: number;
          f_statistic?: number;
          p_value?: number;
          observations_count: number;
          degrees_of_freedom: number;
          residual_std_error?: number;
          analysis_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          model_name?: string;
          model_type?: string;
          coefficients?: Record<string, any>;
          r_squared?: number;
          adjusted_r_squared?: number;
          f_statistic?: number;
          p_value?: number;
          observations_count?: number;
          degrees_of_freedom?: number;
          residual_std_error?: number;
          analysis_date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      economic_forecasts: {
        Row: {
          id: string;
          forecast_type: string;
          target_variable: string;
          forecast_horizon: number;
          predicted_value: number;
          confidence_interval_lower?: number;
          confidence_interval_upper?: number;
          model_used: string;
          actual_value?: number;
          forecast_error?: number;
          forecast_date: string;
          target_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          forecast_type: string;
          target_variable: string;
          forecast_horizon: number;
          predicted_value: number;
          confidence_interval_lower?: number;
          confidence_interval_upper?: number;
          model_used: string;
          actual_value?: number;
          forecast_error?: number;
          forecast_date: string;
          target_date: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          forecast_type?: string;
          target_variable?: string;
          forecast_horizon?: number;
          predicted_value?: number;
          confidence_interval_lower?: number;
          confidence_interval_upper?: number;
          model_used?: string;
          actual_value?: number;
          forecast_error?: number;
          forecast_date?: string;
          target_date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      ml_models: {
        Row: {
          id: string;
          model_name: string;
          model_type: string;
          algorithm_details: Record<string, any>;
          training_data_size: number;
          validation_score?: number;
          feature_importance?: Record<string, any>;
          model_version: string;
          is_active: boolean;
          trained_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          model_name: string;
          model_type: string;
          algorithm_details: Record<string, any>;
          training_data_size: number;
          validation_score?: number;
          feature_importance?: Record<string, any>;
          model_version?: string;
          is_active?: boolean;
          trained_at: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          model_name?: string;
          model_type?: string;
          algorithm_details?: Record<string, any>;
          training_data_size?: number;
          validation_score?: number;
          feature_importance?: Record<string, any>;
          model_version?: string;
          is_active?: boolean;
          trained_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      ml_predictions: {
        Row: {
          id: string;
          model_id: string;
          input_features: Record<string, any>;
          predicted_output: Record<string, any>;
          confidence_score?: number;
          actual_output?: Record<string, any>;
          prediction_error?: number;
          predicted_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          model_id: string;
          input_features: Record<string, any>;
          predicted_output: Record<string, any>;
          confidence_score?: number;
          actual_output?: Record<string, any>;
          prediction_error?: number;
          predicted_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          model_id?: string;
          input_features?: Record<string, any>;
          predicted_output?: Record<string, any>;
          confidence_score?: number;
          actual_output?: Record<string, any>;
          prediction_error?: number;
          predicted_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      economic_indicators: {
        Row: {
          id: string;
          indicator_name: string;
          indicator_value: number;
          indicator_unit?: string;
          calculation_method?: string;
          data_source?: string;
          measurement_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          indicator_name: string;
          indicator_value: number;
          indicator_unit?: string;
          calculation_method?: string;
          data_source?: string;
          measurement_date: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          indicator_name?: string;
          indicator_value?: number;
          indicator_unit?: string;
          calculation_method?: string;
          data_source?: string;
          measurement_date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      wave_type: "WAVE1" | "WAVE2" | "WAVE3";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
