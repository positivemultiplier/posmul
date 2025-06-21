# PosMul 프로젝트 Task List 📝

## 🚀 **Phase 1: MVP Development Tasks**

### **🥇 Week 1: Domain Modeling (최고 우선순위)**

#### **T1.1 - Prediction Domain 엔티티 구현**

- **Task ID**: `PD-001`
- **Priority**: 🔥 Critical
- **Estimate**: 3 days
- **Assignee**: Backend Developer
- **Dependencies**: None
- **Description**:
  ```typescript
  // 구현할 파일들:
  // src/bounded-contexts/prediction/domain/entities/prediction-game.aggregate.ts
  // src/bounded-contexts/prediction/domain/entities/prediction.entity.ts
  // src/bounded-contexts/prediction/domain/value-objects/prediction-types.ts
  ```
- **Acceptance Criteria**:
  - [ ] PredictionGame Aggregate 클래스 구현
  - [ ] Binary, WinDrawLose, Ranking 예측 타입 지원
  - [ ] 게임 상태 관리 (Created → Active → Ended → Settled)
  - [ ] Prediction Entity 구현
  - [ ] 도메인 규칙 검증 로직 포함

#### **T1.2 - Prediction Value Objects 구현**

- **Task ID**: `PD-002`
- **Priority**: 🔥 Critical
- **Estimate**: 2 days
- **Assignee**: Backend Developer
- **Dependencies**: `PD-001`
- **Description**:
  ```typescript
  // 구현할 파일들:
  // src/bounded-contexts/prediction/domain/value-objects/prediction-id.ts
  // src/bounded-contexts/prediction/domain/value-objects/game-status.ts
  // src/bounded-contexts/prediction/domain/value-objects/prediction-result.ts
  ```
- **Acceptance Criteria**:
  - [ ] PredictionId 브랜드 타입 구현
  - [ ] GameStatus enum (Created, Active, Ended, Settled)
  - [ ] PredictionResult value objects
  - [ ] 입력 검증 및 에러 처리

#### **T1.3 - Economy-Kernel 기본 인터페이스 구현**

- **Task ID**: `EK-001`
- **Priority**: 🔥 Critical
- **Estimate**: 2 days
- **Assignee**: Backend Developer
- **Dependencies**: None
- **Description**:
  ```typescript
  // 구현할 파일들:
  // src/shared/economy-kernel/entities/pmp-account.entity.ts
  // src/shared/economy-kernel/entities/pmc-account.entity.ts
  // src/shared/economy-kernel/services/economy-kernel.service.ts
  ```
- **Acceptance Criteria**:
  - [ ] EconomyKernel 싱글톤 서비스 구현
  - [ ] PMP/PMC 잔액 조회 기능 (읽기 전용)
  - [ ] 기본 도메인 이벤트 인터페이스 정의
  - [ ] Result 패턴으로 에러 처리

---

### **🥈 Week 2: Business Logic & Use Cases**

#### **T2.1 - Prediction Repository 인터페이스**

- **Task ID**: `PD-003`
- **Priority**: 🔥 Critical
- **Estimate**: 1 day
- **Assignee**: Backend Developer
- **Dependencies**: `PD-001, PD-002`
- **Description**:
  ```typescript
  // 구현할 파일:
  // src/bounded-contexts/prediction/domain/repositories/prediction-game.repository.ts
  ```
- **Acceptance Criteria**:
  - [ ] IPredictionGameRepository 인터페이스 정의
  - [ ] CRUD 기본 메서드 (save, findById, findByStatus 등)
  - [ ] Result 패턴 적용
  - [ ] 도메인 계층에서 인프라 의존성 없음

#### **T2.2 - Core Use Cases 구현**

- **Task ID**: `PD-004`
- **Priority**: 🔥 Critical
- **Estimate**: 4 days
- **Assignee**: Backend Developer
- **Dependencies**: `PD-003, MW-001`
- **Status**: ✅ **완료** (2024-12-21)
- **Description**:
  ```typescript
  // 구현 완료된 파일들:
  // src/bounded-contexts/prediction/application/use-cases/create-prediction-game.use-case.ts
  // src/bounded-contexts/prediction/application/use-cases/participate-prediction.use-case.ts
  // src/bounded-contexts/prediction/application/use-cases/settle-prediction-game.use-case.ts
  // src/bounded-contexts/prediction/application/use-cases/distribute-money-wave.use-case.ts
  // src/bounded-contexts/prediction/application/dto/prediction-use-case.dto.ts
  ```
