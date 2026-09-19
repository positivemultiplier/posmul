# PosMul 플랫폼 백서 (Whitepaper)

> **버전**: 1.0
> **작성일**: 2026-03-10
> **주제**: AI 시대의 직접 민주주의 플랫폼 구현 및 경제학 이론 기반의 가치 재분배 생태계

---

## 1. 개요 (Executive Summary)

**PosMul (Positive Multiplier, 긍정승수)**은 AI 기술, 행동경제학(Agency Theory, CAPM), 그리고 블록체인 철학이 결합된 **차세대 직접 민주주의 및 지역 경제 통합 플랫폼**입니다. 
시민들은 정책 예측(Prediction), 포럼(Forum), 소비(Consume) 등 다양한 활동에 참여하며 가치를 창출하고, 플랫폼은 창출된 가치를 **PMP(Point Major Policy)**와 **PMC(Point Minor Community)**라는 이중 토큰 시스템을 통해 투명하게 재분배합니다.
궁극적으로 예측 게임을 통해 집단 지성을 모으고, 창출된 수익을 기부(Donation)와 지역 경제 활성화에 사용하여 사회 전체의 긍정적인 파급 효과(승수 효과)를 만들어냅니다.

---

## 2. 핵심 비전 및 철학 (Vision & Philosophy)

### 2.1 AI 기반 직접 민주주의 실현
대의 민주주의의 한계를 극복하기 위해 시민이 정책/이슈의 결과를 직접 예측하고, 예측의 성공(집단 지성)이 실제 가치(PMC)로 변환되는 시스템을 구축합니다.

### 2.2 행동경제학과 금융 이론의 코드화
세계 최초로 **대리인 이론(Agency Theory)**과 **자본자산가격결정모형(CAPM)**을 시스템화했습니다.
- **PMP (Risk-Free Asset)**: 시스템 내 활동(예측, 포럼 참여, 광고 시청)을 통해 얻는 무위험 자산
- **PMC (Risky Asset)**: 예측의 성공을 통해 얻어지며 기부, 지역 투자, 실물 소비에 사용되는 자산

### 2.3 사회 기여의 선순환 (Positive Multiplier)
예측 게임 등에서 발생한 플랫폼 내 부가가치는 **MoneyWave** 알고리즘을 통해 3단계(전체 균등 → 활동 비례 → 기여 비례)로 재분배되며, 최종적으로는 지역 사회 기부 및 투자로 환원됩니다.

---

## 3. 토크노믹스 및 경제 시스템 (Tokenomics & Economy System)

PosMul의 경제는 투기성 코인이 아닌, 철저히 사용자 효용(Utility)과 사회후생함수(Social Welfare)에 기반하여 움직입니다.

### 3.1 이중 토큰(Dual-Token) 구조
- **PMP (Point Major Policy)**
  - **성격**: 무위험 자산 (Nationwide 단위)
  - **획득처**: TimeConsume(광고/설문), Forum(토론 기여)
  - **사용처**: 예측 게임(Major League) 베팅, 정책 투표
- **PMC (Point Minor Community)**
  - **성격**: 위험 자산 및 실물 경제 연동 (Local 단위)
  - **획득처**: 예측 게임 성공 보상, MoneyConsume(지역 결제 적립), CloudConsume(펀딩)
  - **사용처**: 지역 기부, 인플루언서 / 오피니언 리더 후원, 지역 매장 결제, 로컬 투자

### 3.2 MoneyWave (부의 재분배 알고리즘)
PMP를 베팅하여 예측에 실패한 포인트는 소각되고, 성공한 포인트는 PMC로 전환되는 과정에서 생태계 기여도에 따라 부가 재분배됩니다.
- **Wave 1 (균등 분배)**: 플랫폼 생태계를 유지하는 전체 활성 사용자에게 기본 소득 형태로 균등 배분.
- **Wave 2 (활동 비례)**: 생태계 참여도(로그인, 투표 등)에 비례한 분배.
- **Wave 3 (기여 비례)**: 우수 예측자, 포럼 우수 활동가 등 핵심 기여자에게 집중적인 보상 제공.

---

## 4. 플랫폼 아키텍처 및 도메인 모델 (DDD Architecture)

PosMul은 철저한 **도메인 주도 설계(Domain-Driven Design, DDD)** 및 **클린 아키텍처(Clean Architecture)**를 도입하여 11개의 Bounded Context로 구성된 Enterprise 급 모노레포 구조를 갖추고 있습니다. 이를 통해 고도의 확장성과 유지보수성을 보장합니다.

### 4.1 Bounded Context (11개 도메인)
- **[경제 및 소비 그룹]**
  - `Economy`: 중앙 은행 역할. PMP/PMC 잔액, 트랜잭션, MoneyWave 재분배 처리
  - `Consume`: 광고 시청, 지역 상점 결제, 크라우드 펀딩 관리
  - `Prediction`: 예측 게임 생성, 배팅(Prediction), 정산(Settlement) 처리
  - `Donation`: 개인/기관 기부 영수증 처리, 오피니언 리더 후원
