-- Add category column to prediction_games table
ALTER TABLE prediction_games 
ADD COLUMN category TEXT NOT NULL DEFAULT 'SPORTS' 
CHECK (category IN ('SPORTS', 'POLITICS', 'INVEST', 'ENTERTAINMENT'));

CREATE INDEX IF NOT EXISTS idx_prediction_games_category 
    ON prediction_games(category);
