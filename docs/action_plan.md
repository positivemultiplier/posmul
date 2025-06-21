# PosMul 프로젝트 액션플랜 📋

## 🎯 **현재 상황 분석**

### **📊 프로젝트 완성도 현황**

| 도메인                    | 완성도 | 핵심 상태                                  | 사용자 체감                 |
| ------------------------- | ------ | ------------------------------------------ | --------------------------- |
| **Economy Domain**        | 🟢 90% | PMP/PMC 시스템 완성, 경제 이론 구현 완료   | 백그라운드 시스템           |
| **Prediction Domain**     | 🔴 10% | 기본 폴더 구조만 존재, 핵심 로직 미구현    | **직접 체감하는 핵심 기능** |
| **Shared Economy-Kernel** | 🟡 70% | 인터페이스는 설계되었으나 실제 구현 미완성 | 모든 도메인 연동 필수       |

### **🔍 핵심 문제 정의**

**사용자 관점에서의 딜레마:**

1. **Economy-Kernel 완성** → 모든 포인트 시스템이 작동하지만 **실제 사용할 기능이 없음**
2. **Prediction Domain 완성** → 예측 게임은 플레이할 수 있지만 **포인트 시스템이 작동하지 않음**

---

## 🚀 **우선순위 결정: Hybrid Approach (병렬 개발)**

### **결론: Prediction Domain 우선, Economy-Kernel 필수 최소 구현 병행**

**🎯 핵심 전략:**

- **사용자가 실제 체감할 수 있는 MVP**를 빠르게 구현
- **예측 게임 + 최소한의 포인트 시스템** 연동
- **완전한 경제 시스템은 2단계에서 완성**

---

## 📋 **Phase 1: MVP 출시 (4-6주)**

### **🎮 Prediction Domain 핵심 구현 (우선순위 1)**

#### **1.1 도메인 모델 구현 (1주차)**

- [ ] **PredictionGame Aggregate** 구현
  - Binary Prediction (예/아니오)
  - Win/Draw/Lose Prediction (승/무/패)
  - Ranking Prediction (순위 예측)
- [ ] **Prediction Entity** 구현
- [ ] **PredictionType Value Objects** 구현
- [ ] **게임 생명주기**: Created → Active → Ended → Settled

#### **1.2 예측 게임 비즈니스 로직 (2주차)**

- [ ] **예측 참여 로직** (PMP 차감)
- [ ] **예측 결과 계산 로직**
- [ ] **보상 분배 로직** (PMC 지급)
- [ ] **점수 계산 알고리즘**

#### **1.3 Repository & Use Cases (2주차)**

- [ ] **IPredictionGameRepository** 인터페이스
- [ ] **CreatePredictionGame UseCase**
- [ ] **ParticipatePrediction UseCase**
- [ ] **FinalizePredictionGame UseCase**

#### **1.4 프론트엔드 핵심 UI (3주차)**

- [ ] **예측 게임 목록 페이지**
- [ ] **예측 참여 페이지** (그래프 포함)
- [ ] **예측 결과 페이지**
- [ ] **사용자 대시보드** (포인트 현황)

### **🏦 Economy-Kernel 최소 구현 (우선순위 2)**

#### **1.5 Shared Economy-Kernel 핵심만 구현 (1-2주차 병행)**

- [ ] **EconomyKernel 서비스** 구현
  ```typescript
  export class EconomyKernel {
    getPmpBalance(userId: UserId): Promise<number>;
    getPmcBalance(userId: UserId): Promise<number>;
    // 읽기 전용 기본 기능만
  }
  ```
- [ ] **Domain Events** 기본 구현
  - PmpSpentEvent (예측 참여)
  - PmcEarnedEvent (예측 성공)
- [ ] **Event Publisher** 기본 구현

#### **1.6 Prediction-Economy 연동 (3주차 병행)**

- [ ] **PredictionEconomicService** 구현
- [ ] **예측 참여 시 PMP 차감**
- [ ] **예측 성공 시 PMC 획득**
- [ ] **기본적인 경제 이벤트 처리**

### **📊 데이터베이스 & 인프라 (4주차)**

- [ ] **Prediction 도메인 마이그레이션**
- [ ] **Supabase 연동 완성**
- [ ] **Edge Functions 핵심 기능 배포**
- [ ] **실시간 업데이트 시스템**

---

## 📋 **Phase 2: 완전한 경제 시스템 (6-10주)**

### **🏛️ Economy-Kernel 완전 구현**

- [ ] **MoneyWave 1-2-3 시스템** 완성
- [ ] **Agency Theory 엔진** 완전 연동
- [ ] **Behavioral Economics** 실제 적용
- [ ] **Network Effects** 구현

### **🔗 Cross-Domain 통합**

- [ ] **모든 도메인과 Economy 연동**
- [ ] **실시간 경제 지표 모니터링**
- [ ] **개인 효용함수 추정 시스템**

