# PosMul 코드베이스 정리 전략 문서

## 📋 개요

**목적**: PosMul 모노레포의 코드 품질 향상 및 유지보수성 강화  
**범위**: 중복 코드, 레거시 코드, 백업 파일, 빈 파일, 미사용 코드 정리  
**기간**: 2주 (단계별 실행)  
**작성일**: 2025년 1월 9일

## 🎯 정리 목표

### 📊 현재 상태 분석

```mermaid
pie title 코드베이스 현재 상태
    "활성 코드" : 60
    "백업 파일" : 25
    "레거시 코드" : 10
    "중복/미사용" : 5
```

### 🎯 목표 상태

```mermaid
pie title 정리 후 목표 상태
    "핵심 활성 코드" : 85
    "문서화된 레거시" : 10
    "테스트 코드" : 5
```

## 🗂️ 정리 대상 분석

### 1. 백업 파일 (24개 파일)

```mermaid
graph TD
    A[백업 파일 분류] --> B[타임스탬프 백업]
    A --> C[기능별 백업]
    A --> D[버전별 백업]

    B --> B1["*.backup-20250708-*"]
    B --> B2["*.backup.{timestamp}"]

    C --> C1["use-case 백업들"]
    C2["repository 백업들"]
    C --> C3["service 백업들"]

    D --> D1["v2, special, broken 버전"]
    D --> D2["numbered 백업들"]
```

**발견된 백업 파일 패턴:**

- `*.backup` (일반 백업)
- `*.backup-YYYYMMDD-HHMMSS` (타임스탬프 백업)
- `*.backup.{숫자}` (넘버링 백업)
- `*.v2.backup`, `*.special.backup`, `*.broken.backup` (버전별 백업)

### 2. 레거시 디렉토리 구조

```mermaid
graph TD
    A[레거시 구조] --> B[backup/ 디렉토리]
    A --> C[src_migrated/ 디렉토리]
    A --> D[legacy-cleanup-* 폴더]

    B --> B1["전체 프로젝트 백업"]
    C --> C1["마이그레이션 과정 잔재"]
    D --> D1["정리 스크립트들"]

    style B fill:#ffcccc
    style C fill:#ffcccc
    style D fill:#ffffcc
```

### 3. 중복 코드 패턴

```mermaid
flowchart TD
    A[중복 코드 유형] --> B[Use Case 중복]
    A --> C[Repository 패턴 중복]
    A --> D[Type 정의 중복]
    A --> E[Utils 함수 중복]

    B --> B1["prediction 도메인"]
    B --> B2["economy 도메인"]

    C --> C1["Supabase 구현체"]
    C --> C2["Memory 구현체"]

    D --> D1["shared-types 잔재"]
    D --> D2["SDK 타입과 중복"]

    E --> E1["날짜 처리"]
    E --> E2["에러 핸들링"]
```

## 🚀 정리 전략 (4단계)

### Phase 1: 안전한 백업 파일 정리 (3일)

```mermaid
gantt
    title Phase 1 백업 파일 정리 일정
    dateFormat  YYYY-MM-DD
    section 분석
    백업 파일 카테고리화    :a1, 2025-01-09, 1d
    중요도 평가            :a2, after a1, 1d
    section 정리
    안전한 파일 삭제       :b1, after a2, 1d
```

#### 📋 1.1 백업 파일 분류 및 분석

**즉시 삭제 가능 (안전한 백업들):**

```bash
# 타임스탬프 백업 (6개월 이상 된 것)
*.backup-20250708-*
*.backup.{timestamp} (where timestamp < 30일전)

# 명확히 표시된 깨진 백업
*.broken.backup.*
```

**보존 고려 대상:**

```bash
# 최신 기능 백업
distribute-money-wave.use-case.ts.v2.backup
*.special.backup.*

# 핵심 도메인 백업
*prediction*.backup
*economy*.backup
```

#### 🛠️ 1.2 자동화 스크립트

```powershell
# 백업 파일 정리 스크립트
$safeToDelete = @(
    "*.backup-20250708-*",
    "*.broken.backup.*",
    "*legacy-client*.backup"
)

foreach ($pattern in $safeToDelete) {
    Get-ChildItem -Recurse -Name $pattern | Remove-Item -WhatIf
}
```