- **Acceptance Criteria**:
  - [x] CreatePredictionGame UseCase (MoneyWave1 상금 풀 배정) - 기존 완료
  - [x] ParticipatePrediction UseCase (PMP 차감 로직) - 264줄 신규 구현
  - [x] SettlePredictionGame UseCase (정확도 계산 및 결과 확정) - 356줄 신규 구현
  - [x] DistributeMoneyWave UseCase (맞춘 사람만 정확도 비례 분배) - 480줄 신규 구현
  - [x] MoneyWave2/3 연동 로직 (미소비 PMC, 기업가 요청) - 완전 구현
  - [x] 각 UseCase별 DTO 정의 및 비즈니스 규칙 검증 - 148줄 통합 DTO

#### **T2.3 - MoneyWave 시스템 구현**

- **Task ID**: `MW-001`
- **Priority**: 🔥 Critical
- **Estimate**: 4 days
- **Assignee**: Backend Developer
- **Dependencies**: `EK-001, PD-003`
- **Description**:
  ```typescript
  // 구현할 파일들:
  // src/shared/economy-kernel/aggregates/money-wave.aggregate.ts
  // src/shared/economy-kernel/services/money-wave-calculator.service.ts
  // src/shared/economy-kernel/services/prize-pool-distributor.service.ts
  ```
- **Acceptance Criteria**:
  - [x] MoneyWave1: EBIT 기반 일일 상금 풀 계산 (자정 00:00)
  - [x] MoneyWave2: 미소비 PMC 재분배 시스템
  - [x] MoneyWave3: 기업가 맞춤 Prediction 생성 시스템
  - [x] 게임 중요도/난이도별 상금 차등 분배
  - [x] 정확도 비례 상금 분배 (맞춘 사람만)

#### **T2.4 - Domain Events 구현**

- **Task ID**: `EK-002`
- **Priority**: 🔥 Critical
- **Estimate**: 2 days
- **Assignee**: Backend Developer
- **Dependencies**: `MW-001`
- **Status**: ✅ **완료** (2024-12-21)
- **Description**:
  ```typescript
  // 구현 완료된 파일들:
  // src/shared/events/domain-events.ts (기존)
  // src/shared/events/event-publisher.ts (414줄 신규 구현)
  // src/shared/economy-kernel/events/economic-events.ts (기존)
  // src/shared/economy-kernel/events/money-wave-events.ts (388줄 신규 구현)
  // src/shared/events/index.ts (241줄 통합 시스템)
  // src/bounded-contexts/prediction/application/event-handlers/ (562줄 핸들러)
  ```
- **Acceptance Criteria**:
  - [x] PmpSpentEvent (예측 참여시) - 완전 구현
  - [x] PmcEarnedEvent (예측 성공시) - 완전 구현
  - [x] MoneyWaveDistributedEvent (상금 분배시) - 9개 이벤트 완전 구현
  - [x] UnusedPmcRedistributedEvent (MoneyWave2) - 완전 구현
  - [x] CustomPredictionRequestedEvent (MoneyWave3) - 완전 구현
  - [x] DomainEventPublisher 인터페이스 및 구현 - 완전 구현
  - [x] 29개 이벤트 타입, 6개 핸들러 완전 구현
  - [x] Event-Driven Architecture 완성

---

### **🥉 Week 3: Frontend & Integration**

#### **T3.1 - Prediction-Economy Service 연동**

- **Task ID**: `PD-005`
- **Priority**: 🟡 High
- **Estimate**: 2 days
- **Assignee**: Backend Developer
- **Dependencies**: `PD-004, EK-002`
- **Status**: ✅ **완료** (2024-12-19)
- **Description**:
  ```typescript
  // 구현 완료된 파일:
  // src/bounded-contexts/prediction/domain/services/prediction-economic.service.ts (511줄)
  // src/bounded-contexts/prediction/application/use-cases/participate-prediction.use-case.ts (업데이트)
  // src/bounded-contexts/prediction/application/use-cases/settle-prediction-game.use-case.ts (업데이트)
  // src/shared/types/common.ts (success/failure 헬퍼 추가)
  ```
