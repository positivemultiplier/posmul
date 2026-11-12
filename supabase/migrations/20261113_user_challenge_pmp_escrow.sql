-- PosMul 유저 자율 예측 / 맞짱 P2P PMP 에스크로 · 공정 합의 정산 마이그레이션
-- 1. prediction.user_challenges 꼬리 연결 컬럼(linked_game_id, linked_game_slug, linked_game_title) 및 합의 정산 컬럼 추가
-- 2. atomic PMP 차감(deduct_challenge_pmp), 정산 제안(propose_challenge_settlement),
--    합의 확정/GG 정산(finalize_challenge_settlement), 이의제기 환불(dispute_challenge_settlement) RPC 구축

ALTER TABLE prediction.user_challenges
  ADD COLUMN IF NOT EXISTS linked_game_id uuid NULL REFERENCES prediction.prediction_games(game_id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS linked_game_slug text NULL,
  ADD COLUMN IF NOT EXISTS linked_game_title text NULL,
  ADD COLUMN IF NOT EXISTS pending_winning_option_id text NULL,
  ADD COLUMN IF NOT EXISTS settlement_proposed_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS dispute_voters jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS payout_details jsonb NULL,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_user_challenges_linked_game_id
  ON prediction.user_challenges (linked_game_id, created_at DESC)
  WHERE linked_game_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_challenges_visibility_created
  ON prediction.user_challenges (visibility, created_at DESC);

-- 내부 공용: 참여자 전원 원금 100% PMP 환불 + 상태 VOID 전환
CREATE OR REPLACE FUNCTION public.void_challenge_refund_internal(
  p_challenge_id uuid,
  p_reason text DEFAULT 'VOID_REFUND'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'prediction', 'economy'
AS $function$
DECLARE
  v_bet RECORD;
  v_refunded_count INT := 0;
  v_refunded_total BIGINT := 0;
BEGIN
  FOR v_bet IN
    SELECT id, user_id, amount_pmp
    FROM prediction.user_challenge_bets
    WHERE challenge_id = p_challenge_id
      AND COALESCE(amount_pmp, 0) > 0
  LOOP
    INSERT INTO economy.pmp_pmc_accounts (user_id, pmp_balance, pmc_balance, created_at, updated_at, last_updated)
    VALUES (v_bet.user_id, v_bet.amount_pmp, 0, NOW(), NOW(), NOW())
    ON CONFLICT (user_id) DO UPDATE
      SET pmp_balance = economy.pmp_pmc_accounts.pmp_balance + EXCLUDED.pmp_balance,
          updated_at = NOW(),
          last_updated = NOW();

    INSERT INTO economy.pmp_pmc_transactions (
      transaction_id, user_id, transaction_type, pmp_amount, description, metadata, created_at
    ) VALUES (
      gen_random_uuid(),
      v_bet.user_id,
      'PMP_EARN',
      v_bet.amount_pmp,
      format('맞짱/유저예측 무효 전액 환불 (%s)', p_reason),
      jsonb_build_object(
        'source', 'user_challenge_refund',
        'challenge_id', p_challenge_id,
        'reason', p_reason
      ),
      NOW()
    );

    v_refunded_count := v_refunded_count + 1;
    v_refunded_total := v_refunded_total + v_bet.amount_pmp;
  END LOOP;

  UPDATE prediction.user_challenges
  SET status = 'VOID',
      settled_at = NOW(),
      updated_at = NOW(),
      payout_details = jsonb_build_object(
        'mode', 'VOID_REFUND',
        'reason', p_reason,
        'refunded_count', v_refunded_count,
        'refunded_total_pmp', v_refunded_total
      )
  WHERE id = p_challenge_id;

  RETURN jsonb_build_object(
    'status', 'VOID',
    'reason', p_reason,
    'refunded_count', v_refunded_count,
    'refunded_total_pmp', v_refunded_total
  );
END;
$function$;

-- 1. 개설/참여 시 PMP 에스크로 차감 RPC
CREATE OR REPLACE FUNCTION public.deduct_challenge_pmp(
  p_user_id uuid,
  p_challenge_id uuid,
  p_amount bigint,
  p_reason text DEFAULT 'challenge_entry'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'prediction', 'economy'
AS $function$
DECLARE
  v_balance BIGINT;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'INVALID_AMOUNT: amount must be positive';
  END IF;

  SELECT pmp_balance INTO v_balance
  FROM economy.pmp_pmc_accounts
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_balance IS NULL OR v_balance < p_amount THEN
    RAISE EXCEPTION 'INSUFFICIENT_PMP_BALANCE: available=%, required=%', COALESCE(v_balance, 0), p_amount;
  END IF;

  UPDATE economy.pmp_pmc_accounts
  SET pmp_balance = pmp_balance - p_amount,
      updated_at = NOW(),
      last_updated = NOW()
  WHERE user_id = p_user_id;

  INSERT INTO economy.pmp_pmc_transactions (
    transaction_id, user_id, transaction_type, pmp_amount, description, metadata, created_at
  ) VALUES (
    gen_random_uuid(),
    p_user_id,
    'PMP_SPEND',
    -p_amount,
    format('맞짱/유저예측 참여 (%s)', p_reason),
    jsonb_build_object(
      'source', 'user_challenge_entry',
      'challenge_id', p_challenge_id,
      'reason', p_reason
    ),
    NOW()
  );

  RETURN jsonb_build_object(
    'success', true,
    'deducted_pmp', p_amount,
    'remaining_pmp', v_balance - p_amount
  );
END;
$function$;

-- 2. 최종 분배 실행 RPC (10분 만료 자동 정산 또는 패자 GG 즉시 정산)
CREATE OR REPLACE FUNCTION public.finalize_challenge_settlement(
  p_challenge_id uuid,
  p_actor_user_id uuid DEFAULT NULL,
  p_force_gg boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'prediction', 'economy'
AS $function$
DECLARE
  v_challenge RECORD;
  v_winning_opt TEXT;
  v_total_bettors INT := 0;
  v_winner_pool BIGINT := 0;
  v_loser_pool BIGINT := 0;
  v_total_pool BIGINT := 0;
  v_host_fee BIGINT := 0;
  v_burn_amount BIGINT := 0;
  v_distributable_loser BIGINT := 0;
  v_is_actor_loser BOOLEAN := false;
  v_bet RECORD;
  v_bonus BIGINT := 0;
  v_bonus_sum BIGINT := 0;
  v_remainder BIGINT := 0;
  v_payout BIGINT := 0;
  v_top_winner_id uuid := NULL;
  v_winners_count INT := 0;
BEGIN
  SELECT * INTO v_challenge
  FROM prediction.user_challenges
  WHERE id = p_challenge_id
  FOR UPDATE;

  IF v_challenge.id IS NULL THEN
    RAISE EXCEPTION 'CHALLENGE_NOT_FOUND';
  END IF;

  IF v_challenge.status <> 'PENDING_SETTLEMENT' THEN
    RETURN jsonb_build_object(
      'finalized', false,
      'status', v_challenge.status
    );
  END IF;

  v_winning_opt := v_challenge.pending_winning_option_id;
  IF v_winning_opt IS NULL THEN
    RAISE EXCEPTION 'PENDING_OPTION_MISSING';
  END IF;

  -- GG 즉시 정산 시 실제 패배 측 참여자 본인인지 검증
  IF p_force_gg THEN
    SELECT EXISTS(
      SELECT 1 FROM prediction.user_challenge_bets
      WHERE challenge_id = p_challenge_id
        AND user_id = p_actor_user_id
        AND option_id <> v_winning_opt
    ) INTO v_is_actor_loser;

    IF NOT v_is_actor_loser THEN
      RAISE EXCEPTION 'ONLY_LOSER_CAN_CONFIRM_GG';
    END IF;
  ELSE
    -- 자동 확정: 제안 후 10분 경과 필요
    IF v_challenge.settlement_proposed_at IS NULL
       OR NOW() < (v_challenge.settlement_proposed_at + INTERVAL '10 minutes') THEN
      RETURN jsonb_build_object(
        'finalized', false,
        'status', 'PENDING_SETTLEMENT',
        'ready_at', v_challenge.settlement_proposed_at + INTERVAL '10 minutes'
      );
    END IF;
  END IF;

  SELECT
    COUNT(DISTINCT user_id),
    COALESCE(SUM(amount_pmp) FILTER (WHERE option_id = v_winning_opt), 0),
    COALESCE(SUM(amount_pmp) FILTER (WHERE option_id <> v_winning_opt), 0)
  INTO v_total_bettors, v_winner_pool, v_loser_pool
  FROM prediction.user_challenge_bets
  WHERE challenge_id = p_challenge_id;

  IF v_total_bettors < 2 OR v_winner_pool <= 0 OR v_loser_pool <= 0 THEN
    RETURN public.void_challenge_refund_internal(p_challenge_id, 'NO_COUNTERPARTY_REFUND');
  END IF;

  v_total_pool := v_winner_pool + v_loser_pool;
  -- 호스트 모객 수수료 3% (패자 풀 한도 내) + 플랫폼 인플레이션 방어 2% PMP 소각
  v_host_fee := LEAST(FLOOR(v_total_pool * 0.03)::bigint, v_loser_pool);
  v_burn_amount := LEAST(FLOOR(v_total_pool * 0.02)::bigint, GREATEST(0, v_loser_pool - v_host_fee));
  v_distributable_loser := GREATEST(0, v_loser_pool - v_host_fee - v_burn_amount);

  -- 1차 패스: 승자별 배당 합계 및 자투리 계산
  FOR v_bet IN
    SELECT user_id, amount_pmp
    FROM prediction.user_challenge_bets
    WHERE challenge_id = p_challenge_id
      AND option_id = v_winning_opt
    ORDER BY amount_pmp DESC, created_at ASC
  LOOP
    IF v_top_winner_id IS NULL THEN
      v_top_winner_id := v_bet.user_id;
    END IF;
    v_bonus := FLOOR((v_distributable_loser::numeric * v_bet.amount_pmp::numeric) / v_winner_pool::numeric)::bigint;
    v_bonus_sum := v_bonus_sum + v_bonus;
  END LOOP;

  v_remainder := GREATEST(0, v_distributable_loser - v_bonus_sum);

  -- 2차 패스: 승자들에게 원금 + 패자 풀 분배금 지급
  FOR v_bet IN
    SELECT user_id, amount_pmp
    FROM prediction.user_challenge_bets
    WHERE challenge_id = p_challenge_id
      AND option_id = v_winning_opt
    ORDER BY amount_pmp DESC, created_at ASC
  LOOP
    v_bonus := FLOOR((v_distributable_loser::numeric * v_bet.amount_pmp::numeric) / v_winner_pool::numeric)::bigint;
    IF v_bet.user_id = v_top_winner_id AND v_remainder > 0 THEN
      v_bonus := v_bonus + v_remainder;
      v_remainder := 0;
    END IF;
    v_payout := v_bet.amount_pmp + v_bonus;

    INSERT INTO economy.pmp_pmc_accounts (user_id, pmp_balance, pmc_balance, created_at, updated_at, last_updated)
    VALUES (v_bet.user_id, v_payout, 0, NOW(), NOW(), NOW())
    ON CONFLICT (user_id) DO UPDATE
      SET pmp_balance = economy.pmp_pmc_accounts.pmp_balance + EXCLUDED.pmp_balance,
          updated_at = NOW(),
          last_updated = NOW();

    INSERT INTO economy.pmp_pmc_transactions (
      transaction_id, user_id, transaction_type, pmp_amount, description, metadata, created_at
    ) VALUES (
      gen_random_uuid(),
      v_bet.user_id,
      'PMP_EARN',
      v_payout,
      format('맞짱/유저예측 승리 상금 (+%s PMP 획득)', v_bonus),
      jsonb_build_object(
        'source', 'user_challenge_win',
        'challenge_id', p_challenge_id,
        'principal_pmp', v_bet.amount_pmp,
        'profit_pmp', v_bonus
      ),
      NOW()
    );

    v_winners_count := v_winners_count + 1;
  END LOOP;

  -- 호스트 모객 수수료 지급
  IF v_host_fee > 0 THEN
    INSERT INTO economy.pmp_pmc_accounts (user_id, pmp_balance, pmc_balance, created_at, updated_at, last_updated)
    VALUES (v_challenge.host_id, v_host_fee, 0, NOW(), NOW(), NOW())
    ON CONFLICT (user_id) DO UPDATE
      SET pmp_balance = economy.pmp_pmc_accounts.pmp_balance + EXCLUDED.pmp_balance,
          updated_at = NOW(),
          last_updated = NOW();

    INSERT INTO economy.pmp_pmc_transactions (
      transaction_id, user_id, transaction_type, pmp_amount, description, metadata, created_at
    ) VALUES (
      gen_random_uuid(),
      v_challenge.host_id,
      'PMP_EARN',
      v_host_fee,
      '맞짱/유저예측 호스트 모객 수수료 (3%)',
      jsonb_build_object(
        'source', 'user_challenge_host_fee',
        'challenge_id', p_challenge_id
      ),
      NOW()
    );
  END IF;

  -- 소각 이력 기록
  IF v_burn_amount > 0 THEN
    INSERT INTO economy.pmp_pmc_transactions (
      transaction_id, user_id, transaction_type, pmp_amount, description, metadata, created_at
    ) VALUES (
      gen_random_uuid(),
      v_challenge.host_id,
      'PMP_BURN',
      -v_burn_amount,
      '맞짱/유저예측 플랫폼 소각 (2%)',
      jsonb_build_object(
        'source', 'user_challenge_burn',
        'challenge_id', p_challenge_id
      ),
      NOW()
    );
  END IF;

  UPDATE prediction.user_challenges
  SET status = 'SETTLED',
      winning_option_id = v_winning_opt,
      settled_at = NOW(),
      updated_at = NOW(),
      host_fee_pmp = v_host_fee,
      payout_details = jsonb_build_object(
        'mode', CASE WHEN p_force_gg THEN 'GG_INSTANT' ELSE 'WINDOW_EXPIRED' END,
        'total_pool_pmp', v_total_pool,
        'winner_pool_pmp', v_winner_pool,
        'loser_pool_pmp', v_loser_pool,
        'host_fee_pmp', v_host_fee,
        'burn_pmp', v_burn_amount,
        'distributable_loser_pmp', v_distributable_loser,
        'winners_count', v_winners_count
      )
  WHERE id = p_challenge_id;

  RETURN jsonb_build_object(
    'finalized', true,
    'status', 'SETTLED',
    'winning_option_id', v_winning_opt,
    'total_pool_pmp', v_total_pool,
    'host_fee_pmp', v_host_fee,
    'burn_pmp', v_burn_amount,
    'winners_count', v_winners_count
  );
END;
$function$;

-- 3. 호스트 결과 확정 제안 RPC (단독/한쪽 쏠림 시 즉시 환불, 대결 성사 시 10분 이의제기 골든타임 시작)
CREATE OR REPLACE FUNCTION public.propose_challenge_settlement(
  p_challenge_id uuid,
  p_host_user_id uuid,
  p_winning_option_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'prediction', 'economy'
AS $function$
DECLARE
  v_challenge RECORD;
  v_total_bettors INT := 0;
  v_winner_pool BIGINT := 0;
  v_loser_pool BIGINT := 0;
BEGIN
  SELECT * INTO v_challenge
  FROM prediction.user_challenges
  WHERE id = p_challenge_id
  FOR UPDATE;

  IF v_challenge.id IS NULL THEN
    RAISE EXCEPTION 'CHALLENGE_NOT_FOUND';
  END IF;

  IF v_challenge.host_id IS DISTINCT FROM p_host_user_id THEN
    RAISE EXCEPTION 'FORBIDDEN_NOT_HOST';
  END IF;

  IF v_challenge.status NOT IN ('OPEN', 'LOCKED') THEN
    RAISE EXCEPTION 'INVALID_CHALLENGE_STATUS: %', v_challenge.status;
  END IF;

  SELECT
    COUNT(DISTINCT user_id),
    COALESCE(SUM(amount_pmp) FILTER (WHERE option_id = p_winning_option_id), 0),
    COALESCE(SUM(amount_pmp) FILTER (WHERE option_id <> p_winning_option_id), 0)
  INTO v_total_bettors, v_winner_pool, v_loser_pool
  FROM prediction.user_challenge_bets
  WHERE challenge_id = p_challenge_id;

  -- 무경쟁 / 한쪽 쏠림은 즉시 원금 100% 환불
  IF v_total_bettors < 2 OR v_winner_pool <= 0 OR v_loser_pool <= 0 THEN
    RETURN public.void_challenge_refund_internal(p_challenge_id, 'ONE_SIDED_OR_SOLO_REFUND');
  END IF;

  UPDATE prediction.user_challenges
  SET status = 'PENDING_SETTLEMENT',
      pending_winning_option_id = p_winning_option_id,
      settlement_proposed_at = NOW(),
      updated_at = NOW()
  WHERE id = p_challenge_id;

  RETURN jsonb_build_object(
    'status', 'PENDING_SETTLEMENT',
    'pending_winning_option_id', p_winning_option_id,
    'dispute_window_ends_at', NOW() + INTERVAL '10 minutes'
  );
END;
$function$;

-- 4. 참여자 판정 이의 제기 RPC (30% 이상 동의 시 즉시 전액 환불)
CREATE OR REPLACE FUNCTION public.dispute_challenge_settlement(
  p_challenge_id uuid,
  p_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'prediction', 'economy'
AS $function$
DECLARE
  v_challenge RECORD;
  v_is_participant BOOLEAN := false;
  v_voters JSONB;
  v_dispute_count INT := 0;
  v_total_bettors INT := 0;
BEGIN
  SELECT * INTO v_challenge
  FROM prediction.user_challenges
  WHERE id = p_challenge_id
  FOR UPDATE;

  IF v_challenge.id IS NULL THEN
    RAISE EXCEPTION 'CHALLENGE_NOT_FOUND';
  END IF;

  IF v_challenge.status <> 'PENDING_SETTLEMENT' THEN
    RAISE EXCEPTION 'NOT_IN_DISPUTE_WINDOW';
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM prediction.user_challenge_bets
    WHERE challenge_id = p_challenge_id AND user_id = p_user_id
  ) INTO v_is_participant;

  IF NOT v_is_participant THEN
    RAISE EXCEPTION 'ONLY_PARTICIPANT_CAN_DISPUTE';
  END IF;

  v_voters := COALESCE(v_challenge.dispute_voters, '[]'::jsonb);
  IF v_voters ? p_user_id::text THEN
    RAISE EXCEPTION 'ALREADY_DISPUTED';
  END IF;

  v_voters := v_voters || jsonb_build_array(p_user_id::text);
  v_dispute_count := jsonb_array_length(v_voters);

  SELECT COUNT(DISTINCT user_id) INTO v_total_bettors
  FROM prediction.user_challenge_bets
  WHERE challenge_id = p_challenge_id;

  UPDATE prediction.user_challenges
  SET dispute_voters = v_voters,
      dispute_count = v_dispute_count,
      updated_at = NOW()
  WHERE id = p_challenge_id;

  -- 전체 참여자의 30% 이상 이의제기 시 즉시 무효(전액 환불)
  IF v_total_bettors > 0 AND (v_dispute_count * 100 >= v_total_bettors * 30) THEN
    RETURN public.void_challenge_refund_internal(p_challenge_id, 'PARTICIPANT_DISPUTE_VOID');
  END IF;

  RETURN jsonb_build_object(
    'status', 'PENDING_SETTLEMENT',
    'dispute_count', v_dispute_count,
    'threshold_needed', CEIL(v_total_bettors * 0.3)::int
  );
END;
$function$;

-- service_role 전용 권한 제한
REVOKE ALL ON FUNCTION public.void_challenge_refund_internal(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.deduct_challenge_pmp(uuid, uuid, bigint, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.finalize_challenge_settlement(uuid, uuid, boolean) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.propose_challenge_settlement(uuid, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.dispute_challenge_settlement(uuid, uuid) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.void_challenge_refund_internal(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.deduct_challenge_pmp(uuid, uuid, bigint, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.finalize_challenge_settlement(uuid, uuid, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.propose_challenge_settlement(uuid, uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.dispute_challenge_settlement(uuid, uuid) TO service_role;

