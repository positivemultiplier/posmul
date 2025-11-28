-- Add tags column to prediction_games table
ALTER TABLE prediction_games 
ADD COLUMN tags TEXT[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_prediction_games_tags 
    ON prediction_games USING GIN(tags);
