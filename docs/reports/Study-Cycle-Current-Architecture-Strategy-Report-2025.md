# Study-Cycle 프로젝트 현재 아키텍처 및 전략 보고서 (2025 업데이트)

> **문서 유형**: 분석 보고서 (Analysis Report)  
> **작성 일시**: 2025-07-08  
> **작성자**: AI Assistant  
> **목표**: Monorepo + Auth-Economy SDK 통합 환경에서의 Study-Cycle 프로젝트 현재 아키텍처와 전략을 분석하고 향후 개발 방향을 제시합니다.

---

## 📑 목차

- [Study-Cycle 프로젝트 현재 아키텍처 및 전략 보고서 (2025 업데이트)](#study-cycle-프로젝트-현재-아키텍처-및-전략-보고서-2025-업데이트)
  - [📑 목차](#-목차)
  - [1. 프로젝트 진화 및 현재 위치](#1-프로젝트-진화-및-현재-위치)
    - [1.1 진화의 핵심 동력](#11-진화의-핵심-동력)
  - [2. 아키텍처 현황 분석 (Monorepo 통합)](#2-아키텍처-현황-분석-monorepo-통합)
    - [2.1 현재 프로젝트 구조](#21-현재-프로젝트-구조)
    - [2.2 Study-Cycle 내부 구조](#22-study-cycle-내부-구조)
  - [3. Auth-Economy SDK 통합 구조](#3-auth-economy-sdk-통합-구조)
    - [3.1 SDK 통합 아키텍처](#31-sdk-통합-아키텍처)
    - [3.2 경제 시스템 통합 방식](#32-경제-시스템-통합-방식)
  - [4. 핵심 기능 재정의 (SDK 기반)](#4-핵심-기능-재정의-sdk-기반)
    - [4.1 학습 보상 시스템 (PMP/PMC 연동)](#41-학습-보상-시스템-pmppmc-연동)
    - [4.2 현재 구현된 기능 매트릭스](#42-현재-구현된-기능-매트릭스)
  - [5. 기술 스택 현황](#5-기술-스택-현황)
    - [5.1 프론트엔드 (React Native)](#51-프론트엔드-react-native)
    - [5.2 백엔드 및 인프라](#52-백엔드-및-인프라)
  - [6. 개발 전략 및 로드맵](#6-개발-전략-및-로드맵)
    - [6.1 단기 개발 목표 (1-2개월)](#61-단기-개발-목표-1-2개월)
    - [6.2 중장기 전략 방향](#62-중장기-전략-방향)
    - [6.3 성공 지표 (KPI)](#63-성공-지표-kpi)
    - [6.4 리스크 및 완화 전략](#64-리스크-및-완화-전략)
  - [📊 결론 및 권장사항](#-결론-및-권장사항)
    - [핵심 성과](#핵심-성과)
    - [즉시 실행 권장사항](#즉시-실행-권장사항)
    - [장기 비전](#장기-비전)

---

## 1. 프로젝트 진화 및 현재 위치

Study-Cycle 프로젝트는 2025년 초기 컨셉에서 **PosMul Monorepo 생태계 내 통합 앱**으로 진화했습니다.

```mermaid
graph TB
    subgraph "2025 초기 컨셉"
        OldConcept[독립 학습 플랫폼<br/>별도 DB + 별도 인증]
    end

    subgraph "2025 현재 상태"
        NewConcept[PosMul 생태계 통합 앱<br/>Shared SDK + 통합 경제 시스템]
    end

    subgraph "핵심 변화사항"
        Change1[🔄 독립 → 통합 생태계]
        Change2[💰 별도 포인트 → PMP/PMC 연동]
        Change3[🏗️ 단독 앱 → Monorepo 패키지]
        Change4[🔐 별도 인증 → Shared Auth]
        Change5[📱 웹 중심 → React Native 모바일]
    end

    OldConcept --> NewConcept
    NewConcept --> Change1
    NewConcept --> Change2
    NewConcept --> Change3
    NewConcept --> Change4
    NewConcept --> Change5

```

### 1.1 진화의 핵심 동력

```mermaid
pie title 진화 동력 분석
    "경제 시스템 통합" : 35
    "Monorepo 효율성" : 25
    "사용자 경험 통합" : 20
    "개발 생산성" : 20
```

**주요 변화 동력:**

- ✅ **경제 시스템 통합**: PMP/PMC를 활용한 학습 보상 체계
- ✅ **개발 효율성**: Shared SDK로 중복 개발 최소화
- ✅ **사용자 경험**: 단일 계정으로 PosMul 전체 생태계 접근
- ✅ **확장성**: 향후 다른 앱과의 크로스 플랫폼 연동

---

## 2. 아키텍처 현황 분석 (Monorepo 통합)

### 2.1 현재 프로젝트 구조

```mermaid
graph TD
    subgraph "PosMul Monorepo"
        Root[posmul-monorepo/]

        subgraph "Apps"
            WebApp[apps/posmul-web/<br/>Next.js 15]
            StudyCycleApp[apps/study-cycle/<br/>React Native 0.73]
        end

        subgraph "Shared Packages"
            AuthSDK[packages/auth-economy-sdk/<br/>통합 인증-경제 SDK]
        end

        subgraph "Database Layer"
            SupabaseDB[Supabase PostgreSQL<br/>fabyagohqqnusmnwekuc]
        end
    end

    StudyCycleApp -.->|workspace:*| AuthSDK
    WebApp -.->|workspace:*| AuthSDK
    AuthSDK --> SupabaseDB

```

### 2.2 Study-Cycle 내부 구조

```mermaid
graph TB
    subgraph "apps/study-cycle/"
        App[src/App.tsx<br/>메인 진입점]

        subgraph "Core Features"
            Features[src/features/]
            StudyCycle[study-cycle/<br/>학습 사이클 관리]
            Assessment[assessment/<br/>평가 시스템]
        end

        subgraph "Shared Components"
            Components[src/components/<br/>UI 컴포넌트]
            Shared[src/shared/<br/>공통 유틸리티]
            UseAuth[useAuthEconomy.ts<br/>SDK 통합 훅]
        end

        subgraph "Configuration"
            Config[src/config/<br/>환경 설정]
            Types[src/types/<br/>타입 정의]
            Styles[src/styles/<br/>스타일 시스템]
        end
    end

    App --> Features
    App --> Components
    Features --> StudyCycle
    Features --> Assessment
    Shared --> UseAuth
    UseAuth -.->|의존성| AuthSDK[Auth-Economy SDK]

```

---

## 3. Auth-Economy SDK 통합 구조

### 3.1 SDK 통합 아키텍처

```mermaid
flowchart TD
    subgraph "Study-Cycle App Layer"
        ReactNative[React Native App]
        StudyHook[useAuthEconomy Hook]
        StudyComponents[Study Components]
    end

    subgraph "Auth-Economy SDK"
        SDKCore[SDK Core Client]
        AuthService[Auth Service]
        EconomyService[Economy Service]
        TypeSystem[Type System]
    end

    subgraph "Database Layer"
        UserProfiles[user_profiles]
        EconomicBalances[user_economic_balances]
        ReputationMetrics[user_reputation_metrics]
        Migration[monorepo_migration_status]
    end

    subgraph "External Services"
        SupabaseAuth[Supabase Auth]
        SupabaseDB[Supabase Database]
    end

    ReactNative --> StudyHook
    StudyHook --> SDKCore
    StudyComponents --> StudyHook

    SDKCore --> AuthService
    SDKCore --> EconomyService

    AuthService --> SupabaseAuth
    EconomyService --> UserProfiles
    EconomyService --> EconomicBalances
    EconomyService --> ReputationMetrics

    SupabaseAuth --> SupabaseDB
    UserProfiles --> SupabaseDB
    EconomicBalances --> SupabaseDB
    ReputationMetrics --> SupabaseDB

```

### 3.2 경제 시스템 통합 방식

```mermaid
sequenceDiagram
    participant User as 👨‍🎓 사용자
    participant App as 📱 Study-Cycle App
    participant Hook as 🎣 useAuthEconomy
    participant SDK as 🔧 Auth-Economy SDK
    participant DB as 🐘 Supabase

    User->>App: 학습 세션 완료 (30분)
    App->>Hook: completeStudySession(30)
    Hook->>SDK: economy.addPmpReward(userId, amount)
    SDK->>DB: UPDATE user_economic_balances
    DB-->>SDK: 성공 응답
    SDK-->>Hook: PMP 증가 완료
    Hook-->>App: 경제 데이터 갱신
    App-->>User: "30 PMP 획득!" 알림 표시

    Note over Hook, SDK: React Native 최적화된<br/>오프라인 대응 포함
```

---

## 4. 핵심 기능 재정의 (SDK 기반)

### 4.1 학습 보상 시스템 (PMP/PMC 연동)

```mermaid
graph TD
    subgraph "학습 활동"
        Study[📚 학습 시간 기록]
        Practice[📝 문제 풀이]
        Review[🔄 복습 완료]
        Goal[🎯 목표 달성]
    end

    subgraph "보상 계산 엔진"
        Calculator[보상 계산기]
        TimeReward[시간 기반 PMP<br/>1분 = 0.1 PMP]
        AccuracyReward[정확도 기반 PMC<br/>90%+ = 5 PMC]
        StreakReward[연속 학습 보너스<br/>7일 = 50 PMP]
    end

    subgraph "경제 시스템 연동"
        Balance[잔액 업데이트]
        History[거래 이력]
        Ranking[랭킹 시스템]
    end

    Study --> Calculator
    Practice --> Calculator
    Review --> Calculator
    Goal --> Calculator

    Calculator --> TimeReward
    Calculator --> AccuracyReward
    Calculator --> StreakReward

    TimeReward --> Balance
    AccuracyReward --> Balance
    StreakReward --> Balance

    Balance --> History
    Balance --> Ranking

```

### 4.2 현재 구현된 기능 매트릭스

```mermaid
pie title 기능 구현 현황
    "완전 구현" : 30
    "부분 구현" : 45
    "계획 단계" : 25
```

| 기능 영역            | 구현 상태 | 완성도 | 비고                      |
| -------------------- | --------- | ------ | ------------------------- |
| **사용자 인증**      | ✅ 완료   | 95%    | SDK 기반 완전 통합        |
| **경제 시스템 연동** | ✅ 완료   | 90%    | PMP/PMC 잔액 관리         |
| **학습 시간 추적**   | 🟡 부분   | 60%    | 기본 기능 구현됨          |
| **보상 지급 시스템** | 🟡 부분   | 70%    | completeStudySession 구현 |
| **문제 풀이 엔진**   | 🔴 계획   | 20%    | 기본 구조만 존재          |
| **진도 관리**        | 🔴 계획   | 15%    | 아이디어 단계             |
| **랭킹 시스템**      | 🔴 계획   | 10%    | 미구현                    |

---

## 5. 기술 스택 현황

### 5.1 프론트엔드 (React Native)

```mermaid
graph LR
    subgraph "Mobile Framework"
        RN[React Native 0.73]
        React[React 18.2.0]
        TS[TypeScript 5.4.5]
    end

    subgraph "Development Tools"
        Metro[Metro Bundler]
        ESLint[ESLint 8.57.0]
        Prettier[Prettier 2.8.8]
        Jest[Jest 30.0.3]
    end

    subgraph "Integration Layer"
        AuthSDK[Auth-Economy SDK<br/>workspace:*]
        TestingLib[Testing Library]
    end

    RN --> React
    React --> TS
    RN --> Metro
    TS --> ESLint
    ESLint --> Prettier

    RN -.-> AuthSDK
    Jest --> TestingLib

```

### 5.2 백엔드 및 인프라

```mermaid
graph TB
    subgraph "Database Schema (Current)"
        UP[user_profiles<br/>15 columns]
        UEB[user_economic_balances<br/>14 columns]
        URM[user_reputation_metrics<br/>15 columns]
        MMS[monorepo_migration_status<br/>12 columns]
    end

    subgraph "Authentication"
        SupaAuth[Supabase Auth<br/>Row Level Security]
        Policies[RLS Policies<br/>User-based access]
    end

    subgraph "SDK Integration"
        AuthService[Auth Service]
        EconomyService[Economy Service]
        TypeGen[Type Generation<br/>MCP based]
    end

    UP --> SupaAuth
    UEB --> EconomyService
    URM --> EconomyService

    SupaAuth --> Policies
    AuthService --> SupaAuth
    EconomyService --> TypeGen

```

---

## 6. 개발 전략 및 로드맵

### 6.1 단기 개발 목표 (1-2개월)

```mermaid
gantt
    title Study-Cycle 단기 개발 로드맵
    dateFormat  YYYY-MM-DD
    section 핵심 기능 완성
    학습 시간 추적 고도화     :active,  core1, 2025-07-08, 2w
    문제 풀이 엔진 구현      :         core2, after core1, 3w
    진도 관리 시스템        :         core3, after core2, 2w

    section UI/UX 개선
    모바일 네이티브 UX      :         ui1, 2025-07-15, 3w
    다크 모드 지원         :         ui2, after ui1, 1w

    section 테스트 및 최적화
    Unit Test 구축         :         test1, 2025-07-22, 2w
    성능 최적화           :         opt1, after test1, 1w
```

### 6.2 중장기 전략 방향

```mermaid
flowchart TD
    subgraph "Phase 1: 기반 완성 (Q3 2025)"
        P1A[핵심 학습 기능 완성]
        P1B[사용자 테스트 진행]
        P1C[성능 최적화]
    end

    subgraph "Phase 2: 고도화 (Q4 2025)"
        P2A[AI 기반 학습 추천]
        P2B[소셜 기능 강화]
        P2C[오프라인 모드 지원]
    end

    subgraph "Phase 3: 확장 (Q1 2026)"
        P3A[iOS 앱 개발]
        P3B[웹 버전 연동]
        P3C[다국어 지원]
    end

    P1A --> P1B
    P1B --> P1C
    P1C --> P2A
    P2A --> P2B
    P2B --> P2C
    P2C --> P3A
    P3A --> P3B
    P3B --> P3C

```

### 6.3 성공 지표 (KPI)

```mermaid
pie title 성공 지표 가중치
    "사용자 활성도" : 30
    "학습 효과성" : 25
    "경제 시스템 참여도" : 20
    "기술적 안정성" : 15
    "사용자 만족도" : 10
```

**핵심 성과 지표:**

| 지표               | 현재 값 | 목표 값 (3개월)  | 측정 방법                  |
| ------------------ | ------- | ---------------- | -------------------------- |
| **일 활성 사용자** | 0명     | 100명            | SDK 기반 세션 추적         |
| **평균 학습 시간** | -       | 45분/일          | useAuthEconomy 훅 데이터   |
| **PMP 획득량**     | -       | 1,000 PMP/사용자 | 경제 시스템 데이터         |
| **앱 크래시율**    | -       | <1%              | React Native 크래시 리포팅 |
| **피드백 점수**    | -       | 4.2/5.0          | 앱스토어 리뷰              |

### 6.4 리스크 및 완화 전략

```mermaid
graph LR
    subgraph "주요 리스크"
        R1[사용자 채택률 저조]
        R2[성능 이슈]
        R3[SDK 의존성 문제]
        R4[경쟁 앱 출현]
    end

    subgraph "완화 전략"
        M1[베타 테스터 확보<br/>피드백 반영]
        M2[React Native 최적화<br/>성능 모니터링]
        M3[SDK 안정성 강화<br/>버전 관리]
        M4[차별화 기능 개발<br/>PMP/PMC 연동]
    end

    R1 --> M1
    R2 --> M2
    R3 --> M3
    R4 --> M4

```

---

## 📊 결론 및 권장사항

### 핵심 성과

✅ **성공적인 Monorepo 통합**: Auth-Economy SDK를 통한 효율적인 개발 환경 구축  
✅ **경제 시스템 연동**: PMP/PMC 기반의 학습 보상 체계 확립  
✅ **React Native 기반**: 모바일 네이티브 경험 제공  
✅ **타입 안전성**: TypeScript + SDK를 통한 안전한 개발

### 즉시 실행 권장사항

1. **문제 풀이 엔진 완성**: Assessment 기능의 핵심 구현
2. **UI/UX 고도화**: React Native 네이티브 컴포넌트 활용
3. **테스트 커버리지 확대**: 현재 부족한 테스트 시나리오 보완
4. **성능 최적화**: 학습 데이터 동기화 최적화

### 장기 비전

Study-Cycle은 **PosMul 생태계의 모바일 허브**로 발전하여, 사용자들이 학습을 통해 경제적 가치를 창출하고 커뮤니티에 기여할 수 있는 플랫폼으로 성장할 것입니다.

---

_본 보고서는 2025년 7월 8일 현재 상황을 기준으로 작성되었으며, 지속적인 업데이트를 통해 프로젝트 진화를 반영할 예정입니다._
