# User Bounded Context

## 책임 (Responsibilities)

- 사용자 프로필 관리
- 사용자 활동 기록
- 사용자 통계 및 랭킹
- 사용자 설정 관리

## 핵심 엔티티 (Core Entities)

- **User**: 사용자 애그리게이트 루트
- **UserProfile**: 사용자 프로필
- **UserActivity**: 사용자 활동 기록
- **UserStatistics**: 사용자 통계

## 주요 값 객체 (Value Objects)

- **UserId**: 사용자 고유 식별자
- **Nickname**: 사용자 닉네임
- **UserLevel**: 사용자 레벨
- **ReputationScore**: 평판 점수

## 바운디드 컨텍스트 경계

- **포함**: 사용자 프로필, 활동 기록, 통계 관련 비즈니스 로직
- **제외**: 인증, 예측, 결제

## 외부 의존성

- Auth Context (인증 정보 연동)
- Prediction Context (예측 활동 기록)
- Payment Context (포인트 현황)

## 도메인 이벤트

- UserRegistered
- UserProfileUpdated
- UserLevelChanged
- UserStatisticsUpdated
