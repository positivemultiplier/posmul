-- =====================================================
-- Prediction Schema 생성 마이그레이션
-- DDD 원칙에 따라 bounded context별 독립 스키마 사용
-- =====================================================

-- 1. prediction 스키마 생성
CREATE SCHEMA IF NOT EXISTS prediction;

-- 2. 스키마 설명
COMMENT ON SCHEMA prediction IS 'PosMul Prediction Domain - DDD Bounded Context Schema';

-- 3. 필요한 확장 기능 활성화 (스키마별로 필요)
-- 참고: gen_random_uuid()는 전역 함수이므로 별도 설정 불필요

-- 4. 마이그레이션 완료 확인용 테이블 (옵션)
CREATE TABLE IF NOT EXISTS prediction.schema_migrations (
    id SERIAL PRIMARY KEY,
    migration_name TEXT NOT NULL UNIQUE,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. 첫 마이그레이션 기록
INSERT INTO prediction.schema_migrations (migration_name)
VALUES ('000_create_prediction_schema')
ON CONFLICT (migration_name) DO NOTHING;
