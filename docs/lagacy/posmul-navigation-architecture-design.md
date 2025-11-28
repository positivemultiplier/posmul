# PosMul 네비게이션 아키텍처 설계 문서

## 📋 문제 정의

### 현재 상황

- **종목별 분류**: soccer/sport/prediction 등 3-depth 구조
- **지역별 확장**: Local → Region → Nation → Colony → Universe (50년 계획)
- **4개 핵심 도메인**: Investment, Prediction, Donation, Forum
- **복잡도 폭증**: 기존 3-depth로는 한계

### 핵심 과제

- 50년간 확장 가능한 네비게이션 구조 설계
- 사용자 경험 최적화 (복잡성 vs 접근성)
- 일관된 정보 아키텍처 구축
- 점진적 기능 노출 (Progressive Disclosure)

## 🎯 혁신적 네비게이션 아키텍처 제안

### 1. 이중 축 네비게이션 시스템 (Dual-Axis Navigation)

```mermaid
graph TD
    A[PosMul Platform] --> B[기능별 네비게이션<br/>Function-Based]
    A --> C[지역별 네비게이션<br/>Scope-Based]

    B --> D[Investment 📈]
    B --> E[Prediction 🔮]
    B --> F[Donation 💝]
    B --> G[Forum 💬]

    C --> H[Current Active<br/>Local/Region]
    C --> I[Future Expansion<br/>Nation/Colony/Universe]


```

#### 기능별 축 (Function-Based Navigation)

- **1차 네비**: Investment, Prediction, Donation, Forum
- **일관된 구조**: 모든 기능에서 동일한 하위 분류 체계

#### 지역별 축 (Scope-Based Navigation)

- **동적 활성화**: 현재는 Local/Region만 활성화
- **점진적 노출**: Nation → Colony → Universe 순차 활성화
- **컨텍스트 스위치**: 사용자가 지역 범위 선택 가능

### 2. 적응형 메뉴 구조 (Adaptive Menu Architecture)

```mermaid
pie title 현재 활성화된 지역 범위 (2024-2034)
    "Local" : 60
    "Region" : 35
    "Nation (Beta)" : 5
    "Colony (Coming Soon)" : 0
    "Universe (Future)" : 0
```

#### Phase 1: 현재-10년 (2024-2034)

```
📈 Investment
├── 💰 Local League ✅
├── 🏢 Major League ✅
├── ☁️ Cloud Funding ✅
├── 🌏 Region League (Beta)
└── 🚀 Upcoming Leagues (Disabled)

🔮 Prediction
├── 🏠 Local Events ✅
├── ⚽ Sports
│   ├── Local Soccer ✅
│   ├── Regional Soccer (Beta)
│   └── National Soccer (Coming)
├── 🌏 Regional Events (Beta)
└── 🚀 Future Scopes (Disabled)
```

#### Phase 2: 중기-25년 (2035-2049)

```
🔮 Prediction
├── 🏠 Local Events
├── 🌏 Regional Events
├── 🇰🇷 National Events ✅
├── 🌍 Colony Events (Beta)
└── 🌌 Universe Events (Coming)
```

### 3. 스마트 컨텍스트 네비게이션

```mermaid
graph LR
    A[사용자 위치/선호도] --> B[지능형 컨텍스트<br/>Context Engine]
    C[활성화된 지역 범위] --> B
    D[사용자 활동 이력] --> B

    B --> E[개인화된 네비게이션<br/>Personalized Menu]
    E --> F[우선순위 기반 정렬]
    E --> G[관련성 높은 항목 강조]
    E --> H[사용 빈도 기반 배치]
```

#### 구현 전략

- **위치 기반**: 사용자 위치에 따른 Local/Regional 우선 노출
- **관심사 기반**: 활동 이력 분석으로 개인화
- **점진적 확장**: 새로운 지역 범위 활성화 시 알림 및 안내

## 🏗️ 구체적 네비게이션 구조

### 최종 권장 구조: 하이브리드 3+2 Depth

```
Level 1 (기능): Investment | Prediction | Donation | Forum | Ranking
Level 2 (범위): Local | Region | Nation | Colony | Universe
Level 3 (카테고리): Sport/Economy/Politics | Soccer/Baseball | etc.
Level 4 (세부): Specific Events/Projects/Categories
Level 5 (액션): Create/Participate/Manage
```

### Investment 예시

