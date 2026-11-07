# 🗄️ PosMul v2.0 데이터베이스 멀티 스키마 & API·Cron 파이프라인 명세서

> **본 문서는 PosMul v2.0의 핵심 아키텍처 원칙인 `Schema-per-Bounded-Context`에 따라 격리된 Supabase PostgreSQL 17 데이터베이스 스키마 구조, 핵심 테이블 명세, 그리고 Next.js API Routes 및 자동화 Cron 파이프라인을 상세히 기술합니다.**
>
> 🔗 **Supabase Project ID**: `fabyagohqqnusmnwekuc` (`ap-northeast-2`, 서울 리전)  
> ⚠️ **DB 변경 원칙**: 로컬 Supabase CLI 사용 금지. 모든 DDL/DML은 Supabase MCP 도구(`execute_sql`, `apply_migration`)를 통해서만 수행합니다.

---

## 1. Schema-per-Bounded-Context 전체 아키텍처

PosMul은 모든 테이블을 `public`에 몰아넣는 안티패턴을 배제하고, **비즈니스 도메인(Bounded Context)별로 독립된 PostgreSQL 스키마**를 사용합니다.

```mermaid
erDiagram
    USER_SCHEMA["user 스키마\n(users, profiles, reputation)"]
    ECONOMY_SCHEMA["economy 스키마\n(pmp_pmc_accounts, transactions,\nmoney_wave_hourly_game_pools)"]
    PREDICTION_SCHEMA["prediction 스키마\n(prediction_games, predictions,\nprediction_settlements)"]
    DONATION_SCHEMA["donation 스키마\n(funding_projects, funding_wishlist_requests,\ndonations, direct_donation_items)"]
    CONSUME_SCHEMA["consume 스키마\n(ad_campaigns, local_stores,\nfunding_projects, payments)"]
    FORUM_SCHEMA["forum 스키마\n(forum_posts, forum_comments,\nforum_votes, forum_prediction_links)"]
    FEED_SCHEMA["feed 스키마\n(rss_sources, items, bills)"]
    RANKING_SCHEMA["ranking 스키마\n(user_scores, ranking_history)"]

    USER_SCHEMA ||--|| ECONOMY_SCHEMA : "1:1 계좌 매핑"
    FEED_SCHEMA ||--o{ PREDICTION_SCHEMA : "AI 뉴스 ➔ 예측 게임 자동 생성"
    FORUM_SCHEMA ||--o{ PREDICTION_SCHEMA : "시민 아고라 ➔ 예측 의제 승격"
    CONSUME_SCHEMA ||--o{ ECONOMY_SCHEMA : "광고/소비 ➔ PMP·PMC 적립 & Wave 풀 유입"
    PREDICTION_SCHEMA ||--o{ ECONOMY_SCHEMA : "PMP 베팅 & 적중 시 MoneyWave PMC 정산"
    ECONOMY_SCHEMA ||--o{ DONATION_SCHEMA : "획득한 PMC로 K-물품·NGO 직접 집행"
    ECONOMY_SCHEMA ||--o{ RANKING_SCHEMA : "도메인별 기여도 점수 집계"
```

---

## 2. 도메인 스키마별 핵심 테이블 명세

### 2.1 `economy` 스키마 (PMP/PMC 원장 & MoneyWave 엔진)
코드에서 접근 시: `supabase.schema("economy").from("...")`

| 테이블 / 뷰 이름 | 역할 및 핵심 컬럼 |
| :--- | :--- |
| **`pmp_pmc_accounts`** | 사용자별 무위험 자산(`pmp_balance`) 및 위험/실물가치 자산(`pmc_balance`) 계좌 원장 |
| **`pmp_pmc_transactions`** | 모든 PMP 획득·베팅·차감 및 PMC 전환·기부·소비 내역의 불변(Immutable) 원장 기록 |
| **`user_profiles_with_balance`** | 사용자 프로필과 실시간 `PMP`/`PMC` 잔고를 조인한 조회 전용 뷰 (`CompactBalanceWidget` 등에서 사용) |
| **`money_wave_config`** | MoneyWave 1·2·3 분배 비율, 시간당 방출 한도, 카테고리별 가중치 설정 |
| **`money_wave_hourly_category_allocations`** | 매시간 도메인/카테고리(`ECONOMY`, `SPORTS`, `ENTERTAINMENT`, `POLITICS` 등)에 할당된 상금풀 스냅샷 |
| **`money_wave_hourly_game_pools`** | 개별 예측 게임(`game_id`) 단위로 실시간 할당된 `MoneyWave` 상금풀 (`attachHourlyGamePoolsToRows`에서 참조) |
| **`money_wave1_ebit_records`** | Wave 1: 플랫폼·파트너 기업 EBIT 기반 재원 유입 기록 |
| **`money_wave2_redistribution_records`** | Wave 2: 미사용/소멸 예정 PMC 재분배 기록 |
| **`money_wave3_entrepreneur_records`** | Wave 3: 공익 벤처·임팩트 프로젝트 재원 배분 기록 |

