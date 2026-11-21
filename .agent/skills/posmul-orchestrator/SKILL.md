---
name: posmul-orchestrator
description: PosMul 모노레포의 중~대형 기능 구현, 다중 도메인/계층 리팩토링, 또는 4자 협업 산출물([PRD], [AI-SPEC], [UI-SPEC], [AUDIT-FEEDBACK])을 수신했을 때 도메인 참모 자문과 레이어별 서브에이전트 분업(Domain Council → DB/Core → UI/App → Delivery Gate)을 오케스트레이션할 때 사용한다.
---

# PosMul 멀티 에이전트 분업 오케스트레이터 (`posmul-orchestrator`)

> **정본 근거**: [AGENTS.md](file:///c:/G/posmul/AGENTS.md) · [00_4자_협업_플레이북.md](file:///c:/G/%ED%98%91%EC%97%85%ED%94%8C%EB%A0%88%EC%9D%B4%EB%B6%81/00_4%EC%9E%90_%ED%98%91%EC%97%85_%ED%94%8C%EB%A0%88%EC%9D%B4%EB%B6%81.md) · [domain-council.md](file:///c:/G/posmul/.agent/workflows/domain-council.md)

25만 줄 규모의 DDD + Clean Architecture 모노레포에서 단일 에이전트가 DB·도메인·UI를 한 턴에 뭉뚱그려 구현하다 God File이나 아키텍처 우회가 생기는 것을 막기 위한 **단계별 분업 실행 지휘서**입니다.

---

## 1. 작업 규모별 라우팅

| 규모 / 유형 | 기준 | 실행 방식 |
| :--- | :--- | :--- |
| **Small** | 단일 버그 수정, 문구/스타일 조정, 1개 파일 국소 개선 | 관련 도메인 `SKILL.md` 핵심 금지선 확인 후 메인 에이전트가 직접 처리 → Gate 검증 |
| **Medium** | 단일 도메인 내 기능 추가 (DB + 로직 + UI 2~5개 파일) | 참모 1~2개 확인 → Core(Domain/Action/Test) 완료 후 UI 구현 순으로 계층 분리 진행 |
| **Large / Cross-BC / 핸드오프** | 2개 이상 도메인·앱 연계, DB 스키마 변경 포함, `[PRD]`/`[AI-SPEC]`/`[UI-SPEC]`/`[AUDIT-FEEDBACK]` 수신 | 아래 **4단계 서브에이전트 분업 파이프라인** 가동 |

---

## 2. 4자 협업 인바운드 핸드오프 프로토콜

1. **`[PRD]` (Gemini App → Antigravity)**:
   - 경제 헌법 5대 불변식 및 Phase 잠금 위반 여부를 먼저 검수하고, 대상 모듈이 **Tier 1 Core DDD**(`prediction`, `economy`, `feed`)인지 **Tier 2 Clean Feature Slice**(`forum`, `donation`, `consume`, `ranking`, `housing-pro`)인지 매핑한 뒤 대표님 컨펌을 받습니다.
2. **`[AI-SPEC]` (Google AI Studio → Antigravity)**:
   - 제시된 모델·프롬프트·JSON Schema를 그대로 믿고 노출하지 않고, 서버 인증(`getUser()`) + Zod 검증 + 입력 크기 제한 + Rate Limit + 저신뢰도 Fallback을 붙여 라우트/액션으로 이식합니다.
3. **`[UI-SPEC]` (Google AI Studio → Antigravity)**:
   - 시안 코드를 통째로 복사하지 않고 **500줄 이하 컴포넌트**로 분해하며, `Local First` 원칙(`shared/ui` 프리미티브 vs 도메인 `presentation/components`)과 Mock/실서버 액션 경계를 분리해 이식합니다.
4. **`[AUDIT-FEEDBACK]` (Google AI Studio → Antigravity)**:
   - `[Antigravity 확인 필요]` 태그 항목을 실제 코드·라이브 DB 스키마와 대조 검증한 뒤, 대표님이 채택한 항목만 `P0 → P1 → P2` 순으로 실행합니다.

---

## 3. 4단계 서브에이전트 분업 파이프라인

> **원칙**: DB/도메인 계약을 먼저 확정·검증한 뒤 UI를 붙입니다. 한 번에 500줄이 넘는 God File을 만들지 않습니다.

### Stage 1. Domain Council — 기획·헌법·영향도 검수 (`research` Read-Only 서브에이전트)
- 영향받는 도메인(1~3개)의 `.agent/skills/posmul-*/SKILL.md` 및 `context.md`를 읽고, **Cross-BC 충돌/금지선/현 코드 상태**를 파악합니다.
- 필요 시 읽기 전용 `invoke_subagent(TypeName="research")`에 코드베이스 현황과 대조 조사를 위임합니다.
- **대표님 컨펌 게이트**: 참모별 의견 요약 + 쟁점 선택지(`A안 [추천]` vs `B안`) + 변경 예정 범위를 보고하고 **컨펌 전까지 코드를 수정하지 않습니다.**

### Stage 2. DB & Core Slice — 데이터·비즈니스 불변식 (`self` 서브에이전트 또는 메인 1차)
- **DB 변경 시**: `mcp_supabase_apply_migration` 실행 → **동일 SQL을 `supabase/migrations/YYYYMMDDHHMMSS_<name>.sql`로 저장** → **`mcp_supabase_get_advisors(type="security")` 0 ERROR 확인** (`public` 스키마 금지, 전 테이블 RLS ON, `SECURITY DEFINER` 격리).
- **Tier 1 Core**: `domain/`(외부 의존 0, `reconstitute()` 준수) → `application/`(Port 주입 UseCase) → `infrastructure/`(`Supabase*Repository`, `.schema()` 명시, 원자적 RPC).
- **Tier 2 Feature Slice**: 순수 정책/계산 유틸 + 인증·Zod·원자 RPC 서버 액션.
- **Stage 2 완료 조건**: 실질적 행위 검증 단위 테스트(`*.test.ts`) 작성 및 통과 (`toBeDefined()` 껍데기 테스트 금지).

### Stage 3. UI & App Integration — 진입점·컴포넌트 (`self` + `browser` 서브에이전트)
- `app/api/` 및 Server Action은 **얇은 진입점**(서버 인증 → Zod → UseCase/서비스 → 응답)만 담당합니다.
- UI는 **500줄 이하**로 분리하고 hex 색상 하드코딩 금지, 다크모드(`dark:`) 및 반응형, 가짜 성공 UI(`catch` 에러 삼키기) 금지를 준수합니다.
- UI 확인이 필요하면 `invoke_subagent(TypeName="browser")`로 실제 렌더링과 인터랙션을 검증합니다.

### Stage 4. Delivery Gatekeeper — 통합 검증 & 기억 동기화 (`scripts/ship.ps1`)
1. **정적/빌드/테스트 검증** (수정된 패키지/앱 기준):
   - `pnpm -F <대상> type-check`
   - `pnpm -F <대상> test -- --passWithNoTests --silent`
   - `pnpm -F <대상> lint`
   - `powershell -ExecutionPolicy Bypass -File scripts/ship.ps1 -CheckOnly`
2. **안전 커밋**: `develop` 브랜치 확인 후 `scripts/ship.ps1 -Message "..." -Files "파일1,파일2"` 실행 (`-Deploy`는 사용자 요청 시만).
3. **기억 동기화**: 새로운 원칙/수치가 확정되었다면 해당 도메인 `SKILL.md`, [DOMAIN_FLOW_AND_DECISIONS.md](file:///c:/G/posmul/docs/DOMAIN_FLOW_AND_DECISIONS.md), `c:\G\개발일지\YYYY-MM-DD.md`를 함께 갱신합니다.

---

## 4. 절대 금지 안티패턴
- ❌ 대표님 컨펌 없이 `PMC` 지급 경로·`EAT` 공식·일일 Cap·Phase 잠금을 임의 변경하는 행위
- ❌ 한 턴에 DB 마이그레이션 + UseCase + 1,000줄 UI를 한꺼번에 밀어 넣어 테스트/검증이 누락되는 행위
- ❌ Tier 2 단순 기능에 실제 `app/`에서 호출하지도 않는 껍데기 Domain/Repository 스텁을 양산하는 행위
- ❌ `apps/*/src/**`에서 `MCP*Repository` 또는 `mcp_supabase_*`를 런타임 코드로 작성하는 행위