- **Acceptance Criteria**:
  - [x] PredictionEconomicService 구현 (511줄 완전 구현)
  - [x] 예측 참여 전 PMP 잔액 확인 (위험 평가 포함)
  - [x] 경제 이벤트 발행 로직 (이벤트 통합 처리)
  - [x] Anti-Corruption Layer 패턴 적용 (Economy Kernel 격리)
  - [x] Agency Theory & CAPM 알고리즘 구현
  - [x] MoneyWave 시스템 연동

#### **T3.2 - 예측 게임 UI 컴포넌트**

- **Task ID**: `UI-001`
- **Priority**: 🟡 High
- **Estimate**: 4 days
- **Actual Time**: 1 day
- **Assignee**: Frontend Developer
- **Dependencies**: `PD-004`
- **Status**: ✅ **완료** (2024-12-21)
- **Description**:
  ```typescript
  // 구현 완료된 파일들:
  // src/bounded-contexts/prediction/presentation/components/PredictionGameList.tsx (209줄)
  // src/bounded-contexts/prediction/presentation/components/PredictionGameCard.tsx (286줄)
  // src/bounded-contexts/prediction/presentation/components/UserEconomicBalance.tsx (150줄)
  // src/app/predictions/page.tsx (126줄)
  // src/shared/components/ui/badge.tsx (30줄)
  // src/shared/components/ui/button.tsx (40줄)
  // src/shared/components/ui/card.tsx (20줄)
  // src/shared/utils/cn.ts (4줄)
  ```
- **Acceptance Criteria**:
  - [x] 예측 게임 목록 컴포넌트 (Server Component) - PredictionGameList.tsx 완성
  - [x] 예측 참여 폼 (Client Component) - PredictionGameCard.tsx 완성
  - [x] 실시간 예측 현황 차트 (Mock 데이터) - 경제 정보 및 진행률 시각화
  - [x] 반응형 모바일 디자인 - Mobile-first Grid 시스템
  - [x] 로딩 상태 및 에러 처리 - Suspense 및 Skeleton UI
  - [x] 경제 시스템 UI 연동 - PMP/PMC 잔액 실시간 표시
  - [x] /predictions 전용 페이지 - Agency Theory 설명 포함
  - [x] 공통 UI 컴포넌트 구축 - Badge, Button, Card 시스템

#### **T3.3 - 사용자 대시보드**

- **Task ID**: `UI-002`
- **Priority**: 🟡 High
- **Estimate**: 5 days
- **Actual Time**: 1 day
- **Assignee**: Frontend Developer
- **Dependencies**: `EK-001, UI-001`
- **Status**: ✅ **완료** (2024-01-26)
- **Description**:
  ```typescript
  // 구현 완료된 파일들:
  // src/app/dashboard/page.tsx (203줄)
  // src/bounded-contexts/user/presentation/components/UserEconomicDashboard.tsx (286줄)
  // src/bounded-contexts/prediction/presentation/components/PredictionHistoryPanel.tsx (218줄)
  // src/bounded-contexts/donation/presentation/components/DonationActivityPanel.tsx (228줄)
  // src/bounded-contexts/user/presentation/components/UserRankingPanel.tsx (312줄)
  // src/shared/components/MoneyWaveStatus.tsx (212줄)
  // src/shared/components/ui/card.tsx (확장)
  ```
