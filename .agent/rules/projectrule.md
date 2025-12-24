---
trigger: always_on
---

# PosMul 프로젝트 규칙

> AI 및 개발자가 프로젝트를 올바르게 이해하고 일관된 방식으로 개발하기 위한 핵심 규칙

---

## ⚠️ 절대 원칙 (위반 시 코드 거부)

1. **Schema-per-Bounded-Context**: 각 도메인은 독립 DB 스키마
2. **Supabase CLI 절대 금지**: MCP 도구만 사용
3. **TypeScript Strict Mode**: `any` 타입 금지
4. **한글 우선**: 모든 응답, 주석, 문서는 한국어
5. **UI 재사용 원칙**: shared/ui 컴포넌트 우선 확인 (중복 구현 방지)


---

## 🎯 프로젝트 핵심 개념

**PosMul = AI 시대 직접민주주의 플랫폼**

```
PMP(무료 획득) → 예측 게임(학습) → PMC(성공 보상) → 기부(예산 집행 연습)
```

### 경제 시스템

| 통화 | 성격 | 획득 | 용도 |
|------|------|------|------|
| **PMP** | 무위험 자산 | 광고 시청, 포럼 참여 | 예측 게임 참여 |
| **PMC** | 위험 자산 | 예측 성공, MoneyWave | 기부 전용 |

---

## 🏗️ 아키텍처

### 8개 Bounded Contexts

```
bounded-contexts/
├── auth/           # 인증
├── consume/        # 소비 (광고, 지역소비, 펀딩)
├── donation/       # 기부
├── economy/        # 경제 시스템 (PMP/PMC/MoneyWave)
├── forum/          # 커뮤니티
├── prediction/     # 예측 게임
├── ranking/        # 랭킹
└── user/           # 사용자 관리
```

### Clean Architecture 4계층

```
Domain → Application → Infrastructure → Presentation
```

---

## 📁 프로젝트 구조

```
posmul/
├── apps/posmul-web/src/
│   ├── app/                    # Next.js App Router
│   ├── bounded-contexts/       # DDD 도메인
│   └── shared/                 # 공용 코드
├── packages/auth-economy-sdk/  # 생태계 SDK
└── docs/                       # 문서
```

---

## 🛠️ 기술 스택

- **Frontend**: Next.js 15, React 19, TypeScript 5.4, Tailwind CSS
- **Backend**: Supabase (PostgreSQL 17.4.1), MCP
- **Package**: pnpm 10.12.4, Turborepo 2.0.4

---

## 📝 코딩 컨벤션

```
PascalCase: 컴포넌트, 클래스, 타입
camelCase: 함수, 변수
kebab-case: 폴더
UPPER_SNAKE_CASE: 상수
```

### Result 패턴

```typescript
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };
```

---

## 🚀 개발 명령어

```powershell
pnpm run dev          # 개발 실행
turbo build           # 빌드
pnpm generate-types   # DB 타입 생성
```

---

## 📋 워크플로우

- `posmul-feature.md`: PosMul 도메인별 개발
- `domain-add.md`: 새 Bounded Context 추가
- `ui-component.md`: UI 컴포넌트 개발

---

**버전**: 2.0 | **업데이트**: 2025-12-24
