# Housing-Pro (`@posmul/housing-pro`) — 에이전트 온보딩 & 아키텍처 가이드

> **문서 목적**: 이 문서는 PosMul 모노레포 내 최초의 전문직 버티컬 앱인 **`housing-pro`**의 서비스 철학, 듀얼 페르소나 구조, DB/인증/경제 연동, 콘텐츠 파이프라인, 개발·배포 규칙을 **다른 AI 에이전트 및 신규 개발자에게 빠르게 소개하기 위한 정본 가이드**입니다.  
> **기준일**: 2026-11-18  
> **라이브 URL**: `https://pro.posmul.com` (Vercel 프로젝트: `posmul-pro`) | **로컬 포트**: `3001`

---

## 1. 앱 정체성 및 PosMul 생태계 내 역할

**Housing-Pro**는 주택관리사 자격증 수험생의 **초고속 O2O·앱 올인원 학습**부터 합격 후 현직 아파트 관리소장의 **법정 의무·단지 실무 관리(`소장Pro`)**까지 전 생애주기를 아우르는 **PosMul 최초의 전문직 버티컬 코파일럿 앱**입니다.

### PosMul 코어(`posmul.com`)와의 관계 (v3.0 경제 원칙)
- **진성 유입 엔진**: 수험생·현직 소장의 학습/스캔/점검 활동으로 **`PMP`(무위험 참여 포인트)만 적립**됩니다.
- **`PMC` 직접 지급 금지**: `housing-pro` 내부에서는 어떠한 활동으로도 `PMC`를 직접 지급하지 않습니다. 사용자는 모은 `PMP`를 공유 경제 계좌(`economy.pmp_pmc_accounts`)를 통해 **`posmul.com`의 `Prediction` 마켓에 참여**해 `PMC`로 전환·기부합니다.
- **통합 SSO & 중앙 원장**: `@posmul/auth-economy-sdk` 및 `.posmul.com` 크로스 서브도메인 쿠키를 통해 `posmul.com`과 단일 계정·단일 `PMP`/`PMC` 잔액을 실시간 공유합니다.

---

## 2. 기술 스택 & 인프라

| 구분 | 구성 요소 | 비고 |
| :--- | :--- | :--- |
| **프레임워크** | Next.js `15.3.6` (App Router) + React `19.2.3` | `next.config.ts`에서 `@posmul/auth-economy-sdk` transpile |
| **언어 / 스타일** | TypeScript `5.9.3` (Strict) + Tailwind CSS `3.4.17` | `framer-motion`, `lucide-react`, `zod`, `date-fns` |
| **DB / Auth** | Supabase (`vertical_housing.*`, `economy.*`, `user.*`) | `@supabase/ssr` 기반 `.posmul.com` SSO 쿠키 동기화 |
| **AI 비전** | Google Gemini Vision API (`gemini-2.0-flash`) | `/api/scan/vision` (종이책 O/★/X 필기 마킹 판독) |
| **분석 / 관측** | `@vercel/analytics` + `@next/third-parties/google` (`GA4`) | 프로덕션 `NEXT_PUBLIC_GA_ID=G-3EPNW96R4Z` 연동 완료 |
| **PDF/스크립트** | `pdf-parse`, `tsx` | 기출 PDF 추출·선지 분해·69단원 태깅 파이프라인 |

---

## 3. 듀얼 페르소나 구조 (`MobileAppShell`)

