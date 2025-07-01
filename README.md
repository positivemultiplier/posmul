# PosMul: AI-Era Direct Democracy Platform

**PosMul**은 예측 게임과 지역 경제 연동을 통해 시민이 직접 참여하는 새로운 민주주의 경험을 제공하는 AI 시대 직접민주주의 플랫폼입니다. Next.js 15, Domain-Driven Design (DDD), Clean Architecture를 기반으로 구축되었습니다.

## 🎯 프로젝트 개요

- **플랫폼**: Next.js 15 App Router 기반 예측 게임 및 소셜 플랫폼
- **경제 시스템**: PMP/PMC 토큰 기반 Agency Theory 구현
- **아키텍처**: DDD + Clean Architecture + SOLID 원칙
- **백엔드**: Supabase (MCP를 통한 통합)
- **모노레포**: pnpm Workspaces + Turborepo
- **개발 환경**: Windows PowerShell 최적화

## 🚀 빠른 시작

본 프로젝트는 pnpm을 패키지 매니저로 사용하는 모노레포 환경입니다.

### 1. 의존성 설치

```powershell
# 프로젝트 루트 디렉토리에서 실행
pnpm install

# 워크스페이스 패키지들 빌드 (필수)
pnpm build
```

### 2. 웹 개발 서버 실행

```powershell
# 웹 애플리케이션 개발 서버 실행
pnpm --filter posmul dev

# 또는 루트에서 모든 앱 실행
pnpm dev
```

서버가 실행되면 다음 URL에서 접근 가능합니다:
- **로컬**: http://localhost:3000
- **네트워크**: http://192.168.x.x:3000

### 3. 데이터베이스 타입 생성

```powershell
# Supabase 스키마에서 TypeScript 타입 자동 생성
pnpm generate-types
```

### 4. 테스트 실행

```powershell
# 전체 테스트 실행
pnpm test

# 특정 패키지 테스트 실행
pnpm --filter @posmul/shared-types test
```

## 🏗️ 아키텍처 현황

### 📊 **프로젝트 성숙도: A+ 등급**

```mermaid
pie title 아키텍처 완성도 (2025-07-01 기준)
    "DDD 구현" : 95
    "Clean Architecture" : 90
    "경제 시스템" : 92
    "타입 안전성" : 88
    "문서화" : 85
```

### 🎯 **핵심 성과**

- ✅ **완벽한 도메인 분리**: 6개 스키마, 39개 테이블의 Schema-per-Bounded-Context 패턴
- ✅ **Agency Theory 구현**: PMP/PMC 이중 토큰 경제 시스템
- ✅ **MoneyWave 시스템**: 3단계 웨이브 기반 PMC 분배
- ✅ **타입 안전성**: Universal MCP를 통한 자동 타입 동기화
- ✅ **모노레포 최적화**: 5개 패키지의 효율적인 의존성 관리

## 📁 프로젝트 구조

```
posmul/
├── apps/
│   ├── posmul-web/           # 🌐 Next.js 웹 애플리케이션
│   └── android/              # 📱 React Native 안드로이드 앱
├── packages/
│   ├── shared-auth/          # 🔐 인증 공통 로직
│   ├── shared-types/         # 📝 공유 타입 (DDD 엔티티)
│   ├── shared-ui/            # 🎨 공유 리액트 컴포넌트
│   └── study-cycle-core/     # 📚 학습 사이클 도메인
├── docs/                     # 📖 프로젝트 문서
└── scripts/                  # 🔧 개발 도구
```

### 🏛️ **도메인 아키텍처 (DDD)**

