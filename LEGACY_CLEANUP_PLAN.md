# PosMul 레거시 정리 계획

**작성일**: 2024년 12월 19일  
**대상 프로젝트**: PosMul AI 직접민주주의 플랫폼  
**목표**: 성능 최적화 및 코드 품질 향상  

---

## 📋 개요

현재 PosMul 프로젝트는 전반적으로 우수한 아키텍처를 가지고 있지만, **성능 최적화**와 **코드 정리**를 통해 더욱 효율적인 시스템으로 발전시킬 수 있습니다. 본 계획서는 식별된 레거시 이슈들을 체계적으로 정리하는 로드맵을 제시합니다.

### 🎯 정리 목표
- 🚀 **성능 향상**: 데이터베이스 쿼리 성능 20% 개선
- 🔒 **보안 강화**: 엔터프라이즈급 보안 수준 달성
- 🧹 **코드 정리**: 미사용 코드 및 중복 제거
- 📚 **문서화 개선**: 개발자 경험 향상

---

## 🔥 Phase 1: 긴급 성능 최적화 (1-2주)

### 1.1 RLS 정책 성능 최적화

#### 📊 현재 상태
- **영향받는 테이블**: 24개
- **문제**: `auth.<function>()` 호출이 각 행마다 재평가됨
- **성능 영향**: 대규모 쿼리 시 심각한 성능 저하

#### 🛠️ 해결 방안
```sql
-- ❌ 기존 (성능 문제)
CREATE POLICY "Users can view their own data" ON table_name
  FOR SELECT USING (auth.uid() = user_id);

-- ✅ 개선 (성능 최적화)
CREATE POLICY "Users can view their own data" ON table_name
  FOR SELECT USING ((SELECT auth.uid()) = user_id);
```

#### 📋 작업 목록

**Economy 스키마 (5개 테이블)**
- [ ] `economy.system_statistics` - "Authenticated users can view system stats"
- [ ] `economy.social_welfare_parameters` - "Authenticated users can view social welfare parameters"
- [ ] `economy.pmp_pmc_accounts` - 사용자별 계정 접근 정책
- [ ] `economy.pmp_pmc_transactions` - 거래 내역 접근 정책
- [ ] `economy.transparency_reports` - 투명성 보고서 접근 정책

**Donation 스키마 (3개 테이블)**
- [ ] `donation.donation_certificates` - "Users can view their own certificates"
- [ ] `donation.donation_activity_logs` - "Users can view their donation activity logs"
- [ ] `donation.donations` - 기부 내역 접근 정책

**Forum 스키마 (8개 정책)**
- [ ] `forum.forum_posts` - "Users can create posts", "Authors can update their posts"
- [ ] `forum.forum_comments` - "Users can create comments", "Authors can update their comments"
- [ ] `forum.forum_votes` - "Users can view their own votes", "Users can create votes", "Users can update their votes"
- [ ] `forum.forum_activity_logs` - "Users can view their own activity logs"

**User 스키마 (1개 테이블)**
- [ ] `user.user_utility_clusters` - "Authenticated users can view user clusters"

**기타 스키마 (7개 정책)**
- [ ] `study_cycle.sc_readings` - 읽기 관련 정책 (3개)
- [ ] `study_cycle.sc_reading_progress` - 진행률 관련 정책
- [ ] `assessment.assessments` - 평가 관련 정책
- [ ] `assessment.questions` - 질문 관련 정책
- [ ] `assessment.submissions` - 제출 관련 정책 (2개)
- [ ] `public.monorepo_migration_status` - 마이그레이션 상태 정책 (2개)

#### 🔧 구현 스크립트
```sql
-- RLS 정책 최적화 마이그레이션
-- 파일: migrations/optimize_rls_policies.sql

-- 1. Economy 스키마 최적화
DROP POLICY IF EXISTS "Authenticated users can view system stats" ON economy.system_statistics;
CREATE POLICY "Authenticated users can view system stats" ON economy.system_statistics
  FOR SELECT USING ((SELECT auth.role()) = 'authenticated');

-- 2. 사용자별 데이터 접근 최적화
DROP POLICY IF EXISTS "Users can view their own certificates" ON donation.donation_certificates;
CREATE POLICY "Users can view their own certificates" ON donation.donation_certificates
  FOR SELECT USING ((SELECT auth.uid()) = donor_id);

-- ... 나머지 24개 정책 동일하게 적용
```

