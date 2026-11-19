-- ============================================================================
-- Phase 3: DB 성능 및 위생 최적화 마이그레이션 (2026-11-19)
-- 1. 중복 인덱스(duplicate_index) 4건 전량 제거
-- 2. 주요 미인덱싱 외래키(unindexed_foreign_keys) 커버링 인덱스 추가
-- ============================================================================

-- 1. 중복 인덱스 제거 (4건)
DROP INDEX IF EXISTS donation.idx_donations_opinion_leader_id;
DROP INDEX IF EXISTS study_cycle.sc_study_sessions_chapter_id_idx;
DROP INDEX IF EXISTS study_cycle.sc_study_sessions_textbook_id_idx;
DROP INDEX IF EXISTS study_cycle.sc_study_sessions_user_id_idx;

-- 2. 핵심 미인덱싱 외래키 커버링 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_feed_items_source_id ON feed.items (source_id);
CREATE INDEX IF NOT EXISTS idx_funding_wishlist_requests_project_id ON donation.funding_wishlist_requests (project_id);
CREATE INDEX IF NOT EXISTS idx_direct_donation_progress_item_id ON donation.direct_donation_progress (item_id);
CREATE INDEX IF NOT EXISTS idx_direct_donation_progress_created_by ON donation.direct_donation_progress (created_by);
CREATE INDEX IF NOT EXISTS idx_donation_recipients_user_id ON donation.donation_recipients (user_id);
CREATE INDEX IF NOT EXISTS idx_opinion_leader_followers_user_id ON donation.opinion_leader_followers (follower_user_id);
CREATE INDEX IF NOT EXISTS idx_settlement_history_settled_by ON prediction.settlement_history (settled_by);
CREATE INDEX IF NOT EXISTS idx_oauth_auth_codes_client_id ON oauth_provider.auth_codes (client_id);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_client_id ON oauth_provider.tokens (client_id);
CREATE INDEX IF NOT EXISTS idx_vertical_housing_ai_scan_logs_serial_id ON vertical_housing.ai_scan_logs (serial_id);
CREATE INDEX IF NOT EXISTS idx_consume_funding_projects_creator_id ON consume.funding_projects (creator_id);
CREATE INDEX IF NOT EXISTS idx_consume_local_stores_owner_id ON consume.local_stores (owner_id);
CREATE INDEX IF NOT EXISTS idx_demographic_stat_links_region_code ON demographic_data.prediction_stat_links (region_code);
CREATE INDEX IF NOT EXISTS idx_demographic_statistics_source_id ON demographic_data.statistics (source_id);
CREATE INDEX IF NOT EXISTS idx_public_wrong_answers_quiz_id ON public.wrong_answers (quiz_id);