```mermaid
graph TD
    A["🏦 Economy Domain<br/>(PMP/PMC 시스템)"] --> B["🎯 Prediction Domain<br/>(예측 게임)"]
    A --> C["💰 Investment Domain<br/>(리그/펀딩)"]
    A --> D["❤️ Donation Domain<br/>(기부 시스템)"]
    A --> E["💬 Forum Domain<br/>(커뮤니티)"]
    A --> F["👤 User Domain<br/>(사용자 관리)"]
    
    style A fill:#e1f5fe
    style B fill:#f3e5f5
    style C fill:#e8f5e8
    style D fill:#fff3e0
    style E fill:#fce4ec
    style F fill:#f1f8e9
```

**실제 데이터베이스 구조**:
- **Economy 스키마**: 12개 테이블 (PMP/PMC 계정, 거래 내역, MoneyWave)
- **Prediction 스키마**: 5개 테이블 (게임, 예측, 정산, 통계)
- **Investment 스키마**: 4개 테이블 (투자 기회, 참여 내역)
- **Forum 스키마**: 7개 테이블 (포스트, 댓글, 투표)
- **Donation 스키마**: 4개 테이블 (기부, 기관 관리)
- **User 스키마**: 5개 테이블 (프로필, 설정)

## 🔧 기술 스택

### **Frontend**
- **Framework**: Next.js 15 (App Router)
- **UI**: React 19, TypeScript, Tailwind CSS
- **State**: Zustand, React Query
- **Charts**: Recharts, Mermaid

### **Backend & Database**
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage
- **Integration**: MCP (Model Context Protocol)

### **Development Tools**
- **Package Manager**: pnpm (Workspaces)
- **Build**: Turborepo
- **Testing**: Jest, React Testing Library, Playwright
- **Code Quality**: ESLint, Prettier, Husky
- **Type Generation**: Universal MCP Automation System

## 🤖 Universal MCP 시스템

### 📋 **시스템 개요**

Universal MCP Automation System은 Supabase 데이터베이스 스키마로부터 TypeScript 타입을 자동 생성하는 범용 자동화 도구입니다.

```mermaid
sequenceDiagram
    participant Dev as 개발자
    participant MCP as Universal MCP
    participant DB as Supabase DB
    participant Files as 타입 파일들

    Dev->>MCP: pnpm generate-types
    MCP->>DB: 스키마 정보 요청
    DB-->>MCP: 39개 테이블 스키마
    MCP->>Files: 도메인별 타입 생성
    Files-->>Dev: ✅ 타입 동기화 완료
```

### 🎯 **주요 기능**

- ✅ **자동 타입 생성**: 데이터베이스 스키마 → TypeScript 타입
- ✅ **도메인별 분리**: 각 도메인에 맞는 타입만 추출
- ✅ **다중 프로젝트 지원**: 다른 프로젝트에도 적용 가능
- ✅ **실시간 동기화**: 스키마 변경 시 자동 업데이트

### 📍 **시스템 위치**

- **메인 시스템**: `C:\G\mcp-automation\` (독립 실행)
- **프로젝트 내 스크립트**: `apps/posmul-web/scripts/universal-mcp-automation.ts`
- **실행 명령어**: `pnpm generate-types`

## 📚 문서 구조

프로젝트 문서는 [Diátaxis 프레임워크](https://diataxis.fr/)를 따라 구성되어 있습니다.

```
docs/
├── tutorials/              # 🎓 학습 중심 가이드
├── guides/                 # 🛠️ 문제 해결 중심 가이드  
├── reference/              # 📖 정보 중심 레퍼런스
├── explanation/            # 💡 이해 중심 설명
├── reports/               # 📊 분석 보고서
└── archive/               # 📦 레거시 문서 보관
```

### 📖 **주요 문서**

- **[온보딩 튜토리얼](docs/tutorials/posmul-onboarding-for-new-devs.md)**: 신규 개발자 가이드
- **[아키텍처 개요](docs/architecture/posmul-comprehensive-architecture-overview.md)**: 전체 시스템 구조
- **[Universal MCP 가이드](docs/guides/manage-universal-types.md)**: 타입 관리 방법
- **[API 문서](docs/api/API_Documentation.md)**: REST API 레퍼런스

## 🌟 경제 시스템 특징

### 💰 **PMP/PMC 이중 토큰 시스템**

```mermaid
graph LR
    A["🏛️ PMP<br/>(Point Major Policy)"] --> B["📊 예측 게임 참여"]
    A --> C["💬 포럼 토론"]
    
    D["🏘️ PMC<br/>(Point Minor Community)"] --> E["❤️ 지역 기부"]
    D --> F["💰 로컬 리그 투자"]
    
    B --> G["🎯 성공 시 PMC 획득"]
    C --> H["🏆 기여도에 따라 PMP 획득"]
    
    style A fill:#1976d2,color:#fff
    style D fill:#388e3c,color:#fff
