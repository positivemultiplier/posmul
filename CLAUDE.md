# PosMul 프로젝트 개발 가이드

> **AI 시대 직접민주주의 플랫폼** - 시민이 예산 집행을 연습하는 사회적 학습장

---

## 🎯 핵심 개념 (30초 이해)

```
PMP(무료 획득) → 예측 게임(학습) → PMC(성공 보상) → 기부(예산 집행 연습)
```

**목표**: 철의 삼각형(관료-정치인-공급자) 독점 극복 → 시민 직접 참여

---

## 🏗️ 기술 스택

| 영역 | 기술 |
|------|------|
| **Frontend** | Next.js 15, React 19, TypeScript 5.4, Tailwind CSS |
| **Backend** | Supabase (PostgreSQL), MCP 도구 |
| **패키지** | pnpm 10.12.4, Turborepo 2.0.4 |
| **아키텍처** | DDD + Clean Architecture |

---

## 📦 6개 핵심 모듈

| 모듈 | 역할 | 통화 |
|------|------|------|
| **Consume** | 광고 시청, 지역 소비, 펀딩 | PMP/PMC 획득 |
| **Expect** | 예측 게임 참여 | PMP → PMC 전환 |
| **Donate** | 기부 (예산 집행 연습) | PMC 사용 |
| **Forum** | 토론, 브레인스토밍 | PMP 획득 |
| **Ranking** | 활동 순위 | 보상 |
| **Other** | 부가 서비스 | PMC 획득 |

---

## 💰 경제 시스템

### PMP (무위험) vs PMC (위험)

| | PMP | PMC |
|---|-----|-----|
| **성격** | 무위험 자산 | 위험 자산 |
| **획득** | 광고 시청, 포럼 참여 | 예측 성공, MoneyWave |
| **용도** | 예측 게임 참여 | 기부 전용 |

### MoneyWave 3단계

1. **Wave 1**: EBIT 기반 일일 PMC 발행
2. **Wave 2**: 미사용 PMC 재분배 (14일)
3. **Wave 3**: 기업 ESG 마케팅 파트너십

---

## 📁 프로젝트 구조

```
posmul/
├── apps/posmul-web/
│   └── src/
│       ├── app/                    # Next.js 라우트
│       ├── bounded-contexts/       # DDD 도메인
│       │   ├── auth/
│       │   ├── consume/            # 구 investment
│       │   ├── donation/
│       │   ├── economy/
│       │   ├── forum/
│       │   ├── prediction/
│       │   ├── ranking/
│       │   └── user/
│       └── shared/                 # 공용 코드
├── packages/auth-economy-sdk/      # 생태계 SDK
└── docs/                           # 문서
```

---

## 🚀 개발 명령어

```powershell
# 개발 실행
pnpm run dev

# 빌드
turbo build

# 타입 체크
pnpm -F @posmul/posmul-web type-check

# 타입 생성
pnpm generate-types
```

---

## ⚠️ 필수 규칙

1. **TypeScript Strict**: `any` 타입 금지
2. **Schema-per-Context**: 각 도메인 독립 스키마
3. **MCP 도구만 사용**: Supabase CLI 금지
4. **한글 우선**: 모든 응답 한국어

---

**상세 규칙**: `.agent/rules/projectrule.md` 참조  
**워크플로우**: `.agent/workflows/` 참조  
**아키텍처**: `docs/architecture/` 참조