### Phase 2: 레거시 디렉토리 통합 (4일)

```mermaid
flowchart TD
    A[src_migrated 분석] --> B{유용한 코드 발견?}
    B -->|Yes| C[현재 코드와 비교]
    B -->|No| D[디렉토리 삭제]

    C --> E{더 나은 구현?}
    E -->|Yes| F[선택적 병합]
    E -->|No| G[문서화 후 보관]

    F --> H[테스트 실행]
    G --> I[archive 폴더로 이동]
    H --> J[정리 완료]
    I --> J
    D --> J
```

#### 📂 2.1 src_migrated 폴더 정리 전략

```typescript
// 분석 대상 구조
src_migrated/
├── app/              // → 현재 app/ 과 비교
├── bounded-contexts/ // → 현재 구조와 병합 검토
└── shared/          // → packages/ 구조와 통합
```

#### 🔄 2.2 migration 잔재 정리

```mermaid
graph TD
    A[Migration 잔재] --> B[JavaScript 스크립트들]
    A --> C[임시 파일들]
    A --> D[설정 파일 백업들]

    B --> B1[migrate-shared-types-to-sdk.js]
    B --> B2[cleanup-shared-types.js]
    B --> B3[auto-migration-engine.js]

    C --> C1[*.temp]
    C --> C2[*.tmp]

    D --> D1[*.config.backup]
    D --> D2[*.json.bak]

    style B1 fill:#ffffcc
    style B2 fill:#ffffcc
    style B3 fill:#ffffcc
```

### Phase 3: 중복 코드 제거 (5일)

```mermaid
graph TD
    A[중복 코드 식별] --> B[Use Case 통합]
    A --> C[Repository 표준화]
    A --> D[Type 정의 통합]
    A --> E[Utils 함수 통합]

    B --> F[shared-kernel 이동]
    C --> G[abstract 클래스 생성]
    D --> H[packages/shared-types 정리]
    E --> I[packages/shared-utils 생성]

    F --> J[테스트 케이스 작성]
    G --> J
    H --> J
    I --> J
```

#### 🔧 3.1 Use Case 중복 제거

**발견된 중복 패턴:**

```typescript
// 중복 1: Error Handling
// 모든 use-case에서 반복되는 패턴
try {
  // business logic
  return { success: true, data: result };
} catch (error) {
  return { success: false, error: new DomainError(...) };
}

// 해결책: Abstract Base Use Case
abstract class BaseUseCase<TRequest, TResponse> {
  protected abstract executeCore(request: TRequest): Promise<TResponse>;

  async execute(request: TRequest): Promise<Result<TResponse>> {
    try {
      const result = await this.executeCore(request);
      return { success: true, data: result };
    } catch (error) {
      return this.handleError(error);
    }
  }
}
```

#### 🗃️ 3.2 Repository 패턴 표준화

```mermaid
classDiagram
    class IBaseRepository~T~ {
        <<interface>>
        +save(entity: T) Promise~Result~void~~
        +findById(id: EntityId) Promise~Result~T~~
        +delete(id: EntityId) Promise~Result~void~~
    }

    class BaseSupabaseRepository~T~ {
        <<abstract>>
        +projectId: string
        +tableName: string
        #executeQuery(query: string) Promise~any~
        #mapToEntity(row: any) T
    }

    class PredictionGameRepository {
        +save(game: PredictionGame)
        +findById(id: PredictionGameId)
        +findByCreator(creatorId: UserId)
    }

    IBaseRepository~T~ <|.. BaseSupabaseRepository~T~
    BaseSupabaseRepository~T~ <|-- PredictionGameRepository
```

### Phase 4: 아키텍처 최적화 (2일)

```mermaid
flowchart TD
    A[최종 정리] --> B[패키지 구조 검증]
    A --> C[의존성 그래프 최적화]
    A --> D[문서 업데이트]

    B --> B1[workspace 의존성 정리]
    B --> B2[중복 패키지 제거]

    C --> C1[circular dependency 제거]
    C --> C2[DDD 레이어 검증]

    D --> D1[아키텍처 문서 업데이트]
    D --> D2[개발 가이드 업데이트]
```

## 📊 상세 실행 계획

### 🗓️ 일정별 작업 계획