```

### 🌊 **MoneyWave 분배 시스템**

- **Wave 1**: 기본 PMC 분배 (전체 사용자)
- **Wave 2**: 활동 기반 추가 분배 (활성 사용자)
- **Wave 3**: 기여도 기반 보너스 (핵심 기여자)

## 🛠️ 개발 가이드

### **환경 설정**

1. **Node.js**: 18.x 이상
2. **pnpm**: 8.x 이상 (필수)
3. **PowerShell**: Windows 환경 최적화
4. **Supabase CLI**: MCP 통합으로 선택사항

### **개발 워크플로우**

```mermaid
flowchart TD
    A["🔄 코드 변경"] --> B["📝 타입 생성<br/>pnpm generate-types"]
    B --> C["🧪 테스트 실행<br/>pnpm test"]
    C --> D["🏗️ 빌드<br/>pnpm build"]
    D --> E["🚀 배포"]
    
    style A fill:#e3f2fd
    style B fill:#f3e5f5
    style C fill:#e8f5e8
    style D fill:#fff3e0
    style E fill:#e0f2f1
```

### **코딩 규칙**

- **아키텍처**: DDD + Clean Architecture 엄격 준수
- **타입 안전성**: 모든 외부 데이터는 Zod 검증
- **에러 처리**: Result 패턴 사용
- **스타일**: Prettier + ESLint 자동 포맷팅

## 🧪 테스트 전략

- **Unit Tests**: 도메인 로직 (Jest)
- **Integration Tests**: API 엔드포인트 (Jest)
- **E2E Tests**: 사용자 플로우 (Playwright)
- **Type Tests**: 타입 안전성 검증

## 🚀 배포

### **개발 환경**
```powershell
pnpm dev
```

### **프로덕션 빌드**
```powershell
pnpm build
pnpm start
```

### **타입 동기화**
```powershell
# 데이터베이스 스키마 변경 후 실행
pnpm generate-types
```

## 📈 성능 지표

- **초기 로딩**: < 2초
- **경제 계산**: < 1ms (100+ 주체)
- **타입 생성**: < 30초 (39개 테이블)
- **빌드 시간**: < 3분 (전체 모노레포)

## 🤝 기여하기

1. **저장소 Fork**
2. **기능 브랜치 생성**: `git checkout -b feature/amazing-feature`
3. **변경사항 커밋**: `git commit -m 'Add amazing feature'`
4. **브랜치 푸시**: `git push origin feature/amazing-feature`
5. **Pull Request 생성**

### **기여 가이드라인**

- DDD 아키텍처 원칙 준수
- 타입 안전성 유지
- 테스트 커버리지 80% 이상
- 문서 업데이트 포함

## 📄 라이선스

본 프로젝트는 MIT 라이선스를 따릅니다.

## 📞 지원

- **이슈 리포팅**: [GitHub Issues](https://github.com/your-org/posmul/issues)
- **문서**: [프로젝트 문서](docs/README.md)
- **아키텍처 문의**: [아키텍처 가이드](docs/architecture/)

---

**🎉 PosMul과 함께 AI 시대의 새로운 민주주의를 경험해보세요!**
