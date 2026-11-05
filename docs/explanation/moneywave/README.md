# MoneyWave (1/2/3) 문서 모음

> **현재 상태**: v3 프로덕션 운영 중 (`v3_social_learning_time_weighted`)  
> **핵심 사양**: 일일 100,000 PMC 예산, KST 시간대 가중치, 사회적 학습 & 기간 정규화, 예측 정산 연계

---

## 📌 핵심 바로가기
- **[MoneyWave v3 기술 명세서 (종합 보고서)](MONEYWAVE_V3_SPECIFICATION.md)**: 수학 공식, DB 함수/크론, 정산 보너스 및 어뷰징 방지 로직 완전 정리
- **[비즈니스 경제 시스템 상세](../../business/ECONOMY_SYSTEM_DETAIL.md)**: PMP/PMC 이중 통화 및 MoneyWave 비즈니스 모델

---

## 🌊 주요 아키텍처 요약

MoneyWave 계산 및 분배 파이프라인은 아래 3계층으로 완성되어 있습니다:

```mermaid
flowchart TD
  subgraph Cron["1. Database Cron & Functions (Truth Layer)"]
    C1["moneywave_daily_snapshot_refresh<br/>(매일 00:00 KST, 일일 10만 PMC)"]
    C2["moneywave_hourly_alloc_prediction_game_pools<br/>(매 정각, 시간대/사회적학습 배분)"]
    C1 --> C2
    C2 --> T1["economy.money_wave_hourly_category_allocations"]
    C2 --> T2["economy.money_wave_hourly_game_pools"]
  end

  subgraph UI["2. Frontend Display (Reveal Layer)"]
    T1 & T2 --> H["useWaveCalculation.ts"]
    H --> MWS["MoneyWaveStatus / CompactWidget"]
    Note over H: 시간 진행률에 따라 50% -> 100% Reveal
  end

  subgraph Settle["3. Prediction Settlement (Payout Layer)"]
    T2 --> RPC["public.settle_prediction_game<br/>public.calculate_reward_amount"]
    RPC --> PAY["승자: 베팅 배당 + MoneyWave 상금 보너스 (PMC 지급)"]
    RPC --> HIST["economy.money_wave_history (감사 기록)"]
  end
```

---

## 소스(핵심 파일)

- **DB RPC / Functions**:
  - `economy.refresh_daily_money_wave_snapshot()`: 일일 스냅샷 및 예산 확정
  - `economy.compute_prediction_hourly_game_pools()`: 시간대별(새벽 0.4x/주간 1.0x/피크 1.6x) 및 사회적 학습 가중 배분
  - `public.calculate_reward_amount()`: 정산 시 베팅 배당 + MoneyWave 보너스 계산 (베팅액 2.0x 캡)
  - `public.settle_prediction_game()`: 정산 실행 및 원장/이력 기록
- **계산(서비스)**:
  - [apps/posmul-web/src/shared/economy-kernel/services/money-wave-calculator.service.ts](../../apps/posmul-web/src/shared/economy-kernel/services/money-wave-calculator.service.ts)
- **UI (표시 및 누적 계산)**:
  - 계산 훅: [apps/posmul-web/src/shared/ui/components/layout/MoneyWave/useWaveCalculation.ts](../../apps/posmul-web/src/shared/ui/components/layout/MoneyWave/useWaveCalculation.ts)
  - 보조 수학: [apps/posmul-web/src/shared/ui/components/layout/MoneyWave/wave-math.ts](../../apps/posmul-web/src/shared/ui/components/layout/MoneyWave/wave-math.ts)
  - 네비바 위젯: [apps/posmul-web/src/shared/ui/components/layout/MoneyWave/CompactWidget.tsx](../../apps/posmul-web/src/shared/ui/components/layout/MoneyWave/CompactWidget.tsx)
  - 대시보드: [apps/posmul-web/src/bounded-contexts/economy/presentation/components/MoneyWaveDashboard.tsx](../../apps/posmul-web/src/bounded-contexts/economy/presentation/components/MoneyWaveDashboard.tsx)
- **정산 및 공론장 연계**:
  - [settle-prediction-game.use-case.ts](../../apps/posmul-web/src/bounded-contexts/prediction/application/use-cases/settle-prediction-game.use-case.ts)
  - [settlement-orchestrator.service.ts](../../apps/posmul-web/src/bounded-contexts/prediction/application/services/settlement-orchestrator.service.ts)
  - [prediction-comment.actions.ts](../../apps/posmul-web/src/app/prediction/components/prediction-comment.actions.ts)

---

## 세부 문서 목록
- **종합 명세서**: [MONEYWAVE_V3_SPECIFICATION.md](MONEYWAVE_V3_SPECIFICATION.md)
- **MoneyWave1 (EBIT & 사회적학습)**: [moneywave1.md](moneywave1.md)
- **MoneyWave2 (휴면 PMC 재분배)**: [moneywave2.md](moneywave2.md)
- **MoneyWave3 (기업가/파트너십)**: [moneywave3.md](moneywave3.md)
- **UI/컴포넌트 운영 범위**: [moneywave-ui.md](moneywave-ui.md)
