-- ==============================================================================
-- Schema: vertical_housing (PosMul 최초 전문직 버티컬 - 주택관리사 수험 및 실무 코파일럿)
-- ==============================================================================

CREATE SCHEMA IF NOT EXISTS vertical_housing;

-- 1. 기출문제 문항 테이블
CREATE TABLE IF NOT EXISTS vertical_housing.exam_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_year INT NOT NULL,                  -- 예: 2024, 2025
    exam_round INT NOT NULL,                 -- 예: 27 (제27회)
    subject TEXT NOT NULL,                   -- 'RELATION_LAW'(관계법규), 'MANAGEMENT_PRACTICE'(관리실무)
    question_number INT NOT NULL,            -- 1 ~ 40
    question_text TEXT NOT NULL,             -- 문제 지문
    box_content TEXT,                        -- 보기 박스 (<보기>, <조건> 등)
    correct_option_number INT NOT NULL,      -- 1 ~ 5
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_exam_question UNIQUE (exam_round, subject, question_number)
);

-- 2. 개별 선지 단위 분해 테이블 (철학 3: 5지선다를 쪼개어 1문장 O/X화)
CREATE TABLE IF NOT EXISTS vertical_housing.exam_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES vertical_housing.exam_questions(id) ON DELETE CASCADE,
    option_number INT NOT NULL,              -- 1 ~ 5
    option_text TEXT NOT NULL,               -- 선지 본문
    is_correct BOOLEAN NOT NULL,             -- 해당 선지의 참/거짓 또는 정답 부합 여부
    mastery_tier INT NOT NULL DEFAULT 1,     -- 1~5단계 회독 등급 (1: 20% 기초뼈대, 2: 40% 빈출기한, 3: 60% 예외단서, 4: 80% 판례유권해석, 5: 100% 지엽함정)
    trap_summary TEXT,                       -- 3초 컷 1줄 함정 교정 해설 (예: "30일이 아닌 15일 이내 신고")
    legal_citation TEXT,                     -- 근거 법령 조항 (예: "공동주택관리법 제15조 제2항")
    legal_link TEXT,                         -- 법령센터 원문 하이퍼링크
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_mastery_tier CHECK (mastery_tier BETWEEN 1 AND 5),
    CONSTRAINT chk_option_number CHECK (option_number BETWEEN 1 AND 5),
    CONSTRAINT uq_question_option UNIQUE (question_id, option_number)
);

-- 3. POD 종이책 정품 시리얼 테이블 (O2O 교재 구매 인증 및 현금 EAT 연동)
CREATE TABLE IF NOT EXISTS vertical_housing.book_serials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    serial_code TEXT NOT NULL UNIQUE,        -- 교재 내 인쇄된 고유 시리얼 난수
    book_title TEXT NOT NULL,                -- 예: "2026 주택관리사 2차 5개년 회독 기출문제집"
    book_code TEXT NOT NULL,                 -- 예: "HP-2026-R2"
    registered_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    registered_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'ACTIVE',   -- 'ACTIVE', 'REVOKED'
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. 유저별 선지 숙련도 테이블 (철학 4: 기본값은 O, ★/X 선지만 관리)
CREATE TABLE IF NOT EXISTS vertical_housing.option_mastery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    option_id UUID NOT NULL REFERENCES vertical_housing.exam_options(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'O',        -- 'O'(체크없음/알음), 'STAR'(긴가민가), 'X'(틀림/모름)
    streak_count INT NOT NULL DEFAULT 0,     -- 망각곡선 복습 연속 정답 횟수 (3회 달성 시 O 승격)
    next_review_at TIMESTAMPTZ,              -- 망각곡선 복습 예정일 (24h -> 72h -> 7d)
    last_scanned_at TIMESTAMPTZ,             -- 종이책 AI 스캔으로 검출된 최근 일시
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_mastery_status CHECK (status IN ('O', 'STAR', 'X')),
    CONSTRAINT uq_user_option_mastery UNIQUE (user_id, option_id)
);

