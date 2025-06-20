-- Economic Analytics Tables
-- Row Level Security (RLS) enabled for all tables

-- 004_economic_analytics.sql
-- Economic Analytics and Machine Learning Tables

-- A/B Testing Results Table
CREATE TABLE economy.ab_testing_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_id VARCHAR(255) NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    variant_name VARCHAR(100) NOT NULL,
    metrics JSONB NOT NULL, -- conversion_rate, click_through_rate, etc.
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Panel Data Analysis Results
CREATE TABLE economy.panel_data_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    panel_id VARCHAR(255) NOT NULL,
    time_period INTEGER NOT NULL, -- period number in panel
    entity_id UUID NOT NULL, -- user, group, or region
    dependent_variable DECIMAL(20, 8) NOT NULL,
    independent_variables JSONB NOT NULL, -- array of variables
    fixed_effects JSONB, -- entity and time fixed effects
    random_effects JSONB, -- random effects if applicable
    residuals DECIMAL(20, 8),
    fitted_values DECIMAL(20, 8),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Regression Analysis Results
CREATE TABLE economy.regression_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_name VARCHAR(255) NOT NULL,
    model_type VARCHAR(100) NOT NULL, -- OLS, Fixed-Effect, Random-Effect, etc.
    coefficients JSONB NOT NULL, -- beta values with standard errors
    r_squared DECIMAL(10, 6),
    adjusted_r_squared DECIMAL(10, 6),
    f_statistic DECIMAL(20, 8),
    p_value DECIMAL(20, 8),
    observations_count INTEGER NOT NULL,
    degrees_of_freedom INTEGER NOT NULL,
    residual_std_error DECIMAL(20, 8),
    analysis_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Economic Forecasting Data
CREATE TABLE economy.economic_forecasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    forecast_type VARCHAR(100) NOT NULL, -- PMP_DEMAND, PMC_PRICE, USER_UTILITY
    target_variable VARCHAR(100) NOT NULL,
    forecast_horizon INTEGER NOT NULL, -- days ahead
    predicted_value DECIMAL(20, 8) NOT NULL,
    confidence_interval_lower DECIMAL(20, 8),
    confidence_interval_upper DECIMAL(20, 8),
    model_used VARCHAR(255) NOT NULL, -- ARIMA, VAR, ML Model name
    actual_value DECIMAL(20, 8), -- filled when observed
    forecast_error DECIMAL(20, 8), -- predicted - actual
    forecast_date TIMESTAMP WITH TIME ZONE NOT NULL,
    target_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Machine Learning Model Metadata
CREATE TABLE economy.ml_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_name VARCHAR(255) NOT NULL UNIQUE,
    model_type VARCHAR(100) NOT NULL, -- RandomForest, SVM, NeuralNetwork, etc.
    algorithm_details JSONB NOT NULL, -- hyperparameters, architecture
    training_data_size INTEGER NOT NULL,
    validation_score DECIMAL(10, 6),
    feature_importance JSONB, -- feature names and importance scores
    model_version VARCHAR(50) NOT NULL DEFAULT '1.0.0',
    is_active BOOLEAN NOT NULL DEFAULT true,
    trained_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Machine Learning Predictions
CREATE TABLE economy.ml_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id UUID NOT NULL REFERENCES economy.ml_models(id) ON DELETE CASCADE,
    input_features JSONB NOT NULL, -- feature vector used for prediction
    predicted_output JSONB NOT NULL, -- prediction result(s)
    confidence_score DECIMAL(10, 6),
    actual_output JSONB, -- filled when observed for model evaluation
    prediction_error DECIMAL(20, 8), -- |predicted - actual|
    predicted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Economic Indicators Tracking
CREATE TABLE economy.economic_indicators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    indicator_name VARCHAR(255) NOT NULL,
    indicator_value DECIMAL(20, 8) NOT NULL,
    indicator_unit VARCHAR(50), -- %, ratio, count, etc.
    calculation_method TEXT,
    data_source VARCHAR(255),
    measurement_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_ab_testing_experiment ON economy.ab_testing_results(experiment_id);
CREATE INDEX idx_ab_testing_user ON economy.ab_testing_results(user_id);
CREATE INDEX idx_panel_data_entity ON economy.panel_data_analysis(entity_id, time_period);
CREATE INDEX idx_regression_model ON economy.regression_results(model_name);
CREATE INDEX idx_forecasts_type_date ON economy.economic_forecasts(forecast_type, target_date);
CREATE INDEX idx_ml_models_active ON economy.ml_models(is_active, model_name);
CREATE INDEX idx_ml_predictions_model ON economy.ml_predictions(model_id, predicted_at);
CREATE INDEX idx_indicators_name_date ON economy.economic_indicators(indicator_name, measurement_date);

-- Enable Row Level Security
ALTER TABLE economy.ab_testing_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE economy.panel_data_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE economy.regression_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE economy.economic_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE economy.ml_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE economy.ml_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE economy.economic_indicators ENABLE ROW LEVEL SECURITY;

-- RLS Policies (basic read access for authenticated users)
CREATE POLICY "Users can read their own AB testing results" ON economy.ab_testing_results
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can read panel data they're part of" ON economy.panel_data_analysis
    FOR SELECT USING (auth.uid() = entity_id);

CREATE POLICY "Authenticated users can read regression results" ON economy.regression_results
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read economic forecasts" ON economy.economic_forecasts
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read ML models" ON economy.ml_models
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read ML predictions" ON economy.ml_predictions
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read economic indicators" ON economy.economic_indicators
    FOR SELECT USING (auth.role() = 'authenticated');

-- Update triggers
CREATE OR REPLACE FUNCTION economy.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ab_testing_results_updated_at BEFORE UPDATE ON economy.ab_testing_results FOR EACH ROW EXECUTE FUNCTION economy.update_updated_at_column();
CREATE TRIGGER update_panel_data_analysis_updated_at BEFORE UPDATE ON economy.panel_data_analysis FOR EACH ROW EXECUTE FUNCTION economy.update_updated_at_column();
CREATE TRIGGER update_regression_results_updated_at BEFORE UPDATE ON economy.regression_results FOR EACH ROW EXECUTE FUNCTION economy.update_updated_at_column();
CREATE TRIGGER update_economic_forecasts_updated_at BEFORE UPDATE ON economy.economic_forecasts FOR EACH ROW EXECUTE FUNCTION economy.update_updated_at_column();
CREATE TRIGGER update_ml_models_updated_at BEFORE UPDATE ON economy.ml_models FOR EACH ROW EXECUTE FUNCTION economy.update_updated_at_column();
CREATE TRIGGER update_ml_predictions_updated_at BEFORE UPDATE ON economy.ml_predictions FOR EACH ROW EXECUTE FUNCTION economy.update_updated_at_column();
CREATE TRIGGER update_economic_indicators_updated_at BEFORE UPDATE ON economy.economic_indicators FOR EACH ROW EXECUTE FUNCTION economy.update_updated_at_column();
