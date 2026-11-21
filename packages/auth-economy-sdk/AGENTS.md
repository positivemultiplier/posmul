# `@posmul/auth-economy-sdk` 전용 Agent 규칙

> PosMul 생태계(`posmul-web`, `housing-pro`, 향후 버티컬)가 공유하는 코어 인증·경제 SDK 규칙입니다.

## 1. 크로스 런타임 & 순수성 원칙
- **런타임 중립성**: 브라우저, Next.js Edge/Serverless, Node.js 어디서나 동작하도록 `node:crypto` 등 Node 전용 모듈을 직접 import하지 않고 표준 Web API(`crypto.randomUUID()` 등)만 사용합니다.
- **UI 배제**: React/Next.js UI 컴포넌트나 앱 특화 라우팅 로직을 SDK에 넣지 않습니다.
- **TypeScript Strict**: `"strict": true` 0 error를 유지하며 `any` 및 중복 `Result` / `Error` / Branded Type export 충돌을 만들지 않습니다.

## 2. DB & 원장 계약 단일 진실 (SSoT)
- **실존 스키마/RPC 계약 일치**: SDK가 호출하는 모든 DB 테이블과 RPC는 반드시 라이브 DB(`supabase/baseline/`, `supabase/migrations/`)에 실존해야 합니다.
  - `.schema("economy").from("...")` 형식 준수 (`.from("economy....")` 및 미존재 `public.economic_transactions` / 미존재 RPC 호출 금지).
- **경제 불변식 일관성**: `PMP`/`PMC` 환율, `WELCOME_BONUS_PMC = 0`, 일일 상한(Forum 1,000 / Vertical 300) 등 코어 경제 상수와 유틸리티는 단일 원천으로 관리합니다.
- **세션/SSO 규율**: 브라우저 `localStorage`에 평문 인증 토큰을 저장하는 방식을 추가하지 말고 `@supabase/ssr` 쿠키 기반 SSO 계약을 존중합니다.

## 3. 연쇄 검증 의무 (`c:\G\posmul` 루트 기준 PowerShell)
SDK 수정 시 반드시 양대 소비 앱(`posmul-web`, `housing-pro`)까지 연쇄 검증합니다:
```powershell
pnpm -F @posmul/auth-economy-sdk type-check
pnpm -F @posmul/auth-economy-sdk build
pnpm -F @posmul/auth-economy-sdk test -- --passWithNoTests
pnpm -F @posmul/auth-economy-sdk lint
pnpm -F @posmul/posmul-web type-check
pnpm -F @posmul/housing-pro type-check
```
