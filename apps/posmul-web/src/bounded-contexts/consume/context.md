# Consume Bounded Context

## 도메인 개요

Consume 도메인은 Posmul 플랫폼의 소비 및 포인트 적립 시스템을 담당합니다. 사용자가 다양한 방식으로 PMC/PMP 포인트를 적립할 수 있는 핵심 비즈니스 영역입니다.

## 핵심 서비스

### 1. Local League (지역 리그)
- **목적**: 지역 소상공인과의 지속 가능한 소비를 통한 PMC 적립
- **주요 기능**:
  - `Merchant` (가맹점) 등록 및 관리
  - QR 코드 기반 결제
  - 포인트 적립 (기본/이벤트/구독 보너스)

### 2. Major League (메이저 리그)
- **목적**: 기업 제품/서비스 광고 시청 및 참여를 통한 PMP 적립
- **주요 기능**:
  - `AdCampaign` (광고 캠페인) 및 `Advertisement` (개별 광고) 관리
  - `AdView` (광고 시청) 기록 및 보상 제공
  - 시청 시간/완전 시청 보너스 계산

### 3. Cloud Funding (클라우드 펀딩)
- **목적**: 개인/소상공인의 꿈과 아이디어를 후원하는 크라우드 펀딩
- **주요 기능**:
  - `Crowdfunding` (펀딩 프로젝트) 생성 및 관리
  - `InvestmentOpportunity` (투자 기회) 제공
  - `InvestmentParticipation` (투자 참여) 및 성과 관리

## 도메인 모델

### Aggregates
1. **Merchant** (상점): 가맹점 정보, 위치, QR코드
2. **AdCampaign**: 광고 캠페인 그룹
3. **Advertisement**: 개별 광고 콘텐츠
4. **AdView**: 사용자 광고 시청 기록
5. **CrowdFunding**: 펀딩 프로젝트 메인
6. **InvestmentOpportunity**: 투자 모집 단위
7. **InvestmentParticipation**: 사용자 투자 내역

### Value Objects
- MerchantId, AdCampaignId, AdvertisementId
- CrowdFundingId, InvestmentOpportunityId
- Location (지역 정보)
- QRCode
- Rating (평점)
- ViewingDuration (시청 시간)

### Domain Services
- InvestmentEconomicService (투자 경제 로직)
- InvestmentDomainService (투자 도메인 로직)

## 외부 의존성
- Payment 도메인: 포인트 적립/사용
- Auth 도메인: 사용자 식별
- 외부 결제/지도 서비스

## 도메인 이벤트
- MerchantRegisteredEvent
- AdvertisementViewedEvent
- FundingParticipatedEvent
