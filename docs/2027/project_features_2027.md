# PosMul 주요 기능 요구사항 및 서비스 명세 (2027 Edition)

> **기준일**: 2026-11-17  
> **원본 비교**: [init/project_features.md](file:///c:/G/posmul/docs/archive/2026-11-pre-v3/init/project_features.md) (2025-11-28)  
> **실코드 기준**: `apps/posmul-web/src/app/*`, `apps/housing-pro/src/app/*`, [ThreeRowNavbar.tsx](file:///c:/G/posmul/apps/posmul-web/src/shared/ui/components/layout/ThreeRowNavbar.tsx)

---

## 1. 2025 초기 기능 명세 vs 2026 실구현 vs 2027 완성 스펙 비교

| 도메인 | 2025 `init/project_features.md` | 2026 현재 실구현 (`posmul`) | 2027년 버전 확장 계획 |
| :--- | :--- | :--- | :--- |
| **1. Consume** | `MoneyConsume`(PMC) / `TimeConsume`(PMP) / `CloudConsume`(PMC) | `Major League`(광고 `PMP`) 활성, **`Minor League` & `Cloud Funding`은 Phase 3 잠금(`403 PHASE_3_LOCKED`)** | **트랙 B 기업 직접 광고 + `Social(IFRS S1)` 리포트 발급** 본격화, Phase 3 로컬 가맹점 조건부 오픈 |
| **2. Prediction (구 Expect)** | `Invest`/`스포츠`/`엔터`/`정치`/`제안` | **6대 마켓 + 3단 네비 100% 통일**(`economy`, `consume`, `sports`, `entertainment`, `politics`, `user-suggestions`) + **`Live` 실시간 응원톡** + **`Challenge` P2P 맞짱** | 전 카테고리 AI 자동 수집·정산 고도화, 외부 공인 API(`DART`/`KOSIS`/`KOBIS`) 정산 근거 자동 첨부 |
| **3. Donation** | 직접/기관/오피니언 리더 (1,000원당 10P 모호한 보상 표기) | **`K-물품 직접기부` & `K-위시리스트`** + **`기관기부` 3단계 마일스톤** (`pmc_balance` 실제 차감 완료), `팔로잉` Phase 2 잠금 | **Phase 2: `팔로잉 기부` + `미래꿈기부`(콩도르세·보르다 투표)** 오픈, 복지시설 증빙 Storage & 감사 타임라인 |
| **4. Forum** | 뉴스/토론/브레인스토밍/예산 (Colony/Nation/Region) | **AI 언론사 뉴스룸**(`/forum/news`: 광주 5개구·AI·경제·스포츠 + 트랙 B 공공 RSS + 퀴즈 보상), `Budget`, `Agora`, `1,000 PMP` Cap & 추천/개념글 보상 | **아고라 → 예측 마켓 자동 승격 브릿지** 완성, AI 저널리즘·예산 시뮬레이션 확대 |
| **5. Other** | `5.2 Gift Aid ()`, `5.3 PosMul Business ()` 빈칸 상태 | **`Gift Aid`(세액공제 시뮬레이터)**, **`Accounting & Tax`(원장 명세서)**, `Support`, `Settings` 페이지 구축 완료 | B2B 기업용 **PosMul Business(`Social(IFRS S1)` 대시보드)** 정식 오픈 및 실제 PDF/국세청 연동 |
| **6. Ranking** | Cosmos/Colony/Nation/Region/Local | 전국·시도·시군구·읍면동 지역 필터 × 5대 카테고리(`expect`, `overall`, `forum`, `consume`, `donation`) | 2027 시즌제 명예의 전당 및 랭킹-힐링룸 트로피 자동 연동 |
| **7. Vertical & Worldview (신규)** | 없음 | **`Housing-Pro`**(69단원 수험 O2O + AI 스캔 + 소장 Pro) + **`Healing Room`** + **`PosMul Friends 7인`** + **`Gate`** | **다중 전문직 버티컬 확장**, 힐링룸 창작 커뮤니티 교류, 스터디콘 B2B/B2C 고도화 |

---

## 2. 전역 네비게이션 구조 (`ThreeRowNavbar`)

2025년 설계된 5-Depth 원칙(1단 도메인 → 2단 카테고리 → 3단 서브카테고리 → 4단 필터/리스트 → 5단 개별 상세)이 [ThreeRowNavbar.tsx](file:///c:/G/posmul/apps/posmul-web/src/shared/ui/components/layout/ThreeRowNavbar.tsx)에 완성되어 있습니다.

- **1단 (Core Domains)**: `포럼(/forum)` · `소비(/consume)` · `예측(/prediction)` · `기부(/donation)` · `랭킹(/ranking)` · `기타(/other)`
- **연결 서비스 허브**: `/live`(실시간 응원톡) · `/challenge`(P2P 맞짱) · `/healing-room`(힐링룸) · `/characters`(포스멀 프렌즈 도감) · `/economy` & `/wallet`(경제·지갑) · `/admin`(관리자) · `housing-pro`(별도 버티컬 앱, SSO 연동)

---

## 3. 도메인별 2027 상세 기능 명세

### 3.1 Forum (공론장 & 트래픽 엔진 — `/forum`)
> **통화 규칙**: 오직 `PMP`만 지급 (`FORUM_DAILY_MAX_PMP = 1000`, 자추·중복 차단)

1. **📰 AI 언론사 뉴스룸 (`/forum/news`)**
   - **카테고리**: 전체 뉴스, 전남·광주(광주 5개구 실험실), AI·테크, 경제·정책, 스포츠.
   - **트랙 B 공공기관 1차 보도자료 수집 (`feed`)**: 공식 RSS 및 1차 보도자료를 직접 수집·정리하여 팩트 기반 기사 제공.
   - **뉴스 이해도 퀴즈**: 기사를 읽고 퀴즈를 풀면 즉각 `PMP` 적립.
2. **💰 Budget (`/forum/budget`)**
   - 국가 예산, 지역(지자체) 예산, 재정 이슈를 시민 눈높이로 분해·감시하는 공론장.
3. **💬 Agora (`/forum/agora`)**
   - 브레인스토밍(`50 PMP`), 정책 토론(`30 PMP`), 질문(`20 PMP`), 댓글(`10 PMP`), 추천 수령(`+20 PMP`), 개념글 승격(추천 3+ 달성 시 `+100 PMP`).
   - **2027 핵심 브릿지**: 아고라 시민 제안 중 추천 임계치를 넘긴 안건을 `/prediction/user-suggestions` 예측 마켓으로 자동 승격(`forum_prediction_links`).

---

### 3.2 Consume (광고 2트랙 & 가치 소비 — `/consume`)
> **통화 규칙**: Phase 1~2에서는 **오직 `PMP`만 지급**, `Minor`/`Cloud`는 Phase 3 오픈

1. **🎬 Major League (`/consume/major-league`) — 가동 중**
   - **트랙 A (일반 네트워크 광고)**: `CPC/CPV/CPA` 기반 광고 시청·설문 참여 → `+35~100 PMP` 지급 및 중앙 `EAT` 현금 재원 공급.
   - **트랙 B (기업 직접 광고 의뢰 — 2027 주력)**: ESG 캠페인 광고 의뢰 기업에게 시민 참여 데이터 및 연결된 기부 임팩트를 결합한 **`Social(IFRS S1)` 측정 리포트** 제공.
2. **🏪 Minor League (`/consume/minor-league`) — Phase 3 예정**
   - 지역 소상공인 가맹점 지도, QR 상생 결제 및 지역 순환경제 연계 (현재 Phase 3 잠금 가드 적용).
3. **💡 Cloud Funding (`/consume/cloud-funding`) — Phase 3 예정**
   - 친환경·사회적 기업·청년 스타트업 크라우드 펀딩 연계 (현재 Phase 3 잠금 가드 적용).

---

### 3.3 Prediction · Live · Challenge (플랫폼 심장 — 1단계 훈련)
> **통화 규칙**: `PMP` 투입(실패 시 소멸) → **예측 적중 시에만 유일하게 `PMC` 획득** (무경쟁 가드 적용)

1. **🔮 Prediction Market (`/prediction`)**
   - **6대 중분류 × 세부 소분류**:
     - `경제(/prediction/economy)`: 주식, 기업 실적(`DART`/`SEC`), 경제 지표(`KOSIS`/`FRED`), 암호화폐(`CoinGecko`)
     - `소비예측(/prediction/consume)`: TimeConsume, MoneyConsume, CloudConsume
     - `스포츠(/prediction/sports)`: 축구, 야구, 농구, e스포츠
     - `엔터테인먼트(/prediction/entertainment)`: 영화(`KOBIS`), 드라마, 예능·방송, 음악, 시상식
     - `정치/선거(/prediction/politics)`: 국가 선거, 지역 선거, 정책 변화(`중앙선관위`/`국회`)
     - `시민 제안(/prediction/user-suggestions)`: 시민 제안, AI 추천, 오피니언 리더
   - **양쪽 균형 브리핑**: 한쪽 편향 없이 찬반 근거와 데이터를 함께 제공해 합리적 의사결정 훈련.
   - **AI 파이프라인 (`/api/cron/feed-ingest`, `prediction-pipeline`, `prediction-settle`)**: 전 카테고리 시딩 자동화 및 공인 API 근거 기반 정산.
2. **📺 Live 실시간 응원톡 & 매치룸 (`/live`)**
   - 야구 결승, 축구 빅매치, 미국 증시 개장 등 실시간 이벤트 순간에 모여 응원 채팅과 함께 즉시 예측에 참여하는 라이브 룸.
3. **🥊 Challenge P2P 맞짱 내기 (`/challenge`)**
   - 30초 만에 단독 또는 공식 경기 꼬리 내기(`linked_game_id`)를 개설해 단톡방·SNS에 공유하는 1:1/다자 P2P 대결장.
   - `PMP` 에스크로 차감(`deduct_challenge_pmp`), 제안 정산(`propose_challenge_settlement`), 합의 확정(`finalize_challenge_settlement`), 이의제기 전액 환불(`dispute_challenge_settlement`), 오픈 내기 3% 호스트 수수료 등 공정 합의 RPC 완비.

---

### 3.4 Donation (가치 배분 — 2단계 훈련, `/donation`)
> **통화 규칙**: 오직 **`PMC`로만 사용 가능** (`pmc_balance` 차감 + 원장 기록)

1. **📦 K-물품 직접기부 & K-위시리스트 (`/donation/direct`, `/donation/direct/wishlist`) — Phase 1 가동**
   - LG·삼성 고효율 가전, 부산 수제 운동화, 한국산 식품 등 국내 제조사 실물 제품을 복지시설에 직배송(영국식 Tied Aid 수출 승수 효과).
   - 수혜기관 직접 선택, 현장 사진·인가증 인라인 스토리 검증, 1,000 PMC부터 소액 크라우드펀딩 참여, 관리자 승인 게이트.
   - **2027 고도화**: 복지시설 증빙 파일 `Supabase Storage` 업로드 및 물품 설치 완료 사진·감사 편지 기부자 타임라인 연동.
2. **🏛️ 마일스톤 검증 NGO 기관기부 (`/donation/institute`) — Phase 1 가동**
   - 3단계(30% → 40% → 30%) 스마트 에스크로 분할 집행 및 영수증 시민 검증 투표.
3. **🌟 오피니언 리더 팔로잉 기부 (`/donation/opinion-leader`) — Phase 2 (2027 오픈)**
   - 일일이 고르기 어려운 유저가 신뢰하는 매니저/리더에게 기부 배분을 위임하고 언제든 철회할 수 있는 **유동적 민주주의(Liquid Democracy) 위임형 기부**.
4. **🌱 미래꿈기부 (콩도르세 · 보르다 투표) — Phase 2 (2027 오픈)**
   - 정답이 없는 다수의 꿈 프로젝트에 한정된 공익 재원을 배분할 때 `analyzeSocialChoiceAggregation` 기반 **콩도르세·보르다 사회선택 투표제**를 적용하는 가치 판단 훈련장.

---

### 3.5 Ranking & Other (명예와 투명 회계)
1. **🏆 Ranking (`/ranking`)**
   - 예측 명사수(`expect`), 종합 시민(`overall`), 공론 기여(`forum`), 상생 소비(`consume`), 나눔 리더(`donation`) 5축 × 전국·시도(서울/경기/부산 등)·시군구·읍면동 랭킹.
2. **🧾 Other (`/other`) — 2025 빈칸 섹션 100% 완성**
   - **Gift Aid (`/other/gift-aid`)**: 기부 내역 조회, 기부금 영수증 발급, 연말정산 세액공제 시뮬레이터.
   - **Accounting & Tax (`/other/tax`)**: `PMP`/`PMC` 전체 거래 원장 조회, 도메인별 명세서, 세무 신고용 PDF/Excel 내보내기.
   - **PosMul Business (2027 B2B 확장)**: 기업 직접 광고주 전용 **`Social(IFRS S1)` 임팩트 리포트 포털** 및 ESG 파트너 대시보드.
   - **Support & Settings**: 고객지원(FAQ/1:1 문의) 및 프로필·알림·보안 설정.

---

### 3.6 Vertical Apps (`apps/housing-pro` · `posmul-pro`)
> **통화 규칙**: `@posmul/auth-economy-sdk` 통합 SSO 로그인, 일일 총 획득 상한 `300 PMP` 엄격 통제

1. **수험생 O2O 올인원 학습 (`/`, `/study/*`, `/scan`)**:
   - 공인 5과목 69개 세부 단원 목차 & 1,400+ 기출문항 DB (`vertical_housing.*`).
   - **스와이프 O/X 망각곡선 복습 (`/study/ox`)**: $\bigstar/\text{X}$ 오답 선지만 골라 3회 연속 정답 시 `O` 승격 및 `+10 PMP`.
   - **20제 문제·지문 체크 시트 (`/study/solve`)**: 조합 선지 정답 역산, 주관식 다중 빈칸 채점, `+5 PMP`.
   - **종이책 AI 비전 스캔 (`/scan`)**: 교재 시리얼 인증(`book_serials`) 및 페이지 마킹 존 AI 스캔 시 즉각 마찰 돌파 보상(`+40 PMP`, 1일 최대 5회).
   - **집중 타이머 & 스터디콘**: 유효 집중 시간 검증(`+10 PMP`) 및 캐릭터 스터디콘 진화.
2. **현직 소장 Pro View (`/pro/*`)**:
   - 합격 후 현직 아파트 관리소장 라이프사이클 락인: 과태료 방어 법정 의무 D-Day 스케줄러(`/pro/legal`), AI 법령 브리핑(`/pro/docs`), 소장 커뮤니티(`/pro/community`), 연계 예측 위젯(`/pro/predict`).

---

### 3.7 Worldview, Retention & Security (`/characters`, `/healing-room`, `/gate`)
1. **포스멀 프렌즈 7인 (`/characters`)**: 웨이비·올리·온기·모아·아고·범이·루미 멀티뷰 도감 및 도메인별 동행 가이드.
2. **힐링룸 창작 아틀리에 (`/healing-room`)**: 아이소메트릭 미니룸(기부 트로피 전시, 미니미 배치) + 비상업 AI 창작물(음악 앨범 주크박스·그림 전시회·소설 출판) 공간.
3. **비공개 프리뷰 게이트 (`/gate`)**: `모두의창업 3기` 등 초기 클로즈드/오픈 베타 접근 제어 게이트.

---

### 3.8 MyPage / Wallet / Admin (`/dashboard`, `/wallet`, `/economy`, `/admin`)
- **MyPage & 지갑 (`/dashboard`, `/wallet`, `/economy/wallet`)**: `PMP`/`PMC` 가용·락업 잔고, 참여 중인 예측/챌린지, 기부 임팩트 및 감사 리포트 타임라인.
- **관리자 백오피스 (`/admin`)**: 예측 게임 생성·수동/자동 정산, 경제 `EAT` 지표 관리, `feed` RSS 수집기 모니터링, 위시리스트 시설 인가 심사, 힐링룸 관리.
