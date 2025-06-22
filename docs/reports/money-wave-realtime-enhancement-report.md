# 🌊 Money Wave 실시간 박진감 시스템 개선 보고서

**작성일**: 2024-12  
**작성자**: PosMul Development Team  
**목적**: 자정 Money Wave를 실시간 매시간 분배 시스템으로 개선

---

## 📊 **현재 시스템 분석**

### **🔍 현재 Money Wave 시스템 구조**

#### **1. 기존 자정 생성 시스템**

```typescript
// 현재: 매일 자정(00:00)에 일괄 생성
async calculateDailyPrizePool(): Promise<Result<DailyPrizePoolResult>> {
  // EBIT 기반 일일 상금 풀 계산
  const netEbit = this.expectedAnnualEbit * (1 - TAX_RATE - INTEREST_RATE);
  const ebitBasedPool = netEbit * EBIT_DAILY_RATIO;

  // 하루치 전체 금액을 한 번에 계산
  const totalDailyPool = ebitBasedPool + redistributedPmc + enterprisePmc;
}
```

#### **2. 현재 3단계 Money Wave**

- **Wave 1**: EBIT 기반 PMC 발행 (일일 단위)
- **Wave 2**: 미사용 PMC 재분배 (주기적)
- **Wave 3**: 기업가 생태계 인센티브 (요청 기반)

#### **3. 현재 문제점**

- 🔴 **정적 분배**: 하루에 한 번만 생성되어 박진감 부족
- 🔴 **시간 지연**: 자정까지 기다려야 새로운 상금 풀 생성
- 🔴 **사용자 이탈**: 실시간성 부족으로 예측 게임 참여도 저하
- 🔴 **기회 손실**: 활발한 시간대에 더 많은 인센티브 제공 불가

---

## 🎯 **개선 목표 및 요구사항**

### **🔥 핵심 개선 목표**

1. **실시간 박진감**: 매시간 Money Wave Pool 분배
2. **사용자 활동 연동**: 활동 시간대별 가중치 적용
3. **동적 조정**: 참여자 수에 따른 실시간 풀 크기 조정
4. **즉시성**: 게임 종료 즉시 상금 분배

### **📋 구체적 요구사항**

```typescript
interface HourlyMoneyWaveSystem {
  // 매시간 분배 금액
  hourlyPoolAmount: number;

  // 사용자 활동 시간 가중치
  activityTimeWeight: {
    [hour: number]: number; // 0-23시간별 가중치
  };

  // 실시간 카운팅
  realTimeCounters: {
    currentHourPool: number;
    participantsThisHour: number;
    distributedThisHour: number;
    remainingPool: number;
  };

  // 박진감 요소
  urgencyFactors: {
    timeRemaining: number; // 이번 시간 남은 시간
    competitionLevel: number; // 경쟁 강도
    bonusMultiplier: number; // 보너스 배수
  };
}
```

---

## 🛠️ **기술적 구현 방안**

### **1. 새로운 시간별 Money Wave 시스템**

#### **🕐 Hourly Money Wave Calculator**

```typescript
export class HourlyMoneyWaveCalculatorService {
  private readonly DAILY_POOL_RATIO = 1 / 24; // 하루 풀의 1/24
  private readonly ACTIVITY_WEIGHTS = {
    // 한국 시간 기준 활동 패턴
    6: 0.3, // 새벽
    7: 0.5, // 출근 시간
    8: 0.7,
    9: 0.9, // 오전 활동
    10: 1.0,
    11: 1.0,
    12: 1.2, // 점심 시간 피크
    13: 1.1,
    14: 0.9,
    15: 0.8,
    16: 0.9,
    17: 1.0,
    18: 1.1, // 퇴근 후
    19: 1.3, // 저녁 피크
    20: 1.5, // 최대 활동 시간
    21: 1.4,
    22: 1.2,
    23: 0.8,
    0: 0.4, // 심야
    1: 0.2,
    2: 0.1,
    3: 0.1,
    4: 0.1,
    5: 0.2,
  };

  async calculateHourlyPool(currentHour: number): Promise<number> {
    const baseDailyPool = await this.getBaseDailyPool();
    const hourlyBase = baseDailyPool * this.DAILY_POOL_RATIO;
    const activityWeight = this.ACTIVITY_WEIGHTS[currentHour] || 1.0;

    // 실시간 참여자 수 보정
    const participantBonus = await this.calculateParticipantBonus();

    return hourlyBase * activityWeight * participantBonus;
  }
}
```

