# `@posmul/posmul-web` 전용 Agent 규칙

> 메인 웹 플랫폼(`apps/posmul-web`) 작업 시 루트 `AGENTS.md`와 함께 적용되는 세부 아키텍처 규칙입니다.

## 1. Clean Architecture & DDD 의존성 규칙
```text
Presentation / Next.js App (src/app/, presentation/)
        │
        ▼
Application (bounded-contexts/{domain}/application/)
        │
        ▼
Domain (bounded-contexts/{domain}/domain/)  ◄── 외부 의존성 0 (순수 TS)
        ▲
        │ (implements Port)
Infrastructure (bounded-contexts/{domain}/infrastructure/)
```

### ESLint 기계적 경계 & 금지 Import
- **`domain/` (`error`)**: `@supabase/*`, `@/lib/supabase/*`, `**/infrastructure/**`, `**/presentation/**`, `next/*`, `react`, `**/shared/mcp*` import 절대 금지.
- **`shared/` (`error`)**: `@/bounded-contexts/**` 역방향 import 절대 금지.
- **`application/` (`warn` → 신규 코드 필수 준수)**: `**/infrastructure/**`, `@/lib/supabase/admin` 직접 import 지양 — 반드시 Domain Repository Port 인터페이스를 주입받습니다.
- **Cross-BC 직접 import 금지**: 여러 BC가 공유할 계약·어댑터는 `src/shared/` 또는 `@posmul/auth-economy-sdk`로 승격합니다.

## 2. 진입점 · 유령 도메인 · UI 규율
- **얇은 진입점**: `src/app/api/**` 및 Server Action에서 `supabaseAdmin`으로 직접 DB DML을 하지 않고, `① 서버 인증 → ② Zod 검증 → ③ UseCase/도메인 서비스 호출 → ④ 응답 반환` 순서를 따릅니다.
- **유령 도메인 규율**: `healing-room`, `challenge`, `live`, `wallet`, `user` 등에 신규 비즈니스 로직을 `src/app/` 아래에 덧붙이지 말고, 소속 BC의 `domain/`·`application/` 또는 신규 BC([domain-add.md](file:///c:/G/posmul/.agent/workflows/domain-add.md))로 분리합니다.
- **Local First UI & 파일 크기**: `src/shared/ui/`에는 도메인 무관 순수 프리미티브(Button, Input, Modal shell 등)만 배치하고, 도메인 조합 UI는 `bounded-contexts/{domain}/presentation/components/`에 둡니다. 모든 파일은 **500줄 이내**(`max-lines` 경고)로 분리합니다.

## 3. 검증 명령 (`c:\G\posmul` 루트 기준 PowerShell)
```powershell
pnpm -F @posmul/posmul-web type-check
pnpm -F @posmul/posmul-web test -- --passWithNoTests --silent
pnpm -F @posmul/posmul-web lint
```