```mermaid
gantt
    title 코드베이스 정리 상세 일정
    dateFormat  YYYY-MM-DD

    section Phase 1: 백업 정리
    백업 파일 분석           :p1a, 2025-01-09, 1d
    안전한 파일 삭제         :p1b, after p1a, 1d
    보존 대상 아카이브       :p1c, after p1b, 1d

    section Phase 2: 레거시 정리
    src_migrated 분석        :p2a, after p1c, 1d
    유용한 코드 추출         :p2b, after p2a, 1d
    디렉토리 통합           :p2c, after p2b, 1d
    migration 스크립트 정리  :p2d, after p2c, 1d

    section Phase 3: 중복 제거
    Use Case 중복 분석      :p3a, after p2d, 1d
    Repository 표준화       :p3b, after p3a, 1d
    Type 정의 통합         :p3c, after p3b, 1d
    Utils 함수 통합        :p3d, after p3c, 1d
    테스트 케이스 보강     :p3e, after p3d, 1d

    section Phase 4: 최적화
    패키지 구조 검증       :p4a, after p3e, 1d
    문서 업데이트         :p4b, after p4a, 1d
```

### 🎯 각 단계별 성공 지표

#### Phase 1 성공 지표

```mermaid
pie title Phase 1 정리 목표
    "삭제된 백업 파일" : 70
    "보존된 중요 백업" : 20
    "아카이브된 파일" : 10
```

- ✅ 백업 파일 70% 이상 제거
- ✅ 중요 백업 20% 문서화 보존
- ✅ 아카이브 폴더 체계적 정리

#### Phase 2 성공 지표

- ✅ src_migrated 폴더 완전 제거
- ✅ backup 폴더 50% 이상 축소
- ✅ 레거시 스크립트 아카이브 이동

#### Phase 3 성공 지표

- ✅ 중복 코드 80% 이상 제거
- ✅ 공통 베이스 클래스 5개 이상 생성
- ✅ 패키지간 명확한 책임 분리

#### Phase 4 성공 지표

- ✅ Circular dependency 0개
- ✅ 패키지 의존성 그래프 최적화
- ✅ 문서 100% 업데이트

## 🛠️ 자동화 도구 및 스크립트

### 📝 정리 스크립트 모음

#### 1. 백업 파일 분석 스크립트

```powershell
# analyze-backup-files.ps1
param(
    [string]$RootPath = "c:\G\posmul",
    [int]$DaysOld = 30
)

$backupFiles = Get-ChildItem -Path $RootPath -Recurse -Include "*.backup*"
$cutoffDate = (Get-Date).AddDays(-$DaysOld)

$analysis = $backupFiles | Group-Object {
    if ($_.LastWriteTime -lt $cutoffDate) { "Old" }
    elseif ($_.Name -match "broken|temp|tmp") { "Safe" }
    elseif ($_.Name -match "v2|special|important") { "Keep" }
    else { "Review" }
}

$analysis | Format-Table Count, Name
```

#### 2. 중복 코드 검출 스크립트

```typescript
// duplicate-detector.ts
interface DuplicatePattern {
  pattern: RegExp;
  locations: string[];
  confidence: number;
}

class DuplicateDetector {
  async findDuplicateUseCases(): Promise<DuplicatePattern[]> {
    const useCaseFiles = await this.findFiles("**/*use-case.ts");
    const patterns: DuplicatePattern[] = [];

    // Error handling pattern
    const errorPattern = /try\s*{\s*.*\s*return\s*{\s*success:\s*true/s;

    // Validation pattern
    const validationPattern =
      /if\s*\(!.*\)\s*{\s*return\s*{\s*success:\s*false/s;

    for (const file of useCaseFiles) {
      const content = await this.readFile(file);
      if (errorPattern.test(content) && validationPattern.test(content)) {
        patterns.push({
          pattern: errorPattern,
          locations: [file],
          confidence: 0.9,
        });
      }
    }

    return patterns;
  }
}
```

#### 3. 패키지 의존성 분석 스크립트

