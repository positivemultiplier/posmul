# 🚀 Prediction 시스템 업그레이드 및 공공데이터 활용 전략 (Revised)

## 0. Gap Analysis (현재 코드베이스 분석 결과)

사용자님의 현재 코드(`SettlementOrchestratorService`, `GameSchedulingService`)를 분석한 결과, 이미 상당 수준의 **자동 정산 및 스케줄링 오케스트레이션**이 구현되어 있음을 확인했습니다.

| 기능 | 현재 구현 상태 (AS-IS) | 개선/추가 제안 (TO-BE) |
|---|---|---|
| **정산 오케스트레이션** | `SettlementOrchestratorService` 존재<br>- `football_data`, `kosis` API 연동 구현됨<br>- `thesportsdb` 구현됨 | **DART (기업공시) 소스 추가**<br>- 재무제표/공시 정산 로직 추가<br>- 하드코딩된 `fetch` 로직을 **Adapter 패턴**으로 리팩토링 (테스트 용이성 확보) |
| **자동 스케줄링** | `GameSchedulingService` 존재<br>- 시간 기반 템플릿(Daily, Weekly) 생성<br>- MoneyWave 연동 설정 존재 | **Event Triggered 스케줄링**<br>- 외부 캘린더(DART 공시 일정, 경기 일정)를 조회하여<br>동적으로 게임을 생성하는 로직 추가 |
| **데이터 검증** | API 결과 신뢰도 1.0 가정. 예외 처리 로직 존재. | **Oracle 하이브리드 검증**<br>- API 오류/모호함 발생 시 `manual` 모드로 전환하여<br>배심원 투표(Human-in-the-loop)로 넘기는 흐름 강화 |

---

## 1. 개요
기존에 구축된 **Settlement Orchestrator**를 확장하여 **Open DART API**를 수용하고, 아키텍처를 Clean Architecture 원칙에 맞게 리팩토링합니다. 이를 통해 신뢰도 높은 **Intelligence Market**으로 진화합니다.

---

## 2. 공공데이터 활용 유즈케이스 (Add-on)

### 2.1 기업 공시 기반 예측 (New Source: `dart`)
기존 `kosis`(경제지표)에 이어 기업 데이터를 추가합니다.
*   **시나리오**: "삼성전자 이번 분기 영업이익, 컨센서스 상회할까?"
*   **구현**: `SettlementOrchestratorService`에 `fetchDartResult` 메서드 추가.
*   **데이터**: `fnlttSinglAcntAll` (재무제표) 활용.

---

## 3. 고도화 전략 (Upgrades)

### 3.1 아키텍처 리팩토링 (Adapter Pattern)
현재 Service 클래스 내부에 `fetch` 호출이 혼재되어 있어, 테스트와 확장이 어렵습니다. 이를 **Infrastructure Layer**로 분리합니다.

**AS-IS (Service 내부)**
```typescript
class SettlementOrchestratorService {
  private async fetchKosisResult(source) {
    const res = await fetch(url); // 직접 호출
    // ...
  }
}
```

**TO-BE (Port & Adapter)**
```typescript
// Domain Port
interface IOracleAdapter {
  fetchResult(config: SourceConfig): Promise<GameResult>;
}

// Infrastructure Adapters
class KosisOracleAdapter implements IOracleAdapter { ... }
class DartOracleAdapter implements IOracleAdapter { ... }

// Service
class SettlementOrchestratorService {
  constructor(private adapters: Map<string, IOracleAdapter>) {}
}
```

### 3.2 게이미피케이션 (Retention)
*   **Oracle Badge**: KOSIS 예측 적중 10회 시 "매크로 경제 전문가" 배지 자동 부여.
*   **Streak System**: `GameSchedulingService`가 매일 사용자의 참여 기록을 체크하여 보상 지급 이벤트 발행.

---

## 4. 실행 로드맵

1.  **Refactoring**: `SettlementOrchestrator`에서 API 호출 로직을 `infrastructure/oracle/*`로 분리.
2.  **Feat (DART)**: `DartOracleAdapter` 구현 및 DART API 키 연동.
3.  **Feat (Schedule)**: DART 공시 캘린더를 읽어 게임을 자동 생성하는 `DartGameScheduler` 추가.
