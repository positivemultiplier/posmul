-- PosMul XpressEngine 스타일 2단 계층 기능 제어판 (전역 마스터 + 도메인별 세부 ON/OFF)
CREATE TABLE IF NOT EXISTS economy.site_feature_flags (
  flag_key TEXT PRIMARY KEY,
  domain TEXT NOT NULL CHECK (
    domain IN ('system', 'prediction', 'forum', 'donation', 'consume', 'economy', 'ranking', 'users', 'healing_room')
  ),
  parent_key TEXT NULL REFERENCES economy.site_feature_flags(flag_key) ON DELETE SET NULL,
  group_name TEXT NOT NULL CHECK (
    group_name IN ('module', 'addon', 'automation', 'gate', 'constitution')
  ),
  label TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  enabled BOOLEAN NOT NULL DEFAULT true,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  badge TEXT NULL,
  config_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 100,
  updated_by UUID NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_site_feature_flags_domain_sort
  ON economy.site_feature_flags (domain, sort_order);

CREATE TABLE IF NOT EXISTS economy.feature_flag_audit_logs (
  log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_key TEXT NOT NULL,
  domain TEXT NOT NULL,
  prev_enabled BOOLEAN NOT NULL,
  next_enabled BOOLEAN NOT NULL,
  prev_config JSONB NULL,
  next_config JSONB NULL,
  changed_by UUID NOT NULL,
  changed_by_email TEXT NULL,
  reason TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feature_flag_audit_logs_created_at
  ON economy.feature_flag_audit_logs (created_at DESC);

-- P0 보안: RLS 활성화 및 service_role 전용 격리 (일반 클라이언트 직접 접근 차단)
ALTER TABLE economy.site_feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE economy.feature_flag_audit_logs ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE economy.site_feature_flags FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE economy.feature_flag_audit_logs FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE economy.site_feature_flags TO service_role;
GRANT ALL ON TABLE economy.feature_flag_audit_logs TO service_role;

-- 초기 시드: 1) 도메인 마스터 스위치 (부모)
INSERT INTO economy.site_feature_flags
  (flag_key, domain, parent_key, group_name, label, description, enabled, is_locked, badge, config_json, sort_order)
VALUES
  ('domain.prediction', 'prediction', NULL, 'module', '예측 마켓 (Prediction) 전체', '예측 피드·상세·참여·정산 도메인 마스터 스위치', true, false, 'Phase 1', '{}'::jsonb, 10),
  ('domain.forum', 'forum', NULL, 'module', '광장 커뮤니티 (Forum) 전체', '이슈 갤러리·공공 뉴스·아고라·지역 행사 도메인 마스터', true, false, 'Phase 1', '{}'::jsonb, 20),
  ('domain.donation', 'donation', NULL, 'module', '기부 결실 (Donation) 전체', '기관기부·K-물품기부 도메인 마스터 스위치', true, false, 'Phase 1', '{}'::jsonb, 30),
  ('domain.consume', 'consume', NULL, 'module', '소비·광고 (Consume) 전체', '광고 시청 및 소비 도메인 마스터 스위치', true, false, 'Phase 1', '{}'::jsonb, 40),
  ('domain.economy', 'economy', NULL, 'module', '경제·MoneyWave 엔진 전체', 'PMP/PMC 원장 및 MoneyWave 분배 도메인 마스터', true, false, 'Core', '{}'::jsonb, 50),
  ('domain.ranking', 'ranking', NULL, 'module', '랭킹·명예의 전당 전체', '예측·기부·광장 풀뿌리 명예의 전당 도메인 마스터', true, false, 'Phase 1', '{}'::jsonb, 60),
  ('domain.users', 'users', NULL, 'module', '회원·인증 시스템 전체', '가입·로그인·프로필 관리 도메인 마스터', true, false, 'Core', '{}'::jsonb, 70),
  ('domain.healing_room', 'healing_room', NULL, 'module', '힐링룸 (Healing Room) 전체', '나눔 영수증·BGM 힐링 공간 마스터 스위치', true, false, 'Phase 1', '{}'::jsonb, 80)
ON CONFLICT (flag_key) DO NOTHING;

-- 초기 시드: 2) Prediction 세부 ON/OFF
INSERT INTO economy.site_feature_flags
  (flag_key, domain, parent_key, group_name, label, description, enabled, is_locked, badge, config_json, sort_order)
