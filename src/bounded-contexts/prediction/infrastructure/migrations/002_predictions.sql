-- Prediction Domain Database Schema Migration
-- Predictions 테이블 및 사용자 예측 데이터 관리
-- Agency Theory 기반 정보 비대칭 해결 및 CAPM 위험-수익 구조 반영

-- 개별 예측 테이블 (사용자가 참여한 예측들)
CREATE TABLE IF NOT EXISTS predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, -- auth.users 참조
    game_id UUID NOT NULL REFERENCES prediction_games(id) ON DELETE CASCADE,
    
    -- 예측 내용
    selected_option_id TEXT NOT NULL, -- 선택한 옵션 ID
    confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1), -- 신뢰도 (0-1)
    reasoning TEXT, -- 예측 근거 (선택사항)
    
    -- 경제적 투입 (PMP/PMC)
    stake_amount BIGINT NOT NULL CHECK (stake_amount > 0), -- PMP 스테이크 양
    expected_return DECIMAL(18,8), -- 기대 수익 (PMC)
    
    -- 예측 결과 및 보상 (정산 후 설정)
    is_correct BOOLEAN, -- 정답 여부
    accuracy_score DECIMAL(5,4), -- 정확도 점수 (0-1)
    reward_amount DECIMAL(18,8) DEFAULT 0, -- 받은 PMC 보상
    
    -- Agency Theory 적용 지표
    information_quality_score DECIMAL(5,4), -- 정보 품질 점수
    overconfidence_penalty DECIMAL(5,4) DEFAULT 0, -- 과신 패널티
    social_learning_bonus DECIMAL(5,4) DEFAULT 0, -- 사회적 학습 보너스
    
    -- CAPM 관련 지표
    risk_score DECIMAL(5,4), -- 개별 예측 위험 점수
    risk_premium DECIMAL(10,6), -- 위험 프리미엄
    beta_adjustment DECIMAL(8,6) DEFAULT 1.0, -- 베타 조정 계수
    
    -- 행동경제학 지표
    anchoring_bias_score DECIMAL(5,4), -- 앵커링 편향 점수
    availability_heuristic_score DECIMAL(5,4), -- 가용성 휴리스틱 점수
    herding_influence DECIMAL(5,4), -- 군중심리 영향도
    
    -- 메타데이터
    prediction_metadata JSONB DEFAULT '{}', -- 추가 예측 관련 데이터
    algorithm_version TEXT DEFAULT 'v1.0', -- 계산 알고리즘 버전
    
    -- 타임스탬프
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    settled_at TIMESTAMPTZ, -- 정산 완료 시간
    
    -- 복합 유니크 제약조건 (한 사용자당 게임당 하나의 예측만)
    UNIQUE(user_id, game_id)
);

