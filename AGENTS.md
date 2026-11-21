# PosMul 모노레포 헌법 (v3.2)

> PosMul 생태계(`apps/posmul-web`, `apps/housing-pro`, `packages/auth-economy-sdk`, `supabase`)의 단일 진실 규칙. 상세 기준: [Posmul_projectrule.md](file:///c:/G/posmul/.agent/rules/Posmul_projectrule.md) · [Posmul_tdd-rules.md](file:///c:/G/posmul/.agent/rules/Posmul_tdd-rules.md) · [delivery-pipeline.md](file:///c:/G/posmul/.agent/rules/delivery-pipeline.md)

## 1. v3.0 경제 헌법 (5대 불변식)
1. **입구 단일화(`PMP` Only)**: `Forum`, `Consume`, 버티컬 앱(`Housing-Pro` 등) 보상은 **오직 `PMP`만 지급** (`PMC` 직접 지급 전면 금지).
2. **`PMC` 유일 생성**: `PMC`는 **오직 `Prediction` 예측 성공 보상**으로만 발행.
3. **승자독식 & `EAT` 상한**: 예측 실패 `PMP`는 소멸(승자독식), `MoneyWave` 상금 풀은 `EBIT`가 아닌 **세후 순이익(`EAT`)** 한도 내 배분.
4. **일일 Hard Cap**: `Forum` 일일 **1,000 PMP**, 버티컬(`Housing-Pro`) 일일 **300 PMP**를 서버/DB 레벨에서 통제.
5. **단계 잠금(Phase Lock)**: `Donation`은 Phase 1(`기관기부`·`K-물품기부`)만 오픈(`opinion-leader`·`미래꿈기부` 잠금), `Consume` 소상공인/크라우드펀딩은 Phase 3 잠금 유지.

## 2. Supabase MCP vs 앱 런타임 & DB 규칙
- **역할 분리**: DB DDL/점검은 **Supabase MCP**(`mcp_supabase_*`) 전용(Supabase CLI DB 변경 금지). 앱 런타임 코드에서 `MCP*Repository` 및 `mcp_supabase_*` 호출 **절대 금지** (`@supabase/ssr` 또는 `supabaseAdmin` 기반 `Supabase*Repository` 구현).
- **Schema-per-BC**: 모든 테이블은 전용 스키마(`economy`, `prediction`, `forum`, `donation`, `consume`, `feed`, `user`, `ranking`, `vertical_housing`)에 생성 (**`public` 스키마 신규 도메인 테이블 금지**). 쿼리는 `.schema("<schema>").from("<table>")` 필수.
- **마이그레이션 동기화**: `apply_migration` 실행 시 동일 SQL을 `supabase/migrations/YYYYMMDDHHMMSS_<name>.sql`에 로컬 저장하고, 직후 `get_advisors(type="security")` 실행해 신규 `ERROR` 0건 검증.

## 3. P0 보안 & 금융 원장 불변식 (Fail-Closed)
- **서버 인증 필수**: 모든 쓰기 API Route 및 Server Action(`"use server"`)은 진입 즉시 `supabase.auth.getUser()` 또는 `requireAdminApi()`/`requireCronOrAdmin()` 검증 (`params.userId` IDOR, `DEMO_USER_ID` 폴백, `user.email?.includes("admin")` 금지).
- **`SECURITY DEFINER` 격리**: `SET search_path = <명시 스키마>` 선언 + `REVOKE ALL ON FUNCTION ... FROM PUBLIC, anon, authenticated;` 적용 (`service_role` 최소 권한).
- **RLS & 원장 원자성**: 전 테이블 RLS 활성화, 쓰기 정책 `USING (true)` 금지, `(select auth.uid())` 사용. `PMP`/`PMC` 잔액 변동·일일 상한·환불은 JS Read-Modify-Write 금지 → **단일 원자적 PostgreSQL RPC + `economy.pmp_pmc_transactions` 기록** 필수.

## 4. Tiered DDD 아키텍처 지도
- **Tier 1 Core DDD (엄격한 4계층)**: `prediction`, `economy`(`shared/economy-kernel` + SDK 일원화), `feed` → `Domain(순수 TS, 외부 의존 0)` ← `Application(UseCase)` ← `Infrastructure(Supabase*Repository)` / `Presentation`.
- **Tier 2 Clean Feature Slice (3단 책임 분리)**: `forum`, `donation`, `consume`, `ranking`, `apps/housing-pro` → 순수 비즈니스 규칙/계산(`domain` 또는 `*-policy.ts`) ← 인증+Zod+원자 RPC(`application` 또는 `*.actions.ts`) ← 500줄 이하 순수 UI.

## 5. 1:1 순차 작업 원칙 & 완료 검증 게이트 (DoD)
- **1:1 컨펌·순차 진행**: 멀티에이전트 병렬 분업을 쓰지 않고 대표님과 1:1로 호흡합니다. 중~대형 작업이나 4자 협업 산출물(`[PRD]`, `[AI-SPEC]`, `[UI-SPEC]`, `[AUDIT-FEEDBACK]`) 수신 시 [domain-council.md](file:///c:/G/posmul/.agent/workflows/domain-council.md)와 관련 **`posmul-*` 도메인 참모 스킬**을 먼저 확인한 뒤 `대표님 컨펌 → DB/Core(테스트) → UI/App → Delivery Gate` 순으로 순차 구현합니다.
- **코드 위생**: `TypeScript strict`(`any`, `@ts-ignore`, 빈 `catch {}`, 가짜 성공 UI 금지), 단일 파일 500줄 이하.
- **완료 게이트**: 변경 앱/패키지 대상 `type-check` + `test` + `lint` 통과 후 `scripts/ship.ps1`로 빌드·`develop` 커밋/푸시 (`-Deploy`는 사용자 요청 시만).
