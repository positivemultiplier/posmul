# 🛠️ PosMul v2.0 개발자 인수인계 및 온보딩 마스터북 (Developer Handover Guide)

> **본 문서는 PosMul v2.0 프로젝트를 이어받는 개발자(또는 AI 에이전트)가 단 30분 만에 전체 아키텍처, 도메인 코드 구조, 디자인 시스템, DB 연동 규칙, 그리고 프로덕션 배포 파이프라인(`posmul.com`)까지 완벽히 파악하고 즉시 개발에 투입될 수 있도록 작성된 공식 인수인계서입니다.**
>
> 📅 **기준 버전**: PosMul Version 2.0 (2026. 11)  
> 🌐 **프로덕션 도메인**: [https://posmul.com](https://posmul.com)  
> 📦 **원격 저장소**: `https://github.com/positivemultiplier/posmul.git` (기본 작업 브랜치: `develop`)
>
> ⚠️ **v3.0 경제·도메인 규칙 동기화 (2026-11-12)**: 최신 기획 정본([POSMUL_WHITEPAPER.md](file:///c:/G/posmul/docs/POSMUL_WHITEPAPER.md))에 따라 ① 가입/포럼/소비에서 `PMC` 직접 지급 중단(`WELCOME_BONUS_PMC = 0`, `consume/money`·`consume/cloud` POST 비활성화), ② `PMC`는 `Prediction` 정산으로만 획득, ③ `EAT` 기반 MoneyWave, ④ `Donation`은 Phase 1(`기관`·`K-물품`) 우선 오픈 규칙이 적용됩니다. 세부 코어 갭은 [DOMAIN_FLOW_AND_DECISIONS.md](file:///c:/G/posmul/docs/DOMAIN_FLOW_AND_DECISIONS.md)를 참고하세요.

---

## 1. 기술 스택 및 환경 요약 (Tech Stack)

| 영역 | 기술 / 도구 | 버전 및 세부 사항 |
| :--- | :--- | :--- |
| **Monorepo** | `pnpm` + `Turborepo` | `pnpm@10.12.4`, `turbo@2.0.4` |
| **Framework** | `Next.js` (App Router) | `15.5.x` (`apps/posmul-web`), Server Components & Server Actions 중심 |
| **UI / Styling** | `React 19` + `Tailwind CSS` | `lucide-react`, `framer-motion`, 도메인별 Tone-on-Tone 다크 글래스모피즘 |
| **Language** | `TypeScript` | `5.4.5` (`strict: true`, **`any` 타입 사용 절대 금지**) |
| **Database & Auth** | `Supabase` (PostgreSQL 17) | Project ID: `fabyagohqqnusmnwekuc` (`ap-northeast-2` 서울 리전), **Schema-per-Context** |
| **Shared SDK** | `@posmul/auth-economy-sdk` | `packages/auth-economy-sdk` (인증 및 PMP/PMC 경제 타입·유틸리티 공유) |
| **CI/CD & Hosting** | `GitHub Actions` + `Vercel` | `.github/workflows/ci.yml` + Vercel CLI (`npx vercel --prod --yes`) |

---

## 2. 10분 빠른 시작 (Quick Start)

### 2.1 필수 사전 조건
- **Node.js**: `v20.x` 이상
- **Package Manager**: `pnpm` (`npm install -g pnpm@10.12.4`)
- **OS / Shell**: Windows 환경 시 **PowerShell** 기준 명령어 사용

### 2.2 로컬 실행 및 빌드 명령어
```powershell
# 1. 저장소 루트 이동 및 브랜치 확인 (항상 develop 브랜치에서 작업)
Set-Location -Path c:\G\posmul
git checkout develop
git pull origin develop

# 2. 의존성 설치
pnpm install

# 3. 웹 애플리케이션 로컬 개발 서버 실행 (http://localhost:3000)
pnpm dev:web

# 4. TypeScript 정적 타입 검사
pnpm --filter posmul-web type-check

# 5. Next.js 프로덕션 빌드 검증 (배포 전 필수!)
pnpm --filter posmul-web build
```

### 2.3 필수 환경 변수 (`apps/posmul-web/.env.local`)
```env
NEXT_PUBLIC_SUPABASE_URL=https://fabyagohqqnusmnwekuc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<Supabase Anon Key>
SUPABASE_SERVICE_ROLE_KEY=<Supabase Service Role Key>
# 외부 데이터 및 AI 연동 키 (선택/크론용)
GEMINI_API_KEY=<Google Gemini API Key>
ALPHA_VANTAGE_API_KEY=<Alpha Vantage API Key>
DART_API_KEY=<Open DART API Key>
```

---

## 3. 모노레포 및 아키텍처 구조 (DDD + Clean Architecture)

PosMul v2.0은 **Domain-Driven Design (DDD)**과 **Clean Architecture**를 엄격히 결합한 구조를 따릅니다.

```
posmul/
├── .agent/
│   └── rules/
│       ├── Posmul_projectrule.md     # 프로젝트 절대 아키텍처 규칙
│       ├── Posmul_tdd-rules.md       # TDD 및 테스트 규칙
│       └── delivery-pipeline.md      # [필독] 빌드 ➔ 커밋 ➔ Vercel 배포 3단계 필수 게이트
├── apps/
│   └── posmul-web/                   # 메인 Next.js 15 웹 애플리케이션
│       └── src/
│           ├── app/                  # Next.js App Router (라우팅 및 Server Component 진입점)
│           ├── bounded-contexts/     # 9개 독립 비즈니스 도메인 (DDD 계층 격리)
│           ├── shared/               # 전역 UI 프리미티브, 레이아웃 헤더, 디자인 토큰
│           └── lib/                  # Supabase 클라이언트(server/client) 등 코어 유틸
├── packages/
│   └── auth-economy-sdk/             # 인증·경제 공통 SDK 패키지
├── supabase/
│   ├── migrations/                   # DB 마이그레이션 SQL 이력
│   └── functions/                    # Supabase Edge Functions (auto-settle, moneywave 등)
└── docs/
    └── v2/                           # PosMul v2.0 공식 문서 스위트 (현재 폴더)
```

### 3.1 9개 Bounded Contexts (`src/bounded-contexts/`)
각 도메인 폴더는 내부적으로 4개 계층으로 분리되며, **의존성은 반드시 안쪽(`Domain`)을 향해야 합니다**:
```
bounded-contexts/{domain}/
├── domain/          # Entities, Value Objects, Repository 인터페이스의 정의 (외부 의존성 0%)
├── application/     # Use Cases, Application Services, DTO 변환 (Domain만 참조 가능)
├── infrastructure/  # Supabase Repository 구현체, 외부 API 어댑터
└── presentation/    # 도메인 특화 UI 컴포넌트, 클라이언트 훅 (Local-First UI 원칙)
```

9개 도메인 목록:
1. `auth` (인증·세션)
2. `economy` (PMP/PMC 원장, MoneyWave 1·2·3 엔진)
3. `prediction` (집단지성 예측 게임, 상금풀 계산, 카드 컴포넌트)
4. `donation` (K-물품 직접기부, 위시리스트, NGO 에스크로, 의인 포상)
5. `consume` (TimeConsume, MoneyConsume, CloudConsume)
6. `forum` (뉴스 학습, 예산 감시, 아고라 토론)
7. `ranking` (도메인별·지역별 시민 랭킹)
8. `feed` (AI 뉴스 수집 및 피드 생성)
9. `demographic-data` (KOSIS 인구·지역 통계 연동)

---

## 4. PosMul v2.0 UI/UX 디자인 시스템 & 3단 네비게이션 표준

PosMul v2.0에서 가장 중요한 프론트엔드 아키텍처는 **전역 3단 네비게이션(`ThreeRowNavbar`)과 페이지 본문 레이아웃의 완벽한 통일**입니다.

### 4.1 전역 3단 네비게이션 (`src/shared/ui/components/layout/ThreeRowNavbar.tsx`)
모든 페이지는 상단 고정 헤더(`142px` 높이)를 통해 3단계로 탐색됩니다:
- **Row 1 (60px)**: 브랜드 로고 + **시민 선순환 5대 도메인(`포럼 ➔ 소비 ➔ 예측 ➔ 기부 ➔ 랭킹 | 기타`)** + 실시간 `PMP/PMC` 잔고 위젯(`CompactBalanceWidget`) 및 로그인/대시보드.
- **Row 2 (44px)**: 현재 선택된 도메인의 `STEP 배지`(예: `STEP 3 · 학습`) + **중분류 카테고리 탭** + 도메인 철학 슬로건.
- **Row 3 (38px)**: 현재 선택된 중분류의 **소분류 서브카테고리 탭(또는 필터)** + 마이크로 가이드 문구.

> ⚠️ **핵심 주의사항 (네비게이션 중복 금지 원칙)**:
> 상단 `ThreeRowNavbar`의 Row 2(중분류)와 Row 3(소분류)가 이미 모든 화면 상단에 고정되어 있으므로, **페이지 본문 안에 동일한 카테고리/서브카테고리 이동 탭을 또 중복해서 렌더링하지 마십시오.**

### 4.2 도메인 Tone-on-Tone 컬러 토큰 (`src/shared/ui/tokens/domain-tones.ts`)
각 도메인은 시민 선순환 단계에 맞춘 고유 컬러 톤을 가집니다:
- `forum` (STEP 1 · 공론): **Emerald / Teal** (`+PMP · PMG`)
- `consume` (STEP 2 · 참여): **Indigo / Violet** (`+PMP · +PMC`)
- `prediction` (STEP 3 · 학습): **Sky / Blue** (`PMP ➔ PMC`)
- `donation` (STEP 4 · 집행): **Purple / Fuchsia** (`PMC 직접집행`)
- `ranking` (STEP 5 · 명예): **Amber / Gold** (`풀뿌리 위상`)
- `other` (인프라): **Slate / Cyan** (`투명 회계`)

### 4.3 모든 도메인 페이지의 표준 레이아웃 템플릿
새로운 페이지를 만들거나 수정할 때는 반드시 아래 표준 구조를 준수하여 화면 전환 시 이질감이 없도록 합니다:
```tsx
<div className="min-h-screen bg-[#090b12] text-slate-100">
  <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
    <FadeIn>
      {/* 1. 도메인 컨텍스트 헤더 (타이틀, 설명, 우측 상금풀/카운트 메트릭, 하단 공인 검증 데이터 배지) */}
      <DomainContextHeader
        domain="prediction"
        title="📈 경제 예측 마켓"
        subtitle="주식, 기업 실적, 거시경제 지표, 암호화폐 흐름을 예측하고 PMC를 획득하세요"
        metrics={[
          { label: "상금풀", value: poolAmount, unit: "PMC" },
          { label: "진행 중 게임", value: games.length, unit: "개" },
        ]}
      >
        {/* 공인 검증 데이터 소스 배지 등 메타 정보 */}
      </DomainContextHeader>

      {/* 2. 실시간 머니웨이브 위젯 (예측 도메인 공통) */}
      <div className="mb-6">
        <CompactMoneyWaveCard depthLevel={2} category="economy" initialPool={poolAmount} />
      </div>

      {/* 3. 정렬 툴바 + 카드 그리드 */}
      <ClientPredictionGamesGrid
        games={mappedGames}
        userId={user?.id}
        userPredictions={userPredictions}
        basePath="/prediction/economy"
        showCategoryFilter={false}
        showSortToolbar={true}
      />
    </FadeIn>
  </div>
</div>
```

---

## 5. 주요 도메인별 핵심 파일 및 라우팅 가이드

### 5.1 Prediction 도메인 (`src/app/prediction/`) — *v2.0 통합 완료*
- **전체 마켓 홈**: `src/app/prediction/page.tsx` (`?filter=hot|high-pool|closing` 쿼리 지원)
- **중분류(2row) & 소분류(3row) 라우트**:
  - 경제: `economy/page.tsx` & `economy/[subcategory]/page.tsx` (`stocks`, `earnings`, `indicators`, `crypto`)
  - 소비예측: `consume/page.tsx` & `consume/[subcategory]/page.tsx` (`time`, `money`, `cloud`)
  - 스포츠: `sports/page.tsx` & `sports/[subcategory]/page.tsx` (`soccer`, `baseball`, `basketball`, `esports`, `other`) & `sports/soccer/page.tsx`
  - 엔터테인먼트: `entertainment/page.tsx` & `entertainment/[subcategory]/page.tsx` (`movies`/`movie`, `dramas`/`drama`, `variety`, `music`, `awards` — DB 단·복수 양방향 호환)
  - 정치/선거: `politics/page.tsx` & `politics/[subcategory]/page.tsx` (`national-elections`, `local-elections`, `policy-changes`)
  - 시민 제안: `user-suggestions/page.tsx` & `user-suggestions/[subcategory]/page.tsx` (`user-proposals`, `ai-recommendations`, `opinion-leader-suggestions`)
- **예측 게임 상세 페이지**: `src/app/prediction/[slug]/page.tsx` & `client.tsx` (PMP 베팅 슬라이더, AI 브리핑 탭, 실시간 댓글)
- **핵심 서비스 & 매퍼**:
  - `src/bounded-contexts/prediction/application/prediction-pool.service.ts`: `getAggregatedPrizePool` (카테고리/서브카테고리별 실시간 상금풀 계산)
  - `src/app/prediction/components/prediction-game-mapper.ts`: DB row를 카드 뷰 모델로 변환 및 `attachHourlyGamePoolsToRows` 매핑
  - `src/app/prediction/components/ClientPredictionGamesGrid.tsx`: 클라이언트 정렬(`최신순`, `인기순 🔥`, `상금순 💰`, `마감임박 ⏰`) 및 `✨ AI 수집 & 생성` 버튼(`/api/cron/feed-ingest` 트리거)

### 5.2 Donation 도메인 (`src/app/donation/`) — *v2.0 K-물품 & 위시리스트 구축 완료*
- **기부 메인 허브**: `src/app/donation/page.tsx` (3대 기부 필러 쇼케이스, 실시간 기부 피드, 대표 K-물품 프로젝트)
- **K-물품 직접기부 허브**: `src/app/donation/direct/page.tsx`
- **물품 상세 및 수혜기관 선택 펀딩**: `src/app/donation/direct/item/[id]/page.tsx` & `client.tsx` (희망 복지시설 라디오 선택, 인라인 상세 사연/인가증 아코디언, 소액 PMC 펀딩 모달)
- **복지시설 K-위시리스트 포털**: `src/app/donation/direct/wishlist/page.tsx` & `actions.ts` (6대 지원 가능 K-물품 카탈로그, 카테고리/정렬 필터, 복지시설 물품 신청 모달, 관리자 검증 승인 게이트)

### 5.3 Forum / Consume / Ranking / Admin
- **포럼**: `src/app/forum/page.tsx`, `news/`, `budget/`, `agora/` (갤러리형 이슈 리스트 및 댓글 보상)
- **소비**: `src/app/consume/page.tsx`, `major-league/`, `minor-league/`, `cloud-funding/`
- **랭킹**: `src/app/ranking/page.tsx` (`?category=expect|overall|forum|consume|donation` & `?sido=...` 필터)
- **관리자 백오피스**: `src/app/admin/page.tsx`, `admin/prediction/`, `admin/feed/`, `admin/economy/`, `admin/forum/`

---

## 6. 🔒 엔지니어링 절대 규칙 및 배포 파이프라인 (`Definition of Done`)

PosMul v2.0에서는 작업 누락이나 배포 미반영을 막기 위해 **[`.agent/rules/delivery-pipeline.md`](../../.agent/rules/delivery-pipeline.md)**를 절대 규칙으로 강제합니다.

### ⚠️ 주의해야 할 코딩 함정 (Gotchas)
1. **Next.js 15 `page.tsx` Named Export 금지**:
   - App Router의 `page.tsx` 파일에서는 `default export`, `revalidate`, `dynamic`, `metadata`, `generateStaticParams` 외에 임의의 상수나 타입을 `export const ...`로 내보내면 Next.js 빌드 타임 유효성 검사기(`checkFields`)에서 타입 에러가 발생합니다. 설정 상수는 파일 내부 변수(`const`)로 선언하거나 별도 파일로 분리하십시오.
2. **라우트 폴더 삭제/이동 시 `.next` 캐시 정리**:
   - 정적 라우트 폴더를 동적 라우트(`[subcategory]`)로 통합하거나 삭제한 경우, `.next/types/validator.ts`에 이전 경로 캐시가 남아 `tsc --noEmit`이 실패할 수 있습니다. 이때는 `Remove-Item -Path .\apps\posmul-web\.next -Recurse -Force`로 캐시를 비운 뒤 빌드하십시오.
3. **Supabase CLI 사용 금지**:
   - DB 스키마 조회 및 마이그레이션, 데이터 보정은 로컬 Supabase CLI(`supabase db push` 등)를 쓰지 않고 **Supabase MCP 도구(`execute_sql`, `apply_migration`, Project ID: `fabyagohqqnusmnwekuc`)**를 통해 안전하게 수행합니다.

### 🚀 작업 완료 3단계 필수 게이트 (모든 코드 수정 후 필수 실행)

```powershell
# [Gate 1] 프로덕션 빌드 완전 검증 (101개 전체 라우트 컴파일 및 타입 체크)
Set-Location -Path c:\G\posmul
pnpm --filter posmul-web build

# [Gate 2] Git 브랜치(develop) 확인 및 Conventional Commits 커밋
git status --short
git add <변경된_파일_경로>
git commit -m "feat(도메인): 변경 내용 명확히 요약"

# [Gate 3] 원격 저장소 푸시 및 Vercel 프로덕션(posmul.com) 즉시 배포
git push origin develop
npx vercel --prod --yes

# [검증] 라이브 도메인 200 OK 응답 확인
(Invoke-WebRequest -Uri "https://posmul.com" -UseBasicParsing).StatusCode
```
> **원칙**: 위 3단계 게이트를 모두 통과하고 `https://posmul.com` 라이브 반영이 확인되기 전에는 절대 작업을 종료하지 않습니다.

