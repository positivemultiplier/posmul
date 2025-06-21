-- Prediction Domain Database Schema Migration
-- Prediction Games 테이블 및 관련 구조
-- Agency Theory와 CAPM 모델을 반영한 예측 게임 스키마
-- Project_Diagram.md와 Project_Economic.md 요구사항 반영

-- 예측 게임 메인 테이블
CREATE TABLE IF NOT EXISTS prediction_games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL, -- auth.users 참조 (외래키 제약조건은 추후 설정)
    
    -- 게임 기본 정보
    title TEXT NOT NULL CHECK (length(title) >= 3 AND length(title) <= 200),
    description TEXT NOT NULL CHECK (length(description) >= 10 AND length(description) <= 2000),
    prediction_type TEXT NOT NULL CHECK (
        prediction_type IN ('binary', 'wdl', 'ranking')
    ),
    
    -- 시간 관련 필드
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL CHECK (end_time > start_time),
    settlement_time TIMESTAMPTZ NOT NULL CHECK (settlement_time > end_time),
    
    -- 경제 시스템 연동 (PMP/PMC)
    minimum_stake BIGINT NOT NULL DEFAULT 100 CHECK (minimum_stake > 0),
    maximum_stake BIGINT NOT NULL DEFAULT 10000 CHECK (maximum_stake >= minimum_stake),
    allocated_prize_pool DECIMAL(18,8) NOT NULL DEFAULT 0 CHECK (allocated_prize_pool >= 0),
    
    -- MoneyWave 시스템 연동
    money_wave_id UUID, -- MoneyWave 배치 ID 참조
    game_importance_score DECIMAL(3,1) NOT NULL DEFAULT 1.0 CHECK (
        game_importance_score >= 1.0 AND game_importance_score <= 5.0
    ),
    expected_participants INTEGER DEFAULT 0,
    
    -- 게임 상태 관리
    status TEXT NOT NULL DEFAULT 'CREATED' CHECK (
        status IN ('CREATED', 'ACTIVE', 'ENDED', 'SETTLED')
    ),
    
    -- 참가자 제한
    max_participants INTEGER CHECK (max_participants IS NULL OR max_participants > 0),
    
    -- 정산 관련 필드
    correct_option_id TEXT, -- 정답 옵션 ID (정산 시 설정)
    total_participants_count INTEGER NOT NULL DEFAULT 0,
    total_stake_amount BIGINT NOT NULL DEFAULT 0,
    total_reward_distributed DECIMAL(18,8) NOT NULL DEFAULT 0,
    
    -- Agency Theory 적용 지표
    information_asymmetry_score DECIMAL(5,4) DEFAULT 0, -- 정보 비대칭 점수
    market_efficiency_ratio DECIMAL(5,4) DEFAULT 0, -- 시장 효율성 비율
    agency_cost_reduction DECIMAL(5,4) DEFAULT 0, -- 대리인 비용 절감
    
    -- 메타데이터
    metadata JSONB DEFAULT '{}', -- 추가 설정 및 데이터
    
    -- 타임스탬프
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 예측 옵션 테이블 (게임별 선택지)
CREATE TABLE IF NOT EXISTS prediction_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES prediction_games(id) ON DELETE CASCADE,
    option_id TEXT NOT NULL, -- 게임 내 옵션 식별자 (예: 'YES', 'NO', 'TEAM_A')
    label TEXT NOT NULL CHECK (length(label) >= 1 AND length(label) <= 100),
    description TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    odds DECIMAL(10,4), -- 배당률 (옵션별)
    is_correct BOOLEAN, -- 정답 여부 (정산 시 설정)
    
    -- 통계 정보 (성능 최적화용 비정규화)
    prediction_count INTEGER NOT NULL DEFAULT 0,
    total_stake_on_option BIGINT NOT NULL DEFAULT 0,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- 복합 유니크 제약조건
    UNIQUE(game_id, option_id)
);