VALUES
  ('prediction.action.allow_betting', 'prediction', 'domain.prediction', 'gate', '신규 예측 참여 허용 (킬스위치)', '긴급 점검 시 OFF하면 신규 PMP 참여만 즉시 일시정지', true, false, '비상', '{}'::jsonb, 110),
  ('prediction.action.allow_withdraw', 'prediction', 'domain.prediction', 'gate', '예측 참여 철회(환불) 허용', '마감 전 참여 철회 및 PMP 환불 기능 ON/OFF', true, false, '유저 액션', '{}'::jsonb, 115),
  ('prediction.action.user_proposed', 'prediction', 'domain.prediction', 'module', '유저 직접 예측 제안 허용', '시민이 신규 예측 주제를 제안하는 경로 ON/OFF', true, false, '커뮤니티', '{}'::jsonb, 120),
  ('prediction.addon.naver_news', 'prediction', 'domain.prediction', 'addon', '네이버 관련 최신 뉴스 섹션', '상세페이지 하단 네이버 뉴스 Open API(30분 캐시) 표시', true, false, 'SSR 캐시', '{}'::jsonb, 130),
  ('prediction.addon.sports_badge', 'prediction', 'domain.prediction', 'addon', '스포츠 팀 컬러 SVG 방패 배지', '저작권 안전 구단 고유 2색 방패 엠블럼 표시', true, false, 'UI 애드온', '{}'::jsonb, 135),
  ('prediction.addon.ai_briefing', 'prediction', 'domain.prediction', 'addon', 'AI 균형 의사결정 브리핑', '상세페이지 양측 찬반 근거 비교 브리핑 섹션 표시', true, false, 'AI', '{}'::jsonb, 140),
  ('prediction.addon.ai_forecasts', 'prediction', 'domain.prediction', 'addon', 'AI 모델별 독립 예측 현황', 'Gemini·EXAONE·OpenRouter 독립 예측 비교 섹션 표시', true, false, 'AI', '{}'::jsonb, 145),
  ('prediction.addon.hourglass', 'prediction', 'domain.prediction', 'addon', 'MoneyWave 황금 모래시계 위젯', '상세·사이드바 정각 카운트다운 황금 모래시계 표시', true, false, 'UI 애드온', '{}'::jsonb, 150),
  ('prediction.addon.live_banner', 'prediction', 'domain.prediction', 'addon', 'LIVE 응원톡 상단 배너', '상세페이지 상단 실시간 LIVE 응원방 연결 배너 표시', true, false, '커뮤니티', '{}'::jsonb, 155),
  ('prediction.cat.economy', 'prediction', 'domain.prediction', 'module', '경제·증시 카테고리 노출', '메인 예측 피드에서 ECONOMY 카테고리 노출', true, false, '카테고리', '{}'::jsonb, 160),
  ('prediction.cat.sports', 'prediction', 'domain.prediction', 'module', '스포츠 카테고리 노출', '메인 예측 피드에서 SPORTS 카테고리 노출', true, false, '카테고리', '{}'::jsonb, 165),
  ('prediction.cat.entertainment', 'prediction', 'domain.prediction', 'module', '엔터·문화 카테고리 노출', '메인 예측 피드에서 ENTERTAINMENT 카테고리 노출', true, false, '카테고리', '{}'::jsonb, 170),
  ('prediction.cat.politics', 'prediction', 'domain.prediction', 'module', '정치·정책 카테고리 노출', '메인 예측 피드에서 POLITICS 카테고리 노출', true, false, '카테고리', '{}'::jsonb, 175),
  ('prediction.auto.rss_draft', 'prediction', 'domain.prediction', 'automation', 'RSS → AI 초안 자동 생성', '뉴스/의안 피드 자동 수집 및 AI 초안 생성 크론 ON/OFF', true, false, 'Cron', '{}'::jsonb, 180),
  ('prediction.auto.oracle_settle', 'prediction', 'domain.prediction', 'automation', '공인 오라클 자동 정산', 'KRX·ECOS·KOSIS·KOBIS·축구 자동 판정 실행 ON/OFF', true, false, 'Auto', '{}'::jsonb, 185),
  ('prediction.auto.llm_realtime', 'prediction', 'domain.prediction', 'automation', '실시간 LLM 브리핑 생성 (비용 방어)', 'API 비용 급증 시 OFF하면 DB 캐시된 브리핑만 서빙', true, false, '비용 방어', '{}'::jsonb, 190),
  ('prediction.exp.blind_first', 'prediction', 'domain.prediction', 'addon', 'Blind-First 맹목 예측 모드', '참여 전 시장 확률 블러 처리 (Metaculus형 실험)', false, false, '실험', '{}'::jsonb, 195),
  ('prediction.exp.base_rate', 'prediction', 'domain.prediction', 'addon', '브리핑 과거 기준율(Base Rate)', 'GJ Open식 객관적 통계 1줄 카드 (실험)', false, false, '실험', '{}'::jsonb, 198)
