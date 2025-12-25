# Donation Bounded Context

## 도메인 개요

Donation Context는 사용자가 획득한 PMC를 사용하여 기부 활동을 수행하는 도메인입니다. 직접 기부, 기관 기부, 오피니언 리더 후원 등 다양한 기부 형태를 지원합니다.

## 핵심 엔티티

- **Donation**: 기부 트랜잭션 (기부자, 수혜자, 금액, 메시지)
- **Institute**: 기부 대상 기관 (자선 단체 등)
- **OpinionLeader**: 후원 대상 오피니언 리더

## 주요 서비스

- **CreateDonation**: 기부 실행
- **GetDonation / ListDonations**: 기부 내역 조회
- **DonationRepository**: 기부 데이터 관리

## 외부 의존성

- **Economy Context**: PMC 자산 차감 확인
- **User Context**: 사용자 정보 확인
- **Auth Context**: 인증
