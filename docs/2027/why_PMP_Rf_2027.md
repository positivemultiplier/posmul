# 왜 PMP가 CAPM의 Risk-Free Rate ($R_f$) 인가? (2027 Edition)

> **기준일**: 2026-11-17  
> **원본 비교**: [init/why_PMP_Rf.md](file:///c:/G/posmul/docs/archive/2026-11-pre-v3/init/why_PMP_Rf.md) (2025-11-28)  
> **실코드 정합 기준**: [20261113_fix_prediction_settlement_v3_moneywave_pure.sql](file:///c:/G/posmul/supabase/migrations/20261113_fix_prediction_settlement_v3_moneywave_pure.sql), [money-wave-calculator.service.ts](file:///c:/G/posmul/apps/posmul-web/src/shared/economy-kernel/services/money-wave-calculator.service.ts), [forum-pmp-policy.ts](file:///c:/G/posmul/apps/posmul-web/src/app/forum/forum-pmp-policy.ts)

---

## 1. 2025 초기 분석 vs 2027 모델의 핵심 변화

| 비교 항목 | 2025 `init/why_PMP_Rf.md` | 2027년 정합 모델 (`2027/`) |
| :--- | :--- | :--- |
| **PMP 소멸 조건** | "소멸 조건 無 (활동 지속 시 유지)" | **보유 시 소멸은 없으나, 예측 실패 시 베팅한 PMP 전액 소멸(승자독식)** + 획득 일일 상한(Cap) 존재 |
| **PMP의 $R_f$ 근거** | 고정 교환비 = 가치 변동성 0 | **현금 원금 투입이 0원(Zero-Cash-Loss)**이므로 시민 입장에서 하방 손실 위험이 0인 **무위험 참여 시드(Risk-Free Seed)** |
| **PMC 가치 원천** | **`EBIT`** 변동 및 향후 DeFi 차입 가능성 | **세후 순이익(`EAT`) 기반 순수 `MoneyWave` 풀** (게임당 20,000 PMC 상한 + 무경쟁 가드 2인 미만 시 0 PMC) |
| **PMC 소멸/환류** | 미사용 시 MoneyWave2 재분배 | 동일 원칙 유지 + **실제 기부(`Donation`) 시에만 사회적 효용으로 확정 실현** |

---

## 2. CAPM 무위험자산($R_f$) 조건과 PosMul 2027 대조

전통적 CAPM에서 Risk-Free Asset이 충족해야 하는 조건을 2027년 PosMul 토큰 설계에 대조하면 다음과 같습니다.

| CAPM $R_f$ 조건 | 현실 자산 (3개월 국채) | `PMP` (PosMul Points) — 2027 해석 | `PMC` (PosMul Coins) — 2027 해석 |
| :--- | :--- | :--- | :--- |
| **원금 보전성** | 만기 시 명목 원금 보전 | **현금 손실 확률 0%**: 시간·학습·토론 활동으로 무료 획득하며 현금 자산 훼손이 없음 | **원금 개념 없음(성과형)**: 예측 적중 시에만 순수 `MoneyWave`에서 변동 배분 |
| **수익률 분산** | $\sigma^2 \approx 0$ | **확정 보상 테이블**: 포럼(`20~50`, 추천 `+20`), 광고(`+35~100`), 버티컬(`5~40`) 등 **사전 확정 지급률**로 분산이 0 | **높은 분산($\sigma^2 > 0$)**: 플랫폼 `EAT` 추이, 게임 경쟁률($\text{winning\_pool}$), 적중률에 따라 실시간 변동 |
| **무한 차입·공급** | 이론적 무제한 가정 | **정책적 일일 Cap으로 대체**: 어뷰징 방지를 위해 포럼(`1,000`), 버티컬(`300`) 일일 상한 존재 (평가용 $R_f$ 기준선 역할) | 차입 불가 (기부 전용 공익 자산, 현금 거래소 상장 전제 없음) |
| **소멸·회수 위험** | 사실상 0 | 보유 잔액 자체의 자연 감가는 없음 (단, 예측 베팅 실패 시 **의사결정 비용**으로 소멸) | 미사용 장기간 방치 시 **MoneyWave2 재분배**로 잔액 감소 가능 |

---

## 3. 왜 승자독식 소멸에도 불구하고 PMP는 $R_f$ 인가?

2026~2027년 개편에서 `Prediction`은 실패 시 `PMP`가 소멸되는 승자독식 구조로 확정되었습니다. 그럼에도 `PMP`가 포트폴리오 이론상 **$R_f$ (무위험 기준 자산)**로 기능하는 이유는 다음과 같습니다.

1. **획득 단계의 무위험성 (Zero-Variance Accumulation)**
   - 포럼 숙의, 광고 시청, `Housing-Pro` 기출 O/X 학습에 시간을 투입할 때 지급되는 `PMP`량은 시장 변동성과 무관하게 결정론적(Deterministic)으로 지급됩니다.
2. **행동경제학적 무위험 시드 (Kahneman-Tversky Loss Aversion 제거)**
   - 현실 화폐로 예측 시장(예: Polymarket)에 참여하면 현금 손실 공포(손실회피 계수 $\lambda \approx 2.25$) 때문에 시민이 학습을 포기합니다.
   - `PMP`는 현금 가치가 0인 대신 예측 참여권의 가치를 지니므로, **시민이 위험자산 `PMC`를 얻기 위해 위험을 감수(Prediction)하기 전 안전하게 머무는 기준점($R_f$)** 역할을 합니다.
3. **최적 자원 배분(시간 vs 예측 도전)의 기준율**
   - 시민은 일일 상한 내에서 확보한 `PMP`를 ① 안전한 커뮤니티 활동(`Challenge` 소액 내기 포함)으로 축적할지, ② 높은 경쟁률의 `Prediction` 마켓에 과감히 투입해 `PMC` 위험 프리미엄을 노릴지 선택합니다.

---

## 4. 2027년 실무 CAPM 적용 및 계량 산식

2027년 실데이터(Supabase 원장 기반)가 축적됨에 따라, 2025년의 개념적 회귀식을 실제 플랫폼 파라미터에 맞춰 아래와 같이 정교화합니다.

1. **기준 수익률 $R_f$ (PMP 기대 생성률) 산정**
   - 플랫폼 정책 테이블(`forum-pmp-policy.ts`, 버티컬 보상률, 광고 단가)로부터 단위 시간(1분/1건)당 확정 지급되는 `PMP` 획득률을 기준치 $R_f$로 정의합니다.
2. **`PMC` 실현 수익률 $R_{PMC, t}$ 계측**
   - 기간 $t$에서 예측 마켓 $i$에 투입된 $PMP_{i,t}$ 대비 정산된 순수 `MoneyWave` 보상 $PMC_{i,t}$의 전환 효율을 측정합니다:
     $$R_{PMC, t} = \frac{\sum_i PMC_{i,t}^{\text{earned}}}{\sum_i PMP_{i,t}^{\text{wagered}}} \times \text{EAT Index}_t$$
   - 단, `calculate_reward_amount`의 **무경쟁 가드(참여자 $\ge 2$, 반대편 풀 $> 0$)**를 통과한 유효 마켓만 표본에 포함합니다.
3. **베타($\beta$) 및 시장 위험 프리미엄 추정**
   - 전체 플랫폼 `EAT` 증가율(광고 수익 + 버티컬 B2B 마진 성장률)을 시장 포트폴리오 수익률 $R_{M,t}$로 두고, 카테고리별(경제·스포츠·엔터·정치·시민제안) 마켓의 민감도 $\beta_k$를 회귀 추정합니다:
     $$R_{PMC, k, t} - R_f = \alpha_k + \beta_k (R_{M, t} - R_f) + \epsilon_{k,t}$$
   - **해석**:
     - $\alpha_k > 0$: 해당 예측 카테고리가 단순 시장 유동성(`EAT` 증가) 이상으로 **시민의 집단지성 학습·초과 예측력**을 발휘하고 있음을 의미합니다.
     - $\beta_k > 1$: `MoneyWave` 풀 크기 변동에 민감한 고경쟁·고보상 마켓(예: 대형 스포츠 결승, 대선, 미국증시).
     - $\beta_k < 1$: 꾸준한 정보 해석력이 보상으로 이어지는 방어적·안정적 마켓(예: 공공지표, 법안 통과).

---

## 5. 2027 실무 운영 체크리스트

- [ ] **정책 변경 시 $R_f$ 재보정**: `FORUM_DAILY_MAX_PMP`(`1,000`)나 버티컬 일일 상한(`300`), 광고 보상 단가 조정 시 기준 $R_f$ 시계열에 구조적 단절(Structural Break) 더미를 반영한다.
- [ ] **`EAT` 실집계 연동 후 $\beta$ 추정**: 초기 시드(`모두의창업` 및 고정 `POSMUL_ANNUAL_EAT_POOL`) 구간과 실광고 `EAT` 변동 구간을 분리하여 회귀분석한다.
- [ ] **무경쟁·단독 베팅 표본 제거**: 0 PMC 정산된 무경쟁 게임은 유동성 필터링으로 별도 분류해 통계 왜곡을 막는다.
- [ ] **사회적 효용($\gamma$)과 결합**: 2027년 Phase 2 `미래꿈기부` 및 `K-물품기부` 데이터가 쌓이면, `PMC` 보유 후 **기부 전환까지의 체류 시간(Velocity)**을 `MoneyWave2` 회수 주기 최적화에 활용한다.