### 1.2 중복 인덱스 제거

#### 📊 식별된 중복 인덱스
```sql
-- study_cycle.sc_study_sessions 테이블
DROP INDEX IF EXISTS idx_sc_sessions_chapter;  -- sc_study_sessions_chapter_id_idx와 중복
DROP INDEX IF EXISTS idx_sc_sessions_textbook; -- sc_study_sessions_textbook_id_idx와 중복  
DROP INDEX IF EXISTS idx_sc_sessions_user;     -- sc_study_sessions_user_id_idx와 중복

-- 중복 확인 쿼리
SELECT 
  schemaname, 
  tablename, 
  indexname, 
  indexdef 
FROM pg_indexes 
WHERE tablename = 'sc_study_sessions' 
ORDER BY indexname;
```

#### 📋 작업 목록
- [ ] **study_cycle.sc_study_sessions**: 3개 중복 인덱스 제거
- [ ] **인덱스 사용량 분석**: 제거 전 사용 패턴 확인
- [ ] **성능 테스트**: 제거 후 쿼리 성능 검증

### 1.3 타입 시스템 개선

#### 📊 현재 문제
- Supabase 타입 생성기가 `public` 스키마만 인식
- 다른 스키마 (`economy`, `prediction` 등) 타입 누락

#### 🛠️ 해결 방안
```typescript
// 스키마별 타입 정의 추가
// 파일: src/shared/types/database-schemas.ts

export interface EconomySchema {
  Tables: {
    pmp_pmc_accounts: {
      Row: {
        user_id: string
        pmp_balance: number
        pmc_balance: number
        last_activity_at: string
      }
      Insert: {
        user_id: string
        pmp_balance?: number
        pmc_balance?: number
      }
      Update: {
        pmp_balance?: number
        pmc_balance?: number
        last_activity_at?: string
      }
    }
    // ... 다른 테이블들
  }
}

export interface PredictionSchema {
  Tables: {
    prediction_games: {
      // 타입 정의
    }
    predictions: {
      // 타입 정의
    }
  }
}

// 통합 타입
export interface Database extends SupabaseDatabase {
  economy: EconomySchema
  prediction: PredictionSchema
  investment: InvestmentSchema
  donation: DonationSchema
  forum: ForumSchema
  user: UserSchema
}
```

---

## 🟡 Phase 2: 보안 및 정책 강화 (2-3주)

### 2.1 인증 보안 강화

#### 📋 작업 목록
- [ ] **비밀번호 보안 강화**
  ```sql
  -- Supabase Auth 설정에서 활성화
  -- HaveIBeenPwned.org 연동
  UPDATE auth.config SET 
    password_min_length = 12,
    password_require_uppercase = true,
    password_require_lowercase = true,
    password_require_numbers = true,
    password_require_symbols = true,
    password_check_breached = true;
  ```

- [ ] **MFA 옵션 확장**
  ```typescript
  // MFA 설정 컴포넌트 추가
  const MfaSetup = () => {
    const enableTotp = () => {
      // TOTP 설정
    }
    
    const enableSms = () => {
      // SMS 설정
    }
    
    const enableEmail = () => {
      // 이메일 설정
    }
  }
  ```

### 2.2 다중 권한 정책 통합

#### 📊 영향받는 테이블
- `assessment.assessments`: 4개 역할에 대한 중복 정책
- `assessment.questions`: 4개 역할에 대한 중복 정책  
- `assessment.submissions`: 4개 역할에 대한 중복 정책

#### 🛠️ 통합 방안
```sql
-- 기존: 여러 개의 permissive 정책
-- 문제: 각 정책이 모두 실행되어 성능 저하

-- 개선: 단일 통합 정책
CREATE POLICY "unified_assessment_access" ON assessment.assessments
  FOR SELECT USING (
    -- 공개된 평가는 모든 사용자가 볼 수 있음
    status = 'published' 
    OR 
    -- 작성자는 자신의 평가를 볼 수 있음
    ((SELECT auth.uid()) = creator_id)
  );
```

