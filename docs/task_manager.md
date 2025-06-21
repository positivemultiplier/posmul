# 🎯 PosMul Task Manager

## 📋 **현재 진행 상황 (Quick View)**

```
📊 전체 진행도: 25% (Economy Domain 90% + Prediction Domain 10%)
🎯 목표: 4주 내 MVP 완성
⏰ 현재 스프린트: Week 1 (Domain Modeling)
🔥 Critical Path: Prediction Domain → Economy-Kernel → UI → Database
```

---

## 🚀 **이번 주 해야 할 일 (Week 1)**

### **🔥 긴급 (Critical)**

#### ✅ **PD-001** - Prediction Domain 엔티티 구현

**담당**: Backend Developer | **기한**: 3일 | **진행률**: 0%

```powershell
cd src\bounded-contexts\prediction\domain\entities
# TODO: prediction-game.aggregate.ts 구현
# TODO: prediction.entity.ts 구현
# TODO: prediction-types.ts 구현
```

**체크리스트**:

- [ ] PredictionGame Aggregate 클래스
- [ ] Binary/WinDrawLose/Ranking 예측 타입
- [ ] 게임 상태 관리 로직
- [ ] Prediction Entity
- [ ] 도메인 규칙 검증

#### ✅ **EK-001** - Economy-Kernel 기본 구현

**담당**: Backend Developer | **기한**: 2일 | **진행률**: 0%

```powershell
cd src\shared
New-Item -ItemType Directory -Path "economy-kernel"
# TODO: EconomyKernel 서비스 구현
# TODO: PMP/PMC 잔액 조회 기능
```

**체크리스트**:

- [ ] EconomyKernel 싱글톤 서비스
- [ ] PMP/PMC 잔액 조회 (읽기 전용)
- [ ] 기본 도메인 이벤트 인터페이스
- [ ] Result 패턴 에러 처리

#### ✅ **PD-002** - Value Objects 구현

**담당**: Backend Developer | **기한**: 2일 | **진행률**: 0%
**의존성**: PD-001 완료 후 시작
**체크리스트**:

- [ ] PredictionId 브랜드 타입
- [ ] GameStatus enum
- [ ] PredictionResult value objects
- [ ] 입력 검증 및 에러 처리

---

## 📅 **다음 주 계획 (Week 2)**

### **🟡 중요 (High Priority)**

#### **PD-003** - Repository 인터페이스 (1일)

#### **PD-004** - Core Use Cases 구현 (3일)

#### **EK-002** - Domain Events 구현 (2일)

---

## 📈 **Task Progress Tracker**

| Task       | 상태      | 진행률 | 담당자  | 완료 예정일 |
| ---------- | --------- | ------ | ------- | ----------- |
| **PD-001** | 🔄 진행중 | 0%     | Backend | Day 3       |
| **EK-001** | ⏰ 대기중 | 0%     | Backend | Day 2       |
| **PD-002** | ⏰ 대기중 | 0%     | Backend | Day 5       |
| **PD-003** | 📋 계획됨 | 0%     | Backend | Week 2      |
| **PD-004** | 📋 계획됨 | 0%     | Backend | Week 2      |

**범례**: 🔄 진행중 | ⏰ 대기중 | 📋 계획됨 | ✅ 완료 | ❌ 차단됨

---

## ⚡ **Quick Commands**

### **개발 환경 설정**

```powershell
# 프로젝트 root로 이동
cd C:\G\posmul

# 개발 서버 시작
npm run dev

# 테스트 실행 (기존 33개 Economy 테스트 유지)
npm test

# 타입 체크
npm run type-check
```

### **새 파일 생성 템플릿**

```powershell
# Prediction Domain Entity 생성
New-Item -ItemType File -Path "src\bounded-contexts\prediction\domain\entities\prediction-game.aggregate.ts"

# Economy Kernel Service 생성
New-Item -ItemType File -Path "src\shared\economy-kernel\services\economy-kernel.service.ts"

# Value Object 생성
New-Item -ItemType File -Path "src\bounded-contexts\prediction\domain\value-objects\prediction-id.ts"
```

