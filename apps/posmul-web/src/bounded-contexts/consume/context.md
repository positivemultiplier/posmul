# Investment Bounded Context

## 도메인 개요

Investment 도메인은 Posmul 플랫폼의 투자 및 포인트 적립 시스템을 담당합니다. 사용자가 다양한 방식으로 PMC/PMP 포인트를 적립할 수 있는 핵심 비즈니스 영역입니다.

## 핵심 서비스

### 1. Local League (지역 리그)

- **목적**: 지역 소상공인과의 지속 가능한 소비를 통한 PMC 적립
- **주요 기능**:
  - 지역 가맹점 등록 및 관리
  - QR 코드 기반 결제 및 포인트 적립 (결제 금액의 1% PMC)
  - 이벤트 기간 추가 포인트 (총 2% PMC)
  - 매달 정기 구독자 보너스
  - 리뷰 및 별점 평가 시스템
- **참여 대상**: 음식점, 카페, 소매점, 지역 농수산물 직거래, 전통시장

### 2. Major League (메이저 리그)

- **목적**: 기업 제품/서비스 광고 시청 및 참여를 통한 PMP 적립
- **주요 기능**:
  - 맞춤형 광고 추천 시스템
  - 시청 시간에 따른 포인트 적립 (1분당 10PMC)
  - 광고 평가 및 피드백 (별점, 댓글 PMC 적립)
  - 설문조사 참여 추가 포인트 (1회 100PMC)
  - 광고 완전 시청 보너스 (30초 이상 시청 시 1.5배 PMC)

### 3. Cloud Funding (클라우드 펀딩)

- **목적**: 개인/소상공인의 꿈과 아이디어를 후원하는 크라우드 펀딩
- **주요 기능**:
  - 프로젝트 상세 정보 조회
  - 투자 금액 설정 및 결제 (1,000원 단위)
  - 실시간 펀딩 현황 조회
  - 프로젝트 성과 보고서 수신
  - 투자금 회수 또는 재투자 선택

## 도메인 모델

### Aggregates

1. **Merchant** (상점) - Local League 상점 관리
2. **Advertisement** (광고) - Major League 광고 콘텐츠 관리
3. **CrowdFunding** (크라우드 펀딩) - Cloud Funding 프로젝트 관리
4. **Investment** (투자) - 사용자의 투자/참여 기록

### Value Objects

- MerchantId, AdvertisementId, CrowdFundingId, InvestmentId
- Location (지역 정보)
- QRCode (결제용 QR 코드)
- Rating (평점)
- RewardRate (보상율)
- FundingGoal (펀딩 목표)
- ViewingDuration (시청 시간)

### Domain Services

- RewardCalculationService (보상 계산)
- LocationService (지역 기반 서비스)
- PaymentService (결제 처리)
- FundingService (펀딩 관리)

## 외부 의존성

- Payment 도메인: 포인트 적립/사용
- Auth 도메인: 사용자 인증
- 외부 지도 서비스 (지역 매장 검색)
- 외부 결제 게이트웨이 (QR 코드 결제)

## 도메인 이벤트

- MerchantRegisteredEvent
- PaymentProcessedEvent
- RewardEarnedEvent
- AdvertisementViewedEvent
- FundingParticipatedEvent
- ProjectCompletedEvent

## 비즈니스 규칙

1. Local League 포인트 적립률: 기본 1%, 이벤트 시 2%
2. Major League 시청 보상: 1분당 10PMC, 완전 시청 시 1.5배
3. Cloud Funding 최소 투자 금액: 1,000원
4. 리뷰 작성 시 추가 PMC 적립
5. 정기 구독자 보너스 포인트 (매달 1일)

## 기술적 고려사항

- QR 코드 생성 및 스캔 처리
- 실시간 위치 기반 서비스
- 광고 시청 시간 추적
- 대용량 펀딩 프로젝트 데이터 처리
- 결제 보안 및 PCI DSS 준수
