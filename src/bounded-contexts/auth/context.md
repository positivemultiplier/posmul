# Auth Bounded Context

## 책임 (Responsibilities)
- 사용자 인증 및 권한 관리
- 세션 관리
- JWT 토큰 처리
- Supabase Auth 연동

## 핵심 엔티티 (Core Entities)
- **AuthSession**: 인증 세션
- **UserCredentials**: 사용자 인증 정보
- **Permission**: 권한
- **Role**: 역할

## 주요 값 객체 (Value Objects)
- **AccessToken**: 액세스 토큰
- **RefreshToken**: 리프레시 토큰
- **AuthProvider**: 인증 제공자 (이메일, 구글, 깃허브 등)
- **SessionId**: 세션 식별자

## 바운디드 컨텍스트 경계
- **포함**: 인증, 권한, 세션 관련 비즈니스 로직
- **제외**: 사용자 프로필, 예측, 결제

## 외부 의존성
- Supabase Auth
- User Context (사용자 기본 정보 연동)

## 도메인 이벤트
- UserLoggedIn
- UserLoggedOut
- SessionExpired
- PermissionGranted
- PermissionRevoked
