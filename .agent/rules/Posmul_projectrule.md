---
trigger: always_on
---

# PosMul 프로젝트 핵심 규칙 (v3.1 Constitution)

> **목적**: 에이전트와 개발자가 PosMul의 **v3.0 경제 헌법 · Clean Architecture/DDD 경계 · 보안/원장 불변식 · DB 동기화**를 일관되게 준수하기 위한 단일 진실 규칙입니다.  
> **정본 기획 문서**: [POSMUL_WHITEPAPER.md](file:///c:/G/posmul/docs/POSMUL_WHITEPAPER.md) · [DOMAIN_FLOW_AND_DECISIONS.md](file:///c:/G/posmul/docs/DOMAIN_FLOW_AND_DECISIONS.md)

---

## 1. 절대 불변 원칙 (위반 시 작업 거부)

### ① 언어 및 환경
- 모든 대화, 생각 과정, 문서, 코드 주석, 커밋 메시지는 **한국어** 기본.
- Windows 환경 터미널 명령은 **PowerShell** 사용 (`pnpm`, `turbo` 전용 — `npm`/`yarn` 금지).

### ② v3.0 경제 헌법 (Economy Invariants)
- **입구 단일화**: `Forum`, `Consume`, 버티컬 앱(`Housing-Pro` 등)의 모든 유저 활동 보상은 **오직 `PMP`만 지급**한다. (`PMC` 직접 지급 전면 금지)
- **`PMC` 단일 생성**: `PMC`는 **오직 `Prediction` 예측 성공 보상**으로만 유일하게 발행된다. (가입 보너스·출석·일일 보너스·광고·결제에서 `PMC` 직접 지급 금지)
- **승자독식 & `EAT` 상한**: 예측 실패 `PMP`는 소멸되며, `MoneyWave` 상금 풀은 매출/`EBIT`가 아닌 **세후 순이익(`EAT`)** 한도 내에서만 배분한다.
- **일일 획득 상한(Hard Cap)**: `Forum` 일일 최대 **1,000 PMP**, 버티컬(`Housing-Pro`) 일일 최대 **300 PMP**를 서버/DB 레벨에서 엄격 통제한다.
- **단계 잠금 준수**: `Donation`은 Phase 1(`기관기부`·`K-물품기부`)만 오픈(`opinion-leader`·`미래꿈기부` 잠금), `Consume` 소상공인/크라우드펀딩은 Phase 3 잠금 유지.

### ③ Clean Architecture & DDD 경계 (Dependency Rule)
```text
Presentation / Next.js App (app/, presentation/)
        │
        ▼
Application (bounded-contexts/{domain}/application/use-cases/)
        │
        ▼
Domain (bounded-contexts/{domain}/domain/)  ◄── 외부 의존성 0 (순수 TS)
        ▲
        │ (implements Port)
Infrastructure (bounded-contexts/{domain}/infrastructure/)
```
- **API Route / Server Action 우회 금지**: 신규 기능 및 리팩토링 대상은 `app/api/`·Server Action에서 `supabaseAdmin`으로 DB에 직접 DML 하지 않고, 반드시 **`bounded-contexts/{domain}/application` UseCase(또는 정식 도메인 서비스)**를 경유한다.
- **의존성 역전 엄수**:
  - ❌ `domain/` → `application/`, `infrastructure/`, `presentation/`, `@supabase/*`, `next/*`, `react`, `lib/supabase/*`, `zod` 등 외부 인프라 import 금지.
  - ❌ `application/` → `infrastructure/` 구체 클래스·`@supabase/*`·`@/lib/supabase/admin` 직접 import 금지 (반드시 Domain Port 인터페이스 주입).
  - ❌ `infrastructure/` → `src/app/` 역방향 import 금지.
  - ❌ `shared/` → `bounded-contexts/` 역방향 import 금지.
  - ❌ **Cross-BC 직접 import 및 순환 의존 금지**: 여러 BC가 공유해야 하는 타입/어댑터(LLM 클라이언트, 지역 계층, 경제 원장 인터페이스 등)는 `shared/` 또는 `packages/auth-economy-sdk`로 승격한다.
- **유령 도메인 금지**: 새 비즈니스 도메인을 `app/` 아래에 임의로 추가하지 말고 [domain-add.md](file:///c:/G/posmul/.agent/workflows/domain-add.md) 절차로 BC 또는 소속 BC 하위에 편입한다.

### ④ Supabase MCP vs 앱 런타임 엄격 분리 (핵심 교정)
- **Supabase MCP (`apply_migration`, `execute_sql`, `get_advisors`, `generate_typescript_types`)**:
  - **AI 에이전트가 개발/운영 시점에 DB 스키마·데이터를 점검/변경할 때만 사용**한다. (개발자/에이전트의 Supabase CLI DB 변경 금지)
- **Next.js 앱 런타임 코드**:
  - ❌ **앱 소스코드 안에서 `MCP*Repository` 작성 및 `mcp_supabase_*` 호출 절대 금지!** (Next.js 런타임에 존재하지 않아 크래시함)
  - ✅ 앱 Repository 구현체는 반드시 `@supabase/ssr`(사용자 세션) 또는 `supabaseAdmin`(서버 전용)을 사용하는 `Supabase*Repository`로 작성한다.
- **Schema-per-Bounded-Context & 로컬 Git 동기화 의무**:
  - 모든 도메인 테이블은 독립 스키마(`economy`, `prediction`, `forum`, `donation`, `consume`, `feed`, `user`, `ranking`, `vertical_housing`)에 생성한다. **`public` 스키마에 도메인 테이블 생성 절대 금지.**
  - Supabase 쿼리는 반드시 `.schema("<schema>").from("<table>")` 형식 사용 (`.from("schema.table")` 문법 오류 금지).
  - **`apply_migration` 실행 시 반드시 동일 SQL을 `supabase/migrations/YYYYMMDDHHMMSS_<name>.sql`로 로컬 저장**하고, 직후 **`get_advisors(type="security")`**를 실행해 신규 `ERROR`/`WARN`이 0건인지 확인한다.

### ⑤ 보안 & 금융 원장 불변식 (P0 Security Invariants)
- **인증/인가 필수 (Fail-Closed)**:
  - 모든 쓰기 API Route(`POST`/`PUT`/`PATCH`/`DELETE`)와 Server Action(`"use server"`)은 진입 즉시 `supabase.auth.getUser()` 또는 `requireAdminApi()`/`requireCronOrAdmin()`으로 서버 인증을 수행한다.
  - ❌ 클라이언트 파라미터 `params.userId` 신뢰(IDOR), 비로그인 시 `DEMO_USER_ID` 폴백, `user.email?.includes("admin")` 같은 문자열 권한 판별 **절대 금지**.
- **`SECURITY DEFINER` RPC 권한 격리 필수**:
  - 모든 `SECURITY DEFINER` DB 함수는 반드시 `SET search_path = <명시 스키마>`를 선언하고, **생성 직후 `REVOKE ALL ON FUNCTION ... FROM PUBLIC, anon, authenticated;`**를 적용한다. 서버 전용 금전·관리자 함수는 `service_role`에만 `GRANT EXECUTE`한다.
- **RLS 기본 원칙**:
  - 모든 신규 테이블에 `ENABLE ROW LEVEL SECURITY` 필수.
  - 쓰기(`INSERT`/`UPDATE`/`DELETE`/`ALL`) 정책에 `USING (true)` / `WITH CHECK (true)` 금지.
  - RLS 정책 내 `auth.uid()`는 성능 최적화를 위해 `(select auth.uid())` 형태로 작성한다.
- **금융 원장 원자성 (No Read-Modify-Write)**:
  - `PMP`/`PMC` 잔액 증감·이체·차감·환불·일일 상한 체크는 JS에서 `SELECT` 후 `UPDATE`하는 Read-Modify-Write를 **절대 금지**한다.
  - 반드시 **단일 원자적 PostgreSQL RPC**(`FOR UPDATE` 또는 `WHERE balance >= amount`, `WHERE is_active = true`, `WHERE ended_at IS NULL` 등 조건부 갱신)로 잔액 변경 + `economy.pmp_pmc_transactions` 원장 기록을 한 트랜잭션에 처리한다.
  - 원장 부호 규약: 지급/적립은 양수(`+`), 차감/소모/소각은 일관된 규약을 준수하며 실패 시 절대값 덮어쓰기 롤백 금지.
- **업로드 & 외부 AI API 보호**:
  - 파일 업로드 API는 인증 + MIME/확장자 화이트리스트 + 용량 상한(예: 5MB) 필수.
  - 유료 LLM/Vision API 호출 라우트는 인증 + 입력 크기 제한 + Rate Limit 필수.

### ⑥ TypeScript Strict · 코드 위생 · UI 원칙
- **TypeScript Strict**: `any`, `as any`, `@ts-ignore`, 빈 `catch {}`(에러 삼키기) 및 서버 에러 시 가짜 성공 UI 출력 금지.
- **God File 금지**: 단일 컴포넌트/액션/스토어 파일이 **500줄을 초과하지 않도록** 책임별로 분리한다 (`apps/housing-pro` 포함).
- **Local First UI**: `shared/ui`는 도메인 무관 순수 프리미티브(Button, Input, Modal shell 등)만 유지. 도메인 조합 UI 및 데이터 패칭 컴포넌트는 해당 도메인 `presentation/`에 둔다.

---

## 2. 현행 모노레포 구조

```text
c:\G\posmul\
├── apps/
│   ├── posmul-web/                 # 메인 웹 앱 (Next.js 15, React 19)
│   │   └── src/
│   │       ├── app/                # Next.js App Router (얇은 진입점/라우팅)
│   │       ├── bounded-contexts/   # DDD Bounded Contexts (auth, consume, demographic-data,
│   │       │                       # donation, economy, feed, forum, prediction, ranking)
│   │       ├── shared/             # 도메인 무관 UI 프리미티브, Economy Kernel, Security
│   │       └── lib/                # Supabase SSR/Admin 클라이언트
│   └── housing-pro/                # 버티컬 앱 (주택관리사 수험·실무, vertical_housing 스키마)
├── packages/
│   └── auth-economy-sdk/           # 생태계 통합 인증·경제 SDK (단일 타입/원장/SSO 계약)
├── supabase/
│   ├── migrations/                 # 원격 DB와 1:1 동기화되는 SQL 마이그레이션
│   └── functions/                  # Supabase Edge Functions (배포 시 인증·로컬 동기화 필수)
└── docs/                           # v3.0 정본 백서, 감사 보고서, v2 스펙
```

---

## 3. 계층형 규칙 · 워크플로우 & 도메인 참모 스킬

- **계층형 `AGENTS.md` 지도**: [루트 AGENTS.md](file:///c:/G/posmul/AGENTS.md) · [posmul-web](file:///c:/G/posmul/apps/posmul-web/AGENTS.md) · [housing-pro](file:///c:/G/posmul/apps/housing-pro/AGENTS.md) · [auth-economy-sdk](file:///c:/G/posmul/packages/auth-economy-sdk/AGENTS.md)
- **기획·도메인 의사결정 & 4자 협업 수신**: [domain-council.md](file:///c:/G/posmul/.agent/workflows/domain-council.md) + `.agent/skills/posmul-*/SKILL.md`
- **복잡한 기능 계획**: [feature-planner.md](file:///c:/G/posmul/.agent/workflows/feature-planner.md)
- **기능 구현**: [posmul-feature.md](file:///c:/G/posmul/.agent/workflows/posmul-feature.md)
- **새 Bounded Context 추가**: [domain-add.md](file:///c:/G/posmul/.agent/workflows/domain-add.md)
- **UI 컴포넌트 개발**: [ui-component.md](file:///c:/G/posmul/.agent/workflows/ui-component.md)
- **완료 검증 및 배포**: [delivery-pipeline.md](file:///c:/G/posmul/.agent/rules/delivery-pipeline.md) · [Posmul_tdd-rules.md](file:///c:/G/posmul/.agent/rules/Posmul_tdd-rules.md)

**버전**: 3.2 | **업데이트**: 2026-11-22