---

## 🟢 Phase 3: 코드 정리 및 최적화 (3-4주)

### 3.1 미사용 인덱스 정리

#### 📊 정리 대상 (총 66개)
**Economy 스키마 (8개)**
- `idx_accounts_balance_pmc`
- `idx_accounts_active_updated`
- `idx_wave1_ebit_verification`
- `idx_money_wave_history_type_date`
- `idx_wave2_redistribution_reason`
- `idx_wave3_entrepreneur_score`
- `idx_effectiveness_analysis_period`
- `idx_utility_params_confidence`

**Study Cycle 스키마 (18개)**
- 모든 `sc_*` 테이블의 미사용 인덱스

**Forum 스키마 (15개)**
- 포럼 관련 모든 미사용 인덱스

**기타 스키마 (25개)**
- Prediction, Investment, Donation, User 스키마의 미사용 인덱스

#### 🔧 정리 스크립트
```sql
-- 미사용 인덱스 정리 마이그레이션
-- 파일: migrations/cleanup_unused_indexes.sql

-- 1. 사용량 확인 (정리 전 필수)
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE idx_scan = 0
ORDER BY schemaname, tablename;

-- 2. 단계적 제거 (백업 후 진행)
-- Economy 스키마
DROP INDEX IF EXISTS economy.idx_accounts_balance_pmc;
DROP INDEX IF EXISTS economy.idx_accounts_active_updated;
-- ... 순차적으로 제거

-- 3. 성능 모니터링
-- 제거 후 1주일간 쿼리 성능 모니터링
```

### 3.2 레거시 코드 정리

#### 📋 정리 대상
- [ ] **Study Cycle 관련 코드**: 현재 사용되지 않는 학습 사이클 시스템
- [ ] **Assessment 시스템**: 평가 시스템이 현재 비활성 상태
- [ ] **미사용 컴포넌트**: React 컴포넌트 중 참조되지 않는 것들
- [ ] **중복 타입 정의**: 여러 곳에서 중복 정의된 타입들

#### 🔧 정리 방법
```bash
# 1. 미사용 코드 분석
npx ts-unused-exports tsconfig.json

# 2. 중복 코드 탐지
npx jscpd apps/posmul-web/src

# 3. 단계적 제거
# - 먼저 주석 처리
# - 1주일 후 완전 제거
# - Git에서 히스토리 유지
```

### 3.3 스키마 정리

#### 📊 정리 대상 스키마
- `study_cycle`: 현재 사용되지 않는 학습 관련 테이블들
- `assessment`: 평가 시스템 (현재 비활성)

#### 🛠️ 정리 계획
```sql
-- 1단계: 백업 생성
CREATE SCHEMA backup_study_cycle;
CREATE TABLE backup_study_cycle.sc_textbooks AS 
  SELECT * FROM study_cycle.sc_textbooks;
-- ... 모든 테이블 백업

-- 2단계: 의존성 확인
SELECT 
  tc.table_schema, 
  tc.constraint_name, 
  tc.table_name, 
  kcu.column_name,
  ccu.table_schema AS foreign_table_schema,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND (tc.table_schema = 'study_cycle' OR ccu.table_schema = 'study_cycle');

-- 3단계: 점진적 제거 (사용 확인 후)
-- DROP SCHEMA study_cycle CASCADE;
-- DROP SCHEMA assessment CASCADE;
```

---

## 📊 Phase 4: 모니터링 및 문서화 (1-2주)

### 4.1 성능 모니터링 설정

#### 📋 구현 사항
- [ ] **쿼리 성능 모니터링**
  ```sql
  -- pg_stat_statements 활성화
  CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
  
  -- 느린 쿼리 모니터링
  SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows
  FROM pg_stat_statements
  WHERE mean_time > 100  -- 100ms 이상
  ORDER BY mean_time DESC;
  ```

- [ ] **인덱스 사용량 추적**
  ```sql
  -- 인덱스 효율성 모니터링
  SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch,
    idx_scan::float / (seq_scan + idx_scan) AS index_usage_ratio
  FROM pg_stat_user_indexes
  WHERE (seq_scan + idx_scan) > 0
  ORDER BY index_usage_ratio DESC;
  ```