```
📈 Investment
├── 🏠 Local (현재 활성)
│   ├── Local League
│   │   ├── 식품 🍜
│   │   ├── 의류 👕
│   │   └── 서비스 🛠️
│   └── Region League (Beta)
├── 🇰🇷 Nation (Coming Soon)
│   ├── Nation League
│   └── Government Projects
├── 🌍 Colony (Future)
└── 🌌 Universe (Future)
```

### Prediction 예시

```
🔮 Prediction
├── 🏠 Local (현재 활성)
│   ├── 스포츠 ⚽
│   │   ├── 지역 축구 리그
│   │   └── 지역 야구 리그
│   ├── 경제 💼
│   └── 정치 🗳️
├── 🌏 Region (Beta)
│   ├── 스포츠 ⚽
│   │   ├── K리그
│   │   └── KBO
│   └── 광역 선거
├── 🇰🇷 Nation (Coming Soon)
├── 🌍 Colony (Future)
└── 🌌 Universe (Future)
```

## � 게임화 Unlock 시스템 설계

### 1. Local 기능별 Unlock 전략

```mermaid
flowchart TD
    A[신규 사용자<br/>Investment Only] --> B[Investment 활동 시작<br/>PMP 100점 달성]
    B --> C{첫 번째 언락 조건}
    C -->|투자 3회 + PMP 100| D[🔮 Prediction Unlocked!]

    D --> E[Prediction 게임 시작<br/>PMC 50점 달성]
    E --> F{두 번째 언락 조건}
    F -->|예측 성공 5회 + PMC 50| G[💝 Donation Unlocked!]

    G --> H[Donation 활동 시작<br/>기부 3회 완료]
    H --> I{세 번째 언락 조건}
    I -->|기부 3회 + 사회기여 점수 100| J[💬 Forum Unlocked!]

    J --> K[Forum 활동 시작<br/>토론 참여 10회]
    K --> L{Region 승격 조건}
    L -->|모든 Local 기능 마스터| M[🌏 Region Level 승격!]


```

### 2. 상세 Unlock 조건 시스템

#### 🔮 Prediction Unlock 조건

```mermaid
graph LR
    A[Investment 기본 활동] --> B[PMP 100점 획득]
    B --> C[투자 횟수 3회 이상]
    C --> D[Local League 1회 이상 참여]
    D --> E[🎉 Prediction 기능 해제!]

    E --> F[튜토리얼 완료]
    F --> G[첫 예측 게임 무료 제공]

```

**구체적 요구사항:**

- **PMP 획득**: Investment 활동으로 100 PMP 적립
- **활동 횟수**: 최소 3회 이상 투자 참여
- **다양성**: Local League 최소 1회 참여 (Major League만으론 불가)
- **보너스**: 해제 시 첫 예측 게임 10 PMP 무료 제공

#### 💝 Donation Unlock 조건

```mermaid
graph LR
    A[Prediction 활동] --> B[PMC 50점 획득]
    B --> C[예측 성공 5회]
    C --> D[예측 정확도 60% 이상]
    D --> E[🎉 Donation 기능 해제!]

    E --> F[기부처 가이드 투어]
    F --> G[첫 기부 매칭 보너스 2배]


```

**구체적 요구사항:**

- **PMC 획득**: Prediction 성공으로 50 PMC 적립
- **성공 경험**: 최소 5회 예측 성공
- **정확도**: 전체 예측 정확도 60% 이상 유지
- **보너스**: 해제 시 첫 기부 매칭 보너스 2배 적용

#### 💬 Forum Unlock 조건

```mermaid
graph LR
    A[Donation 활동] --> B[기부 3회 완료]
    B --> C[사회기여 점수 100점]
    C --> D[다양한 분야 기부 경험]
    D --> E[🎉 Forum 기능 해제!]

    E --> F[토론 룰 안내]
    F --> G[첫 게시글 PMP 보너스]


```

**구체적 요구사항:**

- **기부 횟수**: 최소 3회 이상 기부 완료
- **사회기여 점수**: 기부 영향력 분석으로 100점 달성
- **다양성**: 최소 2개 이상 다른 분야/기관에 기부
- **보너스**: 해제 시 첫 게시글 작성 시 10 PMP 보너스

### 3. 시각적 진행 시스템

```mermaid
pie title 사용자 기능 해제 단계별 분포 (예상)
    "Investment Only (신규)" : 40
    "Investment + Prediction" : 30
    "Investment + Prediction + Donation" : 20
    "All Local Features (Forum)" : 8
    "Region Level (승격)" : 2
```

#### 진행률 표시 UI 컴포넌트