#### **⚡ 실시간 분배 시스템**

```typescript
export class RealtimeMoneyWaveDistributor {
  private currentHourPool = 0;
  private distributedThisHour = 0;
  private participantsThisHour = 0;

  async distributeInstantly(gameId: PredictionGameId): Promise<void> {
    const now = new Date();
    const currentHour = now.getHours();

    // 1. 이번 시간 풀 계산 (아직 안했으면)
    if (this.shouldRecalculateHourlyPool(now)) {
      this.currentHourPool = await this.calculator.calculateHourlyPool(
        currentHour
      );
    }

    // 2. 게임 참여자들에게 즉시 분배
    const participants = await this.getGameParticipants(gameId);
    const perPersonAmount = this.calculatePerPersonAmount(participants.length);

    // 3. 실시간 분배 실행
    for (const participant of participants) {
      await this.distributePMC(participant.userId, perPersonAmount);
      this.participantsThisHour++;
      this.distributedThisHour += perPersonAmount;
    }

    // 4. 실시간 업데이트 브로드캐스트
    await this.broadcastPoolUpdate();
  }
}
```

### **2. 실시간 UI 업데이트 시스템**

#### **🔥 Navbar 실시간 카운터**

```typescript
// Navbar에 추가될 실시간 Money Wave 정보
interface RealtimeMoneyWaveDisplay {
  currentHourPool: number; // "🌊 이번시간: ₩2.3M"
  timeRemaining: string; // "⏰ 23분 남음"
  participantsThisHour: number; // "👥 234명 참여"
  distributedThisHour: number; // "💰 ₩1.8M 분배됨"
  nextHourPreview: number; // "다음시간 예상: ₩3.1M"
  urgencyLevel: "low" | "medium" | "high"; // 박진감 레벨
}
```

#### **📊 실시간 대시보드 컴포넌트**

```typescript
export function RealtimeMoneyWaveWidget() {
  const [waveData, setWaveData] = useState<RealtimeMoneyWaveDisplay>();

  useEffect(() => {
    // WebSocket 연결로 실시간 업데이트
    const ws = new WebSocket(process.env.NEXT_PUBLIC_REALTIME_WS_URL);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "MONEY_WAVE_UPDATE") {
        setWaveData(data.payload);
      }
    };

    // 매분마다 시간 카운트다운 업데이트
    const interval = setInterval(() => {
      updateTimeRemaining();
    }, 60000);

    return () => {
      ws.close();
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-lg">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-lg font-bold">
            🌊 이번시간 풀: ₩{waveData?.currentHourPool.toLocaleString()}
          </div>
          <div className="text-sm opacity-90">
            ⏰ {waveData?.timeRemaining} | 👥 {waveData?.participantsThisHour}명
            참여중
          </div>
        </div>
        <div className={`pulse-${waveData?.urgencyLevel}`}>
          <div className="text-2xl">🔥</div>
        </div>
      </div>
    </div>
  );
}
```

---

## 📈 **예상 효과 및 개선점**

### **🎯 정량적 개선 효과**

#### **1. 사용자 참여도 증가**

- **현재**: 하루 1회 정적 분배 → **개선후**: 24회 동적 분배
- **예상 참여 증가율**: 300-400%
- **평균 세션 시간**: 15분 → 45분 증가

#### **2. 박진감 지표**