-- 5. 종이책 AI 비전 스캔 로그 (어뷰징 차단 & 즉각 마찰 보상 PMP 기록)
CREATE TABLE IF NOT EXISTS vertical_housing.ai_scan_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    serial_id UUID REFERENCES vertical_housing.book_serials(id),
    book_code TEXT NOT NULL,
    page_number INT NOT NULL,
    detected_markings JSONB NOT NULL DEFAULT '[]'::jsonb, -- 검출된 [ { "question_number": 1, "option_number": 3, "mark": "STAR" } ]
    confidence_score NUMERIC(5, 2) NOT NULL DEFAULT 100.0,
    reward_pmp INT NOT NULL DEFAULT 0,                    -- 즉각 지급된 마찰 돌파 PMP (30~50)
    scanned_date DATE NOT NULL DEFAULT CURRENT_DATE,      -- 1일 1회 동일 페이지 중복 방어
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_user_daily_page_scan UNIQUE (user_id, book_code, page_number, scanned_date)
);

-- 6. 과태료 방어 법정 의무 스케줄러 룰 (합격 후 현직 소장 라이프사이클 락인)
CREATE TABLE IF NOT EXISTS vertical_housing.legal_obligations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,                  -- 'SAFETY'(안전), 'ELECTION'(선거/입대의), 'FINANCE'(회계), 'REPAIR'(장기수선)
    obligation_title TEXT NOT NULL,          -- 예: "승강기 정기 안전점검 실시 및 결과 공고"
    cycle_rule TEXT NOT NULL,                -- 'MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'ANNUAL', 'EVENT_TRIGGERED'
    deadline_description TEXT NOT NULL,      -- 예: "매월 1회 이내 실시 및 10일 이내 보고"
    legal_citation TEXT NOT NULL,            -- 근거 법조문
    fine_max_amount INT NOT NULL DEFAULT 0,  -- 최대 과태료 액수 (예: 5000000 = 500만원)
    required_evidence_type TEXT,             -- 필수 증빙 (사진, 점검표, 공문 등)
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. 집중 타이머 & 스터디콘 인벤토리 (유효 집중 시간 검증 & 소액 현금 EAT)
CREATE TABLE IF NOT EXISTS vertical_housing.study_cones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    cone_type TEXT NOT NULL,                 -- 'FIRE_OWL'(열공부엉이), 'BLUE_DRAGON'(청룡소장) 등
    level INT NOT NULL DEFAULT 1,            -- 1 ~ 5단계 진화
    total_focus_minutes INT NOT NULL DEFAULT 0, -- 스캔/복습으로 검증된 유효 집중 시간
    purchased_price_krw INT NOT NULL DEFAULT 0, -- 스터디콘 유료 결제 시 현금 EAT 재원 기록
    is_equipped BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_exam_options_question ON vertical_housing.exam_options(question_id);
CREATE INDEX IF NOT EXISTS idx_exam_options_tier ON vertical_housing.exam_options(mastery_tier);
CREATE INDEX IF NOT EXISTS idx_option_mastery_user ON vertical_housing.option_mastery(user_id, status);
CREATE INDEX IF NOT EXISTS idx_option_mastery_review ON vertical_housing.option_mastery(user_id, next_review_at);
CREATE INDEX IF NOT EXISTS idx_ai_scan_logs_user_date ON vertical_housing.ai_scan_logs(user_id, scanned_date);

-- RLS (Row Level Security) 설정
ALTER TABLE vertical_housing.exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vertical_housing.exam_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE vertical_housing.book_serials ENABLE ROW LEVEL SECURITY;
ALTER TABLE vertical_housing.option_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE vertical_housing.ai_scan_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE vertical_housing.legal_obligations ENABLE ROW LEVEL SECURITY;
ALTER TABLE vertical_housing.study_cones ENABLE ROW LEVEL SECURITY;

-- 문제 및 선지, 법정 의무: 누구나 조회 가능
CREATE POLICY exam_questions_read ON vertical_housing.exam_questions FOR SELECT USING (true);
CREATE POLICY exam_options_read ON vertical_housing.exam_options FOR SELECT USING (true);
CREATE POLICY legal_obligations_read ON vertical_housing.legal_obligations FOR SELECT USING (true);

-- 유저 개인 데이터: 본인만 접근
CREATE POLICY option_mastery_user_all ON vertical_housing.option_mastery
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY ai_scan_logs_user_all ON vertical_housing.ai_scan_logs
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY study_cones_user_all ON vertical_housing.study_cones
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY book_serials_user_read ON vertical_housing.book_serials
    FOR SELECT USING (registered_user_id IS NULL OR auth.uid() = registered_user_id);