```typescript
interface UnlockProgress {
  currentLevel: "Investment" | "Prediction" | "Donation" | "Forum" | "Region";
  nextUnlock: {
    feature: string;
    requirements: UnlockRequirement[];
    progress: number; // 0-100%
    estimatedTime: string;
  };
  completedChallenges: string[];
  availableBonuses: Bonus[];
}

interface UnlockRequirement {
  type: "PMP" | "PMC" | "ActivityCount" | "AccuracyRate" | "Diversity";
  current: number;
  required: number;
  description: string;
}
```

## �🎨 사용자 경험 최적화 방안

### 1. 게임화된 단계적 기능 노출 (Gamified Progressive Disclosure)

```mermaid
flowchart TD
    A[신규 사용자<br/>🏦 Investment Only] --> B[투자 활동 완료]
    B --> C{Unlock 조건 달성?}
    C -->|PMP 100 + 투자 3회| D[🔮 Prediction 해제!<br/>축하 애니메이션]

    D --> E[예측 게임 시작]
    E --> F{Unlock 조건 달성?}
    F -->|PMC 50 + 성공 5회| G[💝 Donation 해제!<br/>Impact 계산기 제공]

    G --> H[기부 활동 시작]
    H --> I{Unlock 조건 달성?}
    I -->|기부 3회 + 사회기여 100| J[💬 Forum 해제!<br/>토론 가이드 제공]

    J --> K[All Local 마스터]
    K --> L[🌏 Region Level 승격!]

    C -->|조건 미달성| M[진행률 표시<br/>다음 목표 안내]
    F -->|조건 미달성| M
    I -->|조건 미달성| M


```

### 4. Unlock 알림 및 보상 시스템

#### 🎊 Unlock 성공 시 경험

```mermaid
graph TD
    A[조건 달성 감지] --> B[축하 풀스크린 애니메이션]
    B --> C[새 기능 튜토리얼 시작]
    C --> D[Unlock 보너스 지급]
    D --> E[소셜 공유 옵션]
    E --> F[다음 목표 프리뷰]


```

#### 🎁 Unlock 보너스 패키지

- **Prediction Unlock**:
  - 첫 예측 게임 10 PMP 무료 제공
  - 예측 가이드 PDF 다운로드
  - "예측 초보자" 뱃지 획득
- **Donation Unlock**:
  - 첫 기부 매칭 보너스 2배 (최대 50 PMC)
  - 사회기여 영향력 계산기 제공
  - "선행자" 뱃지 획득
- **Forum Unlock**:
  - 첫 게시글 작성 시 10 PMP 보너스
  - 토론 매너 가이드 제공
  - "토론가" 뱃지 획득

### 5. 진행률 추적 및 동기부여 시스템

#### 📊 실시간 진행률 대시보드

```typescript
interface UnlockDashboard {
  currentPhase: {
    name: string;
    completionRate: number;
    nextMilestone: string;
  };
  requirements: {
    completed: UnlockRequirement[];
    pending: UnlockRequirement[];
    tips: string[];
  };
  recentAchievements: Achievement[];
  friendsProgress: FriendProgress[]; // 소셜 비교
}
```

#### 🏆 성취 시스템 통합

```mermaid
pie title Unlock 관련 성취 분류
    "경제 활동 성취" : 25
    "예측 성공 성취" : 25
    "기부 임팩트 성취" : 25
    "토론 참여 성취" : 15
    "소셜 연결 성취" : 10
```

**구체적 성취 예시:**

- 🥇 **Investment Master**: PMP 1000점 달성
- 🎯 **Prediction Guru**: 연속 10회 예측 성공
- 💝 **Generous Heart**: 누적 기부 PMC 500점
- 💬 **Discussion Leader**: 토론에서 10회 이상 '좋아요' 획득
- 🌟 **Community Builder**: 5명 이상 친구 초대

### 6. 소셜 및 경쟁 요소

#### 👥 친구 초대 인센티브

```mermaid
graph LR
    A[친구 초대] --> B[친구가 Prediction 해제]
    B --> C[초대자에게 보너스 PMP]
    C --> D[친구와 함께하는 특별 미션]
    D --> E[공동 달성 시 추가 보상]


```

#### 🏅 리더보드 시스템

- **Weekly Unlock Challenge**: 주간 가장 많은 기능 해제한 사용자
- **Speed Unlock**: 가장 빠르게 모든 Local 기능 해제
- **Quality Unlock**: 높은 정확도로 단계별 해제 달성

### 7. 개인화된 Unlock 경로

#### 🎨 맞춤형 추천 시스템

