# `@posmul/housing-pro` 전용 Agent 규칙

> 최초 전문직 버티컬 앱(`apps/housing-pro`, `pro.posmul.com`) 전용 규칙입니다. 상세 도메인/서비스 맥락은 [posmul-housing-pro SKILL](file:///c:/G/posmul/.agent/skills/posmul-housing-pro/SKILL.md) 및 [README.md](file:///c:/G/posmul/apps/housing-pro/README.md)를 참조합니다.

## 1. 아키텍처 (Tier 2 Clean Feature Slice + Strangler Fig)
- **3단 책임 분리**:
  1. **순수 도메인/계산 (`src/domain/`, `src/lib/` 순수 함수)**: 채점 로직, 회독 해금, 법정의무 룰 계산 등 외부 의존성 0.
  2. **서버 액션/API (`src/app/actions/`, `src/app/api/`)**: 서버 인증(`supabase.auth.getUser()`) + Zod 검증 + 원자적 DB RPC 호출.
  3. **UI (`src/components/`, `src/app/**/page.tsx`)**: **500줄 이하** 순수 UI (`supabaseAdmin` 직접 import 금지 — ESLint `error` 강제, 장식용 이모지 남발 금지 및 `lucide-react` 아이콘 사용).
- **Strangler Fig 원칙 (God File 확장 금지)**: `study/planner/page.tsx`, `actions/exam-study.actions.ts`, `lib/study-curriculum-store.ts` 등 기존 대형 파일에 새 기능을 직접 덧붙이지 말고, 독립 컴포넌트·액션·스토어 모듈로 분리 추출합니다.

## 2. 도메인 · 보안 · 경제 가드레일
- **스키마 격리**: 모든 테이블은 `vertical_housing` 스키마에만 생성 (`public` 스키마 금지).
- **경제 불변식**: 버티컬 학습/스캔/실무 보상은 **일일 최대 300 PMP** 상한을 원자 RPC(`grant_vertical_pmp_capped` / `economy.pmp_pmc_transactions`)로 통제하며, **`PMC` 직접 지급은 절대 금지**합니다.
- **인증 & IDOR 차단**: 모든 쓰기 Server Action은 `supabase.auth.getUser()` 세션을 필수로 요구하며, **`sessionUser?.id || params.userId` 폴백 절대 금지**.
- **유료 AI API 보호**: `/api/scan/vision`, `/api/books/parse-toc` 등 Gemini 호출 라우트는 서버 인증 + 입력 크기 제한 + Rate Limit을 필수로 유지합니다.
- **Pro View & 법령 면책**: 현직 관리소장 `Pro View` 모드에서는 `PMP`/`Prediction`/`Ranking` 게이미피케이션 UI를 기본 숨김 처리하고, 법령 스케줄러·AI 브리핑에는 원문 조항 링크 및 법적 책임 고지 문구를 필수 포함합니다.
- **환경 하드코딩 금지**: 프로덕션 링크에 `http://localhost:3000` 하드코딩 금지.

## 3. 검증 명령 (`c:\G\posmul` 루트 기준 PowerShell)
```powershell
pnpm -F @posmul/housing-pro type-check
pnpm -F @posmul/housing-pro lint
pnpm -F @posmul/housing-pro build
```
