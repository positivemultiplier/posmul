# PosMul: AI-Era Direct Democracy Platform

**PosMul**은 예측 게임과 지역 경제 연동을 통해 시민이 직접 참여하는 새로운 민주주의 경험을 제공하는 AI 시대 직접민주주의 플랫폼입니다. Next.js 15, Domain-Driven Design (DDD), Clean Architecture를 기반으로 구축되었습니다.

## 🎯 프로젝트 개요

- **플랫폼**: Next.js 15 App Router 기반 예측 게임 및 소셜 플랫폼
- **경제 시스템**: PMP/PMC 토큰 기반 Agency Theory 구현
- **아키텍처**: DDD + Clean Architecture + SOLID 원칙
- **백엔드**: Supabase (MCP를 통한 통합)
- **모노레포**: pnpm Workspaces + Turborepo
- **개발 환경**: Windows PowerShell 최적화

## 🚀 시작하기

본 프로젝트는 pnpm을 패키지 매니저로 사용하는 모노레포 환경입니다.

### 1. 의존성 설치

```powershell
# 프로젝트 루트 디렉토리에서 실행
pnpm install
```

### 2. 웹 개발 서버 실행

`posmul-web` 애플리케이션의 개발 서버를 실행합니다.

```powershell
pnpm --filter posmul-web dev
```

### 3. 테스트 실행

```powershell
# 전체 테스트 실행
pnpm test

# 특정 패키지 테스트 실행
pnpm --filter @posmul/shared-types test

# 테스트 커버리지 확인
pnpm test:coverage
```

### 4. 빌드

전체 프로젝트를 빌드합니다.

```powershell
pnpm build
```

## 🏗️ 아키텍처와 기술 스택

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **통합 프로토콜**: MCP (Model Context Protocol)
- **모노레포 도구**: pnpm, Turborepo
- **테스트**: Jest, React Testing Library, Playwright
- **개발도구**: ESLint, Prettier, Husky

## 📁 모노레포 실제 구조

```
/
├── apps/
│   ├── posmul-web/        # Next.js 웹 애플리케이션
│   └── android/           # React Native 안드로이드 앱
├── packages/
│   ├── shared-auth/       # 인증 관련 공통 로직
│   ├── shared-types/      # 공유 타입 (DDD 엔티티, 값 객체 등)
│   ├── shared-ui/         # 공유 리액트 컴포넌트
│   └── study-cycle-core/  # 학습 사이클 도메인 로직
├── docs/                  # 프로젝트 문서 (튜토리얼, 레퍼런스, 분석 등)
└── ...
```

### Bounded Contexts (실제 도메인 구조)

DDD에 따라 각 도메인은 `apps/posmul-web/src/bounded-contexts` 내에서 관리됩니다.

- **economy**: 경제(PMP/PMC, Agency Theory)
- **prediction**: 예측 게임
- **investment**: 투자/리그
- **donation**: 기부/PMC 소비
- **forum**: 포럼/커뮤니티
- **user**: 사용자 관리
- **auth**: 인증/권한
- **study_cycle**: 학습 사이클
- **community**: 커뮤니티
- **payment**: 결제/포인트
- **public, posmul, shared**: 기타 공용/플랫폼/공유 모듈

## 📚 문서 구조

- `docs/tutorials/` # 튜토리얼
- `docs/how-to/` # 실무 가이드
- `docs/reference/` # API/구성 참조
- `docs/explanation/` # 개념 설명
- `docs/reports/` # 분석 보고서
- `docs/task-reports/` # 작업 목록/진행 현황
- `docs/start/`, `docs/init/` 등 기타 문서

## 🌟 주요 특징

- **경제학적 정합성**: Jensen & Meckling, CAPM, Buchanan 이론 구현
- **대규모 확장성**: 100개 이상의 경제 주체 관계를 1ms 내 처리
- **PowerShell 최적화**: Windows 개발 환경 완전 지원
- **DDD 원칙**: 도메인별 명확한 책임 분리
- **타입 안전성**: 엄격한 TypeScript 설정과 공유 타입 패키지

## 🤝 기여하기

1. 저장소를 Fork하세요.
2. 새로운 기능 브랜치를 생성하세요. (`git checkout -b feature/AmazingFeature`)
3. 변경사항을 커밋하세요. (`git commit -m 'Add some AmazingFeature'`)
4. 브랜치에 푸시하세요. (`git push origin feature/AmazingFeature`)
5. Pull Request를 생성하세요.

모든 기여는 프로젝트의 기여 가이드라인을 따라야 합니다.

## 📝 라이선스

본 프로젝트는 MIT 라이선스를 따릅니다.

## 📞 문의

프로젝트 관련 문의사항이 있으시면 GitHub 이슈를 등록해주세요.