- **[사용자 및 커뮤니티 그룹]**
  - `Auth`: 사용자 인증, 권한 관리, 보안
  - `User`: 프로필, 플랫폼 내 평판(Reputation) 모델 관리
  - `Forum`: 뉴스, 토론(Debate), 브레인스토밍, 예산 투표 게시판
  - `Ranking`: 지표 통합 및 리더보드, 티어/뱃지 관리
- **[데이터 및 인프라스트럭처 그룹]**
  - `Demographic Data`: 인구/경제 지표 (예측 게임의 Base Stat 제공)
  - `Study Cycle`: 학습 및 커리큘럼 제공
  - `Public`: 공통 코드 및 약관 등

### 4.2 시스템 기술 스택
- **프론트엔드**: Next.js 15 (App Router), React 19, Tailwind CSS 4, Zustand 5
- **백엔드/데이터베이스**: Supabase (PostgreSQL 17.4), Row Level Security (RLS), Realtime WebSocket 
- **설계/운영 원칙**: 
  - **TypeScript 100% Strict 모드**
  - 데이터베이스 접근은 오직 **MCP (Model Context Protocol)** 도구를 통해서만 통제 및 적용
  - Schema-per-Bounded-Context 적용으로 도메인 별 `economy.*`, `prediction.*` 등 독립적 스키마 분리 운영

---

## 5. 핵심 프로세스 및 사용자 여정 (User Journey)

### 🐾 시나리오: 일상 속 직접 민주주의 실현
1. **PMP 획득**: 사용자 A는 출퇴근길에 앱에 접속하여 `Consume` 도메인에서 광고(TimeConsume)를 시청하고, 10 PMP를 획득합니다.
2. **이슈 참여**: `Forum`에서 '지역 무상급식 확대' 토론을 읽고 의견을 냅니다.
3. **예측 게임**: 획득한 10 PMP를 `Prediction` 도메인에 있는 '무상급식 조례 통과 여부' 게임의 '통과' 옵션에 베팅합니다.
4. **결과 정산**: 실제 조례가 통과되고, 사용자 A는 예측에 성공하여 배당률에 따라 15 PMC를 보상으로 받습니다. 동시에 `Economy` 도메인의 **MoneyWave**가 발동하여, 예측 성과가 높은 A에게 추가 PMC 가산점이 배분됩니다.
5. **사회 환원**: 사용자 A는 15 PMC 중 10 PMC를 `Donation` 도메인을 통해 평소 응원하던 '결식아동 지원 센터'에 기부하고, 기부금 영수증 처리를 완료합니다.
6. **평판 상승**: 이 모든 활동(`prediction`, `forum`, `donation`) 내역이 통합되어 사용자 A의 `Ranking` 및 `Reputation`이 상승하여, 더 높은 티어를 부여받습니다.

---

## 6. 보안 및 운영(DevOps) 파이프라인

- **Zero-Trust 아키텍처**: Supabase의 RLS(Row Level Security)를 활용하여 각 사용자별 리소스 접근을 데이터베이스 레벨에서 원천 차단/허용합니다.
- **TDD (Test-Driven Development)**: Red-Green-Refactor 원칙에 따라, 도메인 레이어 유닛 테스트 80% 이상의 높은 커버리지를 준수합니다.
- **CI/CD 및 MCP 연동**: 코드 변경, 데이터베이스 마이그레이션(DDL), 그리고 TypeScript Type 생성까지 모두 자동화된 파이프라인(pnpm 기반 모노레포 + Turborepo) 위에서 안전하게 배포됩니다.

---

## 7. 향후 로드맵 (Roadmap)

- **Phase 1 (현재)**: 프로덕션 MVP 완료 및 11개 Bounded Context 통합 안정화 (TypeScript 에러 0 달성, 모노레포 빌드 100% 성공)
- **Phase 2 (확장)**: 한국 사용자 기반 확보 및 지역 가맹점 연동 강화 (Consume 도메인 오프라인 결제 연계)
- **Phase 3 (AI 고도화)**: 예측 모델의 AI 시뮬레이션 고도화 및 정책 입안자용 데이터 대시보드(Demographic Data) B2B 공개
- **Phase 4 (글로벌)**: 다국어 지원 및 해외 직접 민주주의 / 시빅테크(Civic Tech) 시장 진출

---

**PosMul**은 기술(Technology)을 통해 경제(Economy)와 민주주의(Democracy)를 융합하는 실험이며, 사용자의 일상적 참여가 곧 사회적 가치(긍정승수)로 환원되는 가장 완벽한 거버넌스 생태계입니다.