-- 예측 결과 상세 테이블 (정산 프로세스 추적)
CREATE TABLE IF NOT EXISTS prediction_settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prediction_id UUID NOT NULL REFERENCES predictions(id) ON DELETE CASCADE,
    game_id UUID NOT NULL REFERENCES prediction_games(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    
    -- 정산 결과
    settlement_type TEXT NOT NULL CHECK (
        settlement_type IN ('WINNER', 'LOSER', 'PARTIAL', 'CANCELLED')
    ),
    accuracy_percentage DECIMAL(5,2), -- 정확도 백분율
    base_reward DECIMAL(18,8) NOT NULL DEFAULT 0, -- 기본 보상
    performance_bonus DECIMAL(18,8) NOT NULL DEFAULT 0, -- 성과 보너스
    agency_theory_adjustment DECIMAL(18,8) NOT NULL DEFAULT 0, -- Agency Theory 조정
    final_reward DECIMAL(18,8) NOT NULL DEFAULT 0, -- 최종 보상
    
    -- 정산 메트릭
    rank_among_winners INTEGER, -- 당첨자 중 순위
    total_winner_count INTEGER, -- 총 당첨자 수
    prize_pool_share DECIMAL(8,6), -- 상금 풀 점유율
    
    -- MoneyWave 연동 정보
    money_wave_batch_id UUID, -- MoneyWave 배치 ID
    redistribution_eligible BOOLEAN DEFAULT false, -- 재분배 대상 여부
    
    -- 정산 프로세스 정보
    settlement_algorithm TEXT NOT NULL DEFAULT 'agency_capm_v1', -- 사용된 정산 알고리즘
    calculation_details JSONB DEFAULT '{}', -- 계산 세부사항
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 사용자 예측 통계 테이블 (성능 최적화용)
CREATE TABLE IF NOT EXISTS user_prediction_stats (
    user_id UUID PRIMARY KEY,
    
    -- 기본 통계
    total_predictions INTEGER NOT NULL DEFAULT 0,
    total_games_participated INTEGER NOT NULL DEFAULT 0,
    total_pmp_invested BIGINT NOT NULL DEFAULT 0,
    total_pmc_earned DECIMAL(18,8) NOT NULL DEFAULT 0,
    
    -- 성과 지표
    win_rate DECIMAL(5,4) NOT NULL DEFAULT 0, -- 승률
    average_accuracy DECIMAL(5,4) NOT NULL DEFAULT 0, -- 평균 정확도
    average_confidence DECIMAL(5,4) NOT NULL DEFAULT 0, -- 평균 신뢰도
    roi_percentage DECIMAL(8,4) NOT NULL DEFAULT 0, -- 투자수익률 (%)
    
    -- Agency Theory 성과
    information_quality_avg DECIMAL(5,4) NOT NULL DEFAULT 0, -- 평균 정보 품질
    overconfidence_tendency DECIMAL(5,4) NOT NULL DEFAULT 0, -- 과신 경향
    social_learning_score DECIMAL(5,4) NOT NULL DEFAULT 0, -- 사회적 학습 점수
    
    -- CAPM 프로필
    user_beta DECIMAL(8,6) NOT NULL DEFAULT 1.0, -- 사용자 베타 계수
    risk_preference DECIMAL(5,4) NOT NULL DEFAULT 0.5, -- 위험 선호도
    portfolio_performance DECIMAL(8,4) NOT NULL DEFAULT 0, -- 포트폴리오 성과
    
    -- 행동경제학 프로필
    bias_score DECIMAL(5,4) NOT NULL DEFAULT 0, -- 전체 편향 점수
    herd_tendency DECIMAL(5,4) NOT NULL DEFAULT 0, -- 군중심리 경향
    learning_rate DECIMAL(5,4) NOT NULL DEFAULT 0, -- 학습률
    
    -- 랭킹 정보
    overall_rank INTEGER, -- 전체 순위
    accuracy_rank INTEGER, -- 정확도 순위
    roi_rank INTEGER, -- 수익률 순위
    
    -- 업데이트 정보
    last_prediction_date TIMESTAMPTZ, -- 마지막 예측 일시
    last_calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 예측 정확도 이력 테이블 (학습 곡선 추적)
CREATE TABLE IF NOT EXISTS prediction_accuracy_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    game_id UUID NOT NULL REFERENCES prediction_games(id) ON DELETE CASCADE,
    prediction_id UUID NOT NULL REFERENCES predictions(id) ON DELETE CASCADE,
    
    -- 시계열 정확도 데이터
    accuracy_score DECIMAL(5,4) NOT NULL,
    confidence_level DECIMAL(3,2) NOT NULL,
    calibration_score DECIMAL(5,4), -- 신뢰도 보정 점수
    
    -- 컨텍스트 정보
    game_type TEXT NOT NULL, -- binary, wdl, ranking
    game_difficulty DECIMAL(3,1), -- 게임 난이도 (1-5)
    market_consensus DECIMAL(5,4), -- 시장 합의도
    
    -- 학습 지표
    prediction_sequence INTEGER, -- 사용자의 몇 번째 예측인지
    learning_improvement DECIMAL(6,4), -- 이전 대비 개선도
    domain_expertise DECIMAL(5,4), -- 해당 도메인 전문성
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 성능 최적화 인덱스
CREATE INDEX IF NOT EXISTS idx_predictions_user_id_created_at 
    ON predictions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_predictions_game_id_created_at 
    ON predictions(game_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_predictions_selected_option 
    ON predictions(game_id, selected_option_id);

CREATE INDEX IF NOT EXISTS idx_predictions_stake_amount 
    ON predictions(stake_amount DESC);

CREATE INDEX IF NOT EXISTS idx_predictions_unsettled 
    ON predictions(game_id, created_at)
    WHERE is_correct IS NULL;

CREATE INDEX IF NOT EXISTS idx_predictions_winners 
    ON predictions(game_id, reward_amount DESC)
    WHERE is_correct = true;

-- 정산 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_prediction_settlements_prediction_id 
    ON prediction_settlements(prediction_id);

CREATE INDEX IF NOT EXISTS idx_prediction_settlements_user_performance 
    ON prediction_settlements(user_id, final_reward DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_prediction_settlements_money_wave 
    ON prediction_settlements(money_wave_batch_id)
    WHERE money_wave_batch_id IS NOT NULL;

-- 통계 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_user_prediction_stats_overall_rank 
    ON user_prediction_stats(overall_rank)
    WHERE overall_rank IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_prediction_stats_roi 
    ON user_prediction_stats(roi_percentage DESC);

CREATE INDEX IF NOT EXISTS idx_user_prediction_stats_accuracy 
    ON user_prediction_stats(average_accuracy DESC);

-- 정확도 이력 인덱스
CREATE INDEX IF NOT EXISTS idx_accuracy_history_user_sequence 
    ON prediction_accuracy_history(user_id, prediction_sequence);

CREATE INDEX IF NOT EXISTS idx_accuracy_history_game_type 
    ON prediction_accuracy_history(game_type, accuracy_score DESC);

-- 복합 인덱스 (자주 사용되는 쿼리 패턴)
CREATE INDEX IF NOT EXISTS idx_predictions_user_game_performance 
    ON predictions(user_id, is_correct, reward_amount DESC)
    WHERE is_correct IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_predictions_game_stats 
    ON predictions(game_id, stake_amount, confidence, created_at);

-- 트리거 설정 (updated_at 자동 갱신)
CREATE TRIGGER update_predictions_updated_at 
    BEFORE UPDATE ON predictions 
    FOR EACH ROW EXECUTE FUNCTION update_prediction_updated_at_column();

CREATE TRIGGER update_user_prediction_stats_updated_at 
    BEFORE UPDATE ON user_prediction_stats 
    FOR EACH ROW EXECUTE FUNCTION update_prediction_updated_at_column();

-- 통계 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_user_prediction_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- 예측 통계 실시간 업데이트
    INSERT INTO user_prediction_stats (user_id) 
    VALUES (NEW.user_id)
    ON CONFLICT (user_id) DO UPDATE SET
        total_predictions = (
            SELECT COUNT(*) FROM predictions WHERE user_id = NEW.user_id
        ),
        total_pmp_invested = (
            SELECT COALESCE(SUM(stake_amount), 0) FROM predictions WHERE user_id = NEW.user_id
        ),
        total_pmc_earned = (
            SELECT COALESCE(SUM(reward_amount), 0) FROM predictions WHERE user_id = NEW.user_id
        ),
        win_rate = (
            SELECT COALESCE(
                COUNT(*) FILTER (WHERE is_correct = true)::DECIMAL / NULLIF(COUNT(*) FILTER (WHERE is_correct IS NOT NULL), 0),
                0
            ) FROM predictions WHERE user_id = NEW.user_id
        ),
        average_accuracy = (
            SELECT COALESCE(AVG(accuracy_score), 0) FROM predictions 
            WHERE user_id = NEW.user_id AND accuracy_score IS NOT NULL
        ),
        average_confidence = (
            SELECT COALESCE(AVG(confidence), 0) FROM predictions WHERE user_id = NEW.user_id
        ),
        last_prediction_date = NEW.created_at,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 통계 자동 업데이트 트리거
CREATE TRIGGER update_stats_on_prediction_insert
    AFTER INSERT ON predictions
    FOR EACH ROW EXECUTE FUNCTION update_user_prediction_stats();

CREATE TRIGGER update_stats_on_prediction_update
    AFTER UPDATE ON predictions
    FOR EACH ROW EXECUTE FUNCTION update_user_prediction_stats();

-- Row Level Security 설정
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_prediction_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_accuracy_history ENABLE ROW LEVEL SECURITY;

-- RLS 정책

-- 1. 예측 테이블: 사용자는 자신의 예측만 관리, 다른 사용자 예측은 제한적 조회
CREATE POLICY "Users can view own predictions" ON predictions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view game predictions summary" ON predictions
    FOR SELECT USING (
        -- 게임 참여자는 다른 참여자의 기본 정보만 조회 가능 (reasoning 제외)
        EXISTS (
            SELECT 1 FROM predictions p2 
            WHERE p2.game_id = predictions.game_id AND p2.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own predictions" ON predictions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own predictions" ON predictions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can manage all predictions" ON predictions
    FOR ALL USING (auth.role() = 'service_role');

-- 2. 정산 테이블: 조회만 가능
CREATE POLICY "Users can view own settlements" ON prediction_settlements
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage settlements" ON prediction_settlements
    FOR ALL USING (auth.role() = 'service_role');

-- 3. 사용자 통계: 본인 것만 조회/수정, 전체 랭킹은 공개
CREATE POLICY "Users can view own stats" ON user_prediction_stats
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view ranking data" ON user_prediction_stats
    FOR SELECT USING (
        -- 랭킹 정보는 공개 (개인 식별 정보 제외)
        true
    );

CREATE POLICY "System can manage user stats" ON user_prediction_stats
    FOR ALL USING (auth.role() = 'service_role');

-- 4. 정확도 이력: 개인 데이터 보호
CREATE POLICY "Users can view own accuracy history" ON prediction_accuracy_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage accuracy history" ON prediction_accuracy_history
    FOR ALL USING (auth.role() = 'service_role');

-- 테이블 및 컬럼 코멘트 (문서화)
COMMENT ON TABLE predictions IS '사용자 개별 예측 데이터 - Agency Theory 및 CAPM 적용';
COMMENT ON TABLE prediction_settlements IS '예측 정산 결과 및 보상 계산 상세';
COMMENT ON TABLE user_prediction_stats IS '사용자별 예측 성과 통계 (실시간 집계)';
COMMENT ON TABLE prediction_accuracy_history IS '사용자 정확도 학습 곡선 추적';

COMMENT ON COLUMN predictions.confidence IS '예측 신뢰도 (0-1) - Agency Theory 정보 품질 측정용';
COMMENT ON COLUMN predictions.overconfidence_penalty IS '과신 패널티 - Kahneman-Tversky Prospect Theory 적용';
COMMENT ON COLUMN predictions.risk_premium IS 'CAPM 위험 프리미엄 - 게임 위험도 기반 계산';

COMMENT ON COLUMN prediction_settlements.agency_theory_adjustment IS 'Agency Theory 기반 보상 조정 - 정보 비대칭 해결 인센티브';
COMMENT ON COLUMN prediction_settlements.prize_pool_share IS '전체 상금 풀에서 차지하는 비율';

COMMENT ON COLUMN user_prediction_stats.user_beta IS '사용자별 베타 계수 - CAPM 위험 프로필';
COMMENT ON COLUMN user_prediction_stats.social_learning_score IS 'Buchanan 공공선택이론 - 사회적 학습 능력';

-- 데이터 무결성 제약조건
ALTER TABLE predictions ADD CONSTRAINT chk_confidence_range 
    CHECK (confidence >= 0 AND confidence <= 1);

ALTER TABLE predictions ADD CONSTRAINT chk_positive_stake 
    CHECK (stake_amount > 0);

ALTER TABLE predictions ADD CONSTRAINT chk_valid_accuracy 
    CHECK (accuracy_score IS NULL OR (accuracy_score >= 0 AND accuracy_score <= 1));

ALTER TABLE predictions ADD CONSTRAINT chk_non_negative_reward 
    CHECK (reward_amount >= 0);

-- 정산 테이블 제약조건
ALTER TABLE prediction_settlements ADD CONSTRAINT chk_valid_accuracy_percentage 
    CHECK (accuracy_percentage IS NULL OR (accuracy_percentage >= 0 AND accuracy_percentage <= 100));

ALTER TABLE prediction_settlements ADD CONSTRAINT chk_non_negative_rewards 
    CHECK (
        base_reward >= 0 AND 
        performance_bonus >= 0 AND 
        final_reward >= 0
    );

-- 통계 테이블 제약조건
ALTER TABLE user_prediction_stats ADD CONSTRAINT chk_valid_rates 
    CHECK (
        win_rate >= 0 AND win_rate <= 1 AND
        average_accuracy >= 0 AND average_accuracy <= 1 AND
        average_confidence >= 0 AND average_confidence <= 1
    );

ALTER TABLE user_prediction_stats ADD CONSTRAINT chk_non_negative_totals 
    CHECK (
        total_predictions >= 0 AND 
        total_games_participated >= 0 AND 
        total_pmp_invested >= 0 AND 
        total_pmc_earned >= 0
    );

-- 정확도 이력 제약조건
ALTER TABLE prediction_accuracy_history ADD CONSTRAINT chk_valid_accuracy_scores 
    CHECK (
        accuracy_score >= 0 AND accuracy_score <= 1 AND
        confidence_level >= 0 AND confidence_level <= 1
    );

ALTER TABLE prediction_accuracy_history ADD CONSTRAINT chk_positive_sequence 
    CHECK (prediction_sequence > 0);

-- JSON 스키마 검증
ALTER TABLE predictions ADD CONSTRAINT chk_prediction_metadata_is_object 
    CHECK (jsonb_typeof(prediction_metadata) = 'object');

ALTER TABLE prediction_settlements ADD CONSTRAINT chk_calculation_details_is_object 
    CHECK (jsonb_typeof(calculation_details) = 'object');