-- 게임 통계 테이블 (실시간 집계용)
CREATE TABLE IF NOT EXISTS prediction_game_stats (
    game_id UUID PRIMARY KEY REFERENCES prediction_games(id) ON DELETE CASCADE,
    
    -- 참여 통계
    participants_count INTEGER NOT NULL DEFAULT 0,
    total_predictions INTEGER NOT NULL DEFAULT 0,
    total_stake_amount BIGINT NOT NULL DEFAULT 0,
    average_stake DECIMAL(12,2),
    average_confidence DECIMAL(5,4),
    
    -- 옵션별 분포 (JSON으로 저장)
    option_distribution JSONB DEFAULT '{}',
    stake_distribution JSONB DEFAULT '{}',
    
    -- CAPM 관련 지표
    risk_score DECIMAL(5,4) DEFAULT 0, -- 게임 위험 점수
    expected_return DECIMAL(10,6) DEFAULT 0, -- 기대 수익률
    beta_coefficient DECIMAL(8,6) DEFAULT 1.0, -- 베타 계수
    
    -- 행동경제학 지표
    overconfidence_penalty DECIMAL(5,4) DEFAULT 0, -- 과신 패널티
    herd_behavior_index DECIMAL(5,4) DEFAULT 0, -- 군중심리 지수
    
    -- 마지막 업데이트 시간
    last_calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 성능 최적화를 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_prediction_games_status_start_time 
    ON prediction_games(status, start_time);

CREATE INDEX IF NOT EXISTS idx_prediction_games_creator_id_created_at 
    ON prediction_games(creator_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_prediction_games_end_time_status 
    ON prediction_games(end_time, status);

CREATE INDEX IF NOT EXISTS idx_prediction_games_money_wave_id 
    ON prediction_games(money_wave_id)
    WHERE money_wave_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_prediction_games_importance_score 
    ON prediction_games(game_importance_score DESC);

CREATE INDEX IF NOT EXISTS idx_prediction_options_game_id_display_order 
    ON prediction_options(game_id, display_order);

CREATE INDEX IF NOT EXISTS idx_prediction_options_is_correct 
    ON prediction_options(is_correct)
    WHERE is_correct IS NOT NULL;

-- 복합 인덱스 (자주 사용되는 쿼리 패턴)
CREATE INDEX IF NOT EXISTS idx_prediction_games_active_by_time 
    ON prediction_games(status, start_time, end_time)
    WHERE status = 'ACTIVE';

CREATE INDEX IF NOT EXISTS idx_prediction_games_settlement_queue 
    ON prediction_games(status, settlement_time)
    WHERE status = 'ENDED';

-- 업데이트 시간 자동 갱신 함수 (재사용)
CREATE OR REPLACE FUNCTION update_prediction_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 설정
CREATE TRIGGER update_prediction_games_updated_at 
    BEFORE UPDATE ON prediction_games 
    FOR EACH ROW EXECUTE FUNCTION update_prediction_updated_at_column();

CREATE TRIGGER update_prediction_options_updated_at 
    BEFORE UPDATE ON prediction_options 
    FOR EACH ROW EXECUTE FUNCTION update_prediction_updated_at_column();

CREATE TRIGGER update_prediction_game_stats_updated_at 
    BEFORE UPDATE ON prediction_game_stats 
    FOR EACH ROW EXECUTE FUNCTION update_prediction_updated_at_column();

-- Row Level Security (RLS) 설정
ALTER TABLE prediction_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_game_stats ENABLE ROW LEVEL SECURITY;

-- RLS 정책 설정

-- 1. 예측 게임: 모든 사용자가 조회 가능, 생성자만 수정 가능
CREATE POLICY "Anyone can view prediction games" ON prediction_games
    FOR SELECT USING (true);

CREATE POLICY "Creators can insert their own games" ON prediction_games
    FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their own games" ON prediction_games
    FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "System can update game stats" ON prediction_games
    FOR UPDATE USING (auth.role() = 'service_role');

-- 2. 예측 옵션: 게임과 연동된 접근 제어
CREATE POLICY "Anyone can view prediction options" ON prediction_options
    FOR SELECT USING (true);

CREATE POLICY "Game creators can manage options" ON prediction_options
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM prediction_games pg 
            WHERE pg.id = game_id AND pg.creator_id = auth.uid()
        )
    );

