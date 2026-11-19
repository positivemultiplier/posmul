-- ============================================================================
-- Phase 1: 금융 원장 원자화 RPC 신설 + 정산/에스크로 동시성 보강 + 중복 트리거 정리
-- (2026-11-19)
-- ============================================================================

-- 1. economy.execute_ledger_transaction: 신규 계정 생성 시 v3.0 헌법 위반 1,000 PMC 무단 발행 제거
CREATE OR REPLACE FUNCTION economy.execute_ledger_transaction(
    p_user_id uuid,
    p_transaction_type text,
    p_pmp_change bigint,
    p_pmc_change numeric,
    p_description text,
    p_metadata jsonb DEFAULT '{}'::jsonb,
    p_related_money_wave_id uuid DEFAULT NULL::uuid
)
RETURNS TABLE(success boolean, transaction_id uuid, new_pmp_balance bigint, new_pmc_balance numeric, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'economy', 'public'
AS $function$
DECLARE
    v_acc RECORD;
    v_new_pmp BIGINT;
    v_new_pmc NUMERIC;
    v_tx_id UUID;
BEGIN
    SELECT * INTO v_acc
    FROM economy.pmp_pmc_accounts
    WHERE user_id = p_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        -- v3.0 헌법: 신규 계정 PMC는 반드시 0 시작 (PMC는 오직 Prediction 성공 보상만)
        IF COALESCE(p_pmp_change, 0) < 0 OR COALESCE(p_pmc_change, 0) < 0 THEN
            RETURN QUERY SELECT false, NULL::UUID, 0::BIGINT, 0::NUMERIC, '잔액이 부족합니다.'::TEXT;
            RETURN;
        END IF;

        v_new_pmp := COALESCE(p_pmp_change, 0);
        v_new_pmc := COALESCE(p_pmc_change, 0);

        INSERT INTO economy.pmp_pmc_accounts (
            user_id, pmp_balance, pmc_balance, created_at, updated_at
        ) VALUES (
            p_user_id, v_new_pmp, v_new_pmc, now(), now()
        );
    ELSE
        IF (v_acc.pmp_balance + COALESCE(p_pmp_change, 0)) < 0 THEN
            RETURN QUERY SELECT false, NULL::UUID, v_acc.pmp_balance, v_acc.pmc_balance, 'PMP 잔액이 부족합니다.'::TEXT;
            RETURN;
        END IF;

        IF (v_acc.pmc_balance + COALESCE(p_pmc_change, 0)) < 0 THEN
            RETURN QUERY SELECT false, NULL::UUID, v_acc.pmp_balance, v_acc.pmc_balance, 'PMC 잔액이 부족합니다.'::TEXT;
            RETURN;
        END IF;

        v_new_pmp := v_acc.pmp_balance + COALESCE(p_pmp_change, 0);
        v_new_pmc := v_acc.pmc_balance + COALESCE(p_pmc_change, 0);

        UPDATE economy.pmp_pmc_accounts
        SET pmp_balance = v_new_pmp,
            pmc_balance = v_new_pmc,
            updated_at = now()
        WHERE user_id = p_user_id;
    END IF;

    v_tx_id := gen_random_uuid();
    INSERT INTO economy.pmp_pmc_transactions (
        transaction_id,
        user_id,
        transaction_type,
        pmp_amount,
        pmc_amount,
        description,
        timestamp,
        related_money_wave_id,
        metadata,
        created_at
    ) VALUES (
        v_tx_id,
        p_user_id,
        p_transaction_type,
        COALESCE(p_pmp_change, 0),
        COALESCE(p_pmc_change, 0),
        p_description,
        now(),
        p_related_money_wave_id,
        COALESCE(p_metadata, '{}'::jsonb),
        now()
    );

    RETURN QUERY SELECT true, v_tx_id, v_new_pmp, v_new_pmc, '정상 처리되었습니다.'::TEXT;
END;
$function$;

REVOKE EXECUTE ON FUNCTION economy.execute_ledger_transaction(uuid, text, bigint, numeric, text, jsonb, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION economy.execute_ledger_transaction(uuid, text, bigint, numeric, text, jsonb, uuid) TO service_role;

-- 2. 신규 원자적 RPC: 포럼 일일 상한(KST 자정 기준) + advisory lock PMP 적립
CREATE OR REPLACE FUNCTION economy.grant_forum_pmp_capped(
    p_user_id uuid,
    p_requested_pmp bigint,
    p_daily_cap bigint DEFAULT 1000,
    p_activity_type text DEFAULT 'post_created',
    p_description text DEFAULT '포럼 활동 보상',
    p_ledger_description text DEFAULT NULL,
    p_post_id uuid DEFAULT NULL,
    p_comment_id uuid DEFAULT NULL,
    p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE(awarded_pmp bigint, daily_remaining bigint, new_pmp_balance bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'economy', 'forum', 'public'
AS $function$
DECLARE
    v_kst_day_start TIMESTAMPTZ;
    v_today_earned BIGINT := 0;
    v_remaining_before BIGINT := 0;
    v_awarded BIGINT := 0;
    v_new_balance BIGINT := 0;
BEGIN
    -- 사용자별 트랜잭션 Advisory Lock으로 병렬 요청 시 일일 상한 초과 원천 차단
    PERFORM pg_advisory_xact_lock(hashtext('forum_pmp_' || p_user_id::text));

    -- KST(Asia/Seoul) 자정 시작 시각 계산
    v_kst_day_start := (date_trunc('day', now() AT TIME ZONE 'Asia/Seoul') AT TIME ZONE 'Asia/Seoul');

    SELECT COALESCE(SUM(pmp_earned), 0)::BIGINT
    INTO v_today_earned
    FROM forum.forum_activity_logs
    WHERE user_id = p_user_id
      AND created_at >= v_kst_day_start;

    v_remaining_before := GREATEST(0, p_daily_cap - v_today_earned);
    v_awarded := GREATEST(0, LEAST(COALESCE(p_requested_pmp, 0), v_remaining_before));

    INSERT INTO forum.forum_activity_logs (
        user_id, activity_type, post_id, comment_id, description, pmp_earned, metadata
    ) VALUES (
        p_user_id, p_activity_type, p_post_id, p_comment_id, p_description, v_awarded, COALESCE(p_metadata, '{}'::jsonb)
    );

    IF v_awarded > 0 THEN
        INSERT INTO economy.pmp_pmc_accounts (user_id, pmp_balance, pmc_balance, created_at, updated_at)
        VALUES (p_user_id, v_awarded, 0, now(), now())
        ON CONFLICT (user_id) DO UPDATE
          SET pmp_balance = economy.pmp_pmc_accounts.pmp_balance + EXCLUDED.pmp_balance,
              updated_at = now()
        RETURNING pmp_balance INTO v_new_balance;

        INSERT INTO economy.pmp_pmc_transactions (
            transaction_id, user_id, transaction_type, pmp_amount, pmc_amount, description, timestamp, metadata, created_at
        ) VALUES (
            gen_random_uuid(),
            p_user_id,
            'PMP_EARN',
            v_awarded,
            0,
            COALESCE(p_ledger_description, p_description),
            now(),
            jsonb_build_object(
                'source', 'forum',
                'activity_type', p_activity_type,
                'post_id', p_post_id,
                'comment_id', p_comment_id
            ) || COALESCE(p_metadata, '{}'::jsonb),
            now()
        );
    ELSE
        SELECT COALESCE(pmp_balance, 0)::BIGINT INTO v_new_balance
        FROM economy.pmp_pmc_accounts
        WHERE user_id = p_user_id;
    END IF;

    RETURN QUERY SELECT v_awarded, GREATEST(0, v_remaining_before - v_awarded), COALESCE(v_new_balance, 0);
END;
$function$;

REVOKE EXECUTE ON FUNCTION economy.grant_forum_pmp_capped(uuid, bigint, bigint, text, text, text, uuid, uuid, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION economy.grant_forum_pmp_capped(uuid, bigint, bigint, text, text, text, uuid, uuid, jsonb) TO service_role;

-- 3. 신규 원자적 RPC: 버티컬 앱(Housing-Pro 등) 일일 300 PMP 상한(KST 자정 기준) + advisory lock 적립
CREATE OR REPLACE FUNCTION economy.grant_vertical_pmp_capped(
    p_user_id uuid,
    p_requested_pmp bigint,
    p_daily_cap bigint DEFAULT 300,
    p_tx_type text DEFAULT 'VERTICAL_HOUSING_STUDY',
    p_description text DEFAULT 'Housing-Pro 학습 PMP 적립',
    p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE(granted_pmp bigint, daily_remaining bigint, new_pmp_balance bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'economy', 'public'
AS $function$
DECLARE
    v_kst_day_start TIMESTAMPTZ;
    v_today_earned BIGINT := 0;
    v_remaining_before BIGINT := 0;
    v_granted BIGINT := 0;
    v_new_balance BIGINT := 0;
BEGIN
    PERFORM pg_advisory_xact_lock(hashtext('vertical_pmp_' || p_user_id::text));

    v_kst_day_start := (date_trunc('day', now() AT TIME ZONE 'Asia/Seoul') AT TIME ZONE 'Asia/Seoul');

    SELECT COALESCE(SUM(GREATEST(0, pmp_amount)), 0)::BIGINT
    INTO v_today_earned
    FROM economy.pmp_pmc_transactions
    WHERE user_id = p_user_id
      AND transaction_type IN ('VERTICAL_HOUSING_STUDY', 'VERTICAL_HOUSING_SCAN')
      AND created_at >= v_kst_day_start;

    v_remaining_before := GREATEST(0, p_daily_cap - v_today_earned);
    v_granted := GREATEST(0, LEAST(COALESCE(p_requested_pmp, 0), v_remaining_before));

    IF v_granted > 0 THEN
        INSERT INTO economy.pmp_pmc_accounts (user_id, pmp_balance, pmc_balance, created_at, updated_at)
        VALUES (p_user_id, v_granted, 0, now(), now())
        ON CONFLICT (user_id) DO UPDATE
          SET pmp_balance = economy.pmp_pmc_accounts.pmp_balance + EXCLUDED.pmp_balance,
              updated_at = now()
        RETURNING pmp_balance INTO v_new_balance;

        INSERT INTO economy.pmp_pmc_transactions (
            transaction_id, user_id, transaction_type, pmp_amount, pmc_amount, description, timestamp, metadata, created_at
        ) VALUES (
            gen_random_uuid(),
            p_user_id,
            p_tx_type,
            v_granted,
            0,
            p_description,
            now(),
            jsonb_build_object('source', 'housing-pro', 'daily_cap', p_daily_cap) || COALESCE(p_metadata, '{}'::jsonb),
            now()
        );
    ELSE
        SELECT COALESCE(pmp_balance, 0)::BIGINT INTO v_new_balance
        FROM economy.pmp_pmc_accounts
        WHERE user_id = p_user_id;
    END IF;

    RETURN QUERY SELECT v_granted, GREATEST(0, v_remaining_before - v_granted), COALESCE(v_new_balance, 0);
END;
$function$;

REVOKE EXECUTE ON FUNCTION economy.grant_vertical_pmp_capped(uuid, bigint, bigint, text, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION economy.grant_vertical_pmp_capped(uuid, bigint, bigint, text, text, jsonb) TO service_role;

-- 4. void_challenge_refund_internal: 행 잠금(FOR UPDATE) + 이미 VOID/SETTLED 상태 멱등성 가드 추가
CREATE OR REPLACE FUNCTION public.void_challenge_refund_internal(
    p_challenge_id uuid,
    p_reason text DEFAULT 'VOID_REFUND'::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'prediction', 'economy'
AS $function$
DECLARE
  v_challenge RECORD;
  v_bet RECORD;
  v_refunded_count INT := 0;
  v_refunded_total BIGINT := 0;
BEGIN
  SELECT id, status INTO v_challenge
  FROM prediction.user_challenges
  WHERE id = p_challenge_id
  FOR UPDATE;

  IF v_challenge.id IS NULL THEN
    RAISE EXCEPTION 'CHALLENGE_NOT_FOUND';
  END IF;

  IF v_challenge.status IN ('VOID', 'SETTLED') THEN
    RETURN jsonb_build_object(
      'status', v_challenge.status,
      'reason', 'ALREADY_FINALIZED',
      'refunded_count', 0,
      'refunded_total_pmp', 0
    );
  END IF;

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
      transaction_id, user_id, transaction_type, pmp_amount, pmc_amount, description, timestamp, metadata, created_at
    ) VALUES (
      gen_random_uuid(),
      v_bet.user_id,
      'PMP_REFUND',
      v_bet.amount_pmp,
      0,
      format('맞짱/유저예측 무효 전액 환불 (%s)', p_reason),
      NOW(),
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

REVOKE EXECUTE ON FUNCTION public.void_challenge_refund_internal(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.void_challenge_refund_internal(uuid, text) TO service_role;

-- 5. dispute_challenge_settlement: 10분 이의제기 윈도우 만료 시각 엄격 검증 추가
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

  IF v_challenge.settlement_proposed_at IS NOT NULL
     AND NOW() > (v_challenge.settlement_proposed_at + INTERVAL '10 minutes') THEN
    RAISE EXCEPTION 'DISPUTE_WINDOW_EXPIRED';
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

REVOKE EXECUTE ON FUNCTION public.dispute_challenge_settlement(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.dispute_challenge_settlement(uuid, uuid) TO service_role;

-- 6. prediction.predictions 중복 no-op 트리거 제거 (prediction.update_prediction_statistics만 단일 유지)
DROP TRIGGER IF EXISTS trigger_update_prediction_statistics ON prediction.predictions;