---

### 2.2 `prediction` 스키마 (집단지성 예측 마켓)
코드에서 접근 시: `supabase.schema("prediction").from("...")`

| 테이블 이름 | 역할 및 핵심 컬럼 |
| :--- | :--- |
| **`prediction_games`** | 예측 마켓 게임 마스터 테이블.<br>- `game_id` (UUID, PK), `slug` (고유 URL 슬러그)<br>- `title`, `description`, `prediction_type` (`BINARY`, `MULTIPLE_CHOICE` 등)<br>- `category`: `ECONOMY`, `SPORTS`, `ENTERTAINMENT`, `POLITICS`, `INVEST`, `USER_PROPOSED`<br>- `subcategory`: 소분류 키 (예: `stocks`, `earnings`, `indicators`, `crypto`, `movies`/`movie`, `dramas`/`drama`, `variety`, `music`, `soccer` 등)<br>- `status`: `DRAFT` ➔ `ACTIVE` ➔ `CLOSED` ➔ `SETTLED` (또는 `CANCELLED`)<br>- `options` (JSONB 배열: 선택지 ID, 텍스트, 초기/현재 확률)<br>- `allocated_prize_pool` (기본 상금풀), `total_stake` (누적 PMP 베팅액), `current_participants`<br>- `registration_end` (베팅 마감 시각), `settlement_date` (정산 예정 시각) |
| **`predictions`** | 시민(유저)이 특정 게임에 베팅한 내역.<br>- `prediction_id` (UUID), `game_id`, `user_id`<br>- `bet_amount` (베팅한 PMP 수량), `is_active` (활성 여부)<br>- `prediction_data` (JSONB: 선택한 옵션 ID, 배당률, 신뢰도 등) |
| **`prediction_settlements`** | 게임 정산 결과 및 승리 옵션(`winning_option_id`), 참여자별 지급된 PMC 보상 내역 |
| **`settlement_sources`** | 게임별 자동 정산에 사용되는 공인 외부 데이터 소스(`DART`, `KOSIS`, `Alpha Vantage` 등) 메타 정보 |
| **`prediction_trends`** | 시간대별 선택지 확률 변화 시계열 데이터 (상세 페이지 차트 렌더링용) |

> 📌 **카테고리 & 서브카테고리 매핑 주의사항 (`ThreeRowNavbar` ↔ DB)**:
> - **경제 (`ECONOMY`)**: `stocks` (주식), `earnings` (기업 실적), `indicators` (경제 지표), `crypto` (암호화폐)
> - **엔터테인먼트 (`ENTERTAINMENT`)**: DB에 단수형(`movie`, `drama`)과 복수형(`movies`, `dramas`) 및 `variety`(예능), `music`(음원), `awards`(시상식)가 혼재할 수 있으므로 쿼리 시 `.in("subcategory", config.dbValues)`로 양방향 매칭 처리됨.
> - **스포츠 (`SPORTS`)**: `soccer`, `baseball`, `basketball`, `esports`, `other`
> - **정치 (`POLITICS`)**: `national-elections`, `local-elections`, `policy-changes`
> - **소비예측 (`INVEST`)**: `time`, `money`, `cloud`
> - **시민제안 (`USER_PROPOSED`)**: `user_proposals`, `ai_recommendations`, `opinion_leaders`

---

### 2.3 `donation` 스키마 (K-물품 직접기부 & 위시리스트 & NGO)
코드에서 접근 시: `supabase.schema("donation").from("...")`

| 테이블 이름 | 역할 및 핵심 컬럼 |
| :--- | :--- |
| **`funding_projects`** | K-물품 직접기부 및 공익 크라우드펀딩 프로젝트 마스터 (`id`, `title`, `target_amount`, `current_amount`, `unit_price`, `manufacturer` 등) |
| **`funding_wishlist_requests`** | 전국 복지시설(보육원, 어르신쉼터, 아동센터 등)이 신청한 **K-위시리스트 물품 요청 및 심사 테이블**.<br>- 시설명, 고유번호증/인가번호, 신청 물품 카테고리, 필요 수량, 현장 사연, 심사 상태(`PENDING`, `APPROVED`, `COMPLETED`) |
| **`donations`** | 개별 사용자의 PMC 기부 실행 내역 (수혜기관 매칭, 기부 금액, 영수증 발급 상태) |
| **`donation_institutes`** | 마일스톤 검증 파트너 NGO 기관 정보 |
| **`opinion_leaders`** | 의인 포상 및 오피니언 리더 프로필·후원 정보 |
| **`donation_certificates`** | 기부 증서 및 세액공제(`Gift Aid`) 증빙 레코드 |

---

### 2.4 `consume`, `forum`, `feed`, `ranking` 스키마