CREATE POLICY "System can manage options" ON prediction_options
    FOR ALL USING (auth.role() = 'service_role');

-- 3. 게임 통계: 조회만 가능
CREATE POLICY "Anyone can view game stats" ON prediction_game_stats
    FOR SELECT USING (true);

CREATE POLICY "System can manage game stats" ON prediction_game_stats
    FOR ALL USING (auth.role() = 'service_role');

-- 테이블 및 컬럼 코멘트 (문서화)
COMMENT ON TABLE prediction_games IS 'PosMul 예측 게임 메인 테이블 - Agency Theory와 CAPM 모델 적용';
COMMENT ON TABLE prediction_options IS '예측 게임의 선택지/옵션 관리';
COMMENT ON TABLE prediction_game_stats IS '예측 게임 실시간 통계 및 경제학적 지표';

COMMENT ON COLUMN prediction_games.prediction_type IS '예측 타입: binary(예/아니오), wdl(승/무/패), ranking(순위)';
COMMENT ON COLUMN prediction_games.allocated_prize_pool IS 'MoneyWave1에서 배정받은 PMC 상금 풀';
COMMENT ON COLUMN prediction_games.game_importance_score IS '게임 중요도 점수 (1.0-5.0) - 상금 배정에 영향';
COMMENT ON COLUMN prediction_games.information_asymmetry_score IS 'Agency Theory - 정보 비대칭 해결 정도';
COMMENT ON COLUMN prediction_games.market_efficiency_ratio IS 'CAPM - 시장 효율성 비율';

COMMENT ON COLUMN prediction_game_stats.beta_coefficient IS 'CAPM 베타 계수 - 게임 위험도 측정';
COMMENT ON COLUMN prediction_game_stats.overconfidence_penalty IS '행동경제학 - 과신 패널티 지수';
COMMENT ON COLUMN prediction_game_stats.herd_behavior_index IS '행동경제학 - 군중심리 행동 지수';

-- 데이터 무결성을 위한 추가 제약조건
ALTER TABLE prediction_games ADD CONSTRAINT chk_settlement_after_end 
    CHECK (settlement_time >= end_time + INTERVAL '1 hour');

ALTER TABLE prediction_games ADD CONSTRAINT chk_positive_importance_score 
    CHECK (game_importance_score > 0);

-- 게임 상태별 필수 필드 검증을 위한 제약조건
ALTER TABLE prediction_games ADD CONSTRAINT chk_settled_games_have_correct_option 
    CHECK (
        status != 'SETTLED' OR correct_option_id IS NOT NULL
    );

-- JSON 스키마 검증 (metadata 필드)
ALTER TABLE prediction_games ADD CONSTRAINT chk_metadata_is_object 
    CHECK (jsonb_typeof(metadata) = 'object');

-- 옵션 테이블 제약조건
ALTER TABLE prediction_options ADD CONSTRAINT chk_positive_odds 
    CHECK (odds IS NULL OR odds > 0);

ALTER TABLE prediction_options ADD CONSTRAINT chk_valid_label 
    CHECK (trim(label) != '');

-- 통계 테이블 제약조건
ALTER TABLE prediction_game_stats ADD CONSTRAINT chk_non_negative_counts 
    CHECK (
        participants_count >= 0 AND 
        total_predictions >= 0 AND 
        total_stake_amount >= 0
    );

-- 마이그레이션 완료 로그
INSERT INTO system_statistics (
    snapshot_date, 
    total_pmp_supply, 
    total_pmc_supply, 
    active_account_count, 
    total_transaction_count
) VALUES (
    CURRENT_DATE, 
    0, 
    0, 
    0, 
    0
) ON CONFLICT (snapshot_date) DO NOTHING; 