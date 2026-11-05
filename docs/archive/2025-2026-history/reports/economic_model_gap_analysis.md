# Economic Model vs Codebase Gap Analysis Report

> **분석 기준일**: 2025-12-30
> **비교 대상**: `docs/concepts/refined_economic_model.md` vs `src/bounded-contexts/**/*`

---

## 1. 🚦 직관적 요약 (Executive Summary)

| 도메인 | 역할 (Role) | 코드 구현율 | 상태 | 비고 |
| :--- | :--- | :--- | :--- | :--- |
| **Prediction** | **변환 엔진** (PMP -> PMC) | 🔵 **90%** | **양호** | 핵심 로직(베팅, 위험평가, 보상계산) 구현 완료 |
| **Consume** | **PMP 충전 / PMC 소비** | 🔴 **20%** | **위험** | `Investment`(펀딩)만 있고, 핵심인 `Major`(광고)와 `Minor`(로컬) 전무 |
| **Forum** | **PMP 채굴 (활동)** | 🟡 **40%** | **보통** | 게시판 기능은 있으나, 활동 시 PMP 지급 로직 연결 미흡 |
| **Economy** | **경제 커널 (Ledger)** | 🟢 **80%** | **안정** | 잔액 관리 및 트랜잭션 커널 동작 중 |

---

## 2. 🔍 상세 분석 (Detailed Analysis)

### 2.1 🔵 Prediction Domain (Conversion Engine)
> **Model**: PMP를 베팅하여 리스크를 감수하고 PMC로 변환한다.

- **[O] PMP Consumption**: `PredictionEconomicService.checkPmpParticipationEligibility` 및 `processParticipation` 구현됨 (PMP 잔액 확인 및 차감).
- **[O] PMC Conversion**: `calculatePmcReward`에서 CAPM/Agency Theory 등 복잡한 경제 모델을 통해 보상량 산출 로직 존재.
- **[O] Event Publishing**: `PredictionParticipationEvent`, `PmcEarnedEvent` 발행 로직 존재하며 `Assessment` 컨텍스트 등 타 도메인과 연동 준비됨.

### 2.2 🔴 Consume Domain (Major & Minor Leagues)
> **Model**: 광고(Major)로 PMP를 벌고, 로컬 소비(Minor)로 PMC를 번다.

- **[X] Major League (Ads)**:
    - **코드 부재**: `AdCampaign`, `AdView` 등의 엔티티나 서비스가 `consume` 내부에 흔적만 있고 실체가 없음.
    - **갭**: 광고 시청 시 PMP를 지급하는 `AdViewService` 및 관련 UI 전무함.
- **[X] Minor League (Local Pay)**:
    - **코드 부재**: `Merchant` 엔티티는 있으나, QR/NFC 결제 및 리워드 지급 로직(`PaymentRewardService`) 없음.
    - **갭**: 로컬 결제 시 PMC 리워드를 주는 핵심 루프가 누락됨.
- **[O] Investment (CrowdFunding)**:
    - `InvestmentEconomicService` 존재. PMP/PMC를 사용하여 투자하는 로직은 유일하게 구현되어 있음.

### 2.3 🟡 Forum Domain (Mining)
> **Model**: 글 쓰고, 댓글 달면 PMP를 번다.

- **[?] Mining Logic**: `Forum` 컨텍스트 코드는 존재하나, 게시글 작성 시 `EconomyKernel`을 호출하여 PMP를 지급하는 '보상 로직'이 명시적으로 보이지 않음.
- **갭**: 단순 CRUD만 있고 "경제적 인센티브" 연결 고리가 빠져있을 가능성 높음.

---

## 3. 🛠️ 작업 우선순위 제안 (Action Plan)

코드 기준 갭을 메우기 위해 당장 필요한 작업을 우선순위별로 나열합니다.

### Priority 1: Missing Link 구현 (Major League)
`Prediction`은 베팅을 하려고 기다리는데, 총알(PMP)을 공급해줄 `Major League`가 없습니다.
1.  **`Major League` 도메인 로직 구현**: `Consume` 내부에 `AdService` 생성 (광고 시청 -> PMP 지급).
2.  **광고 UI (PmpStation)**: 예측 페이지에서 바로 접근 가능한 광고 시청 모달 구현.

### Priority 2: Reward Loop 연결 Forum
유저가 당장 할 수 있는 활동(글쓰기)에 보상을 연결해야 초기 PMP 공급이 원활해집니다.
1.  **Forum Reward**: 게시글 작성 = 10 PMP, 댓글 = 1 PMP 등 단순 보상 로직 연결.

### Priority 3: Local Value Chain (Minor League)
오프라인 연동이 필요한 `Minor League`는 가장 나중에 구현해도 됩니다 (QR 등 인프라 필요).
1.  일단 `Ad-Prediction` 사이클을 먼저 돌리는 것에 집중.

---

**결론**: `refined_economic_model.md`의 그림을 완성하려면 **Consume 도메인의 "Major League (광고)" 구현이 시급합니다.**