```typescript
interface PersonalizedUnlock {
  userType: "Investor" | "Predictor" | "Philanthropist" | "Discusser";
  recommendedPath: UnlockStep[];
  alternativePaths: UnlockStep[][];
  personalizedChallenges: Challenge[];
}

// 사용자 성향에 따른 맞춤 경로
const generateUnlockPath = (userBehavior: UserBehavior) => {
  if (userBehavior.investmentFocused) {
    return prioritizeInvestmentPath();
  } else if (userBehavior.sociallyActive) {
    return prioritizeSocialPath();
  }
  // ... 기타 경로들
};
```

### 2. 스마트 메뉴 시스템 (Unlock 상태 통합)

#### 적응형 메뉴 바 (Unlock 기반)

```typescript
interface NavigationState {
  activeScopes: ("Local" | "Region" | "Nation" | "Colony" | "Universe")[];
  unlockedFeatures: ("Investment" | "Prediction" | "Donation" | "Forum")[];
  userLevel: number;
  location: GeolocationData;
  preferences: UserPreferences;
  unlockProgress: UnlockProgress;
}

// Unlock 상태 반영 메뉴 생성
const generateUnlockAwareMenu = (state: NavigationState) => {
  return {
    investment: { enabled: true, highlight: false }, // 항상 활성
    prediction: {
      enabled: state.unlockedFeatures.includes("Prediction"),
      highlight: canUnlock("Prediction", state.unlockProgress),
      lockInfo: getPredictionUnlockInfo(state.unlockProgress),
    },
    donation: {
      enabled: state.unlockedFeatures.includes("Donation"),
      highlight: canUnlock("Donation", state.unlockProgress),
      lockInfo: getDonationUnlockInfo(state.unlockProgress),
    },
    forum: {
      enabled: state.unlockedFeatures.includes("Forum"),
      highlight: canUnlock("Forum", state.unlockProgress),
      lockInfo: getForumUnlockInfo(state.unlockProgress),
    },
  };
};
```

#### 🔒 잠긴 메뉴 아이템 UI/UX

```mermaid
graph TD
    A[잠긴 기능 클릭] --> B[아름다운 Lock 애니메이션]
    B --> C[Unlock 조건 모달 표시]
    C --> D[현재 진행률 시각화]
    D --> E[다음 액션 가이드]
    E --> F[동기부여 메시지]

    G["해제 임박 (90%+)"] --> H[반짝이는 애니메이션]
    H --> I["거의 다 왔어요!" 메시지]


```

### 3. 시각적 계층 구조

```mermaid
graph TD
    A[메인 네비바<br/>Function-Based] --> B[서브 네비바<br/>Scope-Based]
    B --> C[카테고리 필터<br/>Category-Based]
    C --> D[상세 필터<br/>Detail-Based]

    E[브레드크럼<br/>현재 위치 표시] --> F[컨텍스트 액션<br/>Create/Join/Manage]

    style A fill:#4A90E2
    style B fill:#7ED321
    style C fill:#F5A623
    style D fill:#D0021B
```

## 📱 반응형 네비게이션 전략

### 모바일 우선 접근법

```mermaid
graph LR
    A[Desktop<br/>5-Level Full Menu] --> B[Tablet<br/>4-Level Collapsed]
    B --> C[Mobile<br/>3-Level + Drawer]
    C --> D[Mobile Mini<br/>2-Level + Modal]

    E[햄버거 메뉴] --> F[카테고리 드로어]
    F --> G[스코프 선택 모달]
    G --> H[액션 바텀 시트]
```

### 기기별 최적화

- **Desktop**: 전체 5-depth 메뉴 노출
- **Tablet**: 4-depth, 일부 컬랩스
- **Mobile**: 3-depth + 드로어 메뉴
- **Mobile Mini**: 2-depth + 모달 방식

## � Unlock 시스템 구현 계획

### Phase 1: 기본 Unlock 시스템 (Q4 2024)

1. **Investment → Prediction Unlock** 구현
   - PMP 적립 추적 시스템
   - 활동 횟수 카운터
   - Unlock 조건 검증 로직
   - 기본 축하 애니메이션

2. **진행률 표시 UI** 개발
   - 실시간 진행률 바
   - 다음 목표 안내
   - 잠긴 기능 클릭 시 모달

3. **기본 보상 시스템**
   - Unlock 보너스 지급
   - 간단한 뱃지 시스템

### Phase 2: 고도화 (2025 Q1-Q2)

1. **전체 Unlock 체인** 완성
   - Prediction → Donation → Forum
   - Region Level 승격 시스템
   - 복합 조건 검증

