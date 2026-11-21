# PosMul 예측(Prediction) — 백엔드 · 오라클 · 정산 · 파이프라인 상세 스펙

> 상위 헌법: [SKILL.md](../SKILL.md)

---

## 1. 예측 게임 기획 및 오라클(Oracle) 제약조건

모든 예측 게임은 [PREDICTION_AND_LIVE_GENERATION_PRINCIPLES.md](file:///c:/G/posmul/docs/PREDICTION_AND_LIVE_GENERATION_PRINCIPLES.md)의 헌장을 따릅니다.

1. **양측 팬덤 대립 구도**:
   - 질문은 반드시 양측(A vs B)이 팽팽하게 맞설 수 있는 명확한 양자택일 구조여야 합니다.
   - 한쪽으로 결과가 명백히 쏠리는 게임은 생성을 지양합니다.
2. **공식 공인 오라클 출처 필수**:
   - 주관적 판단이나 임의 투표로 정산할 수 없으며, 반드시 검증 가능한 공인 API/공식 발표를 오라클로 지정합니다.
   - 대표 오라클 출처:
     - `kobis`: 영화진흥위원회 박스오피스 공식 통계
     - `dart`: 금융감독원 전자공시시스템 공식 영업이익/실적 공시
     - `ecos`: 한국은행 경제통계시스템 (기준금리, 경제지표)
     - `coingecko` / `alpha-vantage`: 공인 시세 및 종가
     - `football_data` / `kbo`: 공식 경기 결과 (Full-Time 스코어)
     - `nielsen`: 닐슨코리아 공인 시청률
3. **초 단위 판정 기준 명시**:
   - 정산 조건은 "2026-XX-XX 23:59:59 KST 기준 발표치"와 같이 초 단위까지 분쟁 여지없이 기술합니다.
4. **LIVE 번개 예측 특화 규칙**:
   - 마감 시간: 5분 ~ 15분 이내 초단기 마감.
   - 수량 제어: 활성 LIVE 번개 게임은 화면당 최대 6개를 넘지 않도록 제한.

---

## 2. 게임 라이프사이클 및 상태 전이 규칙 (State Invariants)

예측 게임의 상태(`status`)는 엄격한 단방향 전이 규칙을 준수해야 합니다.

$$\text{DRAFT} \longrightarrow \text{ACTIVE} \longrightarrow \text{CLOSED} \longrightarrow \text{SETTLING} \longrightarrow \text{SETTLED}$$
*(천재지변, 경기 취소 등 불가항력적 오류 발생 시에만 $\text{VOIDED}$ 환불 처리)*

| 상태 | 설명 | 허용 동작 및 백엔드 가드 조건 |
|---|---|---|
| **`DRAFT`** | 게임 등록 준비 중 | 관리자/생성자만 수정 가능, 유저 베팅 불가 |
| **`ACTIVE`** | 베팅/투표 진행 중 | `NOW() < registration_end` 일 때만 베팅 트랜잭션 허용. 마감 시각 도달 시 자동 차단 |
| **`CLOSED`** | 베팅 접수 마감 | 베팅 추가 불가, 오라클 판정 대기 |
| **`SETTLING`** | 오라클 결과 수집 및 판정 중 | 오라클 어댑터가 공식 결과를 확인하고 검증하는 중간 상태 |
| **`SETTLED`** | 보상 지급 및 정산 완료 | `winning_option_id` 확정 필수, 승자 PMC 배당 및 PMP 소각 완료. **재정산 불가 (멱등성 보장)** |
| **`VOIDED`** | 게임 무효화/취소 | 참가자 원금(PMP) 전액 자동 환불 트랜잭션 실행 |

---

## 3. DB 제약조건 및 MoneyWave 정산 규칙 (Crucial Constraints)

정산 RPC(`settle_prediction_game`) 및 DB 조작 시 다음 규칙을 위반하면 DB Check 제약조건 에러가 발생합니다.

### 3.1. 대문자 ENUM 표준 (엄격 준수)
- **`economy.money_wave_history`**:
  - `wave_type`: 반드시 대문자 `'MONEY_WAVE_1'`, `'MONEY_WAVE_2'`, `'MONEY_WAVE_3'` 사용 (`'wave1'` 등 소문자 절대 금지).
  - `status`: 반드시 대문자 `'COMPLETED'`, `'PENDING'`, `'EXECUTING'`, `'FAILED'` 사용 (`'completed'` 금지).
- **`prediction.prediction_games`**:
  - `status`: `'ACTIVE'`, `'CLOSED'`, `'SETTLING'`, `'SETTLED'`, `'VOIDED'`

### 3.2. 원장 불변성 및 보상 분배 공식 (v3.0 승자독식 · EAT 기준)
- 참가자가 예측에 참여한 `PMP`는 즉시 계좌에서 차감되어 게임 참여 풀(`total_bet_pool`)에 묶입니다.
- 정산 시:
  - **승자 보상**: `MoneyWave(EAT)` 상금 풀 배분 기준에 따라 **`PMC` 보상 지급** *(유일한 `PMC` 생성 경로)*
  - **패자 참여 `PMP`**: **전액 소멸(Burn) — 승자독식 순환** (유저는 다시 `Forum`/`Consume` 활동으로 `PMP` 확보)
  - **MoneyWave 추가 상금 기록**:
    지급 `PMC` 분배량은 회사의 세후 순이익(`EAT`) 한도 내 `MoneyWave` 풀 계산(`compute_prediction_hourly_game_pools`)을 따르며 `economy.money_wave_history`에 기록합니다.

---

## 4. 보안, 권한 분리 및 원장 원자성 원칙 (Supabase RLS & Admin)

- **RLS(Row-Level Security) 엄격 준수**:
  - `prediction` 스키마의 모든 테이블(`prediction_games`, `predictions`, `scheduler_config`, `user_challenges`, `user_challenge_bets` 등)은 RLS가 켜져 있어야 합니다.
  - `predictions` 및 `user_challenge_bets`는 클라이언트 직접 `UPDATE`/`INSERT`(PMP 미차감 우회)를 차단하고, 반드시 **서버 인증 + 단일 원자적 DB RPC**(`place_prediction_bet`, `withdraw_prediction_bet`, `deduct_challenge_pmp`)를 통해서만 변경합니다.
  - `scheduler_config`는 서버(`service_role`) 전용으로 유지합니다.
- **클라이언트 사용 구분 & 서버 인증 필수**:
  - 사용자 세션 기반 조회: `createClient()` ([server.ts](file:///c:/G/posmul/apps/posmul-web/src/lib/supabase/server.ts) / [client.ts](file:///c:/G/posmul/apps/posmul-web/src/lib/supabase/client.ts))
  - 정산, 철회, 관리자 RPC 호출 시 `supabaseAdmin` ([admin.ts](file:///c:/G/posmul/apps/posmul-web/src/lib/supabase/admin.ts))을 쓰기 전에 **반드시 `supabase.auth.getUser()` 또는 `requireAdminApi()` / `requireCronOrAdmin()`으로 호출자 권한을 먼저 검증**합니다.
  - 모든 `SECURITY DEFINER` 정산/크론 RPC는 `REVOKE EXECUTE FROM PUBLIC, anon, authenticated` 적용 필수.
- **원자적 철회 & 중복 방지**:
  - 예측 철회 시 반드시 `WHERE prediction_id = $1 AND is_active = true` 조건의 단일 원자적 RPC로 이중 환불(Double Refund)을 원천 차단합니다.
  - DB 로딩 시 `PredictionGame.create()` 대신 `reconstitute()` 패턴을 사용해 유령 이벤트와 ID 덮어쓰기를 방지합니다.

---

## 5. TDD 및 CI 검증 규칙 (Quality Gate)

GitHub Actions CI 파이프라인의 성공을 보장하기 위한 개발 규칙입니다.

1. **테스트 파일 명명 분리**:
   - **단위 테스트 (Mock)**: `*.test.ts`
     - 외부 DB나 네트워크 없이 모킹으로 100% 동작해야 합니다.
     - `pnpm test` 실행 시 10초 이내에 완료되어야 합니다.
   - **통합 테스트 (실제 DB 연동)**: `*.integration.test.ts`
     - 실제 Supabase DB를 호출하는 테스트는 반드시 파일명에 `.integration.test.ts`를 포함합니다.
     - CI 환경(`CI=true`)에서는 `jest.config.js`에 의해 자동으로 제외되며, 로컬에서 `pnpm test:integration`으로만 별도 실행합니다.
2. **ESLint / TypeScript 규칙**:
   - 값이 재할당되지 않는 변수는 반드시 `const`로 선언합니다 (`let` 금지).
   - 모든 Server Action 및 UseCase 입력 파라미터는 Zod 스키마(`CreatePredictionGameRequestSchema` 등)를 통해 `safeParse` 검증을 거칩니다.

---

## 6. 시스템적 DB 연동 게임 생성 파이프라인 (Zero-Hardcoding)

모든 `ACTIVE` 예측 게임은 수동 하드코딩이 아닌 아래 두 시스템 엔진을 통해 `prediction.prediction_games` + `prediction.settlement_sources` + `economy.money_wave_hourly_game_pools`에 일관 생성됩니다.
1. **뉴스/의안 피드 AI 자동 생성 (`CreatePredictionDraftUseCase` + `GeminiClassifierAdapter`)**:
   - `BINARY`, `WIN_DRAW_LOSE`, `RANKING` 3가지 분류와 `ECONOMY` 포함한 6대 DB 카테고리(`ECONOMY | INVEST | SPORTS | ENTERTAINMENT | POLITICS | USER_PROPOSED`)를 모두 지원.
   - 생성 시 `prediction_type`, `subcategory`, `difficulty`, `settlement_type`, `data_source`, `settlement_sources`를 함께 기록하고 `economy.compute_prediction_hourly_game_pools` RPC로 상금풀 즉시 배정.
2. **정기 오라클 템플릿 스케줄러 (`MasterGameSchedulerService` + `GameSchedulingService`)**:
   - `KST_OFFSET_MINUTES` 기반 타임존 독립 UTC epoch 계산(`getKstNowParts`, `kstWallTimeToUtc`) 및 진행 중 회차 우선 선택(`getNextWeeklySchedule`, `getNextMonthlySchedule`).
   - 전 카테고리(한국은행 ECOS, 통계청 KOSIS, 금감원 OpenDART, 영진위 KOBIS, K-Content, 글로벌 증시/코인, 스포츠 EPL/LCK/K리그, 정치·입법, 소비·트렌드 랭킹)에 걸쳐 `BINARY` · `WIN_DRAW_LOSE` · `RANKING` 템플릿 보유.
   - `/api/admin/scheduler/sync` (`materializeTemplates: true`) 또는 크론 실행 시 오라클 등록 및 `economy.compute_prediction_hourly_game_pools` 상금풀 산정 자동 수행.
