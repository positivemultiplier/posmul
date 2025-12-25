# Auth Bounded Context

## 책임 (Responsibilities)

- 사용자 인증 및 권한 관리
- 세션 관리
- JWT 토큰 처리
- Supabase Auth 연동
- **사용자 기본 정보 및 자산 관리 (User Entity)**
    - 역할(Role) 관리
    - PMP/PMC 포인트 잔액 관리 (참고: 경제 시스템과 연동 필요)

## 핵심 엔티티 (Core Entities)

- **User**: 사용자 (ID, Email, Role, PMP/PMC Balance, Status)
- **AuthSession**: 인증 세션
- **UserCredentials**: 사용자 인증 정보
- **Permission**: 권한
- **Role**: 역할

## 주요 값 객체 (Value Objects)

- **AccessToken**: 액세스 토큰
- **RefreshToken**: 리프레시 토큰
- **AuthProvider**: 인증 제공자 (이메일, 구글, 깃허브 등)
- **SessionId**: 세션 식별자
- **UserId**: 사용자 ID
- **Email**: 이메일 주소

## 바운디드 컨텍스트 경계

- **포함**: 인증, 권한, 세션, 사용자 기본 자산(User Entity)
- **제외**: 상세 사용자 프로필(User Context), 예측 게임 로직, 상세 경제 트랜잭션

## 외부 의존성

- Supabase Auth
- Economy Context (자산 변경 이벤트 등)

## 도메인 이벤트

- UserLoggedIn
- UserLoggedOut
- SessionExpired
- PermissionGranted
- PermissionRevoked
- UserCreated
