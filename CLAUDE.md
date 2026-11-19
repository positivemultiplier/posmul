# PosMul 프로젝트 개발 가이드 (v3.1)

> **AI 시대 직접민주주의 & 의사결정 훈련 플랫폼** — 시간·참여(`PMP`) → 사실 판단 훈련(`Prediction`) → 임팩트(`PMC`) → 즐거운 기부(`Donation`)

---

## 🎯 핵심 경제 흐름 (v3.0 정본)

```text
Forum / Consume(광고) / Housing-Pro(버티컬) [오직 PMP만 획득, 일일 Cap]
        │
        ▼  (재원: 세후 순이익 EAT 기반 MoneyWave)
Prediction [PMP 참여 → 실패 시 소멸(승자독식) / 성공 시 유일하게 PMC 획득]
        │
        ▼
Donation [Phase 1: 기관기부 · K-물품기부 / Phase 2: 팔로잉 · 미래꿈(콩도르세·보르다)]
```

---

## 🏗️ 기술 스택 & 모노레포

- **Frontend**: Next.js 15, React 19, TypeScript 5.9 (`strict`), Tailwind CSS
- **Backend**: Supabase (PostgreSQL 17, 멀티 스키마 + RLS + 원자적 RPC)
- **패키지**: pnpm 10.12.4, Turborepo 2.7 (`apps/posmul-web`, `apps/housing-pro`, `packages/auth-economy-sdk`)
- **아키텍처**: DDD + Clean Architecture (Schema-per-Bounded-Context)

---

## ⚠️ 핵심 필수 규칙 (상세: `.agent/rules/Posmul_projectrule.md`)

1. **한글 우선 & PowerShell 사용**
2. **v3.0 경제 헌법**: `PMC`는 오직 예측 성공 보상으로만 발행, `EAT` 기준 `MoneyWave`, 일일 PMP 상한(포럼 1,000 / 버티컬 300)
3. **MCP vs 런타임 분리**: DB DDL/점검은 Supabase MCP 사용(+ `supabase/migrations/` 로컬 저장 + `get_advisors` 필수). 앱 런타임 코드에서는 `MCP*Repository` 금지, 반드시 `@supabase/ssr` / `supabaseAdmin` 기반 `Supabase*Repository` 구현.
4. **보안 & 원장 원자성**: 쓰기 API/Server Action 서버 인증 필수, `params.userId` 신뢰 금지, `SECURITY DEFINER` RPC `anon`/`authenticated` `REVOKE` 필수, 잔액 변동은 단일 원자 DB RPC + 원장 기록 필수.
5. **Clean Architecture**: `app/api`에서 UseCase 우회 금지, Cross-BC 순환 금지, 단일 파일 500줄 이내 유지, `any` 금지.

---

## 📚 정본 문서 & 에이전트 규칙
- **에이전트 헌법**: [.agent/rules/Posmul_projectrule.md](file:///c:/G/posmul/.agent/rules/Posmul_projectrule.md)
- **완료 검증 게이트**: [.agent/rules/delivery-pipeline.md](file:///c:/G/posmul/.agent/rules/delivery-pipeline.md)
- **도메인 참모 회의**: [.agent/workflows/domain-council.md](file:///c:/G/posmul/.agent/workflows/domain-council.md)
- **기획 백서 & 의사결정 보드**: [docs/POSMUL_WHITEPAPER.md](file:///c:/G/posmul/docs/POSMUL_WHITEPAPER.md) · [docs/DOMAIN_FLOW_AND_DECISIONS.md](file:///c:/G/posmul/docs/DOMAIN_FLOW_AND_DECISIONS.md)
- **2026-11 정밀 감사 보고서**: [docs/CODEBASE_DDD_CA_DB_AUDIT_REPORT_2026-11.md](file:///c:/G/posmul/docs/CODEBASE_DDD_CA_DB_AUDIT_REPORT_2026-11.md)
