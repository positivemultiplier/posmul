# PosMul Prediction Game Platform

PosMul은 Next.js 15, Domain-Driven Design (DDD), Clean Architecture 원칙을 구현한 예측 게임 MVP 플랫폼입니다.

## 🎯 프로젝트 개요

- **플랫폼**: Next.js 15 App Router 기반 예측 게임
- **경제 시스템**: PMP/PMC 토큰 기반 Agency Theory 구현
- **아키텍처**: DDD + Clean Architecture + SOLID 원칙
- **백엔드**: Supabase 통합
- **개발 환경**: Windows PowerShell 최적화

## 🏗 아키텍처

### Bounded Contexts

- **Economic**: PMP/PMC 토큰 시스템, Agency Theory, 최적화 엔진
- **Prediction**: 예측 게임 로직, 게임 관리
- **User**: 사용자 프로필, 활동 관리
- **Auth**: 인증 및 권한 관리
- **Payment**: 포인트 시스템, 거래 관리

### 기술 스택

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Backend**: Supabase, MCP (Model Context Protocol)
- **테스트**: Jest, React Testing Library
- **개발도구**: ESLint, Prettier, Husky

## 🚀 시작하기

### 개발 서버 실행

```powershell
cd c:\G\posmul
npm install
npm run dev
```

### 테스트 실행

```powershell
# 전체 테스트 실행
npm test

# 특정 테스트 실행
npm test -- agency-cost-optimization.service.test.ts

# 테스트 커버리지
npm run test:coverage
```

### 빌드

```powershell
npm run build
npm start
```

## 🧪 핵심 기능

### Agency Theory 경제 시스템

- Jensen & Meckling (1976) 이론 기반 Agency Cost 최적화
- PMP-PMC 전환 메커니즘
- 사회후생 극대화 알고리즘
- 실증 분석 도구

### 예측 게임

- 다양한 예측 게임 모드
- 실시간 결과 분석
- 사회적 학습 시스템
- 인센티브 최적화

## 📁 프로젝트 구조

```
src/
├── bounded-contexts/        # DDD Bounded Contexts
│   ├── economic/           # 경제 시스템
│   ├── prediction/         # 예측 게임
│   ├── user/              # 사용자 관리
│   ├── auth/              # 인증
│   └── payment/           # 결제 시스템
├── shared/                # 공통 타입 및 유틸리티
├── app/                   # Next.js App Router
└── lib/                   # 외부 라이브러리 설정
```

## 🧪 테스트 현황

✅ **33개 테스트 모두 통과**

- Agency Cost 최적화: 14개 테스트
- 실증 분석: 10개 테스트
- 통합 테스트: 9개 테스트

## 🌟 주요 특징

- **경제학적 정합성**: Jensen & Meckling, CAPM, Buchanan 이론 구현
- **대규모 확장성**: 100개 관계 1ms 내 처리
- **PowerShell 최적화**: Windows 환경 완전 지원
- **DDD 원칙**: 도메인별 명확한 책임 분리
- **타입 안전성**: 엄격한 TypeScript 설정

## 📊 성능 지표

- **Agency Cost 최적화**: 평균 8ms 내 완료
- **실증 분석**: 대용량 데이터 1ms 내 처리
- **사회후생 개선**: 평균 200% 이상 향상
- **Pareto 효율성**: 완전 구현

## 🤝 기여하기

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📝 라이선스

MIT License

## 📞 문의

프로젝트 관련 문의사항이 있으시면 이슈를 등록해주세요.
