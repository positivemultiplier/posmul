# Public Bounded Context

## 도메인 개요

Public Context는 플랫폼 전반에서 공용으로 사용되는 데이터나 기능을 담당하거나, 공개된 데이터 접근을 관리합니다.

## 현재 구현 상태

- **Repository**: `infrastructure/repositories/prediction.repository.ts` (일부 공용 조회 로직이 포함될 수 있음)
- **Types**: `types/supabase-public.ts`

## 주요 책임

- 공용 데이터 제공
- 비로그인 사용자 접근 허용 데이터 관리
