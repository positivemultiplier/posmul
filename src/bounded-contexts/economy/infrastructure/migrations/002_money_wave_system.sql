-- MoneyWave 시스템 이벤트 및 히스토리 스키마
-- MoneyWave1(EBIT 기반 PMC 발행), MoneyWave2(미사용 PMC 재분배), MoneyWave3(기업가 생태계)

-- MoneyWave 실행 이력 테이블
CREATE TABLE IF NOT EXISTS money_wave_history (
    wave_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wave_type TEXT NOT NULL CHECK (wave_type IN ('MONEY_WAVE_1', 'MONEY_WAVE_2', 'MONEY_WAVE_3')),
    execution_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'EXECUTING', 'COMPLETED', 'FAILED')),
    
    -- MoneyWave1 관련 데이터
    ebit_amount DECIMAL(18,8),
    pmc_issued DECIMAL(18,8),
    agency_score DECIMAL(5,3),
    information_transparency DECIMAL(5,3),
    prediction_accuracy DECIMAL(5,3),
    social_learning_index DECIMAL(5,3),
    
    -- MoneyWave2 관련 데이터
    dormant_pmc_amount DECIMAL(18,8),
    redistribution_targets JSONB,
    social_welfare_improvement DECIMAL(5,3),
    gini_coefficient_before DECIMAL(5,4),
    gini_coefficient_after DECIMAL(5,4),
    
    -- MoneyWave3 관련 데이터
    entrepreneur_count INTEGER,
    total_investment_pool DECIMAL(18,8),
    innovation_index DECIMAL(5,3),
    venture_success_rate DECIMAL(5,3),
    job_creation_impact INTEGER,
    
    -- 공통 메트릭
    affected_users_count INTEGER NOT NULL DEFAULT 0,
    total_economic_impact DECIMAL(18,8),
    effectiveness_score DECIMAL(5,3),
    
    -- 메타데이터
    trigger_event TEXT,
    execution_parameters JSONB,
    result_summary JSONB,
    error_details TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- MoneyWave1 EBIT 데이터 테이블