```typescript
interface EngagementMetrics {
  현재시스템: {
    일일_분배_횟수: 1;
    사용자_대기시간: "최대 24시간";
    실시간성: "낮음";
    긴급감: "없음";
  };

  개선시스템: {
    시간별_분배_횟수: 24;
    사용자_대기시간: "최대 1시간";
    실시간성: "높음";
    긴급감: "매시간 카운트다운";
  };
}
```

#### **3. 경제적 효과**

- **Money Wave 효율성**: 85% → 95% 증가
- **사용자 리텐션**: 60% → 80% 증가
- **일일 활성 사용자**: 40% 증가 예상

---

## ⚠️ **잠재적 문제점 및 해결책**

### **🚨 기술적 도전과제**

#### **1. 서버 부하 증가**

**문제**: 매시간 계산 및 분배로 인한 서버 부하
**해결책**:

- 배치 처리로 DB 쿼리 최소화
- Redis 캐싱으로 빈번한 계산 최적화
- 큐 시스템으로 분배 처리 분산

#### **2. 실시간 동기화 복잡성**

**문제**: 여러 사용자 간 실시간 데이터 동기화
**해결책**:

- WebSocket + Redis Pub/Sub 활용
- 모든 서버 인스턴스에 실시간 전파

#### **3. 경제 시스템 균형**

**문제**: 너무 빈번한 분배로 인한 인플레이션
**해결책**:

- 동적 균형 조정 시스템 도입
- 인플레이션 지수 모니터링

---

## 🚀 **구현 로드맵**

### **📅 Phase 1: 기반 시스템 구축 (2주)**

- [ ] 시간별 Money Wave Calculator 개발
- [ ] 데이터베이스 스키마 확장
- [ ] 기본 실시간 분배 로직 구현
- [ ] 단위 테스트 작성

### **📅 Phase 2: 실시간 UI 개발 (1주)**

- [ ] Navbar 실시간 카운터 컴포넌트
- [ ] WebSocket 연결 및 상태 관리
- [ ] 박진감 있는 애니메이션 효과
- [ ] 모바일 최적화

### **📅 Phase 3: 통합 및 최적화 (1주)**

- [ ] 기존 시스템과의 통합
- [ ] 성능 최적화 및 부하 테스트
- [ ] 경제 시스템 균형 조정
- [ ] 모니터링 및 알림 시스템

### **📅 Phase 4: 출시 및 모니터링 (1주)**

- [ ] 베타 테스트 및 피드백 수집
- [ ] 프로덕션 배포
- [ ] 실시간 모니터링 대시보드
- [ ] 사용자 반응 분석

---

## 💡 **결론 및 권장사항**

### **🎯 핵심 가치 제안**

1. **즉시성**: 게임 종료 즉시 보상으로 만족도 극대화
2. **박진감**: 매시간 카운트다운으로 긴급감 조성
3. **전략성**: 시간대별 특성을 고려한 전략적 게임 플레이
4. **투명성**: 실시간 풀 상태로 신뢰도 증대

### **🚀 우선 구현 권장사항**

1. **Navbar 실시간 카운터**: 가장 가시적이고 즉각적인 효과
2. **시간별 풀 계산**: 핵심 비즈니스 로직 우선 구현
3. **WebSocket 연결**: 실시간성 확보를 위한 필수 인프라
4. **모니터링 시스템**: 안정적 운영을 위한 필수 요소

### **📊 성공 지표 (KPI)**

- **사용자 참여도**: 일일 활성 사용자 40% 증가
- **세션 지속시간**: 평균 30분 증가
- **게임 완료율**: 85% 이상 유지
- **사용자 만족도**: 4.5/5.0 이상

---

**💬 이 보고서는 PosMul 예측 게임 플랫폼의 Money Wave 시스템을 더욱 박진감 넘치고 사용자 친화적인 실시간 시스템으로 발전시키기 위한 종합적인 개선 방안을 제시합니다.**
