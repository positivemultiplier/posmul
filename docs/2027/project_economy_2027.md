# PosMul 경제학 및 수리경제 모델 (2027 Edition)

> **기준일**: 2026-11-17  
> **원본 비교**: [init/project_economy.md](file:///c:/G/posmul/docs/archive/2026-11-pre-v3/init/project_economy.md) (2025-11-28)  
> **실코드 연계**: [money-wave-calculator.service.ts](file:///c:/G/posmul/apps/posmul-web/src/shared/economy-kernel/services/money-wave-calculator.service.ts), [collective-intelligence-engine.ts](file:///c:/G/posmul/apps/posmul-web/src/bounded-contexts/prediction/domain/services/collective-intelligence-engine.ts), [20261113_fix_prediction_settlement_v3_moneywave_pure.sql](file:///c:/G/posmul/supabase/migrations/20261113_fix_prediction_settlement_v3_moneywave_pure.sql)

---

## 1. 2025 `init/project_economy.md` vs 2027 경제 모델 핵심 진화

| 영역 | 2025 초기 (`init/`) | 2026 현재 실구현 & 2027 모델 (`2027/`) |
| :--- | :--- | :--- |
| **재원 산정 기준** | `MoneyWave1 = 예상 EBIT / 365` (법인세·이자 감산 전 혹은 추상 수식) | **`EAT(세후 순이익)` 기반** (`POSMUL_ANNUAL_EAT_POOL` 및 `annual_ebitda` 스냅샷). 운영비·세금을 제외한 순수 재원 한도 내 발행으로 플랫폼 적자 원천 차단 |
| **구현 기술 스택** | Python 의사코드 7개 모듈 (`agency_cost_minimizer.py` 등) | **TypeScript + PostgreSQL(Supabase RPC) 프로덕션 구현**: `MoneyWaveCalculatorService`, `calculate_reward_amount`, `deduct_challenge_pmp`, `analyzeSocialChoiceAggregation` |
| **`Invest` → `Consume`** | `Major/Local/Cloud`가 각각 PMP/PMC 분리 발행 | **입구 단일화**: `Consume(Major)`·`Forum`·`Vertical(Housing-Pro)` 모두 오직 **`PMP`만 발행** (`Local`/`Cloud`는 Phase 3 잠금) |
| **단일 `PMC` & 가드** | 예측 성공 + 지역소비 + 기타서비스로 `PMC` 획득 | **오직 `Prediction` 예측 성공만 유일한 `PMC` 획득처** + **무경쟁 가드(참여자 2명 미만·반대편 풀 0건 시 `0 PMC`)** + 게임당 `20,000 PMC` 상한 |
| **2단계 가치배분 이론** | 단순 직접/기관/리더 기부 | **사회선택이론(Social Choice Theory) 실코드 구현**: `미래꿈기부`에서 **콩도르세(Condorcet) · 보르다(Borda) 집계** + `K-물품` **영국식 Tied Aid 수출 승수 모델** |
| **기업 B2B 가치 모델** | "ESG 홍보 + 데이터 제공" 수준 | **`Social(IFRS S1)` 측정 가능 지표 발급**: 기업 직접 광고 → 시민 참여 → `K-물품` 기부 임팩트까지 정량 추적하는 B2B 상품화 |

---

## 2. 이론적 배경 (Theoretical Foundation 2027)

PosMul 2027은 노벨경제학상 수상 이론들을 단순 인용에 그치지 않고, **1단계 훈련(사실·확률 판단)**과 **2단계 훈련(가치 배분)**이라는 이중 학습 루프로 체계화했습니다.

### 2.1 주인-대리인 이론 (Agency Theory — Jensen & Meckling, 1976)
- **현실 문제**: 국민(Principal)과 관료·정치인(Agent), 그리고 기존 기부 시장의 기부자(Principal)와 모금단체(Agent) 사이에 극심한 정보 비대칭과 도덕적 해이(예: '어금니 아빠 사건' 등 기부금 유용)가 발생합니다.
- **2027 구현 해법**:
  1. **예측 훈련**: 양쪽 균형 브리핑과 공인 데이터(`DART`, `KOSIS`, `KOBIS`, `중앙선관위`)로 정보 비대칭 축소.
  2. **Tied Aid & 마일스톤 에스크로**: 현금 기부 대신 **K-물품 직배송**(`/donation/direct`)과 **NGO 3단계(30%→40%→30%) 시민 승인 에스크로**(`/donation/institute`)로 대리인 비용(Agency Cost)을 제로에 수렴시킵니다.
  3. **오픈 이슈 관리**: 플랫폼 외부 타 기관 중복 수령 리스크는 Phase 3 **삼식부기(Triple-Entry Accounting)** 및 외부 교차 검증 체계로 지속 보완합니다.

### 2.2 전망 이론 (Prospect Theory — Kahneman & Tversky, 1979/2002)
- **현실 문제**: 손실회피 계수($\lambda \approx 2.25$) 때문에 시민은 현금을 거는 예측 시장에 참여하지 못하며, 이는 사회적 학습 포기로 이어집니다.
- **2027 구현 해법**:
  - **손실 비대칭 제거(`PMP` 구조)**: `Forum`·`Consume`·`Housing-Pro` 등 무위험 활동으로 얻은 `PMP`를 예측에 투입하므로, 예측 실패 시 `PMP`는 소멸(승자독식)하지만 **개인의 현실 현금 손실은 0원**입니다.
  - **`MoneyWave2` 활용**: 반대로 `PMC`를 얻은 뒤 기부를 미루는 보유 효과(Endowment Effect)를 깨기 위해 일정 기간 미사용 `PMC`를 `MoneyWave2`로 재분배하는 역손실회피 장치를 둡니다.

### 2.3 공공선택이론 (Public Choice — Buchanan, 1962/1986) & 사회선택이론 (Arrow, Condorcet, Borda)
- **철의 삼각형(Iron Triangle) 극복**: 관료(예산 극대화, Niskanen)-정치인(책임 회피)-공급자 카르텔이 주도하는 비효율적 예산 배분 대신, 예측 능력으로 검증된 시민이 `PMC`를 들고 직접 공익 자원을 배분합니다.
- **이중 의사결정 훈련의 분리**:
  1. **1단계 훈련 (`Prediction`) — 정답이 있는 문제**: 사실·확률 판단 훈련 (베이지안 업데이트, 시장 균형).
  2. **2단계 훈련 (`Donation` · `미래꿈기부`) — 정답이 없는 문제**: 단순 다수결의 한계를 극복하기 위해 [collective-intelligence-engine.ts](file:///c:/G/posmul/apps/posmul-web/src/bounded-contexts/prediction/domain/services/collective-intelligence-engine.ts#L469)에 구현된 **`analyzeSocialChoiceAggregation`(보르다 카운트 + 1:1 쌍대 비교 콩도르세 승자 + 순환 역설 탐지)**을 적용합니다.

### 2.4 케인즈 승수 & 조건부 원조 (Keynes Multiplier & Tied Aid)
- 해외 현금 유출이나 중간 관리비 누수를 차단하고, 한국 기업 제품(`LG`, `삼성`, `부산 제화` 등) 직구매로 복지시설에 전달함으로써:
  $$\text{Domestic Multiplier} = \frac{1}{1 - MPC \times (1 - t)}$$
  의 국내 생산·고용·세수 환류(긍정승수, Positive Multiplier)를 극대화합니다.

---

## 3. 수리경제학 모델 (2027 Revised)

### 3.1 개인 효용함수 및 사회후생함수
개인의 효용은 무위험 참여 시드(`PMP`), 예측 적중 보상(`PMC`), 실제 기부 임팩트($S(\text{Donate})$), 그리고 2026년 추가된 정서적 보상(힐링룸·포스멀 프렌즈 만족 $R_{\text{healing}}$)의 결합으로 정의됩니다:
$$U_i(x) = \alpha_i \ln(1 + PMP_i) + \beta_i \ln(1 + PMC_i) + \gamma_i \cdot S(\text{Donate}_i) + \delta_i \cdot R_{\text{healing}, i}$$

사회후생함수는 개인 효용의 합과 분배 형평성(Gini 보정) 및 `Social(IFRS S1)` 측정 임팩트의 가중합입니다:
$$W = \sum_i U_i(x) + \lambda_1 (1 - \text{Gini}(\text{PMC}_{\text{dist}})) + \lambda_2 \sum_j \text{Impact}_{\text{IFRS-S1}}(j)$$

### 3.2 `EAT` 기반 순수 `MoneyWave` 정산 방정식 (실코드 반영)
과거 Python 초안의 `expected_ebit / 365`를 대체한 현재 Supabase RPC([20261113_fix_prediction_settlement_v3_moneywave_pure.sql](file:///c:/G/posmul/supabase/migrations/20261113_fix_prediction_settlement_v3_moneywave_pure.sql))의 엄격한 정산 수식입니다:

1. **일일 재원 풀 (`MoneyWaveCalculatorService`)**:
   $$\text{DailyPool} = \frac{\text{Annual EAT}}{365} + \text{MoneyWave2}_{\text{redistributed}} + \text{MoneyWave3}_{\text{enterprise}}$$
2. **유효 마켓 성립 조건 (무경쟁 가드)**:
   $$N_{\text{participants}} \ge 2 \quad \land \quad \text{WinningPool}_{PMP} > 0 \quad \land \quad \text{LosingPool}_{PMP} > 0$$
3. **개별 승자 보상 `PMC` (`calculate_reward_amount`)**:
   $$\text{Reward}_{i} = \text{ROUND}\left(\frac{\text{Bet}_{i, PMP}}{\text{WinningPool}_{PMP}} \times \min\left(20{,}000,\ \sum_{h} \text{Pool}_{h, PMC}\right),\ 2\right)$$
   *(패자의 베팅 `PMP`는 전액 소멸되며, 승자의 보상 `PMC`는 오직 해당 게임에 시간대별로 누적된 순수 `MoneyWave` 풀 한도 내에서만 배분됩니다.)*

### 3.3 버티컬 생태계 `EAT` 환류 & 인플레이션 방어 조건
`Housing-Pro` 등 버티컬 앱의 `PMP` 공급이 플랫폼 경제를 교란하지 않도록, **중앙 SDK 총량 통제 제약**을 둡니다:
$$\sum_{a \in \text{Verticals}} PMP_{\text{issued}, a, \text{day}} \le 300 \times N_{\text{active\_vertical\_users}}$$
$$\text{EAT}_{\text{vertical}} = \sum (\text{교재 판매 마진} + \text{스터디콘 결제} + \text{B2B 제휴 광고} - \text{비용 및 세금}) \xrightarrow{\text{일정 비율}} \text{MoneyWave1 Pool}$$

---

## 4. 실증 구현 매핑 (2025 Python 가상코드 → 2027 프로덕션 아키텍처)

| 2025 `init` Python 가상 클래스 | 2026~2027 실제 구현 파일 / 대응 모듈 |
| :--- | :--- |
| `CAPMRiskEngine` | [money-wave-calculator.service.ts](file:///c:/G/posmul/apps/posmul-web/src/shared/economy-kernel/services/money-wave-calculator.service.ts), [economy-kernel.service.ts](file:///c:/G/posmul/apps/posmul-web/src/shared/economy-kernel/services/economy-kernel.service.ts) |
| `AgencyCostMinimizer` | [participate-prediction.use-case.ts](file:///c:/G/posmul/apps/posmul-web/src/bounded-contexts/prediction/application/use-cases/participate-prediction.use-case.ts), [20261113_fix_prediction_settlement_v3_moneywave_pure.sql](file:///c:/G/posmul/supabase/migrations/20261113_fix_prediction_settlement_v3_moneywave_pure.sql) |
| `PublicChoiceEngine` | [collective-intelligence-engine.ts](file:///c:/G/posmul/apps/posmul-web/src/bounded-contexts/prediction/domain/services/collective-intelligence-engine.ts) (`analyzeSocialChoiceAggregation`) |
| `BehavioralEconomicsEngine` | `MoneyWave2` 휴면 재분배 로직 + `PMP` 무위험 구조 + [forum-pmp-policy.ts](file:///c:/G/posmul/apps/posmul-web/src/app/forum/forum-pmp-policy.ts) |
| `NetworkEconomicsEngine` | `posmul-web` + `housing-pro` 멀티 버티컬 SDK (`@posmul/auth-economy-sdk`) + `Consume` 트랙 B 기업 광고 |
| `UtilityEstimationEngine` & `EmpiricalAnalysisEngine` | **2027 신규 과제**: Supabase 원장(`pmp_pmc_transactions`, `predictions`, `donation_transactions`) 기반 패널 데이터 회귀·학습곡선·`IFRS S1` 임팩트 분석 파이프라인 |

---

## 5. 2027년 리스크 관리 및 확장 트랙

1. **PMP 인플레이션 방어**: 채널별 일일 상한(`Forum 1,000`, `Vertical 300`), 동일 페이지 스캔 중복 차단, `Prediction` 승자독식 소멸 및 `Challenge` P2P 호스트 수수료(3%) 소각/순환으로 유통량 균형 유지.
2. **적자 리스크 제로화**: `EBIT`가 아닌 `EAT` 연동과 게임당 `20,000 PMC` 상한, 무경쟁 게임 `0 PMC` 가드로 플랫폼 현금흐름 초과 발행 원천 차단.
3. **장기 `EAT` 다각화 트랙 (Phase 3+)**: 본진 안정화 후 **매몰비용 환급형 게임 허브(`game.posmul.com`)** 등 신규 엔터테인먼트 수익원을 `EAT` 파이프라인에 추가 연결 가능(현금 결제분은 수익과 환급 계약부채로 분리 인식하고, `PMC` 직접 지급은 여전히 금지).
