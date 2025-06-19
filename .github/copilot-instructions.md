# GitHub Copilot Instructions for Posmul Prediction Game

## Project Context
Posmul은 Next.js App Router, Domain-Driven Design (DDD), Clean Architecture 원칙을 구현한 예측 게임 MVP입니다. Supabase를 백엔드 서비스로, MCP(Model Context Protocol)를 외부 통합을 위해 사용합니다.

## 개발 환경
- **운영체제**: Windows
- **기본 셸**: PowerShell (powershell.exe)
- **터미널 명령어**: PowerShell 명령어 사용
- **경로 표기**: Windows 경로 표기법 (백슬래시 사용)

## Project File Structure
```
src\
  app\                          # Next.js App Router 페이지 및 레이아웃
  bounded-contexts\             # DDD Bounded Contexts
    prediction\                 # 핵심 예측 게임 로직
      domain\
        entities\              # 도메인 엔티티 (PredictionGame, Prediction)
        value-objects\         # 값 객체 (PredictionId, GameStatus)
        repositories\          # 리포지토리 인터페이스
        services\             # 도메인 서비스
      application\
        use-cases\            # 애플리케이션 유스케이스
        services\             # 애플리케이션 서비스  
        dto\                  # 데이터 전송 객체
      infrastructure\
        repositories\         # 리포지토리 구현
        mcp\                  # MCP 통합
        external-services\    # 외부 API 통합
      presentation\
        components\           # React 컴포넌트
        pages\                # 페이지 컴포넌트
        hooks\                # 커스텀 React 훅
      context.md              # Bounded Context 문서
    market\                   # 마켓 관리
    user\                     # 사용자 프로필 및 활동
    auth\                     # 인증 및 권한
    payment\                  # PMC/PMP 포인트 시스템
  shared\                     # 횡단 관심사
    types\                    # 공유 TypeScript 타입
    utils\                    # 유틸리티 함수
    components\               # 공유 UI 컴포넌트
    constants\                # 애플리케이션 상수
    events\                   # 도메인 이벤트
```

## 아키텍처 원칙

### DDD (Domain-Driven Design)
- 각 Bounded Context는 완전히 독립적
- 도메인 계층은 외부 의존성이 없는 순수한 비즈니스 로직 포함
- Aggregate, Entity, Value Object, Domain Service를 적절히 사용
- 데이터 접근 추상화를 위한 Repository 패턴 구현
- 컨텍스트 간 통신을 위한 도메인 이벤트

### Clean Architecture
- **도메인 계층**: 순수 비즈니스 로직, 외부 계층에 대한 의존성 없음
- **애플리케이션 계층**: 유스케이스 및 애플리케이션 서비스, 도메인에만 의존
- **인프라스트럭처 계층**: 외부 관심사 (데이터베이스, API, MCP), 도메인 인터페이스 구현
- **프레젠테이션 계층**: UI 컴포넌트, DTO를 통해 애플리케이션 계층에 의존

### Next.js App Router 모범 사례
- 기본적으로 Server Component 사용
- Client Component는 필요한 경우에만 (상호작용, 브라우저 API)
- Bounded Context 내에서 관련 파일들을 함께 배치
- App Router 기능 활용 (loading.tsx, error.tsx, not-found.tsx)

## 코딩 가이드라인

### TypeScript 표준
- 엄격한 TypeScript 설정 사용
- 객체 형태에는 type보다 interface 선호
- 도메인 식별자에는 브랜드 타입 사용
- Result/Either 패턴으로 적절한 에러 처리 구현

### React/Next.js 패턴
- 데이터 로딩에 Suspense 경계 사용
- 적절한 에러 경계 구현
- React Server Component 패턴 따르기
- Next.js App Router 파일 규칙 사용

### 도메인 모델링
- Entity는 정체성과 생명주기를 가져야 함
- Value Object는 불변이며 값으로 비교
- Aggregate는 비즈니스 불변성을 강제
- Entity에 맞지 않는 비즈니스 로직은 Domain Service에서 처리

## Copilot 프롬프트 예시

### 도메인 계층
```
Copilot, DDD 원칙에 따라 예측을 추가하고 게임을 종료하는 메서드를 가진 PredictionGame 애그리거트 루트를 생성해주세요.

Copilot, 타입 안전성을 위해 브랜드 타입을 사용하는 PredictionId 값 객체를 구현해주세요.

Copilot, 신뢰도 수준과 정확도를 기반으로 예측 점수를 계산하는 도메인 서비스를 작성해주세요.

Copilot, save, findById, findByStatus 메서드를 가진 PredictionGame 리포지토리 인터페이스를 정의해주세요.
```

### 애플리케이션 계층
```
Copilot, 검증과 도메인 이벤트 발행을 포함한 새로운 예측 게임 생성 유스케이스를 만들어주세요.

Copilot, 적절한 에러 처리를 포함한 사용자 예측 제출 애플리케이션 서비스를 구현해주세요.

Copilot, Zod 검증 스키마를 포함한 예측 게임 생성 요청 DTO를 작성해주세요.

Copilot, 페이지네이션을 포함한 예측 통계 조회 쿼리 핸들러를 생성해주세요.
```

