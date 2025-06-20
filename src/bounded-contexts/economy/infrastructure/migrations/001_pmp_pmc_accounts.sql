-- Economy Domain Database Schema Migration
-- PMP/PMC 계정 및 거래 관리를 위한 테이블들
-- Clean Architecture 원칙에 따라 도메인 요구사항을 반영한 스키마 설계

-- 사용자 계정 잔액 테이블
CREATE TABLE IF NOT EXISTS pmp_pmc_accounts (
    user_id UUID PRIMARY KEY,
    pmp_balance BIGINT NOT NULL DEFAULT 0 CHECK (pmp_balance >= 0),
    pmc_balance DECIMAL(18,8) NOT NULL DEFAULT 0 CHECK (pmc_balance >= 0),
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 거래 내역 테이블
CREATE TABLE IF NOT EXISTS pmp_pmc_transactions (
    transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES pmp_pmc_accounts(user_id),
    transaction_type TEXT NOT NULL CHECK (
        transaction_type IN (
            'PMP_EARN', 'PMC_CONVERT', 'PMP_SPEND', 
            'PMC_SPEND', 'DONATION', 'REDISTRIBUTION'
        )
    ),
    pmp_amount BIGINT CHECK (pmp_amount IS NOT NULL OR pmc_amount IS NOT NULL),
    pmc_amount DECIMAL(18,8),
    description TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    related_money_wave_id UUID,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 계정 활동 통계 테이블 (성능 최적화를 위한 비정규화)
CREATE TABLE IF NOT EXISTS account_activity_stats (
    user_id UUID PRIMARY KEY REFERENCES pmp_pmc_accounts(user_id),
    last_login_date TIMESTAMPTZ,
    last_transaction_date TIMESTAMPTZ,
    transaction_count INTEGER NOT NULL DEFAULT 0,
    total_pmp_earned BIGINT NOT NULL DEFAULT 0,
    total_pmc_converted DECIMAL(18,8) NOT NULL DEFAULT 0,
    average_activity_score DECIMAL(5,3) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 시스템 통계 테이블 (전체 PMP/PMC 공급량 추적)
CREATE TABLE IF NOT EXISTS system_statistics (
    id SERIAL PRIMARY KEY,
    snapshot_date DATE NOT NULL UNIQUE,
    total_pmp_supply BIGINT NOT NULL,
    total_pmc_supply DECIMAL(18,8) NOT NULL,
    active_account_count INTEGER NOT NULL,
    total_transaction_count BIGINT NOT NULL,
    gini_coefficient_pmp DECIMAL(5,4),
    gini_coefficient_pmc DECIMAL(5,4),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스 생성 (쿼리 성능 최적화)
CREATE INDEX IF NOT EXISTS idx_transactions_user_id_timestamp 
    ON pmp_pmc_transactions(user_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_type_timestamp 
    ON pmp_pmc_transactions(transaction_type, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_money_wave_id 
    ON pmp_pmc_transactions(related_money_wave_id)
    WHERE related_money_wave_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_accounts_balance_pmp 
    ON pmp_pmc_accounts(pmp_balance DESC);

CREATE INDEX IF NOT EXISTS idx_accounts_balance_pmc 
    ON pmp_pmc_accounts(pmc_balance DESC);

CREATE INDEX IF NOT EXISTS idx_accounts_active_updated 
    ON pmp_pmc_accounts(is_active, updated_at DESC);

-- 업데이트 시간 자동 갱신을 위한 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 설정
CREATE TRIGGER update_pmp_pmc_accounts_updated_at 
    BEFORE UPDATE ON pmp_pmc_accounts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_account_activity_stats_updated_at 
    BEFORE UPDATE ON account_activity_stats 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) 설정
ALTER TABLE pmp_pmc_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pmp_pmc_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_activity_stats ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 데이터만 조회/수정 가능
CREATE POLICY "Users can view own account data" ON pmp_pmc_accounts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own account data" ON pmp_pmc_accounts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own transactions" ON pmp_pmc_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON pmp_pmc_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own activity stats" ON account_activity_stats
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own activity stats" ON account_activity_stats
    FOR UPDATE USING (auth.uid() = user_id);

-- 시스템 통계는 모든 인증된 사용자가 조회 가능
CREATE POLICY "Authenticated users can view system stats" ON system_statistics
    FOR SELECT USING (auth.role() = 'authenticated');

-- 코멘트 추가 (문서화)
COMMENT ON TABLE pmp_pmc_accounts IS 'PMP/PMC 사용자 계정 잔액 정보';
COMMENT ON TABLE pmp_pmc_transactions IS 'PMP/PMC 거래 내역 및 이벤트 로그';
COMMENT ON TABLE account_activity_stats IS '사용자 활동 통계 (성능 최적화용 비정규화 테이블)';
COMMENT ON TABLE system_statistics IS '시스템 전체 PMP/PMC 통계 및 지니계수 추적';

COMMENT ON COLUMN pmp_pmc_accounts.pmp_balance IS 'PMP(위험프리 자산) 잔액 (정수형, 최소 단위)';
COMMENT ON COLUMN pmp_pmc_accounts.pmc_balance IS 'PMC(위험 자산) 잔액 (소수점 8자리 정밀도)';
COMMENT ON COLUMN pmp_pmc_transactions.transaction_type IS '거래 유형 (PMP_EARN, PMC_CONVERT, DONATION 등)';
COMMENT ON COLUMN pmp_pmc_transactions.metadata IS '거래 관련 추가 메타데이터 (JSON 형태)';
COMMENT ON COLUMN system_statistics.gini_coefficient_pmp IS 'PMP 분배의 지니계수 (불평등 측정)';
COMMENT ON COLUMN system_statistics.gini_coefficient_pmc IS 'PMC 분배의 지니계수 (불평등 측정)';
