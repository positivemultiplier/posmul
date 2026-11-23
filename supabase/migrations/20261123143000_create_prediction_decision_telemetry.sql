-- PosMul 내부 의사결정 행동 텔레메트리 수집 테이블 (1차: 예측 참여 시점 무자각 행동 시그널)
CREATE TABLE IF NOT EXISTS prediction.decision_telemetry (
  telemetry_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  game_id uuid NOT NULL REFERENCES prediction.prediction_games(game_id) ON DELETE CASCADE,
  prediction_id text,
  selected_option_id text NOT NULL,
  stake_amount bigint NOT NULL CHECK (stake_amount > 0),
  user_pmp_balance_before bigint,
  stake_conviction_ratio numeric(6, 4),
  option_prob_at_time numeric(6, 4),
  deliberation_sec integer NOT NULL DEFAULT 0 CHECK (deliberation_sec >= 0 AND deliberation_sec <= 86400),
  viewed_briefing boolean NOT NULL DEFAULT false,
  viewed_ai_forecasts boolean NOT NULL DEFAULT false,
  chart_tab_switches integer NOT NULL DEFAULT 0,
  device_type text NOT NULL DEFAULT 'unknown',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_decision_telemetry_game_created
  ON prediction.decision_telemetry (game_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_decision_telemetry_user_created
  ON prediction.decision_telemetry (user_id, created_at DESC);

ALTER TABLE prediction.decision_telemetry ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "decision_telemetry_insert_own" ON prediction.decision_telemetry;
CREATE POLICY "decision_telemetry_insert_own"
  ON prediction.decision_telemetry
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "decision_telemetry_select_own" ON prediction.decision_telemetry;
CREATE POLICY "decision_telemetry_select_own"
  ON prediction.decision_telemetry
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

GRANT SELECT, INSERT ON TABLE prediction.decision_telemetry TO authenticated;
GRANT ALL ON TABLE prediction.decision_telemetry TO service_role;