### 인프라스트럭처 계층
```
Copilot, 도메인 계층의 리포지토리 인터페이스를 사용하여 PredictionGame Supabase 리포지토리를 구현해주세요.

Copilot, 재시도 로직을 포함한 외부 마켓 데이터 조회 MCP 서비스 클라이언트를 생성해주세요.

Copilot, Supabase SQL을 사용하여 예측 관련 테이블의 데이터베이스 마이그레이션 스크립트를 작성해주세요.

Copilot, Supabase 실시간 구독을 사용하는 도메인 이벤트 발행자를 구현해주세요.
```

### 프레젠테이션 계층
```
Copilot, 로딩 상태를 포함한 예측 게임 목록을 표시하는 Next.js Server Component를 생성해주세요.

Copilot, 낙관적 업데이트를 포함한 예측 제출 폼 Client Component를 구현해주세요.

Copilot, 에러 처리를 포함한 예측 게임 상태 관리 React 훅을 작성해주세요.

Copilot, Tailwind CSS를 사용하여 반응형 예측 카드 컴포넌트를 생성해주세요.
```

### 테스트
```
Copilot, Jest를 사용하여 적절한 격리와 함께 PredictionGame 애그리거트 단위 테스트를 작성해주세요.

Copilot, 리포지토리 목(mock)을 사용한 예측 생성 유스케이스 통합 테스트를 만들어주세요.

Copilot, Playwright를 사용하여 예측 플로우 E2E 테스트를 구현해주세요.

Copilot, React Testing Library를 사용하여 예측 폼 컴포넌트 테스트를 작성해주세요.
```

### API 라우트
```
Copilot, 적절한 검증과 에러 처리를 포함한 예측 제출 Next.js API 라우트를 생성해주세요.

Copilot, 폼 검증을 포함한 예측 게임 생성 Server Action을 구현해주세요.

Copilot, Server-Sent Events를 사용하여 예측 업데이트를 스트리밍하는 API 라우트를 작성해주세요.

Copilot, 외부 마켓 데이터 업데이트 처리를 위한 웹훅 핸들러를 생성해주세요.
```

## 명명 규칙

### 파일 및 디렉토리
- 파일명에는 kebab-case 사용: `prediction-game.entity.ts`
- 클래스명에는 PascalCase 사용: `PredictionGame`
- 함수 및 변수명에는 camelCase 사용: `createPredictionGame`
- 상수명에는 SCREAMING_SNAKE_CASE 사용: `MAX_PREDICTIONS_PER_GAME`

### 도메인 객체
- Entity: `PredictionGame`, `User`, `Market`
- Value Object: `PredictionId`, `UserId`, `Email`
- Aggregate: 루트 엔티티와 동일
- Service: `PredictionScoringService`, `MarketDataService`
- Repository: `IPredictionGameRepository`, `PredictionGameRepository`

### React 컴포넌트
- 컴포넌트: `PredictionCard`, `GameList`, `UserDashboard`
- 훅: `usePredictionGame`, `useMarketData`
- 페이지: `page.tsx`, `layout.tsx`
- API 라우트: `route.ts`

## 의존성 및 라이브러리

### 핵심 의존성
- App Router를 포함한 Next.js 15
- 타입 안전성을 위한 TypeScript
- 스타일링을 위한 Tailwind CSS
- 검증을 위한 Zod
- 데이터베이스 통합을 위한 @supabase/supabase-js

### 개발 의존성
- 단위 테스트를 위한 Jest 및 React Testing Library
- E2E 테스트를 위한 Playwright
- 코드 품질을 위한 ESLint 및 Prettier
- Git 훅을 위한 Husky

## 에러 처리 패턴

### 도메인 계층
```typescript
// 도메인 작업에 Result 패턴 사용
type Result<T, E = Error> = { success: true; data: T } | { success: false; error: E }
```

### 애플리케이션 계층
```typescript
// 커스텀 애플리케이션 에러 사용
class ValidationError extends Error {
  constructor(message: string, public field: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
```

### 인프라스트럭처 계층
```typescript
// 외부 서비스 에러 처리
class ExternalServiceError extends Error {
  constructor(message: string, public service: string, public statusCode?: number) {
    super(message);
    this.name = 'ExternalServiceError';
  }
}
```

## 성능 고려사항
- 비용이 많이 드는 컴포넌트에는 React.memo 사용
- 적절한 데이터베이스 인덱싱 구현
- Supabase 행 수준 보안(RLS) 사용
- 동적 임포트로 번들 크기 최적화
- 적절한 캐싱 전략 구현

## 보안 모범 사례
- API 경계에서 모든 입력 검증
- 데이터 접근 제어를 위한 Supabase RLS 사용
- 적절한 CSRF 보호 구현
- 민감한 데이터는 환경 변수 사용
- OWASP 보안 가이드라인 준수

## 환경 설정
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_APP_NAME=Posmul Prediction Game
MCP_SERVER_URL=http://localhost:3001
```

## PowerShell 명령어 예시
```powershell
# 프로젝트 설정
npm install
npm run dev

# 테스트 실행
npm test
npm run test:e2e

# 빌드 및 배포
npm run build
npm start

# 타입 체크
npm run type-check

# 린팅
npm run lint
npm run lint:fix
```

주의사항: Clean Architecture의 의존성 규칙을 항상 따라야 합니다 - 내부 계층은 외부 계층에 의존해서는 안 됩니다. 도메인 계층은 외부 의존성이 없는 순수한 비즈니스 로직이어야 합니다.
