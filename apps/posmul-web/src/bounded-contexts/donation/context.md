# Donation Bounded Context

## 도메인 개요

Donation 도메인은 PosMul 플랫폼의 기부 시스템을 담당하는 바운디드 컨텍스트입니다. 사용자가 PMC 포인트를 사용하여 다양한 형태의 기부와 후원을 할 수 있는 시스템을 제공합니다.

## 유비쿼터스 언어 (Ubiquitous Language)

### 핵심 용어
- **Direct Donation**: 개인이 직접 물품이나 금액을 기부하는 방식
- **Institute Donation**: 신뢰할 수 있는 기관(세이브더칠드런, 유니세프 등)을 통한 기부
- **Opinion Leader Support**: 오피니언 리더의 활동이나 주장에 대한 후원
- **Donation Certificate**: 기부 증명서 - 세금 공제 및 기부 내역 증명용
- **Transparency Report**: 투명성 보고서 - 기부금 사용 내역 공개
- **PMC (PosMul Coin)**: 기부에 사용되는 플랫폼 코인
- **Donation Badge**: 기부 활동에 따른 인증 뱃지
- **Beneficiary**: 기부 수혜자
- **Donor**: 기부자

## 도메인 책임

### 주요 기능
1. **Direct Donation (직접 기부)**
   - 개인 물품/금액 기부 관리
   - 수혜자 매칭 시스템
   - 기부 현황 실시간 조회

2. **Institute Donation (기관 기부)**
   - 신뢰 기관 연동
   - 기부금 사용 내역 투명 공개
   - 정기 후원 시스템

3. **Opinion Leader Support (오피니언 리더 후원)**
   - 콘텐츠 기반 후원
   - 후원자-리더 상호작용
   - 특별 콘텐츠 접근 권한

4. **공통 기능**
   - 기부 내역 관리
   - 기부 증명서 발급
   - 포인트 보상 시스템
   - SNS 공유 기능

## 도메인 모델

### Aggregates
- **Donation**: 기부 애그리거트 - 모든 기부 활동의 루트
- **Institute**: 기부 기관 애그리거트
- **OpinionLeader**: 오피니언 리더 애그리거트

### Entities
- **DirectDonation**: 직접 기부 엔티티
- **InstituteDonation**: 기관 기부 엔티티
- **OpinionLeaderSupport**: 오피니언 리더 후원 엔티티
- **DonationCertificate**: 기부 증명서 엔티티
- **TransparencyReport**: 투명성 보고서 엔티티

### Value Objects
- **DonationId**: 기부 식별자
- **DonationAmount**: 기부 금액
- **DonationCategory**: 기부 카테고리 (의류, 식품, 주거, 의료, 교육, 기타)
- **DonationStatus**: 기부 상태
- **InstituteCategory**: 기관 카테고리
- **SupportCategory**: 후원 카테고리

## 외부 의존성

### Inbound (다른 도메인으로부터)
- **User Domain**: 기부자 정보
- **Payment Domain**: PMC 포인트 차감 및 보상

### Outbound (다른 도메인으로)
- **Payment Domain**: 포인트 사용 및 적립 이벤트
- **User Domain**: 기부 활동 이력 업데이트

## 도메인 이벤트

### 발행하는 이벤트
- `DonationCreated`: 기부 생성됨
- `DonationCompleted`: 기부 완료됨
- `DonationCancelled`: 기부 취소됨
- `InstituteRegistered`: 기관 등록됨
- `OpinionLeaderRegistered`: 오피니언 리더 등록됨
- `CertificateIssued`: 증명서 발급됨
- `TransparencyReportPublished`: 투명성 보고서 발행됨

### 구독하는 이벤트
- `PointsUpdated`: 포인트 업데이트 (Payment Domain)
- `UserProfileUpdated`: 사용자 프로필 업데이트 (User Domain)

## 비즈니스 규칙

### 기부 규칙
1. PMC 포인트가 충분해야 기부 가능
2. 기부 최소 금액은 1,000원 상당
3. 기부 취소는 기부 완료 전에만 가능
4. 정기 기부는 월 단위로 설정

### 포인트 보상 규칙
1. 기부 금액 대비 포인트 지급 (1,000원당 10포인트)
2. 정기 기부자 우대 혜택
3. 연간 기부 실적에 따른 등급별 보너스

### 투명성 규칙
1. 모든 기부금 사용 내역 공개
2. 월별 투명성 보고서 발행
3. 기부 효과 분석 리포트 제공

## 기술적 제약사항

### 성능 요구사항
- 기부 처리 응답시간: 3초 이내
- 기부 내역 조회: 1초 이내
- 실시간 기부 현황 업데이트

### 보안 요구사항
- 기부자 개인정보 보호
- 기부 내역 암호화 저장
- 기부 증명서 위변조 방지

### 확장성 요구사항
- 동시 기부 처리: 1,000건/분
- 기부 내역 데이터 보관: 10년
- 다국가 기부 기관 확장 가능

## 아키텍처 결정사항

### 데이터 저장
- PostgreSQL: 기부 내역 및 메타데이터
- Redis: 실시간 기부 현황 캐시

### 외부 연동
- 기부 기관 API 연동
- 세금 계산서 발급 시스템
- SNS 공유 API

### 이벤트 처리
- 도메인 이벤트 기반 비동기 처리
- 기부 완료 시 즉시 알림 발송
