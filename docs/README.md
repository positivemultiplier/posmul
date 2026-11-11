# 📚 PosMul 프로젝트 공식 문서 허브 (Master Index — Version 2.0)

> **AI 시대 직접민주주의 & 소셜 임팩트 생태계 ([https://posmul.com](https://posmul.com))**  
> 무위험 시민 참여(PMP)로 사회·경제 의제를 학습·예측하고, 적중 보상으로 획득한 공익 가치(PMC)를 시민이 직접 복지 현장과 지역 경제에 집행하는 플랫폼

---

## 🚀 0. PosMul Version 2.0 핵심 문서 스위트 (`v2/`) — **[필독 / 최우선]**

> **오늘(Version 2.0)부터 프로젝트를 파악하거나 외부에 소개할 때, 그리고 다음 개발자가 업무를 인수인계받을 때는 반드시 아래 4대 마스터 문서를 기준으로 진행합니다.**

| 순서 | 문서명 | 대상 독자 | 핵심 내용 |
| :---: | :--- | :--- | :--- |
| **01** | [**01_EXTERNAL_OVERVIEW_V2.md**](./v2/01_EXTERNAL_OVERVIEW_V2.md) | **외부 소개 / 투자자 / 파트너사 / 기관** | PosMul v2.0 비전, 5단계 시민 선순환 플라이휠, 듀얼 토큰(`PMP`/`PMC`), 노벨경제학상 이론 기반, K-물품 승수 기부 모델 & 수익 구조 |
| **02** | [**02_DEVELOPER_HANDOVER_V2.md**](./v2/02_DEVELOPER_HANDOVER_V2.md) | **다음 개발자 / 엔지니어 / AI 에이전트** | 10분 빠른 시작, 모노레포 & DDD 9개 도메인 구조, 3Row 네비게이션 & Tone-on-Tone 디자인 표준, 도메인별 핵심 코드 위치, **3단계 배포 검증 게이트(`Definition of Done`)** |
| **03** | [**03_DATABASE_AND_API_SPEC_V2.md**](./v2/03_DATABASE_AND_API_SPEC_V2.md) | **백엔드 / 데이터 / 풀스택 개발자** | Supabase `Schema-per-Context` 멀티 스키마(`economy`, `prediction`, `donation` 등) 실테이블 명세, AI 뉴스 수집 및 자동 정산 Cron API 파이프라인 |
| **04** | [**04_V2_ROADMAP_AND_BACKLOG.md**](./v2/04_V2_ROADMAP_AND_BACKLOG.md) | **PM / 리드 개발자 / 차기 담당자** | 프로덕션(`posmul.com`) 도메인별 완성도 감사(Audit), v2.0 완료 마일스톤, 차기 개발 우선순위 백로그(`P0 ~ P3`) |

---

## 🧭 1. 초기 입문 및 철학 배경 (`Root` & `init/` & `concepts/`)

| 문서 | 설명 |
|------|------|
| [POSMUL_WHITEPAPER.md](./POSMUL_WHITEPAPER.md) | PosMul 플랫폼 백서 및 경제/민주주의 철학 원전 |
| [COLLABORATION_GUIDE.md](./COLLABORATION_GUIDE.md) | 팀 협업 가이드 |
| [GIT_STRATEGY.md](./GIT_STRATEGY.md) | Git 브랜치 및 커밋 전략 |
| [init/](./init/) | 초기 기획서, 직접민주주의 이론, PMP(무위험) vs PMC(위험) 설계 배경 |
| [concepts/](./concepts/) | 경제 순환 모델(`posmul_economic_cycle.md`) 및 정제된 경제 구조 |

---

## 🏗️ 2. 세부 아키텍처 및 개발 가이드 (`architecture/` & `dev_guide/` & `research/` & `review/`)

| 문서 | 설명 |
|------|------|
| [review/DONATION_SYSTEM_AUDIT_AND_NEXT_STEPS.md](./review/DONATION_SYSTEM_AUDIT_AND_NEXT_STEPS.md) | 기부 도메인(K-물품 & 위시리스트) 완성 현황 감사 및 갭 분석 |
| [research/PREDICTION_SYSTEM_APIS_AND_GAME_TAXONOMY.md](./research/PREDICTION_SYSTEM_APIS_AND_GAME_TAXONOMY.md) | 예측 도메인 외부 공인 검증 API 및 게임 분류 체계 연구 |
| [guides/PREDICTION_GAME_API_MAPPING_SPEC.md](./guides/PREDICTION_GAME_API_MAPPING_SPEC.md) | 예측 게임과 외부 검증 API 간 매핑 명세 |
| [architecture/DOMAIN_ARCHITECTURE_DETAIL.md](./architecture/DOMAIN_ARCHITECTURE_DETAIL.md) | 도메인별 상세 아키텍처 설계 |
| [dev_guide/DDD_ARCHITECTURE_GUIDE.md](./dev_guide/DDD_ARCHITECTURE_GUIDE.md) | DDD + Clean Architecture 레이어 규칙 |
| [dev_guide/DATABASE_SCHEMA_DDD.md](./dev_guide/DATABASE_SCHEMA_DDD.md) | Schema-per-Context 데이터베이스 스키마 가이드 |
| [dev_guide/SDK_ARCHITECTURE_ANALYSIS.md](./dev_guide/SDK_ARCHITECTURE_ANALYSIS.md) | `@posmul/auth-economy-sdk` 통합 구조 |

---

## 💼 3. 비즈니스 및 UI/UX (`business/` & `ui-ux/`)

| 폴더 | 설명 |
|------|------|
| [business/](./business/) | 플랫폼 개요(`PLATFORM_OVERVIEW.md`), 경제 시스템 상세(`ECONOMY_SYSTEM_DETAIL.md`), 기부 v2 기획(`DONATION_SYSTEM_v2.md`) |
| [ui-ux/](./ui-ux/) | 도메인별(`prediction`, `economy`, `donation`, `consume`, `forum`, `ranking`, `auth`) UI/UX 명세 및 컴포넌트 카탈로그 |

---

## 📖 4. Diataxis 기술 문서 (`tutorials/`, `guides/`, `reference/`, `explanation/`)

- **[tutorials/](./tutorials/)**: 신규 개발자 온보딩 튜토리얼
- **[guides/](./guides/)**: 엔티티 추가 방법, 프론트엔드 개발 가이드, MoneyWave 로직 활성화 가이드
- **[reference/](./reference/)**: API 문서, MCP 도구 레퍼런스, 프론트엔드 컴포넌트 가이드
- **[explanation/](./explanation/)**: MoneyWave 1·2·3 원리, Next.js Server Actions, 아키텍처 철학, [경제적 논거 백서(사회선택·베이지안·행동학습)](./explanation/ECONOMIC_RATIONALE_SOCIAL_CHOICE_AND_BAYESIAN_LEARNING.md)

---

## 🗄️ 5. 아카이브 (`archive/`)

- **[archive/](./archive/)**: 2025~2026년 초기 마이그레이션 계획서, 완료된 태스크, 시점별 분석 리포트 보관소
