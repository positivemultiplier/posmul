-- 유저 자율 예측 / 맞짱 챌린지 자동 정산 · 방치 환불 배치 RPC 및 pg_cron 등록
-- 1. PENDING_SETTLEMENT 10분 이의제기 윈도우 경과 시 자동 최종 정산
-- 2. OPEN/LOCKED 상태에서 settlement_at 이후 24시간 초과 방치 시 원금 100% 자동 환불 (VOID)

CREATE OR REPLACE FUNCTION public.process_expired_user_challenges()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'prediction', 'economy'
AS $function$
DECLARE
  v_row RECORD;
  v_finalized_count INT := 0;
  v_refunded_count INT := 0;
  v_failed_count INT := 0;
BEGIN
  -- 1. 10분 이의제기 윈도우 경과 건 자동 정산 확정
  FOR v_row IN
    SELECT id, host_id
    FROM prediction.user_challenges
    WHERE status = 'PENDING_SETTLEMENT'
      AND settlement_proposed_at IS NOT NULL
      AND settlement_proposed_at <= NOW() - INTERVAL '10 minutes'
    ORDER BY settlement_proposed_at ASC
    LIMIT 100
  LOOP
    BEGIN
      PERFORM public.finalize_challenge_settlement(v_row.id, v_row.host_id, false);
      v_finalized_count := v_finalized_count + 1;
    EXCEPTION WHEN OTHERS THEN
      v_failed_count := v_failed_count + 1;
    END;
  END LOOP;

  -- 2. 호스트 미판정 장기간(24시간 초과) 방치 건 처리
  --    (실제 에스크로 차감 트랜잭션이 있는 건만 원금 환불, 레거시 시드 건은 PMP 지급 없이 VOID 마감)
  FOR v_row IN
    SELECT
      c.id,
      EXISTS (
        SELECT 1
        FROM economy.pmp_pmc_transactions t
        WHERE t.transaction_type = 'PMP_SPEND'
          AND t.metadata->>'source' = 'user_challenge_entry'
          AND t.metadata->>'challenge_id' = c.id::text
      ) AS has_escrow
    FROM prediction.user_challenges c
    WHERE c.status IN ('OPEN', 'LOCKED')
      AND c.settlement_at <= NOW() - INTERVAL '24 hours'
    ORDER BY c.settlement_at ASC
    LIMIT 100
  LOOP
    BEGIN
      IF v_row.has_escrow THEN
        PERFORM public.void_challenge_refund_internal(v_row.id, 'HOST_TIMEOUT_VOID_REFUND');
        v_refunded_count := v_refunded_count + 1;
      ELSE
        UPDATE prediction.user_challenges
        SET status = 'VOID',
            settled_at = NOW(),
            updated_at = NOW(),
            payout_details = jsonb_build_object(
              'mode', 'VOID_LEGACY_NO_ESCROW',
              'reason', 'HOST_TIMEOUT_LEGACY_CLOSE'
            )
        WHERE id = v_row.id;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      v_failed_count := v_failed_count + 1;
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'finalized_count', v_finalized_count,
    'refunded_count', v_refunded_count,
    'failed_count', v_failed_count,
    'processed_at', NOW()
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.process_expired_user_challenges() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_expired_user_challenges() TO service_role;

-- 5분 주기 pg_cron 등록 (이미 존재하면 재등록)
DO $$
DECLARE
  v_job_id bigint;
BEGIN
  SELECT jobid INTO v_job_id
  FROM cron.job
  WHERE jobname = 'user-challenge-auto-settle';

  IF v_job_id IS NOT NULL THEN
    PERFORM cron.unschedule(v_job_id);
  END IF;

  PERFORM cron.schedule(
    'user-challenge-auto-settle',
    '*/5 * * * *',
    $cron$SELECT public.process_expired_user_challenges();$cron$
  );
END $$;