| 스키마 | 주요 테이블 | 설명 |
| :--- | :--- | :--- |
| **`consume`** | `ad_campaigns`, `ad_views`, `local_stores`, `funding_projects`, `payments` | `TimeConsume`(광고 시청 및 PMP 적립), `MoneyConsume`(지역 가맹점 결제), `CloudConsume`(펀딩 참여) 관리 |
| **`forum`** | `forum_posts`, `forum_comments`, `forum_votes`, `forum_prediction_links` | 공공 뉴스·예산 감시·아고라 게시글 및 댓글 작성 활동 로그 (`+10 PMP` 보상 연동) |
| **`feed`** | `rss_sources`, `items`, `bills` | 외부 언론사 RSS, 공공기관 보도자료, 국회 의안 수집 원천 데이터 (AI 예측 생성의 입력 데이터) |
| **`ranking`** | `user_scores`, `ranking_history` | 도메인별(`expect`, `overall`, `forum`, `consume`, `donation`) 및 지역별(`sido`) 시민 랭킹 점수 |

---

## 3. 내부 API Routes 및 자동화 Cron 파이프라인 (`src/app/api/`)

PosMul v2.0은 수동 운영 부담을 최소화하기 위해 **수집 ➔ 생성 ➔ 상금풀 배분 ➔ 정산**으로 이어지는 API 파이프라인을 갖추고 있습니다.

### 3.1 핵심 자동화 Cron API (`/api/cron/*`)

| 엔드포인트 | 메서드 | 역할 및 동작 흐름 |
| :--- | :--- | :--- |
| **`/api/cron/feed-ingest`** | `GET` / `POST` | **[1단계: AI 뉴스 수집 & 예측 마켓 자동 생성]**<br>- 최신 공공 뉴스·경제 공시 피드를 수집하고 AI(Gemini)를 통해 시민 투표에 적합한 양자택일(`BINARY`) 예측 게임으로 자동 변환하여 `prediction.prediction_games`에 `ACTIVE` 상태로 등록합니다.<br>- 프론트엔드 그리드 우측 상단의 `✨ AI 수집 & 생성` 버튼 클릭 시에도 즉시 호출됩니다. |
| **`/api/cron/prediction-pipeline`** | `GET` / `POST` | **[2단계: 예측 파이프라인 스케줄러]**<br>- 마감 시각(`registration_end`)이 도래한 `ACTIVE` 게임을 `CLOSED`로 전환하고 정산 대기열에 등록합니다. |
| **`/api/cron/prediction-settle`** | `GET` / `POST` | **[3단계: 공인 데이터 기반 자동 정산]**<br>- `settlement_date`가 도래한 게임을 외부 공인 API(`Alpha Vantage`, `DART`, `KOSIS` 등) 결과값과 대조하여 승리 옵션을 판정하고, 적중자들에게 `MoneyWave` PMC 보상을 분배한 뒤 `SETTLED`로 전환합니다. |
| **`/api/cron/trend-snapshot`** | `GET` / `POST` | **[4단계: 확률 추이 스냅샷]**<br>- 진행 중인 예측 게임들의 현재 베팅 비율과 상금풀을 `prediction.prediction_trends` 및 `game_snapshots`에 주기적으로 기록합니다. |

### 3.2 도메인 서비스 API (`/api/{domain}/*`)

| 도메인 | 주요 엔드포인트 | 설명 |
| :--- | :--- | :--- |
| **Economy** | `/api/economy/balance`<br>`/api/economy/moneywave`<br>`/api/economy/pmp-pmc-overview`<br>`/api/economy/transactions` | 유저 실시간 PMP/PMC 잔고 조회, MoneyWave 현재 웨이브 풀 및 카운트다운 조회, 거래 내역 조회 |
| **Predictions** | `/api/predictions`<br>`/api/predictions/[gameId]`<br>`/api/predictions/participate`<br>`/api/predictions/settle` | 예측 게임 목록/상세 조회, PMP 베팅 참여 처리, 관리자/자동 정산 실행 |
| **Donation** | `/api/donation`<br>`/api/donation/direct/items`<br>`/api/donation/direct/match`<br>`/api/donation/institutes` | K-물품 카탈로그 조회, 수혜 복지시설 매칭 및 PMC 기부 실행, 기관/리더 후원 |
| **Consume** | `/api/consume/time/campaigns`<br>`/api/consume/time/view`<br>`/api/consume/money/stores`<br>`/api/consume/cloud/projects` | 광고 캠페인 시청 완료 시 PMP 지급, 지역 상점 결제, 크라우드 펀딩 참여 |
| **Forum** | `/api/forum/posts`<br>`/api/forum/activity`<br>`/api/forum/delegate` | 아고라·예산·뉴스 게시글 CRUD 및 활동 PMP 보상 지급 |
| **Admin** | `/api/admin/prediction/create-game`<br>`/api/admin/scheduler/sync`<br>`/api/admin/economy` | 관리자 백오피스 전용 수동 게임 생성, 스케줄러 동기화, 경제 지표 제어 |
