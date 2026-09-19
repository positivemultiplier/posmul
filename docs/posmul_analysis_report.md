# PosMul 프로젝트 분석 보고서

## 1. 개요
**PosMul**(긍정승수)은 시민 참여형 직접 민주주의 플랫폼으로, 사용자의 활동(예측, 포럼, 소비)을 바탕으로 PMP(Point Major Policy)와 PMC(Point Minor Community)를 획득하고 이를 통해 지역 기부, 소비, 투자로 이어지는 선순환 경제 시스템을 구축한 프로젝트입니다.

- **Frontend**: Next.js 15.3.4 (App Router), React 19, Tailwind CSS 4, Zustand 5
- **Backend**: Supabase (PostgreSQL 17.4), MCP Tools
- **Architecture**: Domain-Driven Design (DDD), Clean Architecture 
- **Monorepo**: Turborepo, pnpm 10.12

## 2. Bounded Context (도메인 분리)
애플리케이션과 데이터베이스 모두 아래와 같이 도메인별로 분리(Schema-per-Bounded-Context)되어 고도의 모듈화와 결합도 최소화를 달성하고 있습니다.

1. **Economy (경제 시스템)**
2. **Prediction (예측 게임)**
3. **Donation (기부)**
4. **Forum (포럼/토론)**
5. **Consume (소비)**
6. **User (사용자/평판)**
7. (그 외 Auth, Public, Ranking, Demographic-data, Study-cycle 등)

## 3. 데이터베이스 (Supabase) 분석 결과
조회된 `economy`, `prediction`, `user`, `forum`, `donation` 스키마들을 분석한 상세 내역입니다.

### 3.1 Economy (토큰 및 재분배)
PMP/PMC 이중 토큰 시스템과 **MoneyWave** 재분배 알고리즘이 핵심입니다.
- **pmp_pmc_accounts**: 사용자의 PMP(위험프리) 및 PMC(위험자산) 잔액.
- **pmp_pmc_transactions**: 포인트 획득/소비/변환 로그.
- **money_wave_history**, **money_wave1_ebit_records**, **money_wave2_redistribution_records**, **money_wave3_entrepreneur_records**: 3단계 Wave 기반의 부의 재분배 및 성과 추적.
- **individual_utility_parameters**, **utility_predictions**: Kahneman-Tversky 등 행동경제학 기반 개인별 효용 매개변수를 모델링하여 시스템 성과와 효율성을 분석하는 고도화된 스키마 존재.

### 3.2 Prediction (예측 게임)
- **prediction_games**: 예측 게임 목록 (Difficulty, 카테고리, 배당률 옵션 등).
- **predictions**: 사용자의 배팅 기록 및 확신도(Confidence Level).
- **prediction_settlements**, **settlement_history**: 예측 게임 정산 및 보상(PMC) 지급 내역.
- **game_snapshots**, **prediction_trends**: 예측 확률 및 거래량 변화를 시간순으로 저장하여 실시간 차트 제공에 사용.

### 3.3 Donation (기부 시스템)
- **donations**, **donation_institutes**: 직접 기부, 기관 기부 및 기부 내역.
- **funding_projects**: 클라우드 펀딩 프로젝트.
- **opinion_leaders**, **opinion_leader_endorsements**: 등록된 오피니언 리더 및 추종(Follow), 지지 내역.
- **direct_donation_items**, **direct_donation_requests**: 개인 간 직접 물품 기부 및 매칭 상태.
- **donation_certificates**: 기부금 영수증(증명서) 발급 정보(연말정산 등 활용 목적).

### 3.4 Forum (포럼/커뮤니티)
- **forum_posts**, **forum_comments**: 카테고리별 토론, 제안, 질문 게시판. 
- **forum_activity_logs**: 게시물 작성, 투표, 추천 등에 따른 활동 내역 기록 및 PMP 보상 연동.
- **forum_votes**, **forum_tags**, **forum_categories**: 포럼 글 분류와 평가.
- **forum_regions**: 커뮤니티 혹은 지역 단위의 계층 구조 정의(로컬, 국가 규모 등).

### 3.5 User (회원 및 평판)
- **profiles**: 기본 프로필 정보 (`auth.users`에 1:1 맵핑).
- **user_reputation_metrics**: 예측 정확도, 포럼 기여도, 기부 실적 등을 종합한 평판 점수/등급 산출.
- **behavioral_bias_profiles**: 손실 회피, 군집 행동, 앵커링 등 사용자의 행동 편향을 수치화.

## 4. 아키텍처 및 개발 워크플로우 분석
1. **Rule Base**: `.agent/rules/`의 엄격한 가이드라인 준수.
   - DB 변경은 **Supabase CLI가 아닌 MCP 전용** 도구 사용이 원칙.
   - UI는 `shared/ui` (Primitive UI)와 도메인별 `presentation` 뷰로 엄격히 분리 (Local-First 원칙).
2. **레이어 계층(Layered Architecture)**
   - `Domain` → 순수 TS 로직 (Entity, VO, Repo 인터페이스)
   - `Application` → Use Case, DTO
   - `Infrastructure` → Supabase Adapter 구현
   - `Presentation` → React Server Components, Client 상태(Zustand) 결합
3. **CI/CD 및 Testing**
   - Red-Green-Refactor 기반. `pnpm test`, `jest`, `playwright` 사용. 도메인 단위 유닛 테스트 80% 이상 강제.

## 5. 종합 평가
PosMul 프로젝트는 단순한 커뮤니티 플랫폼을 넘어, **행동경제학과 토크노믹스가 정교하게 결합된 사회 실험 모델**입니다. 특히 데이터베이스 스키마에서 보이는 MoneyWave 알고리즘, 지니계수 계산, 사회후생함수(Social Welfare) 추적 스키마들은 매우 높은 완성도와 기획 깊이를 보여줍니다. 코드 레벨에서도 강력한 모노레포 + DDD 캡슐화 규칙이 적용되어 있어 향후 안정적인 기능 확장이 가능할 것으로 평가됩니다.
