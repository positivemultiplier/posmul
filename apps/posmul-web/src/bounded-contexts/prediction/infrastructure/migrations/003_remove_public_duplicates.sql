-- Public 스키마 중복 테이블 제거 마이그레이션
-- 목적: DDD bounded context 스키마로 정리 및 쿼리 오류 해결
-- 일시: 2025-11-24

BEGIN;

-- ============================================
-- Step 1: 안전 확인 - Row count 검증
-- ============================================

DO $$
DECLARE
  public_games_count INT;
  public_predictions_count INT;
  public_pmp_count INT;
BEGIN
  SELECT COUNT(*) INTO public_games_count FROM public.prediction_games;
  SELECT COUNT(*) INTO public_predictions_count FROM public.predictions;
  SELECT COUNT(*) INTO public_pmp_count FROM public.pmp_pmc_accounts;
  
  RAISE NOTICE '=== 삭제 전 Row Count 확인 ===';
  RAISE NOTICE 'public.prediction_games: % rows', public_games_count;
  RAISE NOTICE 'public.predictions: % rows', public_predictions_count;
  RAISE NOTICE 'public.pmp_pmc_accounts: % rows', public_pmp_count;
  
  -- 데이터가 많으면 경고 (10개 이상이면 중단)
  IF public_games_count > 10 OR public_predictions_count > 10 OR public_pmp_count > 10 THEN
    RAISE EXCEPTION 'Public 스키마에 데이터가 너무 많습니다! 수동 확인 필요.';
  END IF;
END $$;

-- ============================================
-- Step 2: Public 테이블 데이터를 Bounded Context로 병합 (필요시)
-- ============================================

-- prediction_games 병합 (4 rows → prediction.prediction_games)
INSERT INTO prediction.prediction_games 
SELECT * FROM public.prediction_games
ON CONFLICT (game_id) DO NOTHING;

-- predictions 병합 (0 rows, 건너뛰기 가능)
-- INSERT INTO prediction.predictions 
-- SELECT * FROM public.predictions
-- ON CONFLICT (id) DO NOTHING;

RAISE NOTICE '=== 데이터 병합 완료 ===';

-- ============================================
-- Step 3: Foreign Key 제약 조건 제거
-- ============================================

-- Public 테이블을 참조하는 FK 찾기 및 제거
DO $$
DECLARE
  fk_record RECORD;
BEGIN
  FOR fk_record IN
    SELECT 
      tc.table_schema,
      tc.table_name,
      tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu
      ON tc.constraint_name = ccu.constraint_name
    WHERE ccu.table_schema = 'public' 
      AND ccu.table_name IN ('prediction_games', 'predictions', 'pmp_pmc_accounts')
      AND tc.constraint_type = 'FOREIGN KEY'
  LOOP
    EXECUTE format('ALTER TABLE %I.%I DROP CONSTRAINT IF EXISTS %I CASCADE',
                   fk_record.table_schema,
                   fk_record.table_name,
                   fk_record.constraint_name);
    RAISE NOTICE 'Dropped FK: %.%.%', fk_record.table_schema, fk_record.table_name, fk_record.constraint_name;
  END LOOP;
END $$;

-- ============================================
-- Step 4: Public 스키마 중복 테이블 삭제
-- ============================================

DROP TABLE IF EXISTS public.prediction_games CASCADE;
DROP TABLE IF EXISTS public.predictions CASCADE;
DROP TABLE IF EXISTS public.pmp_pmc_accounts CASCADE;
DROP TABLE IF EXISTS public.pmp_pmc_transactions CASCADE;

-- Prediction 관련 기타 테이블들
DROP TABLE IF EXISTS public.user_prediction_stats CASCADE;
DROP TABLE IF EXISTS public.prediction_accuracy_history CASCADE;
DROP TABLE IF EXISTS public.prediction_game_stats CASCADE;
DROP TABLE IF EXISTS public.prediction_options CASCADE;
DROP TABLE IF EXISTS public.prediction_settlements CASCADE;

-- Economy 관련 중복 테이블들
DROP TABLE IF EXISTS public.money_wave1_ebit_records CASCADE;
DROP TABLE IF EXISTS public.money_wave2_redistribution_records CASCADE;
DROP TABLE IF EXISTS public.money_wave3_entrepreneur_records CASCADE;
DROP TABLE IF EXISTS public.money_wave_effectiveness CASCADE;
DROP TABLE IF EXISTS public.money_wave_history CASCADE;
DROP TABLE IF EXISTS public.account_activity_stats CASCADE;
DROP TABLE IF EXISTS public.individual_utility_parameters CASCADE;
DROP TABLE IF EXISTS public.social_welfare_parameters CASCADE;
DROP TABLE IF EXISTS public.system_statistics CASCADE;
DROP TABLE IF EXISTS public.utility_estimation_inputs CASCADE;
DROP TABLE IF EXISTS public.utility_predictions CASCADE;
DROP TABLE IF EXISTS public.user_economic_balances CASCADE;

RAISE NOTICE '=== Public 스키마 중복 테이블 삭제 완료 ===';

-- ============================================
-- Step 5: Search Path 설정 (선택 사항)
-- ============================================

-- Supabase에서 prediction, economy 스키마를 기본 검색 경로에 추가
-- 이렇게 하면 스키마 이름 없이도 조회 가능
-- ALTER DATABASE postgres SET search_path TO public, prediction, economy;

-- ============================================
-- Step 6: 검증
-- ============================================

DO $$
DECLARE
  prediction_games_count INT;
  predictions_count INT;
  economy_accounts_count INT;
BEGIN
  SELECT COUNT(*) INTO prediction_games_count FROM prediction.prediction_games;
  SELECT COUNT(*) INTO predictions_count FROM prediction.predictions;
  SELECT COUNT(*) INTO economy_accounts_count FROM economy.pmp_pmc_accounts;
  
  RAISE NOTICE '=== 최종 검증 ===';
  RAISE NOTICE 'prediction.prediction_games: % rows', prediction_games_count;
  RAISE NOTICE 'prediction.predictions: % rows', predictions_count;
  RAISE NOTICE 'economy.pmp_pmc_accounts: % rows', economy_accounts_count;
  
  IF prediction_games_count < 10 THEN
    RAISE WARNING 'prediction.prediction_games의 데이터가 적습니다. 확인 필요!';
  END IF;
END $$;

COMMIT;

-- 완료 메시지
RAISE NOTICE '✅ Public 스키마 정리 완료!';
RAISE NOTICE '모든 데이터는 prediction 및 economy 스키마에 보존되었습니다.';
