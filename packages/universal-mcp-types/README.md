# Universal MCP Types

PosMul 프로젝트를 위한 통합 MCP (Model Context Protocol) 타입 시스템입니다.

## 특징

- 🔄 **통합된 Result 패턴**: 모든 MCP 작업에서 일관된 결과 처리
- 🎯 **타입 안전성**: TypeScript를 활용한 컴파일 타임 에러 감지  
- 🔧 **유틸리티 함수**: Result 처리를 위한 헬퍼 함수들
- 📦 **모듈화**: 필요한 부분만 import 가능한 구조
- 🔒 **에러 처리**: 구조화된 에러 타입과 메타데이터

## 설치

```bash
pnpm add @posmul/universal-mcp-types
```

## 기본 사용법

### Result 패턴

```typescript
import { UniversalResult, success, failure, isSuccess } from '@posmul/universal-mcp-types';

// 성공 결과 생성
const successResult = success({ id: '123', name: 'test' });

// 실패 결과 생성  
const failureResult = failure({
  code: 'NOT_FOUND',
  message: 'User not found',
  type: 'VALIDATION',
  severity: 'MEDIUM'
});

// 결과 확인
if (isSuccess(result)) {
  console.log(result.data); // 타입 안전함
} else {
  console.error(result.error);
}
```

### MCP 작업 컨텍스트

```typescript
import { MCPOperationContext, MCPOperationType } from '@posmul/universal-mcp-types';

const context: MCPOperationContext = {
  projectId: 'my-project',
  operation: MCPOperationType.EXECUTE_SQL,
  query: 'SELECT * FROM users',
  retryPolicy: {
    maxRetries: 3,
    retryDelay: 1000,
    backoffStrategy: 'EXPONENTIAL'
  }
};
```

### 유틸리티 함수

```typescript
import { ResultUtils } from '@posmul/universal-mcp-types';

// Promise를 Result로 변환
const result = await ResultUtils.fromPromise(
  fetch('/api/users').then(r => r.json())
);

// Result 체이닝
const transformedResult = ResultUtils.map(result, user => ({ 
  ...user, 
  displayName: `${user.firstName} ${user.lastName}` 
}));
```

## API 레퍼런스

### 핵심 타입

- `UniversalResult<T, E>`: 성공/실패를 나타내는 Union 타입
- `UniversalError`: 구조화된 에러 정보
- `MCPOperationContext`: MCP 작업 컨텍스트
- `MCPOperationType`: 지원되는 MCP 작업 타입들

### 유틸리티 함수

- `success(data)`: 성공 결과 생성
- `failure(error)`: 실패 결과 생성  
- `isSuccess(result)`: 성공 여부 타입 가드
- `isFailure(result)`: 실패 여부 타입 가드

### ResultUtils

- `toPromise(result)`: Result를 Promise로 변환
- `fromPromise(promise)`: Promise를 Result로 변환
- `map(result, mapper)`: Result 데이터 변환
- `all(results)`: 여러 Result를 하나로 조합

## 마이그레이션 가이드

기존 코드에서 마이그레이션하는 방법:

```typescript
// Before (shared-types)
import { Result } from '@posmul/shared-types';

// After (universal-mcp-types)  
import { UniversalResult as Result } from '@posmul/universal-mcp-types';
```

## 라이센스

MIT
