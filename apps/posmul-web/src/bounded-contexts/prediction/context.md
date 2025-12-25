# Prediction Bounded Context

## 도메인 개요

Prediction 도메인은 사용자가 PMP를 사용하여 미래의 정책이나 사회적 이슈에 대해 예측하고, 결과에 따라 PMC 보상을 받는 예측 시장(Prediction Market) 시스템을 담당합니다.

## 핵심 서비스

- **예측 게임 관리**: 게임 생성, 수정, 삭제
- **참여 및 배팅**: PMP를 사용한 예측 참여
- **결과 정산**: 예측 결과 입력 및 승패 판정
- **보상 분배**: MoneyWave와 연동된 PMC 보상 지급

## 도메인 모델

### Aggregates
- **PredictionGame**: 예측 게임의 핵심 애그리게이트 (제목, 마감기한, 베팅 옵션 등)
- **Prediction**: 사용자의 개별 예측 참여 기록 (베팅 금액, 선택한 옵션)

### Value Objects
- **PredictionId**
- **GameStatus** (PENDING, ACTIVE, CLOSED, SETTLED)
- **PredictionResult** (WON, LOST)

### Domain Services
- **PredictionEconomicService**: 예측 시장의 경제적 효과 분석
- **PredictionSettlementService**: 배당률 계산 및 정산 로직

## 외부 의존성

- **Economy Context**: PMP 차감 및 PMC 지급 (MoneyWave 연동)
- **Auth Context**: 사용자 식별
- **User Context**: 사용자 통계 업데이트

## 도메인 이벤트

- PredictionGameCreated
- PredictionGameSettled
- PredictionParticipated
