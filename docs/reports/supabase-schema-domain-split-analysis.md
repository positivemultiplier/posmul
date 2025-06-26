# Supabase Schema 도메인 분할 작업 분석 보고서

> **문서 목적**: public schema를 domain schema로 분할하는 작업의 복잡도 및 소요 시간 분석  
> **작성일**: 2025-06-24 19:30:00  
> **대상 독자**: 개발팀, 아키텍트  
> **현재 상황**: Public schema 과부하로 인한 도메인별 분할 필요

## 📋 목차

1. [현재 상황 분석](#현재-상황-분석)
2. [작업 복잡도 평가](#작업-복잡도-평가)
3. [도메인별 분할 계획](#도메인별-분할-계획)
4. [마이그레이션 전략](#마이그레이션-전략)
5. [소요 시간 및 리소스 예측](#소요-시간-및-리소스-예측)
6. [리스크 분석](#리스크-분석)
7. [실행 계획](#실행-계획)

## 현재 상황 분석

### 🎯 문제 현황

```mermaid
pie title "Public Schema 현재 상태"
    "예측 관련 테이블" : 25
    "투자 관련 테이블" : 20
    "포럼 관련 테이블" : 15
    "기부 관련 테이블" : 12
    "경제 관련 테이블" : 10
    "사용자 관련 테이블" : 8
    "인증 관련 테이블" : 5
    "기타 테이블" : 5
```

**현재 확인된 정보:**

- **총 테이블 수**: 41개 (Public Schema)
- **Auth 테이블**: 16개 (별도 Schema)
- **활성 사용자**: 6명
- **경제 거래**: 35건
- **Context 무한루프**: `list-tables` 명령 시 발생

### 📊 도메인별 테이블 분포

```mermaid
graph TD
    A[Current Public Schema - 41 Tables] --> B[Prediction Domain]
    A --> C[Investment Domain]
    A --> D[Forum Domain]
    A --> E[Donation Domain]
    A --> F[Economy Domain]
    A --> G[User Domain]
    A --> H[Auth Domain - 별도]

    B --> B1[prediction_games<br/>predictions<br/>game_categories<br/>...]
    C --> C1[investment_opportunities<br/>merchant_info<br/>advertisements<br/>...]
    D --> D1[forum_posts<br/>forum_comments<br/>forum_categories<br/>...]
    E --> E1[donation_institutes<br/>donations<br/>opinion_leaders<br/>...]
    F --> F1[pmp_pmc_accounts<br/>transactions<br/>money_waves<br/>...]
    G --> G1[user_profiles<br/>user_statistics<br/>user_activities<br/>...]
    H --> H1[Supabase Auth<br/>16개 테이블<br/>별도 관리]

    style A fill:#FF6B6B
    style H fill:#4ECDC4
```

### 🔍 복잡도 요인 분석

```mermaid
flowchart TD
    A[Schema 분할 복잡도] --> B[테이블 의존성]
    A --> C[데이터 무결성]
    A --> D[애플리케이션 코드 변경]
    A --> E[권한 및 RLS 정책]

    B --> B1[외래키 관계: 고복잡도]
    B --> B2[크로스 도메인 참조: 중복잡도]
    B --> B3[인덱스 재구성: 중복잡도]

    C --> C1[데이터 마이그레이션: 고복잡도]
    C --> C2[백업/복구 전략: 고복잡도]
    C --> C3[트랜잭션 일관성: 고복잡도]

    D --> D1[Repository 레이어: 중복잡도]
    D --> D2[MCP 쿼리 수정: 중복잡도]
    D --> D3[타입 정의 업데이트: 저복잡도]

    E --> E1[RLS 정책 재작성: 고복잡도]
    E --> E2[스키마별 권한 설정: 중복잡도]
    E --> E3[사용자 역할 재정의: 중복잡도]

    style B1 fill:#FFE5E5
    style C1 fill:#FFE5E5
    style C2 fill:#FFE5E5
    style C3 fill:#FFE5E5
    style E1 fill:#FFE5E5
```

## 작업 복잡도 평가

### 🎪 복잡도 매트릭스

```mermaid
graph TD
    subgraph "고복잡도 - 핵심 도전 과제"
        A1[Prediction Domain<br/>25+ 테이블<br/>복잡한 게임 로직]
        A2[Economy Domain<br/>PMP/PMC 통합<br/>금융 트랜잭션]
        A3[외래키 의존성<br/>크로스 도메인 참조<br/>데이터 일관성]
    end

    subgraph "중복잡도 - 관리 가능"
        B1[Investment Domain<br/>20+ 테이블<br/>표준 CRUD]
        B2[Forum Domain<br/>15+ 테이블<br/>계층형 구조]
        B3[Repository 코드<br/>MCP 쿼리 수정<br/>타입 업데이트]
    end

    subgraph "저복잡도 - 상대적 용이"
        C1[Donation Domain<br/>12+ 테이블<br/>단순 구조]
        C2[User Domain<br/>8+ 테이블<br/>기본 프로필]
        C3[설정 및 메타데이터<br/>환경변수 수정<br/>문서 업데이트]
    end

    style A1 fill:#FF9999
    style A2 fill:#FF9999
    style A3 fill:#FF9999
    style B1 fill:#FFD700
    style B2 fill:#FFD700
    style B3 fill:#FFD700
    style C1 fill:#90EE90
    style C2 fill:#90EE90
    style C3 fill:#90EE90
```

### 📈 기술적 난이도 분석

**1. 데이터베이스 레벨 (가장 복잡)**

- **외래키 재구성**: 교차 스키마 참조 처리
- **RLS 정책 재작성**: 스키마별 보안 정책
- **인덱스 최적화**: 도메인별 성능 튜닝
- **트랜잭션 경계**: 분산 트랜잭션 처리

**2. 애플리케이션 레벨 (중간 복잡도)**

- **Repository 패턴**: 스키마별 연결 관리
- **MCP 쿼리**: 프로젝트별 스키마 타겟팅
- **타입 생성**: 도메인별 TypeScript 타입

**3. 인프라 레벨 (상대적 단순)**

- **환경 변수**: 스키마별 설정
- **CI/CD 파이프라인**: 마이그레이션 자동화
- **모니터링**: 스키마별 메트릭

## 도메인별 분할 계획

### 🏗️ 목표 스키마 구조

```mermaid
graph TD
    A[Supabase Database] --> B[public Schema - 공통]
    A --> C[prediction Schema]
    A --> D[investment Schema]
    A --> E[forum Schema]
    A --> F[donation Schema]
    A --> G[economy Schema]
    A --> H[user Schema]
    A --> I[auth Schema - 기존]

    B --> B1[shared_metadata<br/>system_settings<br/>migrations_log]
    C --> C1[prediction_games<br/>predictions<br/>game_results<br/>...]
    D --> D1[merchants<br/>advertisements<br/>investments<br/>...]
    E --> E1[posts<br/>comments<br/>votes<br/>...]
    F --> F1[donations<br/>institutes<br/>campaigns<br/>...]
    G --> G1[pmp_accounts<br/>pmc_accounts<br/>transactions<br/>...]
    H --> H1[profiles<br/>statistics<br/>activities<br/>...]

    style B fill:#E8F5E8
    style I fill:#E8F0FF
```

### 📊 도메인별 우선순위

```mermaid
pie title "마이그레이션 우선순위 배정"
    "1순위 - Economy/User" : 30
    "1순위 - Donation" : 20
    "2순위 - Forum" : 25
    "2순위 - Investment" : 15
    "3순위 - Prediction" : 10
```

**우선순위 결정 기준:**

1. **의존성 최소화**: 다른 도메인에 덜 의존적인 순서
2. **비즈니스 영향도**: 서비스 중단 시 파급효과
3. **기술적 복잡도**: 구현 난이도 및 리스크
4. **데이터 크기**: 마이그레이션할 데이터 양

## 마이그레이션 전략

### 🔄 단계별 마이그레이션 프로세스

```mermaid
flowchart TD
    A[Phase 0: 준비 단계] --> B[Phase 1: 저위험 도메인]
    B --> C[Phase 2: 중위험 도메인]
    C --> D[Phase 3: 고위험 도메인]
    D --> E[Phase 4: 검증 및 최적화]

    A --> A1[백업 생성<br/>롤백 계획<br/>테스트 환경 구축]
    A --> A2[의존성 분석<br/>마이그레이션 스크립트<br/>검증 도구]

    B --> B1[User Domain<br/>Donation Domain<br/>독립적 테이블]
    B --> B2[기본 검증<br/>성능 테스트<br/>롤백 테스트]

    C --> C1[Forum Domain<br/>Investment Domain<br/>중간 의존성]
    C --> C2[교차 참조 처리<br/>인덱스 최적화<br/>성능 모니터링]

    D --> D1[Economy Domain<br/>Prediction Domain<br/>핵심 비즈니스]
    D --> D2[복잡한 관계 처리<br/>트랜잭션 검증<br/>완전성 체크]

    E --> E1[전체 성능 점검<br/>보안 검토<br/>문서 업데이트]
    E --> E2[모니터링 설정<br/>알림 구성<br/>운영 가이드]

    style A fill:#E3F2FD
    style B fill:#E8F5E8
    style C fill:#FFF3E0
    style D fill:#FFEBEE
    style E fill:#F3E5F5
```

### 🛠️ 기술적 구현 방법

#### 1. 블루-그린 마이그레이션

```mermaid
sequenceDiagram
    participant Current as 현재 Public Schema
    participant New as 새 Domain Schemas
    participant App as Application
    participant Users as Users

    Current->>App: 서비스 운영 중
    Note over Current, New: 1. 새 스키마 생성
    Current->>New: 데이터 복사
    Note over Current, New: 2. 동기화 설정
    App->>New: 점진적 트래픽 이동
    Note over App, Users: 3. 검증 단계
    Current->>Current: 읽기 전용 모드
    App->>New: 완전 전환
    Note over Current: 4. 구 스키마 정리
```

#### 2. 데이터 일관성 전략

**동시 쓰기 (Dual Write) 패턴:**

```sql
-- 트랜잭션으로 양쪽 스키마에 동시 쓰기
BEGIN;
  INSERT INTO public.predictions (...);
  INSERT INTO prediction.predictions (...);
COMMIT;
```

**이벤트 기반 동기화:**

```sql
-- 트리거를 통한 자동 동기화
CREATE OR REPLACE FUNCTION sync_to_domain_schema()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO prediction.predictions SELECT * FROM NEW;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## 소요 시간 및 리소스 예측

### ⏰ 작업 시간 예측

```mermaid
gantt
    title Schema 분할 작업 일정
    dateFormat  YYYY-MM-DD
    section 준비 단계
    환경 설정 및 백업         :prep1, 2025-06-25, 3d
    의존성 분석 및 계획       :prep2, after prep1, 2d
    테스트 환경 구축         :prep3, after prep2, 2d

    section 1단계 - 저위험
    User Domain 분할         :phase1-1, after prep3, 3d
    Donation Domain 분할     :phase1-2, after phase1-1, 3d
    검증 및 테스트          :phase1-3, after phase1-2, 2d

    section 2단계 - 중위험
    Forum Domain 분할        :phase2-1, after phase1-3, 4d
    Investment Domain 분할   :phase2-2, after phase2-1, 4d
    통합 테스트             :phase2-3, after phase2-2, 3d

    section 3단계 - 고위험
    Economy Domain 분할      :phase3-1, after phase2-3, 5d
    Prediction Domain 분할   :phase3-2, after phase3-1, 6d
    전체 검증              :phase3-3, after phase3-2, 4d

    section 최종 단계
    성능 최적화             :final1, after phase3-3, 3d
    문서화 및 정리          :final2, after final1, 2d
```

### 📊 인력 및 리소스 배정

```mermaid
pie title "작업 인력 배정 (인시 기준)"
    "데이터베이스 전문가" : 40
    "백엔드 개발자" : 30
    "DevOps 엔지니어" : 15
    "QA 테스터" : 10
    "프로젝트 매니저" : 5
```

**예상 총 소요 시간:**

- **전체 기간**: 6-8주
- **실제 개발**: 28-35 작업일
- **총 인시**: 180-220 시간

**단계별 상세 예측:**

| 단계       | 기간  | 인력 | 주요 작업                | 리스크 |
| ---------- | ----- | ---- | ------------------------ | ------ |
| **준비**   | 1주   | 2명  | 분석, 설계, 환경구축     | 낮음   |
| **1단계**  | 1.5주 | 2명  | User, Donation 분할      | 낮음   |
| **2단계**  | 2주   | 3명  | Forum, Investment 분할   | 중간   |
| **3단계**  | 2.5주 | 3명  | Economy, Prediction 분할 | 높음   |
| **마무리** | 1주   | 2명  | 최적화, 문서화           | 낮음   |

## 리스크 분석

### ⚠️ 주요 리스크 요소

```mermaid
graph TD
    A[프로젝트 리스크] --> B[기술적 리스크]
    A --> C[비즈니스 리스크]
    A --> D[운영 리스크]

    B --> B1[데이터 손실<br/>확률: 중간<br/>영향: 치명적]
    B --> B2[성능 저하<br/>확률: 높음<br/>영향: 높음]
    B --> B3[호환성 문제<br/>확률: 중간<br/>영향: 중간]

    C --> C1[서비스 중단<br/>확률: 낮음<br/>영향: 높음]
    C --> C2[사용자 경험 저하<br/>확률: 중간<br/>영향: 중간]
    C --> C3[데이터 불일치<br/>확률: 중간<br/>영향: 높음]

    D --> D1[인력 부족<br/>확률: 중간<br/>영향: 중간]
    D --> D2[일정 지연<br/>확률: 높음<br/>영향: 중간]
    D --> D3[예산 초과<br/>확률: 중간<br/>영향: 낮음]

    style B1 fill:#FFE5E5
    style C1 fill:#FFE5E5
    style C3 fill:#FFE5E5
    style D2 fill:#FFF3E0
```

### 🛡️ 리스크 완화 전략

```mermaid
flowchart TD
    A[리스크 완화 전략] --> B[기술적 대응]
    A --> C[프로세스 대응]
    A --> D[조직적 대응]

    B --> B1[자동화된 백업<br/>실시간 모니터링<br/>롤백 메커니즘]
    B --> B2[스테이징 환경<br/>A/B 테스트<br/>성능 벤치마크]
    B --> B3[데이터 검증<br/>무결성 체크<br/>일관성 모니터링]

    C --> C1[단계적 배포<br/>체크포인트 설정<br/>검증 게이트]
    C --> C2[코드 리뷰<br/>페어 프로그래밍<br/>문서화]
    C --> C3[테스트 자동화<br/>회귀 테스트<br/>부하 테스트]

    D --> D1[크로스 트레이닝<br/>백업 인력 확보<br/>외부 자문]
    D --> D2[버퍼 시간 확보<br/>우선순위 조정<br/>범위 관리]
    D --> D3[정기 보고<br/>이해관계자 소통<br/>의사결정 프로세스]

    style B1 fill:#E8F5E8
    style C1 fill:#E8F5E8
    style D1 fill:#E8F5E8
```

## 실행 계획

### 🚀 즉시 실행 가능한 액션 아이템

#### Week 1: 준비 단계

```mermaid
flowchart LR
    A[Day 1-2] --> A1[현재 스키마 분석<br/>의존성 매핑<br/>백업 생성]
    A --> A2[마이그레이션 스크립트 작성<br/>테스트 환경 구축]

    B[Day 3-5] --> B1[User Domain 스키마 설계<br/>Donation Domain 스키마 설계]
    B --> B2[Repository 인터페이스 수정<br/>MCP 쿼리 준비]

    C[Day 6-7] --> C1[스테이징 테스트<br/>성능 벤치마크]
    C --> C2[롤백 절차 검증<br/>팀 교육]
```

#### Week 2-3: 저위험 도메인 분할

**User Domain (3일):**

```sql
-- 1일차: 스키마 생성
CREATE SCHEMA user;

-- 2일차: 테이블 이동
CREATE TABLE user.profiles AS SELECT * FROM public.user_profiles;
CREATE TABLE user.statistics AS SELECT * FROM public.user_statistics;
CREATE TABLE user.activities AS SELECT * FROM public.user_activities;

-- 3일차: 인덱스 및 권한 설정
CREATE INDEX idx_user_profiles_user_id ON user.profiles(user_id);
-- RLS 정책 적용
```

**Donation Domain (3일):**

```sql
-- 유사한 패턴으로 진행
CREATE SCHEMA donation;
-- 6개 테이블 이동
-- 권한 및 정책 설정
```

### 📋 체크리스트

#### 마이그레이션 전 필수 점검사항

- [ ] **데이터 백업**: 전체 스키마 덤프 생성
- [ ] **의존성 분석**: 모든 외래키 관계 문서화
- [ ] **성능 기준선**: 현재 쿼리 성능 측정
- [ ] **모니터링 설정**: 실시간 알림 구성
- [ ] **롤백 계획**: 각 단계별 복구 절차
- [ ] **테스트 시나리오**: 기능 및 성능 테스트

#### 도메인별 마이그레이션 체크리스트

- [ ] **스키마 생성**: `CREATE SCHEMA domain_name`
- [ ] **테이블 이동**: 구조 + 데이터 복사
- [ ] **인덱스 재생성**: 성능 최적화
- [ ] **RLS 정책**: 보안 규칙 적용
- [ ] **외래키 수정**: 크로스 스키마 참조
- [ ] **권한 설정**: 사용자별 접근 권한
- [ ] **애플리케이션 코드**: Repository 수정
- [ ] **기능 테스트**: 모든 CRUD 작업 검증
- [ ] **성능 테스트**: 쿼리 성능 확인

### 💡 권장사항

#### 1. 점진적 접근

- **한 번에 하나씩**: 도메인별 순차 진행
- **검증 후 다음 단계**: 각 단계 완료 후 충분한 검증
- **빠른 롤백**: 문제 발생 시 즉시 이전 상태 복구

#### 2. 모니터링 강화

- **실시간 대시보드**: 마이그레이션 진행 상황 시각화
- **성능 메트릭**: 쿼리 응답시간, 처리량 모니터링
- **오류 알림**: 실시간 오류 감지 및 알림

#### 3. 팀 협업

- **데일리 스탠드업**: 매일 진행 상황 공유
- **위험 요소 공유**: 발견된 이슈 즉시 공유
- **지식 전파**: 마이그레이션 과정 문서화

---

## 🎯 결론 및 권장사항

### 📊 전체 작업 예측

```mermaid
pie title "전체 작업 난이도 분포"
    "고난이도 (Economy, Prediction)" : 45
    "중난이도 (Forum, Investment)" : 35
    "저난이도 (User, Donation)" : 20
```

### 🏆 성공 요인

1. **충분한 준비**: 의존성 분석 및 백업 전략
2. **단계적 접근**: 위험도 기반 우선순위
3. **지속적 모니터링**: 실시간 성능 추적
4. **빠른 피드백**: 각 단계별 검증 및 조정
5. **팀 협업**: 명확한 역할 분담 및 소통

### 💰 비용 대비 효과

**투입 비용:**

- **인력**: 180-220 시간
- **인프라**: 스테이징 환경 추가 비용
- **기회비용**: 신규 기능 개발 지연

**기대 효과:**

- **성능 향상**: 도메인별 최적화로 쿼리 성능 개선
- **유지보수성**: 명확한 도메인 경계로 코드 관리 용이
- **확장성**: 도메인별 독립적 확장 가능
- **보안**: 세분화된 권한 관리

**권장 결정:** ✅ **진행 권장**

- 현재 복잡도가 임계점에 도달
- 장기적 이익이 단기 비용을 상회
- 팀의 DDD 아키텍처 역량 강화 기회

---

## 📝 문서 정보

**작성일**: 2025-06-24 19:30:00  
**버전**: 1.0  
**작성자**: AI Agent (Claude)  
**검토 필요**: 데이터베이스 아키텍트, 개발팀 리드  
**승인자**: CTO

### 📈 문서 활용도

```mermaid
pie title "분석 보고서 구성"
    "현황 분석" : 25
    "기술적 계획" : 30
    "일정 및 리소스" : 20
    "리스크 관리" : 15
    "실행 가이드" : 10
```

이 분석 보고서는 schema 분할 작업의 전체적인 그림을 제공하며, 실제 실행 시 세부 계획 수립의 기초 자료로 활용할 수 있습니다.