[mobile-app-shell.tsx](file:///c:/G/posmul/apps/housing-pro/src/components/mobile/mobile-app-shell.tsx)가 **수험생 모드**와 **현직 소장 Pro 모드** 2개의 독립 5탭 바텀 네비게이션과 모바일(`440px`)/와이드(`max-w-6xl`) 뷰 전환을 제공합니다.

### 3.1 수험생 앱 모드 (`/` · `/study/*` · `/scan`)
「공동주택관리법 시행령」 `[별표 7]`을 문항 빈도 기준으로 균형 분할한 **5과목 · 69개 세부 목차 및 1,400+ 기출문항**을 중심으로 동작합니다.

| 경로 | 기능 설명 | 핵심 컴포넌트 / 파일 |
| :--- | :--- | :--- |
| **`/`** | **열공 타이머 & 홈**: 과목/69단원별 집중 타이머(`YptFocusOverlay`), 스터디 그룹(`YptGroupGrid`), 스터디콘 store, 맥락형 예측 위젯 | [page.tsx](file:///c:/G/posmul/apps/housing-pro/src/app/page.tsx) |
| **`/study/planner`** | **69단원 회독 매트릭스 플래너**: 단원별 진도·투두·시험 D-Day 관리 (`study-curriculum-store.ts`) | [study/planner/page.tsx](file:///c:/G/posmul/apps/housing-pro/src/app/study/planner/page.tsx) |
| **`/study/solve`** | **20제 실전 문제풀이**: 5지선다 문제/지문(O/★/X) 체크 시트, `<보기>` 항목별 O/X 조합 선지 역산, 주관식 ㄱ·ㄴ·ㄷ 다중 빈칸 채점, 1문제 즉시 DB 저장 | [study/solve/page.tsx](file:///c:/G/posmul/apps/housing-pro/src/app/study/solve/page.tsx), [subjective-answer.ts](file:///c:/G/posmul/apps/housing-pro/src/lib/subjective-answer.ts) |
| **`/study/ox`** | **스와이프 O/X 망각곡선 카드**: 사용자가 표시한 `★`(긴가민가)/`X`(모름) 선지만 1문장 카드로 추출해 3회 연속 정답 시 `O`로 승격, 선지별 이론 Bottom Sheet 점프 지원 | [study/ox/page.tsx](file:///c:/G/posmul/apps/housing-pro/src/app/study/ox/page.tsx) |
| **`/study/stats`** | **합격 분석 대시보드**: 69개 목차별 출제 빈도, 학습 진도율, 예상 합격률 통계 | [study/stats/page.tsx](file:///c:/G/posmul/apps/housing-pro/src/app/study/stats/page.tsx) |
| **`/study/books`** | **교재 & 시리얼 등록**: POD 종이책 정품 시리얼(`book_serials`) 인증 및 이론 열람 | [study/books/page.tsx](file:///c:/G/posmul/apps/housing-pro/src/app/study/books/page.tsx) |
| **`/scan`** | **종이책 AI 비전 스캔 (O2O)**: 촬영된 시험지/문제집 이미지에서 문항 번호·선택 답안·선지별 `O`/`★`/`X` 마킹을 판독하고 '위장 정답'(맞혔지만 ★/X가 섞인 문항)까지 검출 | [scan/page.tsx](file:///c:/G/posmul/apps/housing-pro/src/app/scan/page.tsx), [api/scan/vision/route.ts](file:///c:/G/posmul/apps/housing-pro/src/app/api/scan/vision/route.ts) |
| **`/study/more`** | 학습 허브 더보기 (스캔·O/X·20제·스터디콘·계정 메뉴 진입) | [study/more/page.tsx](file:///c:/G/posmul/apps/housing-pro/src/app/study/more/page.tsx) |

### 3.2 현직 소장 Pro 모드 (`/pro/*`)
합격 후 관리사무소장으로 부임한 유저가 이탈하지 않도록 실무 워크스페이스를 제공합니다.

| 경로 | 기능 설명 | 핵심 컴포넌트 / 파일 |
| :--- | :--- | :--- |
| **`/pro`** | **단지 실무 코파일럿 홈**: 우리 단지 프로필, 과태료 무사고 현황, 임박한 법정의무 D-Day, `PMP`/`PMC` 잔액 헤더 | [pro/page.tsx](file:///c:/G/posmul/apps/housing-pro/src/app/pro/page.tsx) |
| **`/pro/legal`** | **과태료 방어 법정의무 스케줄러**: 안전·선거·회계·장기수선 연간 의무 D-Day 매트릭스 및 증빙 체크 | [pro/legal/page.tsx](file:///c:/G/posmul/apps/housing-pro/src/app/pro/legal/page.tsx) |
| **`/pro/docs`** | **AI 법령·개정 브리핑**: 현행법 개정 사항 및 실무 문서 AI 요약 뷰어 | [pro/docs/page.tsx](file:///c:/G/posmul/apps/housing-pro/src/app/pro/docs/page.tsx) |
| **`/pro/predict`** | **단지/주택 예측 위젯**: 주택 정책·관리 실무 관련 PosMul 예측 마켓 연계 | [pro/predict/page.tsx](file:///c:/G/posmul/apps/housing-pro/src/app/pro/predict/page.tsx) |
| **`/pro/community`** | **소장 실무 커뮤니티**: 현직 관리소장 간 실무 Q&A 및 여론 투표 | [pro/community/page.tsx](file:///c:/G/posmul/apps/housing-pro/src/app/pro/community/page.tsx) |

---

## 4. 인증(SSO), 경제 연동 & DB 스키마

### 4.1 크로스 서브도메인 SSO 및 자동 프로비저닝
- **SSO 쿠키**: [middleware.ts](file:///c:/G/posmul/apps/housing-pro/src/middleware.ts)와 [sso-cookie.ts](file:///c:/G/posmul/apps/housing-pro/src/lib/supabase/sso-cookie.ts)가 `*.posmul.com` 요청 시 쿠키 도메인을 `.posmul.com`으로 설정해 `posmul.com`과 세션을 공유합니다.
- **인증 라우트**: `/auth/login`, `/auth/signup`, `/auth/callback`, `/api/auth/google/login` (서버 PKCE Google OAuth).
- **자동 계정 링크 ([auth-provision.ts](file:///c:/G/posmul/apps/housing-pro/src/lib/auth-provision.ts))**: 로그인 시 `ensurePosmulUserLinked()`가 다음 3개 테이블 레코드를 자동 보장합니다.
  1. `user.profiles`
  2. `economy.pmp_pmc_accounts` (초기 `WELCOME_BONUS_PMP = 10000`, `pmc_balance = 0`)
  3. `vertical_housing.study_user_profiles` (`active_track = 'app_only_69'`)
- **게스트 학습 이관**: 비로그인 상태에서 `guestClientKey`로 푼 기록은 로그인 후 `claimGuestStudyRecordsAction()`으로 본인 계정에 병합됩니다.

### 4.2 `PMP` 적립 규칙 ([study-economy.actions.ts](file:///c:/G/posmul/apps/housing-pro/src/app/actions/study-economy.actions.ts))
모든 적립은 `economy.pmp_pmc_accounts`의 `pmp_balance`에 반영됩니다.
- **앱 내 학습 (`grantAppStudyPmpAction`)**: `OX` (`+10 PMP`), `SOLVE` (`+5 PMP`), `FOCUS` (`+10 PMP`)
- **종이책 AI 비전 스캔 (`recordAiScanAndRewardPmp`)**: 회당 `+40 PMP`, 일일 최대 `5회` (`uq_user_daily_page_scan` 제약으로 동일 페이지 당일 중복 방어)
- **망각곡선 O/X 승격 (`recordOxMasteryAndRewardPmp`)**: `+10 PMP`

### 4.3 DB 스키마 (`vertical_housing.*`)
원천 마이그레이션: [20261113_create_vertical_housing_schema.sql](file:///c:/G/posmul/supabase/migrations/20261113_create_vertical_housing_schema.sql)
- `exam_questions` / `exam_options`: 기출 문항 및 1~5번 선지 단위 분해(난이도 `mastery_tier` 1~5, 함정 교정 `trap_summary`, 근거 조문)
- `option_mastery`: 유저별 선지 숙련도(`O` / `STAR` / `X`), 연속 정답 `streak_count`, 복습 예정일 `next_review_at`
- `book_serials` / `ai_scan_logs`: POD 종이책 정품 시리얼 및 AI 비전 스캔 로그
- `legal_obligations`: 과태료 방어 법정의무 스케줄 룰 (`SAFETY`, `ELECTION`, `FINANCE`, `REPAIR`)
- `study_cones` / `study_user_profiles`: 집중 타이머 캐릭터(`FIRE_OWL`, `BLUE_DRAGON` 등) 및 학습 프로필

---

## 5. 디렉토리 구조 & 콘텐츠 파이프라인

```text
apps/housing-pro/
├── content/theory/
│   ├── 04-law/          # 2차 관계법규 이론 Markdown (16개 단원)
│   └── 05-practice/     # 2차 관리실무 이론 Markdown (14개 단원)
├── scripts/             # 기출 PDF 추출·OCR·선지 분해·69단원 태깅·클러스터링·DB 적재
│   ├── extract-exam-text.ts / ocr-2025-2nd-exam.ts
│   ├── parse-exam-to-options.ts / build-ox-dataset.ts
│   ├── classify-49-curriculum.ts / cluster-exam-options.ts
│   └── ingest-official-exams.ts / sync-theory-md.ts
└── src/
    ├── app/
    │   ├── actions/     # Server Actions (exam-study, study-economy, auth-profile, serial, study-cone, prediction-widget)
    │   ├── api/         # /api/scan/vision, /api/auth/google/login
    │   ├── auth/        # login, signup, callback
    │   ├── pro/         # 소장Pro 듀얼 5탭 (/, legal, docs, predict, community)
    │   ├── scan/        # AI 비전 스캔 UI
    │   └── study/       # 수험생 학습 (planner, solve, ox, stats, books, more)
    ├── components/      # mobile/, auth/, prediction/, pro-view/, study/
    ├── data/            # 69단원 목차·기출·이론·법정의무 데이터 모듈
    └── lib/             # auth-provision, sso-cookie, curriculum/pro stores, subjective-answer
```

---

## 6. 다른 에이전트를 위한 개발·배포 필수 규칙

1. **브랜치 규칙**: 반드시 `develop` 브랜치에서 작업 (`main` 직접 커밋·작업 금지).
2. **DB 작업 규칙**: Supabase CLI(`db push` 등) 사용 금지 — DB 스키마/데이터 변경은 **Supabase MCP 도구만** 사용.
3. **타입 안전성**: TypeScript Strict 준수 (`any` 사용 금지).
4. **로컬 실행 및 검증 명령어** (`c:\G\posmul` 루트 기준 PowerShell):
   ```powershell
   # 로컬 개발 서버 (http://localhost:3001)
   pnpm --filter @posmul/housing-pro dev

   # 프로덕션 빌드 검증
   pnpm --filter @posmul/housing-pro build

   # Gate 1~2: 빌드 + develop 커밋·푸시 (변경 파일 명시)
   powershell -ExecutionPolicy Bypass -File scripts/ship.ps1 -App pro -Message "feat(housing-pro): 작업 요약" -Files "수정한파일경로"

   # Gate 3: 프로덕션 배포까지 필요할 때만 -Deploy 추가
   powershell -ExecutionPolicy Bypass -File scripts/ship.ps1 -App pro -Message "feat(housing-pro): 작업 요약" -Files "수정한파일경로" -Deploy
   ```