ON CONFLICT (flag_key) DO NOTHING;

-- 초기 시드: 3) Forum / Donation / Consume / Economy / Ranking / Users / Healing / System 세부 ON/OFF
INSERT INTO economy.site_feature_flags
  (flag_key, domain, parent_key, group_name, label, description, enabled, is_locked, badge, config_json, sort_order)
VALUES
  ('forum.action.allow_post', 'forum', 'domain.forum', 'gate', '포럼 신규 글 작성 허용', '스팸/도배 대응 시 글쓰기만 즉시 일시정지', true, false, '비상', '{}'::jsonb, 210),
  ('forum.action.allow_comment', 'forum', 'domain.forum', 'gate', '포럼 댓글 작성 허용', '댓글 작성 기능 ON/OFF 제어', true, false, '유저 액션', '{}'::jsonb, 215),
  ('forum.addon.local_events_tab', 'forum', 'domain.forum', 'addon', '전남광주 문화행사 카드 탭', '김대중컨벤션센터·서구문화센터 로컬 O2O 카드 탭', false, false, 'O2O 준비', '{}'::jsonb, 220),
  ('forum.guard.ip_ban', 'forum', 'domain.forum', 'automation', '포럼 IP 도배·봇 자동 방어', '차단 IP 및 금지어 필터 작동 ON/OFF', true, false, '보안', '{"dailyMaxPmp":1000}'::jsonb, 225),

  ('donation.track.institution', 'donation', 'domain.donation', 'module', '기관기부 트랙', 'Phase 1 검증된 공익 기관 PMC 기부', true, false, 'Phase 1', '{}'::jsonb, 310),
  ('donation.track.k_goods', 'donation', 'domain.donation', 'module', 'K-물품기부 트랙', 'Phase 1 국내 제조 실물 물품 선택 기부', true, false, 'Phase 1', '{}'::jsonb, 315),
  ('donation.track.opinion_leader', 'donation', 'domain.donation', 'module', '오피니언 리더 팔로잉 기부', 'Phase 2 검증 리더 위임 기부 (잠금 유지)', false, false, 'Phase 2', '{}'::jsonb, 320),
  ('donation.track.future_dream', 'donation', 'domain.donation', 'module', '미래꿈기부 (콩도르세·보르다)', 'Phase 2 정답 없는 가치 배분 투표 (잠금 유지)', false, false, 'Phase 2', '{}'::jsonb, 325),
  ('donation.action.allow_donate', 'donation', 'domain.donation', 'gate', 'PMC 기부 실행 허용 (킬스위치)', '기부 원장 점검 시 즉시 차단', true, false, '비상', '{}'::jsonb, 330),

  ('consume.track.network_ads', 'consume', 'domain.consume', 'module', '트랙 A: 네트워크 광고 (PMP)', '광고 시청 체류 검증 및 PMP 지급', true, false, 'Phase 1', '{}'::jsonb, 410),
  ('consume.track.brand_ifrs', 'consume', 'domain.consume', 'module', '트랙 B: 기업 직접 광고 (IFRS S1)', 'Phase 2 기업 Social 정량 리포트 캠페인', false, false, 'Phase 2', '{}'::jsonb, 415),
  ('consume.track.local_league', 'consume', 'domain.consume', 'module', '소상공인 Local League · 펀딩', 'Phase 3 오프라인 가맹점 연동 (잠금 유지)', false, false, 'Phase 3', '{}'::jsonb, 420),

  ('economy.wave.moneywave1', 'economy', 'domain.economy', 'automation', 'MoneyWave 1 정각 상금풀 분배', '세후 순이익(EAT) 기반 정각 예측 상금풀 산출', true, false, 'Core', '{}'::jsonb, 510),
  ('economy.wave.moneywave2', 'economy', 'domain.economy', 'automation', 'MoneyWave 2 휴면 PMC 환류', '장기 미사용 PMC 사회 환류 웨이브', false, false, '준비중', '{}'::jsonb, 515),
  ('economy.vertical.housing_pro', 'economy', 'domain.economy', 'module', 'Housing-Pro 버티컬 PMP 연동', '코어 SDK 일일 300 PMP 상한 내 학습 보상 연동', true, false, 'Vertical', '{"dailyCap":300}'::jsonb, 520),
  ('economy.const.no_direct_pmc', 'economy', 'domain.economy', 'constitution', '활동 시 PMC 직접 지급 원천 차단', 'v3.0 경제 헌법 불변식: PMC는 오직 예측 성공으로만 발행', true, true, '헌법 고정', '{}'::jsonb, 590),
  ('economy.const.eat_cap', 'economy', 'domain.economy', 'constitution', '세후 순이익(EAT) 상한 준수', 'v3.0 경제 헌법 불변식: 적자 방지 EAT 총량 제어', true, true, '헌법 고정', '{}'::jsonb, 595),

  ('ranking.tab.region_grassroots', 'ranking', 'domain.ranking', 'module', '동네(시/구/동) 풀뿌리 랭킹', '지역 단위 예측·기부 명예의 전당 탭', true, false, 'Phase 1', '{}'::jsonb, 610),
  ('ranking.tab.job_group', 'ranking', 'domain.ranking', 'module', '직업군별 명예의 전당', '직업군 단위 예측·기부 평판 랭킹 탭', true, false, 'Phase 1', '{}'::jsonb, 615),

  ('users.action.allow_signup', 'users', 'domain.users', 'gate', '신규 회원가입 허용', '비상 시 신규 가입 접수 일시 중지', true, false, '접근제어', '{}'::jsonb, 710),
  ('users.auth.sso_subdomain', 'users', 'domain.users', 'module', '서브도메인 SSO 쿠키 공유', 'posmul.com ↔ pro.posmul.com 통합 로그인 세션 유지', true, false, 'SSO', '{}'::jsonb, 715),

  ('healing_room.addon.bgm_autoplay', 'healing_room', 'domain.healing_room', 'addon', '힐링룸 BGM 플레이어', '힐링룸 배경 음악 재생 기능 ON/OFF', true, false, 'BGM', '{}'::jsonb, 810),

  ('system.private_gate', 'system', NULL, 'gate', '/gate 시크릿 비밀번호 잠금', '비공개 테스트 모드 ON/OFF (OFF 시 전체 공개 전환)', true, false, '접근제어', '{}'::jsonb, 910),
  ('system.maintenance_banner', 'system', NULL, 'gate', '전역 상단 공지·점검 띠배너', '사이트 최상단에 긴급 공지 메시지 노출', false, false, '공지', '{"message":"현재 시스템 점검 및 업데이트가 진행 중입니다."}'::jsonb, 920)
ON CONFLICT (flag_key) DO NOTHING;
