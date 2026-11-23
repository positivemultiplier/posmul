-- PosMul Prediction AI 모델 독립 예측 스냅샷 및 정산 자동 채점 테이블
CREATE TABLE IF NOT EXISTS prediction.ai_forecasts (
  forecast_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES prediction.prediction_games(game_id) ON DELETE CASCADE,
  provider_key text NOT NULL,
  provider_label text NOT NULL,
  model_name text NOT NULL,
  category text NOT NULL DEFAULT 'GENERAL',
  prediction_type text NOT NULL DEFAULT 'BINARY',
  region_code text,
  selected_option_id text NOT NULL,
  selected_option_label text NOT NULL,
  confidence_pct integer NOT NULL CHECK (confidence_pct BETWEEN 1 AND 99),
  reasoning text NOT NULL,
  is_hit boolean,
  brier_score numeric(6, 4),
  settled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_ai_forecasts_game_provider UNIQUE (game_id, provider_key)
);

CREATE INDEX IF NOT EXISTS idx_ai_forecasts_game_id
  ON prediction.ai_forecasts (game_id);

CREATE INDEX IF NOT EXISTS idx_ai_forecasts_provider_category_settled
  ON prediction.ai_forecasts (provider_key, category, settled_at DESC)
  WHERE is_hit IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ai_forecasts_provider_settled
  ON prediction.ai_forecasts (provider_key, settled_at DESC)
  WHERE is_hit IS NOT NULL;

ALTER TABLE prediction.ai_forecasts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_forecasts_public_read" ON prediction.ai_forecasts;
CREATE POLICY "ai_forecasts_public_read"
  ON prediction.ai_forecasts
  FOR SELECT
  TO anon, authenticated
  USING (true);

GRANT SELECT ON TABLE prediction.ai_forecasts TO anon, authenticated;
GRANT ALL ON TABLE prediction.ai_forecasts TO service_role;

-- 게임 정산(SETTLED) 시 해당 게임의 AI 예측 적중 여부 및 Brier Score 자동 채점 트리거
CREATE OR REPLACE FUNCTION prediction.grade_ai_forecasts_on_game_settled()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'prediction'
AS $function$
BEGIN
  IF NEW.status::text = 'SETTLED'
     AND NEW.winning_option_id IS NOT NULL
     AND (
       OLD.status::text IS DISTINCT FROM 'SETTLED'
       OR OLD.winning_option_id::text IS DISTINCT FROM NEW.winning_option_id::text
     ) THEN
    UPDATE prediction.ai_forecasts
    SET is_hit = (selected_option_id = NEW.winning_option_id::text),
        brier_score = ROUND(
          POWER(
            (CASE WHEN selected_option_id = NEW.winning_option_id::text THEN 1.0 ELSE 0.0 END)
            - (confidence_pct::numeric / 100.0),
            2
          ),
          4
        ),
        settled_at = COALESCE(NEW.settled_at, NOW())
    WHERE game_id = NEW.game_id
      AND is_hit IS NULL;
  END IF;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION prediction.grade_ai_forecasts_on_game_settled() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION prediction.grade_ai_forecasts_on_game_settled() TO service_role;

DROP TRIGGER IF EXISTS trg_grade_ai_forecasts_on_game_settled ON prediction.prediction_games;
CREATE TRIGGER trg_grade_ai_forecasts_on_game_settled
  AFTER UPDATE OF status, winning_option_id ON prediction.prediction_games
  FOR EACH ROW
  EXECUTE FUNCTION prediction.grade_ai_forecasts_on_game_settled();
