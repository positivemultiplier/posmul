/**
 * Universal MCP Type System Plan
 * PosMul 프로젝트의 통합 MCP 타입 시스템 계획
 * 
 * 이 문서는 모든 패키지에서 일관된 타입 사용을 위한 통합 타입 시스템을 정의합니다.
 */

## 1. 현재 상황 분석

### 문제점:
- Result 타입이 여러 패키지에 중복 정의
- MCP 관련 타입들이 scattered되어 있음
- `any` 타입 사용으로 타입 안전성 저하
- 에러 처리 패턴의 일관성 부족

### 기존 구조:
```
packages/
├── shared-types/
│   ├── src/errors/index.ts (Result 타입 정의)
│   └── src/common.ts
├── shared-auth/
│   └── src/mcp-errors.ts (MCP 전용 에러)
└── shared-ui/
    └── src/utils/common.ts (Result 유틸리티)
```

## 2. Universal MCP 타입 시스템 아키텍처

### 새로운 구조:
```
packages/
├── universal-mcp-types/
│   ├── src/
│   │   ├── index.ts
│   │   ├── core/
│   │   │   ├── result.ts
│   │   │   ├── error.ts
│   │   │   └── mcp-base.ts
│   │   ├── errors/
│   │   │   ├── mcp-error.ts
│   │   │   ├── supabase-error.ts
│   │   │   └── operation-error.ts
│   │   ├── utils/
│   │   │   ├── result-utils.ts
│   │   │   ├── error-utils.ts
│   │   │   └── type-guards.ts
│   │   └── types/
│   │       ├── mcp-operations.ts
│   │       ├── mcp-responses.ts
│   │       └── integration.ts
│   ├── package.json
│   └── tsconfig.json
└── 기존 패키지들...
```

## 3. 핵심 타입 정의

### 3.1 Universal Result Type
```typescript
// core/result.ts
export type Result<T, E = UniversalError> =
  | { success: true; data: T; metadata?: ResultMetadata }
  | { success: false; error: E; metadata?: ResultMetadata };

export interface ResultMetadata {
  operationId?: string;
  timestamp?: Date;
  retryCount?: number;
  executionTime?: number;
}
```

### 3.2 Universal Error Hierarchy
```typescript
// core/error.ts
export abstract class UniversalError extends Error {
  abstract readonly errorType: ErrorType;
  abstract readonly severity: ErrorSeverity;
  readonly operationId?: string;
  readonly metadata?: ErrorMetadata;
}

export enum ErrorType {
  MCP_OPERATION = 'MCP_OPERATION',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  REPOSITORY = 'REPOSITORY',
  BUSINESS_LOGIC = 'BUSINESS_LOGIC',
  INFRASTRUCTURE = 'INFRASTRUCTURE'
}
```

### 3.3 MCP 전용 타입
```typescript
// types/mcp-operations.ts
export interface MCPOperationContext {
  projectId: string;
  operation: MCPOperationType;
  query?: string;
  parameters?: Record<string, unknown>;
  retryPolicy?: RetryPolicy;
}

export enum MCPOperationType {
  EXECUTE_SQL = 'EXECUTE_SQL',
  APPLY_MIGRATION = 'APPLY_MIGRATION',
  GET_PROJECT_INFO = 'GET_PROJECT_INFO',
  LIST_TABLES = 'LIST_TABLES'
}
```

## 4. 마이그레이션 계획

### Phase 1: Universal Type Package 생성
1. `packages/universal-mcp-types` 패키지 생성
2. 핵심 타입 정의 (Result, Error, MCP 타입)
3. 유틸리티 함수 구현

### Phase 2: 기존 패키지 마이그레이션
1. `shared-types` → `universal-mcp-types` 의존성 추가
2. `shared-auth` → MCP 에러 타입 마이그레이션
3. `shared-ui` → Result 유틸리티 마이그레이션
4. `study-cycle-core` → MCP 관련 타입 마이그레이션

### Phase 3: Type Safety 강화
1. `any` 타입 제거
2. 타입 가드 함수 구현
3. Runtime 타입 검증 추가

### Phase 4: 문서화 및 테스트
1. 타입 시스템 문서화
2. 예제 코드 작성
3. 단위 테스트 추가

## 5. 장점

### 5.1 개발자 경험 향상
- 일관된 타입 사용으로 학습 곡선 감소
- IDE 자동완성 및 타입 검증 개선
- 에러 처리 패턴 표준화

### 5.2 유지보수성 향상
- 중앙화된 타입 관리
- 변경 사항의 일관된 전파
- 타입 버전 관리 가능

### 5.3 타입 안전성 강화
- 컴파일 타임 에러 감지
- Runtime 타입 검증
- `any` 타입 사용 최소화

## 6. 구현 우선순위

1. **High Priority**: Result 타입 통합
2. **High Priority**: MCP 에러 타입 통합
3. **Medium Priority**: 유틸리티 함수 마이그레이션
4. **Medium Priority**: 타입 가드 구현
5. **Low Priority**: 고급 메타데이터 기능

## 7. 호환성 고려사항

- 기존 코드와의 백워드 호환성 유지
- 점진적 마이그레이션 지원
- 패키지 간 순환 의존성 방지
- Next.js 15 호환성 보장
