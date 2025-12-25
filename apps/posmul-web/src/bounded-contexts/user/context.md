# User Bounded Context

## 책임 (Responsibilities)

- 사용자 프로필 관리 (UserProfile)
- 사용자 통계 및 상태 관리
- MCP 기반 사용자 데이터 접근

## 핵심 엔티티 (Core Entities)

- **UserProfile**: 사용자 상세 프로필 (DisplayName, Avatar, Bio 등)
- **UserStatistics**: 사용자 활동 통계
- **User**: (참고: 기본 인증 및 자산 정보는 Auth Context의 User Entity가 담당할 수 있음, 여기서는 프로필 관점)

## Repository & Infra

- **MCPUserRepository**: `users` 테이블에 대한 MCP 기반 접근
- **SupabaseUserRepository**: (Legacy/Alternative) Supabase 클라이언트 기반 접근

## 바운디드 컨텍스트 경계

- **포함**: 프로필 상세, 통계, 설정
- **제외**: 인증(Auth), 포인트 잔액(Auth/Economy)

## 외부 의존성

- Auth Context
- Prediction Context (통계 집계용)