---

## 🎯 **핵심 개발 Task 우선순위**

### **🥇 최고 우선순위 (즉시 시작)**

1. **Prediction Game Aggregate 구현**

   - Binary/WinDrawLose/Ranking 예측 타입
   - 게임 상태 관리 (Created → Active → Ended → Settled)

2. **예측 참여 및 결과 처리 로직**

   - PMP 잔액 확인 → 예측 참여 → 결과 계산 → PMC 보상

3. **기본 Economy-Kernel 서비스**
   - 포인트 잔액 조회 (getPmpBalance, getPmcBalance)
   - 기본 도메인 이벤트 처리

### **🥈 중간 우선순위 (1-2주 후)**

4. **예측 게임 UI/UX**

   - 게임 목록, 참여 폼, 결과 그래프
   - 실시간 업데이트

5. **Supabase 데이터베이스 연동**
   - 예측 게임 데이터 저장/조회
   - 포인트 거래 내역

### **🥉 낮은 우선순위 (4주 후)**

6. **고급 경제 시스템**
   - MoneyWave, Agency Theory 완전 구현
   - 복잡한 경제 모델

---

## 🛠️ **개발 환경별 작업 분배**

### **백엔드 (Domain/Application/Infrastructure)**

- **1주차**: Prediction Domain 모델링
- **2주차**: Use Cases & Repository 구현
- **3주차**: Economy-Kernel 기본 연동
- **4주차**: 데이터베이스 & API 완성

### **프론트엔드 (Presentation)**

- **2주차**: 기본 컴포넌트 & 페이지 구조
- **3주차**: 예측 게임 UI 완성
- **4주차**: 실시간 업데이트 & 그래프

### **인프라 (Supabase/Edge Functions)**

- **3주차**: 데이터베이스 마이그레이션
- **4주차**: Edge Functions 배포

---

## ✅ **성공 지표 (MVP 완성 기준)**

### **기능적 요구사항**

- [ ] 사용자가 예측 게임에 참여할 수 있음
- [ ] PMP로 예측 참여, PMC로 보상 수령
- [ ] 예측 결과를 그래프로 확인 가능
- [ ] 실시간 포인트 잔액 확인

### **기술적 요구사항**

- [ ] Clean Architecture 준수
- [ ] 33개 기존 테스트 모두 통과
- [ ] Prediction Domain 테스트 추가 작성
- [ ] PowerShell 환경에서 정상 작동

### **사용자 경험**

- [ ] 로딩 시간 3초 이내
- [ ] 모바일 반응형 디자인
- [ ] 직관적인 예측 참여 UX

---

## 🎯 **다음 액션 아이템**

### **🔥 이번 주 할 일 (우선순위 최고)**

1. **Prediction Domain 모델링 시작**

   ```bash
   # PowerShell에서 실행
   cd src\bounded-contexts\prediction\domain\entities
   # PredictionGame Aggregate 구현
   ```

2. **Economy-Kernel 인터페이스 정의**

   ```bash
   # PowerShell에서 실행
   cd src\shared
   New-Item -ItemType Directory -Path "economy-kernel"
   # 기본 EconomyKernel 서비스 구현
   ```

3. **기본 예측 게임 UI 목업 작성**

### **📅 2주차 할 일**

4. **예측 참여 Use Case 구현**
5. **기본 포인트 시스템 연동**
6. **데이터베이스 스키마 설계**

---

## 💡 **핵심 설계 결정 사항**

### **🎮 예측 게임 타입 정의**

```typescript
enum PredictionType {
  BINARY = "binary", // 예/아니오
  WIN_DRAW_LOSE = "wdl", // 승/무/패
  RANKING = "ranking", // 순위 예측
}
```

### **🏆 보상 시스템**

- **참여**: PMP 차감 (게임별 다른 참여비)
- **성공**: PMC 획득 (정확도에 따른 차등 보상)
- **실패**: PMP 손실, PMC 획득 없음

### **📊 그래프 시각화**

- **Real-time 예측 현황** (Chart.js 또는 D3.js)
- **예측 정확도 히스토리**
- **포인트 변동 추이**

---

## 🎉 **결론**

**PosMul 프로젝트의 성공 열쇠는 "사용자가 실제 체감할 수 있는 예측 게임"**입니다.

**Economy Domain이 90% 완성된 강력한 기반** 위에서 **Prediction Domain을 빠르게 구현**하여, **4-6주 내에 실제 사용 가능한 MVP**를 출시하는 것이 최적의 전략입니다.

**핵심 메시지**:

> "완벽한 경제 시스템보다는, 사용자가 지금 당장 플레이할 수 있는 재미있는 예측 게임을 먼저 만들자!"

---

_작성일: 2024년 12월_  
_프로젝트: PosMul AI 직접민주주의 플랫폼_
