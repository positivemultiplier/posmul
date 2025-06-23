# PosMul 경제 시스템 통합 수정 보고서

## 📊 현재 오류 현황 분석

```mermaid
pie title 타입 오류 분포
    "Repository 미구현 메서드" : 40
    "GameStatus enum 누락" : 25
    "MCP 모듈 누락" : 20
    "Next.js 라우팅" : 15
```

## 🎯 PosMul 경제 시스템 연관 우선순위

```mermaid
graph TD
    A[1. GameStatus enum 수정] --> B[2. Repository 인터페이스 완성]
    B --> C[3. MCP 경제 모듈 생성]
    C --> D[4. PMP/PMC 타입 통합]

    style A fill:#ffcdd2
    style B fill:#fff3e0
    style C fill:#e8f5e9
    style D fill:#e3f2fd
```

## 🔮 예측 게임 MoneyWave 연동 구조

```mermaid
flowchart TD
    subgraph "🎯 예측 게임 핵심"
        PG[Prediction Game]
        PMP[PMP 소모]
        PMC[PMC 보상]
    end

    subgraph "🌊 MoneyWave 시스템"
        MW1[MoneyWave1: EBIT 기반]
        MW2[MoneyWave2: 재분배]
        MW3[MoneyWave3: 기업가 맞춤]
    end

    PMP --> PG
    PG --> PMC
    MW1 --> PMC
    PMC --> MW2
    MW3 --> PG
```

## 📈 경제 통합 타입 구조

```mermaid
classDiagram
    class EconomicSystem {
        +PMP: number
        +PMC: number
        +MoneyWave: MoneyWaveType
    }

    class PredictionGame {
        +consumePMP(): Result
        +rewardPMC(): Result
        +connectMoneyWave(): Result
    }

    class Repository {
        +findByEconomicStatus()
        +updateEconomicData()
        +moneyWaveIntegration()
    }

    EconomicSystem --> PredictionGame
    PredictionGame --> Repository
```

## 🔧 수정 계획

### 1단계: GameStatus enum 통합

- shared에서 제거된 GameStatus 참조 수정
- prediction domain의 GameStatus로 통일

### 2단계: Repository 경제 연동 메서드 추가

- MoneyWave 연동 메서드 구현
- PMP/PMC 잔액 확인 메서드 추가
- 경제 시스템 업데이트 메서드 구현

### 3단계: MCP 경제 모듈 생성

- `@/shared/mcp/mcp-errors` 생성
- `@/shared/mcp/supabase-client` 생성
- 경제 시스템 MCP 통합 구현

## 🎯 예상 효과

```mermaid
pie title 수정 후 예상 효과
    "타입 안정성 확보" : 35
    "경제 시스템 통합" : 30
    "MoneyWave 연동" : 25
    "개발 생산성 향상" : 10
```

---

_생성 시간: ${new Date().toISOString()}_
_프로젝트: PosMul Platform Economic Integration_
