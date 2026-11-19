-- =============================================================================
-- 고아 경제 계정(auth.users 미존재 101건) 무손실 아카이브 이관 및 본 테이블 정리
-- 작성일: 2026-11-19
-- 목적:
--   1. economy.pmp_pmc_accounts 중 auth.users에 존재하지 않는 고아 계정 101건
--      (26,193,600 PMP / 11,811,190 PMC, 예측/기부/프로필 0건)이 전체 경제 통계를
--      10배 이상 왜곡하는 문제를 해소합니다.
--   2. 영구 삭제 대신 service_role 전용 아카이브 테이블로 100% 무손실 이관하여
--      감사 추적 및 필요 시 원복이 가능하도록 보장합니다.
-- =============================================================================

BEGIN;

-- 1. 아카이브 테이블 생성 (service_role 전용, RLS 활성화 및 공개 정책 없음)
CREATE TABLE IF NOT EXISTS economy.archived_orphan_accounts (
  LIKE economy.pmp_pmc_accounts INCLUDING DEFAULTS,
  archived_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archive_reason TEXT NOT NULL DEFAULT 'orphan_no_auth_user_20261119'
);

CREATE TABLE IF NOT EXISTS economy.archived_orphan_transactions (
  LIKE economy.pmp_pmc_transactions INCLUDING DEFAULTS,
  archived_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archive_reason TEXT NOT NULL DEFAULT 'orphan_no_auth_user_20261119'
);

CREATE TABLE IF NOT EXISTS economy.archived_orphan_account_activity_stats (
  LIKE economy.account_activity_stats INCLUDING DEFAULTS,
  archived_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archive_reason TEXT NOT NULL DEFAULT 'orphan_no_auth_user_20261119'
);

ALTER TABLE economy.archived_orphan_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE economy.archived_orphan_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE economy.archived_orphan_account_activity_stats ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE economy.archived_orphan_accounts FROM anon, authenticated;
REVOKE ALL ON TABLE economy.archived_orphan_transactions FROM anon, authenticated;
REVOKE ALL ON TABLE economy.archived_orphan_account_activity_stats FROM anon, authenticated;

-- 2. 고아 레코드 무손실 복사 (멱등성 보장: 이미 동일 user_id/id가 아카이브에 없는 경우만 삽입)
INSERT INTO economy.archived_orphan_accounts
SELECT a.*, NOW(), 'orphan_no_auth_user_20261119'
FROM economy.pmp_pmc_accounts a
LEFT JOIN auth.users u ON u.id = a.user_id
WHERE u.id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM economy.archived_orphan_accounts ar WHERE ar.user_id = a.user_id
  );

INSERT INTO economy.archived_orphan_transactions
SELECT t.*, NOW(), 'orphan_no_auth_user_20261119'
FROM economy.pmp_pmc_transactions t
LEFT JOIN auth.users u ON u.id = t.user_id
WHERE u.id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM economy.archived_orphan_transactions ar WHERE ar.transaction_id = t.transaction_id
  );

INSERT INTO economy.archived_orphan_account_activity_stats
SELECT s.*, NOW(), 'orphan_no_auth_user_20261119'
FROM economy.account_activity_stats s
LEFT JOIN auth.users u ON u.id = s.user_id
WHERE u.id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM economy.archived_orphan_account_activity_stats ar WHERE ar.user_id = s.user_id
  );

-- 3. FK 자식 → 부모 순서로 본 테이블에서 고아 레코드 정리
DELETE FROM economy.account_activity_stats s
WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = s.user_id);

DELETE FROM economy.pmp_pmc_transactions t
WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = t.user_id);

DELETE FROM economy.pmp_pmc_accounts a
WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = a.user_id);

COMMIT;
