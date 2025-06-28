-- 사용자 효용함수 및 행동경제학 데이터 스키마
-- 개인 효용함수 U(x) = α·ln(PMP) + β·ln(PMC) + γ·S(Donate) 추정 시스템

-- 개인 효용함수 매개변수 테이블
CREATE TABLE IF NOT EXISTS individual_utility_parameters (
    user_id UUID PRIMARY KEY,
    
    -- 기본 효용함수 계수
    alpha DECIMAL(8,6) NOT NULL DEFAULT 0.5,  -- PMP 효용 계수 (위험회피 자산)
    beta DECIMAL(8,6) NOT NULL DEFAULT 0.3,   -- PMC 효용 계수 (위험자산)
    gamma DECIMAL(8,6) NOT NULL DEFAULT 0.2,  -- 사회적 기여(기부) 효용 계수
    delta DECIMAL(8,6) NOT NULL DEFAULT 0.5,  -- 위험회피 성향
    epsilon DECIMAL(8,6) NOT NULL DEFAULT 0.3, -- 사회적 선호도
    
    -- 고급 매개변수
    theta DECIMAL(8,6) NOT NULL DEFAULT 0.95,  -- 시간할인율
    rho DECIMAL(8,6) NOT NULL DEFAULT 2.0,     -- 상대위험회피도 (CRRA)
    sigma DECIMAL(8,6) NOT NULL DEFAULT 0.5,   -- 탄력성 대체계수 (CES)
    
    -- 추정 품질 지표
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    estimation_confidence DECIMAL(5,3) NOT NULL DEFAULT 0,
    data_quality TEXT NOT NULL DEFAULT 'LOW' CHECK (data_quality IN ('HIGH', 'MEDIUM', 'LOW')),
    observation_count INTEGER NOT NULL DEFAULT 0,
    r_squared DECIMAL(5,4),
    
    -- 메타데이터
    estimation_method TEXT DEFAULT 'MAXIMUM_LIKELIHOOD',
    last_estimation_date TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 사회후생함수 매개변수 테이블
CREATE TABLE IF NOT EXISTS social_welfare_parameters (
    parameter_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- 사회후생함수 계수 W = Σᵢ Uᵢ(x) + λ·Gini(distribution) + μ·Social_Mobility + ν·Public_Good
    lambda DECIMAL(8,6) NOT NULL DEFAULT 0.3,   -- 불평등 가중치 (롤스적 정의)
    mu DECIMAL(8,6) NOT NULL DEFAULT 0.2,       -- 사회적 이동성 가중치
    nu DECIMAL(8,6) NOT NULL DEFAULT 0.25,      -- 공공재 가중치
    phi DECIMAL(8,6) NOT NULL DEFAULT 0.15,     -- 집합적 효용 가중치
    psi DECIMAL(8,6) NOT NULL DEFAULT 0.1,      -- 세대간 공정성 가중치
    omega DECIMAL(8,6) NOT NULL DEFAULT 0.05,   -- 환경적 지속가능성 가중치
    
    -- 측정 메트릭
    calculation_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    total_population INTEGER NOT NULL,
    sample_size INTEGER NOT NULL,
    statistical_significance DECIMAL(5,3),
    confidence_interval DECIMAL(5,3),
    
    -- 결과
    current_social_welfare DECIMAL(10,3),
    gini_coefficient DECIMAL(5,4),
    social_mobility_index DECIMAL(5,3),
    public_good_index DECIMAL(5,3),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 효용함수 추정 입력 데이터 테이블
CREATE TABLE IF NOT EXISTS utility_estimation_inputs (
    input_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES individual_utility_parameters(user_id),
    
    -- 행동 데이터
    action_type TEXT NOT NULL CHECK (
        action_type IN ('PMP_EARN', 'PMC_CONVERT', 'DONATION', 'PREDICTION', 'INVESTMENT')
    ),
    action_value DECIMAL(18,8) NOT NULL,
    
    -- 컨텍스트 데이터
    pmp_balance DECIMAL(18,8) NOT NULL,
    pmc_balance DECIMAL(18,8) NOT NULL,
    market_condition TEXT NOT NULL CHECK (market_condition IN ('BULL', 'BEAR', 'NEUTRAL')),
    social_context TEXT NOT NULL CHECK (social_context IN ('INDIVIDUAL', 'GROUP', 'COMMUNITY')),
    time_of_day TEXT NOT NULL CHECK (time_of_day IN ('MORNING', 'AFTERNOON', 'EVENING', 'NIGHT')),
    weekday BOOLEAN NOT NULL,
    
    -- 주관적 평가
    satisfaction_score DECIMAL(3,1) NOT NULL CHECK (satisfaction_score >= 1 AND satisfaction_score <= 10),
    regret_level DECIMAL(3,1) NOT NULL CHECK (regret_level >= 0 AND regret_level <= 10),
    
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 행동경제학적 바이어스 측정 테이블
CREATE TABLE IF NOT EXISTS behavioral_bias_profiles (
    user_id UUID PRIMARY KEY,
    
    -- Kahneman-Tversky Behavioral Economics 바이어스
    loss_aversion DECIMAL(5,3) NOT NULL DEFAULT 2.25,        -- 손실회피 정도 (λ)
    endowment_effect DECIMAL(5,3) NOT NULL DEFAULT 0.5,      -- 소유효과
    mental_accounting DECIMAL(5,3) NOT NULL DEFAULT 0.5,     -- 심리적 회계
    hyperbolic_discounting DECIMAL(5,3) NOT NULL DEFAULT 0.5, -- 쌍곡할인
    overconfidence DECIMAL(5,3) NOT NULL DEFAULT 0.5,        -- 과신편향
    
    -- 추가 인지편향
    anchoring DECIMAL(5,3) NOT NULL DEFAULT 0.5,             -- 앵커링 편향
    availability_heuristic DECIMAL(5,3) NOT NULL DEFAULT 0.5, -- 가용성 휴리스틱
    confirmation_bias DECIMAL(5,3) NOT NULL DEFAULT 0.5,     -- 확증편향
    herding DECIMAL(5,3) NOT NULL DEFAULT 0.5,               -- 군집행동
    recency_bias DECIMAL(5,3) NOT NULL DEFAULT 0.5,          -- 최신편향
    
    -- 측정 품질
    profile_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reliability_score DECIMAL(5,3) NOT NULL DEFAULT 0,
    measurement_count INTEGER NOT NULL DEFAULT 0,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 효용함수 예측 결과 테이블
CREATE TABLE IF NOT EXISTS utility_predictions (
    prediction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES individual_utility_parameters(user_id),
    
    -- 시나리오 정보
    scenario_description TEXT NOT NULL,
    pmp_amount DECIMAL(18,8) NOT NULL,
    pmc_amount DECIMAL(18,8) NOT NULL,
    donation_amount DECIMAL(18,8),
    social_impact_score DECIMAL(5,3),
    
    -- 예측 결과
    predicted_utility DECIMAL(10,6) NOT NULL,
    confidence_interval_lower DECIMAL(10,6),
    confidence_interval_upper DECIMAL(10,6),
    prediction_accuracy DECIMAL(5,3),
    
    -- 비교 분석
    peer_group_average DECIMAL(10,6),
    population_percentile DECIMAL(5,3),
    
    prediction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expiry_date TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 사용자 클러스터링 결과 테이블
CREATE TABLE IF NOT EXISTS user_utility_clusters (
    cluster_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cluster_name TEXT NOT NULL,
    cluster_description TEXT,
    
    -- 클러스터 중심 효용함수 계수
    center_alpha DECIMAL(8,6) NOT NULL,
    center_beta DECIMAL(8,6) NOT NULL,
    center_gamma DECIMAL(8,6) NOT NULL,
    center_delta DECIMAL(8,6) NOT NULL,
    center_epsilon DECIMAL(8,6) NOT NULL,
    
    -- 클러스터 특성
    member_count INTEGER NOT NULL DEFAULT 0,
    variance_within_cluster DECIMAL(8,6),
    typical_behavior_pattern TEXT,
    risk_tolerance_level TEXT CHECK (risk_tolerance_level IN ('LOW', 'MEDIUM', 'HIGH')),
    social_orientation TEXT CHECK (social_orientation IN ('INDIVIDUALISTIC', 'COOPERATIVE', 'ALTRUISTIC')),
    
    clustering_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 사용자-클러스터 매핑 테이블
CREATE TABLE IF NOT EXISTS user_cluster_assignments (
    user_id UUID NOT NULL REFERENCES individual_utility_parameters(user_id),
    cluster_id UUID NOT NULL REFERENCES user_utility_clusters(cluster_id),
    assignment_probability DECIMAL(5,3) NOT NULL,
    distance_from_center DECIMAL(8,6),
    assignment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    PRIMARY KEY (user_id, cluster_id, assignment_date)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_utility_params_confidence 
    ON individual_utility_parameters(estimation_confidence DESC, data_quality);

CREATE INDEX IF NOT EXISTS idx_utility_inputs_user_timestamp 
    ON utility_estimation_inputs(user_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_utility_inputs_action_type 
    ON utility_estimation_inputs(action_type, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_bias_profiles_updated 
    ON behavioral_bias_profiles(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_predictions_user_date 
    ON utility_predictions(user_id, prediction_date DESC);

CREATE INDEX IF NOT EXISTS idx_clusters_member_count 
    ON user_utility_clusters(member_count DESC);

-- 업데이트 트리거
CREATE TRIGGER update_individual_utility_parameters_updated_at 
    BEFORE UPDATE ON individual_utility_parameters 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_behavioral_bias_profiles_updated_at 
    BEFORE UPDATE ON behavioral_bias_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
ALTER TABLE individual_utility_parameters ENABLE ROW LEVEL SECURITY;
ALTER TABLE utility_estimation_inputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE behavioral_bias_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE utility_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_cluster_assignments ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 효용함수 데이터만 조회/수정 가능
CREATE POLICY "Users can view own utility parameters" ON individual_utility_parameters
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own utility inputs" ON utility_estimation_inputs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own utility inputs" ON utility_estimation_inputs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own bias profiles" ON behavioral_bias_profiles
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own predictions" ON utility_predictions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own cluster assignments" ON user_cluster_assignments
    FOR SELECT USING (auth.uid() = user_id);

-- 사회후생함수 및 클러스터 정보는 모든 인증된 사용자가 조회 가능
CREATE POLICY "Authenticated users can view social welfare parameters" ON social_welfare_parameters
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view user clusters" ON user_utility_clusters
    FOR SELECT USING (auth.role() = 'authenticated');

-- 코멘트 추가
COMMENT ON TABLE individual_utility_parameters IS '개인별 효용함수 매개변수 U(x) = α·ln(PMP) + β·ln(PMC) + γ·S(Donate)';
COMMENT ON TABLE social_welfare_parameters IS '사회후생함수 매개변수 W = Σᵢ Uᵢ(x) + λ·Gini + μ·Mobility + ν·PublicGood';
COMMENT ON TABLE utility_estimation_inputs IS '효용함수 추정을 위한 사용자 행동 관찰 데이터';
COMMENT ON TABLE behavioral_bias_profiles IS 'Kahneman-Tversky 행동경제학 기반 인지편향 프로필';
COMMENT ON TABLE utility_predictions IS '개인 효용함수 기반 행동 예측 결과';
COMMENT ON TABLE user_utility_clusters IS '유사한 효용 패턴을 가진 사용자 클러스터';

COMMENT ON COLUMN individual_utility_parameters.alpha IS 'PMP(위험프리 자산) 효용 계수';
COMMENT ON COLUMN individual_utility_parameters.beta IS 'PMC(위험자산) 효용 계수';
COMMENT ON COLUMN individual_utility_parameters.gamma IS '사회적 기여(기부) 효용 계수';
COMMENT ON COLUMN behavioral_bias_profiles.loss_aversion IS 'Kahneman-Tversky 손실회피 계수 λ (기본값 2.25)';
COMMENT ON COLUMN utility_predictions.predicted_utility IS '효용함수 기반 예측된 개인 효용값';
