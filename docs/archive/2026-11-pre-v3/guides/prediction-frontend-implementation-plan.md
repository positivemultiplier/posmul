# PosMul Prediction 도메인 프론트엔드 구현 계획

> **목적**: PosMul 플랫폼의 Prediction 도메인 프론트엔드 개발 전략 및 구현 로드맵  
> **작성일**: 2025-06-24  
> **버전**: v1.0  
> **대상**: 프론트엔드 개발팀

## 📋 목차

1. [개요](#개요)
2. [현재 상태 분석](#현재-상태-분석)
3. [아키텍처 전략](#아키텍처-전략)
4. [컴포넌트 구현 계획](#컴포넌트-구현-계획)
5. [페이지별 구현 전략](#페이지별-구현-전략)
6. [경제 시스템 통합](#경제-시스템-통합)
7. [개발 우선순위](#개발-우선순위)
8. [일정 계획](#일정-계획)
9. [품질 관리](#품질-관리)

## 개요

PosMul Prediction 도메인은 AI 시대 직접 민주주의 플랫폼의 핵심 기능으로, **Agency Theory**와 **CAPM** 이론을 코드로 구현한 예측 게임 시스템입니다. 백엔드 도메인 로직이 충분히 구축된 상황에서, 이제 사용자 경험을 극대화하는 프론트엔드 구현에 집중해야 합니다.

```mermaid
pie title "Prediction 도메인 개발 현황"
    "백엔드 도메인 로직" : 75
    "인프라스트럭처" : 60
    "API 엔드포인트" : 45
    "프론트엔드 컴포넌트" : 25
    "사용자 인터페이스" : 15
```

### 🎯 핵심 목표

- **사용자 경험 최적화**: 직관적이고 반응성 높은 예측 게임 인터페이스
- **경제 시스템 통합**: PMP/PMC 기반 MoneyWave 시스템의 완전한 UI 구현
- **실시간 상호작용**: WebSocket 기반 실시간 예측 및 결과 업데이트
- **Agency Theory 구현**: 전문가 vs 일반인 구조의 UI 표현
- **모바일 최적화**: 반응형 디자인으로 모든 기기에서 완벽한 경험

## 현재 상태 분석

### 🔍 기존 구현 현황

```mermaid
flowchart TB
    A["현재 구현 상태"] --> B["완료된 컴포넌트"]
    A --> C["부분 구현 컴포넌트"]
    A --> D["미구현 영역"]

    B --> B1["CategoryOverviewLayout<br/>- 기본 레이아웃 구조<br/>- 통계 카드 4개<br/>- 인기 서브카테고리"]
    B --> B2["EnhancedGameCard<br/>- 게임 정보 표시<br/>- MoneyWave 진행률<br/>- 다양한 게임 타입 지원"]
    B --> B3["기본 UI 컴포넌트<br/>- Badge, Card, Button<br/>- 일관된 디자인 시스템"]

    C --> C1["PredictionDetailView<br/>- 상세 페이지 기본 구조<br/>- 참여 UI 프로토타입<br/>- 통계 표시"]
    C --> C2["Navbar<br/>- 3단계 네비게이션<br/>- 경제 잔액 표시<br/>- 동적 라우팅"]

    D --> D1["실시간 기능<br/>- WebSocket 연결<br/>- 실시간 확률 업데이트<br/>- 채팅 시스템"]
    D --> D2["고급 차트<br/>- 시장 동향 분석<br/>- 수익률 시각화<br/>- 예측 정확도 그래프"]
    D --> D3["사용자 대시보드<br/>- 개인 예측 이력<br/>- 수익률 분석<br/>- 랭킹 시스템"]

    style B1 fill:#c8e6c9
    style B2 fill:#c8e6c9
    style B3 fill:#c8e6c9
    style C1 fill:#fff3e0
    style C2 fill:#fff3e0
    style D1 fill:#ffcdd2
    style D2 fill:#ffcdd2
    style D3 fill:#ffcdd2
```

### 📊 구현 우선순위 매트릭스

```mermaid
graph LR
    A["낮은 복잡도<br/>높은 영향도"] --> B["빠른 승리<br/>Quick Wins"]
    C["높은 복잡도<br/>높은 영향도"] --> D["주요 프로젝트<br/>Major Projects"]
    E["낮은 복잡도<br/>낮은 영향도"] --> F["빈 시간 활용<br/>Fill-ins"]
    G["높은 복잡도<br/>낮은 영향도"] --> H["피해야 할 영역<br/>Avoid"]

    B --> B1["게임 목록 페이지<br/>예측 참여 플로우<br/>기본 차트 구현"]
    D --> D1["실시간 시스템<br/>고급 분석 대시보드<br/>모바일 최적화"]
    F --> F1["애니메이션 효과<br/>테마 설정<br/>접근성 개선"]
    H --> H1["복잡한 3D 차트<br/>과도한 실시간 기능<br/>불필요한 게임화"]

    style A fill:#c8e6c9
    style C fill:#fff3e0
    style E fill:#e1f5fe
    style G fill:#ffcdd2
```

## 아키텍처 전략

### 🏗️ Clean Architecture 기반 프론트엔드 구조

```mermaid
graph TB
    A["Presentation Layer"] --> B["Application Layer"]
    B --> C["Domain Layer"]
    D["Infrastructure Layer"] --> C

    A --> A1["Pages<br/>- 라우트별 페이지 컴포넌트<br/>- 레이아웃 구성"]
    A --> A2["Components<br/>- 재사용 가능한 UI 컴포넌트<br/>- 도메인별 특화 컴포넌트"]
    A --> A3["Hooks<br/>- 커스텀 훅<br/>- 상태 관리 로직"]

    B --> B1["Use Cases<br/>- 예측 참여 로직<br/>- 게임 생성/관리<br/>- 결과 조회"]
    B --> B2["Services<br/>- API 호출 추상화<br/>- 비즈니스 로직 조율"]
    B --> B3["DTOs<br/>- 데이터 전송 객체<br/>- 타입 안전성 보장"]

    C --> C1["Entities<br/>- 도메인 모델<br/>- 순수 비즈니스 로직"]
    C --> C2["Value Objects<br/>- 불변 값 객체<br/>- 유효성 검증"]

    D --> D1["Repositories<br/>- API 클라이언트<br/>- 데이터 접근 구현"]
    D --> D2["External Services<br/>- WebSocket 연결<br/>- 실시간 데이터 스트림"]

    style A fill:#e3f2fd
    style B fill:#f3e5f5
    style C fill:#e8f5e8
    style D fill:#fff3e0
```

### 🔄 데이터 흐름 아키텍처

```mermaid
sequenceDiagram
    participant U as User
    participant P as Page Component
    participant H as Custom Hook
    participant S as Service
    participant A as API
    participant W as WebSocket

    U->>P: 예측 게임 참여
    P->>H: usePredictionGame()
    H->>S: PredictionService
    S->>A: POST /api/predictions
    A-->>S: 참여 결과
    S-->>H: 상태 업데이트
    H-->>P: 리렌더링 트리거
    P-->>U: UI 업데이트

    Note over W: 실시간 업데이트
    W->>H: 확률 변동 알림
    H->>P: 실시간 데이터 반영
    P->>U: 실시간 UI 업데이트
```

## 컴포넌트 구현 계획

### 🎮 핵심 게임 컴포넌트

#### 1. PredictionGameList (게임 목록)

```typescript
// 구현 위치: src/bounded-contexts/prediction/presentation/components/
interface PredictionGameListProps {
  category?: string;
  subcategory?: string;
  filters?: GameFilters;
  sortBy?: "popularity" | "reward" | "deadline" | "difficulty";
  viewMode?: "grid" | "list";
}
```

**주요 기능:**

- 필터링 및 정렬 기능
- 무한 스크롤 또는 페이지네이션
- 게임 상태별 그룹화
- 즐겨찾기 기능

#### 2. PredictionParticipationFlow (참여 플로우)

```typescript
interface PredictionParticipationFlowProps {
  gameId: string;
  onParticipationComplete: (result: ParticipationResult) => void;
  userBalance: { pmp: number; pmc: number };
}
```

**주요 기능:**

- 단계별 참여 프로세스
- 실시간 배당률 표시
- 예상 수익 계산
- 결제 확인 및 처리

#### 3. RealTimePredictionBoard (실시간 예측 보드)

```typescript
interface RealTimePredictionBoardProps {
  gameId: string;
  showChat?: boolean;
  enableNotifications?: boolean;
}
```

**주요 기능:**

- 실시간 확률 업데이트
- 참여자 수 실시간 표시
- 채팅 기능 (선택사항)
- 알림 시스템

### 📊 분석 및 시각화 컴포넌트

#### 4. MarketTrendChart (시장 동향 차트)

```mermaid
graph LR
    A["MarketTrendChart"] --> B["Line Chart<br/>- 시간별 확률 변화<br/>- 거래량 추이"]
    A --> C["Bar Chart<br/>- 옵션별 비교<br/>- 일일 참여자 수"]
    A --> D["Pie Chart<br/>- 시장 점유율<br/>- 예측 분포"]
    A --> E["Heatmap<br/>- 시간대별 활동<br/>- 카테고리별 인기도"]


```

#### 5. UserDashboard (사용자 대시보드)

```typescript
interface UserDashboardProps {
  userId: string;
  timeRange?: "1d" | "1w" | "1m" | "1y" | "all";
  showPrivateData?: boolean;
}
```

**주요 기능:**

- 개인 예측 이력
- 수익률 분석
- 랭킹 위치
- 포트폴리오 구성

### 🔧 유틸리티 컴포넌트

#### 6. CountdownTimer (카운트다운 타이머)

```typescript
interface CountdownTimerProps {
  endTime: Date;
  onComplete?: () => void;
  format?: "full" | "compact" | "minimal";
  showMilliseconds?: boolean;
}
```

#### 7. EconomicBalanceDisplay (경제 잔액 표시)

```typescript
interface EconomicBalanceDisplayProps {
  pmpBalance: number;
  pmcBalance: number;
  showDetails?: boolean;
  showHistory?: boolean;
}
```

## 페이지별 구현 전략

### 🏠 메인 페이지 구조

```mermaid
flowchart TD
    A["/prediction"] --> B["CategoryOverviewLayout"]

    B --> C["헤더 섹션"]
    B --> D["통계 카드 4개"]
    B --> E["인기 서브카테고리"]
    B --> F["추천 게임 그리드"]

    C --> C1["예측 게임 🎯<br/>AI 시대 직접 민주주의"]

    D --> D1["총 상금 풀<br/>MoneyWave 기반"]
    D --> D2["활성 게임 수<br/>실시간 업데이트"]
    D --> D3["총 참여자 수<br/>커뮤니티 규모"]
    D --> D4["서브카테고리 수<br/>다양성 지표"]

    E --> E1["🏆 스포츠 (#1)<br/>참여자 15,420명"]
    E --> E2["🎭 엔터테인먼트 (#2)<br/>참여자 12,456명"]
    E --> E3["🏛️ 정치 (#3)<br/>참여자 8,934명"]

    F --> F1["EnhancedGameCard<br/>- 게임 정보<br/>- MoneyWave 진행률<br/>- 실시간 확률"]

    style A fill:#e3f2fd
    style B fill:#f3e5f5
    style C1 fill:#e8f5e8
    style F1 fill:#fff3e0
```

### 🎯 게임 상세 페이지

**URL**: `/prediction/[category]/[subcategory]/[gameId]`

```mermaid
graph TB
    A["게임 상세 페이지"] --> B["PredictionDetailView"]

    B --> C["게임 헤더"]
    B --> D["통계 카드 섹션"]
    B --> E["예측 참여 UI"]
    B --> F["실시간 보드"]
    B --> G["사이드바"]

    C --> C1["게임 제목 & 설명<br/>카테고리 배지<br/>제작자 정보 & 평판<br/>마감 카운트다운"]

    D --> D1["총 거래량 ($)<br/>참여자 수<br/>상금 풀 (PMC)<br/>남은 시간"]

    E --> E1["게임 타입별 옵션<br/>- Binary: 예/아니오<br/>- WDL: 승/무/패<br/>- Ranking: 순위 맞추기<br/>- MultiChoice: 다중 선택"]
    E --> E2["실시간 확률 & 배당률<br/>베팅 금액 설정<br/>예상 수익 계산<br/>참여 버튼"]

    F --> F1["실시간 확률 업데이트<br/>참여자 수 변동<br/>채팅 (선택사항)<br/>알림 시스템"]

    G --> G1["사용자 PMP/PMC 잔액<br/>시장 정보<br/>Agency Theory 설명<br/>민주적 의사결정 안내"]

    style A fill:#e3f2fd
    style B fill:#f3e5f5
    style E1 fill:#e8f5e8
    style F1 fill:#fff3e0
```

### 📱 카테고리별 페이지

```mermaid
flowchart LR
    A["/prediction/sports"] --> B["스포츠 예측"]
    A2["/prediction/entertainment"] --> B2["엔터테인먼트 예측"]
    A3["/prediction/politics"] --> B3["정치 예측"]

    B --> C["축구 ⚽<br/>야구 ⚾<br/>농구 🏀<br/>e스포츠 🎮"]
    B2 --> C2["영화 🎬<br/>음악 🎵<br/>드라마 📺<br/>예능 😂"]
    B3 --> C3["선거 🗳️<br/>정책 📋<br/>여론조사 📊<br/>국제정치 🌍"]

    C --> D["CategoryOverviewLayout<br/>서브카테고리별 통계<br/>인기 게임 표시"]
    C2 --> D
    C3 --> D

    style A fill:#e8f5e8
    style A2 fill:#fff3e0
    style A3 fill:#fce4ec
```

## 경제 시스템 통합

### 💰 PMP/PMC 기반 UI 구현

```mermaid
pie title "경제 시스템 UI 구성 요소"
    "잔액 표시" : 25
    "거래 내역" : 20
    "MoneyWave 진행률" : 20
    "수익률 계산" : 15
    "보상 시스템" : 10
    "경제 분석" : 10
```

#### 1. 경제 정보 표시 컴포넌트

```typescript
// EconomicInfoPanel.tsx
interface EconomicInfoPanelProps {
  userBalance: {
    pmp: number; // 위험 없는 자산
    pmc: number; // 위험 있는 자산
  };
  showDetails?: boolean;
  showHistory?: boolean;
  showPredictions?: boolean;
}
```

#### 2. MoneyWave 시각화

```typescript
// MoneyWaveVisualization.tsx
interface MoneyWaveVisualizationProps {
  currentWave: number;
  totalPools: number;
  distributionDate: Date;
  participatingGames: number;
  expectedMultiplier: number;
}
```

#### 3. 수익률 계산기

```typescript
// ProfitCalculator.tsx
interface ProfitCalculatorProps {
  betAmount: number;
  selectedOption: PredictionOption;
  gameType: GameType;
  onCalculationChange: (result: ProfitCalculation) => void;
}

interface ProfitCalculation {
  potentialWinnings: number;
  roi: number; // Return on Investment
  pmpReward: number;
  pmcReward: number;
  riskLevel: "low" | "medium" | "high";
}
```

### 🔄 경제 상호작용 플로우

```mermaid
sequenceDiagram
    participant U as User
    participant UI as Prediction UI
    participant EC as Economic Calculator
    participant MW as MoneyWave System
    participant API as Economic API

    U->>UI: 예측 게임 선택
    UI->>EC: 베팅 금액 입력
    EC->>MW: 현재 풀 정보 조회
    MW-->>EC: MoneyWave 데이터
    EC->>EC: 수익률 계산
    EC-->>UI: 예상 수익 표시
    UI-->>U: 계산 결과 표시

    U->>UI: 참여 확정
    UI->>API: 경제 거래 실행
    API->>MW: 풀 업데이트
    MW-->>API: 거래 완료
    API-->>UI: 참여 결과
    UI-->>U: 결과 표시 & 잔액 업데이트
```

## 개발 우선순위

### 🚀 Phase 1: 기본 기능 구현 (4주)

```mermaid
gantt
    title Phase 1 - 기본 기능 구현
    dateFormat  YYYY-MM-DD
    section 핵심 컴포넌트
    PredictionGameList           :p1-1, 2025-06-24, 1w
    PredictionDetailView 완성    :p1-2, after p1-1, 1w
    PredictionParticipationFlow  :p1-3, after p1-2, 1w
    경제 시스템 UI 통합          :p1-4, after p1-3, 1w
```

**핵심 목표:**

- 게임 목록 조회 및 표시
- 게임 상세 정보 표시
- 기본 예측 참여 기능
- PMP/PMC 잔액 표시

### ⚡ Phase 2: 고급 기능 구현 (6주)

```mermaid
gantt
    title Phase 2 - 고급 기능 구현
    dateFormat  YYYY-MM-DD
    section 실시간 & 분석
    실시간 WebSocket 연결        :p2-1, 2025-07-22, 2w
    MarketTrendChart 구현        :p2-2, after p2-1, 2w
    UserDashboard 구현           :p2-3, after p2-2, 2w
```

**핵심 목표:**

- 실시간 확률 업데이트
- 시장 동향 분석 차트
- 사용자 개인 대시보드
- 고급 필터링 및 검색

### 🎯 Phase 3: 최적화 및 고도화 (4주)

```mermaid
gantt
    title Phase 3 - 최적화 및 고도화
    dateFormat  YYYY-MM-DD
    section 최적화 & UX
    모바일 최적화               :p3-1, 2025-09-02, 2w
    성능 최적화 & 접근성        :p3-2, after p3-1, 1w
    고급 애니메이션 & 피드백    :p3-3, after p3-2, 1w
```

**핵심 목표:**

- 완전한 반응형 디자인
- 성능 최적화 (지연 로딩, 메모이제이션)
- 접근성 개선 (WCAG 2.1 AA 준수)
- 사용자 경험 개선

## 일정 계획

### 📅 전체 개발 일정

```mermaid
timeline
    title Prediction 프론트엔드 개발 일정

    section 2025년 6월
        6월 24일 - 30일 : 프로젝트 설정
                        : 컴포넌트 구조 설계
                        : 개발 환경 구축

    section 2025년 7월
        7월 1일 - 7일   : PredictionGameList 구현
        7월 8일 - 14일  : PredictionDetailView 완성
        7월 15일 - 21일 : 참여 플로우 구현
        7월 22일 - 28일 : 경제 시스템 통합
        7월 29일 - 31일 : Phase 1 QA 및 버그 수정

    section 2025년 8월
        8월 1일 - 7일   : 실시간 기능 구현
        8월 8일 - 14일  : WebSocket 연결 및 테스트
        8월 15일 - 21일 : 차트 컴포넌트 구현
        8월 22일 - 28일 : 사용자 대시보드
        8월 29일 - 31일 : Phase 2 QA

    section 2025년 9월
        9월 1일 - 7일   : 모바일 최적화
        9월 8일 - 14일  : 성능 최적화
        9월 15일 - 21일 : 접근성 개선
        9월 22일 - 28일 : 최종 테스트 및 배포 준비
```

### 🎯 주요 마일스톤

| 마일스톤       | 날짜       | 목표                     | 성공 지표                    |
| -------------- | ---------- | ------------------------ | ---------------------------- |
| **Alpha 버전** | 2025-07-31 | 기본 예측 게임 참여 기능 | 게임 참여율 > 60%            |
| **Beta 버전**  | 2025-08-31 | 실시간 기능 및 분석      | 실시간 업데이트 지연 < 1초   |
| **RC 버전**    | 2025-09-21 | 모바일 최적화 완료       | 모바일 사용자 만족도 > 4.5/5 |
| **Production** | 2025-09-30 | 정식 서비스 출시         | 시스템 안정성 > 99.9%        |

## 품질 관리

### 🧪 테스트 전략

```mermaid
graph TD
    A["품질 관리 전략"] --> B["단위 테스트"]
    A --> C["통합 테스트"]
    A --> D["E2E 테스트"]
    A --> E["성능 테스트"]
    A --> F["접근성 테스트"]

    B --> B1["컴포넌트 테스트<br/>- 렌더링 테스트<br/>- 상호작용 테스트<br/>- 상태 관리 테스트"]

    C --> C1["API 통합 테스트<br/>- 데이터 흐름 테스트<br/>- 에러 처리 테스트<br/>- 실시간 연결 테스트"]

    D --> D1["사용자 시나리오 테스트<br/>- 예측 참여 플로우<br/>- 게임 생성 플로우<br/>- 결제 플로우"]

    E --> E1["성능 벤치마크<br/>- 페이지 로딩 속도<br/>- 메모리 사용량<br/>- 네트워크 최적화"]

    F --> F1["접근성 검증<br/>- 스크린 리더 테스트<br/>- 키보드 네비게이션<br/>- 색상 대비 검사"]

    style A fill:#e3f2fd
    style B1 fill:#e8f5e8
    style C1 fill:#fff3e0
    style D1 fill:#fce4ec
    style E1 fill:#f3e5f5
    style F1 fill:#e1f5fe
```

### 📊 품질 지표

```mermaid
pie title "품질 관리 영역별 중요도"
    "기능 테스트" : 30
    "성능 최적화" : 25
    "사용자 경험" : 20
    "접근성" : 15
    "보안" : 10
```

#### 핵심 품질 지표

1. **기능 정확성**
   - 테스트 커버리지 > 80%
   - 버그 발생률 < 1%
   - 기능 완성도 > 95%

2. **성능 최적화**
   - 첫 페이지 로딩 < 2초
   - 상호작용 응답 시간 < 100ms
   - 메모리 사용량 < 50MB

3. **사용자 경험**
   - 사용자 만족도 > 4.5/5
   - 태스크 완료율 > 90%
   - 오류 발생률 < 5%

4. **접근성 준수**
   - WCAG 2.1 AA 레벨 준수
   - 스크린 리더 호환성 100%
   - 키보드 네비게이션 지원

### 🔍 코드 품질 관리

```typescript
// 코드 품질 관리 도구 설정
// eslint.config.js
export default [
  {
    rules: {
      // React 최적화
      "react-hooks/exhaustive-deps": "error",
      "react/jsx-key": "error",

      // TypeScript 엄격성
      "@typescript-eslint/strict-boolean-expressions": "error",
      "@typescript-eslint/no-unused-vars": "error",

      // 성능 최적화
      "react/jsx-no-bind": "error",
      "react/no-array-index-key": "warn",

      // 접근성
      "jsx-a11y/alt-text": "error",
      "jsx-a11y/aria-props": "error",
    },
  },
];
```

### 📋 품질 체크리스트

#### 컴포넌트 구현 체크리스트

- [ ] TypeScript 타입 안전성 확보
- [ ] Props 인터페이스 완전 정의
- [ ] 에러 바운더리 구현
- [ ] 로딩 상태 처리
- [ ] 접근성 속성 (ARIA) 추가
- [ ] 반응형 디자인 적용
- [ ] 단위 테스트 작성
- [ ] Storybook 스토리 작성
- [ ] 성능 최적화 (memo, useMemo, useCallback)
- [ ] 경제 시스템 통합 확인

#### 페이지 구현 체크리스트

- [ ] SEO 메타 태그 설정
- [ ] 페이지 성능 최적화
- [ ] 에러 페이지 구현
- [ ] 로딩 상태 페이지
- [ ] 404 페이지 처리
- [ ] 사용자 인증 확인
- [ ] 경제 잔액 표시
- [ ] 실시간 업데이트 연결
- [ ] 모바일 최적화 확인
- [ ] E2E 테스트 작성

## 🚀 다음 단계

### 즉시 시작 가능한 작업들

1. **개발 환경 설정**

   ```powershell
   # 의존성 설치
   npm install @tanstack/react-query recharts framer-motion
   npm install -D @testing-library/jest-dom @storybook/react
   ```

2. **컴포넌트 구조 생성**

   ```powershell
   # 컴포넌트 디렉토리 생성
   New-Item -ItemType Directory -Path "src\bounded-contexts\prediction\presentation\components\games"
   New-Item -ItemType Directory -Path "src\bounded-contexts\prediction\presentation\components\charts"
   New-Item -ItemType Directory -Path "src\bounded-contexts\prediction\presentation\hooks"
   ```

3. **첫 번째 컴포넌트 구현**
   - `PredictionGameList` 컴포넌트부터 시작
   - 기존 `EnhancedGameCard` 활용
   - 기본 필터링 기능 구현

### 🎯 성공 지표

- **개발 완료**: 2025년 9월 30일
- **사용자 만족도**: 4.5/5 이상
- **성능 목표**: 페이지 로딩 2초 이내
- **접근성**: WCAG 2.1 AA 레벨 준수
- **테스트 커버리지**: 80% 이상

---

## 📞 지원 및 문의

이 구현 계획에 대한 질문이나 개선 사항이 있으시면 개발팀에 문의해 주세요.

- **작성자**: PosMul Development Team
- **문서 버전**: v1.0
- **최종 업데이트**: 2025-06-24 00:18:53

---

_이 문서는 PosMul Prediction 도메인의 프론트엔드 구현을 위한 전략적 가이드입니다. 백엔드 시스템이 충분히 구축된 상황에서 사용자 중심의 인터페이스 개발에 집중하여 AI 시대 직접 민주주의 플랫폼의 비전을 실현하는 것이 목표입니다._