---

## 🎯 **Daily Standup Questions**

### **어제 한 일**

- [ ] PD-001: PredictionGame Aggregate 기본 구조 설계
- [ ] EK-001: EconomyKernel 인터페이스 정의
- [ ] 기존 Economy Domain 코드 리뷰

### **오늘 할 일**

- [ ] PD-001: PredictionGame 비즈니스 로직 구현
- [ ] EK-001: 기본 PMP/PMC 조회 메서드 구현
- [ ] 테스트 케이스 작성 시작

### **장애물/이슈**

- [ ] 없음 / Economy Domain과의 통합 방식 검토 필요

---

## 🚨 **Risk & Mitigation**

### **🔴 Critical Risks**

1. **Prediction Domain과 Economy 통합 복잡성**

   - **완화 방안**: Shared Kernel 패턴 사용, Anti-Corruption Layer 구현

2. **프론트엔드 UI 개발 지연 가능성**
   - **완화 방안**: Backend API 우선 완성, Mock 데이터로 UI 병렬 개발

### **🟡 Medium Risks**

1. **Supabase 데이터베이스 스키마 변경**
   - **완화 방안**: 마이그레이션 스크립트 미리 준비

---

## 📊 **Success Metrics**

### **Week 1 성공 지표**

- [ ] **기술적**: PredictionGame Aggregate 완전 구현
- [ ] **품질**: 기존 33개 테스트 모두 통과 유지
- [ ] **진행**: 전체 프로젝트 35% 진행도 달성

### **MVP 완성 지표 (4주 후)**

- [ ] **기능적**: 사용자가 예측 게임 참여 가능
- [ ] **경제적**: PMP → PMC 보상 시스템 작동
- [ ] **UI/UX**: 3초 이내 로딩, 모바일 최적화

---

## 🎉 **Weekly Review Template**

### **Week 1 회고 (금요일 예정)**

```markdown
## 완료된 작업

- [ ] PD-001: PredictionGame Aggregate 구현 (진행률: %)
- [ ] EK-001: Economy-Kernel 기본 구현 (진행률: %)
- [ ] PD-002: Value Objects 구현 (진행률: %)

## 다음 주 우선순위

1. Repository 인터페이스 정의
2. Use Cases 구현
3. Domain Events 시스템

## 배운 점 / 개선점

- Clean Architecture 적용 경험
- DDD 도메인 모델링 인사이트
- Economy Domain 통합 방식 이해
```

---

## 💡 **개발 팁 & 베스트 프랙티스**

### **🏗️ Architecture Guidelines**

- **도메인 순수성 유지**: 외부 의존성 없는 비즈니스 로직
- **Result 패턴 사용**: 모든 도메인 메서드에서 Result<T, E> 반환
- **브랜드 타입 활용**: type PredictionId = string & { brand: unique symbol }

### **🧪 테스트 원칙**

- **Domain Layer**: Mock 사용 금지, 순수 단위 테스트
- **Application Layer**: Repository Mock 허용
- **명명 규칙**: should*[behavior]\_when*[condition]

### **💻 PowerShell 필수 규칙**

```powershell
# ✅ 올바른 문법 (세미콜론 사용)
cd src\prediction; npm test; npm run build

# ❌ 금지된 문법 (&&는 PowerShell 미지원)
cd src\prediction && npm test && npm run build
```

---

## 🔄 **Task 상태 업데이트**

**마지막 업데이트**: 2024년 12월  
**다음 업데이트**: 매일 오전 9시  
**주간 리뷰**: 매주 금요일 오후 5시

---

**📞 문의사항이나 도움이 필요하면 언제든지 연락주세요!**

_"완벽한 경제 시스템보다는, 사용자가 지금 당장 플레이할 수 있는 재미있는 예측 게임을 먼저 만들자!" - PosMul 개발 철학_