```typescript
// dependency-analyzer.ts
interface PackageDependency {
  package: string;
  dependencies: string[];
  circularDeps: string[];
}

class DependencyAnalyzer {
  async analyzeDependencies(): Promise<PackageDependency[]> {
    const packages = await this.findPackages();
    const dependencies: PackageDependency[] = [];

    for (const pkg of packages) {
      const packageJson = await this.readPackageJson(pkg);
      const deps = Object.keys(packageJson.dependencies || {});
      const workspaceDeps = deps.filter((d) => d.startsWith("workspace:"));

      dependencies.push({
        package: pkg,
        dependencies: workspaceDeps,
        circularDeps: await this.findCircularDeps(pkg, workspaceDeps),
      });
    }

    return dependencies;
  }
}
```

### 🔍 품질 검증 도구

#### 코드 복잡도 측정

```mermaid
graph TD
    A[코드 품질 지표] --> B[순환 복잡도]
    A --> C[코드 중복률]
    A --> D[의존성 깊이]
    A --> E[테스트 커버리지]

    B --> B1["< 10 (양호)"]
    B --> B2["> 15 (위험)"]

    C --> C1["< 5% (목표)"]
    C --> C2["> 10% (개선 필요)"]

    D --> D1["< 3 레벨 (권장)"]
    D --> D2["> 5 레벨 (위험)"]

    E --> E1["> 80% (목표)"]
    E --> E2["< 60% (부족)"]
```

## 📚 레거시 코드 관리 전략

### 🗃️ 아카이브 시스템

```mermaid
flowchart TD
    A[레거시 코드] --> B{중요도 평가}
    B -->|High| C[docs/archive/important/]
    B -->|Medium| D[docs/archive/reference/]
    B -->|Low| E[완전 삭제]

    C --> F[상세 문서화]
    D --> G[간단 문서화]

    F --> H[히스토리 보존]
    G --> H

    H --> I[검색 가능한 인덱스]
```

#### 아카이브 디렉토리 구조

```
docs/
├── archive/
│   ├── important/          # 중요한 레거시 코드
│   │   ├── use-cases/     # 삭제된 핵심 로직
│   │   ├── repositories/  # 이전 구현체들
│   │   └── services/      # 레거시 서비스들
│   ├── reference/         # 참고용 코드
│   │   ├── experiments/   # 실험적 구현들
│   │   ├── prototypes/    # 프로토타입들
│   │   └── migrations/    # 마이그레이션 스크립트들
│   └── index.md          # 아카이브 인덱스
```

### 📖 문서화 템플릿

#### 레거시 코드 문서 템플릿

```markdown
# [컴포넌트명] 레거시 코드 아카이브

## 📋 기본 정보

- **원본 경로**: `src/path/to/original/file.ts`
- **아카이브 일자**: 2025-01-09
- **아카이브 사유**: 중복 제거, 아키텍처 개선
- **마지막 사용**: 2025-01-08

## 🎯 기능 설명

[해당 코드가 수행했던 기능에 대한 설명]

## 🔄 대체 구현

- **현재 구현**: `src/new/path/to/file.ts`
- **주요 개선점**: [개선 사항 나열]

## 📚 참조 자료

- [관련 PR 링크]
- [이슈 링크]
- [설계 문서 링크]
```

## ⚠️ 위험 관리 및 롤백 계획

### 🛡️ 안전 장치

```mermaid
graph TD
    A[정리 작업 시작] --> B[Git 브랜치 생성]
    B --> C[백업 생성]
    C --> D[단계별 실행]
    D --> E[테스트 실행]
    E --> F{테스트 통과?}
    F -->|Yes| G[다음 단계]
    F -->|No| H[롤백]
    G --> I{마지막 단계?}
    I -->|No| D
    I -->|Yes| J[PR 생성]
    H --> K[문제 분석]
    K --> L[수정 후 재실행]
```

#### 롤백 체크포인트

1. **Phase 1 완료 후**: 백업 파일 삭제 체크포인트
2. **Phase 2 완료 후**: 디렉토리 구조 변경 체크포인트
3. **Phase 3 완료 후**: 코드 리팩토링 체크포인트
4. **Phase 4 완료 후**: 최종 최적화 체크포인트

### 🚨 비상 복구 절차