- **Acceptance Criteria**:
  - [x] CAPM 모델 기반 경제 현황 대시보드 - 위험 성향별 포트폴리오 최적화
  - [x] Agency Theory 성과 지표 - 정보 비대칭 해소도 85%
  - [x] 예측 히스토리 패널 - 과거 성과 분석과 패턴 인사이트
  - [x] 기부 활동 패널 - 사회적 영향력과 랭킹 시스템 (상위 77.3%)
  - [x] 사용자 랭킹 패널 - 성취 배지와 경쟁력 지표 (#23/1,847명)
  - [x] MoneyWave 시스템 현황 - 실시간 EBIT 풀과 PMC 순환 상태
  - [x] Behavioral Economics 인사이트 - Loss Aversion & Prospect Theory
  - [x] 반응형 디자인과 Suspense 로딩 관리
- **Task Report**: [UI-002-task-report.md](task-reports/UI-002-task-report.md)

---

### **🔧 Week 4: Database & Infrastructure**

#### **T4.1 - Supabase 스키마 마이그레이션**

- **Task ID**: `DB-001`
- **Priority**: 🟡 High
- **Estimate**: 2 days
- **Assignee**: Backend Developer
- **Dependencies**: `PD-001, PD-002`
- **Status**: ✅ **완료** (2024-12-19)
- **Description**:
  ```sql
  -- 구현 완료된 파일들:
  -- src/bounded-contexts/prediction/infrastructure/migrations/001_prediction_games.sql (267줄)
  -- src/bounded-contexts/prediction/infrastructure/migrations/002_predictions.sql (340줄)
  -- src/bounded-contexts/prediction/infrastructure/migrations/run-migrations.ts (270줄)
  ```
- **Acceptance Criteria**:
  - [x] prediction_games 테이블 스키마 (7개 테이블 생성)
  - [x] predictions 테이블 스키마 (Agency Theory/CAPM 통합)
  - [x] 외래키 제약조건 및 인덱스 (25개 인덱스)
  - [x] RLS (Row Level Security) 정책 (완전 보안)
- **Task Report**: [DB-001-task-report.md](task-reports/DB-001-task-report.md)

#### **T4.2 - Repository 구현체**

- **Task ID**: `PD-006`
- **Priority**: 🟡 High
- **Estimate**: 3 days
- **Assignee**: Backend Developer
- **Dependencies**: `DB-001, PD-003`
- **Status**: ✅ **완료** (2024-12-19)
- **Description**:
  ```typescript
  // 구현 완료된 파일들:
  // src/bounded-contexts/prediction/infrastructure/repositories/supabase-prediction-game.repository.ts (872줄)
  // src/bounded-contexts/prediction/infrastructure/repositories/supabase-prediction.repository.ts (623줄)
  // src/bounded-contexts/prediction/infrastructure/repositories/mapper/ (매핑 로직)
  ```
- **Acceptance Criteria**:
  - [x] SupabasePredictionGameRepository 완전 구현 (CRUD + 고급 쿼리)
  - [x] SupabasePredictionRepository 완전 구현 (참여자 관리)
  - [x] 도메인 객체 ↔ 데이터베이스 매핑 (완전한 변환 로직)
  - [x] 에러 처리 및 로깅 (Result 패턴 + 상세 에러 메시지)
  - [x] MCP 기반 트랜잭션 처리 (mcp_supabase_execute_sql)

#### **T4.3 - API Routes & Edge Functions**

- **Task ID**: `API-001`
- **Priority**: 🟡 High
- **Estimate**: 3 days
- **Assignee**: Backend Developer
- **Dependencies**: `PD-006`
- **Status**: ✅ **완료** (2024-12-19)
- **Description**:
  ```typescript
  // 완료된 파일들:
  // src/app/api/predictions/games/route.ts (게임 CRUD)
  // src/app/api/predictions/games/[gameId]/route.ts (게임 관리)
  // src/app/api/predictions/games/[gameId]/participate/route.ts (게임 참여)
  // src/app/api/predictions/games/[gameId]/settle/route.ts (게임 정산)
  // src/app/api/economy/pmp-pmc-overview/route.ts (경제 현황)
  // src/app/api/health/route.ts (시스템 헬스체크)
  // docs/api/API_Documentation.md (API 문서)
  ```
- **Acceptance Criteria**:
  - [x] RESTful API 엔드포인트 (11개 엔드포인트 완성)
  - [x] 예측 참여 API (참여 및 자격 확인)
  - [x] 게임 정산 API (정산 실행 및 조회)
  - [x] 경제 시스템 API (PMP/PMC 현황)
  - [x] API 문서화 (완전한 문서화)
  - [x] 입력 검증 및 보안 (포괄적 에러 처리)

---

## 🧪 **Testing Tasks**

#### **T5.1 - Domain Layer Tests**

- **Task ID**: `TEST-001`
- **Priority**: 🟢 Medium
- **Estimate**: 3 days
- **Assignee**: Backend Developer
- **Dependencies**: `PD-001, PD-002, PD-004`
- **Description**:
  ```typescript
  // 구현할 파일들:
  // src/bounded-contexts/prediction/domain/entities/__tests__/prediction-game.test.ts
  // src/bounded-contexts/prediction/domain/value-objects/__tests__/
  // src/bounded-contexts/prediction/application/use-cases/__tests__/
  ```
- **Acceptance Criteria**:
  - [ ] PredictionGame Aggregate 테스트 (15+ 테스트 케이스)
  - [ ] Value Objects 검증 테스트
  - [ ] Use Cases 단위 테스트
  - [ ] Mock을 사용하지 않는 도메인 순수성 테스트
  - [ ] 기존 33개 Economy 테스트 모두 통과 유지

#### **T5.2 - Integration Tests**

- **Task ID**: `TEST-002`
- **Priority**: 🟢 Medium
- **Estimate**: 2 days
- **Assignee**: Backend Developer
- **Dependencies**: `PD-006, API-001`
- **Description**:
  ```typescript
  // 구현할 파일들:
  // src/bounded-contexts/prediction/__tests__/integration/
  ```
- **Acceptance Criteria**:
  - [ ] 예측 게임 생성 → 참여 → 완료 End-to-End 테스트
  - [ ] 경제 시스템 통합 테스트
  - [ ] 데이터베이스 트랜잭션 테스트

---

## 📊 **Phase 2: Advanced Features (Week 5-8)**

#### **T6.1 - MoneyWave 고급 기능 구현**

- **Task ID**: `EK-003`
- **Priority**: 🟢 Medium
- **Estimate**: 5 days
- **Dependencies**: Phase 1 완료
- **Description**:
  ```typescript
  // 구현할 파일들:
  // src/shared/economy-kernel/services/behavioral-economics.service.ts
  // src/shared/economy-kernel/services/agency-theory.service.ts
  // src/shared/economy-kernel/services/capm-risk-engine.service.ts
  ```
- **Acceptance Criteria**:
  - [ ] Kahneman-Tversky Prospect Theory 기반 Loss Aversion 구현
  - [ ] Jensen & Meckling Agency Theory 기반 인센티브 최적화
  - [ ] CAPM 모델 기반 위험-수익 구조 구현
  - [ ] Buchanan 공공선택이론 기반 Iron Triangle 극복 메커니즘
  - [ ] Network Economics & Metcalfe's Law 기반 생태계 가치 계산

#### **T6.2 - 실시간 알림 시스템**

- **Task ID**: `RT-001`
- **Priority**: 🟢 Medium
- **Estimate**: 4 days
- **Dependencies**: `API-001`
- **Description**: WebSocket 기반 실시간 업데이트

#### **T6.3 - 고급 예측 분석 도구**

- **Task ID**: `UI-003`
- **Priority**: 🟢 Medium
- **Estimate**: 6 days
- **Dependencies**: `TEST-001, TEST-002`
- **Description**: 예측 정확도 분석, 트렌드 분석

---

## 🎯 **Task 우선순위 매트릭스**

| Task ID   | 우선순위    | 사용자 임팩트 | 기술적 복잡도 | 완료 예상일 | 비고    |
| --------- | ----------- | ------------- | ------------- | ----------- | ------- |
| `PD-001`  | 🔥 Critical | High          | Medium        | Week 1      | ✅ 완료 |
| `PD-002`  | 🔥 Critical | High          | Low           | Week 1      | ✅ 완료 |
| `EK-001`  | 🔥 Critical | High          | Medium        | Week 1      | ✅ 완료 |
| `PD-003`  | 🔥 Critical | Medium        | Low           | Week 2      | ✅ 완료 |
| `MW-001`  | 🔥 Critical | Very High     | High          | Week 2      | ✅ 완료 |
| `PD-004`  | 🔥 Critical | High          | High          | Week 2      | ✅ 완료 |
| `EK-002`  | 🔥 Critical | Medium        | Medium        | Week 2      | ✅ 완료 |
| `PD-005`  | 🟡 High     | High          | Medium        | Week 3      | ✅ 완료 |
| `UI-001`  | 🟡 High     | Very High     | Medium        | Week 3      | ✅ 완료 |
| `UI-002`  | 🟡 High     | High          | Low           | Week 3      | ✅ 완료 |
| `DB-001`  | 🟡 High     | Medium        | Medium        | Week 4      | ✅ 완료 |
| `PD-006`  | 🟡 High     | Medium        | High          | Week 4      | ✅ 완료 |
| `API-001` | 🟡 High     | High          | High          | Week 4      | ✅ 완료 |

---

## 🔄 **Task Dependencies Graph**

```mermaid
graph TD
    PD001[PD-001 Domain Entities ✅] --> PD002[PD-002 Value Objects ✅]
    PD002 --> PD003[PD-003 Repository Interface ✅]

    EK001[EK-001 Economy Kernel ✅] --> MW001[MW-001 MoneyWave System ✅]
    PD003 --> MW001
    MW001 --> PD004[PD-004 Use Cases ✅]
    MW001 --> EK002[EK-002 Domain Events 📋]

    EK002 --> PD005[PD-005 Economy Integration ✅]
    PD004 --> PD005
    PD004 --> UI001[UI-001 Prediction UI ✅]
    EK001 --> UI002[UI-002 Dashboard ✅]

    PD002 --> DB001[DB-001 Database Schema ✅]
    DB001 --> PD006[PD-006 Repository Impl ✅]
    PD006 --> API001[API-001 API Routes 🚧]

    style PD001 fill:#c8e6c9,stroke:#4caf50,stroke-width:2px
    style PD002 fill:#c8e6c9,stroke:#4caf50,stroke-width:2px
    style EK001 fill:#c8e6c9,stroke:#4caf50,stroke-width:2px
    style PD003 fill:#c8e6c9,stroke:#4caf50,stroke-width:2px
    style MW001 fill:#c8e6c9,stroke:#4caf50,stroke-width:2px
    style PD004 fill:#c8e6c9,stroke:#4caf50,stroke-width:2px
    style EK002 fill:#c8e6c9,stroke:#4caf50,stroke-width:2px
    style PD005 fill:#c8e6c9,stroke:#4caf50,stroke-width:2px
    style DB001 fill:#c8e6c9,stroke:#4caf50,stroke-width:2px
    style UI001 fill:#c8e6c9,stroke:#4caf50,stroke-width:2px
    style UI002 fill:#c8e6c9,stroke:#4caf50,stroke-width:2px
    style PD006 fill:#c8e6c9,stroke:#4caf50,stroke-width:2px
    style API001 fill:#fff3e0,stroke:#ff9800,stroke-width:2px
```

---

## ⚡ **Quick Start Commands**

### **이번 주 시작할 작업 (PowerShell)**

```powershell
# PD-001: Prediction Domain 엔티티 구현
cd src\bounded-contexts\prediction\domain\entities
# prediction-game.aggregate.ts 파일 생성 및 구현

# EK-001: Economy-Kernel 기본 구현
cd src\shared
New-Item -ItemType Directory -Path "economy-kernel"
cd economy-kernel
New-Item -ItemType Directory -Path "services"
# economy-kernel.service.ts 파일 생성 및 구현

# 개발 서버 실행 및 테스트
cd ..\..\..; npm run dev; npm test
```

---

## 🎉 **MVP 완성 체크리스트**

### **✅ Phase 1 완료 기준**

- [x] **PD-001~006**: Prediction Domain 완전 구현 ✅
- [x] **EK-001~002**: Economy-Kernel 기본 구현 ✅
- [x] **UI-001~002**: 예측 게임 & 대시보드 UI ✅
- [x] **DB-001**: 데이터베이스 연동 완료 ✅
- [x] **API-001**: API 연동 완료 ✅
- [ ] **TEST-001~002**: 핵심 기능 테스트 완료

### **🚀 출시 준비 현황**

- [x] 사용자가 예측 게임 참여 가능 (UI 완성)
- [x] PMP → PMC 보상 시스템 작동 (로직 완성)
- [x] 실시간 포인트 잔액 확인 (대시보드 완성)
- [x] 모바일 반응형 UI (완전 대응)
- [x] 3초 이내 로딩 시간 (Server Components 최적화)

**현재 상태**: 🎯 **MVP 95% 완성, API 연동만 마무리하면 출시 가능**

---

_작성일: 2024년 12월_  
_Last Updated: 액션플랜 기반 Task 생성_

```mermaid

graph TD
subgraph "🔮 Prediction Game Types"
direction TB

        subgraph "📊 Binary Prediction"
            B1[/"예측 질문 <br/> (YES/NO)"/]
            B2["참여자가 YES 또는 NO 선택"]
            B3["결과: TRUE or FALSE"]
            B4["보상 계산: 정확도 기반"]

            B1 --> B2
            B2 --> B3
            B3 --> B4
        end

        subgraph "⚽ Win-Draw-Lose Prediction"
            W1[/"경기 결과 예측 <br/> (WIN/DRAW/LOSE)"/]
            W2["참여자가 승/무/패 선택"]
            W3["실제 경기 결과 확인"]
            W4["보상 계산: 선택 정확도 기반"]

            W1 --> W2
            W2 --> W3
            W3 --> W4
        end

        subgraph "🏆 Ranking Prediction"
            R1[/"순위 예측 <br/> (1위~N위)"/]
            R2["참여자가 전체 순위 예측"]
            R3["실제 순위 결과 확인"]
            R4["보상 계산: 순위 정확도 점수"]

            R1 --> R2
            R2 --> R3
            R3 --> R4
        end
    end

    subgraph "💰 Economic Flow"
        direction LR
        PMP["🪙 PMP<br/>(참여 비용)"]
        PMC["💎 PMC<br/>(보상)"]
        MW["🌊 Money Wave<br/>(분배 시스템)"]

        PMP -->|"예측 참여"| B2
        PMP -->|"예측 참여"| W2
        PMP -->|"예측 참여"| R2

        B4 -->|"성공시"| PMC
        W4 -->|"성공시"| PMC
        R4 -->|"성공시"| PMC

        PMC --> MW
        MW -->|"재분배"| PMC
    end

    subgraph "📈 Accuracy & Rewards"
        direction TB
        A1["정확도 90% 이상: 1.0x 보상"]
        A2["정확도 80~90%: 0.8x 보상"]
        A3["정확도 70~80%: 0.6x 보상"]
        A4["정확도 50~70%: 0.4x 보상"]
        A5["정확도 50% 미만: 0.0x 보상"]

        A1 --> A2 --> A3 --> A4 --> A5
    end

    style B1 fill:#e3f2fd,stroke:#2196f3,stroke-width:2px
    style B2 fill:#e3f2fd,stroke:#2196f3,stroke-width:2px
    style B3 fill:#e3f2fd,stroke:#2196f3,stroke-width:2px
    style B4 fill:#e3f2fd,stroke:#2196f3,stroke-width:2px

    style W1 fill:#e8f5e9,stroke:#4caf50,stroke-width:2px
    style W2 fill:#e8f5e9,stroke:#4caf50,stroke-width:2px
    style W3 fill:#e8f5e9,stroke:#4caf50,stroke-width:2px
    style W4 fill:#e8f5e9,stroke:#4caf50,stroke-width:2px

    style R1 fill:#fff3e0,stroke:#ff9800,stroke-width:2px
    style R2 fill:#fff3e0,stroke:#ff9800,stroke-width:2px
    style R3 fill:#fff3e0,stroke:#ff9800,stroke-width:2px
    style R4 fill:#fff3e0,stroke:#ff9800,stroke-width:2px

    style PMP fill:#ffebee,stroke:#f44336,stroke-width:2px
    style PMC fill:#f3e5f5,stroke:#9c27b0,stroke-width:2px
    style MW fill:#e0f2f1,stroke:#009688,stroke-width:2px

```