### 4.2 문서화 업데이트

#### 📋 업데이트 대상
- [ ] **API 문서**: 각 도메인별 API 엔드포인트 문서화
- [ ] **데이터베이스 스키마 문서**: ERD 및 테이블 관계도
- [ ] **아키텍처 문서**: DDD 및 Clean Architecture 구현 가이드
- [ ] **개발자 가이드**: 신규 개발자를 위한 온보딩 문서

---

## 📅 실행 일정

### Week 1-2: Phase 1 (긴급 최적화)
- **Day 1-3**: RLS 정책 최적화 (24개 정책)
- **Day 4-5**: 중복 인덱스 제거 (3개 테이블)
- **Day 6-10**: 타입 시스템 개선
- **Day 11-14**: 성능 테스트 및 검증

### Week 3-4: Phase 2 (보안 강화)
- **Day 15-17**: 비밀번호 보안 강화
- **Day 18-20**: MFA 옵션 추가
- **Day 21-24**: 다중 권한 정책 통합
- **Day 25-28**: 보안 테스트 및 검증

### Week 5-7: Phase 3 (코드 정리)
- **Day 29-35**: 미사용 인덱스 정리 (66개)
- **Day 36-42**: 레거시 코드 제거
- **Day 43-49**: 스키마 정리 (study_cycle, assessment)

### Week 8: Phase 4 (모니터링)
- **Day 50-52**: 성능 모니터링 설정
- **Day 53-56**: 문서화 업데이트

---

## 🎯 성공 지표 (KPI)

### 성능 지표
- **쿼리 응답 시간**: 20% 개선 목표
- **데이터베이스 크기**: 불필요한 인덱스 제거로 10% 감소
- **메모리 사용량**: RLS 최적화로 15% 감소

### 보안 지표
- **비밀번호 강도**: 평균 엔트로피 50% 증가
- **MFA 적용률**: 신규 사용자 80% 이상
- **보안 취약점**: 0개 유지

### 코드 품질 지표
- **미사용 코드**: 90% 이상 제거
- **중복 코드**: 50% 이상 감소
- **문서화 커버리지**: 80% 이상

---

## ⚠️ 위험 요소 및 대응 방안

### 1. 데이터 손실 위험
**위험**: 스키마 정리 중 중요 데이터 손실  
**대응**: 
- 모든 변경 전 전체 데이터베이스 백업
- 단계적 제거 (주석 → 비활성화 → 제거)
- 롤백 계획 수립

### 2. 성능 저하 위험
**위험**: 인덱스 제거로 인한 예상치 못한 성능 저하  
**대응**:
- 제거 전 사용량 분석
- 단계적 제거 및 모니터링
- 즉시 롤백 가능한 스크립트 준비

### 3. 서비스 중단 위험
**위험**: 마이그레이션 중 서비스 중단  
**대응**:
- 점검 시간 활용
- Blue-Green 배포 전략
- 실시간 헬스체크 모니터링

---

## 📋 체크리스트

### Pre-Migration 체크리스트
- [ ] 전체 데이터베이스 백업 완료
- [ ] 롤백 스크립트 준비 완료
- [ ] 성능 베이스라인 측정 완료
- [ ] 스테이징 환경에서 테스트 완료
- [ ] 팀 구성원 공지 완료

### Post-Migration 체크리스트
- [ ] 성능 지표 확인 (24시간 모니터링)
- [ ] 에러 로그 확인
- [ ] 사용자 피드백 수집
- [ ] 문서 업데이트 완료
- [ ] 백업 데이터 정리

---

## 🚀 결론

이 레거시 정리 계획을 통해 PosMul 프로젝트는:

1. **20% 성능 향상** 달성
2. **엔터프라이즈급 보안** 수준 확보
3. **90% 이상 코드 정리** 완료
4. **지속 가능한 개발 환경** 구축

**예상 효과**: 개발 생산성 30% 향상, 시스템 안정성 50% 개선

---

**문서 작성**: AI Assistant  
**승인 필요**: 기술팀장, DevOps 팀  
**실행 시작일**: 승인 후 즉시 