2. **개인화 및 소셜 기능**
   - 사용자 유형별 맞춤 경로
   - 친구 초대 인센티브
   - 리더보드 시스템

3. **고급 UI/UX**
   - 멋진 Unlock 애니메이션
   - 진행률 대시보드
   - 성취 시스템 통합

### Phase 3: 확장 및 최적화 (2025 Q3-Q4)

1. **AI 기반 개인화**
   - 사용자 행동 패턴 분석
   - 맞춤형 Unlock 경로 추천
   - 동기부여 최적화

2. **소셜 확장**
   - 팀/그룹 Unlock 챌린지
   - 커뮤니티 이벤트 연동
   - 바이럴 확산 메커니즘

## 📈 예상 효과 및 KPI

### 사용자 참여도 증가

```mermaid
pie title Unlock 시스템 도입 후 예상 개선율
    "평균 세션 시간" : 40
    "기능 탐색률" : 35
    "사용자 리텐션" : 30
    "소셜 공유" : 25
    "수익 전환율" : 20
```

### 핵심 성과 지표 (KPI)

- **기능별 도달률**:
  - Prediction 해제율: 70% → 90% (목표)
  - Donation 해제율: 30% → 60% (목표)
  - Forum 해제율: 10% → 40% (목표)

- **사용자 경험**:
  - 평균 체류 시간: 15분 → 25분 (목표)
  - 월간 활성 사용자: +50% 증가 (목표)
  - 기능별 완주율: 20% → 45% (목표)

- **비즈니스 임팩트**:
  - 사용자 생애 가치(LTV): +35% 증가
  - 바이럴 계수: 1.2 → 1.8 (목표)
  - 수익 전환율: +20% 증가

### Phase별 활성화 로드맵

```mermaid
timeline
    title 네비게이션 확장 로드맵

    2024-2027 : Phase 1 Foundation
              : Local + Region 완전 활성화
              : Major + Cloud League 구축
              : 기본 Prediction 시스템

    2028-2035 : Phase 2 National
              : Nation 단계 본격 오픈
              : 국가 단위 예측/투자/기부
              : 정부 예산 시뮬레이션

    2036-2045 : Phase 3 Colony
              : 국제 협력 프로젝트
              : 글로벌 예측 마켓
              : 초국가적 기부 시스템

    2046-2074 : Phase 4 Universe
              : 우주 개발 프로젝트
              : 행성간 예측 게임
              : 우주 식민지 거버넌스
```

### 기술적 확장성

```mermaid
graph TD
    A[현재 네비게이션 시스템] --> B[모듈화된 구조]
    B --> C[플러그인 아키텍처]
    C --> D[동적 메뉴 로딩]
    D --> E[A/B 테스트 지원]

    F[메뉴 구성 API] --> G[권한 기반 필터링]
    G --> H[지역화/다국어]
    H --> I[접근성 최적화]

```

## 🎯 구현 우선순위

### 즉시 구현 (Q4 2024)

1. **이중축 기본 구조** 구축
2. **Local/Region 메뉴** 완성
3. **모바일 반응형** 최적화
4. **브레드크럼 시스템**

### 단기 구현 (2025 H1)

1. **스마트 컨텍스트 엔진**
2. **개인화 알고리즘**
3. **점진적 노출 시스템**
4. **Nation 베타 준비**

### 중기 구현 (2025-2027)

1. **A/B 테스트 시스템**
2. **고급 필터링**
3. **AI 추천 네비게이션**
4. **다국어 지원**

## 🏁 결론 및 권장사항

### 최종 권장 구조

```
📱 Main Navigation (Level 1):
   Investment | Prediction | Donation | Forum | Ranking

🌍 Scope Navigation (Level 2):
   Local ✅ | Region 🔄 | Nation 🚧 | Colony 🔮 | Universe 🌌

📂 Category Navigation (Level 3):
   Sport/Economy/Politics | Food/Clothing/Service

🔍 Detail Navigation (Level 4):
   Specific Items/Events

⚡ Action Navigation (Level 5):
   Create/Join/Manage/Share
```

### 핵심 성공 요인

1. **단순성 유지**: 복잡해도 직관적 사용
2. **점진적 노출**: 사용자 수준에 맞는 메뉴
3. **일관성**: 모든 기능에서 동일한 패턴
4. **확장성**: 50년 확장 계획 수용
5. **개인화**: AI 기반 맞춤형 네비게이션

이 구조로 구현하면 현재의 복잡성을 해결하면서도 미래 확장성을 완벽하게 보장할 수 있습니다! 🚀
