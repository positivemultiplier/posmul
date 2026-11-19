-- ============================================================================
-- Phase 0 긴급 보안 하드닝 마이그레이션 (2026-11-19)
-- 1. RLS 미활성 7개 테이블 RLS 활성화 + 최소 권한 정책 + 과다 GRANT 회수
-- 2. 치명적 기존 RLS 구멍 차단 (공짜 베팅, 정산 전 베팅 변조, 정품 시리얼 유출, ALL true 정책)
-- 3. anon/authenticated에 노출된 위험 SECURITY DEFINER 금전·관리자 RPC 권한 회수
-- 4. mutable search_path 함수 수정
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. RLS 비활성화 7개 앱 테이블 보안 잠금
-- ----------------------------------------------------------------------------

-- 1-1. OAuth Provider (서버 전용 — 클라이언트 직접 접근 전면 차단)
ALTER TABLE "oauth_provider"."clients" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "oauth_provider"."auth_codes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "oauth_provider"."tokens" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "oauth_provider"."clients", "oauth_provider"."auth_codes", "oauth_provider"."tokens" FROM anon, authenticated;

-- 1-2. Prediction Scheduler Config (서버/관리자 전용 — authenticated TRUNCATE/ALL 회수)
ALTER TABLE "prediction"."scheduler_config" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "prediction"."scheduler_config" FROM anon, authenticated;

-- 1-3. User Healing Rooms & Guestbooks (쓰기는 서버 supabaseAdmin만, 공개 읽기만 허용)
ALTER TABLE "user"."healing_rooms" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user"."healing_room_guestbooks" ENABLE ROW LEVEL SECURITY;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE "user"."healing_rooms", "user"."healing_room_guestbooks" FROM anon, authenticated;

DROP POLICY IF EXISTS "healing_rooms_public_read" ON "user"."healing_rooms";
CREATE POLICY "healing_rooms_public_read"
  ON "user"."healing_rooms"
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "healing_room_guestbooks_public_read" ON "user"."healing_room_guestbooks";
CREATE POLICY "healing_room_guestbooks_public_read"
  ON "user"."healing_room_guestbooks"
  FOR SELECT TO anon, authenticated
  USING (true);

-- 1-4. Vertical Housing Theory Sections (공개 읽기 전용, 쓰기는 서버 Admin만)
ALTER TABLE "vertical_housing"."theory_sections" ENABLE ROW LEVEL SECURITY;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE "vertical_housing"."theory_sections" FROM anon, authenticated;

DROP POLICY IF EXISTS "theory_sections_public_read" ON "vertical_housing"."theory_sections";
CREATE POLICY "theory_sections_public_read"
  ON "vertical_housing"."theory_sections"
  FOR SELECT TO anon, authenticated
  USING (true);

-- 1-5. RLS ON + 정책 0개 테이블(user.healing_creation_resonances) 공개 읽기 정책 추가
DROP POLICY IF EXISTS "healing_creation_resonances_public_read" ON "user"."healing_creation_resonances";
CREATE POLICY "healing_creation_resonances_public_read"
  ON "user"."healing_creation_resonances"
  FOR SELECT TO anon, authenticated
  USING (true);

-- ----------------------------------------------------------------------------
-- 2. 기존 치명적 RLS 구멍 차단
-- ----------------------------------------------------------------------------

-- 2-1. user_challenge_bets 직접 INSERT 차단 (공짜 베팅/무한 PMP 증식 방지 — 서버 deduct_challenge_pmp 경유)
DROP POLICY IF EXISTS "user_challenge_bets_insert_own" ON "prediction"."user_challenge_bets";

-- 2-2. prediction.predictions 직접 UPDATE 차단 (정산 직전 bet_amount/selectedOptionId 변조 방지)
DROP POLICY IF EXISTS "predictions_update_policy" ON "prediction"."predictions";

-- 2-3. vertical_housing.book_serials 미등록 정품 시리얼 전량 유출 차단
DROP POLICY IF EXISTS "book_serials_user_read" ON "vertical_housing"."book_serials";
CREATE POLICY "book_serials_owner_read"
  ON "vertical_housing"."book_serials"
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = registered_user_id);

-- 2-4. vertical_housing.ai_scan_logs / study_cones / study_*_logs 과도한 FOR ALL 차단 (쓰기는 서버 Admin만)
DROP POLICY IF EXISTS "ai_scan_logs_user_all" ON "vertical_housing"."ai_scan_logs";
CREATE POLICY "ai_scan_logs_owner_read"
  ON "vertical_housing"."ai_scan_logs"
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "study_cones_user_all" ON "vertical_housing"."study_cones";
CREATE POLICY "study_cones_owner_read"
  ON "vertical_housing"."study_cones"
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Allow all study_question_logs" ON "vertical_housing"."study_question_logs";
CREATE POLICY "study_question_logs_owner_read"
  ON "vertical_housing"."study_question_logs"
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Allow all study_option_logs" ON "vertical_housing"."study_option_logs";
CREATE POLICY "study_option_logs_owner_read"
  ON "vertical_housing"."study_option_logs"
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

