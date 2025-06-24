# PosMul 프로젝트 소개 - Claude Code용

## 🎯 프로젝트 개요

**PosMul**은 AI 시대의 직접 민주주의 플랫폼으로, 예측 게임과 지역 경제 통합을 제공하는 혁신적인 플랫폼입니다.

## 📊 핵심 기술 스택

```
Frontend: Next.js 15 App Router + TypeScript + Tailwind CSS
Backend: Supabase (PostgreSQL + Real-time + Auth)
Architecture: Domain-Driven Design (DDD) + Clean Architecture
Integration: MCP (Model Context Protocol) - Supabase + GitHub
Economy: PMP/PMC 이중 화폐 시스템
```

## 🏗️ 프로젝트 구조

```
src/
├── app/                     # Next.js 15 App Router 페이지
├── bounded-contexts/        # DDD 도메인별 구조
│   ├── prediction/         # 예측 도메인
│   ├── investment/         # 투자 도메인
│   ├── forum/             # 포럼 도메인
│   ├── donation/          # 기부 도메인
│   └── dashboard/         # 대시보드 도메인
├── shared/                 # 공유 컴포넌트 및 유틸리티
│   ├── components/        # 공유 UI 컴포넌트
│   ├── economy-kernel/    # 경제 시스템 공유 도메인
│   └── utils/            # 공통 유틸리티
└── lib/                   # 라이브러리 및 설정
```

## 💰 핵심 경제 시스템

### PMP/PMC 이중 화폐 시스템

- **PMP (Point for Major Prediction)**: 위험 없는 자산
- **PMC (Point for Major Community)**: 위험 있는 자산
- **Money Wave**: PMC 분배 시스템

## 🎮 주요 도메인

### 1. Prediction Domain (예측 도메인)

- 예측 게임 생성 및 참여
- Binary, WDL, Ranking 타입 지원
- PMP 스테이킹 시스템

### 2. Investment Domain (투자 도메인)

- Major League (PMP 획득)
- Local League (PMC 획득)
- Cloud Funding (PMC 획득)

### 3. Forum Domain (포럼 도메인)

- Debate (PMP 획득)
- Brainstorming (PMP 획득)

### 4. Donation Domain (기부 도메인)

- PMC 기부 시스템
- Money Wave 재분배

## 🔧 개발 규칙

### MCP 우선 사용

- **Supabase MCP**: 모든 데이터베이스 작업
- **GitHub MCP**: 모든 프로젝트 관리 작업

### 아키텍처 원칙

- Clean Architecture 의존성 규칙 준수
- Domain → Application → Infrastructure
- 경제 시스템은 Shared Kernel 패턴
- Domain Events로 도메인 간 통신

### TypeScript 표준

- Branded Types 사용
- Result/Either 패턴으로 에러 처리
- 엄격한 타입 체킹

## 🎯 현재 작업 상황

최근에 T003 로딩/에러 UI 시스템 표준화를 완료했으며, 현재 Claude Code 통합을 진행 중입니다.

## 📝 작업 요청사항

Claude Code와 함께 다음과 같은 작업을 진행하고 싶습니다:

1. **코드 품질 개선**: DDD/Clean Architecture 원칙 준수 검증
2. **타입 안전성 향상**: TypeScript 타입 개선
3. **경제 시스템 로직 검토**: PMP/PMC 로직 최적화
4. **MCP 통합 개선**: Supabase/GitHub MCP 활용 최적화
5. **성능 최적화**: Next.js 15 기능 활용

이 프로젝트는 Agency Theory, CAPM, 행동경제학 이론을 코드로 구현하는 것이 핵심 목표입니다.
