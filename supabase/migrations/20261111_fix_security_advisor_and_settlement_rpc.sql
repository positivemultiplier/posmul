-- ============================================================================
-- Migration: 20261111_fix_security_advisor_and_settlement_rpc.sql
-- Purpose:
--   1. Fix public.settle_prediction_game() wave_type & status check constraint
--   2. Enable RLS & policies on 6 public-facing tables (rls_disabled_in_public)
--   3. Switch 3 views to security_invoker = true & revoke anon/authenticated
--      access on sensitive views (auth_users_exposed, security_definer_view)
--   4. Fix mutable search_path on 4 functions (function_search_path_mutable)
-- ============================================================================

-- 1. Fix public.settle_prediction_game() constraint values ('MONEY_WAVE_1', 'COMPLETED')
CREATE OR REPLACE FUNCTION public.settle_prediction_game(p_game_id uuid, p_correct_option_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'prediction', 'economy', 'forum'
AS $function$
DECLARE
  v_prediction RECORD;
  v_winners_count INT := 0;
  v_losers_count INT := 0;
  v_total_reward DECIMAL := 0;
  v_total_bet_pool DECIMAL := 0;
  v_mw_distributed DECIMAL := 0;
  v_reward DECIMAL;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM prediction.prediction_games
    WHERE game_id = p_game_id AND status IN ('ACTIVE', 'CLOSED', 'SETTLING')
  ) THEN
    RAISE EXCEPTION 'Game not found or not settleable: %', p_game_id;
  END IF;

  SELECT COALESCE(SUM(bet_amount), 0) INTO v_total_bet_pool
  FROM prediction.predictions
  WHERE game_id = p_game_id AND is_active = true;

  UPDATE prediction.prediction_games
  SET actual_result = jsonb_build_object('correctOptionId', p_correct_option_id),
      winning_option_id = p_correct_option_id,
      settled_at = NOW(),
      status = 'SETTLED',
      updated_at = NOW()
  WHERE game_id = p_game_id;

  FOR v_prediction IN
    SELECT prediction_id, user_id, bet_amount, prediction_data
    FROM prediction.predictions
    WHERE game_id = p_game_id AND is_active = true
  LOOP
    IF (v_prediction.prediction_data->>'selectedOptionId') = p_correct_option_id THEN
      v_reward := public.calculate_reward_amount(v_prediction.prediction_id, p_correct_option_id);
      PERFORM public.settle_prediction(v_prediction.prediction_id, true, v_reward);
      v_winners_count := v_winners_count + 1;
      v_total_reward := v_total_reward + v_reward;
    ELSE
      PERFORM public.settle_prediction(v_prediction.prediction_id, false, 0);
      v_losers_count := v_losers_count + 1;
    END IF;
  END LOOP;

  v_mw_distributed := GREATEST(0, v_total_reward - v_total_bet_pool);
  IF v_winners_count > 0 AND v_mw_distributed > 0 THEN
    INSERT INTO economy.money_wave_history (
      wave_id,
      wave_type,
      execution_date,
      status,
      ebit_amount,
      pmc_issued,
      affected_users_count,
      trigger_event,
      result_summary,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      'MONEY_WAVE_1',
      NOW(),
      'COMPLETED',
      36500000,
      v_mw_distributed,
      v_winners_count,
      'prediction_settlement',
      jsonb_build_object(
        'game_id', p_game_id,
        'winners_count', v_winners_count,
        'losers_count', v_losers_count,
        'total_bet_pool', v_total_bet_pool,
        'total_reward_distributed', v_total_reward,
        'moneywave_bonus_pmc', v_mw_distributed
      ),
      NOW(),
      NOW()
    );
  END IF;

  RETURN jsonb_build_object(
    'game_id', p_game_id,
    'correct_option_id', p_correct_option_id,
    'winners_count', v_winners_count,
    'losers_count', v_losers_count,
    'total_reward_distributed', v_total_reward,
    'moneywave_bonus_distributed', v_mw_distributed,
    'settled_at', NOW()
  );
END;
$function$;

-- 2. Enable RLS on exposed tables in forum and prediction schemas
ALTER TABLE forum.forum_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum.forum_prediction_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum.live_room_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction.user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction.user_challenge_bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction.user_challenge_comments ENABLE ROW LEVEL SECURITY;

-- 3. Create safe RLS policies for the 6 tables (service_role bypasses RLS automatically)
DROP POLICY IF EXISTS "forum_regions_select_public" ON forum.forum_regions;
CREATE POLICY "forum_regions_select_public" ON forum.forum_regions
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "forum_prediction_links_select_public" ON forum.forum_prediction_links;
CREATE POLICY "forum_prediction_links_select_public" ON forum.forum_prediction_links
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "live_room_messages_select_public" ON forum.live_room_messages;
CREATE POLICY "live_room_messages_select_public" ON forum.live_room_messages
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "user_challenges_select_public" ON prediction.user_challenges;
CREATE POLICY "user_challenges_select_public" ON prediction.user_challenges
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "user_challenges_insert_own" ON prediction.user_challenges;
CREATE POLICY "user_challenges_insert_own" ON prediction.user_challenges
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = host_id);

DROP POLICY IF EXISTS "user_challenge_bets_select_public" ON prediction.user_challenge_bets;
CREATE POLICY "user_challenge_bets_select_public" ON prediction.user_challenge_bets
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "user_challenge_bets_insert_own" ON prediction.user_challenge_bets;
CREATE POLICY "user_challenge_bets_insert_own" ON prediction.user_challenge_bets
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_challenge_comments_select_public" ON prediction.user_challenge_comments;
CREATE POLICY "user_challenge_comments_select_public" ON prediction.user_challenge_comments
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "user_challenge_comments_insert_own" ON prediction.user_challenge_comments;
CREATE POLICY "user_challenge_comments_insert_own" ON prediction.user_challenge_comments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 4. Add explicit policies for tables with RLS enabled but no policy
DROP POLICY IF EXISTS "money_wave3_ventures_select_public" ON economy.money_wave3_ventures;
CREATE POLICY "money_wave3_ventures_select_public" ON economy.money_wave3_ventures
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "money_wave_config_select_public" ON economy.money_wave_config;
CREATE POLICY "money_wave_config_select_public" ON economy.money_wave_config
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "banned_ips_service_role_only" ON forum.banned_ips;
CREATE POLICY "banned_ips_service_role_only" ON forum.banned_ips
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 5. Fix SECURITY DEFINER views & exposed auth.users view
ALTER VIEW study_cycle.auth_security_metrics SET (security_invoker = true);
REVOKE ALL ON study_cycle.auth_security_metrics FROM PUBLIC, anon, authenticated;
GRANT SELECT ON study_cycle.auth_security_metrics TO service_role;

ALTER VIEW economy.user_profiles_with_balance SET (security_invoker = true);

ALTER VIEW economy.v_account_audit_ledger SET (security_invoker = true);
REVOKE ALL ON economy.v_account_audit_ledger FROM PUBLIC, anon, authenticated;
GRANT SELECT ON economy.v_account_audit_ledger TO service_role;

-- 6. Fix mutable function search_path warnings
ALTER FUNCTION prediction.update_prediction_statistics() SET search_path = prediction, public;
ALTER FUNCTION prediction.create_game_snapshots() SET search_path = prediction, public;
ALTER FUNCTION economy.tg_touch_account_activity_stats_from_transaction() SET search_path = economy, public;
ALTER FUNCTION economy.get_kst_hour_activity_multiplier(timestamp with time zone) SET search_path = economy, public;

