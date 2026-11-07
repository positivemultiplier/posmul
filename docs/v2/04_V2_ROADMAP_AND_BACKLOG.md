# 🗺️ PosMul v2.0 시스템 완성도 감사(Audit) 및 차기 개발 로드맵

> **본 문서는 PosMul v2.0의 현재 프로덕션(`https://posmul.com`) 구현 완성도를 냉철하게 진단하고, 다음 개발자(또는 에이전트)가 우선순위에 따라 흔들림 없이 개발을 이어갈 수 있도록 설계된 공식 백로그(Backlog) 문서입니다.**
>
> 📅 **기준 일자**: 2026년 11월 7일 (Version 2.0 선언 기준)

---

## 1. 도메인별 프로덕션 완성도 매트릭스 (System Readiness Matrix)

| 도메인 | 라이브 경로 | UI / UX 표준화 | DB 조회 연동 | 쓰기 / 트랜잭션 | 현재 상태 및 비고 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **전역 네비게이션** | `ThreeRowNavbar` | ✅ **100%** | ✅ 완료 | - | 1·2·3row 시민 선순환 플라이휠 & 도메인 Tone-on-Tone 완성 |
| **STEP 1 · 포럼** | [`/forum`](https://posmul.com/forum) | ✅ **90%** | ✅ 완료 | 🟡 부분 | 뉴스·예산·아고라 갤러리 구축 완료 (`+10 PMP` 원장 직결 고도화 필요) |
| **STEP 2 · 소비** | [`/consume`](https://posmul.com/consume) | ✅ **90%** | ✅ 완료 | 🟡 부분 | `Major`/`Minor`/`Cloud` 3대 리그 UI 및 캠페인 조회 완료 |
| **STEP 3 · 예측** | [`/prediction`](https://posmul.com/prediction) | ✅ **100%** | ✅ 완료 | ✅ 완료 | **전체 마켓 및 6대 중분류(2row)·소분류(3row) 레이아웃 100% 통일 완료**<br>(`economy`, `entertainment` 실데이터 가동 중 / 타 카테고리 시딩 확대 필요) |
| **STEP 4 · 기부** | [`/donation`](https://posmul.com/donation) | ✅ **95%** | ✅ 완료 | ✅ 완료 | **Pillar 1 (`K-물품 직접기부` & `K-위시리스트 포털`) 100% 구축 완료**<br>(Pillar 2 NGO 에스크로, Pillar 3·4 의인/꿈의 사다리 상세 기능 확장 예정) |
| **STEP 5 · 랭킹** | [`/ranking`](https://posmul.com/ranking) | ✅ **95%** | ✅ 완료 | - | 도메인별(`expect`, `overall`, `forum`, `consume`, `donation`) & 시도별 필터 완료 |
| **투명회계·기타** | [`/other`](https://posmul.com/other) | ✅ **85%** | 🟡 모의 | 🟡 모의 | `Gift Aid` 세액공제 계산기 및 세무·회계 UI 구축 완료 |
| **관리자 백오피스** | [`/admin`](https://posmul.com/admin) | ✅ **85%** | ✅ 완료 | ✅ 완료 | 예측 게임 생성/정산, 피드 수집, 경제 지표 관리 데스크 |

---

## 2. 최근 완료된 Version 2.0 핵심 마일스톤 (Completed in v2.0)

### ✅ Milestone A: Prediction 도메인 네비게이션 & 전 페이지 100% 표준화
1. **3중 중복 네비게이션 완전 해소**:
   - `ThreeRowNavbar`의 `전체 마켓` 3row에서 2row와 중복되던 도메인 링크를 제거하고 `전체 마켓 피드 | 🔥 인기·핫이슈 | 💰 고액 상금풀 | ⏰ 마감 임박` 필터로 개편.
   - `ClientPredictionGamesGrid` 본문 내 중복 카테고리 칩(`▽ 카테고리: 전체 15 | 경제/투자 10...`)을 제거하고 실시간 정렬 툴바(`최신순 | 인기순 🔥 | 상금순 💰 | 마감임박 ⏰`)와 `✨ AI 수집 & 생성` 버튼으로 일원화.
2. **모든 2row / 3row(`[subcategory]`) 페이지 레이아웃 통일**:
   - `/prediction`(전체 마켓)에 누락되어 있던 `CompactMoneyWaveCard`(초록색 물결 상금풀 배너)와 공인 검증 데이터 배지를 추가.
   - `economy`, `consume`, `sports`(`soccer` 포함), `entertainment`, `politics`, `user-suggestions`의 모든 3row 하위 페이지에서 구버전 레거시 UI를 완전히 폐기하고 `DomainContextHeader` + `CompactMoneyWaveCard` + `ClientPredictionGamesGrid` 구조로 100% 통일 (First Load JS `270 kB`로 모든 라우트 구조 일치 검증 완료).
   - DB의 엔터테인먼트 서브카테고리(`movie`/`movies`, `drama`/`dramas`, `variety`) 양방향 매칭 및 404 누락 라우트(`indicators`, `crypto`) 완벽 복구.

### ✅ Milestone B: Donation 도메인 K-물품 직접기부 & K-위시리스트 구축
1. **수혜기관 직접 선택 & 인라인 스토리 아코디언 (`/donation/direct/item/[id]`)**:
   - LG 휘센 에어컨, 삼성 건조기, 부산 아동 운동화 등 K-물품 상세 페이지에서 물품을 필요로 하는 복지시설을 직접 선택하고, 페이지 이탈 없이 현장 사진·인가증·시설장 편지를 펼쳐보며 소액 크라우드펀딩 참여 가능.
2. **복지시설 K-위시리스트 독립 포털 (`/donation/direct/wishlist`)**:
   - 6대 지원 가능 K-물품 비주얼 쇼케이스, 카테고리 필터 및 정렬(최신순/달성률순/시급순), 복지시설 물품 신청 모달(`donation.funding_wishlist_requests` DB 연동) 및 관리자 검증 게이트 완성.

### ✅ Milestone C: 배포 완료 필수 검증 게이트 (`Definition of Done`) 확립
- [`.agent/rules/delivery-pipeline.md`](../../.agent/rules/delivery-pipeline.md)를 통해 **[Gate 1: `pnpm --filter posmul-web build` 완주 ➔ Gate 2: `develop` 브랜치 커밋 ➔ Gate 3: `git push` & `npx vercel --prod --yes` 라이브 `200 OK` 확인]** 파이프라인을 강제 규칙으로 확립.

---

## 3. 다음 개발자를 위한 우선순위 백로그 (Next Developer Backlog)

다음 작업을 이어받는 개발자는 아래 **P0 ➔ P1 ➔ P2 ➔ P3** 순서로 진행하는 것을 권장합니다.

---

### 🔥 [P0] 경제 원장(Ledger) & 지갑 잔고 원자적(Atomic) 통합 (최우선)
* **현황**:
  - 상단 헤더의 `CompactBalanceWidget` 및 일부 기부/소비 액션에서 비로그인 또는 초기 계좌 미생성 유저의 편의를 위해 클라이언트 시뮬레이션 잔고(폴백 값)가 혼용되고 있음.
* **구현 과제**:
  1. 신규 회원 가입 시 트리거(또는 온보딩 액션)를 통해 `economy.pmp_pmc_accounts`에 초기 웰컴 시드(예: `1,000 PMP`)가 100% 생성되도록 보장.
  2. **포럼 댓글 작성(`+10 PMP`) ➔ 광고 시청(`+PMP`) ➔ 예측 베팅(`-PMP`) ➔ 예측 적중 정산(`+PMC`) ➔ K-물품 기부(`-PMC`)**의 전 과정이 `economy.pmp_pmc_transactions` 원장 테이블과 단일 트랜잭션(Supabase RPC)으로 맞물려 돌아가도록 연결.
  3. 액션 직후 `router.refresh()` 또는 상태 동기화를 통해 상단 `CompactBalanceWidget`의 `PMP`/`PMC` 숫자가 실시간으로 증감되도록 연동.
* **관련 파일**:
  - `src/shared/ui/components/layout/CompactBalanceWidget.tsx`
  - `src/app/api/economy/balance/route.ts`
  - `src/app/donation/direct/item/[id]/client.tsx`

---

### ⚡ [P1] 예측 마켓 전 카테고리 실데이터 시딩 & AI 파이프라인 확장
* **현황**:
  - 현재 `prediction.prediction_games` 테이블에는 `ECONOMY`(주식, 실적, 지표 11개)와 `ENTERTAINMENT`(영화, 드라마, 예능, 음원 5개) 게임이 `ACTIVE` 상태로 풍부하게 등록되어 있으나, `SPORTS`, `POLITICS`, `INVEST`(소비예측), `USER_PROPOSED`(시민제안) 카테고리는 기존 게임들이 마감(`CLOSED`/`CANCELLED`)되어 "준비 중" 빈 상태 카드가 표시됨.
* **구현 과제**:
  1. `/api/cron/feed-ingest` (AI 수집 & 생성 파이프라인)가 경제·엔터뿐 아니라 **스포츠(`soccer`, `baseball`, `esports`), 정치/정책(`national-elections`, `policy-changes`), 소비예측(`time`, `money`, `cloud`), 시민제안(`ai_recommendations`)** 영역의 게임도 골고루 생성하도록 프롬프트 및 카테고리 분류 로직 고도화.
  2. 각 서브카테고리별로 최소 3~5개의 매력적인 실시간 `ACTIVE` 예측 게임을 시딩하여 사용자가 어느 탭을 눌러도 즉시 베팅에 참여할 수 있도록 구성.
  3. `/api/cron/prediction-settle` 자동 정산 시 `DART`(실적), `KOSIS`(지표), `Alpha Vantage`(주가) API 응답값을 파싱해 정산 근거 링크를 `prediction_settlements`에 자동 기록.
* **관련 파일**:
  - `src/app/api/cron/feed-ingest/route.ts`
  - `src/app/api/cron/prediction-settle/route.ts`

---

### 💜 [P2] 기부 도메인 Pillar 2·3·4 고도화 및 증빙 스토리지 연동
* **현황**:
  - Pillar 1(`K-물품 직접기부 & 위시리스트`)은 완성도가 매우 높으나, 복지시설 신청 시 고유번호증을 텍스트 번호로만 입력받고 있으며, Pillar 2(NGO 마일스톤)와 Pillar 3·4(의인 포상/꿈의 사다리)는 추가 인터랙션 고도화가 필요함.
* **구현 과제**:
  1. **복지시설 인가증 파일 업로드 (`Supabase Storage`)**:
     - `/donation/direct/wishlist`의 신청 모달에서 고유번호증/시설신고증 이미지·PDF를 `Supabase Storage`(`donation-verifications` 버킷)에 업로드하고 관리자 데스크(`/admin`)에서 열람·승인하는 기능 추가.
  2. **기부자 피드백 루프 (`내 기부 내역 & 감사 리포트`)**:
     - 100% 펀딩 달성 후 실제 복지시설에 에어컨·운동화가 설치된 현장 사진과 감사 편지를 기부자 대시보드(`/dashboard` 또는 `/wallet`)에서 확인할 수 있는 타임라인 UI 구현.
  3. **Pillar 2 (`/donation/institute`) & Pillar 3·4 (`/donation/opinion-leader`) 인터랙션 완성**:
     - NGO 3단계(30% ➔ 40% ➔ 30%) 영수증 증빙에 대한 시민 승인/보류 투표 위젯 연결.
* **관련 파일**:
  - `src/app/donation/direct/wishlist/page.tsx` & `actions.ts`
  - `src/app/donation/institute/page.tsx`
  - `src/app/donation/opinion-leader/page.tsx`

---

### 🌱 [P3] 아고라 ➔ 예측 마켓 자동 승격 (Forum-to-Prediction Bridge)
* **현황**:
  - `forum.forum_prediction_links` 테이블이 스키마에 준비되어 있으나, 프론트엔드 포럼 아고라에서 시민이 제안한 안건이 자동으로 예측 마켓으로 전환되는 브릿지 UI가 아직 연결되지 않음.
* **구현 과제**:
  1. `/forum/agora`에서 시민 제안 게시글이 추천(공감) 10개 이상을 달성하면 **"🎯 시민 제안 예측 마켓으로 승격됨"** 배지를 부여하고, 자동으로 `/prediction/user-suggestions/user-proposals`에 신규 예측 게임(`DRAFT` 또는 `ACTIVE`)을 생성하는 워크플로우 완성.
  2. 이를 통해 **STEP 1(포럼 숙의) ➔ STEP 3(집단지성 예측)**이 코드로 완벽히 직결되는 경험 완성.
* **관련 파일**:
  - `src/app/forum/components/GalleryPostList.tsx`
  - `src/app/prediction/user-suggestions/page.tsx`

