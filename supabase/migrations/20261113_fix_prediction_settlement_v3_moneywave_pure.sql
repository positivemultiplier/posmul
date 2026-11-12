-- PosMul v3.0 Prediction 정산 & 참여 트리거 정상화 마이그레이션
-- 1. calculate_reward_amount: v_base_reward(PMP->PMC 전환), v_mw_bonus(2배 상한/시드 300/개방률) 제거
--    -> 순수 MoneyWave 누적 풀 전액((bet / winning_pool) * SUM(pool_pmc))만 배분
--    -> 참여자 2명 미만 또는 반대편 베팅(패자 풀) 0건인 무경쟁 게임은 PMC 미발행
-- 2. settle_prediction: 중복 오버로드(bigint/numeric) 제거 -> numeric 단일화 + service_role 전용 제한
-- 3. settle_prediction_game: FOR UPDATE 행 락, money_wave_daily_snapshots.annual_ebitda 연동, v_total_reward 전액 MONEY_WAVE_1 기록
-- 4. process_prediction_payment: 참여 시 음수 잔액 방어(pmp_balance >= NEW.bet_amount) 추가

CREATE OR REPLACE FUNCTION public.calculate_reward_amount(
  p_prediction_id uuid,
  p_correct_option_id text
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'prediction', 'economy'
AS $function$
DECLARE
  v_bet_amount DECIMAL;
  v_game_id UUID;
  v_selected_option_id TEXT;
  v_total_pool DECIMAL := 0;
  v_winning_pool DECIMAL := 0;
  v_losing_pool DECIMAL := 0;
  v_participant_cnt INT := 0;
  v_game_mw_pool DECIMAL := 0;
BEGIN
  -- 1. 해당 예측의 배팅 금액, 게임 ID, 선택 옵션 조회
  SELECT bet_amount, game_id, (prediction_data->>'selectedOptionId')
  INTO v_bet_amount, v_game_id, v_selected_option_id
  FROM prediction.predictions
  WHERE prediction_id = p_prediction_id
    AND is_active = true;

  IF v_game_id IS NULL OR v_bet_amount IS NULL OR v_bet_amount <= 0 THEN
    RETURN 0;
  END IF;

  -- 정답을 맞히지 못한 예측은 0 반환
  IF v_selected_option_id IS DISTINCT FROM p_correct_option_id THEN
    RETURN 0;
  END IF;

  -- 2. 전체 베팅 풀, 승리 풀, 참여자 수 집계
  SELECT
    COALESCE(SUM(bet_amount), 0),
    COALESCE(SUM(bet_amount) FILTER (WHERE (prediction_data->>'selectedOptionId') = p_correct_option_id), 0),
    COUNT(DISTINCT user_id)
  INTO v_total_pool, v_winning_pool, v_participant_cnt
  FROM prediction.predictions
  WHERE game_id = v_game_id
    AND is_active = true;

  v_losing_pool := v_total_pool - v_winning_pool;

  -- 3. 무경쟁/단독 참여 게임 가드: 참여자 2명 미만 또는 반대편 베팅 0건 시 PMC 미발행
  IF v_participant_cnt < 2 OR v_winning_pool <= 0 OR v_losing_pool <= 0 THEN
    RETURN 0;
  END IF;

  -- 4. 순수 MoneyWave 누적 상금 풀 조회 (최대 20,000 PMC 상한)
  SELECT LEAST(20000, COALESCE(SUM(pool_pmc), 0))
  INTO v_game_mw_pool
  FROM economy.money_wave_hourly_game_pools
  WHERE game_id = v_game_id;

  IF COALESCE(v_game_mw_pool, 0) <= 0 THEN
    RETURN 0;
  END IF;

  -- 5. 승자 베팅 지분 비율대로 순수 MoneyWave 풀 배분
  RETURN ROUND((v_bet_amount / v_winning_pool) * v_game_mw_pool, 2);
END;
$function$;

DROP FUNCTION IF EXISTS public.settle_prediction(uuid, boolean, bigint);
DROP FUNCTION IF EXISTS public.settle_prediction(uuid, boolean, numeric);

CREATE OR REPLACE FUNCTION public.settle_prediction(
  p_prediction_id uuid,
  p_is_winner boolean,
  p_reward_amount numeric DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'prediction', 'economy'
AS $function$
DECLARE
  v_user_id UUID;
  v_bet_amount BIGINT;
  v_game_id UUID;
  v_reward NUMERIC := COALESCE(p_reward_amount, 0);
BEGIN
  -- 예측 정보 조회
  SELECT user_id, bet_amount, game_id
  INTO v_user_id, v_bet_amount, v_game_id
  FROM prediction.predictions
  WHERE prediction_id = p_prediction_id;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Prediction not found: %', p_prediction_id;
  END IF;

  IF p_is_winner THEN
    -- ===== 승리 시: 순수 MoneyWave PMC 보상 지급 (0원 초과일 때만 계좌 및 원장 반영) =====
    IF v_reward > 0 THEN
      UPDATE economy.pmp_pmc_accounts
      SET pmc_balance = pmc_balance + v_reward,
          updated_at = NOW()
      WHERE user_id = v_user_id;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Economy account not found for user: %', v_user_id;
      END IF;

      INSERT INTO economy.pmp_pmc_transactions (
        transaction_id, user_id, transaction_type, pmc_amount,
        description, timestamp, created_at, metadata
      ) VALUES (
        gen_random_uuid(),
        v_user_id,
        'PMC_EARN',
        v_reward,
        '예측 성공 보상 (MoneyWave)',
        NOW(),
        NOW(),
        jsonb_build_object(
          'prediction_id', p_prediction_id,
          'game_id', v_game_id,
          'original_bet', v_bet_amount,
          'source', 'prediction_win'
        )
      );
    END IF;
  ELSE
    -- ===== 패배 시: PMP 소각 기록 (참여 시 이미 pmp_balance 차감 완료) =====
    INSERT INTO economy.pmp_pmc_transactions (
      transaction_id, user_id, transaction_type, pmp_amount,
      description, timestamp, created_at, metadata
    ) VALUES (
      gen_random_uuid(),
      v_user_id,
      'PMP_BURN',
      v_bet_amount,
      '예측 실패 - PMP 소각',
      NOW(),
      NOW(),
      jsonb_build_object(
        'prediction_id', p_prediction_id,
        'game_id', v_game_id,
        'source', 'prediction_loss'
      )
    );
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.settle_prediction_game(
  p_game_id uuid,
  p_correct_option_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'prediction', 'economy', 'forum'
AS $function$
DECLARE
  v_game_status TEXT;
  v_prediction RECORD;
  v_winners_count INT := 0;
  v_losers_count INT := 0;
  v_total_reward DECIMAL := 0;
  v_total_bet_pool DECIMAL := 0;
  v_ebit_amount NUMERIC := 0;
  v_reward DECIMAL := 0;
BEGIN
  -- 동시 정산 레이스 방지를 위한 행 잠금 + 상태 검증
  SELECT status::text INTO v_game_status
  FROM prediction.prediction_games
  WHERE game_id = p_game_id
  FOR UPDATE;

  IF v_game_status IS NULL OR v_game_status NOT IN ('ACTIVE', 'CLOSED', 'SETTLING') THEN
    RAISE EXCEPTION 'Game not found or not settleable: % (status=%)', p_game_id, COALESCE(v_game_status, 'NULL');
  END IF;

  SELECT COALESCE(SUM(bet_amount), 0) INTO v_total_bet_pool
  FROM prediction.predictions
  WHERE game_id = p_game_id AND is_active = true;

  -- 최신 일일 스냅샷에서 연간 기준 EAT/EBITDA 조회
  SELECT COALESCE(annual_ebitda, 0) INTO v_ebit_amount
  FROM economy.money_wave_daily_snapshots
  ORDER BY snapshot_date DESC
  LIMIT 1;
  v_ebit_amount := COALESCE(v_ebit_amount, 0);

  -- 게임 결과 저장
  UPDATE prediction.prediction_games
  SET actual_result = jsonb_build_object('correctOptionId', p_correct_option_id),
      winning_option_id = p_correct_option_id,
      settled_at = NOW(),
      status = 'SETTLED',
      updated_at = NOW()
  WHERE game_id = p_game_id;

  -- 각 예측에 대해 정산 처리
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

  -- 순수 MoneyWave 발행 이력 기록 (지급된 v_total_reward 전액이 순수 MoneyWave 발행액)
  IF v_winners_count > 0 AND v_total_reward > 0 THEN
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
      v_ebit_amount,
      v_total_reward,
      v_winners_count,
      'prediction_settlement',
      jsonb_build_object(
        'game_id', p_game_id,
        'winners_count', v_winners_count,
        'losers_count', v_losers_count,
        'total_bet_pool_pmp', v_total_bet_pool,
        'total_reward_distributed_pmc', v_total_reward,
        'moneywave_issued_pmc', v_total_reward
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
    'moneywave_bonus_distributed', v_total_reward,
    'settled_at', NOW()
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.process_prediction_payment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'economy', 'prediction'
AS $function$
BEGIN
  IF NEW.bet_amount IS NULL OR NEW.bet_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid bet amount: %', NEW.bet_amount;
  END IF;

  -- economy.pmp_pmc_accounts에서 PMP 잔액 원자적 검증 및 차감 (Single Source of Truth)
  UPDATE economy.pmp_pmc_accounts
  SET pmp_balance = pmp_balance - NEW.bet_amount,
      updated_at = NOW()
  WHERE user_id = NEW.user_id
    AND pmp_balance >= NEW.bet_amount;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient PMP balance or missing account for user % (required: %)', NEW.user_id, NEW.bet_amount;
  END IF;

  -- 거래 기록
  INSERT INTO economy.pmp_pmc_transactions (
    transaction_id, user_id, transaction_type, pmp_amount,
    description, timestamp, created_at, metadata
  ) VALUES (
    gen_random_uuid(),
    NEW.user_id,
    'PMP_SPEND',
    NEW.bet_amount,
    '예측 게임 참여',
    NOW(),
    NOW(),
    jsonb_build_object(
      'game_id', NEW.game_id,
      'prediction_id', NEW.prediction_id,
      'source', 'prediction_game'
    )
  );

  RETURN NEW;
END;
$function$;

-- 실행 권한 최소화: 상태/잔액 변경 정산 RPC는 service_role 전용으로 제한
REVOKE ALL ON FUNCTION public.settle_prediction(uuid, boolean, numeric) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.settle_prediction(uuid, boolean, numeric) TO service_role;

REVOKE ALL ON FUNCTION public.settle_prediction_game(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.settle_prediction_game(uuid, text) TO service_role;

REVOKE ALL ON FUNCTION public.calculate_reward_amount(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.calculate_reward_amount(uuid, text) TO authenticated, service_role;

