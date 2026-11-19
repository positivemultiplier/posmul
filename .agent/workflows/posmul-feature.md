---
description: PosMul 도메인별 기능 개발 워크플로우. 새 기능을 특정 도메인에 추가하거나 수정할 때 사용.
---

# PosMul Feature Development (v3.1)

## 사용 시기
- 특정 도메인(`prediction`, `consume`, `donation`, `forum`, `economy`, `feed`, `ranking`, `housing-pro`)에 새 기능 추가 또는 기존 기능 개선

## 워크플로우

### Step 1: 도메인 & 규율 파악
1. 대상 도메인의 `bounded-contexts/{domain}/context.md`와 해당 참모 스킬(`.agent/skills/posmul-{domain}/SKILL.md`)을 읽는다.
2. 기존 `domain/`, `application/`, `infrastructure/` 구조를 확인한다.
3. **우회 금지 확인**: `app/api/`나 Server Action에서 DB를 직접 DML하지 않고 UseCase(Application Layer)를 경유하도록 설계한다.

### Step 2: Clean Architecture 계층별 구현

1. **Domain Layer** (`domain/` — 외부 의존성 0):
   - `entities/`, `value-objects/`, `repositories/` (Port 인터페이스만), `services/` (순수 비즈니스 로직)
   - DB 복원 시 반드시 `reconstitute()` 팩토리 사용 (`create()` 재사용으로 유령 이벤트 생성 금지)
2. **Application Layer** (`application/` — Domain Port만 의존):
   - `use-cases/`, `dto/`
   - `supabaseAdmin`이나 `infrastructure/` 구체 클래스를 직접 import하지 않고 생성자/DI Container로 Port 주입
3. **Infrastructure Layer** (`infrastructure/` — Port 구현체):
   - `repositories/`: **반드시 `@supabase/ssr` 또는 `supabaseAdmin` 기반 `Supabase*Repository` 구현** (`MCP*Repository` 및 `mcp_supabase_*` 앱 런타임 호출 절대 금지)
   - 쿼리는 `.schema("<schema>").from("<table>")` 형식 준수
   - 금융 잔액 변동·일일 상한·중복 차단은 단일 원자적 DB RPC 호출로 구현 (Read-Modify-Write 금지)
4. **Presentation / App 진입점** (`presentation/` + `src/app/`):
   - `app/api/` 및 Server Action은 **얇은 진입점**: ① 서버 인증(`getUser()` / `requireAdminApi`) → ② Zod 입력 검증 → ③ UseCase 호출 → ④ 응답 반환
   - 클라이언트 `params.userId` 신뢰, 비로그인 `DEMO_USER_ID` 폴백, `catch` 에러 삼키기(가짜 성공 UI) 금지
   - Local First UI: 도메인 UI는 `bounded-contexts/{domain}/presentation/components/`에 배치, 단일 파일 500줄 이내 유지

### Step 3: DB 변경 시 동기화 (해당 시)
1. DDL은 `mcp_supabase_apply_migration`으로 적용하고 **동일 SQL을 `supabase/migrations/YYYYMMDDHHMMSS_<name>.sql`에 로컬 저장**.
2. 모든 신규 테이블 RLS 활성화 + 최소 권한 정책(`(select auth.uid())`), `SECURITY DEFINER` 함수는 `SET search_path` + `REVOKE EXECUTE FROM PUBLIC, anon, authenticated`.
3. 적용 직후 `mcp_supabase_get_advisors(type="security")` 실행해 0 ERROR 확인.

### Step 4: 검증 (Delivery Pipeline Gate 1)
```powershell
Set-Location -Path c:\G\posmul
pnpm -F @posmul/posmul-web type-check
pnpm -F @posmul/posmul-web test -- --passWithNoTests --silent 2>&1 | Select-Object -Last 20
powershell -ExecutionPolicy Bypass -File scripts/ship.ps1 -CheckOnly
```

## 완료 체크리스트
- [ ] Domain 엔티티/VO/Port 순수성 확인 (외부 import 0건)
- [ ] Application UseCase에서 Infrastructure 직접 import 0건
- [ ] `Supabase*Repository` 구현 (MCP 런타임 호출 0건, `.schema()` 명시)
- [ ] 쓰기 API/Server Action 서버 인증 + Zod 검증 + 원자적 원장 RPC 적용
- [ ] 실질적 행위 검증 단위 테스트 작성 (`toBeDefined()` 껍데기 테스트 금지)
- [ ] DB 변경 시 로컬 `supabase/migrations/` 저장 + `get_advisors(security)` 확인
- [ ] `type-check` + `test` + `build` 통과
