---
name: posmul-prediction
description: PosMul 예측(Prediction) 도메인의 백엔드 비즈니스 규칙, 게임 라이프사이클 상태 전이, Supabase DB 제약조건, 오라클 판정 기준, MoneyWave 정산/TDD 가이드 및 프론트엔드 UI/UX 피드/카드 디자인 시스템 표준
---

# PosMul 예측(Prediction) 도메인 백엔드 개발 스킬

이 스킬은 PosMul 예측 게임 및 LIVE 번개 예측 관련 백엔드 API, 도메인 엔티티, 유스케이스, DB 마이그레이션, 정산 RPC 및 테스트 코드를 개발할 때 준수해야 하는 **엄격한 백엔드 제약조건과 아키텍처 규칙**을 제공합니다.

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

### 3.2. 원장 불변성 및 보상 분배 공식
- 참가자가 예측에 베팅한 PMP는 즉시 계좌에서 차감되어 게임 베팅 풀(`total_bet_pool`)에 묶입니다.
- 정산 시:
  - **승자 보상**: $\text{원금 회수} + \text{배당 PMC}$
  - **패자 베팅액**: 전액 소각(Burn) 또는 시스템 풀에 귀속
  - **MoneyWave 추가 상금 분배**:
    전체 지급 보상액이 베팅 원금 풀을 초과할 경우, 초과분($\Delta = \text{total\_reward} - \text{total\_bet\_pool}$)을 순수 MoneyWave 1단계 발행액으로 계산하여 `economy.money_wave_history`에 기록합니다.

---

## 4. 보안 및 권한 분리 원칙 (Supabase RLS & Admin)

- **RLS(Row-Level Security) 준수**:
  - `prediction` 및 `forum` 스키마의 모든 공개 테이블(`prediction_games`, `predictions`, `user_challenges`, `user_challenge_bets` 등)은 RLS가 켜져 있어야 합니다.
  - 일반 조회는 `anon`, `authenticated` 모두 허용(`USING (true)`).
  - 베팅 및 참여는 `auth.uid() = user_id` 조건으로 본인 계정만 가능.
- **클라이언트 사용 구분**:
  - 사용자 세션 기반 조회: `createClient()` ([server.ts](file:///c:/G/posmul/apps/posmul-web/src/lib/supabase/server.ts) / [client.ts](file:///c:/G/posmul/apps/posmul-web/src/lib/supabase/client.ts))
  - 정산, 잔고 강제 조작, 관리자 RPC 호출: 반드시 서버 액션/API 라우트 내부에서 `supabaseAdmin` ([admin.ts](file:///c:/G/posmul/apps/posmul-web/src/lib/supabase/admin.ts)) 사용 (Service Role Key로 RLS 우회).

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

## 6. 프론트엔드 UI/UX 레이아웃 표준 (Prediction Feed Architecture)

예측 메인 피드(`/prediction`) 및 카드 컴포넌트는 다음 확정된 디자인 시스템 규격을 엄격히 준수합니다.

### 6.1. 상단 헤더 및 사이드바 레이아웃
- **상단 배너 배제**: 상단을 가리는 거대한 파란색 정보 배너(`DomainContextHeader`) 및 구형 가로 띠배너는 전면 삭제하고, 카테고리/소트 툴바와 메인 피드가 최상단에서 즉각 노출되도록 합니다.
- **MoneyWave 황금 모래시계 사이드바 카드**:
  - 우측 사이드바 `Hot topics` 바로 위에 **`MoneyWave 황금 모래시계`(`MoneyWaveWaterfallCard.tsx`)**를 단독 배치합니다.
  - **철학적 메타포**: 상단 챔버의 은빛 모래(무위험 PMP 참여)가 좁은 목(시민 집단지성의 검증)을 통과하며 황금빛 스파크를 일으키고, 하단 챔버에 찬란한 황금 모래 언덕(실질 임팩트 PMC)으로 차오르는 연출.
  - **1시간 타이머 동기화**: `다음 Wave 분배` 실시간 카운트다운 타이머 및 충전 진행률(%)이 모래시계 수면 높이와 1:1로 일치해야 합니다.

### 6.2. All markets 예측 카드 4계층 구조 (`PredictionGameCard.tsx`)
카드는 내용이 찌그러지거나 잘리지 않도록 반드시 아래 4개 계층(Row)으로 엄격히 분리하여 렌더링합니다:

1. **[1행 헤더]**: `[40x40 심볼 아바타 + 카테고리/출처/D-day]` vs `[우측 상단 게이지]`
   - 카테고리 라벨과 출처 텍스트가 세로로 줄바꿈되어 깨지지 않도록 가로 너비를 보장합니다 (`whitespace-nowrap`).
   - **게이지 타입**:
     - 양자택일(`BINARY`): 반원 아크 게이지 (`renderArcGauge`, 상승/하락 우세)
     - 승무패(`WIN_DRAW_LOSE`): 3색 세그먼트 도넛 게이지 (`renderWdlGauge`, 승/무/패)
     - 다자선택(`RANKING`): 1위 독주 링 게이지 (`renderMultiGauge`)
2. **[2행 본문 제목]**: **카드 가로폭 100%(Full Width)를 독립 사용하는 2줄 제목**
   - 아바타와 게이지 사이에 제목을 우겨넣지 않고, 반드시 독립된 행(`min-h-[42px]`)으로 분리하여 10글자 만에 잘리는 현상을 방지합니다 (`line-clamp-2`).
   - `splitTitlePrefix` 함수로 `🔥 [한국증시] ...` 앞의 이모지와 대괄호 태그를 완벽히 분리 처리합니다.
3. **[3행 선택지 캡슐 버튼]**: **둥근 타원형 캡슐 버튼 스타일**
   - 양자택일: 좌측 녹색 캡슐(`firstOption`) vs 우측 자주/자색 캡슐(`secondOption`).
   - `shortenOptionLabel`을 통해 괄호 부가설명만 정돈하고 선택지 핵심 텍스트와 %가 `...`로 잘리지 않도록 넉넉한 너비를 유지합니다.
4. **[4행 하단 메타 바]**:
   - 상금풀(PMC) + 사회적 학습 가중치 배수(1.5x~2.5x) + 참여 인원 수 + 북마크 아이콘.

### 6.3. 그리드 반응형 열 규격 (`ClientPredictionGamesGrid.tsx`)
- 우측 사이드바가 존재하는 데스크톱 환경에서는 **반드시 3열 그리드(`lg:grid-cols-3 xl:grid-cols-3 gap-5`)**를 유지합니다.
- 4열(`grid-cols-4`) 배치는 카드 가로 폭을 250px 이하로 압축시켜 텍스트 말줄임 및 레이아웃 깨짐을 유발하므로 금지합니다.