-- 2-5. public 구 프로토타입 고아 테이블 6종의 ALL (true) 쓰기 개방 정책 차단 (앱 참조 0건)
DROP POLICY IF EXISTS "Allow public all calendar_events" ON "public"."calendar_events";
DROP POLICY IF EXISTS "Allow public all live_study_sessions" ON "public"."live_study_sessions";
DROP POLICY IF EXISTS "Allow public all patrol_checklists" ON "public"."patrol_checklists";
DROP POLICY IF EXISTS "Allow public all study_cheers" ON "public"."study_cheers";
DROP POLICY IF EXISTS "Allow public all study_schedules" ON "public"."study_schedules";
DROP POLICY IF EXISTS "Allow public all wrong_answers" ON "public"."wrong_answers";

-- ----------------------------------------------------------------------------
-- 3. SECURITY DEFINER 금전·관리자·트리거 함수의 anon/authenticated EXECUTE 회수
-- ----------------------------------------------------------------------------

-- Economy 금전·배분 함수 (service_role 전용)
REVOKE EXECUTE ON FUNCTION economy.grant_pmc(uuid, bigint, text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION economy.grant_pmp(uuid, bigint, text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION economy.execute_ledger_transaction(uuid, text, bigint, numeric, text, jsonb, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION economy.stake_pmp_on_prediction(uuid, uuid, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION economy.refresh_daily_money_wave_snapshot(date) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION economy.compute_prediction_hourly_category_allocations(timestamp with time zone) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION economy.compute_prediction_hourly_game_pools(timestamp with time zone) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION economy.update_updated_at_column() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION economy.grant_pmc(uuid, bigint, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION economy.grant_pmp(uuid, bigint, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION economy.execute_ledger_transaction(uuid, text, bigint, numeric, text, jsonb, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION economy.stake_pmp_on_prediction(uuid, uuid, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION economy.refresh_daily_money_wave_snapshot(date) TO service_role;
GRANT EXECUTE ON FUNCTION economy.compute_prediction_hourly_category_allocations(timestamp with time zone) TO service_role;
GRANT EXECUTE ON FUNCTION economy.compute_prediction_hourly_game_pools(timestamp with time zone) TO service_role;

-- Prediction 관리·크론·SSRF·트리거 함수 (service_role 전용)
REVOKE EXECUTE ON FUNCTION prediction.auto_settle_expired_games() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION prediction.close_expired_games() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION prediction.create_game_snapshots() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION prediction.sync_pg_cron_with_config() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION prediction.trigger_http_cron(text, text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION prediction.void_stale_games(interval) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION prediction.auto_generate_slug() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION prediction.generate_slug(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION prediction.update_prediction_statistics() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION prediction.auto_settle_expired_games() TO service_role;
GRANT EXECUTE ON FUNCTION prediction.close_expired_games() TO service_role;
GRANT EXECUTE ON FUNCTION prediction.create_game_snapshots() TO service_role;
GRANT EXECUTE ON FUNCTION prediction.sync_pg_cron_with_config() TO service_role;
GRANT EXECUTE ON FUNCTION prediction.trigger_http_cron(text, text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION prediction.void_stale_games(interval) TO service_role;

-- Public 금전·관리·트리거 함수 (service_role 전용)
REVOKE EXECUTE ON FUNCTION public.grant_pmc(uuid, numeric, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.grant_pmp(uuid, integer, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_update_game_status() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.calculate_reward_amount(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.participate_in_prediction_game(uuid, jsonb, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.participate_in_prediction_game(uuid, jsonb, bigint, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.process_prediction_payment() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.record_prediction_trend() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_user_email_verification() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_prediction_statistics() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_prediction_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_user_prediction_stats() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_pmp_balance(uuid, numeric) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.calculate_prediction_accuracy(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_user_prediction_history(uuid, integer) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.grant_pmc(uuid, numeric, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.grant_pmp(uuid, integer, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.auto_update_game_status() TO service_role;
GRANT EXECUTE ON FUNCTION public.calculate_reward_amount(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.validate_pmp_balance(uuid, numeric) TO service_role;

-- User & Study-Cycle 트리거/레거시 함수
REVOKE EXECUTE ON FUNCTION "user".prevent_profile_role_escalation() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION study_cycle.get_user_mfa_status(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION study_cycle.is_secure_session() FROM PUBLIC, anon, authenticated;

-- ----------------------------------------------------------------------------
-- 4. mutable search_path 경고 해소
-- ----------------------------------------------------------------------------
ALTER FUNCTION prediction.touch_user_prediction_stats_updated_at() SET search_path = prediction, public;