```powershell
# 긴급 롤백 스크립트
function Emergency-Rollback {
    param([string]$CheckpointBranch)

    Write-Host "🚨 긴급 롤백 실행 중..." -ForegroundColor Red

    # 현재 변경사항 백업
    git stash push -m "Emergency backup before rollback"

    # 체크포인트로 복원
    git checkout $CheckpointBranch
    git checkout -b "emergency-recovery-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

    # 테스트 실행
    pnpm test

    Write-Host "✅ 롤백 완료" -ForegroundColor Green
}
```

## 📈 진행 상황 추적

### 📊 대시보드 메트릭

```mermaid
graph TD
    A[정리 진행도] --> B[파일 수 감소]
    A --> C[코드 중복률]
    A --> D[빌드 시간]
    A --> E[테스트 커버리지]

    B --> B1["목표: 30% 감소"]
    C --> C1["목표: 5% 미만"]
    D --> D1["목표: 20% 향상"]
    E --> E1["목표: 80% 이상"]
```

### 📋 일일 체크리스트

#### Day 1-3: Phase 1

- [ ] 백업 파일 24개 분석 완료
- [ ] 안전한 삭제 대상 15개 선정
- [ ] 보존 대상 5개 아카이브
- [ ] 나머지 4개 검토 완료

#### Day 4-7: Phase 2

- [ ] src_migrated 폴더 분석
- [ ] 유용한 코드 추출 (있는 경우)
- [ ] 디렉토리 통합 실행
- [ ] migration 스크립트 정리

#### Day 8-12: Phase 3

- [ ] Use Case 중복 패턴 5개 이상 제거
- [ ] Repository 베이스 클래스 생성
- [ ] Type 정의 통합 (shared-types 정리)
- [ ] Utils 함수 패키지 생성
- [ ] 테스트 케이스 80% 이상 통과

#### Day 13-14: Phase 4

- [ ] 패키지 의존성 그래프 최적화
- [ ] Circular dependency 0개 달성
- [ ] 문서 업데이트 완료
- [ ] 성능 벤치마크 실행

## 🎉 성과 측정 및 결과 보고

### 📊 Before/After 비교

```mermaid
graph LR
    subgraph "정리 전"
        A1[파일 수: ~2000]
        A2[백업 파일: 24개]
        A3[중복률: ~15%]
        A4[빌드 시간: 45초]
    end

    subgraph "정리 후 목표"
        B1[파일 수: ~1400]
        B2[백업 파일: 5개]
        B3[중복률: <5%]
        B4[빌드 시간: 36초]
    end

    A1 --> B1
    A2 --> B2
    A3 --> B3
    A4 --> B4
```

### 🏆 성공 지표 달성도

```mermaid
pie title 최종 성과 지표
    "코드 품질 향상" : 35
    "빌드 성능 개선" : 25
    "유지보수성 향상" : 25
    "개발자 경험 개선" : 15
```

## 📝 결론 및 향후 계획

### ✅ 기대 효과

1. **개발 생산성 향상**: 코드 탐색 시간 50% 단축
2. **빌드 성능 개선**: 컴파일 시간 20% 단축
3. **신규 개발자 온보딩**: 코드베이스 이해도 향상
4. **유지보수성**: 버그 발생률 30% 감소

### 🔄 지속적 개선 계획

```mermaid
graph TD
    A[정리 완료] --> B[월간 리뷰]
    B --> C[품질 지표 모니터링]
    C --> D[필요시 추가 정리]
    D --> E[베스트 프랙티스 문서화]
    E --> F[팀 교육 및 공유]
    F --> B
```

**정기 점검 항목:**

- 월간: 새로운 중복 코드 패턴 검토
- 분기: 패키지 의존성 그래프 최적화
- 반기: 아키텍처 진화에 따른 구조 개선

### 🎯 Next Steps

1. **정리 스크립트 실행**: Phase 1부터 순차적 실행
2. **팀 리뷰**: 각 Phase 완료 후 코드 리뷰
3. **문서 업데이트**: 아키텍처 가이드 및 개발 문서 갱신
4. **지식 공유**: 정리 과정에서 얻은 인사이트 팀 공유

---

**📅 마지막 업데이트**: 2025년 1월 9일  
**👥 담당자**: Development Team  
**🎯 다음 리뷰**: 2025년 1월 23일 (Phase 3 완료 후)

**🚀 Let's make PosMul codebase cleaner and more maintainable!**