CREATE TABLE IF NOT EXISTS money_wave1_ebit_records (
    record_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wave_id UUID NOT NULL REFERENCES money_wave_history(wave_id),
    organization_id UUID,
    organization_name TEXT NOT NULL,
    ebit_amount DECIMAL(18,8) NOT NULL,
    revenue DECIMAL(18,8),
    operating_expenses DECIMAL(18,8),
    verification_status TEXT NOT NULL CHECK (verification_status IN ('PENDING', 'VERIFIED', 'REJECTED')),
    verification_method TEXT,
    pmc_allocation_rate DECIMAL(5,4) NOT NULL,
    pmc_issued DECIMAL(18,8) NOT NULL,
    agency_cost_reduction DECIMAL(5,3),
    transparency_bonus DECIMAL(5,3),
    reporting_period_start DATE NOT NULL,
    reporting_period_end DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- MoneyWave2 재분배 기록 테이블
CREATE TABLE IF NOT EXISTS money_wave2_redistribution_records (
    record_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wave_id UUID NOT NULL REFERENCES money_wave_history(wave_id),
    source_user_id UUID NOT NULL,
    target_user_id UUID NOT NULL,
    pmc_amount DECIMAL(18,8) NOT NULL,
    redistribution_reason TEXT NOT NULL CHECK (
        redistribution_reason IN ('DORMANCY', 'SOCIAL_WELFARE', 'INEQUALITY_REDUCTION', 'PUBLIC_GOOD')
    ),
    social_impact_score DECIMAL(5,3),
    welfare_improvement DECIMAL(5,3),
    rawls_justice_score DECIMAL(5,3),
    pigou_efficiency_gain DECIMAL(5,3),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- MoneyWave3 기업가 생태계 기록 테이블
CREATE TABLE IF NOT EXISTS money_wave3_entrepreneur_records (
    record_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wave_id UUID NOT NULL REFERENCES money_wave_history(wave_id),
    entrepreneur_id UUID NOT NULL,
    venture_proposal_id UUID,
    investment_amount DECIMAL(18,8) NOT NULL,
    innovation_score DECIMAL(5,3) NOT NULL,
    disruption_potential DECIMAL(5,3) NOT NULL,
    execution_capability DECIMAL(5,3) NOT NULL,
    network_effect_potential DECIMAL(5,3) NOT NULL,
    risk_assessment DECIMAL(5,3) NOT NULL,
    expected_roi DECIMAL(5,3),
    milestone_progress DECIMAL(5,3) DEFAULT 0,
    job_creation_potential INTEGER,
    social_impact_potential DECIMAL(5,3),
    schumpeter_innovation_index DECIMAL(5,3),
    kirzner_opportunity_index DECIMAL(5,3),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- MoneyWave 효과성 분석 테이블
CREATE TABLE IF NOT EXISTS money_wave_effectiveness (
    analysis_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wave_id UUID NOT NULL REFERENCES money_wave_history(wave_id),
    
    -- 경제적 영향 지표
    gdp_impact DECIMAL(10,3),
    employment_impact INTEGER,
    productivity_gain DECIMAL(5,3),
    innovation_boost DECIMAL(5,3),
    
    -- 사회적 영향 지표
    inequality_reduction DECIMAL(5,3),
    social_mobility_improvement DECIMAL(5,3),
    public_welfare_enhancement DECIMAL(5,3),
    democratic_participation_increase DECIMAL(5,3),
    
    -- 제도적 영향 지표
    transparency_improvement DECIMAL(5,3),
    agency_cost_reduction DECIMAL(5,3),
    information_asymmetry_reduction DECIMAL(5,3),
    collective_intelligence_gain DECIMAL(5,3),
    
    -- 행동경제학적 영향
    behavioral_bias_correction DECIMAL(5,3),
    decision_quality_improvement DECIMAL(5,3),
    social_learning_acceleration DECIMAL(5,3),
    
    analysis_period_start TIMESTAMPTZ NOT NULL,
    analysis_period_end TIMESTAMPTZ NOT NULL,
    confidence_interval DECIMAL(5,3),
    statistical_significance DECIMAL(5,3),
    methodology TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_money_wave_history_type_date 
    ON money_wave_history(wave_type, execution_date DESC);

CREATE INDEX IF NOT EXISTS idx_money_wave_history_status 
    ON money_wave_history(status);

CREATE INDEX IF NOT EXISTS idx_wave1_ebit_verification 
    ON money_wave1_ebit_records(verification_status, reporting_period_end DESC);

CREATE INDEX IF NOT EXISTS idx_wave2_redistribution_reason 
    ON money_wave2_redistribution_records(redistribution_reason, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_wave3_entrepreneur_score 
    ON money_wave3_entrepreneur_records(innovation_score DESC, disruption_potential DESC);

CREATE INDEX IF NOT EXISTS idx_effectiveness_analysis_period 
    ON money_wave_effectiveness(analysis_period_start, analysis_period_end);

-- 업데이트 트리거
CREATE TRIGGER update_money_wave_history_updated_at 
    BEFORE UPDATE ON money_wave_history 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
ALTER TABLE money_wave_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE money_wave1_ebit_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE money_wave2_redistribution_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE money_wave3_entrepreneur_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE money_wave_effectiveness ENABLE ROW LEVEL SECURITY;

-- 인증된 사용자는 MoneyWave 히스토리 조회 가능
CREATE POLICY "Authenticated users can view money wave history" ON money_wave_history
    FOR SELECT USING (auth.role() = 'authenticated');

-- EBIT 기록은 해당 조직만 조회 가능 (또는 공개 설정 시 모든 사용자)
CREATE POLICY "Organizations can view own EBIT records" ON money_wave1_ebit_records
    FOR SELECT USING (true); -- 공개 정보로 설정

-- 재분배 기록은 관련 사용자만 조회 가능
CREATE POLICY "Users can view own redistribution records" ON money_wave2_redistribution_records
    FOR SELECT USING (auth.uid() = source_user_id OR auth.uid() = target_user_id);

-- 기업가 기록은 해당 기업가만 조회 가능
CREATE POLICY "Entrepreneurs can view own records" ON money_wave3_entrepreneur_records
    FOR SELECT USING (auth.uid() = entrepreneur_id);

-- 효과성 분석은 모든 인증된 사용자가 조회 가능
CREATE POLICY "Authenticated users can view effectiveness analysis" ON money_wave_effectiveness
    FOR SELECT USING (auth.role() = 'authenticated');

-- 코멘트 추가
COMMENT ON TABLE money_wave_history IS 'MoneyWave 1-2-3 시스템 실행 이력 및 성과 추적';
COMMENT ON TABLE money_wave1_ebit_records IS 'MoneyWave1 EBIT 기반 PMC 발행 상세 기록';
COMMENT ON TABLE money_wave2_redistribution_records IS 'MoneyWave2 미사용 PMC 재분배 상세 기록';
COMMENT ON TABLE money_wave3_entrepreneur_records IS 'MoneyWave3 기업가 생태계 투자 상세 기록';
COMMENT ON TABLE money_wave_effectiveness IS 'MoneyWave 시스템 효과성 분석 및 성과 측정';

COMMENT ON COLUMN money_wave_history.wave_type IS 'MoneyWave 유형 (1: EBIT-PMC, 2: 재분배, 3: 기업가)';
COMMENT ON COLUMN money_wave_history.agency_score IS 'Agency Theory 기반 종합 점수';
COMMENT ON COLUMN money_wave2_redistribution_records.rawls_justice_score IS 'Rawls 정의론 기반 분배정의 점수';
COMMENT ON COLUMN money_wave3_entrepreneur_records.schumpeter_innovation_index IS 'Schumpeter 창조적 파괴 혁신 지수';
COMMENT ON COLUMN money_wave3_entrepreneur_records.kirzner_opportunity_index IS 'Kirzner 기업가적 기회 포착 지수';
