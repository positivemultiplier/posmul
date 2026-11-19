-- =============================================================================
-- PosMul Supabase PostgreSQL DR Schema Baseline Snapshot
-- Generated At: 2026-11-19 (after Phase 0~3 & orphan account archive)
-- Source Project: posmul (fabyagohqqnusmnwekuc, PostgreSQL 17.4.1.064)
-- Coverage: 14 schemas, 129 tables, 5 enums, 3 views, 57 functions, 22 triggers, 221 indexes, 180 RLS policies
-- Remote Migrations Recorded: 179
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Schemas
-- -----------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS "assessment";
CREATE SCHEMA IF NOT EXISTS "consume";
CREATE SCHEMA IF NOT EXISTS "demographic_data";
CREATE SCHEMA IF NOT EXISTS "donation";
CREATE SCHEMA IF NOT EXISTS "economy";
CREATE SCHEMA IF NOT EXISTS "feed";
CREATE SCHEMA IF NOT EXISTS "forum";
CREATE SCHEMA IF NOT EXISTS "oauth_provider";
CREATE SCHEMA IF NOT EXISTS "prediction";
CREATE SCHEMA IF NOT EXISTS "ranking";
CREATE SCHEMA IF NOT EXISTS "study_cycle";
CREATE SCHEMA IF NOT EXISTS "user";
CREATE SCHEMA IF NOT EXISTS "vertical_housing";

-- -----------------------------------------------------------------------------
-- 2. Extensions
-- -----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;

-- -----------------------------------------------------------------------------
-- 3. Custom ENUM Types
-- -----------------------------------------------------------------------------
CREATE TYPE demographic_data.stat_category AS ENUM ('BIRTH', 'DEATH', 'MARRIAGE', 'DIVORCE', 'MIGRATION_IN', 'MIGRATION_OUT', 'EMPLOYMENT', 'UNEMPLOYMENT', 'LABOR_FORCE', 'CPI', 'POPULATION');
CREATE TYPE public.game_status AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED', 'SETTLING', 'SETTLED', 'CANCELLED');
CREATE TYPE public.prediction_category AS ENUM ('INVEST', 'ECONOMY', 'SPORTS', 'ENTERTAINMENT', 'POLITICS', 'USER_PROPOSED');
CREATE TYPE public.prediction_type AS ENUM ('BINARY', 'WIN_DRAW_LOSE', 'RANKING');
CREATE TYPE public.settlement_type AS ENUM ('WINNER_TAKE_ALL', 'PROPORTIONAL', 'CONFIDENCE_WEIGHTED', 'HYBRID');

-- -----------------------------------------------------------------------------
-- 4. Tables
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "assessment"."assessments" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "creator_id" uuid NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "total_points" integer DEFAULT 0 NOT NULL,
  "status" text DEFAULT 'draft'::text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "assessment"."questions" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "assessment_id" uuid NOT NULL,
  "type" text NOT NULL,
  "title" text NOT NULL,
  "content" jsonb,
  "options" jsonb,
  "correct_answer" jsonb,
  "points" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "assessment"."submissions" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "assessment_id" uuid NOT NULL,
  "student_id" uuid NOT NULL,
  "status" text NOT NULL,
  "answers" jsonb,
  "final_score" integer,
  "started_at" timestamp with time zone NOT NULL,
  "submitted_at" timestamp with time zone,
  "time_spent" integer,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "consume"."ad_campaigns" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "advertiser_name" text NOT NULL,
  "video_url" text,
  "thumbnail_url" text,
  "duration_seconds" integer DEFAULT 30 NOT NULL,
  "pmp_reward" integer DEFAULT 10 NOT NULL,
  "pmp_reward_full" integer DEFAULT 15 NOT NULL,
  "survey_pmp_bonus" integer DEFAULT 100,
  "daily_view_limit" integer DEFAULT 10,
  "total_budget" integer DEFAULT 10000,
  "used_budget" integer DEFAULT 0,
  "status" text DEFAULT 'ACTIVE'::text NOT NULL,
  "start_date" timestamp with time zone DEFAULT now(),
  "end_date" timestamp with time zone,
  "target_demographics" jsonb,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "consume"."ad_views" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "campaign_id" uuid NOT NULL,
  "view_date" date DEFAULT CURRENT_DATE NOT NULL,
  "started_at" timestamp with time zone DEFAULT now() NOT NULL,
  "ended_at" timestamp with time zone,
  "watch_duration_seconds" integer DEFAULT 0,
  "completion_rate" numeric(5,2) DEFAULT 0,
  "is_completed" boolean DEFAULT false,
  "survey_completed" boolean DEFAULT false,
  "pmp_earned" integer DEFAULT 0,
  "device_info" jsonb,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "consume"."consume_categories" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "parent_category_id" uuid,
  "risk_multiplier" numeric(3,2) DEFAULT 1.0,
  "pmc_reward_multiplier" numeric(3,2) DEFAULT 1.0,
  "minimum_investment_default" numeric(15,2),
  "is_active" boolean DEFAULT true,
  "display_order" integer DEFAULT 0,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "consume"."consume_opportunities" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "creator_id" uuid NOT NULL,
  "title" text NOT NULL,
  "description" text NOT NULL,
  "consume_type" text NOT NULL,
  "category" text NOT NULL,
  "subcategory" text,
  "target_amount" numeric(15,2) NOT NULL,
  "minimum_investment" numeric(15,2) NOT NULL,
  "maximum_investment" numeric(15,2),
  "current_amount" numeric(15,2) DEFAULT 0,
  "funding_start_date" timestamp with time zone NOT NULL,
  "funding_end_date" timestamp with time zone NOT NULL,
  "expected_return_date" timestamp with time zone,
  "expected_return_rate" numeric(5,2),
  "risk_level" integer NOT NULL,
  "status" text DEFAULT 'DRAFT'::text NOT NULL,
  "pmp_required" boolean DEFAULT false,
  "pmc_reward_pool" numeric(15,2) DEFAULT 0,
  "money_wave_eligible" boolean DEFAULT true,
  "performance_metrics" jsonb DEFAULT '{}'::jsonb,
  "tags" text[],
  "external_links" jsonb DEFAULT '{}'::jsonb,
  "documents" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  "version" integer DEFAULT 1
);

CREATE TABLE IF NOT EXISTS "consume"."consume_participations" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "opportunity_id" uuid NOT NULL,
  "investor_id" uuid NOT NULL,
  "investment_amount" numeric(15,2) NOT NULL,
  "currency_type" text NOT NULL,
  "pmp_amount" bigint DEFAULT 0,
  "pmc_amount" numeric(15,2) DEFAULT 0,
  "expected_return" numeric(15,2),
  "actual_return" numeric(15,2) DEFAULT 0,
  "return_date" timestamp with time zone,
  "status" text DEFAULT 'ACTIVE'::text NOT NULL,
  "roi_percentage" numeric(5,2),
  "performance_score" numeric(3,2) DEFAULT 0,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "consume"."consume_performance_metrics" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "opportunity_id" uuid NOT NULL,
  "measurement_date" timestamp with time zone DEFAULT now() NOT NULL,
  "reporting_period_start" date NOT NULL,
  "reporting_period_end" date NOT NULL,
  "revenue" numeric(15,2) DEFAULT 0,
  "profit" numeric(15,2) DEFAULT 0,
  "ebitda" numeric(15,2),
  "user_growth_rate" numeric(5,2),
  "market_share" numeric(5,2),
  "customer_acquisition_cost" numeric(10,2),
  "burn_rate" numeric(15,2),
  "runway_months" integer,
  "job_creation_count" integer DEFAULT 0,
  "social_impact_score" numeric(3,2),
  "environmental_impact_score" numeric(3,2),
  "risk_assessment" numeric(3,2),
  "compliance_score" numeric(3,2),
  "data_source" text,
  "verification_status" text DEFAULT 'PENDING'::text,
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "consume"."contributions" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "project_id" uuid NOT NULL,
  "amount" numeric(15,2) NOT NULL,
  "pmc_earned" numeric(15,2) NOT NULL,
  "status" character varying(20) DEFAULT 'COMPLETED'::character varying,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "consume"."daily_view_stats" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "view_date" date DEFAULT CURRENT_DATE NOT NULL,
  "total_views" integer DEFAULT 0,
  "completed_views" integer DEFAULT 0,
  "total_watch_time" integer DEFAULT 0,
  "total_pmp_earned" integer DEFAULT 0,
  "survey_count" integer DEFAULT 0,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "consume"."funding_contributions" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "project_id" uuid NOT NULL,
  "amount" numeric NOT NULL,
  "pmc_earned" numeric DEFAULT 0 NOT NULL,
  "reward_tier" text,
  "payment_method" text DEFAULT 'PMC'::text,
  "status" text DEFAULT 'COMPLETED'::text NOT NULL,
  "message" text,
  "is_anonymous" boolean DEFAULT false,
  "contributed_at" timestamp with time zone DEFAULT now(),
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "consume"."funding_projects" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "creator_id" uuid NOT NULL,
  "title" text NOT NULL,
  "description" text NOT NULL,
  "category" text NOT NULL,
  "target_amount" numeric NOT NULL,
  "current_amount" numeric DEFAULT 0,
  "min_contribution" numeric DEFAULT 1000,
  "pmc_rate" numeric(5,4) DEFAULT 0.05 NOT NULL,
  "image_url" text,
  "video_url" text,
  "start_date" timestamp with time zone DEFAULT now(),
  "end_date" timestamp with time zone NOT NULL,
  "status" text DEFAULT 'ACTIVE'::text NOT NULL,
  "backer_count" integer DEFAULT 0,
  "rewards" jsonb,
  "updates" jsonb,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  "max_contribution" numeric(15,2) DEFAULT 10000000
);

CREATE TABLE IF NOT EXISTS "consume"."local_stores" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "category" text NOT NULL,
  "address" text NOT NULL,
  "phone" text,
  "image_url" text,
  "pmc_rate" numeric(5,4) DEFAULT 0.01 NOT NULL,
  "is_active" boolean DEFAULT true,
  "business_hours" jsonb,
  "location_lat" numeric(10,7),
  "location_lng" numeric(10,7),
  "owner_id" uuid,
  "total_sales" numeric DEFAULT 0,
  "total_pmc_issued" numeric DEFAULT 0,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "consume"."payments" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "store_id" uuid NOT NULL,
  "payment_amount" numeric NOT NULL,
  "pmc_earned" numeric DEFAULT 0 NOT NULL,
  "payment_method" text DEFAULT 'QR'::text NOT NULL,
  "status" text DEFAULT 'COMPLETED'::text NOT NULL,
  "receipt_number" text,
  "transaction_id" text,
  "payment_date" timestamp with time zone DEFAULT now(),
  "metadata" jsonb,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "demographic_data"."data_sources" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "name" character varying(100) NOT NULL,
  "api_base_url" text,
  "api_key_env" character varying(100),
  "rate_limit_per_day" integer,
  "is_active" boolean DEFAULT true,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "demographic_data"."prediction_stat_links" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "prediction_game_id" uuid NOT NULL,
  "category" demographic_data.stat_category NOT NULL,
  "region_code" character varying(10),
  "target_period_year" integer NOT NULL,
  "target_period_month" integer,
  "target_period_quarter" integer,
  "is_result_source" boolean DEFAULT false,
  "actual_value" numeric(20,4),
  "confirmed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "demographic_data"."statistics" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "source_id" uuid,
  "region_code" character varying(10),
  "category" demographic_data.stat_category NOT NULL,
  "period_type" character varying(20) NOT NULL,
  "period_year" integer NOT NULL,
  "period_month" integer,
  "period_quarter" integer,
  "value" numeric(20,4) NOT NULL,
  "unit" character varying(50),
  "is_preliminary" boolean DEFAULT true,
  "metadata" jsonb,
  "collected_at" timestamp with time zone DEFAULT now(),
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "donation"."direct_donation_items" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "donor_user_id" uuid NOT NULL,
  "title" character varying(200) NOT NULL,
  "description" text,
  "category" character varying(50) NOT NULL,
  "condition" character varying(30) DEFAULT 'good'::character varying NOT NULL,
  "quantity" integer DEFAULT 1 NOT NULL,
  "estimated_value" numeric(12,2),
  "images" jsonb DEFAULT '[]'::jsonb,
  "location_city" character varying(50),
  "location_district" character varying(50),
  "status" character varying(30) DEFAULT 'available'::character varying NOT NULL,
  "matched_recipient_id" uuid,
  "matched_at" timestamp with time zone,
  "completed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "donation"."direct_donation_progress" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "item_id" uuid NOT NULL,
  "status" character varying(30) NOT NULL,
  "description" text,
  "evidence_images" jsonb DEFAULT '[]'::jsonb,
  "created_at" timestamp with time zone DEFAULT now(),
  "created_by" uuid
);

CREATE TABLE IF NOT EXISTS "donation"."direct_donation_requests" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "item_id" uuid NOT NULL,
  "recipient_id" uuid NOT NULL,
  "request_message" text,
  "status" character varying(30) DEFAULT 'pending'::character varying NOT NULL,
  "donor_response" text,
  "responded_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "donation"."donation_activity_logs" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "donation_id" uuid NOT NULL,
  "activity_type" text NOT NULL,
  "description" text NOT NULL,
  "metadata" jsonb,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "donation"."donation_certificates" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "donation_id" uuid NOT NULL,
  "donor_id" uuid NOT NULL,
  "certificate_number" text NOT NULL,
  "tax_deductible_amount" numeric(15,2) DEFAULT 0 NOT NULL,
  "issue_date" date DEFAULT CURRENT_DATE NOT NULL,
  "pdf_url" text,
  "verification_hash" text NOT NULL,
  "is_valid" boolean DEFAULT true,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "donation"."donation_institutes" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "category" text NOT NULL,
  "website_url" text,
  "contact_email" text,
  "contact_phone" text,
  "registration_number" text,
  "trust_score" numeric(3,2) DEFAULT 0.0,
  "is_verified" boolean DEFAULT false,
  "is_active" boolean DEFAULT true,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "donation"."donation_recipients" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid,
  "display_name" character varying(100) NOT NULL,
  "bio" text,
  "avatar_url" text,
  "needed_categories" jsonb DEFAULT '[]'::jsonb,
  "location_city" character varying(50),
  "location_district" character varying(50),
  "is_verified" boolean DEFAULT false,
  "verified_at" timestamp with time zone,
  "verification_notes" text,
  "total_received" integer DEFAULT 0,
  "is_active" boolean DEFAULT true,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "donation"."donations" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "donor_id" uuid NOT NULL,
  "donation_type" text NOT NULL,
  "amount" numeric(15,2) NOT NULL,
  "pmc_amount" numeric(15,2) NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "category" text NOT NULL,
  "status" text DEFAULT 'pending'::text NOT NULL,
  "recipient_info" jsonb,
  "delivery_address" text,
  "institute_id" uuid,
  "opinion_leader_id" uuid,
  "support_message" text,
  "is_anonymous" boolean DEFAULT false,
  "is_recurring" boolean DEFAULT false,
  "recurring_period" text,
  "certificate_issued" boolean DEFAULT false,
  "certificate_id" uuid,
  "metadata" jsonb,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  "completed_at" timestamp with time zone,
  "cancelled_at" timestamp with time zone
);

CREATE TABLE IF NOT EXISTS "donation"."funding_projects" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "title" character varying(255) NOT NULL,
  "description" text,
  "category" character varying(50),
  "target_beneficiary" character varying(100),
  "product_name" character varying(100) NOT NULL,
  "manufacturer" character varying(100),
  "unit_price" integer NOT NULL,
  "target_quantity" integer NOT NULL,
  "current_quantity" integer DEFAULT 0,
  "status" character varying(20) DEFAULT 'ongoing'::character varying,
  "images" jsonb DEFAULT '[]'::jsonb,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "donation"."funding_wishlist_requests" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "project_id" uuid,
  "facility_name" character varying(200) NOT NULL,
  "facility_type" character varying(100) NOT NULL,
  "region_city" character varying(50) NOT NULL,
  "region_district" character varying(50) NOT NULL,
  "contact_person" character varying(100) NOT NULL,
  "contact_phone" character varying(50) NOT NULL,
  "business_license_number" character varying(50),
  "needed_quantity" integer DEFAULT 1 NOT NULL,
  "story" text NOT NULL,
  "status" character varying(50) DEFAULT 'pending'::character varying NOT NULL,
  "admin_notes" text,
  "verified_at" timestamp with time zone,
  "current_funded_amount" integer DEFAULT 0,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "donation"."opinion_leader_endorsements" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "opinion_leader_id" uuid NOT NULL,
  "institute_id" uuid NOT NULL,
  "endorsement_message" text,
  "endorsed_at" timestamp with time zone DEFAULT now(),
  "is_active" boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS "donation"."opinion_leader_followers" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "opinion_leader_id" uuid NOT NULL,
  "follower_user_id" uuid NOT NULL,
  "followed_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "donation"."opinion_leaders" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "display_name" character varying(100) NOT NULL,
  "bio" text,
  "avatar_url" text,
  "social_links" jsonb DEFAULT '{}'::jsonb,
  "verified_at" timestamp with time zone,
  "is_active" boolean DEFAULT true,
  "follower_count" integer DEFAULT 0,
  "total_donations_influenced" numeric(18,2) DEFAULT 0,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  "category" character varying(50) DEFAULT 'general'::character varying
);

CREATE TABLE IF NOT EXISTS "economy"."account_activity_stats" (
  "user_id" uuid NOT NULL,
  "last_login_date" timestamp with time zone,
  "last_transaction_date" timestamp with time zone,
  "transaction_count" integer DEFAULT 0 NOT NULL,
  "total_pmp_earned" bigint DEFAULT 0 NOT NULL,
  "total_pmc_converted" numeric(18,8) DEFAULT 0 NOT NULL,
  "average_activity_score" numeric(5,3) DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "economy"."archived_orphan_account_activity_stats" (
  "user_id" uuid NOT NULL,
  "last_login_date" timestamp with time zone,
  "last_transaction_date" timestamp with time zone,
  "transaction_count" integer DEFAULT 0 NOT NULL,
  "total_pmp_earned" bigint DEFAULT 0 NOT NULL,
  "total_pmc_converted" numeric(18,8) DEFAULT 0 NOT NULL,
  "average_activity_score" numeric(5,3) DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "archived_at" timestamp with time zone DEFAULT now() NOT NULL,
  "archive_reason" text DEFAULT 'orphan_no_auth_user_20261119'::text NOT NULL
);

CREATE TABLE IF NOT EXISTS "economy"."archived_orphan_accounts" (
  "user_id" uuid NOT NULL,
  "pmp_balance" bigint DEFAULT 0 NOT NULL,
  "pmc_balance" numeric(18,8) DEFAULT 0 NOT NULL,
  "last_updated" timestamp with time zone DEFAULT now() NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "archived_at" timestamp with time zone DEFAULT now() NOT NULL,
  "archive_reason" text DEFAULT 'orphan_no_auth_user_20261119'::text NOT NULL
);

CREATE TABLE IF NOT EXISTS "economy"."archived_orphan_transactions" (
  "transaction_id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "transaction_type" text NOT NULL,
  "pmp_amount" bigint,
  "pmc_amount" numeric(18,8),
  "description" text NOT NULL,
  "timestamp" timestamp with time zone DEFAULT now() NOT NULL,
  "related_money_wave_id" uuid,
  "metadata" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "archived_at" timestamp with time zone DEFAULT now() NOT NULL,
  "archive_reason" text DEFAULT 'orphan_no_auth_user_20261119'::text NOT NULL
);

CREATE TABLE IF NOT EXISTS "economy"."individual_utility_parameters" (
  "user_id" uuid NOT NULL,
  "alpha" numeric(8,6) DEFAULT 0.5 NOT NULL,
  "beta" numeric(8,6) DEFAULT 0.3 NOT NULL,
  "gamma" numeric(8,6) DEFAULT 0.2 NOT NULL,
  "delta" numeric(8,6) DEFAULT 0.5 NOT NULL,
  "epsilon" numeric(8,6) DEFAULT 0.3 NOT NULL,
  "theta" numeric(8,6) DEFAULT 0.95 NOT NULL,
  "rho" numeric(8,6) DEFAULT 2.0 NOT NULL,
  "sigma" numeric(8,6) DEFAULT 0.5 NOT NULL,
  "last_updated" timestamp with time zone DEFAULT now() NOT NULL,
  "estimation_confidence" numeric(5,3) DEFAULT 0 NOT NULL,
  "data_quality" text DEFAULT 'LOW'::text NOT NULL,
  "observation_count" integer DEFAULT 0 NOT NULL,
  "r_squared" numeric(5,4),
  "estimation_method" text DEFAULT 'MAXIMUM_LIKELIHOOD'::text,
  "last_estimation_date" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "economy"."money_wave1_ebit_records" (
  "record_id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "wave_id" uuid NOT NULL,
  "organization_id" uuid,
  "organization_name" text NOT NULL,
  "ebit_amount" numeric(18,8) NOT NULL,
  "revenue" numeric(18,8),
  "operating_expenses" numeric(18,8),
  "verification_status" text NOT NULL,
  "verification_method" text,
  "pmc_allocation_rate" numeric(5,4) NOT NULL,
  "pmc_issued" numeric(18,8) NOT NULL,
  "agency_cost_reduction" numeric(5,3),
  "transparency_bonus" numeric(5,3),
  "reporting_period_start" date NOT NULL,
  "reporting_period_end" date NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "economy"."money_wave2_redistribution_records" (
  "record_id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "wave_id" uuid NOT NULL,
  "source_user_id" uuid NOT NULL,
  "target_user_id" uuid NOT NULL,
  "pmc_amount" numeric(18,8) NOT NULL,
  "redistribution_reason" text NOT NULL,
  "social_impact_score" numeric(5,3),
  "welfare_improvement" numeric(5,3),
  "rawls_justice_score" numeric(5,3),
  "pigou_efficiency_gain" numeric(5,3),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "economy"."money_wave3_entrepreneur_records" (
  "record_id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "wave_id" uuid NOT NULL,
  "entrepreneur_id" uuid NOT NULL,
  "venture_proposal_id" uuid,
  "investment_amount" numeric(18,8) NOT NULL,
  "innovation_score" numeric(5,3) NOT NULL,
  "disruption_potential" numeric(5,3) NOT NULL,
  "execution_capability" numeric(5,3) NOT NULL,
  "network_effect_potential" numeric(5,3) NOT NULL,
  "risk_assessment" numeric(5,3) NOT NULL,
  "expected_roi" numeric(5,3),
  "milestone_progress" numeric(5,3) DEFAULT 0,
  "job_creation_potential" integer,
  "social_impact_potential" numeric(5,3),
  "schumpeter_innovation_index" numeric(5,3),
  "kirzner_opportunity_index" numeric(5,3),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "economy"."money_wave3_ventures" (
  "venture_id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "owner_user_id" uuid,
  "title" text NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "metadata" jsonb
);

CREATE TABLE IF NOT EXISTS "economy"."money_wave_config" (
  "config_id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "timezone" text DEFAULT 'Asia/Seoul'::text NOT NULL,
  "algorithm_version" text DEFAULT 'v2_signals_based'::text NOT NULL,
  "annual_ebitda" numeric NOT NULL,
  "tax_rate" numeric DEFAULT 0 NOT NULL,
  "interest_rate" numeric DEFAULT 0 NOT NULL,
  "mw2_dormant_days" integer DEFAULT 30 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "economy"."money_wave_daily_snapshots" (
  "snapshot_id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "snapshot_date" date NOT NULL,
  "timezone" text DEFAULT 'Asia/Seoul'::text NOT NULL,
  "algorithm_version" text NOT NULL,
  "computed_at" timestamp with time zone DEFAULT now() NOT NULL,
  "annual_ebitda" numeric,
  "tax_rate" numeric,
  "interest_rate" numeric,
  "daily_pool_wave1_pmc" numeric NOT NULL,
  "daily_pool_wave2_pmc" numeric NOT NULL,
  "daily_pool_wave3_pmc" numeric NOT NULL,
  "daily_pool_total_pmc" numeric NOT NULL,
  "hourly_pool_total_pmc" numeric NOT NULL,
  "metadata" jsonb
);

CREATE TABLE IF NOT EXISTS "economy"."money_wave_effectiveness" (
  "analysis_id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "wave_id" uuid NOT NULL,
  "gdp_impact" numeric(10,3),
  "employment_impact" integer,
  "productivity_gain" numeric(5,3),
  "innovation_boost" numeric(5,3),
  "inequality_reduction" numeric(5,3),
  "social_mobility_improvement" numeric(5,3),
  "public_welfare_enhancement" numeric(5,3),
  "democratic_participation_increase" numeric(5,3),
  "transparency_improvement" numeric(5,3),
  "agency_cost_reduction" numeric(5,3),
  "information_asymmetry_reduction" numeric(5,3),
  "collective_intelligence_gain" numeric(5,3),
  "behavioral_bias_correction" numeric(5,3),
  "decision_quality_improvement" numeric(5,3),
  "social_learning_acceleration" numeric(5,3),
  "analysis_period_start" timestamp with time zone NOT NULL,
  "analysis_period_end" timestamp with time zone NOT NULL,
  "confidence_interval" numeric(5,3),
  "statistical_significance" numeric(5,3),
  "methodology" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "economy"."money_wave_history" (
  "wave_id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "wave_type" text NOT NULL,
  "execution_date" timestamp with time zone DEFAULT now() NOT NULL,
  "status" text NOT NULL,
  "ebit_amount" numeric(18,8),
  "pmc_issued" numeric(18,8),
  "agency_score" numeric(5,3),
  "information_transparency" numeric(5,3),
  "prediction_accuracy" numeric(5,3),
  "social_learning_index" numeric(5,3),
  "dormant_pmc_amount" numeric(18,8),
  "redistribution_targets" jsonb,
  "social_welfare_improvement" numeric(5,3),
  "gini_coefficient_before" numeric(5,4),
  "gini_coefficient_after" numeric(5,4),
  "entrepreneur_count" integer,
  "total_investment_pool" numeric(18,8),
  "innovation_index" numeric(5,3),
  "venture_success_rate" numeric(5,3),
  "job_creation_impact" integer,
  "affected_users_count" integer DEFAULT 0 NOT NULL,
  "total_economic_impact" numeric(18,8),
  "effectiveness_score" numeric(5,3),
  "trigger_event" text,
  "execution_parameters" jsonb,
  "result_summary" jsonb,
  "error_details" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "economy"."money_wave_hourly_category_allocations" (
  "allocation_id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "hour_start" timestamp with time zone NOT NULL,
  "domain" text NOT NULL,
  "category" prediction_category,
  "pool_pmc" numeric NOT NULL,
  "algorithm_version" text NOT NULL,
  "computed_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "economy"."money_wave_hourly_game_pools" (
  "pool_id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "hour_start" timestamp with time zone NOT NULL,
  "domain" text NOT NULL,
  "game_id" uuid NOT NULL,
  "category" prediction_category NOT NULL,
  "subcategory" text,
  "league" text,
  "pool_pmc" numeric NOT NULL,
  "algorithm_version" text NOT NULL,
  "computed_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "economy"."pmp_pmc_accounts" (
  "user_id" uuid NOT NULL,
  "pmp_balance" bigint DEFAULT 0 NOT NULL,
  "pmc_balance" numeric(18,8) DEFAULT 0 NOT NULL,
  "last_updated" timestamp with time zone DEFAULT now() NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "economy"."pmp_pmc_transactions" (
  "transaction_id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "transaction_type" text NOT NULL,
  "pmp_amount" bigint,
  "pmc_amount" numeric(18,8),
  "description" text NOT NULL,
  "timestamp" timestamp with time zone DEFAULT now() NOT NULL,
  "related_money_wave_id" uuid,
  "metadata" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "economy"."prediction_category_multipliers" (
  "category" prediction_category NOT NULL,
  "reward_multiplier" numeric DEFAULT 1.0 NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "economy"."social_welfare_parameters" (
  "parameter_id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "lambda" numeric(8,6) DEFAULT 0.3 NOT NULL,
  "mu" numeric(8,6) DEFAULT 0.2 NOT NULL,
  "nu" numeric(8,6) DEFAULT 0.25 NOT NULL,
  "phi" numeric(8,6) DEFAULT 0.15 NOT NULL,
  "psi" numeric(8,6) DEFAULT 0.1 NOT NULL,
  "omega" numeric(8,6) DEFAULT 0.05 NOT NULL,
  "calculation_date" timestamp with time zone DEFAULT now() NOT NULL,
  "total_population" integer NOT NULL,
  "sample_size" integer NOT NULL,
  "statistical_significance" numeric(5,3),
  "confidence_interval" numeric(5,3),
  "current_social_welfare" numeric(10,3),
  "gini_coefficient" numeric(5,4),
  "social_mobility_index" numeric(5,3),
  "public_good_index" numeric(5,3),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "economy"."system_statistics" (
  "id" integer DEFAULT nextval('economy.system_statistics_id_seq'::regclass) NOT NULL,
  "snapshot_date" date NOT NULL,
  "total_pmp_supply" bigint NOT NULL,
  "total_pmc_supply" numeric(18,8) NOT NULL,
  "active_account_count" integer NOT NULL,
  "total_transaction_count" bigint NOT NULL,
  "gini_coefficient_pmp" numeric(5,4),
  "gini_coefficient_pmc" numeric(5,4),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "economy"."transparency_reports" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "institute_id" uuid,
  "opinion_leader_id" uuid,
  "report_period_start" date NOT NULL,
  "report_period_end" date NOT NULL,
  "total_received" numeric(15,2) DEFAULT 0 NOT NULL,
  "total_used" numeric(15,2) DEFAULT 0 NOT NULL,
  "usage_breakdown" jsonb NOT NULL,
  "impact_metrics" jsonb,
  "report_url" text,
  "published_at" timestamp with time zone DEFAULT now(),
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "economy"."utility_estimation_inputs" (
  "input_id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "action_type" text NOT NULL,
  "action_value" numeric(18,8) NOT NULL,
  "pmp_balance" numeric(18,8) NOT NULL,
  "pmc_balance" numeric(18,8) NOT NULL,
  "market_condition" text NOT NULL,
  "social_context" text NOT NULL,
  "time_of_day" text NOT NULL,
  "weekday" boolean NOT NULL,
  "satisfaction_score" numeric(3,1) NOT NULL,
  "regret_level" numeric(3,1) NOT NULL,
  "timestamp" timestamp with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "economy"."utility_predictions" (
  "prediction_id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "scenario_description" text NOT NULL,
  "pmp_amount" numeric(18,8) NOT NULL,
  "pmc_amount" numeric(18,8) NOT NULL,
  "donation_amount" numeric(18,8),
  "social_impact_score" numeric(5,3),
  "predicted_utility" numeric(10,6) NOT NULL,
  "confidence_interval_lower" numeric(10,6),
  "confidence_interval_upper" numeric(10,6),
  "prediction_accuracy" numeric(5,3),
  "peer_group_average" numeric(10,6),
  "population_percentile" numeric(5,3),
  "prediction_date" timestamp with time zone DEFAULT now() NOT NULL,
  "expiry_date" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "feed"."bills" (
  "bill_id" text NOT NULL,
  "bill_no" text NOT NULL,
  "bill_name" text NOT NULL,
  "proposer" text,
  "committee" text,
  "proc_result" text,
  "rgs_conf_rslt" text,
  "last_checked_at" timestamp with time zone DEFAULT now(),
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "feed"."items" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "source_id" uuid,
  "title" text NOT NULL,
  "link" text NOT NULL,
  "content_summary" text,
  "published_at" timestamp with time zone,
  "ai_classification" text,
  "process_status" text DEFAULT 'PENDING'::text,
  "processed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "feed"."rss_sources" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "title" text NOT NULL,
  "url" text NOT NULL,
  "category" text NOT NULL,
  "is_active" boolean DEFAULT true,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "forum"."banned_ips" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "ip_address" text NOT NULL,
  "reason" text DEFAULT '스팸 봇 / 도배 광고 차단'::text NOT NULL,
  "banned_by" text DEFAULT 'system'::text NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "expires_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "forum"."banned_words" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "word" character varying(100) NOT NULL,
  "reason" character varying(255) DEFAULT '부적절한 단어/욕설/도배'::character varying,
  "is_active" boolean DEFAULT true,
  "created_at" timestamp with time zone DEFAULT now(),
  "created_by" character varying(50) DEFAULT 'ADMIN'::character varying
);

CREATE TABLE IF NOT EXISTS "forum"."forum_activity_logs" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "activity_type" text NOT NULL,
  "post_id" uuid,
  "comment_id" uuid,
  "description" text NOT NULL,
  "pmp_earned" numeric(15,2) DEFAULT 0,
  "metadata" jsonb,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "forum"."forum_categories" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "icon_url" text,
  "sort_order" integer DEFAULT 0,
  "is_active" boolean DEFAULT true,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "forum"."forum_comments" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "post_id" uuid NOT NULL,
  "parent_comment_id" uuid,
  "author_id" uuid NOT NULL,
  "content" text NOT NULL,
  "depth" integer DEFAULT 0,
  "path" text NOT NULL,
  "status" text DEFAULT 'published'::text NOT NULL,
  "is_solution" boolean DEFAULT false,
  "like_count" integer DEFAULT 0,
  "dislike_count" integer DEFAULT 0,
  "reply_count" integer DEFAULT 0,
  "pmp_earned" numeric(15,2) DEFAULT 0,
  "quality_score" numeric(3,2) DEFAULT 0.0,
  "metadata" jsonb,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  "author_ip" text
);

CREATE TABLE IF NOT EXISTS "forum"."forum_post_tags" (
  "post_id" uuid NOT NULL,
  "tag_id" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "forum"."forum_posts" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "category_id" uuid NOT NULL,
  "author_id" uuid NOT NULL,
  "title" text NOT NULL,
  "content" text NOT NULL,
  "post_type" text DEFAULT 'discussion'::text NOT NULL,
  "tags" text[],
  "status" text DEFAULT 'published'::text NOT NULL,
  "is_pinned" boolean DEFAULT false,
  "is_locked" boolean DEFAULT false,
  "view_count" integer DEFAULT 0,
  "like_count" integer DEFAULT 0,
  "dislike_count" integer DEFAULT 0,
  "comment_count" integer DEFAULT 0,
  "pmp_earned" numeric(15,2) DEFAULT 0,
  "quality_score" numeric(3,2) DEFAULT 0.0,
  "metadata" jsonb,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  "last_activity_at" timestamp with time zone DEFAULT now(),
  "region_code" character varying(10),
  "section" character varying(20),
  "author_ip" text
);

CREATE TABLE IF NOT EXISTS "forum"."forum_prediction_links" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "forum_post_id" uuid NOT NULL,
  "prediction_game_id" uuid NOT NULL,
  "link_type" character varying(30) NOT NULL,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "forum"."forum_regions" (
  "code" character varying(10) NOT NULL,
  "name" character varying(100) NOT NULL,
  "parent_code" character varying(10),
  "level" character varying(20) NOT NULL,
  "population" bigint,
  "is_active" boolean DEFAULT true,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "forum"."forum_tags" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "color" text DEFAULT '#3B82F6'::text,
  "usage_count" integer DEFAULT 0,
  "is_active" boolean DEFAULT true,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "forum"."forum_votes" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "post_id" uuid,
  "comment_id" uuid,
  "vote_type" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "forum"."live_room_messages" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "room_id" text NOT NULL,
  "sender" text NOT NULL,
  "team_tag" text,
  "team_color" text,
  "message" text NOT NULL,
  "is_reaction" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "oauth_provider"."auth_codes" (
  "code" text DEFAULT (gen_random_uuid())::text NOT NULL,
  "client_id" uuid,
  "user_id" uuid NOT NULL,
  "redirect_uri" text NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "used_at" timestamp with time zone
);

CREATE TABLE IF NOT EXISTS "oauth_provider"."clients" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "secret" text NOT NULL,
  "redirect_uris" text[] NOT NULL,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "oauth_provider"."tokens" (
  "access_token" text DEFAULT (gen_random_uuid())::text NOT NULL,
  "refresh_token" text DEFAULT (gen_random_uuid())::text,
  "client_id" uuid,
  "user_id" uuid NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "prediction"."game_snapshots" (
  "id" bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  "game_id" uuid NOT NULL,
  "snapshot_time" timestamp with time zone DEFAULT now() NOT NULL,
  "option_id" text NOT NULL,
  "probability" numeric(5,2) DEFAULT 0 NOT NULL,
  "volume" numeric DEFAULT 0 NOT NULL,
  "total_volume" numeric DEFAULT 0 NOT NULL,
  "bet_count" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "prediction"."prediction_games" (
  "game_id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "creator_id" uuid NOT NULL,
  "title" text NOT NULL,
  "description" text NOT NULL,
  "category" prediction_category NOT NULL,
  "prediction_type" prediction_type NOT NULL,
  "game_options" jsonb NOT NULL,
  "difficulty" numeric(2,1) NOT NULL,
  "min_bet_amount" bigint NOT NULL,
  "max_bet_amount" bigint NOT NULL,
  "registration_start" timestamp with time zone NOT NULL,
  "registration_end" timestamp with time zone NOT NULL,
  "settlement_date" timestamp with time zone NOT NULL,
  "actual_result" jsonb,
  "status" game_status DEFAULT 'DRAFT'::game_status NOT NULL,
  "external_id" text,
  "data_source" text,
  "tags" text[],
  "metadata" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "slug" text NOT NULL,
  "subcategory" text,
  "league" text,
  "is_official" boolean DEFAULT false NOT NULL,
  "settlement_type" text DEFAULT 'manual'::text,
  "winning_option_id" text,
  "settled_at" timestamp with time zone
);

CREATE TABLE IF NOT EXISTS "prediction"."prediction_settlements" (
  "settlement_id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "game_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "prediction_id" uuid NOT NULL,
  "accuracy_score" numeric(5,2) NOT NULL,
  "reward_amount" numeric(20,8) NOT NULL,
  "settlement_type" settlement_type NOT NULL,
  "processed_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "prediction"."prediction_statistics" (
  "game_id" uuid NOT NULL,
  "total_participants" integer DEFAULT 0 NOT NULL,
  "total_bet_amount" bigint DEFAULT 0 NOT NULL,
  "option_distributions" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "trend_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "last_updated" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "prediction"."prediction_trends" (
  "trend_id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "game_id" uuid NOT NULL,
  "timestamp" timestamp with time zone DEFAULT now() NOT NULL,
  "snapshot_data" jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "prediction"."predictions" (
  "prediction_id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "game_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "prediction_data" jsonb NOT NULL,
  "confidence_level" integer NOT NULL,
  "bet_amount" bigint NOT NULL,
  "expected_reward" numeric(20,8) NOT NULL,
  "odds_at_time" numeric(10,4) NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "prediction"."scheduler_config" (
  "id" text DEFAULT 'default'::text NOT NULL,
  "master_auto_enabled" boolean DEFAULT true NOT NULL,
  "auto_template_sync_enabled" boolean DEFAULT true NOT NULL,
  "auto_rss_draft_enabled" boolean DEFAULT true NOT NULL,
  "auto_close_expired_enabled" boolean DEFAULT true NOT NULL,
  "auto_oracle_settle_enabled" boolean DEFAULT true NOT NULL,
  "auto_rss_ai_settle_enabled" boolean DEFAULT false NOT NULL,
  "auto_briefing_enabled" boolean DEFAULT true NOT NULL,
  "auto_void_stale_enabled" boolean DEFAULT true NOT NULL,
  "template_sync_cron" text DEFAULT '0 */3 * * *'::text NOT NULL,
  "rss_pipeline_cron" text DEFAULT '15 */3 * * *'::text NOT NULL,
  "settle_cron" text DEFAULT '*/15 * * * *'::text NOT NULL,
  "close_expired_cron" text DEFAULT '*/5 * * * *'::text NOT NULL,
  "enabled_categories" text[] DEFAULT ARRAY['ECONOMY'::text, 'INVEST'::text, 'SPORTS'::text, 'ENTERTAINMENT'::text, 'POLITICS'::text, 'USER_PROPOSED'::text] NOT NULL,
  "enable_football_source" boolean DEFAULT true NOT NULL,
  "enable_earnings_source" boolean DEFAULT true NOT NULL,
  "enable_dynamic_games" boolean DEFAULT true NOT NULL,
  "enabled_prediction_types" text[] DEFAULT ARRAY['BINARY'::text, 'WIN_DRAW_LOSE'::text, 'RANKING'::text] NOT NULL,
  "max_drafts_per_run" integer DEFAULT 5 NOT NULL,
  "rss_classify_batch_size" integer DEFAULT 10 NOT NULL,
  "max_active_games_cap" integer DEFAULT 50 NOT NULL,
  "default_min_bet" integer DEFAULT 500 NOT NULL,
  "default_max_bet" integer DEFAULT 50000 NOT NULL,
  "default_closing_hours" integer DEFAULT 48 NOT NULL,
  "default_settlement_delay_hours" integer DEFAULT 2 NOT NULL,
  "settle_immediately_on_close" boolean DEFAULT true NOT NULL,
  "rss_ai_min_confidence" numeric(4,2) DEFAULT 0.85 NOT NULL,
  "duplicate_check_strictness" text DEFAULT 'normal'::text NOT NULL,
  "stale_void_days" integer DEFAULT 7 NOT NULL,
  "template_overrides" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "last_manual_run_at" timestamp with time zone,
  "last_cron_run_at" timestamp with time zone,
  "last_run_summary" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "auto_feed_cleanup_enabled" boolean DEFAULT true NOT NULL,
  "feed_pending_ttl_hours" integer DEFAULT 48 NOT NULL,
  "feed_ignored_retention_days" integer DEFAULT 7 NOT NULL,
  "feed_draft_retention_days" integer DEFAULT 14 NOT NULL
);

CREATE TABLE IF NOT EXISTS "prediction"."settlement_history" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "game_id" uuid NOT NULL,
  "winning_option_id" text NOT NULL,
  "settlement_method" text NOT NULL,
  "source_data" jsonb DEFAULT '{}'::jsonb,
  "settled_by" uuid,
  "notes" text,
  "settled_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "prediction"."settlement_sources" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "game_id" uuid NOT NULL,
  "source_type" text NOT NULL,
  "source_config" jsonb DEFAULT '{}'::jsonb,
  "external_id" text,
  "scheduled_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "prediction"."user_challenge_bets" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "challenge_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "user_name" text NOT NULL,
  "option_id" text NOT NULL,
  "amount_pmp" integer NOT NULL,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "prediction"."user_challenge_comments" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "challenge_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "user_name" text NOT NULL,
  "option_id" text,
  "message" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "prediction"."user_challenges" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "host_id" uuid NOT NULL,
  "host_name" text NOT NULL,
  "title" text NOT NULL,
  "options" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "category" text DEFAULT 'CASUAL'::text,
  "visibility" text DEFAULT 'PRIVATE'::text,
  "event_start_at" timestamp with time zone NOT NULL,
  "settlement_at" timestamp with time zone NOT NULL,
  "settled_at" timestamp with time zone,
  "status" text DEFAULT 'OPEN'::text,
  "winning_option_id" text,
  "total_pool_pmp" integer DEFAULT 0,
  "host_fee_pmp" integer DEFAULT 0,
  "dispute_count" integer DEFAULT 0,
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now(),
  "linked_game_id" uuid,
  "linked_game_slug" text,
  "linked_game_title" text,
  "pending_winning_option_id" text,
  "settlement_proposed_at" timestamp with time zone,
  "dispute_voters" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "payout_details" jsonb,
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "prediction"."user_prediction_stats" (
  "user_id" uuid NOT NULL,
  "settled_count" integer DEFAULT 0 NOT NULL,
  "win_count" integer DEFAULT 0 NOT NULL,
  "win_rate" numeric(6,4) DEFAULT 0 NOT NULL,
  "total_staked" bigint DEFAULT 0 NOT NULL,
  "total_reward_pmc" bigint DEFAULT 0 NOT NULL,
  "roi_percentage" numeric(10,2) DEFAULT 0 NOT NULL,
  "average_confidence" numeric(6,4) DEFAULT 0.5000 NOT NULL,
  "average_brier_score" numeric(6,4) DEFAULT 0.2500 NOT NULL,
  "average_log_loss" numeric(8,4) DEFAULT 0.6931 NOT NULL,
  "calibration_gap" numeric(7,4) DEFAULT 0 NOT NULL,
  "skill_weight" numeric(6,3) DEFAULT 1.000 NOT NULL,
  "calibration_status" text DEFAULT 'INSUFFICIENT_DATA'::text NOT NULL,
  "recent_trend" text DEFAULT 'STABLE'::text NOT NULL,
  "user_beta" numeric(8,4) DEFAULT 1.0000 NOT NULL,
  "experience_score" numeric(6,4) DEFAULT 0 NOT NULL,
  "brier_history" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "last_settled_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."calendar_events" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "title" text NOT NULL,
  "category" text NOT NULL,
  "due_date" date NOT NULL,
  "period_cycle" text,
  "penalty_warning" boolean DEFAULT true,
  "penalty_info" text,
  "status" text DEFAULT 'pending'::text,
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."cloze_quizzes" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "subject" text NOT NULL,
  "law_name" text NOT NULL,
  "article_title" text NOT NULL,
  "question_text" text NOT NULL,
  "blank_answer" text NOT NULL,
  "initial_hint" text,
  "options" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "explanation" text NOT NULL,
  "theme" text DEFAULT 'general'::text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now(),
  "exam_round" text DEFAULT '빈출 핵심'::text,
  "frequency" text DEFAULT '★★★★★'::text
);

CREATE TABLE IF NOT EXISTS "public"."law_revisions" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "law_title" text NOT NULL,
  "revision_date" date NOT NULL,
  "enforce_date" date NOT NULL,
  "summary" text NOT NULL,
  "before_text" text,
  "after_text" text,
  "action_points" jsonb DEFAULT '[]'::jsonb,
  "tags" jsonb DEFAULT '[]'::jsonb,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."live_study_sessions" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text,
  "user_name" text NOT NULL,
  "avatar_color" text DEFAULT 'indigo'::text,
  "subject" text NOT NULL,
  "is_studying" boolean DEFAULT true,
  "study_seconds" integer DEFAULT 0,
  "total_today_minutes" integer DEFAULT 0,
  "status_message" text,
  "last_ping_at" timestamp with time zone DEFAULT now(),
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."patrol_checklists" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "area" text NOT NULL,
  "item_name" text NOT NULL,
  "check_standard" text NOT NULL,
  "is_checked" boolean DEFAULT false,
  "status" text DEFAULT 'normal'::text,
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."study_cheers" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_name" text NOT NULL,
  "message" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."study_schedules" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "title" text NOT NULL,
  "subject" text NOT NULL,
  "plan_date" date DEFAULT CURRENT_DATE NOT NULL,
  "is_completed" boolean DEFAULT false,
  "study_minutes" integer DEFAULT 0,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."wrong_answers" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "quiz_id" uuid,
  "user_id" text,
  "wrong_count" integer DEFAULT 1,
  "is_resolved" boolean DEFAULT false,
  "last_wrong_answer" text,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "ranking"."ranking_history" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "period_type" character varying(20) NOT NULL,
  "period_start" date NOT NULL,
  "period_end" date NOT NULL,
  "overall_rank" integer,
  "forum_rank" integer,
  "consume_rank" integer,
  "expect_rank" integer,
  "donation_rank" integer,
  "contribution_score" integer DEFAULT 0,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "ranking"."user_scores" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "forum_posts_count" integer DEFAULT 0,
  "forum_comments_count" integer DEFAULT 0,
  "forum_pmp_earned" integer DEFAULT 0,
  "time_consume_pmp" integer DEFAULT 0,
  "money_consume_pmc" integer DEFAULT 0,
  "cloud_consume_pmc" integer DEFAULT 0,
  "expect_participations" integer DEFAULT 0,
  "expect_wins" integer DEFAULT 0,
  "expect_pmc_earned" integer DEFAULT 0,
  "donation_count" integer DEFAULT 0,
  "donation_total_pmc" integer DEFAULT 0,
  "total_pmp_earned" integer DEFAULT 0,
  "total_pmc_earned" integer DEFAULT 0,
  "total_pmc_donated" integer DEFAULT 0,
  "contribution_score" integer DEFAULT 0,
  "weekly_activity_score" integer DEFAULT 0,
  "monthly_activity_score" integer DEFAULT 0,
  "overall_rank" integer,
  "forum_rank" integer,
  "consume_rank" integer,
  "expect_rank" integer,
  "donation_rank" integer,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  "sido" text DEFAULT '서울특별시'::text,
  "sigungu" text DEFAULT '강남구'::text,
  "dong" text DEFAULT '역삼동'::text,
  "job_group" text DEFAULT 'IT_DEVELOPER'::text,
  "expect_brier_score" numeric(6,4) DEFAULT 0.2500,
  "expect_skill_weight" numeric(6,3) DEFAULT 1.000,
  "expect_calibration_status" text DEFAULT 'INSUFFICIENT_DATA'::text,
  "expect_win_rate" numeric(6,4) DEFAULT 0,
  "expect_user_beta" numeric(8,4) DEFAULT 1.0000,
  "expect_settled_count" integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "study_cycle"."sc_assessments" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "title" text NOT NULL,
  "status" text DEFAULT 'in_progress'::text NOT NULL,
  "started_at" timestamp with time zone DEFAULT now() NOT NULL,
  "completed_at" timestamp with time zone
);

CREATE TABLE IF NOT EXISTS "study_cycle"."sc_chapters" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "textbook_id" uuid NOT NULL,
  "title" text NOT NULL,
  "order" integer NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "study_cycle"."sc_questions" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "chapter_id" uuid NOT NULL,
  "question_text" text NOT NULL,
  "question_type" text NOT NULL,
  "options" jsonb,
  "solution_template" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "study_cycle"."sc_reading_progress" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "reading_id" uuid NOT NULL,
  "chapter_id" uuid NOT NULL,
  "pages_read" integer DEFAULT 0 NOT NULL,
  "time_spent_minutes" integer DEFAULT 0 NOT NULL,
  "comprehension_rating" integer,
  "difficulty_rating" integer,
  "notes" text,
  "is_completed" boolean DEFAULT false NOT NULL,
  "completed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "study_cycle"."sc_readings" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "textbook_id" uuid NOT NULL,
  "round" integer NOT NULL,
  "status" text DEFAULT 'not_started'::text NOT NULL,
  "started_at" timestamp with time zone,
  "completed_at" timestamp with time zone,
  "last_accessed_at" timestamp with time zone,
  "daily_pages_target" integer,
  "weekly_hours_target" integer,
  "completion_deadline" timestamp with time zone,
  "total_time_minutes" integer DEFAULT 0 NOT NULL,
  "total_pages_read" integer DEFAULT 0 NOT NULL,
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "version" integer DEFAULT 1 NOT NULL
);

CREATE TABLE IF NOT EXISTS "study_cycle"."sc_study_sessions" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "textbook_id" uuid NOT NULL,
  "chapter_id" uuid,
  "start_time" timestamp with time zone NOT NULL,
  "end_time" timestamp with time zone,
  "duration_seconds" integer,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "study_cycle"."sc_textbooks" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "creator_id" uuid,
  "title" text NOT NULL,
  "description" text,
  "cover_image_url" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "study_cycle"."sc_user_answers" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "assessment_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "question_id" uuid NOT NULL,
  "user_answer" text,
  "is_correct" boolean,
  "score" integer,
  "submitted_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "study_cycle"."sc_user_textbook_progress" (
  "user_id" uuid NOT NULL,
  "textbook_id" uuid NOT NULL,
  "read_count" integer DEFAULT 0 NOT NULL,
  "total_study_duration_seconds" integer DEFAULT 0 NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "user"."behavioral_bias_profiles" (
  "user_id" uuid NOT NULL,
  "loss_aversion" numeric(5,3) DEFAULT 2.25 NOT NULL,
  "endowment_effect" numeric(5,3) DEFAULT 0.5 NOT NULL,
  "mental_accounting" numeric(5,3) DEFAULT 0.5 NOT NULL,
  "hyperbolic_discounting" numeric(5,3) DEFAULT 0.5 NOT NULL,
  "overconfidence" numeric(5,3) DEFAULT 0.5 NOT NULL,
  "anchoring" numeric(5,3) DEFAULT 0.5 NOT NULL,
  "availability_heuristic" numeric(5,3) DEFAULT 0.5 NOT NULL,
  "confirmation_bias" numeric(5,3) DEFAULT 0.5 NOT NULL,
  "herding" numeric(5,3) DEFAULT 0.5 NOT NULL,
  "recency_bias" numeric(5,3) DEFAULT 0.5 NOT NULL,
  "profile_date" timestamp with time zone DEFAULT now() NOT NULL,
  "reliability_score" numeric(5,3) DEFAULT 0 NOT NULL,
  "measurement_count" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "user"."healing_creation_resonances" (
  "creation_id" uuid NOT NULL,
  "viewer_key" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "user"."healing_creations" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "kind" text NOT NULL,
  "title" text NOT NULL,
  "subtitle" text DEFAULT ''::text NOT NULL,
  "cover_url" text,
  "lore_connection" text DEFAULT ''::text NOT NULL,
  "creator_note" text DEFAULT ''::text NOT NULL,
  "ai_tools" text[] DEFAULT '{}'::text[] NOT NULL,
  "items_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "resonance_count" integer DEFAULT 0 NOT NULL,
  "is_published" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "user"."healing_room_bgm_tracks" (
  "id" text NOT NULL,
  "label" text NOT NULL,
  "artist" text DEFAULT 'PosMul Studio'::text NOT NULL,
  "mood_desc" text DEFAULT ''::text NOT NULL,
  "audio_url" text,
  "storage_path" text,
  "frequencies" jsonb DEFAULT '[220, 261.63, 329.63, 392.0]'::jsonb NOT NULL,
  "waveform" text DEFAULT 'sine'::text NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "sort_order" integer DEFAULT 100 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "user"."healing_room_guestbooks" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "room_user_id" uuid NOT NULL,
  "author_user_id" uuid,
  "author_name" character varying(60) NOT NULL,
  "author_minimi" character varying(32) DEFAULT '🐣'::character varying NOT NULL,
  "relation_label" character varying(32) DEFAULT '동네 일촌'::character varying NOT NULL,
  "content" character varying(300) NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "user"."healing_rooms" (
  "user_id" uuid NOT NULL,
  "owner_nickname" character varying(60) DEFAULT 'PosMul 시민'::character varying NOT NULL,
  "room_title" character varying(80) DEFAULT '오늘도 따뜻한 긍정승수 힐링룸'::character varying NOT NULL,
  "status_message" character varying(160) DEFAULT '현실의 나를 잠시 내려놓고, 세상을 읽고 나누는 공간 ☕'::character varying NOT NULL,
  "mood_tag" character varying(32) DEFAULT '평온 ☕'::character varying NOT NULL,
  "bgm_track" character varying(64) DEFAULT 'lofi-rain'::character varying NOT NULL,
  "room_theme" character varying(64) DEFAULT 'sunset-attic'::character varying NOT NULL,
  "minimi_style" character varying(64) DEFAULT 'warm-knit'::character varying NOT NULL,
  "minimi_quote" character varying(100) DEFAULT '오늘도 좋은 예측과 나눔 한 스푼!'::character varying NOT NULL,
  "placed_items" jsonb DEFAULT '["plant-pot", "wood-desk"]'::jsonb NOT NULL,
  "owned_items" jsonb DEFAULT '["sunset-attic", "warm-knit", "plant-pot", "wood-desk"]'::jsonb NOT NULL,
  "today_visits" integer DEFAULT 1 NOT NULL,
  "total_visits" integer DEFAULT 1 NOT NULL,
  "last_visit_date" date DEFAULT CURRENT_DATE NOT NULL,
  "region_label" character varying(60) DEFAULT '광주 광산구'::character varying NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "user"."healing_worldviews" (
  "user_id" uuid NOT NULL,
  "universe_title" text NOT NULL,
  "tagline" text DEFAULT ''::text NOT NULL,
  "genre_tags" text[] DEFAULT '{}'::text[] NOT NULL,
  "prologue_md" text DEFAULT ''::text NOT NULL,
  "timeline_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "characters_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "non_commercial_pledge" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "user"."opinion_leaders" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "display_name" text NOT NULL,
  "bio" text,
  "profile_image_url" text,
  "category" text NOT NULL,
  "follower_count" integer DEFAULT 0,
  "total_support_received" numeric(15,2) DEFAULT 0,
  "verification_status" text DEFAULT 'pending'::text,
  "is_active" boolean DEFAULT true,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "user"."profiles" (
  "id" uuid NOT NULL,
  "username" character varying(50) NOT NULL,
  "display_name" character varying(100) NOT NULL,
  "avatar_url" text,
  "bio" text,
  "notification_preferences" jsonb DEFAULT '{"sms": false, "push": true, "email": true}'::jsonb,
  "privacy_settings" jsonb DEFAULT '{"profile_public": true, "activity_public": false}'::jsonb,
  "onboarding_completed" boolean DEFAULT false,
  "account_status" text DEFAULT 'active'::text,
  "email_verified" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  "last_active_at" timestamp with time zone DEFAULT now(),
  "role" text DEFAULT 'user'::text NOT NULL
);

CREATE TABLE IF NOT EXISTS "user"."user_cluster_assignments" (
  "user_id" uuid NOT NULL,
  "cluster_id" uuid NOT NULL,
  "assignment_probability" numeric(5,3) NOT NULL,
  "distance_from_center" numeric(8,6),
  "assignment_date" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "user"."user_reputation_metrics" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "prediction_accuracy_rate" numeric(5,2) DEFAULT 0,
  "total_predictions_made" integer DEFAULT 0,
  "successful_predictions" integer DEFAULT 0,
  "investment_success_rate" numeric(5,2) DEFAULT 0,
  "total_investments_made" integer DEFAULT 0,
  "roi_average" numeric(8,2) DEFAULT 0,
  "forum_contribution_score" integer DEFAULT 0,
  "helpful_posts_count" integer DEFAULT 0,
  "community_trust_level" integer DEFAULT 1,
  "overall_reputation_score" numeric(8,2) DEFAULT 0,
  "reputation_tier" text DEFAULT 'bronze'::text,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "user"."user_utility_clusters" (
  "cluster_id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "cluster_name" text NOT NULL,
  "cluster_description" text,
  "center_alpha" numeric(8,6) NOT NULL,
  "center_beta" numeric(8,6) NOT NULL,
  "center_gamma" numeric(8,6) NOT NULL,
  "center_delta" numeric(8,6) NOT NULL,
  "center_epsilon" numeric(8,6) NOT NULL,
  "member_count" integer DEFAULT 0 NOT NULL,
  "variance_within_cluster" numeric(8,6),
  "typical_behavior_pattern" text,
  "risk_tolerance_level" text,
  "social_orientation" text,
  "clustering_date" timestamp with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "user"."users" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "email" text NOT NULL,
  "username" text,
  "full_name" text,
  "avatar_url" text,
  "is_active" boolean DEFAULT true,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  "sido" text DEFAULT '서울특별시'::text,
  "sigungu" text DEFAULT '강남구'::text,
  "dong" text DEFAULT '역삼동'::text,
  "job_group" text DEFAULT 'IT_DEVELOPER'::text
);

CREATE TABLE IF NOT EXISTS "vertical_housing"."ai_scan_logs" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "serial_id" uuid,
  "book_code" text NOT NULL,
  "page_number" integer NOT NULL,
  "detected_markings" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "confidence_score" numeric(5,2) DEFAULT 100.0 NOT NULL,
  "reward_pmp" integer DEFAULT 0 NOT NULL,
  "scanned_date" date DEFAULT CURRENT_DATE NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "vertical_housing"."book_serials" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "serial_code" text NOT NULL,
  "book_title" text NOT NULL,
  "book_code" text NOT NULL,
  "registered_user_id" uuid,
  "registered_at" timestamp with time zone,
  "status" text DEFAULT 'ACTIVE'::text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "vertical_housing"."exam_options" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "question_id" uuid NOT NULL,
  "option_number" integer NOT NULL,
  "option_text" text NOT NULL,
  "is_correct" boolean NOT NULL,
  "mastery_tier" integer DEFAULT 1 NOT NULL,
  "trap_summary" text,
  "legal_citation" text,
  "legal_link" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "is_amended" boolean DEFAULT false NOT NULL,
  "amended_note" text,
  "original_option_text" text,
  "cluster_id" uuid,
  "repeat_count" integer DEFAULT 1 NOT NULL,
  "appeared_citations" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "theory_section_code" text
);

CREATE TABLE IF NOT EXISTS "vertical_housing"."exam_questions" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "exam_year" integer NOT NULL,
  "exam_round" integer NOT NULL,
  "subject" text NOT NULL,
  "question_number" integer NOT NULL,
  "question_text" text NOT NULL,
  "box_content" text,
  "correct_option_number" integer,
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "exam_stage" text DEFAULT '2차'::text NOT NULL,
  "question_type" text DEFAULT 'OBJECTIVE'::text NOT NULL,
  "subjective_answer" text,
  "correct_options" integer[],
  "chapter_code" text,
  "chapter_title" text,
  "importance_tier" text,
  "law_status" text DEFAULT 'VALID'::text NOT NULL,
  "amended_note" text,
  "original_snapshot" jsonb,
  "detail_code" text,
  "detail_title" text
);

CREATE TABLE IF NOT EXISTS "vertical_housing"."legal_obligations" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "category" text NOT NULL,
  "obligation_title" text NOT NULL,
  "cycle_rule" text NOT NULL,
  "deadline_description" text NOT NULL,
  "legal_citation" text NOT NULL,
  "fine_max_amount" integer DEFAULT 0 NOT NULL,
  "required_evidence_type" text,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "vertical_housing"."option_clusters" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "subject" text NOT NULL,
  "chapter_code" text,
  "canonical_text" text NOT NULL,
  "skeleton_key" text NOT NULL,
  "repeat_count" integer DEFAULT 1 NOT NULL,
  "distinct_year_count" integer DEFAULT 1 NOT NULL,
  "appeared_years" integer[] DEFAULT '{}'::integer[] NOT NULL,
  "appeared_citations" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "vertical_housing"."option_mastery" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "option_id" uuid NOT NULL,
  "status" text DEFAULT 'O'::text NOT NULL,
  "streak_count" integer DEFAULT 0 NOT NULL,
  "next_review_at" timestamp with time zone,
  "last_scanned_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "vertical_housing"."study_cones" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "cone_type" text NOT NULL,
  "level" integer DEFAULT 1 NOT NULL,
  "total_focus_minutes" integer DEFAULT 0 NOT NULL,
  "purchased_price_krw" integer DEFAULT 0 NOT NULL,
  "is_equipped" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "vertical_housing"."study_option_logs" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "client_key" text NOT NULL,
  "question_id" uuid NOT NULL,
  "option_id" uuid NOT NULL,
  "mark_status" text NOT NULL,
  "mastered_by_ox" boolean DEFAULT false NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "user_id" uuid
);

CREATE TABLE IF NOT EXISTS "vertical_housing"."study_question_logs" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "client_key" text NOT NULL,
  "set_key" text NOT NULL,
  "question_id" uuid NOT NULL,
  "selected_option" integer,
  "subjective_input" text,
  "is_correct" boolean,
  "question_mark" text,
  "solved_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "box_marks" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "user_id" uuid
);

CREATE TABLE IF NOT EXISTS "vertical_housing"."study_user_profiles" (
  "user_id" uuid NOT NULL,
  "exam_date" date DEFAULT '2026-09-12'::date NOT NULL,
  "active_track" text DEFAULT 'app_only_69'::text NOT NULL,
  "total_focus_seconds" integer DEFAULT 0 NOT NULL,
  "planner_state" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "vertical_housing"."theory_sections" (
  "section_code" text NOT NULL,
  "detail_code" text NOT NULL,
  "subject" text NOT NULL,
  "chapter_title" text NOT NULL,
  "section_title" text NOT NULL,
  "keywords" text[] DEFAULT '{}'::text[] NOT NULL,
  "body_md" text NOT NULL,
  "source_file" text NOT NULL,
  "sort_order" integer DEFAULT 1 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- -----------------------------------------------------------------------------
-- 5. Primary Keys, Unique, Check & Exclusion Constraints
-- -----------------------------------------------------------------------------
ALTER TABLE assessment.assessments ADD CONSTRAINT assessments_pkey PRIMARY KEY (id);
ALTER TABLE assessment.questions ADD CONSTRAINT questions_pkey PRIMARY KEY (id);
ALTER TABLE assessment.submissions ADD CONSTRAINT submissions_pkey PRIMARY KEY (id);
ALTER TABLE consume.ad_campaigns ADD CONSTRAINT ad_campaigns_pkey PRIMARY KEY (id);
ALTER TABLE consume.ad_views ADD CONSTRAINT ad_views_pkey PRIMARY KEY (id);
ALTER TABLE consume.consume_categories ADD CONSTRAINT investment_categories_pkey PRIMARY KEY (id);
ALTER TABLE consume.consume_opportunities ADD CONSTRAINT investment_opportunities_pkey PRIMARY KEY (id);
ALTER TABLE consume.consume_participations ADD CONSTRAINT investment_participations_pkey PRIMARY KEY (id);
ALTER TABLE consume.consume_performance_metrics ADD CONSTRAINT investment_performance_metrics_pkey PRIMARY KEY (id);
ALTER TABLE consume.contributions ADD CONSTRAINT contributions_pkey PRIMARY KEY (id);
ALTER TABLE consume.daily_view_stats ADD CONSTRAINT daily_view_stats_pkey PRIMARY KEY (id);
ALTER TABLE consume.funding_contributions ADD CONSTRAINT funding_contributions_pkey PRIMARY KEY (id);
ALTER TABLE consume.funding_projects ADD CONSTRAINT funding_projects_pkey PRIMARY KEY (id);
ALTER TABLE consume.local_stores ADD CONSTRAINT local_stores_pkey PRIMARY KEY (id);
ALTER TABLE consume.payments ADD CONSTRAINT payments_pkey PRIMARY KEY (id);
ALTER TABLE demographic_data.data_sources ADD CONSTRAINT data_sources_pkey PRIMARY KEY (id);
ALTER TABLE demographic_data.prediction_stat_links ADD CONSTRAINT prediction_stat_links_pkey PRIMARY KEY (id);
ALTER TABLE demographic_data.statistics ADD CONSTRAINT statistics_pkey PRIMARY KEY (id);
ALTER TABLE donation.direct_donation_items ADD CONSTRAINT direct_donation_items_pkey PRIMARY KEY (id);
ALTER TABLE donation.direct_donation_progress ADD CONSTRAINT direct_donation_progress_pkey PRIMARY KEY (id);
ALTER TABLE donation.direct_donation_requests ADD CONSTRAINT direct_donation_requests_pkey PRIMARY KEY (id);
ALTER TABLE donation.donation_activity_logs ADD CONSTRAINT donation_activity_logs_pkey PRIMARY KEY (id);
ALTER TABLE donation.donation_certificates ADD CONSTRAINT donation_certificates_pkey PRIMARY KEY (id);
ALTER TABLE donation.donation_institutes ADD CONSTRAINT donation_institutes_pkey PRIMARY KEY (id);
ALTER TABLE donation.donation_recipients ADD CONSTRAINT donation_recipients_pkey PRIMARY KEY (id);
ALTER TABLE donation.donations ADD CONSTRAINT donations_pkey PRIMARY KEY (id);
ALTER TABLE donation.funding_projects ADD CONSTRAINT funding_projects_pkey PRIMARY KEY (id);
ALTER TABLE donation.funding_wishlist_requests ADD CONSTRAINT funding_wishlist_requests_pkey PRIMARY KEY (id);
ALTER TABLE donation.opinion_leader_endorsements ADD CONSTRAINT opinion_leader_endorsements_pkey PRIMARY KEY (id);
ALTER TABLE donation.opinion_leader_followers ADD CONSTRAINT opinion_leader_followers_pkey PRIMARY KEY (id);
ALTER TABLE donation.opinion_leaders ADD CONSTRAINT opinion_leaders_pkey PRIMARY KEY (id);
ALTER TABLE economy.account_activity_stats ADD CONSTRAINT account_activity_stats_pkey PRIMARY KEY (user_id);
ALTER TABLE economy.individual_utility_parameters ADD CONSTRAINT individual_utility_parameters_pkey PRIMARY KEY (user_id);
ALTER TABLE economy.money_wave1_ebit_records ADD CONSTRAINT money_wave1_ebit_records_pkey PRIMARY KEY (record_id);
ALTER TABLE economy.money_wave2_redistribution_records ADD CONSTRAINT money_wave2_redistribution_records_pkey PRIMARY KEY (record_id);
ALTER TABLE economy.money_wave3_entrepreneur_records ADD CONSTRAINT money_wave3_entrepreneur_records_pkey PRIMARY KEY (record_id);
ALTER TABLE economy.money_wave3_ventures ADD CONSTRAINT money_wave3_ventures_pkey PRIMARY KEY (venture_id);
ALTER TABLE economy.money_wave_config ADD CONSTRAINT money_wave_config_pkey PRIMARY KEY (config_id);
ALTER TABLE economy.money_wave_daily_snapshots ADD CONSTRAINT money_wave_daily_snapshots_pkey PRIMARY KEY (snapshot_id);
ALTER TABLE economy.money_wave_effectiveness ADD CONSTRAINT money_wave_effectiveness_pkey PRIMARY KEY (analysis_id);
ALTER TABLE economy.money_wave_history ADD CONSTRAINT money_wave_history_pkey PRIMARY KEY (wave_id);
ALTER TABLE economy.money_wave_hourly_category_allocations ADD CONSTRAINT money_wave_hourly_category_allocations_pkey PRIMARY KEY (allocation_id);
ALTER TABLE economy.money_wave_hourly_game_pools ADD CONSTRAINT money_wave_hourly_game_pools_pkey PRIMARY KEY (pool_id);
ALTER TABLE economy.pmp_pmc_accounts ADD CONSTRAINT pmp_pmc_accounts_pkey PRIMARY KEY (user_id);
ALTER TABLE economy.pmp_pmc_transactions ADD CONSTRAINT pmp_pmc_transactions_pkey PRIMARY KEY (transaction_id);
ALTER TABLE economy.prediction_category_multipliers ADD CONSTRAINT prediction_category_multipliers_pkey PRIMARY KEY (category);
ALTER TABLE economy.social_welfare_parameters ADD CONSTRAINT social_welfare_parameters_pkey PRIMARY KEY (parameter_id);
ALTER TABLE economy.system_statistics ADD CONSTRAINT system_statistics_pkey PRIMARY KEY (id);
ALTER TABLE economy.transparency_reports ADD CONSTRAINT transparency_reports_pkey PRIMARY KEY (id);
ALTER TABLE economy.utility_estimation_inputs ADD CONSTRAINT utility_estimation_inputs_pkey PRIMARY KEY (input_id);
ALTER TABLE economy.utility_predictions ADD CONSTRAINT utility_predictions_pkey PRIMARY KEY (prediction_id);
ALTER TABLE feed.bills ADD CONSTRAINT bills_pkey PRIMARY KEY (bill_id);
ALTER TABLE feed.items ADD CONSTRAINT items_pkey PRIMARY KEY (id);
ALTER TABLE feed.rss_sources ADD CONSTRAINT rss_sources_pkey PRIMARY KEY (id);
ALTER TABLE forum.banned_ips ADD CONSTRAINT banned_ips_pkey PRIMARY KEY (id);
ALTER TABLE forum.banned_words ADD CONSTRAINT banned_words_pkey PRIMARY KEY (id);
ALTER TABLE forum.forum_activity_logs ADD CONSTRAINT forum_activity_logs_pkey PRIMARY KEY (id);
ALTER TABLE forum.forum_categories ADD CONSTRAINT forum_categories_pkey PRIMARY KEY (id);
ALTER TABLE forum.forum_comments ADD CONSTRAINT forum_comments_pkey PRIMARY KEY (id);
ALTER TABLE forum.forum_post_tags ADD CONSTRAINT forum_post_tags_pkey PRIMARY KEY (post_id, tag_id);
ALTER TABLE forum.forum_posts ADD CONSTRAINT forum_posts_pkey PRIMARY KEY (id);
ALTER TABLE forum.forum_prediction_links ADD CONSTRAINT forum_prediction_links_pkey PRIMARY KEY (id);
ALTER TABLE forum.forum_regions ADD CONSTRAINT forum_regions_pkey PRIMARY KEY (code);
ALTER TABLE forum.forum_tags ADD CONSTRAINT forum_tags_pkey PRIMARY KEY (id);
ALTER TABLE forum.forum_votes ADD CONSTRAINT forum_votes_pkey PRIMARY KEY (id);
ALTER TABLE forum.live_room_messages ADD CONSTRAINT live_room_messages_pkey PRIMARY KEY (id);
ALTER TABLE oauth_provider.auth_codes ADD CONSTRAINT auth_codes_pkey PRIMARY KEY (code);
ALTER TABLE oauth_provider.clients ADD CONSTRAINT clients_pkey PRIMARY KEY (id);
ALTER TABLE oauth_provider.tokens ADD CONSTRAINT tokens_pkey PRIMARY KEY (access_token);
ALTER TABLE prediction.game_snapshots ADD CONSTRAINT game_snapshots_pkey PRIMARY KEY (id);
ALTER TABLE prediction.prediction_games ADD CONSTRAINT prediction_games_pkey PRIMARY KEY (game_id);
ALTER TABLE prediction.prediction_settlements ADD CONSTRAINT prediction_settlements_pkey PRIMARY KEY (settlement_id);
ALTER TABLE prediction.prediction_statistics ADD CONSTRAINT prediction_statistics_pkey PRIMARY KEY (game_id);
ALTER TABLE prediction.prediction_trends ADD CONSTRAINT prediction_trends_pkey PRIMARY KEY (trend_id);
ALTER TABLE prediction.predictions ADD CONSTRAINT predictions_pkey PRIMARY KEY (prediction_id);
ALTER TABLE prediction.scheduler_config ADD CONSTRAINT scheduler_config_pkey PRIMARY KEY (id);
ALTER TABLE prediction.settlement_history ADD CONSTRAINT settlement_history_pkey PRIMARY KEY (id);
ALTER TABLE prediction.settlement_sources ADD CONSTRAINT settlement_sources_pkey PRIMARY KEY (id);
ALTER TABLE prediction.user_challenge_bets ADD CONSTRAINT user_challenge_bets_pkey PRIMARY KEY (id);
ALTER TABLE prediction.user_challenge_comments ADD CONSTRAINT user_challenge_comments_pkey PRIMARY KEY (id);
ALTER TABLE prediction.user_challenges ADD CONSTRAINT user_challenges_pkey PRIMARY KEY (id);
ALTER TABLE prediction.user_prediction_stats ADD CONSTRAINT user_prediction_stats_pkey PRIMARY KEY (user_id);
ALTER TABLE public.calendar_events ADD CONSTRAINT calendar_events_pkey PRIMARY KEY (id);
ALTER TABLE public.cloze_quizzes ADD CONSTRAINT cloze_quizzes_pkey PRIMARY KEY (id);
ALTER TABLE public.law_revisions ADD CONSTRAINT law_revisions_pkey PRIMARY KEY (id);
ALTER TABLE public.live_study_sessions ADD CONSTRAINT live_study_sessions_pkey PRIMARY KEY (id);
ALTER TABLE public.patrol_checklists ADD CONSTRAINT patrol_checklists_pkey PRIMARY KEY (id);
ALTER TABLE public.study_cheers ADD CONSTRAINT study_cheers_pkey PRIMARY KEY (id);
ALTER TABLE public.study_schedules ADD CONSTRAINT study_schedules_pkey PRIMARY KEY (id);
ALTER TABLE public.wrong_answers ADD CONSTRAINT wrong_answers_pkey PRIMARY KEY (id);
ALTER TABLE ranking.ranking_history ADD CONSTRAINT ranking_history_pkey PRIMARY KEY (id);
ALTER TABLE ranking.user_scores ADD CONSTRAINT user_scores_pkey PRIMARY KEY (id);
ALTER TABLE study_cycle.sc_assessments ADD CONSTRAINT sc_assessments_pkey PRIMARY KEY (id);
ALTER TABLE study_cycle.sc_chapters ADD CONSTRAINT sc_chapters_pkey PRIMARY KEY (id);
ALTER TABLE study_cycle.sc_questions ADD CONSTRAINT sc_questions_pkey PRIMARY KEY (id);
ALTER TABLE study_cycle.sc_reading_progress ADD CONSTRAINT sc_reading_progress_pkey PRIMARY KEY (id);
ALTER TABLE study_cycle.sc_readings ADD CONSTRAINT sc_readings_pkey PRIMARY KEY (id);
ALTER TABLE study_cycle.sc_study_sessions ADD CONSTRAINT sc_study_sessions_pkey PRIMARY KEY (id);
ALTER TABLE study_cycle.sc_textbooks ADD CONSTRAINT sc_textbooks_pkey PRIMARY KEY (id);
ALTER TABLE study_cycle.sc_user_answers ADD CONSTRAINT sc_user_answers_pkey PRIMARY KEY (id);
ALTER TABLE study_cycle.sc_user_textbook_progress ADD CONSTRAINT sc_user_textbook_progress_pkey PRIMARY KEY (user_id, textbook_id);
ALTER TABLE "user".behavioral_bias_profiles ADD CONSTRAINT behavioral_bias_profiles_pkey PRIMARY KEY (user_id);
ALTER TABLE "user".healing_creation_resonances ADD CONSTRAINT healing_creation_resonances_pkey PRIMARY KEY (creation_id, viewer_key);
ALTER TABLE "user".healing_creations ADD CONSTRAINT healing_creations_pkey PRIMARY KEY (id);
ALTER TABLE "user".healing_room_bgm_tracks ADD CONSTRAINT healing_room_bgm_tracks_pkey PRIMARY KEY (id);
ALTER TABLE "user".healing_room_guestbooks ADD CONSTRAINT healing_room_guestbooks_pkey PRIMARY KEY (id);
ALTER TABLE "user".healing_rooms ADD CONSTRAINT healing_rooms_pkey PRIMARY KEY (user_id);
ALTER TABLE "user".healing_worldviews ADD CONSTRAINT healing_worldviews_pkey PRIMARY KEY (user_id);
ALTER TABLE "user".opinion_leaders ADD CONSTRAINT opinion_leaders_pkey PRIMARY KEY (id);
ALTER TABLE "user".profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);
ALTER TABLE "user".user_cluster_assignments ADD CONSTRAINT user_cluster_assignments_pkey PRIMARY KEY (user_id, cluster_id, assignment_date);
ALTER TABLE "user".user_reputation_metrics ADD CONSTRAINT user_reputation_metrics_pkey PRIMARY KEY (id);
ALTER TABLE "user".user_utility_clusters ADD CONSTRAINT user_utility_clusters_pkey PRIMARY KEY (cluster_id);
ALTER TABLE "user".users ADD CONSTRAINT users_pkey PRIMARY KEY (id);
ALTER TABLE vertical_housing.ai_scan_logs ADD CONSTRAINT ai_scan_logs_pkey PRIMARY KEY (id);
ALTER TABLE vertical_housing.book_serials ADD CONSTRAINT book_serials_pkey PRIMARY KEY (id);
ALTER TABLE vertical_housing.exam_options ADD CONSTRAINT exam_options_pkey PRIMARY KEY (id);
ALTER TABLE vertical_housing.exam_questions ADD CONSTRAINT exam_questions_pkey PRIMARY KEY (id);
ALTER TABLE vertical_housing.legal_obligations ADD CONSTRAINT legal_obligations_pkey PRIMARY KEY (id);
ALTER TABLE vertical_housing.option_clusters ADD CONSTRAINT option_clusters_pkey PRIMARY KEY (id);
ALTER TABLE vertical_housing.option_mastery ADD CONSTRAINT option_mastery_pkey PRIMARY KEY (id);
ALTER TABLE vertical_housing.study_cones ADD CONSTRAINT study_cones_pkey PRIMARY KEY (id);
ALTER TABLE vertical_housing.study_option_logs ADD CONSTRAINT study_option_logs_pkey PRIMARY KEY (id);
ALTER TABLE vertical_housing.study_question_logs ADD CONSTRAINT study_question_logs_pkey PRIMARY KEY (id);
ALTER TABLE vertical_housing.study_user_profiles ADD CONSTRAINT study_user_profiles_pkey PRIMARY KEY (user_id);
ALTER TABLE vertical_housing.theory_sections ADD CONSTRAINT theory_sections_pkey PRIMARY KEY (section_code);
ALTER TABLE assessment.submissions ADD CONSTRAINT submissions_assessment_id_student_id_key UNIQUE (assessment_id, student_id);
ALTER TABLE consume.consume_categories ADD CONSTRAINT investment_categories_name_key UNIQUE (name);
ALTER TABLE consume.consume_participations ADD CONSTRAINT investment_participations_opportunity_id_investor_id_key UNIQUE (opportunity_id, investor_id);
ALTER TABLE consume.daily_view_stats ADD CONSTRAINT daily_view_stats_user_id_view_date_key UNIQUE (user_id, view_date);
ALTER TABLE demographic_data.statistics ADD CONSTRAINT statistics_region_code_category_period_year_period_month_pe_key UNIQUE (region_code, category, period_year, period_month, period_quarter);
ALTER TABLE donation.direct_donation_requests ADD CONSTRAINT direct_donation_requests_item_id_recipient_id_key UNIQUE (item_id, recipient_id);
ALTER TABLE donation.donation_certificates ADD CONSTRAINT donation_certificates_certificate_number_key UNIQUE (certificate_number);
ALTER TABLE donation.opinion_leader_endorsements ADD CONSTRAINT opinion_leader_endorsements_opinion_leader_id_institute_id_key UNIQUE (opinion_leader_id, institute_id);
ALTER TABLE donation.opinion_leader_followers ADD CONSTRAINT opinion_leader_followers_opinion_leader_id_follower_user_id_key UNIQUE (opinion_leader_id, follower_user_id);
ALTER TABLE donation.opinion_leaders ADD CONSTRAINT opinion_leaders_user_id_key UNIQUE (user_id);
ALTER TABLE economy.money_wave_daily_snapshots ADD CONSTRAINT money_wave_daily_snapshots_snapshot_date_key UNIQUE (snapshot_date);
ALTER TABLE economy.money_wave_hourly_category_allocations ADD CONSTRAINT money_wave_hourly_category_alloc_hour_start_domain_category_key UNIQUE (hour_start, domain, category);
ALTER TABLE economy.system_statistics ADD CONSTRAINT system_statistics_snapshot_date_key UNIQUE (snapshot_date);
ALTER TABLE feed.items ADD CONSTRAINT items_link_key UNIQUE (link);
ALTER TABLE feed.rss_sources ADD CONSTRAINT rss_sources_url_key UNIQUE (url);
ALTER TABLE forum.banned_ips ADD CONSTRAINT banned_ips_ip_address_key UNIQUE (ip_address);
ALTER TABLE forum.banned_words ADD CONSTRAINT banned_words_word_key UNIQUE (word);
ALTER TABLE forum.forum_tags ADD CONSTRAINT forum_tags_name_key UNIQUE (name);
ALTER TABLE forum.forum_votes ADD CONSTRAINT forum_votes_user_id_comment_id_key UNIQUE (user_id, comment_id);
ALTER TABLE forum.forum_votes ADD CONSTRAINT forum_votes_user_id_post_id_key UNIQUE (user_id, post_id);
ALTER TABLE prediction.prediction_games ADD CONSTRAINT prediction_games_slug_unique UNIQUE (slug);
ALTER TABLE prediction.prediction_settlements ADD CONSTRAINT prediction_settlements_prediction_id_key UNIQUE (prediction_id);
ALTER TABLE ranking.user_scores ADD CONSTRAINT user_scores_user_id_key UNIQUE (user_id);
ALTER TABLE study_cycle.sc_chapters ADD CONSTRAINT sc_chapters_textbook_id_order_key UNIQUE (textbook_id, "order");
ALTER TABLE study_cycle.sc_reading_progress ADD CONSTRAINT sc_reading_progress_reading_id_chapter_id_key UNIQUE (reading_id, chapter_id);
ALTER TABLE study_cycle.sc_readings ADD CONSTRAINT unique_user_textbook_round UNIQUE (user_id, textbook_id, round);
ALTER TABLE "user".profiles ADD CONSTRAINT profiles_username_key UNIQUE (username);
ALTER TABLE "user".user_reputation_metrics ADD CONSTRAINT user_reputation_metrics_user_id_key UNIQUE (user_id);
ALTER TABLE "user".users ADD CONSTRAINT users_email_key UNIQUE (email);
ALTER TABLE "user".users ADD CONSTRAINT users_username_key UNIQUE (username);
ALTER TABLE vertical_housing.ai_scan_logs ADD CONSTRAINT uq_user_daily_page_scan UNIQUE (user_id, book_code, page_number, scanned_date);
ALTER TABLE vertical_housing.book_serials ADD CONSTRAINT book_serials_serial_code_key UNIQUE (serial_code);
ALTER TABLE vertical_housing.exam_options ADD CONSTRAINT uq_question_option UNIQUE (question_id, option_number);
ALTER TABLE vertical_housing.exam_questions ADD CONSTRAINT uq_exam_question UNIQUE (exam_round, subject, question_number);
ALTER TABLE vertical_housing.option_mastery ADD CONSTRAINT uq_user_option_mastery UNIQUE (user_id, option_id);
ALTER TABLE vertical_housing.study_option_logs ADD CONSTRAINT study_option_logs_client_key_option_id_key UNIQUE (client_key, option_id);
ALTER TABLE vertical_housing.study_question_logs ADD CONSTRAINT study_question_logs_client_key_question_id_key UNIQUE (client_key, question_id);
ALTER TABLE consume.ad_campaigns ADD CONSTRAINT ad_campaigns_status_check CHECK ((status = ANY (ARRAY['ACTIVE'::text, 'PAUSED'::text, 'COMPLETED'::text, 'EXPIRED'::text])));
ALTER TABLE consume.consume_opportunities ADD CONSTRAINT consume_opportunities_consume_type_check CHECK ((consume_type = ANY (ARRAY['TIME_CONSUME'::text, 'MONEY_CONSUME'::text, 'CLOUD_CONSUME'::text])));
ALTER TABLE consume.consume_opportunities ADD CONSTRAINT investment_opportunities_category_check CHECK ((category = ANY (ARRAY['TECH'::text, 'HEALTHCARE'::text, 'ENERGY'::text, 'EDUCATION'::text, 'FINANCE'::text, 'RETAIL'::text, 'MANUFACTURING'::text, 'AGRICULTURE'::text, 'REAL_ESTATE'::text, 'OTHER'::text])));
ALTER TABLE consume.consume_opportunities ADD CONSTRAINT investment_opportunities_check CHECK ((maximum_investment >= minimum_investment));
ALTER TABLE consume.consume_opportunities ADD CONSTRAINT investment_opportunities_check1 CHECK ((funding_end_date > funding_start_date));
ALTER TABLE consume.consume_opportunities ADD CONSTRAINT investment_opportunities_check2 CHECK ((expected_return_date > funding_end_date));
ALTER TABLE consume.consume_opportunities ADD CONSTRAINT investment_opportunities_current_amount_check CHECK ((current_amount >= (0)::numeric));
ALTER TABLE consume.consume_opportunities ADD CONSTRAINT investment_opportunities_description_check CHECK (((char_length(description) >= 50) AND (char_length(description) <= 5000)));
ALTER TABLE consume.consume_opportunities ADD CONSTRAINT investment_opportunities_expected_return_rate_check CHECK (((expected_return_rate >= (0)::numeric) AND (expected_return_rate <= (100)::numeric)));
ALTER TABLE consume.consume_opportunities ADD CONSTRAINT investment_opportunities_minimum_investment_check CHECK ((minimum_investment > (0)::numeric));
ALTER TABLE consume.consume_opportunities ADD CONSTRAINT investment_opportunities_risk_level_check CHECK (((risk_level >= 1) AND (risk_level <= 5)));
ALTER TABLE consume.consume_opportunities ADD CONSTRAINT investment_opportunities_status_check CHECK ((status = ANY (ARRAY['DRAFT'::text, 'ACTIVE'::text, 'FUNDED'::text, 'IN_PROGRESS'::text, 'COMPLETED'::text, 'FAILED'::text, 'CANCELLED'::text])));
ALTER TABLE consume.consume_opportunities ADD CONSTRAINT investment_opportunities_target_amount_check CHECK ((target_amount > (0)::numeric));
ALTER TABLE consume.consume_opportunities ADD CONSTRAINT investment_opportunities_title_check CHECK (((char_length(title) >= 10) AND (char_length(title) <= 200)));
ALTER TABLE consume.consume_participations ADD CONSTRAINT investment_participations_currency_type_check CHECK ((currency_type = ANY (ARRAY['PMP'::text, 'PMC'::text, 'MIXED'::text])));
ALTER TABLE consume.consume_participations ADD CONSTRAINT investment_participations_investment_amount_check CHECK ((investment_amount > (0)::numeric));
ALTER TABLE consume.consume_participations ADD CONSTRAINT investment_participations_pmc_amount_check CHECK ((pmc_amount >= (0)::numeric));
ALTER TABLE consume.consume_participations ADD CONSTRAINT investment_participations_pmp_amount_check CHECK ((pmp_amount >= 0));
ALTER TABLE consume.consume_participations ADD CONSTRAINT investment_participations_status_check CHECK ((status = ANY (ARRAY['ACTIVE'::text, 'COMPLETED'::text, 'CANCELLED'::text, 'DEFAULTED'::text])));
ALTER TABLE consume.consume_performance_metrics ADD CONSTRAINT investment_performance_metrics_verification_status_check CHECK ((verification_status = ANY (ARRAY['PENDING'::text, 'VERIFIED'::text, 'REJECTED'::text])));
ALTER TABLE consume.contributions ADD CONSTRAINT contributions_status_check CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'COMPLETED'::character varying, 'REFUNDED'::character varying, 'CANCELLED'::character varying])::text[])));
ALTER TABLE consume.funding_contributions ADD CONSTRAINT funding_contributions_amount_check CHECK ((amount > (0)::numeric));
ALTER TABLE consume.funding_contributions ADD CONSTRAINT funding_contributions_payment_method_check CHECK ((payment_method = ANY (ARRAY['PMC'::text, 'CARD'::text, 'TRANSFER'::text])));
ALTER TABLE consume.funding_contributions ADD CONSTRAINT funding_contributions_status_check CHECK ((status = ANY (ARRAY['PENDING'::text, 'COMPLETED'::text, 'CANCELLED'::text, 'REFUNDED'::text])));
ALTER TABLE consume.funding_projects ADD CONSTRAINT funding_projects_category_check CHECK ((category = ANY (ARRAY['ENVIRONMENT'::text, 'CREATIVE'::text, 'TECH'::text, 'SOCIAL'::text, 'EDUCATION'::text, 'OTHER'::text])));
ALTER TABLE consume.funding_projects ADD CONSTRAINT funding_projects_status_check CHECK ((status = ANY (ARRAY['DRAFT'::text, 'ACTIVE'::text, 'FUNDED'::text, 'COMPLETED'::text, 'CANCELLED'::text, 'FAILED'::text])));
ALTER TABLE consume.funding_projects ADD CONSTRAINT funding_projects_target_amount_check CHECK ((target_amount > (0)::numeric));
ALTER TABLE consume.local_stores ADD CONSTRAINT local_stores_category_check CHECK ((category = ANY (ARRAY['FOOD'::text, 'CAFE'::text, 'LIVING'::text, 'FASHION'::text, 'BEAUTY'::text, 'OTHER'::text])));
ALTER TABLE consume.payments ADD CONSTRAINT payments_payment_amount_check CHECK ((payment_amount > (0)::numeric));
ALTER TABLE consume.payments ADD CONSTRAINT payments_payment_method_check CHECK ((payment_method = ANY (ARRAY['QR'::text, 'CARD'::text, 'CASH'::text, 'TRANSFER'::text])));
ALTER TABLE consume.payments ADD CONSTRAINT payments_status_check CHECK ((status = ANY (ARRAY['PENDING'::text, 'COMPLETED'::text, 'CANCELLED'::text, 'REFUNDED'::text])));
ALTER TABLE demographic_data.statistics ADD CONSTRAINT statistics_period_month_check CHECK (((period_month >= 1) AND (period_month <= 12)));
ALTER TABLE demographic_data.statistics ADD CONSTRAINT statistics_period_quarter_check CHECK (((period_quarter >= 1) AND (period_quarter <= 4)));
ALTER TABLE demographic_data.statistics ADD CONSTRAINT statistics_period_type_check CHECK (((period_type)::text = ANY ((ARRAY['MONTHLY'::character varying, 'QUARTERLY'::character varying, 'YEARLY'::character varying])::text[])));
ALTER TABLE donation.direct_donation_items ADD CONSTRAINT direct_donation_items_category_check CHECK (((category)::text = ANY ((ARRAY['clothing'::character varying, 'food'::character varying, 'housing'::character varying, 'medical'::character varying, 'education'::character varying, 'electronics'::character varying, 'furniture'::character varying, 'other'::character varying])::text[])));
ALTER TABLE donation.direct_donation_items ADD CONSTRAINT direct_donation_items_condition_check CHECK (((condition)::text = ANY ((ARRAY['new'::character varying, 'like_new'::character varying, 'good'::character varying, 'fair'::character varying, 'poor'::character varying])::text[])));
ALTER TABLE donation.direct_donation_items ADD CONSTRAINT direct_donation_items_status_check CHECK (((status)::text = ANY ((ARRAY['available'::character varying, 'reserved'::character varying, 'matched'::character varying, 'delivering'::character varying, 'completed'::character varying, 'cancelled'::character varying])::text[])));
ALTER TABLE donation.direct_donation_requests ADD CONSTRAINT direct_donation_requests_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying, 'cancelled'::character varying])::text[])));
ALTER TABLE donation.donation_activity_logs ADD CONSTRAINT valid_activity_type CHECK ((activity_type = ANY (ARRAY['created'::text, 'updated'::text, 'completed'::text, 'cancelled'::text, 'certificate_issued'::text, 'refunded'::text])));
ALTER TABLE donation.donation_certificates ADD CONSTRAINT positive_tax_amount CHECK ((tax_deductible_amount >= (0)::numeric));
ALTER TABLE donation.donation_institutes ADD CONSTRAINT valid_category CHECK ((category = ANY (ARRAY['children'::text, 'elderly'::text, 'disaster'::text, 'environment'::text, 'education'::text, 'medical'::text, 'animal'::text, 'other'::text])));
ALTER TABLE donation.donation_institutes ADD CONSTRAINT valid_trust_score CHECK (((trust_score >= 0.0) AND (trust_score <= 10.0)));
ALTER TABLE donation.donations ADD CONSTRAINT positive_amounts CHECK (((amount > (0)::numeric) AND (pmc_amount > (0)::numeric)));
ALTER TABLE donation.donations ADD CONSTRAINT valid_category CHECK ((category = ANY (ARRAY['clothing'::text, 'food'::text, 'housing'::text, 'medical'::text, 'education'::text, 'other'::text, 'children'::text, 'elderly'::text, 'disabled'::text, 'disaster'::text, 'environment'::text, 'animal'::text])));
ALTER TABLE donation.donations ADD CONSTRAINT valid_donation_type CHECK ((donation_type = ANY (ARRAY['direct'::text, 'institute'::text, 'opinion_leader'::text])));
ALTER TABLE donation.donations ADD CONSTRAINT valid_recurring_period CHECK (((recurring_period = ANY (ARRAY['weekly'::text, 'monthly'::text, 'quarterly'::text])) OR (recurring_period IS NULL)));
ALTER TABLE donation.donations ADD CONSTRAINT valid_status CHECK ((status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'cancelled'::text, 'failed'::text])));
ALTER TABLE donation.opinion_leaders ADD CONSTRAINT opinion_leaders_category_check CHECK (((category)::text = ANY ((ARRAY['environment'::character varying, 'welfare'::character varying, 'science'::character varying, 'human_rights'::character varying, 'education'::character varying, 'health'::character varying, 'culture'::character varying, 'economy'::character varying, 'general'::character varying])::text[])));
ALTER TABLE economy.individual_utility_parameters ADD CONSTRAINT individual_utility_parameters_data_quality_check CHECK ((data_quality = ANY (ARRAY['HIGH'::text, 'MEDIUM'::text, 'LOW'::text])));
ALTER TABLE economy.money_wave1_ebit_records ADD CONSTRAINT money_wave1_ebit_records_verification_status_check CHECK ((verification_status = ANY (ARRAY['PENDING'::text, 'VERIFIED'::text, 'REJECTED'::text])));
ALTER TABLE economy.money_wave2_redistribution_records ADD CONSTRAINT money_wave2_redistribution_records_redistribution_reason_check CHECK ((redistribution_reason = ANY (ARRAY['DORMANCY'::text, 'SOCIAL_WELFARE'::text, 'INEQUALITY_REDUCTION'::text, 'PUBLIC_GOOD'::text])));
ALTER TABLE economy.money_wave_history ADD CONSTRAINT money_wave_history_status_check CHECK ((status = ANY (ARRAY['PENDING'::text, 'EXECUTING'::text, 'COMPLETED'::text, 'FAILED'::text])));
ALTER TABLE economy.money_wave_history ADD CONSTRAINT money_wave_history_wave_type_check CHECK ((wave_type = ANY (ARRAY['MONEY_WAVE_1'::text, 'MONEY_WAVE_2'::text, 'MONEY_WAVE_3'::text])));
ALTER TABLE economy.money_wave_hourly_category_allocations ADD CONSTRAINT money_wave_hourly_category_allocations_domain_check CHECK ((domain <> ''::text));
ALTER TABLE economy.money_wave_hourly_category_allocations ADD CONSTRAINT money_wave_hourly_category_allocations_pool_pmc_check CHECK ((pool_pmc >= (0)::numeric));
ALTER TABLE economy.money_wave_hourly_game_pools ADD CONSTRAINT money_wave_hourly_game_pools_domain_check CHECK ((domain <> ''::text));
ALTER TABLE economy.money_wave_hourly_game_pools ADD CONSTRAINT money_wave_hourly_game_pools_pool_pmc_check CHECK ((pool_pmc >= (0)::numeric));
ALTER TABLE economy.pmp_pmc_accounts ADD CONSTRAINT pmp_pmc_accounts_pmc_balance_check CHECK ((pmc_balance >= (0)::numeric));
ALTER TABLE economy.pmp_pmc_accounts ADD CONSTRAINT pmp_pmc_accounts_pmp_balance_check CHECK ((pmp_balance >= 0));
ALTER TABLE economy.pmp_pmc_transactions ADD CONSTRAINT pmp_pmc_transactions_check CHECK (((pmp_amount IS NOT NULL) OR (pmc_amount IS NOT NULL)));
ALTER TABLE economy.pmp_pmc_transactions ADD CONSTRAINT pmp_pmc_transactions_transaction_type_check CHECK ((transaction_type = ANY (ARRAY['PMP_EARN'::text, 'PMP_SPEND'::text, 'PMP_BURN'::text, 'PMC_EARN'::text, 'PMC_SPEND'::text, 'PMC_CONVERT'::text, 'DONATION'::text, 'REDISTRIBUTION'::text])));
ALTER TABLE economy.prediction_category_multipliers ADD CONSTRAINT prediction_category_multipliers_reward_multiplier_check CHECK ((reward_multiplier >= (0)::numeric));
ALTER TABLE economy.transparency_reports ADD CONSTRAINT valid_amounts CHECK (((total_received >= (0)::numeric) AND (total_used >= (0)::numeric) AND (total_used <= total_received)));
ALTER TABLE economy.transparency_reports ADD CONSTRAINT valid_period CHECK ((report_period_start <= report_period_end));
ALTER TABLE economy.utility_estimation_inputs ADD CONSTRAINT utility_estimation_inputs_action_type_check CHECK ((action_type = ANY (ARRAY['PMP_EARN'::text, 'PMC_CONVERT'::text, 'DONATION'::text, 'PREDICTION'::text, 'INVESTMENT'::text])));
ALTER TABLE economy.utility_estimation_inputs ADD CONSTRAINT utility_estimation_inputs_market_condition_check CHECK ((market_condition = ANY (ARRAY['BULL'::text, 'BEAR'::text, 'NEUTRAL'::text])));
ALTER TABLE economy.utility_estimation_inputs ADD CONSTRAINT utility_estimation_inputs_regret_level_check CHECK (((regret_level >= (0)::numeric) AND (regret_level <= (10)::numeric)));
ALTER TABLE economy.utility_estimation_inputs ADD CONSTRAINT utility_estimation_inputs_satisfaction_score_check CHECK (((satisfaction_score >= (1)::numeric) AND (satisfaction_score <= (10)::numeric)));
ALTER TABLE economy.utility_estimation_inputs ADD CONSTRAINT utility_estimation_inputs_social_context_check CHECK ((social_context = ANY (ARRAY['INDIVIDUAL'::text, 'GROUP'::text, 'COMMUNITY'::text])));
ALTER TABLE economy.utility_estimation_inputs ADD CONSTRAINT utility_estimation_inputs_time_of_day_check CHECK ((time_of_day = ANY (ARRAY['MORNING'::text, 'AFTERNOON'::text, 'EVENING'::text, 'NIGHT'::text])));
ALTER TABLE feed.items ADD CONSTRAINT items_ai_classification_check CHECK ((ai_classification = ANY (ARRAY['PREDICTION'::text, 'FORUM'::text, 'UNCLASSIFIED'::text, 'DISCARD'::text])));
ALTER TABLE feed.items ADD CONSTRAINT items_process_status_check CHECK ((process_status = ANY (ARRAY['PENDING'::text, 'CLASSIFIED'::text, 'DRAFT_CREATED'::text, 'PUBLISHED'::text, 'IGNORED'::text, 'ERROR'::text])));
ALTER TABLE forum.forum_activity_logs ADD CONSTRAINT valid_activity_type CHECK ((activity_type = ANY (ARRAY['post_created'::text, 'post_updated'::text, 'post_deleted'::text, 'comment_created'::text, 'comment_updated'::text, 'comment_deleted'::text, 'vote_cast'::text, 'solution_marked'::text, 'quality_reviewed'::text, 'news_quiz_completed'::text])));
ALTER TABLE forum.forum_comments ADD CONSTRAINT valid_depth CHECK (((depth >= 0) AND (depth <= 5)));
ALTER TABLE forum.forum_comments ADD CONSTRAINT valid_quality_score CHECK (((quality_score >= 0.0) AND (quality_score <= 10.0)));
ALTER TABLE forum.forum_comments ADD CONSTRAINT valid_status CHECK ((status = ANY (ARRAY['published'::text, 'edited'::text, 'deleted'::text])));
ALTER TABLE forum.forum_posts ADD CONSTRAINT forum_posts_section_check CHECK (((section)::text = ANY ((ARRAY['NEWS'::character varying, 'DEBATE'::character varying, 'BRAINSTORMING'::character varying, 'BUDGET'::character varying])::text[])));
ALTER TABLE forum.forum_posts ADD CONSTRAINT valid_post_type CHECK ((post_type = ANY (ARRAY['discussion'::text, 'question'::text, 'announcement'::text, 'debate'::text, 'brainstorming'::text])));
ALTER TABLE forum.forum_posts ADD CONSTRAINT valid_quality_score CHECK (((quality_score >= 0.0) AND (quality_score <= 10.0)));
ALTER TABLE forum.forum_posts ADD CONSTRAINT valid_status CHECK ((status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text, 'deleted'::text])));
ALTER TABLE forum.forum_prediction_links ADD CONSTRAINT forum_prediction_links_link_type_check CHECK (((link_type)::text = ANY ((ARRAY['SOURCE'::character varying, 'RELATED'::character varying, 'RESULT'::character varying])::text[])));
ALTER TABLE forum.forum_regions ADD CONSTRAINT forum_regions_level_check CHECK (((level)::text = ANY (ARRAY['DONG'::text, 'LOCAL'::text, 'REGION'::text, 'NATION'::text, 'COLONY'::text, 'COSMOS'::text])));
ALTER TABLE forum.forum_votes ADD CONSTRAINT valid_vote_type CHECK ((vote_type = ANY (ARRAY['like'::text, 'dislike'::text])));
ALTER TABLE forum.forum_votes ADD CONSTRAINT vote_target_check CHECK ((((post_id IS NOT NULL) AND (comment_id IS NULL)) OR ((post_id IS NULL) AND (comment_id IS NOT NULL))));
ALTER TABLE prediction.prediction_games ADD CONSTRAINT prediction_games_check CHECK ((max_bet_amount >= min_bet_amount));
ALTER TABLE prediction.prediction_games ADD CONSTRAINT prediction_games_check1 CHECK ((registration_end > registration_start));
ALTER TABLE prediction.prediction_games ADD CONSTRAINT prediction_games_check2 CHECK ((settlement_date > registration_end));
ALTER TABLE prediction.prediction_games ADD CONSTRAINT prediction_games_description_check CHECK (((char_length(description) >= 20) AND (char_length(description) <= 2000)));
ALTER TABLE prediction.prediction_games ADD CONSTRAINT prediction_games_difficulty_check CHECK (((difficulty >= 1.0) AND (difficulty <= 5.0)));
ALTER TABLE prediction.prediction_games ADD CONSTRAINT prediction_games_min_bet_amount_check CHECK ((min_bet_amount > 0));
ALTER TABLE prediction.prediction_games ADD CONSTRAINT prediction_games_settlement_type_check CHECK ((settlement_type = ANY (ARRAY['auto'::text, 'semi_auto'::text, 'manual'::text])));
ALTER TABLE prediction.prediction_games ADD CONSTRAINT prediction_games_title_check CHECK (((char_length(title) >= 10) AND (char_length(title) <= 200)));
ALTER TABLE prediction.prediction_settlements ADD CONSTRAINT prediction_settlements_accuracy_score_check CHECK (((accuracy_score >= (0)::numeric) AND (accuracy_score <= (100)::numeric)));
ALTER TABLE prediction.prediction_settlements ADD CONSTRAINT prediction_settlements_reward_amount_check CHECK ((reward_amount >= (0)::numeric));
ALTER TABLE prediction.predictions ADD CONSTRAINT predictions_bet_amount_check CHECK ((bet_amount > 0));
ALTER TABLE prediction.predictions ADD CONSTRAINT predictions_confidence_level_check CHECK (((confidence_level >= 1) AND (confidence_level <= 100)));
ALTER TABLE prediction.predictions ADD CONSTRAINT predictions_expected_reward_check CHECK ((expected_reward >= (0)::numeric));
ALTER TABLE prediction.predictions ADD CONSTRAINT predictions_odds_at_time_check CHECK ((odds_at_time > (0)::numeric));
ALTER TABLE prediction.settlement_history ADD CONSTRAINT settlement_history_settlement_method_check CHECK ((settlement_method = ANY (ARRAY['auto'::text, 'semi_auto'::text, 'manual'::text])));
ALTER TABLE prediction.settlement_sources ADD CONSTRAINT settlement_sources_source_type_check CHECK ((source_type = ANY (ARRAY['football_data'::text, 'kosis'::text, 'manual'::text, 'dart'::text, 'thesportsdb'::text, 'alpha-vantage'::text, 'fmp'::text, 'ecos'::text, 'kobis'::text, 'kcontent'::text, 'coingecko'::text, 'rss_ai'::text, 'kr_public'::text])));
ALTER TABLE prediction.user_challenge_bets ADD CONSTRAINT user_challenge_bets_amount_pmp_check CHECK ((amount_pmp > 0));
ALTER TABLE study_cycle.sc_assessments ADD CONSTRAINT sc_assessments_status_check CHECK ((status = ANY (ARRAY['in_progress'::text, 'completed'::text])));
ALTER TABLE study_cycle.sc_questions ADD CONSTRAINT sc_questions_question_type_check CHECK ((question_type = ANY (ARRAY['multiple_choice'::text, 'short_answer'::text, 'template_based'::text])));
ALTER TABLE study_cycle.sc_reading_progress ADD CONSTRAINT sc_reading_progress_comprehension_rating_check CHECK (((comprehension_rating >= 1) AND (comprehension_rating <= 10)));
ALTER TABLE study_cycle.sc_reading_progress ADD CONSTRAINT sc_reading_progress_difficulty_rating_check CHECK (((difficulty_rating >= 1) AND (difficulty_rating <= 5)));
ALTER TABLE study_cycle.sc_reading_progress ADD CONSTRAINT sc_reading_progress_pages_read_check CHECK ((pages_read >= 0));
ALTER TABLE study_cycle.sc_reading_progress ADD CONSTRAINT sc_reading_progress_time_spent_minutes_check CHECK ((time_spent_minutes >= 0));
ALTER TABLE study_cycle.sc_readings ADD CONSTRAINT completed_reading_must_have_dates CHECK (((status <> 'completed'::text) OR ((status = 'completed'::text) AND (started_at IS NOT NULL) AND (completed_at IS NOT NULL))));
ALTER TABLE study_cycle.sc_readings ADD CONSTRAINT sc_readings_daily_pages_target_check CHECK ((daily_pages_target > 0));
ALTER TABLE study_cycle.sc_readings ADD CONSTRAINT sc_readings_round_check CHECK (((round >= 1) AND (round <= 10)));
ALTER TABLE study_cycle.sc_readings ADD CONSTRAINT sc_readings_status_check CHECK ((status = ANY (ARRAY['not_started'::text, 'in_progress'::text, 'completed'::text, 'paused'::text, 'abandoned'::text])));
ALTER TABLE study_cycle.sc_readings ADD CONSTRAINT sc_readings_total_pages_read_check CHECK ((total_pages_read >= 0));
ALTER TABLE study_cycle.sc_readings ADD CONSTRAINT sc_readings_total_time_minutes_check CHECK ((total_time_minutes >= 0));
ALTER TABLE study_cycle.sc_readings ADD CONSTRAINT sc_readings_weekly_hours_target_check CHECK ((weekly_hours_target > 0));
ALTER TABLE study_cycle.sc_readings ADD CONSTRAINT valid_reading_timeline CHECK ((((started_at IS NULL) AND (status = 'not_started'::text)) OR ((started_at IS NOT NULL) AND (status <> 'not_started'::text))));
ALTER TABLE "user".healing_creations ADD CONSTRAINT healing_creations_kind_check CHECK ((kind = ANY (ARRAY['album'::text, 'exhibition'::text, 'novel'::text])));
ALTER TABLE "user".opinion_leaders ADD CONSTRAINT valid_category CHECK ((category = ANY (ARRAY['politics'::text, 'environment'::text, 'social'::text, 'technology'::text, 'education'::text, 'culture'::text, 'other'::text])));
ALTER TABLE "user".opinion_leaders ADD CONSTRAINT valid_verification CHECK ((verification_status = ANY (ARRAY['pending'::text, 'verified'::text, 'rejected'::text])));
ALTER TABLE "user".profiles ADD CONSTRAINT profiles_role_check CHECK ((role = ANY (ARRAY['user'::text, 'moderator'::text, 'admin'::text, 'super_admin'::text])));
ALTER TABLE "user".user_reputation_metrics ADD CONSTRAINT user_reputation_metrics_community_trust_level_check CHECK (((community_trust_level >= 1) AND (community_trust_level <= 5)));
ALTER TABLE "user".user_reputation_metrics ADD CONSTRAINT user_reputation_metrics_forum_contribution_score_check CHECK ((forum_contribution_score >= 0));
ALTER TABLE "user".user_reputation_metrics ADD CONSTRAINT user_reputation_metrics_helpful_posts_count_check CHECK ((helpful_posts_count >= 0));
ALTER TABLE "user".user_reputation_metrics ADD CONSTRAINT user_reputation_metrics_investment_success_rate_check CHECK (((investment_success_rate >= (0)::numeric) AND (investment_success_rate <= (100)::numeric)));
ALTER TABLE "user".user_reputation_metrics ADD CONSTRAINT user_reputation_metrics_overall_reputation_score_check CHECK ((overall_reputation_score >= (0)::numeric));
ALTER TABLE "user".user_reputation_metrics ADD CONSTRAINT user_reputation_metrics_prediction_accuracy_rate_check CHECK (((prediction_accuracy_rate >= (0)::numeric) AND (prediction_accuracy_rate <= (100)::numeric)));
ALTER TABLE "user".user_reputation_metrics ADD CONSTRAINT user_reputation_metrics_reputation_tier_check CHECK ((reputation_tier = ANY (ARRAY['bronze'::text, 'silver'::text, 'gold'::text, 'platinum'::text, 'diamond'::text])));
ALTER TABLE "user".user_reputation_metrics ADD CONSTRAINT user_reputation_metrics_successful_predictions_check CHECK ((successful_predictions >= 0));
ALTER TABLE "user".user_reputation_metrics ADD CONSTRAINT user_reputation_metrics_total_investments_made_check CHECK ((total_investments_made >= 0));
ALTER TABLE "user".user_reputation_metrics ADD CONSTRAINT user_reputation_metrics_total_predictions_made_check CHECK ((total_predictions_made >= 0));
ALTER TABLE "user".user_utility_clusters ADD CONSTRAINT user_utility_clusters_risk_tolerance_level_check CHECK ((risk_tolerance_level = ANY (ARRAY['LOW'::text, 'MEDIUM'::text, 'HIGH'::text])));
ALTER TABLE "user".user_utility_clusters ADD CONSTRAINT user_utility_clusters_social_orientation_check CHECK ((social_orientation = ANY (ARRAY['INDIVIDUALISTIC'::text, 'COOPERATIVE'::text, 'ALTRUISTIC'::text])));
ALTER TABLE vertical_housing.exam_options ADD CONSTRAINT chk_mastery_tier CHECK (((mastery_tier >= 1) AND (mastery_tier <= 5)));
ALTER TABLE vertical_housing.exam_options ADD CONSTRAINT chk_option_number CHECK (((option_number >= 1) AND (option_number <= 5)));
ALTER TABLE vertical_housing.exam_questions ADD CONSTRAINT chk_exam_stage CHECK ((exam_stage = ANY (ARRAY['1차'::text, '2차'::text])));
ALTER TABLE vertical_housing.exam_questions ADD CONSTRAINT chk_importance_tier CHECK (((importance_tier IS NULL) OR (importance_tier = ANY (ARRAY['S'::text, 'A'::text, 'B'::text, 'C'::text]))));
ALTER TABLE vertical_housing.exam_questions ADD CONSTRAINT chk_law_status CHECK ((law_status = ANY (ARRAY['VALID'::text, 'NEEDS_REVIEW'::text, 'AMENDED_MODIFIED'::text, 'DEPRECATED'::text])));
ALTER TABLE vertical_housing.exam_questions ADD CONSTRAINT chk_question_type CHECK ((question_type = ANY (ARRAY['OBJECTIVE'::text, 'SUBJECTIVE'::text])));
ALTER TABLE vertical_housing.option_mastery ADD CONSTRAINT chk_mastery_status CHECK ((status = ANY (ARRAY['O'::text, 'STAR'::text, 'X'::text])));
ALTER TABLE vertical_housing.study_option_logs ADD CONSTRAINT study_option_logs_mark_status_check CHECK ((mark_status = ANY (ARRAY['O'::text, 'STAR'::text, 'X'::text])));
ALTER TABLE vertical_housing.study_question_logs ADD CONSTRAINT study_question_logs_question_mark_check CHECK ((question_mark = ANY (ARRAY['O'::text, 'STAR'::text, 'X'::text])));

-- -----------------------------------------------------------------------------
-- 6. Foreign Key Constraints
-- -----------------------------------------------------------------------------
ALTER TABLE assessment.assessments ADD CONSTRAINT assessments_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES auth.users(id);
ALTER TABLE assessment.questions ADD CONSTRAINT questions_assessment_id_fkey FOREIGN KEY (assessment_id) REFERENCES assessment.assessments(id) ON DELETE CASCADE;
ALTER TABLE assessment.submissions ADD CONSTRAINT submissions_assessment_id_fkey FOREIGN KEY (assessment_id) REFERENCES assessment.assessments(id) ON DELETE CASCADE;
ALTER TABLE assessment.submissions ADD CONSTRAINT submissions_student_id_fkey FOREIGN KEY (student_id) REFERENCES auth.users(id);
ALTER TABLE consume.ad_views ADD CONSTRAINT ad_views_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES consume.ad_campaigns(id);
ALTER TABLE consume.ad_views ADD CONSTRAINT ad_views_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
ALTER TABLE consume.consume_categories ADD CONSTRAINT investment_categories_parent_fkey FOREIGN KEY (parent_category_id) REFERENCES consume.consume_categories(id) ON DELETE SET NULL;
ALTER TABLE consume.consume_opportunities ADD CONSTRAINT investment_opportunities_creator_fkey FOREIGN KEY (creator_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE consume.consume_participations ADD CONSTRAINT investment_participations_investor_fkey FOREIGN KEY (investor_id) REFERENCES economy.pmp_pmc_accounts(user_id) ON DELETE CASCADE;
ALTER TABLE consume.consume_participations ADD CONSTRAINT investment_participations_opportunity_fkey FOREIGN KEY (opportunity_id) REFERENCES consume.consume_opportunities(id) ON DELETE CASCADE;
ALTER TABLE consume.consume_performance_metrics ADD CONSTRAINT investment_performance_metrics_opportunity_fkey FOREIGN KEY (opportunity_id) REFERENCES consume.consume_opportunities(id) ON DELETE CASCADE;
ALTER TABLE consume.contributions ADD CONSTRAINT contributions_project_id_fkey FOREIGN KEY (project_id) REFERENCES consume.funding_projects(id);
ALTER TABLE consume.daily_view_stats ADD CONSTRAINT daily_view_stats_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
ALTER TABLE consume.funding_contributions ADD CONSTRAINT funding_contributions_project_id_fkey FOREIGN KEY (project_id) REFERENCES consume.funding_projects(id);
ALTER TABLE consume.funding_contributions ADD CONSTRAINT funding_contributions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
ALTER TABLE consume.funding_projects ADD CONSTRAINT funding_projects_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES auth.users(id);
ALTER TABLE consume.local_stores ADD CONSTRAINT local_stores_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id);
ALTER TABLE consume.payments ADD CONSTRAINT payments_store_id_fkey FOREIGN KEY (store_id) REFERENCES consume.local_stores(id);
ALTER TABLE consume.payments ADD CONSTRAINT payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
ALTER TABLE demographic_data.prediction_stat_links ADD CONSTRAINT prediction_stat_links_region_code_fkey FOREIGN KEY (region_code) REFERENCES forum.forum_regions(code);
ALTER TABLE demographic_data.statistics ADD CONSTRAINT statistics_region_code_fkey FOREIGN KEY (region_code) REFERENCES forum.forum_regions(code);
ALTER TABLE demographic_data.statistics ADD CONSTRAINT statistics_source_id_fkey FOREIGN KEY (source_id) REFERENCES demographic_data.data_sources(id);
ALTER TABLE donation.direct_donation_items ADD CONSTRAINT direct_donation_items_donor_user_id_fkey FOREIGN KEY (donor_user_id) REFERENCES auth.users(id);
ALTER TABLE donation.direct_donation_progress ADD CONSTRAINT direct_donation_progress_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
ALTER TABLE donation.direct_donation_progress ADD CONSTRAINT direct_donation_progress_item_id_fkey FOREIGN KEY (item_id) REFERENCES donation.direct_donation_items(id);
ALTER TABLE donation.direct_donation_requests ADD CONSTRAINT direct_donation_requests_item_id_fkey FOREIGN KEY (item_id) REFERENCES donation.direct_donation_items(id);
ALTER TABLE donation.direct_donation_requests ADD CONSTRAINT direct_donation_requests_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES donation.donation_recipients(id);
ALTER TABLE donation.donation_activity_logs ADD CONSTRAINT donation_activity_logs_donation_id_fkey FOREIGN KEY (donation_id) REFERENCES donation.donations(id);
ALTER TABLE donation.donation_certificates ADD CONSTRAINT donation_certificates_donation_id_fkey FOREIGN KEY (donation_id) REFERENCES donation.donations(id);
ALTER TABLE donation.donation_certificates ADD CONSTRAINT donation_certificates_donor_id_fkey FOREIGN KEY (donor_id) REFERENCES "user".users(id);
ALTER TABLE donation.donation_recipients ADD CONSTRAINT donation_recipients_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
ALTER TABLE donation.donations ADD CONSTRAINT donations_donor_id_fkey FOREIGN KEY (donor_id) REFERENCES auth.users(id);
ALTER TABLE donation.donations ADD CONSTRAINT donations_institute_id_fkey FOREIGN KEY (institute_id) REFERENCES donation.donation_institutes(id);
ALTER TABLE donation.donations ADD CONSTRAINT donations_opinion_leader_id_fkey FOREIGN KEY (opinion_leader_id) REFERENCES "user".opinion_leaders(id);
ALTER TABLE donation.funding_wishlist_requests ADD CONSTRAINT funding_wishlist_requests_project_id_fkey FOREIGN KEY (project_id) REFERENCES donation.funding_projects(id) ON DELETE CASCADE;
ALTER TABLE donation.opinion_leader_endorsements ADD CONSTRAINT opinion_leader_endorsements_institute_id_fkey FOREIGN KEY (institute_id) REFERENCES donation.donation_institutes(id) ON DELETE CASCADE;
ALTER TABLE donation.opinion_leader_endorsements ADD CONSTRAINT opinion_leader_endorsements_opinion_leader_id_fkey FOREIGN KEY (opinion_leader_id) REFERENCES donation.opinion_leaders(id) ON DELETE CASCADE;
ALTER TABLE donation.opinion_leader_followers ADD CONSTRAINT opinion_leader_followers_follower_user_id_fkey FOREIGN KEY (follower_user_id) REFERENCES auth.users(id);
ALTER TABLE donation.opinion_leader_followers ADD CONSTRAINT opinion_leader_followers_opinion_leader_id_fkey FOREIGN KEY (opinion_leader_id) REFERENCES donation.opinion_leaders(id) ON DELETE CASCADE;
ALTER TABLE donation.opinion_leaders ADD CONSTRAINT opinion_leaders_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
ALTER TABLE economy.account_activity_stats ADD CONSTRAINT account_activity_stats_user_id_fkey FOREIGN KEY (user_id) REFERENCES economy.pmp_pmc_accounts(user_id);
ALTER TABLE economy.money_wave1_ebit_records ADD CONSTRAINT money_wave1_ebit_records_wave_id_fkey FOREIGN KEY (wave_id) REFERENCES economy.money_wave_history(wave_id);
ALTER TABLE economy.money_wave2_redistribution_records ADD CONSTRAINT money_wave2_redistribution_records_wave_id_fkey FOREIGN KEY (wave_id) REFERENCES economy.money_wave_history(wave_id);
ALTER TABLE economy.money_wave3_entrepreneur_records ADD CONSTRAINT money_wave3_entrepreneur_records_wave_id_fkey FOREIGN KEY (wave_id) REFERENCES economy.money_wave_history(wave_id);
ALTER TABLE economy.money_wave_effectiveness ADD CONSTRAINT money_wave_effectiveness_wave_id_fkey FOREIGN KEY (wave_id) REFERENCES economy.money_wave_history(wave_id);
ALTER TABLE economy.pmp_pmc_transactions ADD CONSTRAINT pmp_pmc_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES economy.pmp_pmc_accounts(user_id);
ALTER TABLE economy.transparency_reports ADD CONSTRAINT transparency_reports_institute_id_fkey FOREIGN KEY (institute_id) REFERENCES donation.donation_institutes(id);
ALTER TABLE economy.transparency_reports ADD CONSTRAINT transparency_reports_opinion_leader_id_fkey FOREIGN KEY (opinion_leader_id) REFERENCES "user".opinion_leaders(id);
ALTER TABLE economy.utility_estimation_inputs ADD CONSTRAINT utility_estimation_inputs_user_id_fkey FOREIGN KEY (user_id) REFERENCES economy.individual_utility_parameters(user_id);
ALTER TABLE economy.utility_predictions ADD CONSTRAINT utility_predictions_user_id_fkey FOREIGN KEY (user_id) REFERENCES economy.individual_utility_parameters(user_id);
ALTER TABLE feed.items ADD CONSTRAINT items_source_id_fkey FOREIGN KEY (source_id) REFERENCES feed.rss_sources(id);
ALTER TABLE forum.forum_activity_logs ADD CONSTRAINT forum_activity_logs_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES forum.forum_comments(id);
ALTER TABLE forum.forum_activity_logs ADD CONSTRAINT forum_activity_logs_post_id_fkey FOREIGN KEY (post_id) REFERENCES forum.forum_posts(id) ON DELETE CASCADE;
ALTER TABLE forum.forum_activity_logs ADD CONSTRAINT forum_activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES "user".users(id);
ALTER TABLE forum.forum_comments ADD CONSTRAINT forum_comments_author_id_fkey FOREIGN KEY (author_id) REFERENCES "user".users(id);
ALTER TABLE forum.forum_comments ADD CONSTRAINT forum_comments_parent_comment_id_fkey FOREIGN KEY (parent_comment_id) REFERENCES forum.forum_comments(id);
ALTER TABLE forum.forum_comments ADD CONSTRAINT forum_comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES forum.forum_posts(id) ON DELETE CASCADE;
ALTER TABLE forum.forum_post_tags ADD CONSTRAINT forum_post_tags_post_id_fkey FOREIGN KEY (post_id) REFERENCES forum.forum_posts(id) ON DELETE CASCADE;
ALTER TABLE forum.forum_post_tags ADD CONSTRAINT forum_post_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES forum.forum_tags(id);
ALTER TABLE forum.forum_posts ADD CONSTRAINT forum_posts_author_id_fkey FOREIGN KEY (author_id) REFERENCES "user".users(id);
ALTER TABLE forum.forum_posts ADD CONSTRAINT forum_posts_category_id_fkey FOREIGN KEY (category_id) REFERENCES forum.forum_categories(id);
ALTER TABLE forum.forum_prediction_links ADD CONSTRAINT forum_prediction_links_forum_post_id_fkey FOREIGN KEY (forum_post_id) REFERENCES forum.forum_posts(id) ON DELETE CASCADE;
ALTER TABLE forum.forum_regions ADD CONSTRAINT forum_regions_parent_code_fkey FOREIGN KEY (parent_code) REFERENCES forum.forum_regions(code);
ALTER TABLE forum.forum_votes ADD CONSTRAINT forum_votes_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES forum.forum_comments(id);
ALTER TABLE forum.forum_votes ADD CONSTRAINT forum_votes_post_id_fkey FOREIGN KEY (post_id) REFERENCES forum.forum_posts(id) ON DELETE CASCADE;
ALTER TABLE forum.forum_votes ADD CONSTRAINT forum_votes_user_id_fkey FOREIGN KEY (user_id) REFERENCES "user".users(id);
ALTER TABLE oauth_provider.auth_codes ADD CONSTRAINT auth_codes_client_id_fkey FOREIGN KEY (client_id) REFERENCES oauth_provider.clients(id);
ALTER TABLE oauth_provider.tokens ADD CONSTRAINT tokens_client_id_fkey FOREIGN KEY (client_id) REFERENCES oauth_provider.clients(id);
ALTER TABLE prediction.game_snapshots ADD CONSTRAINT game_snapshots_game_id_fkey FOREIGN KEY (game_id) REFERENCES prediction.prediction_games(game_id) ON DELETE CASCADE;
ALTER TABLE prediction.prediction_games ADD CONSTRAINT prediction_games_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE prediction.prediction_settlements ADD CONSTRAINT prediction_settlements_game_id_fkey FOREIGN KEY (game_id) REFERENCES prediction.prediction_games(game_id) ON DELETE CASCADE;
ALTER TABLE prediction.prediction_settlements ADD CONSTRAINT prediction_settlements_prediction_id_fkey FOREIGN KEY (prediction_id) REFERENCES prediction.predictions(prediction_id) ON DELETE CASCADE;
ALTER TABLE prediction.prediction_settlements ADD CONSTRAINT prediction_settlements_user_id_fkey FOREIGN KEY (user_id) REFERENCES economy.pmp_pmc_accounts(user_id) ON DELETE CASCADE;
ALTER TABLE prediction.prediction_statistics ADD CONSTRAINT prediction_statistics_game_id_fkey FOREIGN KEY (game_id) REFERENCES prediction.prediction_games(game_id) ON DELETE CASCADE;
ALTER TABLE prediction.prediction_trends ADD CONSTRAINT prediction_trends_game_id_fkey FOREIGN KEY (game_id) REFERENCES prediction.prediction_games(game_id) ON DELETE CASCADE;
ALTER TABLE prediction.predictions ADD CONSTRAINT predictions_game_id_fkey FOREIGN KEY (game_id) REFERENCES prediction.prediction_games(game_id) ON DELETE CASCADE;
ALTER TABLE prediction.predictions ADD CONSTRAINT predictions_user_id_fkey FOREIGN KEY (user_id) REFERENCES economy.pmp_pmc_accounts(user_id) ON DELETE CASCADE;
ALTER TABLE prediction.settlement_history ADD CONSTRAINT settlement_history_game_id_fkey FOREIGN KEY (game_id) REFERENCES prediction.prediction_games(game_id) ON DELETE CASCADE;
ALTER TABLE prediction.settlement_history ADD CONSTRAINT settlement_history_settled_by_fkey FOREIGN KEY (settled_by) REFERENCES auth.users(id);
ALTER TABLE prediction.settlement_sources ADD CONSTRAINT settlement_sources_game_id_fkey FOREIGN KEY (game_id) REFERENCES prediction.prediction_games(game_id) ON DELETE CASCADE;
ALTER TABLE prediction.user_challenge_bets ADD CONSTRAINT user_challenge_bets_challenge_id_fkey FOREIGN KEY (challenge_id) REFERENCES prediction.user_challenges(id) ON DELETE CASCADE;
ALTER TABLE prediction.user_challenge_comments ADD CONSTRAINT user_challenge_comments_challenge_id_fkey FOREIGN KEY (challenge_id) REFERENCES prediction.user_challenges(id) ON DELETE CASCADE;
ALTER TABLE prediction.user_challenges ADD CONSTRAINT user_challenges_linked_game_id_fkey FOREIGN KEY (linked_game_id) REFERENCES prediction.prediction_games(game_id) ON DELETE SET NULL;
ALTER TABLE public.wrong_answers ADD CONSTRAINT wrong_answers_quiz_id_fkey FOREIGN KEY (quiz_id) REFERENCES cloze_quizzes(id) ON DELETE CASCADE;
ALTER TABLE study_cycle.sc_assessments ADD CONSTRAINT sc_assessments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE study_cycle.sc_chapters ADD CONSTRAINT sc_chapters_textbook_id_fkey FOREIGN KEY (textbook_id) REFERENCES study_cycle.sc_textbooks(id) ON DELETE CASCADE;
ALTER TABLE study_cycle.sc_questions ADD CONSTRAINT sc_questions_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES study_cycle.sc_chapters(id) ON DELETE CASCADE;
ALTER TABLE study_cycle.sc_reading_progress ADD CONSTRAINT sc_reading_progress_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES study_cycle.sc_chapters(id) ON DELETE CASCADE;
ALTER TABLE study_cycle.sc_reading_progress ADD CONSTRAINT sc_reading_progress_reading_id_fkey FOREIGN KEY (reading_id) REFERENCES study_cycle.sc_readings(id) ON DELETE CASCADE;
ALTER TABLE study_cycle.sc_readings ADD CONSTRAINT sc_readings_textbook_id_fkey FOREIGN KEY (textbook_id) REFERENCES study_cycle.sc_textbooks(id) ON DELETE CASCADE;
ALTER TABLE study_cycle.sc_readings ADD CONSTRAINT sc_readings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE study_cycle.sc_study_sessions ADD CONSTRAINT sc_study_sessions_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES study_cycle.sc_chapters(id) ON DELETE CASCADE;
ALTER TABLE study_cycle.sc_study_sessions ADD CONSTRAINT sc_study_sessions_textbook_id_fkey FOREIGN KEY (textbook_id) REFERENCES study_cycle.sc_textbooks(id) ON DELETE CASCADE;
ALTER TABLE study_cycle.sc_study_sessions ADD CONSTRAINT sc_study_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE study_cycle.sc_textbooks ADD CONSTRAINT sc_textbooks_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE study_cycle.sc_user_answers ADD CONSTRAINT sc_user_answers_assessment_id_fkey FOREIGN KEY (assessment_id) REFERENCES study_cycle.sc_assessments(id) ON DELETE CASCADE;
ALTER TABLE study_cycle.sc_user_answers ADD CONSTRAINT sc_user_answers_question_id_fkey FOREIGN KEY (question_id) REFERENCES study_cycle.sc_questions(id) ON DELETE CASCADE;
ALTER TABLE study_cycle.sc_user_answers ADD CONSTRAINT sc_user_answers_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE study_cycle.sc_user_textbook_progress ADD CONSTRAINT sc_user_textbook_progress_textbook_id_fkey FOREIGN KEY (textbook_id) REFERENCES study_cycle.sc_textbooks(id) ON DELETE CASCADE;
ALTER TABLE study_cycle.sc_user_textbook_progress ADD CONSTRAINT sc_user_textbook_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE "user".healing_creation_resonances ADD CONSTRAINT healing_creation_resonances_creation_id_fkey FOREIGN KEY (creation_id) REFERENCES "user".healing_creations(id) ON DELETE CASCADE;
ALTER TABLE "user".opinion_leaders ADD CONSTRAINT opinion_leaders_user_id_fkey FOREIGN KEY (user_id) REFERENCES "user".users(id);
ALTER TABLE "user".profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE "user".user_cluster_assignments ADD CONSTRAINT user_cluster_assignments_cluster_id_fkey FOREIGN KEY (cluster_id) REFERENCES "user".user_utility_clusters(cluster_id);
ALTER TABLE "user".user_cluster_assignments ADD CONSTRAINT user_cluster_assignments_user_id_fkey FOREIGN KEY (user_id) REFERENCES economy.individual_utility_parameters(user_id);
ALTER TABLE "user".user_reputation_metrics ADD CONSTRAINT user_reputation_metrics_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE vertical_housing.ai_scan_logs ADD CONSTRAINT ai_scan_logs_serial_id_fkey FOREIGN KEY (serial_id) REFERENCES vertical_housing.book_serials(id);
ALTER TABLE vertical_housing.ai_scan_logs ADD CONSTRAINT ai_scan_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE vertical_housing.book_serials ADD CONSTRAINT book_serials_registered_user_id_fkey FOREIGN KEY (registered_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE vertical_housing.exam_options ADD CONSTRAINT exam_options_cluster_id_fkey FOREIGN KEY (cluster_id) REFERENCES vertical_housing.option_clusters(id) ON DELETE SET NULL;
ALTER TABLE vertical_housing.exam_options ADD CONSTRAINT exam_options_question_id_fkey FOREIGN KEY (question_id) REFERENCES vertical_housing.exam_questions(id) ON DELETE CASCADE;
ALTER TABLE vertical_housing.option_mastery ADD CONSTRAINT option_mastery_option_id_fkey FOREIGN KEY (option_id) REFERENCES vertical_housing.exam_options(id) ON DELETE CASCADE;
ALTER TABLE vertical_housing.option_mastery ADD CONSTRAINT option_mastery_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE vertical_housing.study_cones ADD CONSTRAINT study_cones_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE vertical_housing.study_option_logs ADD CONSTRAINT study_option_logs_option_id_fkey FOREIGN KEY (option_id) REFERENCES vertical_housing.exam_options(id) ON DELETE CASCADE;
ALTER TABLE vertical_housing.study_option_logs ADD CONSTRAINT study_option_logs_question_id_fkey FOREIGN KEY (question_id) REFERENCES vertical_housing.exam_questions(id) ON DELETE CASCADE;
ALTER TABLE vertical_housing.study_option_logs ADD CONSTRAINT study_option_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE vertical_housing.study_question_logs ADD CONSTRAINT study_question_logs_question_id_fkey FOREIGN KEY (question_id) REFERENCES vertical_housing.exam_questions(id) ON DELETE CASCADE;
ALTER TABLE vertical_housing.study_question_logs ADD CONSTRAINT study_question_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE vertical_housing.study_user_profiles ADD CONSTRAINT study_user_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- -----------------------------------------------------------------------------
-- 7. Indexes
-- -----------------------------------------------------------------------------
CREATE INDEX idx_assessments_creator ON assessment.assessments USING btree (creator_id);
CREATE INDEX idx_assessments_status ON assessment.assessments USING btree (status);
CREATE INDEX idx_questions_assessment_id ON assessment.questions USING btree (assessment_id);
CREATE INDEX idx_submissions_assessment_id ON assessment.submissions USING btree (assessment_id);
CREATE INDEX idx_submissions_student_id ON assessment.submissions USING btree (student_id);
CREATE INDEX idx_ad_campaigns_status ON consume.ad_campaigns USING btree (status);
CREATE INDEX idx_ad_views_campaign ON consume.ad_views USING btree (campaign_id);
CREATE INDEX idx_ad_views_user_date ON consume.ad_views USING btree (user_id, view_date);
CREATE INDEX idx_investment_categories_active ON consume.consume_categories USING btree (is_active);
CREATE INDEX idx_investment_categories_parent ON consume.consume_categories USING btree (parent_category_id);
CREATE INDEX idx_investment_opportunities_category ON consume.consume_opportunities USING btree (category);
CREATE INDEX idx_investment_opportunities_creator ON consume.consume_opportunities USING btree (creator_id);
CREATE INDEX idx_investment_opportunities_funding_dates ON consume.consume_opportunities USING btree (funding_start_date, funding_end_date);
CREATE INDEX idx_investment_opportunities_status ON consume.consume_opportunities USING btree (status);
CREATE INDEX idx_investment_opportunities_type ON consume.consume_opportunities USING btree (consume_type);
CREATE INDEX idx_investment_participations_investor ON consume.consume_participations USING btree (investor_id);
CREATE INDEX idx_investment_participations_opportunity ON consume.consume_participations USING btree (opportunity_id);
CREATE INDEX idx_investment_participations_status ON consume.consume_participations USING btree (status);
CREATE INDEX idx_investment_performance_date ON consume.consume_performance_metrics USING btree (measurement_date);
CREATE INDEX idx_investment_performance_opportunity ON consume.consume_performance_metrics USING btree (opportunity_id);
CREATE INDEX idx_contributions_project ON consume.contributions USING btree (project_id);
CREATE INDEX idx_contributions_user ON consume.contributions USING btree (user_id);
CREATE INDEX idx_daily_view_stats_user_date ON consume.daily_view_stats USING btree (user_id, view_date);
CREATE INDEX idx_funding_contributions_project ON consume.funding_contributions USING btree (project_id);
CREATE INDEX idx_funding_contributions_user ON consume.funding_contributions USING btree (user_id);
CREATE INDEX idx_consume_funding_projects_creator_id ON consume.funding_projects USING btree (creator_id);
CREATE INDEX idx_funding_projects_category ON consume.funding_projects USING btree (category);
CREATE INDEX idx_funding_projects_status ON consume.funding_projects USING btree (status);
CREATE INDEX idx_consume_local_stores_owner_id ON consume.local_stores USING btree (owner_id);
CREATE INDEX idx_local_stores_active ON consume.local_stores USING btree (is_active);
CREATE INDEX idx_local_stores_category ON consume.local_stores USING btree (category);
CREATE INDEX idx_payments_date ON consume.payments USING btree (payment_date);
CREATE INDEX idx_payments_store ON consume.payments USING btree (store_id);
CREATE INDEX idx_payments_user ON consume.payments USING btree (user_id);
CREATE INDEX idx_demo_prediction_links_category ON demographic_data.prediction_stat_links USING btree (category);
CREATE INDEX idx_demo_prediction_links_game ON demographic_data.prediction_stat_links USING btree (prediction_game_id);
CREATE INDEX idx_demographic_stat_links_region_code ON demographic_data.prediction_stat_links USING btree (region_code);
CREATE INDEX idx_demo_stats_category ON demographic_data.statistics USING btree (category);
CREATE INDEX idx_demo_stats_period ON demographic_data.statistics USING btree (period_year, period_month);
CREATE INDEX idx_demo_stats_region ON demographic_data.statistics USING btree (region_code);
CREATE INDEX idx_demographic_statistics_source_id ON demographic_data.statistics USING btree (source_id);
CREATE INDEX idx_direct_items_category ON donation.direct_donation_items USING btree (category);
CREATE INDEX idx_direct_items_donor ON donation.direct_donation_items USING btree (donor_user_id);
CREATE INDEX idx_direct_items_status ON donation.direct_donation_items USING btree (status);
CREATE INDEX idx_direct_donation_progress_created_by ON donation.direct_donation_progress USING btree (created_by);
CREATE INDEX idx_direct_donation_progress_item_id ON donation.direct_donation_progress USING btree (item_id);
CREATE INDEX idx_requests_item ON donation.direct_donation_requests USING btree (item_id);
CREATE INDEX idx_requests_recipient ON donation.direct_donation_requests USING btree (recipient_id);
CREATE INDEX idx_donation_activity_logs_activity_type ON donation.donation_activity_logs USING btree (activity_type);
CREATE INDEX idx_donation_activity_logs_created_at ON donation.donation_activity_logs USING btree (created_at);
CREATE INDEX idx_donation_activity_logs_donation_id ON donation.donation_activity_logs USING btree (donation_id);
CREATE INDEX idx_donation_certificates_donation_id ON donation.donation_certificates USING btree (donation_id);
CREATE INDEX idx_donation_certificates_donor_id ON donation.donation_certificates USING btree (donor_id);
CREATE INDEX idx_donation_certificates_issue_date ON donation.donation_certificates USING btree (issue_date);
CREATE INDEX idx_donation_recipients_user_id ON donation.donation_recipients USING btree (user_id);
CREATE INDEX idx_recipients_active ON donation.donation_recipients USING btree (is_active);
CREATE INDEX idx_donations_created_at ON donation.donations USING btree (created_at);
CREATE INDEX idx_donations_donor_id ON donation.donations USING btree (donor_id);
CREATE INDEX idx_donations_institute_id ON donation.donations USING btree (institute_id);
CREATE INDEX idx_donations_opinion_leader ON donation.donations USING btree (opinion_leader_id);
CREATE INDEX idx_donations_status ON donation.donations USING btree (status);
CREATE INDEX idx_donations_type ON donation.donations USING btree (donation_type);
CREATE INDEX idx_funding_wishlist_requests_project_id ON donation.funding_wishlist_requests USING btree (project_id);
CREATE INDEX idx_opinion_leader_endorsements_institute ON donation.opinion_leader_endorsements USING btree (institute_id);
CREATE INDEX idx_opinion_leader_endorsements_leader ON donation.opinion_leader_endorsements USING btree (opinion_leader_id);
CREATE INDEX idx_opinion_leader_followers_leader ON donation.opinion_leader_followers USING btree (opinion_leader_id);
CREATE INDEX idx_opinion_leader_followers_user_id ON donation.opinion_leader_followers USING btree (follower_user_id);
CREATE INDEX idx_opinion_leaders_user_id ON donation.opinion_leaders USING btree (user_id);
CREATE INDEX idx_utility_params_confidence ON economy.individual_utility_parameters USING btree (estimation_confidence DESC, data_quality);
CREATE INDEX idx_money_wave1_ebit_records_wave_id ON economy.money_wave1_ebit_records USING btree (wave_id);
CREATE INDEX idx_wave1_ebit_verification ON economy.money_wave1_ebit_records USING btree (verification_status, reporting_period_end DESC);
CREATE INDEX idx_money_wave2_redistribution_records_wave_id ON economy.money_wave2_redistribution_records USING btree (wave_id);
CREATE INDEX idx_wave2_redistribution_reason ON economy.money_wave2_redistribution_records USING btree (redistribution_reason, created_at DESC);
CREATE INDEX idx_money_wave3_entrepreneur_records_wave_id ON economy.money_wave3_entrepreneur_records USING btree (wave_id);
CREATE INDEX idx_wave3_entrepreneur_score ON economy.money_wave3_entrepreneur_records USING btree (innovation_score DESC, disruption_potential DESC);
CREATE INDEX idx_money_wave3_ventures_active ON economy.money_wave3_ventures USING btree (is_active, updated_at DESC);
CREATE INDEX idx_money_wave_config_active_updated ON economy.money_wave_config USING btree (is_active, updated_at DESC);
CREATE INDEX idx_money_wave_daily_snapshots_snapshot_date ON economy.money_wave_daily_snapshots USING btree (snapshot_date DESC);
CREATE INDEX idx_effectiveness_analysis_period ON economy.money_wave_effectiveness USING btree (analysis_period_start, analysis_period_end);
CREATE INDEX idx_money_wave_effectiveness_wave_id ON economy.money_wave_effectiveness USING btree (wave_id);
CREATE INDEX idx_money_wave_history_status ON economy.money_wave_history USING btree (status);
CREATE INDEX idx_money_wave_history_type_date ON economy.money_wave_history USING btree (wave_type, execution_date DESC);
CREATE INDEX money_wave_hourly_game_pools_hour_domain_category_idx ON economy.money_wave_hourly_game_pools USING btree (hour_start, domain, category);
CREATE INDEX money_wave_hourly_game_pools_hour_domain_depth_idx ON economy.money_wave_hourly_game_pools USING btree (hour_start, domain, category, subcategory, league);
CREATE UNIQUE INDEX money_wave_hourly_game_pools_hour_domain_game_ux ON economy.money_wave_hourly_game_pools USING btree (hour_start, domain, game_id);
CREATE INDEX idx_accounts_active_updated ON economy.pmp_pmc_accounts USING btree (is_active, updated_at DESC);
CREATE INDEX idx_accounts_balance_pmc ON economy.pmp_pmc_accounts USING btree (pmc_balance DESC);
CREATE INDEX idx_accounts_balance_pmp ON economy.pmp_pmc_accounts USING btree (pmp_balance DESC);
CREATE INDEX idx_transactions_money_wave_id ON economy.pmp_pmc_transactions USING btree (related_money_wave_id) WHERE (related_money_wave_id IS NOT NULL);
CREATE INDEX idx_transactions_type_timestamp ON economy.pmp_pmc_transactions USING btree (transaction_type, "timestamp" DESC);
CREATE INDEX idx_transactions_user_id_timestamp ON economy.pmp_pmc_transactions USING btree (user_id, "timestamp" DESC);
CREATE INDEX idx_transparency_reports_institute_id ON economy.transparency_reports USING btree (institute_id);
CREATE INDEX idx_transparency_reports_opinion_leader_id ON economy.transparency_reports USING btree (opinion_leader_id);
CREATE INDEX idx_transparency_reports_period ON economy.transparency_reports USING btree (report_period_start, report_period_end);
CREATE INDEX idx_utility_inputs_action_type ON economy.utility_estimation_inputs USING btree (action_type, "timestamp" DESC);
CREATE INDEX idx_utility_inputs_user_timestamp ON economy.utility_estimation_inputs USING btree (user_id, "timestamp" DESC);
CREATE INDEX idx_predictions_user_date ON economy.utility_predictions USING btree (user_id, prediction_date DESC);
CREATE INDEX idx_feed_items_source_id ON feed.items USING btree (source_id);
CREATE INDEX idx_banned_ips_address ON forum.banned_ips USING btree (ip_address) WHERE (is_active = true);
CREATE INDEX idx_forum_activity_logs_activity_type ON forum.forum_activity_logs USING btree (activity_type);
CREATE INDEX idx_forum_activity_logs_comment_id ON forum.forum_activity_logs USING btree (comment_id);
CREATE INDEX idx_forum_activity_logs_created_at ON forum.forum_activity_logs USING btree (created_at);
CREATE INDEX idx_forum_activity_logs_post_id ON forum.forum_activity_logs USING btree (post_id);
CREATE INDEX idx_forum_activity_logs_user_id ON forum.forum_activity_logs USING btree (user_id);
CREATE INDEX idx_forum_comments_author_id ON forum.forum_comments USING btree (author_id);
CREATE INDEX idx_forum_comments_depth ON forum.forum_comments USING btree (depth);
CREATE INDEX idx_forum_comments_parent_id ON forum.forum_comments USING btree (parent_comment_id);
CREATE INDEX idx_forum_comments_path ON forum.forum_comments USING btree (path);
CREATE INDEX idx_forum_comments_post_id ON forum.forum_comments USING btree (post_id);
CREATE INDEX idx_forum_comments_search ON forum.forum_comments USING gin (to_tsvector('english'::regconfig, content));
CREATE INDEX idx_forum_post_tags_tag_id ON forum.forum_post_tags USING btree (tag_id);
CREATE INDEX idx_forum_posts_author_id ON forum.forum_posts USING btree (author_id);
CREATE INDEX idx_forum_posts_category_id ON forum.forum_posts USING btree (category_id);
CREATE INDEX idx_forum_posts_created_at ON forum.forum_posts USING btree (created_at);
CREATE INDEX idx_forum_posts_last_activity ON forum.forum_posts USING btree (last_activity_at);
CREATE INDEX idx_forum_posts_region ON forum.forum_posts USING btree (region_code);
CREATE INDEX idx_forum_posts_search ON forum.forum_posts USING gin (to_tsvector('english'::regconfig, ((title || ' '::text) || content)));
CREATE INDEX idx_forum_posts_section ON forum.forum_posts USING btree (section);
CREATE INDEX idx_forum_posts_section_status_created ON forum.forum_posts USING btree (section, status, created_at DESC);
CREATE INDEX idx_forum_posts_status ON forum.forum_posts USING btree (status);
CREATE INDEX idx_forum_posts_tags ON forum.forum_posts USING gin (tags);
CREATE INDEX idx_forum_prediction_links_game ON forum.forum_prediction_links USING btree (prediction_game_id);
CREATE INDEX idx_forum_prediction_links_post ON forum.forum_prediction_links USING btree (forum_post_id);
CREATE INDEX idx_forum_regions_level ON forum.forum_regions USING btree (level);
CREATE INDEX idx_forum_regions_parent ON forum.forum_regions USING btree (parent_code);
CREATE INDEX idx_forum_votes_comment_id ON forum.forum_votes USING btree (comment_id);
CREATE INDEX idx_forum_votes_post_id ON forum.forum_votes USING btree (post_id);
CREATE INDEX idx_forum_votes_user_id ON forum.forum_votes USING btree (user_id);
CREATE INDEX idx_live_messages_room_created ON forum.live_room_messages USING btree (room_id, created_at DESC);
CREATE INDEX idx_oauth_auth_codes_client_id ON oauth_provider.auth_codes USING btree (client_id);
CREATE INDEX idx_oauth_tokens_client_id ON oauth_provider.tokens USING btree (client_id);
CREATE INDEX idx_game_snapshots_game_option ON prediction.game_snapshots USING btree (game_id, option_id, snapshot_time);
CREATE INDEX idx_game_snapshots_game_time ON prediction.game_snapshots USING btree (game_id, snapshot_time);
CREATE INDEX idx_prediction_games_cat_status ON prediction.prediction_games USING btree (category, status, created_at DESC);
CREATE INDEX idx_prediction_games_category ON prediction.prediction_games USING btree (category);
CREATE INDEX idx_prediction_games_creator ON prediction.prediction_games USING btree (creator_id);
CREATE INDEX idx_prediction_games_dates ON prediction.prediction_games USING btree (registration_start, registration_end, settlement_date);
CREATE INDEX idx_prediction_games_external ON prediction.prediction_games USING btree (external_id) WHERE (external_id IS NOT NULL);
CREATE INDEX idx_prediction_games_settled_at ON prediction.prediction_games USING btree (settled_at) WHERE (settled_at IS NOT NULL);
CREATE INDEX idx_prediction_games_slug ON prediction.prediction_games USING btree (slug);
CREATE INDEX idx_prediction_games_status ON prediction.prediction_games USING btree (status);
CREATE INDEX idx_prediction_games_status_created ON prediction.prediction_games USING btree (status, created_at DESC);
CREATE INDEX idx_settlements_game_id ON prediction.prediction_settlements USING btree (game_id);
CREATE INDEX idx_settlements_processed_at ON prediction.prediction_settlements USING btree (processed_at);
CREATE INDEX idx_settlements_user_id ON prediction.prediction_settlements USING btree (user_id);
CREATE INDEX idx_trends_game_timestamp ON prediction.prediction_trends USING btree (game_id, "timestamp");
CREATE INDEX idx_trends_timestamp ON prediction.prediction_trends USING btree ("timestamp");
CREATE INDEX idx_predictions_created_at ON prediction.predictions USING btree (created_at);
CREATE INDEX idx_predictions_game_id ON prediction.predictions USING btree (game_id);
CREATE INDEX idx_predictions_user_active ON prediction.predictions USING btree (user_id, is_active);
CREATE INDEX idx_predictions_user_id ON prediction.predictions USING btree (user_id);
CREATE INDEX idx_settlement_history_game_id ON prediction.settlement_history USING btree (game_id);
CREATE INDEX idx_settlement_history_settled_by ON prediction.settlement_history USING btree (settled_by);
CREATE INDEX idx_settlement_sources_game_id ON prediction.settlement_sources USING btree (game_id);
CREATE INDEX idx_settlement_sources_scheduled ON prediction.settlement_sources USING btree (scheduled_at) WHERE (scheduled_at IS NOT NULL);
CREATE INDEX idx_user_challenge_bets_challenge ON prediction.user_challenge_bets USING btree (challenge_id);
CREATE INDEX idx_user_challenge_bets_user ON prediction.user_challenge_bets USING btree (user_id);
CREATE INDEX idx_user_challenge_comments_challenge ON prediction.user_challenge_comments USING btree (challenge_id, created_at);
CREATE INDEX idx_user_challenges_created ON prediction.user_challenges USING btree (created_at DESC);
CREATE INDEX idx_user_challenges_host ON prediction.user_challenges USING btree (host_id);
CREATE INDEX idx_user_challenges_linked_game_id ON prediction.user_challenges USING btree (linked_game_id, created_at DESC) WHERE (linked_game_id IS NOT NULL);
CREATE INDEX idx_user_challenges_status ON prediction.user_challenges USING btree (status);
CREATE INDEX idx_user_challenges_visibility_created ON prediction.user_challenges USING btree (visibility, created_at DESC);
CREATE INDEX idx_user_prediction_stats_skill_weight ON prediction.user_prediction_stats USING btree (skill_weight DESC, average_brier_score);
CREATE INDEX idx_public_wrong_answers_quiz_id ON public.wrong_answers USING btree (quiz_id);
CREATE INDEX idx_ranking_history_period ON ranking.ranking_history USING btree (period_type, period_start);
CREATE INDEX idx_ranking_history_user ON ranking.ranking_history USING btree (user_id);
CREATE INDEX idx_user_scores_contribution ON ranking.user_scores USING btree (contribution_score DESC);
CREATE INDEX idx_user_scores_overall_rank ON ranking.user_scores USING btree (overall_rank);
CREATE INDEX idx_user_scores_user ON ranking.user_scores USING btree (user_id);
CREATE INDEX sc_assessments_user_id_idx ON study_cycle.sc_assessments USING btree (user_id);
CREATE INDEX sc_chapters_textbook_id_idx ON study_cycle.sc_chapters USING btree (textbook_id);
CREATE INDEX sc_questions_chapter_id_idx ON study_cycle.sc_questions USING btree (chapter_id);
CREATE INDEX idx_sc_reading_progress_chapter ON study_cycle.sc_reading_progress USING btree (chapter_id);
CREATE INDEX idx_sc_reading_progress_completed ON study_cycle.sc_reading_progress USING btree (is_completed);
CREATE INDEX idx_sc_reading_progress_reading ON study_cycle.sc_reading_progress USING btree (reading_id);
CREATE INDEX idx_sc_readings_round ON study_cycle.sc_readings USING btree (round);
CREATE INDEX idx_sc_readings_status ON study_cycle.sc_readings USING btree (status);
CREATE INDEX idx_sc_readings_textbook_round ON study_cycle.sc_readings USING btree (textbook_id, round);
CREATE INDEX idx_sc_readings_user_status ON study_cycle.sc_readings USING btree (user_id, status);
CREATE INDEX idx_sc_readings_user_textbook ON study_cycle.sc_readings USING btree (user_id, textbook_id);
CREATE INDEX idx_sc_sessions_chapter ON study_cycle.sc_study_sessions USING btree (chapter_id);
CREATE INDEX idx_sc_sessions_textbook ON study_cycle.sc_study_sessions USING btree (textbook_id);
CREATE INDEX idx_sc_sessions_user ON study_cycle.sc_study_sessions USING btree (user_id);
CREATE INDEX sc_textbooks_creator_id_idx ON study_cycle.sc_textbooks USING btree (creator_id);
CREATE INDEX sc_user_answers_assessment_id_idx ON study_cycle.sc_user_answers USING btree (assessment_id);
CREATE INDEX sc_user_answers_question_id_idx ON study_cycle.sc_user_answers USING btree (question_id);
CREATE INDEX sc_user_answers_user_id_idx ON study_cycle.sc_user_answers USING btree (user_id);
CREATE INDEX sc_user_textbook_progress_textbook_id_idx ON study_cycle.sc_user_textbook_progress USING btree (textbook_id);
CREATE INDEX sc_user_textbook_progress_user_id_idx ON study_cycle.sc_user_textbook_progress USING btree (user_id);
CREATE INDEX idx_bias_profiles_updated ON "user".behavioral_bias_profiles USING btree (updated_at DESC);
CREATE INDEX idx_healing_creations_user_kind ON "user".healing_creations USING btree (user_id, kind, created_at DESC);
CREATE INDEX idx_healing_room_guestbooks_room_user_created ON "user".healing_room_guestbooks USING btree (room_user_id, created_at DESC);
CREATE INDEX idx_opinion_leaders_user_id ON "user".opinion_leaders USING btree (user_id);
CREATE INDEX idx_user_profiles_account_status ON "user".profiles USING btree (account_status);
CREATE INDEX idx_user_profiles_username ON "user".profiles USING btree (username);
CREATE INDEX idx_user_cluster_assignments_cluster_id ON "user".user_cluster_assignments USING btree (cluster_id);
CREATE INDEX idx_user_reputation_overall_score ON "user".user_reputation_metrics USING btree (overall_reputation_score DESC);
CREATE INDEX idx_user_reputation_tier ON "user".user_reputation_metrics USING btree (reputation_tier);
CREATE INDEX idx_user_reputation_user_id ON "user".user_reputation_metrics USING btree (user_id);
CREATE INDEX idx_clusters_member_count ON "user".user_utility_clusters USING btree (member_count DESC);
CREATE INDEX idx_ai_scan_logs_user_date ON vertical_housing.ai_scan_logs USING btree (user_id, scanned_date);
CREATE INDEX idx_vertical_housing_ai_scan_logs_serial_id ON vertical_housing.ai_scan_logs USING btree (serial_id);
CREATE INDEX idx_exam_options_cluster_id ON vertical_housing.exam_options USING btree (cluster_id);
CREATE INDEX idx_exam_options_question ON vertical_housing.exam_options USING btree (question_id);
CREATE INDEX idx_exam_options_repeat_count ON vertical_housing.exam_options USING btree (repeat_count DESC);
CREATE INDEX idx_exam_options_tier ON vertical_housing.exam_options USING btree (mastery_tier);
CREATE INDEX idx_vh_exam_options_theory_section ON vertical_housing.exam_options USING btree (theory_section_code);
CREATE INDEX idx_exam_questions_chapter_tier ON vertical_housing.exam_questions USING btree (chapter_code, importance_tier);
CREATE INDEX idx_exam_questions_detail_code ON vertical_housing.exam_questions USING btree (detail_code);
CREATE INDEX idx_exam_questions_law_status ON vertical_housing.exam_questions USING btree (law_status, exam_stage, exam_year);
CREATE INDEX idx_exam_questions_stage_round ON vertical_housing.exam_questions USING btree (exam_stage, exam_round DESC, subject, question_number);
CREATE INDEX idx_option_clusters_skeleton ON vertical_housing.option_clusters USING btree (skeleton_key);
CREATE INDEX idx_option_clusters_subject_repeat ON vertical_housing.option_clusters USING btree (subject, repeat_count DESC);
CREATE INDEX idx_option_mastery_review ON vertical_housing.option_mastery USING btree (user_id, next_review_at);
CREATE INDEX idx_option_mastery_user ON vertical_housing.option_mastery USING btree (user_id, status);
CREATE INDEX idx_study_option_logs_client_status ON vertical_housing.study_option_logs USING btree (client_key, mark_status);
CREATE INDEX idx_vh_study_option_logs_user_id ON vertical_housing.study_option_logs USING btree (user_id);
CREATE INDEX idx_study_question_logs_client_set ON vertical_housing.study_question_logs USING btree (client_key, set_key);
CREATE INDEX idx_vh_study_question_logs_user_id ON vertical_housing.study_question_logs USING btree (user_id);
CREATE INDEX idx_vh_theory_sections_detail_code ON vertical_housing.theory_sections USING btree (detail_code, sort_order);

-- -----------------------------------------------------------------------------
-- 8. Views
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW economy.user_profiles_with_balance AS  SELECT p.id,
    p.username,
    p.display_name,
    p.avatar_url,
    p.bio,
    COALESCE(e.pmp_balance, (0)::bigint) AS pmp_balance,
    COALESCE(e.pmc_balance, (0)::numeric) AS pmc_balance,
    p.notification_preferences,
    p.privacy_settings,
    p.onboarding_completed,
    p.account_status,
    p.email_verified,
    p.created_at,
    p.updated_at,
    p.last_active_at
   FROM ("user".profiles p
     LEFT JOIN economy.pmp_pmc_accounts e ON ((p.id = e.user_id)));
CREATE OR REPLACE VIEW economy.v_account_audit_ledger AS  WITH tx_summary AS (
         SELECT pmp_pmc_transactions.user_id,
            COALESCE(sum(pmp_pmc_transactions.pmp_amount), (0)::numeric) AS total_tx_pmp,
            COALESCE(sum(pmp_pmc_transactions.pmc_amount), (0)::numeric) AS total_tx_pmc,
            count(*) AS total_tx_count,
            max(pmp_pmc_transactions.created_at) AS last_tx_at
           FROM economy.pmp_pmc_transactions
          GROUP BY pmp_pmc_transactions.user_id
        )
 SELECT acc.user_id,
    p.username,
    p.display_name,
    acc.pmp_balance,
    acc.pmc_balance,
    COALESCE(tx.total_tx_pmp, (0)::numeric) AS ledger_pmp_sum,
    COALESCE(tx.total_tx_pmc, (0)::numeric) AS ledger_pmc_sum,
    COALESCE(tx.total_tx_count, (0)::bigint) AS transaction_count,
    tx.last_tx_at,
    acc.updated_at AS balance_updated_at,
        CASE
            WHEN ((acc.pmp_balance < 0) OR (acc.pmc_balance < (0)::numeric)) THEN true
            WHEN ((COALESCE(tx.total_tx_count, (0)::bigint) = 0) AND ((acc.pmp_balance > 50000) OR (acc.pmc_balance > (5000)::numeric))) THEN true
            ELSE false
        END AS anomaly_suspected
   FROM ((economy.pmp_pmc_accounts acc
     LEFT JOIN "user".profiles p ON ((p.id = acc.user_id)))
     LEFT JOIN tx_summary tx ON ((tx.user_id = acc.user_id)));
CREATE OR REPLACE VIEW study_cycle.auth_security_metrics AS  SELECT 'total_users'::text AS metric,
    (count(*))::text AS value
   FROM auth.users
  WHERE (users.deleted_at IS NULL)
UNION ALL
 SELECT 'mfa_enabled_users'::text AS metric,
    (count(DISTINCT mfa_factors.user_id))::text AS value
   FROM auth.mfa_factors
  WHERE (mfa_factors.status = 'verified'::auth.factor_status)
UNION ALL
 SELECT 'mfa_adoption_rate'::text AS metric,
    ((round((((count(DISTINCT mf.user_id))::numeric * 100.0) / (count(DISTINCT u.id))::numeric), 2))::text || '%'::text) AS value
   FROM (auth.users u
     LEFT JOIN auth.mfa_factors mf ON (((u.id = mf.user_id) AND (mf.status = 'verified'::auth.factor_status))))
  WHERE (u.deleted_at IS NULL);

-- -----------------------------------------------------------------------------
-- 9. Functions & Procedures
-- -----------------------------------------------------------------------------
-- economy.compute_prediction_hourly_category_allocations(p_hour_start timestamp with time zone)
CREATE OR REPLACE FUNCTION economy.compute_prediction_hourly_category_allocations(p_hour_start timestamp with time zone DEFAULT (date_trunc('hour'::text, (now() AT TIME ZONE 'Asia/Seoul'::text)) AT TIME ZONE 'Asia/Seoul'::text))
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'economy', 'prediction', 'forum', 'public'
AS $function$
DECLARE
  v_hour_start timestamptz := (date_trunc('hour', p_hour_start AT TIME ZONE 'Asia/Seoul') AT TIME ZONE 'Asia/Seoul');
  v_base_hourly numeric;
  v_hour_mult numeric;
  v_effective_hourly numeric;
BEGIN
  SELECT hourly_pool_total_pmc::numeric INTO v_base_hourly
  FROM economy.money_wave_daily_snapshots
  ORDER BY snapshot_date DESC
  LIMIT 1;

  IF v_base_hourly IS NULL THEN
    PERFORM economy.refresh_daily_money_wave_snapshot();
    SELECT hourly_pool_total_pmc::numeric INTO v_base_hourly
    FROM economy.money_wave_daily_snapshots
    ORDER BY snapshot_date DESC
    LIMIT 1;
  END IF;

  v_hour_mult := economy.get_kst_hour_activity_multiplier(v_hour_start);
  v_effective_hourly := COALESCE(v_base_hourly, 4166.6667) * v_hour_mult;

  WITH game_metrics AS (
    SELECT
      pg.game_id,
      pg.category,
      GREATEST(6.0, LEAST(2880.0, EXTRACT(EPOCH FROM (pg.registration_end - pg.registration_start)) / 3600.0)) AS duration_hours,
      GREATEST(0.0, EXTRACT(EPOCH FROM (pg.registration_end - v_hour_start)) / 3600.0) AS remaining_hours,
      COALESCE(bet_stats.participant_cnt, 0) AS participant_cnt,
      COALESCE(bet_stats.recent_bet_cnt, 0) AS recent_bet_cnt,
      COALESCE(cmt_stats.comment_cnt, 0) AS comment_cnt,
      COALESCE(cmt_stats.like_sum, 0) AS like_sum,
      COALESCE(cmt_stats.recent_comment_cnt, 0) AS recent_comment_cnt,
      COALESCE(acc_pool.accumulated_pmc, 0) AS accumulated_pmc
    FROM prediction.prediction_games pg
    LEFT JOIN LATERAL (
      SELECT
        COUNT(DISTINCT p.user_id) AS participant_cnt,
        COUNT(*) FILTER (WHERE p.created_at >= v_hour_start - INTERVAL '6 hours') AS recent_bet_cnt
      FROM prediction.predictions p
      WHERE p.game_id = pg.game_id AND p.is_active = true
    ) bet_stats ON true
    LEFT JOIN LATERAL (
      SELECT
        COUNT(fc.id) AS comment_cnt,
        COALESCE(SUM(fc.like_count), 0) AS like_sum,
        COUNT(fc.id) FILTER (WHERE fc.created_at >= v_hour_start - INTERVAL '6 hours') AS recent_comment_cnt
      FROM forum.forum_prediction_links fpl
      JOIN forum.forum_comments fc ON fc.post_id = fpl.forum_post_id AND fc.status = 'published'
      WHERE fpl.prediction_game_id = pg.game_id
    ) cmt_stats ON true
    LEFT JOIN LATERAL (
      SELECT COALESCE(SUM(gp.pool_pmc), 0) AS accumulated_pmc
      FROM economy.money_wave_hourly_game_pools gp
      WHERE gp.game_id = pg.game_id AND gp.hour_start < v_hour_start
    ) acc_pool ON true
    WHERE pg.status = 'ACTIVE'
      AND pg.registration_end > v_hour_start
  ),
  game_weights AS (
    SELECT
      gm.game_id,
      gm.category,
      CASE
        WHEN gm.accumulated_pmc >= 20000 THEN 0.05
        ELSE
          POWER(24.0 / gm.duration_hours, 0.75)
          * (CASE WHEN gm.remaining_hours <= 6 THEN 1.35 WHEN gm.remaining_hours <= 24 THEN 1.15 ELSE 1.0 END)
          * (
              0.40
              + 0.30 * (1.0 + 0.6 * LN(1.0 + gm.participant_cnt) + 1.2 * LN(1.0 + gm.recent_bet_cnt))
              + 0.30 * (1.0 + 0.8 * LN(1.0 + gm.comment_cnt) + 0.4 * LN(1.0 + gm.like_sum) + 1.5 * LN(1.0 + gm.recent_comment_cnt))
            )
      END AS raw_game_weight
    FROM game_metrics gm
  ),
  category_weighted AS (
    SELECT
      gw.category,
      SUM(gw.raw_game_weight) * COALESCE(m.reward_multiplier, 1.0) AS weighted_score
    FROM game_weights gw
    LEFT JOIN economy.prediction_category_multipliers m ON m.category = gw.category
    GROUP BY gw.category, m.reward_multiplier
  ),
  totals AS (
    SELECT COALESCE(SUM(weighted_score), 0) AS total_score
    FROM category_weighted
  )
  INSERT INTO economy.money_wave_hourly_category_allocations (
    hour_start,
    domain,
    category,
    pool_pmc,
    algorithm_version,
    computed_at
  )
  SELECT
    v_hour_start,
    'prediction',
    cw.category,
    ROUND(GREATEST(0, v_effective_hourly * (cw.weighted_score / NULLIF(t.total_score, 0))), 8),
    'v3_social_learning_time_weighted',
    NOW()
  FROM category_weighted cw
  CROSS JOIN totals t
  WHERE t.total_score > 0
  ON CONFLICT (hour_start, domain, category)
  DO UPDATE SET
    pool_pmc = EXCLUDED.pool_pmc,
    algorithm_version = EXCLUDED.algorithm_version,
    computed_at = NOW();
END;
$function$
;

-- economy.compute_prediction_hourly_game_pools(p_hour_start timestamp with time zone)
CREATE OR REPLACE FUNCTION economy.compute_prediction_hourly_game_pools(p_hour_start timestamp with time zone DEFAULT (date_trunc('hour'::text, (now() AT TIME ZONE 'Asia/Seoul'::text)) AT TIME ZONE 'Asia/Seoul'::text))
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'economy', 'prediction', 'forum', 'public'
AS $function$
DECLARE
  v_hour_start timestamptz := (date_trunc('hour', p_hour_start AT TIME ZONE 'Asia/Seoul') AT TIME ZONE 'Asia/Seoul');
  v_algo text := 'v3_social_learning_time_weighted';
BEGIN
  PERFORM economy.compute_prediction_hourly_category_allocations(v_hour_start);

  DELETE FROM economy.money_wave_hourly_game_pools
  WHERE hour_start = v_hour_start
    AND domain = 'prediction';

  WITH category_pools AS (
    SELECT
      a.category,
      a.pool_pmc
    FROM economy.money_wave_hourly_category_allocations a
    WHERE a.hour_start = v_hour_start
      AND a.domain = 'prediction'
      AND a.category IS NOT NULL
      AND a.pool_pmc > 0
  ),
  game_metrics AS (
    SELECT
      pg.game_id,
      pg.category,
      pg.subcategory,
      pg.league,
      GREATEST(6.0, LEAST(2880.0, EXTRACT(EPOCH FROM (pg.registration_end - pg.registration_start)) / 3600.0)) AS duration_hours,
      GREATEST(0.0, EXTRACT(EPOCH FROM (pg.registration_end - v_hour_start)) / 3600.0) AS remaining_hours,
      COALESCE(bet_stats.participant_cnt, 0) AS participant_cnt,
      COALESCE(bet_stats.recent_bet_cnt, 0) AS recent_bet_cnt,
      COALESCE(cmt_stats.comment_cnt, 0) AS comment_cnt,
      COALESCE(cmt_stats.like_sum, 0) AS like_sum,
      COALESCE(cmt_stats.recent_comment_cnt, 0) AS recent_comment_cnt,
      COALESCE(acc_pool.accumulated_pmc, 0) AS accumulated_pmc
    FROM prediction.prediction_games pg
    LEFT JOIN LATERAL (
      SELECT
        COUNT(DISTINCT p.user_id) AS participant_cnt,
        COUNT(*) FILTER (WHERE p.created_at >= v_hour_start - INTERVAL '6 hours') AS recent_bet_cnt
      FROM prediction.predictions p
      WHERE p.game_id = pg.game_id AND p.is_active = true
    ) bet_stats ON true
    LEFT JOIN LATERAL (
      SELECT
        COUNT(fc.id) AS comment_cnt,
        COALESCE(SUM(fc.like_count), 0) AS like_sum,
        COUNT(fc.id) FILTER (WHERE fc.created_at >= v_hour_start - INTERVAL '6 hours') AS recent_comment_cnt
      FROM forum.forum_prediction_links fpl
      JOIN forum.forum_comments fc ON fc.post_id = fpl.forum_post_id AND fc.status = 'published'
      WHERE fpl.prediction_game_id = pg.game_id
    ) cmt_stats ON true
    LEFT JOIN LATERAL (
      SELECT COALESCE(SUM(gp.pool_pmc), 0) AS accumulated_pmc
      FROM economy.money_wave_hourly_game_pools gp
      WHERE gp.game_id = pg.game_id AND gp.hour_start < v_hour_start
    ) acc_pool ON true
    WHERE pg.status = 'ACTIVE'
      AND pg.registration_end > v_hour_start
  ),
  game_weights AS (
    SELECT
      gm.game_id,
      gm.category,
      gm.subcategory,
      gm.league,
      CASE
        WHEN gm.accumulated_pmc >= 20000 THEN 0.05
        ELSE
          POWER(24.0 / gm.duration_hours, 0.75)
          * (CASE WHEN gm.remaining_hours <= 6 THEN 1.35 WHEN gm.remaining_hours <= 24 THEN 1.15 ELSE 1.0 END)
          * (
              0.40
              + 0.30 * (1.0 + 0.6 * LN(1.0 + gm.participant_cnt) + 1.2 * LN(1.0 + gm.recent_bet_cnt))
              + 0.30 * (1.0 + 0.8 * LN(1.0 + gm.comment_cnt) + 0.4 * LN(1.0 + gm.like_sum) + 1.5 * LN(1.0 + gm.recent_comment_cnt))
            )
      END AS weight
    FROM game_metrics gm
  ),
  cat_weight_totals AS (
    SELECT
      category,
      SUM(weight) AS total_cat_weight
    FROM game_weights
    GROUP BY category
  )
  INSERT INTO economy.money_wave_hourly_game_pools (
    hour_start,
    domain,
    game_id,
    category,
    subcategory,
    league,
    pool_pmc,
    algorithm_version,
    computed_at
  )
  SELECT
    v_hour_start,
    'prediction',
    gw.game_id,
    gw.category,
    gw.subcategory,
    gw.league,
    ROUND(cp.pool_pmc * (gw.weight / NULLIF(cwt.total_cat_weight, 0)), 8) AS pool_pmc,
    v_algo,
    NOW()
  FROM game_weights gw
  JOIN category_pools cp ON cp.category = gw.category
  JOIN cat_weight_totals cwt ON cwt.category = gw.category
  WHERE cwt.total_cat_weight > 0;
END;
$function$
;

-- economy.execute_ledger_transaction(p_user_id uuid, p_transaction_type text, p_pmp_change bigint, p_pmc_change numeric, p_description text, p_metadata jsonb, p_related_money_wave_id uuid)
CREATE OR REPLACE FUNCTION economy.execute_ledger_transaction(p_user_id uuid, p_transaction_type text, p_pmp_change bigint, p_pmc_change numeric, p_description text, p_metadata jsonb DEFAULT '{}'::jsonb, p_related_money_wave_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(success boolean, transaction_id uuid, new_pmp_balance bigint, new_pmc_balance numeric, message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'economy', 'public'
AS $function$
DECLARE
    v_acc RECORD;
    v_new_pmp BIGINT;
    v_new_pmc NUMERIC;
    v_tx_id UUID;
BEGIN
    SELECT * INTO v_acc
    FROM economy.pmp_pmc_accounts
    WHERE user_id = p_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        IF COALESCE(p_pmp_change, 0) < 0 OR COALESCE(p_pmc_change, 0) < 0 THEN
            RETURN QUERY SELECT false, NULL::UUID, 0::BIGINT, 0::NUMERIC, '잔액이 부족합니다.'::TEXT;
            RETURN;
        END IF;

        v_new_pmp := COALESCE(p_pmp_change, 0);
        v_new_pmc := COALESCE(p_pmc_change, 0);

        INSERT INTO economy.pmp_pmc_accounts (
            user_id, pmp_balance, pmc_balance, created_at, updated_at
        ) VALUES (
            p_user_id, v_new_pmp, v_new_pmc, now(), now()
        );
    ELSE
        IF (v_acc.pmp_balance + COALESCE(p_pmp_change, 0)) < 0 THEN
            RETURN QUERY SELECT false, NULL::UUID, v_acc.pmp_balance, v_acc.pmc_balance, 'PMP 잔액이 부족합니다.'::TEXT;
            RETURN;
        END IF;

        IF (v_acc.pmc_balance + COALESCE(p_pmc_change, 0)) < 0 THEN
            RETURN QUERY SELECT false, NULL::UUID, v_acc.pmp_balance, v_acc.pmc_balance, 'PMC 잔액이 부족합니다.'::TEXT;
            RETURN;
        END IF;

        v_new_pmp := v_acc.pmp_balance + COALESCE(p_pmp_change, 0);
        v_new_pmc := v_acc.pmc_balance + COALESCE(p_pmc_change, 0);

        UPDATE economy.pmp_pmc_accounts
        SET pmp_balance = v_new_pmp,
            pmc_balance = v_new_pmc,
            updated_at = now()
        WHERE user_id = p_user_id;
    END IF;

    v_tx_id := gen_random_uuid();
    INSERT INTO economy.pmp_pmc_transactions (
        transaction_id, user_id, transaction_type, pmp_amount, pmc_amount, description, timestamp, related_money_wave_id, metadata, created_at
    ) VALUES (
        v_tx_id, p_user_id, p_transaction_type, COALESCE(p_pmp_change, 0), COALESCE(p_pmc_change, 0), p_description, now(), p_related_money_wave_id, COALESCE(p_metadata, '{}'::jsonb), now()
    );

    RETURN QUERY SELECT true, v_tx_id, v_new_pmp, v_new_pmc, '정상 처리되었습니다.'::TEXT;
END;
$function$
;

-- economy.get_kst_hour_activity_multiplier(p_hour_start timestamp with time zone)
CREATE OR REPLACE FUNCTION economy.get_kst_hour_activity_multiplier(p_hour_start timestamp with time zone)
 RETURNS numeric
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'economy', 'public'
AS $function$
DECLARE
  v_kst_hour int := EXTRACT(HOUR FROM (p_hour_start AT TIME ZONE 'Asia/Seoul'))::int;
BEGIN
  -- 새벽 (00~05시, 6시간): 0.4x (합 2.4)
  -- 주간 (06~17시, 12시간): 1.0x (합 12.0)
  -- 피크 (18~23시, 6시간): 1.6x (합 9.6)
  -- 총합 = 24.0 (일일 평균 1.0x)
  IF v_kst_hour >= 0 AND v_kst_hour < 6 THEN
    RETURN 0.4;
  ELSIF v_kst_hour >= 6 AND v_kst_hour < 18 THEN
    RETURN 1.0;
  ELSE
    RETURN 1.6;
  END IF;
END;
$function$
;

-- economy.grant_forum_pmp_capped(p_user_id uuid, p_requested_pmp bigint, p_daily_cap bigint, p_activity_type text, p_description text, p_ledger_description text, p_post_id uuid, p_comment_id uuid, p_metadata jsonb)
CREATE OR REPLACE FUNCTION economy.grant_forum_pmp_capped(p_user_id uuid, p_requested_pmp bigint, p_daily_cap bigint DEFAULT 1000, p_activity_type text DEFAULT 'post_created'::text, p_description text DEFAULT '포럼 활동 보상'::text, p_ledger_description text DEFAULT NULL::text, p_post_id uuid DEFAULT NULL::uuid, p_comment_id uuid DEFAULT NULL::uuid, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS TABLE(awarded_pmp bigint, daily_remaining bigint, new_pmp_balance bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'economy', 'forum', 'public'
AS $function$
DECLARE
    v_kst_day_start TIMESTAMPTZ;
    v_today_earned BIGINT := 0;
    v_remaining_before BIGINT := 0;
    v_awarded BIGINT := 0;
    v_new_balance BIGINT := 0;
BEGIN
    PERFORM pg_advisory_xact_lock(hashtext('forum_pmp_' || p_user_id::text));
    v_kst_day_start := (date_trunc('day', now() AT TIME ZONE 'Asia/Seoul') AT TIME ZONE 'Asia/Seoul');

    SELECT COALESCE(SUM(pmp_earned), 0)::BIGINT
    INTO v_today_earned
    FROM forum.forum_activity_logs
    WHERE user_id = p_user_id
      AND created_at >= v_kst_day_start;

    v_remaining_before := GREATEST(0, p_daily_cap - v_today_earned);
    v_awarded := GREATEST(0, LEAST(COALESCE(p_requested_pmp, 0), v_remaining_before));

    INSERT INTO forum.forum_activity_logs (
        user_id, activity_type, post_id, comment_id, description, pmp_earned, metadata
    ) VALUES (
        p_user_id, p_activity_type, p_post_id, p_comment_id, p_description, v_awarded, COALESCE(p_metadata, '{}'::jsonb)
    );

    IF v_awarded > 0 THEN
        INSERT INTO economy.pmp_pmc_accounts (user_id, pmp_balance, pmc_balance, created_at, updated_at)
        VALUES (p_user_id, v_awarded, 0, now(), now())
        ON CONFLICT (user_id) DO UPDATE
          SET pmp_balance = economy.pmp_pmc_accounts.pmp_balance + EXCLUDED.pmp_balance,
              updated_at = now()
        RETURNING pmp_balance INTO v_new_balance;

        INSERT INTO economy.pmp_pmc_transactions (
            transaction_id, user_id, transaction_type, pmp_amount, pmc_amount, description, timestamp, metadata, created_at
        ) VALUES (
            gen_random_uuid(), p_user_id, 'PMP_EARN', v_awarded, 0,
            COALESCE(p_ledger_description, p_description), now(),
            jsonb_build_object('source', 'forum', 'activity_type', p_activity_type, 'post_id', p_post_id, 'comment_id', p_comment_id) || COALESCE(p_metadata, '{}'::jsonb),
            now()
        );
    ELSE
        SELECT COALESCE(pmp_balance, 0)::BIGINT INTO v_new_balance
        FROM economy.pmp_pmc_accounts WHERE user_id = p_user_id;
    END IF;

    RETURN QUERY SELECT v_awarded, GREATEST(0, v_remaining_before - v_awarded), COALESCE(v_new_balance, 0);
END;
$function$
;

-- economy.grant_pmc(p_user_id uuid, p_amount bigint, p_description text, p_source text)
CREATE OR REPLACE FUNCTION economy.grant_pmc(p_user_id uuid, p_amount bigint, p_description text DEFAULT 'PMC 지급'::text, p_source text DEFAULT 'system'::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'economy', 'public'
AS $function$
BEGIN
  UPDATE economy.pmp_pmc_accounts
  SET pmc_balance = pmc_balance + p_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    INSERT INTO economy.pmp_pmc_accounts (user_id, pmp_balance, pmc_balance, created_at, updated_at)
    VALUES (p_user_id, 0, p_amount, NOW(), NOW());
  END IF;

  INSERT INTO economy.pmp_pmc_transactions (
    transaction_id, user_id, transaction_type, pmc_amount,
    description, timestamp, created_at, metadata
  ) VALUES (
    gen_random_uuid(),
    p_user_id,
    'PMC_EARN',
    p_amount,
    p_description,
    NOW(),
    NOW(),
    jsonb_build_object('source', p_source)
  );

  RETURN json_build_object(
    'success', true,
    'user_id', p_user_id,
    'amount', p_amount
  );
END;
$function$
;

-- economy.grant_pmp(p_user_id uuid, p_amount bigint, p_description text, p_source text)
CREATE OR REPLACE FUNCTION economy.grant_pmp(p_user_id uuid, p_amount bigint, p_description text DEFAULT 'PMP 지급'::text, p_source text DEFAULT 'system'::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'economy', 'public'
AS $function$
BEGIN
  UPDATE economy.pmp_pmc_accounts
  SET pmp_balance = pmp_balance + p_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    INSERT INTO economy.pmp_pmc_accounts (user_id, pmp_balance, pmc_balance, created_at, updated_at)
    VALUES (p_user_id, p_amount, 0, NOW(), NOW());
  END IF;

  INSERT INTO economy.pmp_pmc_transactions (
    transaction_id, user_id, transaction_type, pmp_amount,
    description, timestamp, created_at, metadata
  ) VALUES (
    gen_random_uuid(),
    p_user_id,
    'PMP_EARN',
    p_amount,
    p_description,
    NOW(),
    NOW(),
    jsonb_build_object('source', p_source)
  );

  RETURN json_build_object(
    'success', true,
    'user_id', p_user_id,
    'amount', p_amount
  );
END;
$function$
;

-- economy.grant_vertical_pmp_capped(p_user_id uuid, p_requested_pmp bigint, p_daily_cap bigint, p_tx_type text, p_description text, p_metadata jsonb)
CREATE OR REPLACE FUNCTION economy.grant_vertical_pmp_capped(p_user_id uuid, p_requested_pmp bigint, p_daily_cap bigint DEFAULT 300, p_tx_type text DEFAULT 'VERTICAL_HOUSING_STUDY'::text, p_description text DEFAULT 'Housing-Pro 학습 PMP 적립'::text, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS TABLE(granted_pmp bigint, daily_remaining bigint, new_pmp_balance bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'economy', 'public'
AS $function$
DECLARE
    v_kst_day_start TIMESTAMPTZ;
    v_today_earned BIGINT := 0;
    v_remaining_before BIGINT := 0;
    v_granted BIGINT := 0;
    v_new_balance BIGINT := 0;
BEGIN
    PERFORM pg_advisory_xact_lock(hashtext('vertical_pmp_' || p_user_id::text));
    v_kst_day_start := (date_trunc('day', now() AT TIME ZONE 'Asia/Seoul') AT TIME ZONE 'Asia/Seoul');

    SELECT COALESCE(SUM(GREATEST(0, pmp_amount)), 0)::BIGINT
    INTO v_today_earned
    FROM economy.pmp_pmc_transactions
    WHERE user_id = p_user_id
      AND transaction_type IN ('VERTICAL_HOUSING_STUDY', 'VERTICAL_HOUSING_SCAN')
      AND created_at >= v_kst_day_start;

    v_remaining_before := GREATEST(0, p_daily_cap - v_today_earned);
    v_granted := GREATEST(0, LEAST(COALESCE(p_requested_pmp, 0), v_remaining_before));

    IF v_granted > 0 THEN
        INSERT INTO economy.pmp_pmc_accounts (user_id, pmp_balance, pmc_balance, created_at, updated_at)
        VALUES (p_user_id, v_granted, 0, now(), now())
        ON CONFLICT (user_id) DO UPDATE
          SET pmp_balance = economy.pmp_pmc_accounts.pmp_balance + EXCLUDED.pmp_balance,
              updated_at = now()
        RETURNING pmp_balance INTO v_new_balance;

        INSERT INTO economy.pmp_pmc_transactions (
            transaction_id, user_id, transaction_type, pmp_amount, pmc_amount, description, timestamp, metadata, created_at
        ) VALUES (
            gen_random_uuid(), p_user_id, p_tx_type, v_granted, 0, p_description, now(),
            jsonb_build_object('source', 'housing-pro', 'daily_cap', p_daily_cap) || COALESCE(p_metadata, '{}'::jsonb),
            now()
        );
    ELSE
        SELECT COALESCE(pmp_balance, 0)::BIGINT INTO v_new_balance
        FROM economy.pmp_pmc_accounts WHERE user_id = p_user_id;
    END IF;

    RETURN QUERY SELECT v_granted, GREATEST(0, v_remaining_before - v_granted), COALESCE(v_new_balance, 0);
END;
$function$
;

-- economy.refresh_daily_money_wave_snapshot(p_date date)
CREATE OR REPLACE FUNCTION economy.refresh_daily_money_wave_snapshot(p_date date DEFAULT ((now() AT TIME ZONE 'Asia/Seoul'::text))::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'economy', 'prediction', 'public'
AS $function$
DECLARE
  v_cfg RECORD;
  v_target_daily_total numeric;
  v_dormant_pmc numeric := 0;
  v_dormant_accounts int := 0;
  v_wave1_daily numeric;
  v_wave2_daily numeric := 0;
  v_wave3_daily numeric := 0;
  v_hourly_base numeric;
  v_active_games int := 0;
BEGIN
  SELECT * INTO v_cfg
  FROM economy.money_wave_config
  WHERE is_active = true
  ORDER BY updated_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No active money_wave_config found';
  END IF;

  -- 일일 총 MoneyWave 풀 = annual_ebitda / 365 = 36,500,000 / 365 = 정확히 100,000 PMC (10만 원)
  v_target_daily_total := ROUND((v_cfg.annual_ebitda * (1.0 - COALESCE(v_cfg.tax_rate, 0) - COALESCE(v_cfg.interest_rate, 0))) / 365.0, 8);

  -- 휴면 계정 현황 조회 (30일 이상 미활동)
  SELECT COUNT(*), COALESCE(SUM(a.pmc_balance), 0)
  INTO v_dormant_accounts, v_dormant_pmc
  FROM economy.pmp_pmc_accounts a
  LEFT JOIN economy.account_activity_stats s ON s.user_id = a.user_id
  WHERE a.pmc_balance > 0
    AND COALESCE(s.last_transaction_date, a.updated_at, a.created_at) < (NOW() - make_interval(days => COALESCE(v_cfg.mw2_dormant_days, 30)));

  -- 일일 100,000 PMC 예산 내에서 Wave 2(휴면 재분배)는 최대 20%(20,000 PMC)까지 배정, 나머지 80%+는 Wave 1(순수 EBIT)
  v_wave2_daily := LEAST(v_target_daily_total * 0.20, ROUND(v_dormant_pmc * 0.01, 8));
  v_wave1_daily := v_target_daily_total - v_wave2_daily - v_wave3_daily;
  v_hourly_base := ROUND(v_target_daily_total / 24.0, 8);

  SELECT COUNT(*) INTO v_active_games
  FROM prediction.prediction_games
  WHERE status = 'ACTIVE';

  INSERT INTO economy.money_wave_daily_snapshots (
    snapshot_date,
    timezone,
    annual_ebitda,
    tax_rate,
    interest_rate,
    daily_pool_total_pmc,
    daily_pool_wave1_pmc,
    daily_pool_wave2_pmc,
    daily_pool_wave3_pmc,
    hourly_pool_total_pmc,
    algorithm_version,
    metadata,
    computed_at
  ) VALUES (
    p_date,
    COALESCE(v_cfg.timezone, 'Asia/Seoul'),
    v_cfg.annual_ebitda,
    COALESCE(v_cfg.tax_rate, 0),
    COALESCE(v_cfg.interest_rate, 0),
    v_target_daily_total,
    v_wave1_daily,
    v_wave2_daily,
    v_wave3_daily,
    v_hourly_base,
    'v3_social_learning_time_weighted',
    jsonb_build_object(
      'signals', jsonb_build_object(
        'activePredictionGames', v_active_games,
        'dormantAccounts', v_dormant_accounts,
        'dormantPmcTotal', v_dormant_pmc,
        'dormantDays', COALESCE(v_cfg.mw2_dormant_days, 30)
      )
    ),
    NOW()
  )
  ON CONFLICT (snapshot_date) DO UPDATE SET
    annual_ebitda = EXCLUDED.annual_ebitda,
    daily_pool_total_pmc = EXCLUDED.daily_pool_total_pmc,
    daily_pool_wave1_pmc = EXCLUDED.daily_pool_wave1_pmc,
    daily_pool_wave2_pmc = EXCLUDED.daily_pool_wave2_pmc,
    daily_pool_wave3_pmc = EXCLUDED.daily_pool_wave3_pmc,
    hourly_pool_total_pmc = EXCLUDED.hourly_pool_total_pmc,
    algorithm_version = EXCLUDED.algorithm_version,
    metadata = EXCLUDED.metadata,
    computed_at = NOW();

  RETURN jsonb_build_object(
    'snapshot_date', p_date,
    'daily_pool_total_pmc', v_target_daily_total,
    'hourly_pool_total_pmc', v_hourly_base,
    'wave1_pmc', v_wave1_daily,
    'wave2_pmc', v_wave2_daily
  );
END;
$function$
;

-- economy.stake_pmp_on_prediction(user_id uuid, prediction_id uuid, stake_amount bigint)
CREATE OR REPLACE FUNCTION economy.stake_pmp_on_prediction(user_id uuid, prediction_id uuid, stake_amount bigint)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'economy', 'public'
AS $function$
DECLARE
  current_balance bigint;
  new_transaction_id uuid := gen_random_uuid();
BEGIN
  SELECT pmp_balance INTO current_balance
  FROM economy.pmp_pmc_accounts
  WHERE economy.pmp_pmc_accounts.user_id = stake_pmp_on_prediction.user_id
  FOR UPDATE;

  IF current_balance IS NULL OR current_balance < stake_amount THEN
    RAISE EXCEPTION 'Insufficient PMP balance';
  END IF;

  UPDATE economy.pmp_pmc_accounts
  SET pmp_balance = pmp_balance - stake_amount,
      updated_at = now()
  WHERE economy.pmp_pmc_accounts.user_id = stake_pmp_on_prediction.user_id;

  RETURN json_build_object(
    'success', true,
    'transaction_id', new_transaction_id,
    'new_balance', current_balance - stake_amount
  );
END;
$function$
;

-- economy.tg_touch_account_activity_stats_from_transaction()
CREATE OR REPLACE FUNCTION economy.tg_touch_account_activity_stats_from_transaction()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'economy', 'public'
AS $function$
begin
  insert into economy.account_activity_stats (
    user_id,
    last_transaction_date,
    transaction_count,
    total_pmp_earned,
    total_pmc_converted,
    average_activity_score,
    created_at,
    updated_at
  ) values (
    new.user_id,
    new."timestamp",
    1,
    0,
    0,
    0,
    now(),
    now()
  )
  on conflict (user_id) do update
    set last_transaction_date = greatest(
      coalesce(economy.account_activity_stats.last_transaction_date, excluded.last_transaction_date),
      excluded.last_transaction_date
    ),
    transaction_count = economy.account_activity_stats.transaction_count + 1,
    updated_at = now();

  return new;
end;
$function$
;

-- economy.update_updated_at_column()
CREATE OR REPLACE FUNCTION economy.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

-- prediction.auto_generate_slug()
CREATE OR REPLACE FUNCTION prediction.auto_generate_slug()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := prediction.generate_slug(NEW.title);
    END IF;
    RETURN NEW;
END;
$function$
;

-- prediction.auto_settle_expired_games()
CREATE OR REPLACE FUNCTION prediction.auto_settle_expired_games()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_cfg RECORD;
  v_closed integer := 0;
  v_void jsonb := jsonb_build_object('voided_games', 0, 'refunded_users', 0, 'total_refunded_pmp', 0);
  v_grace interval := interval '7 days';
BEGIN
  SELECT master_auto_enabled, auto_close_expired_enabled, auto_void_stale_enabled, stale_void_days
  INTO v_cfg
  FROM prediction.scheduler_config
  WHERE id = 'default'
  LIMIT 1;

  IF FOUND THEN
    IF NOT COALESCE(v_cfg.master_auto_enabled, true) THEN
      RETURN jsonb_build_object(
        'skipped', true,
        'reason', 'master_auto_enabled is false',
        'closed_games', 0,
        'processed_at', NOW()::text
      );
    END IF;

    IF COALESCE(v_cfg.auto_close_expired_enabled, true) THEN
      v_closed := prediction.close_expired_games();
    END IF;

    IF COALESCE(v_cfg.auto_void_stale_enabled, true) THEN
      v_grace := (GREATEST(1, COALESCE(v_cfg.stale_void_days, 7))::text || ' days')::interval;
      v_void := prediction.void_stale_games(v_grace);
    END IF;
  ELSE
    v_closed := prediction.close_expired_games();
    v_void := prediction.void_stale_games(interval '7 days');
  END IF;

  RETURN jsonb_build_object('closed_games', v_closed, 'processed_at', NOW()::text) || v_void;
END;
$function$
;

-- prediction.close_expired_games()
CREATE OR REPLACE FUNCTION prediction.close_expired_games()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_count integer;
BEGIN
  UPDATE prediction.prediction_games
  SET status = 'CLOSED', updated_at = NOW()
  WHERE status = 'ACTIVE' AND registration_end < NOW();
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$function$
;

-- prediction.create_game_snapshots()
CREATE OR REPLACE FUNCTION prediction.create_game_snapshots()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'prediction', 'public'
AS $function$
DECLARE
  game RECORD;
  opt RECORD;
  total NUMERIC;
  opt_volume NUMERIC;
  opt_count INT;
BEGIN
  -- 모든 ACTIVE 게임 순회
  FOR game IN 
    SELECT game_id, game_options 
    FROM prediction.prediction_games 
    WHERE status = 'ACTIVE'
  LOOP
    -- 전체 베팅액
    SELECT COALESCE(SUM(bet_amount), 0) INTO total
    FROM prediction.predictions
    WHERE game_id = game.game_id AND is_active = true;

    -- 각 옵션별 스냅샷 INSERT
    FOR opt IN 
      SELECT value->>'id' as opt_id
      FROM jsonb_array_elements(game.game_options) as value
    LOOP
      -- 옵션별 베팅액/건수
      SELECT 
        COALESCE(SUM(bet_amount), 0),
        COUNT(*)
      INTO opt_volume, opt_count
      FROM prediction.predictions
      WHERE game_id = game.game_id 
        AND is_active = true
        AND (prediction_data->>'selectedOptionId') = opt.opt_id;

      INSERT INTO prediction.game_snapshots 
        (game_id, option_id, probability, volume, total_volume, bet_count)
      VALUES (
        game.game_id,
        opt.opt_id,
        CASE WHEN total > 0 THEN ROUND((opt_volume / total) * 100, 2) ELSE 0 END,
        opt_volume,
        total,
        opt_count
      );
    END LOOP;
  END LOOP;
END;
$function$
;

-- prediction.generate_slug(title text)
CREATE OR REPLACE FUNCTION prediction.generate_slug(title text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    base_slug text;
    final_slug text;
    counter int := 0;
BEGIN
    -- 기본 슬러그 생성 (소문자 변환, 특수문자 제거)
    base_slug := lower(regexp_replace(title, '[^a-zA-Z0-9가-힣\s]', '', 'g'));
    base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
    base_slug := substring(base_slug from 1 for 100);
    
    final_slug := base_slug;
    
    -- 중복 체크 및 숫자 추가
    WHILE EXISTS (SELECT 1 FROM prediction.prediction_games WHERE slug = final_slug) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;
    
    RETURN final_slug;
END;
$function$
;

-- prediction.place_prediction_bet(p_game_id uuid, p_prediction_data jsonb, p_confidence_level integer, p_bet_amount bigint, p_expected_reward numeric, p_odds_at_time numeric)
CREATE OR REPLACE FUNCTION prediction.place_prediction_bet(p_game_id uuid, p_prediction_data jsonb, p_confidence_level integer, p_bet_amount bigint, p_expected_reward numeric DEFAULT 0, p_odds_at_time numeric DEFAULT 1)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'prediction', 'economy', 'auth', 'public'
AS $function$
DECLARE
  v_user_id UUID;
  v_balance BIGINT;
  v_min BIGINT;
  v_max BIGINT;
  v_status TEXT;
  v_reg_start TIMESTAMPTZ;
  v_reg_end TIMESTAMPTZ;
  v_prediction_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '28000';
  END IF;

  SELECT status::text, min_bet_amount, max_bet_amount, registration_start, registration_end
    INTO v_status, v_min, v_max, v_reg_start, v_reg_end
  FROM prediction.prediction_games
  WHERE game_id = p_game_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'game_not_found' USING ERRCODE = 'P0002';
  END IF;

  IF v_status <> 'ACTIVE' THEN
    RAISE EXCEPTION 'game_not_active';
  END IF;

  IF NOW() < v_reg_start OR NOW() > v_reg_end THEN
    RAISE EXCEPTION 'registration_closed';
  END IF;

  IF p_bet_amount IS NULL OR p_bet_amount <= 0 THEN
    RAISE EXCEPTION 'invalid_bet_amount';
  END IF;

  IF p_bet_amount < v_min OR p_bet_amount > v_max THEN
    RAISE EXCEPTION 'bet_amount_out_of_range';
  END IF;

  IF p_confidence_level IS NULL OR p_confidence_level < 1 OR p_confidence_level > 100 THEN
    RAISE EXCEPTION 'invalid_confidence_level';
  END IF;

  IF p_odds_at_time IS NULL OR p_odds_at_time <= 0 THEN
    RAISE EXCEPTION 'invalid_odds';
  END IF;

  -- Lock account row & check balance (trigger will apply the deduction, we just pre-check)
  SELECT pmp_balance
    INTO v_balance
  FROM economy.pmp_pmc_accounts
  WHERE user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'account_not_found';
  END IF;

  IF v_balance < p_bet_amount THEN
    RAISE EXCEPTION 'insufficient_pmp_balance';
  END IF;

  -- INSERT ONLY: trigger_process_prediction_payment handles the balance deduction and transaction history
  INSERT INTO prediction.predictions (
    game_id,
    user_id,
    prediction_data,
    confidence_level,
    bet_amount,
    expected_reward,
    odds_at_time,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    p_game_id,
    v_user_id,
    p_prediction_data,
    p_confidence_level,
    p_bet_amount,
    COALESCE(p_expected_reward, 0),
    p_odds_at_time,
    TRUE,
    NOW(),
    NOW()
  )
  RETURNING prediction_id INTO v_prediction_id;

  RETURN v_prediction_id;
END;
$function$
;

-- prediction.sync_pg_cron_with_config()
CREATE OR REPLACE FUNCTION prediction.sync_pg_cron_with_config()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'prediction', 'cron', 'public'
AS $function$
DECLARE
  v_cfg prediction.scheduler_config%ROWTYPE;
  v_job RECORD;
  v_sync_active BOOLEAN;
  v_rss_active BOOLEAN;
  v_settle_active BOOLEAN;
  v_close_active BOOLEAN;
  v_jobs jsonb;
BEGIN
  SELECT * INTO v_cfg
  FROM prediction.scheduler_config
  WHERE id = 'default'
  LIMIT 1;

  IF NOT FOUND THEN
    INSERT INTO prediction.scheduler_config (id) VALUES ('default')
    ON CONFLICT (id) DO NOTHING;
    SELECT * INTO v_cfg FROM prediction.scheduler_config WHERE id = 'default' LIMIT 1;
  END IF;

  v_sync_active := v_cfg.master_auto_enabled AND v_cfg.auto_template_sync_enabled;
  v_rss_active := v_cfg.master_auto_enabled AND v_cfg.auto_rss_draft_enabled;
  v_settle_active := v_cfg.master_auto_enabled AND v_cfg.auto_oracle_settle_enabled;
  v_close_active := v_cfg.master_auto_enabled AND (v_cfg.auto_close_expired_enabled OR v_cfg.auto_void_stale_enabled);

  FOR v_job IN SELECT jobid, jobname FROM cron.job LOOP
    IF v_job.jobname = 'scheduler-sync-daily-games' THEN
      PERFORM cron.alter_job(job_id => v_job.jobid, schedule => v_cfg.template_sync_cron, active => v_sync_active);
    ELSIF v_job.jobname = 'cron-prediction-pipeline' THEN
      PERFORM cron.alter_job(job_id => v_job.jobid, schedule => v_cfg.rss_pipeline_cron, active => v_rss_active);
    ELSIF v_job.jobname = 'cron-prediction-settle' THEN
      PERFORM cron.alter_job(job_id => v_job.jobid, schedule => v_cfg.settle_cron, active => v_settle_active);
    ELSIF v_job.jobname = 'auto-settle-expired-games' THEN
      PERFORM cron.alter_job(job_id => v_job.jobid, schedule => v_cfg.close_expired_cron, active => v_close_active);
    END IF;
  END LOOP;

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'jobid', j.jobid,
      'jobname', j.jobname,
      'schedule', j.schedule,
      'active', j.active
    ) ORDER BY j.jobid
  ), '[]'::jsonb) INTO v_jobs
  FROM cron.job j;

  RETURN jsonb_build_object(
    'synced', true,
    'synced_at', NOW(),
    'jobs', v_jobs
  );
END;
$function$
;

-- prediction.touch_user_prediction_stats_updated_at()
CREATE OR REPLACE FUNCTION prediction.touch_user_prediction_stats_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'prediction', 'public'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

-- prediction.trigger_http_cron(p_path text, p_method text, p_body jsonb)
CREATE OR REPLACE FUNCTION prediction.trigger_http_cron(p_path text, p_method text DEFAULT 'GET'::text, p_body jsonb DEFAULT '{}'::jsonb)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_req_id bigint;
  v_base_url text := 'https://posmul.com';
  v_url text;
  v_headers jsonb;
  v_secret text := 'a2a67a5f9a864abe594b33adb38525f6c572ba7936f4a26b6323dd53cf1494bb';
BEGIN
  v_url := v_base_url || p_path;
  v_headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || v_secret
  );

  IF upper(p_method) = 'POST' THEN
    SELECT net.http_post(
      url := v_url,
      body := p_body,
      headers := v_headers,
      timeout_milliseconds := 30000
    ) INTO v_req_id;
  ELSE
    SELECT net.http_get(
      url := v_url,
      headers := v_headers,
      timeout_milliseconds := 30000
    ) INTO v_req_id;
  END IF;

  RETURN v_req_id;
END;
$function$
;

-- prediction.update_prediction_statistics()
CREATE OR REPLACE FUNCTION prediction.update_prediction_statistics()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'prediction', 'public'
AS $function$
DECLARE
  v_total_participants INTEGER;
  v_total_bet_amount BIGINT;
  v_option_distributions JSONB;
BEGIN
  -- 참여자 수와 총 베팅액 계산
  SELECT COUNT(DISTINCT user_id), COALESCE(SUM(bet_amount), 0)
  INTO v_total_participants, v_total_bet_amount
  FROM prediction.predictions
  WHERE game_id = NEW.game_id AND is_active = true;

  -- 옵션별 분포 계산 (별도 쿼리)
  SELECT jsonb_object_agg(option_id, cnt)
  INTO v_option_distributions
  FROM (
    SELECT 
      COALESCE((prediction_data->>'selectedOptionId')::text, 'unknown') as option_id,
      COUNT(*) as cnt
    FROM prediction.predictions
    WHERE game_id = NEW.game_id AND is_active = true
    GROUP BY (prediction_data->>'selectedOptionId')
  ) sub;

  -- UPSERT
  INSERT INTO prediction.prediction_statistics (game_id, total_participants, total_bet_amount, option_distributions, last_updated)
  VALUES (NEW.game_id, v_total_participants, v_total_bet_amount, COALESCE(v_option_distributions, '{}'::jsonb), NOW())
  ON CONFLICT (game_id) DO UPDATE SET
    total_participants = v_total_participants,
    total_bet_amount = v_total_bet_amount,
    option_distributions = COALESCE(v_option_distributions, '{}'::jsonb),
    last_updated = NOW();
  
  RETURN NEW;
END;
$function$
;

-- prediction.void_stale_games(p_grace interval)
CREATE OR REPLACE FUNCTION prediction.void_stale_games(p_grace interval DEFAULT '7 days'::interval)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_game_ids uuid[];
  v_refunded_users integer := 0;
  v_total_refund bigint := 0;
BEGIN
  SELECT array_agg(game_id) INTO v_game_ids
  FROM prediction.prediction_games
  WHERE status IN ('ACTIVE', 'CLOSED', 'SETTLING')
    AND COALESCE(settlement_date, registration_end) + p_grace < NOW();

  IF v_game_ids IS NULL THEN
    RETURN jsonb_build_object('voided_games', 0, 'refunded_users', 0, 'total_refunded_pmp', 0);
  END IF;

  WITH refund_summary AS (
    SELECT user_id, SUM(bet_amount) AS total_refund
    FROM prediction.predictions
    WHERE game_id = ANY(v_game_ids) AND is_active = true
    GROUP BY user_id
  ), refund_applied AS (
    UPDATE economy.pmp_pmc_accounts a
    SET pmp_balance = a.pmp_balance + r.total_refund, updated_at = NOW()
    FROM refund_summary r
    WHERE a.user_id = r.user_id
    RETURNING r.total_refund
  )
  SELECT COUNT(*), COALESCE(SUM(total_refund), 0) INTO v_refunded_users, v_total_refund FROM refund_applied;

  UPDATE prediction.predictions
  SET is_active = false, updated_at = NOW()
  WHERE game_id = ANY(v_game_ids) AND is_active = true;

  UPDATE prediction.prediction_games
  SET status = 'CANCELLED',
      actual_result = jsonb_build_object('voided', true, 'reason', 'settlement_deadline_exceeded', 'voided_at', NOW()),
      updated_at = NOW()
  WHERE game_id = ANY(v_game_ids);

  RETURN jsonb_build_object(
    'voided_games', COALESCE(array_length(v_game_ids, 1), 0),
    'refunded_users', v_refunded_users,
    'total_refunded_pmp', v_total_refund
  );
END;
$function$
;

-- public.auto_update_game_status()
CREATE OR REPLACE FUNCTION public.auto_update_game_status()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
    -- 게임 상태 자동 업데이트
    UPDATE public.prediction_games 
    SET status = 'ACTIVE'
    WHERE status = 'PENDING' 
      AND start_time <= NOW();
      
    UPDATE public.prediction_games 
    SET status = 'ENDED'
    WHERE status = 'ACTIVE' 
      AND end_time <= NOW();
END;
$function$
;

-- public.calculate_current_odds(p_game_id uuid)
CREATE OR REPLACE FUNCTION public.calculate_current_odds(p_game_id uuid)
 RETURNS TABLE(option_id text, odds numeric, probability numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        (p.prediction_data->>'selectedOption')::TEXT as option_id,
        CASE 
            WHEN COUNT(*) = 0 THEN 1.0::DECIMAL
            ELSE (SELECT COUNT(*) FROM public.predictions WHERE game_id = p_game_id AND is_active = true)::DECIMAL / COUNT(*)::DECIMAL
        END as odds,
        CASE 
            WHEN COUNT(*) = 0 THEN 0.5::DECIMAL
            ELSE COUNT(*)::DECIMAL / (SELECT COUNT(*) FROM public.predictions WHERE game_id = p_game_id AND is_active = true)::DECIMAL
        END as probability
    FROM public.predictions p
    WHERE p.game_id = p_game_id 
      AND p.is_active = true
    GROUP BY (p.prediction_data->>'selectedOption')::TEXT;
END;
$function$
;

-- public.calculate_prediction_accuracy(p_user_id uuid)
CREATE OR REPLACE FUNCTION public.calculate_prediction_accuracy(p_user_id uuid)
 RETURNS numeric
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    accuracy_rate DECIMAL;
BEGIN
    SELECT 
        CASE 
            WHEN COUNT(*) = 0 THEN 0.0
            ELSE COUNT(CASE WHEN ps.is_correct = true THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL * 100
        END INTO accuracy_rate
    FROM public.predictions p
    LEFT JOIN public.prediction_settlements ps ON p.id = ps.prediction_id
    WHERE p.user_id = p_user_id;
    
    RETURN COALESCE(accuracy_rate, 0.0);
END;
$function$
;

-- public.calculate_reward_amount(p_prediction_id uuid, p_correct_option_id text)
CREATE OR REPLACE FUNCTION public.calculate_reward_amount(p_prediction_id uuid, p_correct_option_id text)
 RETURNS numeric
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'prediction', 'economy'
AS $function$
DECLARE
  v_bet_amount DECIMAL;
  v_game_id UUID;
  v_selected_option_id TEXT;
  v_total_pool DECIMAL := 0;
  v_winning_pool DECIMAL := 0;
  v_losing_pool DECIMAL := 0;
  v_participant_cnt INT := 0;
  v_game_mw_pool DECIMAL := 0;
BEGIN
  -- 1. 해당 예측의 배팅 금액, 게임 ID, 선택 옵션 조회
  SELECT bet_amount, game_id, (prediction_data->>'selectedOptionId')
  INTO v_bet_amount, v_game_id, v_selected_option_id
  FROM prediction.predictions
  WHERE prediction_id = p_prediction_id
    AND is_active = true;

  IF v_game_id IS NULL OR v_bet_amount IS NULL OR v_bet_amount <= 0 THEN
    RETURN 0;
  END IF;

  -- 정답을 맞히지 못한 예측은 0 반환
  IF v_selected_option_id IS DISTINCT FROM p_correct_option_id THEN
    RETURN 0;
  END IF;

  -- 2. 전체 베팅 풀, 승리 풀, 참여자 수 집계
  SELECT
    COALESCE(SUM(bet_amount), 0),
    COALESCE(SUM(bet_amount) FILTER (WHERE (prediction_data->>'selectedOptionId') = p_correct_option_id), 0),
    COUNT(DISTINCT user_id)
  INTO v_total_pool, v_winning_pool, v_participant_cnt
  FROM prediction.predictions
  WHERE game_id = v_game_id
    AND is_active = true;

  v_losing_pool := v_total_pool - v_winning_pool;

  -- 3. 무경쟁/단독 참여 게임 가드: 참여자 2명 미만 또는 반대편 베팅 0건 시 PMC 미발행
  IF v_participant_cnt < 2 OR v_winning_pool <= 0 OR v_losing_pool <= 0 THEN
    RETURN 0;
  END IF;

  -- 4. 순수 MoneyWave 누적 상금 풀 조회 (최대 20,000 PMC 상한)
  SELECT LEAST(20000, COALESCE(SUM(pool_pmc), 0))
  INTO v_game_mw_pool
  FROM economy.money_wave_hourly_game_pools
  WHERE game_id = v_game_id;

  IF COALESCE(v_game_mw_pool, 0) <= 0 THEN
    RETURN 0;
  END IF;

  -- 5. 승자 베팅 지분 비율대로 순수 MoneyWave 풀 배분
  RETURN ROUND((v_bet_amount / v_winning_pool) * v_game_mw_pool, 2);
END;
$function$
;

-- public.deduct_challenge_pmp(p_user_id uuid, p_challenge_id uuid, p_amount bigint, p_reason text)
CREATE OR REPLACE FUNCTION public.deduct_challenge_pmp(p_user_id uuid, p_challenge_id uuid, p_amount bigint, p_reason text DEFAULT 'challenge_entry'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'prediction', 'economy'
AS $function$
DECLARE
  v_balance BIGINT;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'INVALID_AMOUNT: amount must be positive';
  END IF;

  SELECT pmp_balance INTO v_balance
  FROM economy.pmp_pmc_accounts
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_balance IS NULL OR v_balance < p_amount THEN
    RAISE EXCEPTION 'INSUFFICIENT_PMP_BALANCE: available=%, required=%', COALESCE(v_balance, 0), p_amount;
  END IF;

  UPDATE economy.pmp_pmc_accounts
  SET pmp_balance = pmp_balance - p_amount,
      updated_at = NOW(),
      last_updated = NOW()
  WHERE user_id = p_user_id;

  INSERT INTO economy.pmp_pmc_transactions (
    transaction_id, user_id, transaction_type, pmp_amount, description, metadata, created_at
  ) VALUES (
    gen_random_uuid(),
    p_user_id,
    'PMP_SPEND',
    -p_amount,
    format('맞짱/유저예측 참여 (%s)', p_reason),
    jsonb_build_object(
      'source', 'user_challenge_entry',
      'challenge_id', p_challenge_id,
      'reason', p_reason
    ),
    NOW()
  );

  RETURN jsonb_build_object(
    'success', true,
    'deducted_pmp', p_amount,
    'remaining_pmp', v_balance - p_amount
  );
END;
$function$
;

-- public.dispute_challenge_settlement(p_challenge_id uuid, p_user_id uuid)
CREATE OR REPLACE FUNCTION public.dispute_challenge_settlement(p_challenge_id uuid, p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'prediction', 'economy'
AS $function$
DECLARE
  v_challenge RECORD;
  v_is_participant BOOLEAN := false;
  v_voters JSONB;
  v_dispute_count INT := 0;
  v_total_bettors INT := 0;
BEGIN
  SELECT * INTO v_challenge
  FROM prediction.user_challenges
  WHERE id = p_challenge_id
  FOR UPDATE;

  IF v_challenge.id IS NULL THEN
    RAISE EXCEPTION 'CHALLENGE_NOT_FOUND';
  END IF;

  IF v_challenge.status <> 'PENDING_SETTLEMENT' THEN
    RAISE EXCEPTION 'NOT_IN_DISPUTE_WINDOW';
  END IF;

  IF v_challenge.settlement_proposed_at IS NOT NULL
     AND NOW() > (v_challenge.settlement_proposed_at + INTERVAL '10 minutes') THEN
    RAISE EXCEPTION 'DISPUTE_WINDOW_EXPIRED';
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM prediction.user_challenge_bets
    WHERE challenge_id = p_challenge_id AND user_id = p_user_id
  ) INTO v_is_participant;

  IF NOT v_is_participant THEN
    RAISE EXCEPTION 'ONLY_PARTICIPANT_CAN_DISPUTE';
  END IF;

  v_voters := COALESCE(v_challenge.dispute_voters, '[]'::jsonb);
  IF v_voters ? p_user_id::text THEN
    RAISE EXCEPTION 'ALREADY_DISPUTED';
  END IF;

  v_voters := v_voters || jsonb_build_array(p_user_id::text);
  v_dispute_count := jsonb_array_length(v_voters);

  SELECT COUNT(DISTINCT user_id) INTO v_total_bettors
  FROM prediction.user_challenge_bets
  WHERE challenge_id = p_challenge_id;

  UPDATE prediction.user_challenges
  SET dispute_voters = v_voters, dispute_count = v_dispute_count, updated_at = NOW()
  WHERE id = p_challenge_id;

  IF v_total_bettors > 0 AND (v_dispute_count * 100 >= v_total_bettors * 30) THEN
    RETURN public.void_challenge_refund_internal(p_challenge_id, 'PARTICIPANT_DISPUTE_VOID');
  END IF;

  RETURN jsonb_build_object('status', 'PENDING_SETTLEMENT', 'dispute_count', v_dispute_count, 'threshold_needed', CEIL(v_total_bettors * 0.3)::int);
END;
$function$
;

-- public.finalize_challenge_settlement(p_challenge_id uuid, p_actor_user_id uuid, p_force_gg boolean)
CREATE OR REPLACE FUNCTION public.finalize_challenge_settlement(p_challenge_id uuid, p_actor_user_id uuid DEFAULT NULL::uuid, p_force_gg boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'prediction', 'economy'
AS $function$
DECLARE
  v_challenge RECORD;
  v_winning_opt TEXT;
  v_total_bettors INT := 0;
  v_winner_pool BIGINT := 0;
  v_loser_pool BIGINT := 0;
  v_total_pool BIGINT := 0;
  v_host_fee BIGINT := 0;
  v_burn_amount BIGINT := 0;
  v_distributable_loser BIGINT := 0;
  v_is_actor_loser BOOLEAN := false;
  v_bet RECORD;
  v_bonus BIGINT := 0;
  v_bonus_sum BIGINT := 0;
  v_remainder BIGINT := 0;
  v_payout BIGINT := 0;
  v_top_winner_id uuid := NULL;
  v_winners_count INT := 0;
BEGIN
  SELECT * INTO v_challenge
  FROM prediction.user_challenges
  WHERE id = p_challenge_id
  FOR UPDATE;

  IF v_challenge.id IS NULL THEN
    RAISE EXCEPTION 'CHALLENGE_NOT_FOUND';
  END IF;

  IF v_challenge.status <> 'PENDING_SETTLEMENT' THEN
    RETURN jsonb_build_object(
      'finalized', false,
      'status', v_challenge.status
    );
  END IF;

  v_winning_opt := v_challenge.pending_winning_option_id;
  IF v_winning_opt IS NULL THEN
    RAISE EXCEPTION 'PENDING_OPTION_MISSING';
  END IF;

  IF p_force_gg THEN
    SELECT EXISTS(
      SELECT 1 FROM prediction.user_challenge_bets
      WHERE challenge_id = p_challenge_id
        AND user_id = p_actor_user_id
        AND option_id <> v_winning_opt
    ) INTO v_is_actor_loser;

    IF NOT v_is_actor_loser THEN
      RAISE EXCEPTION 'ONLY_LOSER_CAN_CONFIRM_GG';
    END IF;
  ELSE
    IF v_challenge.settlement_proposed_at IS NULL
       OR NOW() < (v_challenge.settlement_proposed_at + INTERVAL '10 minutes') THEN
      RETURN jsonb_build_object(
        'finalized', false,
        'status', 'PENDING_SETTLEMENT',
        'ready_at', v_challenge.settlement_proposed_at + INTERVAL '10 minutes'
      );
    END IF;
  END IF;

  SELECT
    COUNT(DISTINCT user_id),
    COALESCE(SUM(amount_pmp) FILTER (WHERE option_id = v_winning_opt), 0),
    COALESCE(SUM(amount_pmp) FILTER (WHERE option_id <> v_winning_opt), 0)
  INTO v_total_bettors, v_winner_pool, v_loser_pool
  FROM prediction.user_challenge_bets
  WHERE challenge_id = p_challenge_id;

  IF v_total_bettors < 2 OR v_winner_pool <= 0 OR v_loser_pool <= 0 THEN
    RETURN public.void_challenge_refund_internal(p_challenge_id, 'NO_COUNTERPARTY_REFUND');
  END IF;

  v_total_pool := v_winner_pool + v_loser_pool;
  v_host_fee := LEAST(FLOOR(v_total_pool * 0.03)::bigint, v_loser_pool);
  v_burn_amount := LEAST(FLOOR(v_total_pool * 0.02)::bigint, GREATEST(0, v_loser_pool - v_host_fee));
  v_distributable_loser := GREATEST(0, v_loser_pool - v_host_fee - v_burn_amount);

  FOR v_bet IN
    SELECT user_id, amount_pmp
    FROM prediction.user_challenge_bets
    WHERE challenge_id = p_challenge_id
      AND option_id = v_winning_opt
    ORDER BY amount_pmp DESC, created_at ASC
  LOOP
    IF v_top_winner_id IS NULL THEN
      v_top_winner_id := v_bet.user_id;
    END IF;
    v_bonus := FLOOR((v_distributable_loser::numeric * v_bet.amount_pmp::numeric) / v_winner_pool::numeric)::bigint;
    v_bonus_sum := v_bonus_sum + v_bonus;
  END LOOP;

  v_remainder := GREATEST(0, v_distributable_loser - v_bonus_sum);

  FOR v_bet IN
    SELECT user_id, amount_pmp
    FROM prediction.user_challenge_bets
    WHERE challenge_id = p_challenge_id
      AND option_id = v_winning_opt
    ORDER BY amount_pmp DESC, created_at ASC
  LOOP
    v_bonus := FLOOR((v_distributable_loser::numeric * v_bet.amount_pmp::numeric) / v_winner_pool::numeric)::bigint;
    IF v_bet.user_id = v_top_winner_id AND v_remainder > 0 THEN
      v_bonus := v_bonus + v_remainder;
      v_remainder := 0;
    END IF;
    v_payout := v_bet.amount_pmp + v_bonus;

    INSERT INTO economy.pmp_pmc_accounts (user_id, pmp_balance, pmc_balance, created_at, updated_at, last_updated)
    VALUES (v_bet.user_id, v_payout, 0, NOW(), NOW(), NOW())
    ON CONFLICT (user_id) DO UPDATE
      SET pmp_balance = economy.pmp_pmc_accounts.pmp_balance + EXCLUDED.pmp_balance,
          updated_at = NOW(),
          last_updated = NOW();

    INSERT INTO economy.pmp_pmc_transactions (
      transaction_id, user_id, transaction_type, pmp_amount, description, metadata, created_at
    ) VALUES (
      gen_random_uuid(),
      v_bet.user_id,
      'PMP_EARN',
      v_payout,
      format('맞짱/유저예측 승리 상금 (+%s PMP 획득)', v_bonus),
      jsonb_build_object(
        'source', 'user_challenge_win',
        'challenge_id', p_challenge_id,
        'principal_pmp', v_bet.amount_pmp,
        'profit_pmp', v_bonus
      ),
      NOW()
    );

    v_winners_count := v_winners_count + 1;
  END LOOP;

  IF v_host_fee > 0 THEN
    INSERT INTO economy.pmp_pmc_accounts (user_id, pmp_balance, pmc_balance, created_at, updated_at, last_updated)
    VALUES (v_challenge.host_id, v_host_fee, 0, NOW(), NOW(), NOW())
    ON CONFLICT (user_id) DO UPDATE
      SET pmp_balance = economy.pmp_pmc_accounts.pmp_balance + EXCLUDED.pmp_balance,
          updated_at = NOW(),
          last_updated = NOW();

    INSERT INTO economy.pmp_pmc_transactions (
      transaction_id, user_id, transaction_type, pmp_amount, description, metadata, created_at
    ) VALUES (
      gen_random_uuid(),
      v_challenge.host_id,
      'PMP_EARN',
      v_host_fee,
      '맞짱/유저예측 호스트 모객 수수료 (3%)',
      jsonb_build_object(
        'source', 'user_challenge_host_fee',
        'challenge_id', p_challenge_id
      ),
      NOW()
    );
  END IF;

  IF v_burn_amount > 0 THEN
    INSERT INTO economy.pmp_pmc_transactions (
      transaction_id, user_id, transaction_type, pmp_amount, description, metadata, created_at
    ) VALUES (
      gen_random_uuid(),
      v_challenge.host_id,
      'PMP_BURN',
      -v_burn_amount,
      '맞짱/유저예측 플랫폼 소각 (2%)',
      jsonb_build_object(
        'source', 'user_challenge_burn',
        'challenge_id', p_challenge_id
      ),
      NOW()
    );
  END IF;

  UPDATE prediction.user_challenges
  SET status = 'SETTLED',
      winning_option_id = v_winning_opt,
      settled_at = NOW(),
      updated_at = NOW(),
      host_fee_pmp = v_host_fee,
      payout_details = jsonb_build_object(
        'mode', CASE WHEN p_force_gg THEN 'GG_INSTANT' ELSE 'WINDOW_EXPIRED' END,
        'total_pool_pmp', v_total_pool,
        'winner_pool_pmp', v_winner_pool,
        'loser_pool_pmp', v_loser_pool,
        'host_fee_pmp', v_host_fee,
        'burn_pmp', v_burn_amount,
        'distributable_loser_pmp', v_distributable_loser,
        'winners_count', v_winners_count
      )
  WHERE id = p_challenge_id;

  RETURN jsonb_build_object(
    'finalized', true,
    'status', 'SETTLED',
    'winning_option_id', v_winning_opt,
    'total_pool_pmp', v_total_pool,
    'host_fee_pmp', v_host_fee,
    'burn_pmp', v_burn_amount,
    'winners_count', v_winners_count
  );
END;
$function$
;

-- public.get_active_games(p_limit integer)
CREATE OR REPLACE FUNCTION public.get_active_games(p_limit integer DEFAULT 10)
 RETURNS TABLE(id uuid, title text, description text, prediction_type text, status text, participant_count integer, total_stake numeric, end_time timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        pg.id,
        pg.title,
        pg.description,
        pg.prediction_type,
        pg.status,
        COALESCE(pg.participant_count, 0)::INTEGER,
        COALESCE(pg.total_stake, 0)::DECIMAL,
        pg.end_time
    FROM public.prediction_games pg
    WHERE pg.status = 'ACTIVE'
    ORDER BY pg.created_at DESC
    LIMIT p_limit;
END;
$function$
;

-- public.get_economy_stats()
CREATE OR REPLACE FUNCTION public.get_economy_stats()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'economy', 'prediction'
AS $function$
DECLARE
  total_pmp bigint;
  total_pmc numeric;
  active_games integer;
  total_users integer;
BEGIN
  SELECT COALESCE(SUM(pmp_balance), 0), COALESCE(SUM(pmc_balance), 0)
  INTO total_pmp, total_pmc
  FROM economy.pmp_pmc_accounts;

  SELECT COUNT(*)
  INTO active_games
  FROM prediction.prediction_games
  WHERE status = 'ACTIVE';

  SELECT COUNT(*)
  INTO total_users
  FROM economy.pmp_pmc_accounts;

  RETURN json_build_object(
    'total_pmp_issued', total_pmp,
    'total_pmc_held', total_pmc,
    'active_prediction_games', active_games,
    'participating_users', total_users
  );
END;
$function$
;

-- public.get_user_prediction_history(p_user_id uuid, p_limit integer)
CREATE OR REPLACE FUNCTION public.get_user_prediction_history(p_user_id uuid, p_limit integer DEFAULT 20)
 RETURNS TABLE(prediction_id uuid, game_title text, prediction_data jsonb, stake numeric, confidence_level numeric, is_settled boolean, is_correct boolean, reward_amount numeric, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as prediction_id,
        pg.title as game_title,
        p.prediction_data,
        p.stake,
        p.confidence_level,
        CASE WHEN ps.id IS NOT NULL THEN true ELSE false END as is_settled,
        COALESCE(ps.is_correct, false) as is_correct,
        COALESCE(ps.payout_amount, 0)::DECIMAL as reward_amount,
        p.created_at
    FROM public.predictions p
    INNER JOIN public.prediction_games pg ON p.game_id = pg.id
    LEFT JOIN public.prediction_settlements ps ON p.id = ps.prediction_id
    WHERE p.user_id = p_user_id
      AND p.is_active = true
    ORDER BY p.created_at DESC
    LIMIT p_limit;
END;
$function$
;

-- public.grant_pmc(p_user_id uuid, p_amount numeric, p_reason text)
CREATE OR REPLACE FUNCTION public.grant_pmc(p_user_id uuid, p_amount numeric, p_reason text DEFAULT 'System Grant'::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  -- Update economy.pmp_pmc_accounts ONLY (Single Source of Truth)
  UPDATE economy.pmp_pmc_accounts
  SET pmc_balance = pmc_balance + p_amount,
      updated_at = now()
  WHERE user_id = p_user_id;

  -- NOTE: Removed sync to public.user_profiles (DDD principle)
END;
$function$
;

-- public.grant_pmp(p_user_id uuid, p_amount integer, p_reason text)
CREATE OR REPLACE FUNCTION public.grant_pmp(p_user_id uuid, p_amount integer, p_reason text DEFAULT 'System Grant'::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  -- Update economy.pmp_pmc_accounts ONLY (Single Source of Truth)
  UPDATE economy.pmp_pmc_accounts
  SET pmp_balance = pmp_balance + p_amount,
      updated_at = now()
  WHERE user_id = p_user_id;

  -- NOTE: Removed sync to public.user_profiles (DDD principle)
END;
$function$
;

-- public.handle_new_user()
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'economy', 'user'
AS $function$
BEGIN
  INSERT INTO economy.pmp_pmc_accounts (user_id, pmp_balance, pmc_balance)
  VALUES (NEW.id, 1000, 0)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO economy.pmp_pmc_transactions (
    transaction_id, user_id, transaction_type, pmp_amount,
    description, timestamp, created_at, metadata
  ) VALUES (
    gen_random_uuid(),
    NEW.id,
    'PMP_EARN',
    1000,
    '신규 가입 환영 보너스 (+1,000 PMP)',
    NOW(),
    NOW(),
    jsonb_build_object('source', 'signup_bonus')
  );

  INSERT INTO "user".profiles (
    id,
    username,
    display_name,
    email_verified,
    account_status,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.email_confirmed_at IS NOT NULL,
    'active',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$function$
;

-- public.handle_updated_at()
CREATE OR REPLACE FUNCTION public.handle_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

-- public.participate_in_prediction_game(p_game_id uuid, p_prediction_data jsonb, p_bet_amount bigint, p_confidence_level integer)
CREATE OR REPLACE FUNCTION public.participate_in_prediction_game(p_game_id uuid, p_prediction_data jsonb, p_bet_amount bigint, p_confidence_level integer)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'economy', 'prediction'
AS $function$
DECLARE
  v_user_id uuid;
  v_pmp_balance bigint;
  v_game_status game_status; -- Using the enum type
  v_game_options jsonb;
  v_selected_option_id text;
  v_selected_option_odds numeric;
  v_expected_reward numeric;
  v_prediction_id uuid;
  v_option_element jsonb;
BEGIN
  -- 1. Get User ID
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 2. Check Balance
  SELECT pmp_balance INTO v_pmp_balance
  FROM economy.pmp_pmc_accounts
  WHERE user_id = v_user_id;

  IF v_pmp_balance IS NULL OR v_pmp_balance < p_bet_amount THEN
    RAISE EXCEPTION 'Insufficient PMP balance';
  END IF;

  -- 3. Get Game Details
  SELECT status, game_options INTO v_game_status, v_game_options
  FROM prediction.prediction_games
  WHERE game_id = p_game_id;

  IF v_game_status IS NULL THEN
    RAISE EXCEPTION 'Game not found';
  END IF;

  -- Cast to text for comparison because enum might behave differently
  IF v_game_status::text != 'ACTIVE' THEN
    RAISE EXCEPTION 'Game is not active';
  END IF;

  -- 4. Calculate Odds & Expected Reward
  -- Extract selected option ID from prediction_data
  -- Assumes prediction_data has "selectedOptionId" or similar. 
  -- Based on PredictionGameCard, it sends: selectedOption (string) or selectedOptions (array)
  
  -- Handle Binary/WDL (single option)
  IF p_prediction_data ? 'selectedOptionId' THEN
    v_selected_option_id := p_prediction_data->>'selectedOptionId';
    
    -- Find odds in game_options
    -- game_options is JSONB array: [{ "id": "...", "currentOdds": 0.5, ... }]
    
    SELECT (elem->>'currentOdds')::numeric INTO v_selected_option_odds
    FROM jsonb_array_elements(v_game_options) elem
    WHERE elem->>'id' = v_selected_option_id;
    
    IF v_selected_option_odds IS NULL THEN
       RAISE EXCEPTION 'Invalid option selected';
    END IF;

    -- Calculate Reward: bet * (1/odds) ? Or just bet * odds?
    -- In PredictionGameCard: "배당률 {(1 / option.currentOdds).toFixed(2)}x"
    -- So Reward = Bet * (1/Odds)
    -- Wait, if currentOdds is probability (0.5), then payout is 1/0.5 = 2.0x.
    -- So Reward = Bet * (1 / v_selected_option_odds)
    
    v_expected_reward := p_bet_amount * (1.0 / v_selected_option_odds);
    
  -- Handle Ranking (multiple options) - Simplified for now
  ELSIF p_prediction_data ? 'selectedOptionIds' THEN
     -- Complex logic for ranking, just set dummy for now or sum odds?
     -- For now, let's assume simple 2.0x for ranking as per UI placeholder
     v_expected_reward := p_bet_amount * 2.0;
     v_selected_option_odds := 0.5; -- Dummy
  ELSE
     RAISE EXCEPTION 'Invalid prediction data format';
  END IF;

  -- 5. Deduct PMP
  UPDATE economy.pmp_pmc_accounts
  SET pmp_balance = pmp_balance - p_bet_amount,
      updated_at = now()
  WHERE user_id = v_user_id;

  -- 6. Insert Prediction
  v_prediction_id := gen_random_uuid();
  
  INSERT INTO prediction.predictions (
    prediction_id,
    game_id,
    user_id,
    prediction_data,
    confidence_level,
    bet_amount,
    expected_reward,
    odds_at_time,
    is_active
  ) VALUES (
    v_prediction_id,
    p_game_id,
    v_user_id,
    p_prediction_data,
    p_confidence_level,
    p_bet_amount,
    v_expected_reward,
    v_selected_option_odds,
    true
  );

  -- 7. Update Game Stats (Participants, Total Stake)
  -- Optional but good for performance
  -- UPDATE prediction.prediction_games ...

  RETURN json_build_object(
    'success', true,
    'prediction_id', v_prediction_id,
    'new_balance', v_pmp_balance - p_bet_amount,
    'expected_reward', v_expected_reward
  );
END;
$function$
;

-- public.participate_in_prediction_game(p_game_id uuid, p_prediction_data jsonb, p_bet_amount integer, p_confidence_level integer)
CREATE OR REPLACE FUNCTION public.participate_in_prediction_game(p_game_id uuid, p_prediction_data jsonb, p_bet_amount integer, p_confidence_level integer DEFAULT 50)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_user_id uuid;
  v_pmp_balance bigint;
  v_game_status public.game_status;
  v_game_options jsonb;
  v_selected_option_id text;
  v_selected_option_odds numeric;
  v_expected_reward numeric;
  v_prediction_id uuid;
  v_new_balance bigint;
BEGIN
  -- 1. Get User ID
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 2. Check Balance from economy schema (Single Source of Truth)
  SELECT pmp_balance INTO v_pmp_balance
  FROM economy.pmp_pmc_accounts
  WHERE user_id = v_user_id;

  IF v_pmp_balance IS NULL OR v_pmp_balance < p_bet_amount THEN
    RAISE EXCEPTION 'Insufficient PMP balance';
  END IF;

  -- 3. Get Game Details
  SELECT status, game_options INTO v_game_status, v_game_options
  FROM prediction.prediction_games
  WHERE game_id = p_game_id;

  IF v_game_status IS NULL THEN
    RAISE EXCEPTION 'Game not found';
  END IF;

  IF v_game_status::text != 'ACTIVE' THEN
    RAISE EXCEPTION 'Game is not active';
  END IF;

  -- 4. Calculate Odds & Expected Reward
  IF p_prediction_data ? 'selectedOptionId' THEN
    v_selected_option_id := p_prediction_data->>'selectedOptionId';
    
    SELECT (elem->>'currentOdds')::numeric INTO v_selected_option_odds
    FROM jsonb_array_elements(v_game_options) elem
    WHERE elem->>'id' = v_selected_option_id;
    
    IF v_selected_option_odds IS NULL THEN
       RAISE EXCEPTION 'Invalid option selected';
    END IF;

    v_expected_reward := p_bet_amount * (1.0 / v_selected_option_odds);
    
  ELSIF p_prediction_data ? 'selectedOptionIds' THEN
     v_expected_reward := p_bet_amount * 2.0;
     v_selected_option_odds := 0.5;
  ELSE
     RAISE EXCEPTION 'Invalid prediction data format';
  END IF;

  -- Calculate new balance
  v_new_balance := v_pmp_balance - p_bet_amount;

  -- 5. Deduct PMP from economy.pmp_pmc_accounts ONLY (Single Source of Truth)
  UPDATE economy.pmp_pmc_accounts
  SET pmp_balance = v_new_balance,
      updated_at = now()
  WHERE user_id = v_user_id;

  -- NOTE: Removed sync to public.user_profiles (DDD principle - economy schema is SSOT)

  -- 6. Insert Prediction
  v_prediction_id := gen_random_uuid();
  
  INSERT INTO prediction.predictions (
    prediction_id,
    game_id,
    user_id,
    prediction_data,
    confidence_level,
    bet_amount,
    expected_reward,
    odds_at_time,
    is_active
  ) VALUES (
    v_prediction_id,
    p_game_id,
    v_user_id,
    p_prediction_data,
    p_confidence_level,
    p_bet_amount,
    v_expected_reward,
    v_selected_option_odds,
    true
  );

  -- 7. Update Game Stats
  UPDATE prediction.prediction_games
  SET total_participants_count = COALESCE(total_participants_count, 0) + 1,
      total_stake_amount = COALESCE(total_stake_amount, 0) + p_bet_amount,
      updated_at = now()
  WHERE game_id = p_game_id;

  RETURN json_build_object(
    'success', true,
    'prediction_id', v_prediction_id,
    'new_balance', v_new_balance,
    'expected_reward', v_expected_reward
  );
END;
$function$
;

-- public.process_expired_user_challenges()
CREATE OR REPLACE FUNCTION public.process_expired_user_challenges()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'prediction', 'economy'
AS $function$
DECLARE
  v_row RECORD;
  v_finalized_count INT := 0;
  v_refunded_count INT := 0;
  v_failed_count INT := 0;
BEGIN
  -- 1. 10분 이의제기 윈도우 경과 건 자동 정산 확정
  FOR v_row IN
    SELECT id, host_id
    FROM prediction.user_challenges
    WHERE status = 'PENDING_SETTLEMENT'
      AND settlement_proposed_at IS NOT NULL
      AND settlement_proposed_at <= NOW() - INTERVAL '10 minutes'
    ORDER BY settlement_proposed_at ASC
    LIMIT 100
  LOOP
    BEGIN
      PERFORM public.finalize_challenge_settlement(v_row.id, v_row.host_id, false);
      v_finalized_count := v_finalized_count + 1;
    EXCEPTION WHEN OTHERS THEN
      v_failed_count := v_failed_count + 1;
    END;
  END LOOP;

  -- 2. 호스트 미판정 장기간(24시간 초과) 방치 건 처리
  --    (실제 에스크로 차감 트랜잭션이 있는 건만 원금 환불, 레거시 시드 건은 PMP 지급 없이 VOID 마감)
  FOR v_row IN
    SELECT
      c.id,
      EXISTS (
        SELECT 1
        FROM economy.pmp_pmc_transactions t
        WHERE t.transaction_type = 'PMP_SPEND'
          AND t.metadata->>'source' = 'user_challenge_entry'
          AND t.metadata->>'challenge_id' = c.id::text
      ) AS has_escrow
    FROM prediction.user_challenges c
    WHERE c.status IN ('OPEN', 'LOCKED')
      AND c.settlement_at <= NOW() - INTERVAL '24 hours'
    ORDER BY c.settlement_at ASC
    LIMIT 100
  LOOP
    BEGIN
      IF v_row.has_escrow THEN
        PERFORM public.void_challenge_refund_internal(v_row.id, 'HOST_TIMEOUT_VOID_REFUND');
        v_refunded_count := v_refunded_count + 1;
      ELSE
        UPDATE prediction.user_challenges
        SET status = 'VOID',
            settled_at = NOW(),
            updated_at = NOW(),
            payout_details = jsonb_build_object(
              'mode', 'VOID_LEGACY_NO_ESCROW',
              'reason', 'HOST_TIMEOUT_LEGACY_CLOSE'
            )
        WHERE id = v_row.id;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      v_failed_count := v_failed_count + 1;
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'finalized_count', v_finalized_count,
    'refunded_count', v_refunded_count,
    'failed_count', v_failed_count,
    'processed_at', NOW()
  );
END;
$function$
;

-- public.process_prediction_payment()
CREATE OR REPLACE FUNCTION public.process_prediction_payment()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'economy', 'prediction'
AS $function$
BEGIN
  IF NEW.bet_amount IS NULL OR NEW.bet_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid bet amount: %', NEW.bet_amount;
  END IF;

  -- economy.pmp_pmc_accounts에서 PMP 잔액 원자적 검증 및 차감 (Single Source of Truth)
  UPDATE economy.pmp_pmc_accounts
  SET pmp_balance = pmp_balance - NEW.bet_amount,
      updated_at = NOW()
  WHERE user_id = NEW.user_id
    AND pmp_balance >= NEW.bet_amount;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient PMP balance or missing account for user % (required: %)', NEW.user_id, NEW.bet_amount;
  END IF;

  -- 거래 기록
  INSERT INTO economy.pmp_pmc_transactions (
    transaction_id, user_id, transaction_type, pmp_amount,
    description, timestamp, created_at, metadata
  ) VALUES (
    gen_random_uuid(),
    NEW.user_id,
    'PMP_SPEND',
    NEW.bet_amount,
    '예측 게임 참여',
    NOW(),
    NOW(),
    jsonb_build_object(
      'game_id', NEW.game_id,
      'prediction_id', NEW.prediction_id,
      'source', 'prediction_game'
    )
  );

  RETURN NEW;
END;
$function$
;

-- public.propose_challenge_settlement(p_challenge_id uuid, p_host_user_id uuid, p_winning_option_id text)
CREATE OR REPLACE FUNCTION public.propose_challenge_settlement(p_challenge_id uuid, p_host_user_id uuid, p_winning_option_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'prediction', 'economy'
AS $function$
DECLARE
  v_challenge RECORD;
  v_total_bettors INT := 0;
  v_winner_pool BIGINT := 0;
  v_loser_pool BIGINT := 0;
BEGIN
  SELECT * INTO v_challenge
  FROM prediction.user_challenges
  WHERE id = p_challenge_id
  FOR UPDATE;

  IF v_challenge.id IS NULL THEN
    RAISE EXCEPTION 'CHALLENGE_NOT_FOUND';
  END IF;

  IF v_challenge.host_id IS DISTINCT FROM p_host_user_id THEN
    RAISE EXCEPTION 'FORBIDDEN_NOT_HOST';
  END IF;

  IF v_challenge.status NOT IN ('OPEN', 'LOCKED') THEN
    RAISE EXCEPTION 'INVALID_CHALLENGE_STATUS: %', v_challenge.status;
  END IF;

  SELECT
    COUNT(DISTINCT user_id),
    COALESCE(SUM(amount_pmp) FILTER (WHERE option_id = p_winning_option_id), 0),
    COALESCE(SUM(amount_pmp) FILTER (WHERE option_id <> p_winning_option_id), 0)
  INTO v_total_bettors, v_winner_pool, v_loser_pool
  FROM prediction.user_challenge_bets
  WHERE challenge_id = p_challenge_id;

  IF v_total_bettors < 2 OR v_winner_pool <= 0 OR v_loser_pool <= 0 THEN
    RETURN public.void_challenge_refund_internal(p_challenge_id, 'ONE_SIDED_OR_SOLO_REFUND');
  END IF;

  UPDATE prediction.user_challenges
  SET status = 'PENDING_SETTLEMENT',
      pending_winning_option_id = p_winning_option_id,
      settlement_proposed_at = NOW(),
      updated_at = NOW()
  WHERE id = p_challenge_id;

  RETURN jsonb_build_object(
    'status', 'PENDING_SETTLEMENT',
    'pending_winning_option_id', p_winning_option_id,
    'dispute_window_ends_at', NOW() + INTERVAL '10 minutes'
  );
END;
$function$
;

-- public.record_prediction_trend()
CREATE OR REPLACE FUNCTION public.record_prediction_trend()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'prediction'
AS $function$
DECLARE
    snapshot jsonb;
BEGIN
    -- 현재 게임의 예측 현황 스냅샷 생성
    SELECT jsonb_build_object(
        'option_id', (NEW.prediction_data->>'selectedOptionId'),
        'participation_count', COUNT(*),
        'total_stake', COALESCE(SUM(bet_amount), 0),
        'average_confidence', COALESCE(AVG(confidence_level), 0),
        'trend_direction', 'STABLE'
    ) INTO snapshot
    FROM prediction.predictions 
    WHERE game_id = NEW.game_id 
      AND is_active = true;

    -- 트렌드 기록 - 실제 테이블 구조 사용
    INSERT INTO prediction.prediction_trends (
        trend_id, game_id, timestamp, snapshot_data, created_at
    ) VALUES (
        gen_random_uuid(),
        NEW.game_id,
        NOW(),
        COALESCE(snapshot, '{}'::jsonb),
        NOW()
    );
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- 트렌드 기록 실패해도 예측 저장은 계속
    RAISE WARNING 'Failed to record prediction trend: %', SQLERRM;
    RETURN NEW;
END;
$function$
;

-- public.settle_prediction(p_prediction_id uuid, p_is_winner boolean, p_reward_amount numeric)
CREATE OR REPLACE FUNCTION public.settle_prediction(p_prediction_id uuid, p_is_winner boolean, p_reward_amount numeric DEFAULT 0)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'prediction', 'economy'
AS $function$
DECLARE
  v_user_id UUID;
  v_bet_amount BIGINT;
  v_game_id UUID;
  v_reward NUMERIC := COALESCE(p_reward_amount, 0);
BEGIN
  -- 예측 정보 조회
  SELECT user_id, bet_amount, game_id
  INTO v_user_id, v_bet_amount, v_game_id
  FROM prediction.predictions
  WHERE prediction_id = p_prediction_id;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Prediction not found: %', p_prediction_id;
  END IF;

  IF p_is_winner THEN
    -- ===== 승리 시: 순수 MoneyWave PMC 보상 지급 (0원 초과일 때만 계좌 및 원장 반영) =====
    IF v_reward > 0 THEN
      UPDATE economy.pmp_pmc_accounts
      SET pmc_balance = pmc_balance + v_reward,
          updated_at = NOW()
      WHERE user_id = v_user_id;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Economy account not found for user: %', v_user_id;
      END IF;

      INSERT INTO economy.pmp_pmc_transactions (
        transaction_id, user_id, transaction_type, pmc_amount,
        description, timestamp, created_at, metadata
      ) VALUES (
        gen_random_uuid(),
        v_user_id,
        'PMC_EARN',
        v_reward,
        '예측 성공 보상 (MoneyWave)',
        NOW(),
        NOW(),
        jsonb_build_object(
          'prediction_id', p_prediction_id,
          'game_id', v_game_id,
          'original_bet', v_bet_amount,
          'source', 'prediction_win'
        )
      );
    END IF;
  ELSE
    -- ===== 패배 시: PMP 소각 기록 (참여 시 이미 pmp_balance 차감 완료) =====
    INSERT INTO economy.pmp_pmc_transactions (
      transaction_id, user_id, transaction_type, pmp_amount,
      description, timestamp, created_at, metadata
    ) VALUES (
      gen_random_uuid(),
      v_user_id,
      'PMP_BURN',
      v_bet_amount,
      '예측 실패 - PMP 소각',
      NOW(),
      NOW(),
      jsonb_build_object(
        'prediction_id', p_prediction_id,
        'game_id', v_game_id,
        'source', 'prediction_loss'
      )
    );
  END IF;
END;
$function$
;

-- public.settle_prediction_game(p_game_id uuid, p_correct_option_id text)
CREATE OR REPLACE FUNCTION public.settle_prediction_game(p_game_id uuid, p_correct_option_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'prediction', 'economy', 'forum'
AS $function$
DECLARE
  v_game_status TEXT;
  v_prediction RECORD;
  v_winners_count INT := 0;
  v_losers_count INT := 0;
  v_total_reward DECIMAL := 0;
  v_total_bet_pool DECIMAL := 0;
  v_ebit_amount NUMERIC := 0;
  v_reward DECIMAL := 0;
BEGIN
  -- 동시 정산 레이스 방지를 위한 행 잠금 + 상태 검증
  SELECT status::text INTO v_game_status
  FROM prediction.prediction_games
  WHERE game_id = p_game_id
  FOR UPDATE;

  IF v_game_status IS NULL OR v_game_status NOT IN ('ACTIVE', 'CLOSED', 'SETTLING') THEN
    RAISE EXCEPTION 'Game not found or not settleable: % (status=%)', p_game_id, COALESCE(v_game_status, 'NULL');
  END IF;

  SELECT COALESCE(SUM(bet_amount), 0) INTO v_total_bet_pool
  FROM prediction.predictions
  WHERE game_id = p_game_id AND is_active = true;

  -- 최신 일일 스냅샷에서 연간 기준 EAT/EBITDA 조회
  SELECT COALESCE(annual_ebitda, 0) INTO v_ebit_amount
  FROM economy.money_wave_daily_snapshots
  ORDER BY snapshot_date DESC
  LIMIT 1;
  v_ebit_amount := COALESCE(v_ebit_amount, 0);

  -- 게임 결과 저장
  UPDATE prediction.prediction_games
  SET actual_result = jsonb_build_object('correctOptionId', p_correct_option_id),
      winning_option_id = p_correct_option_id,
      settled_at = NOW(),
      status = 'SETTLED',
      updated_at = NOW()
  WHERE game_id = p_game_id;

  -- 각 예측에 대해 정산 처리
  FOR v_prediction IN
    SELECT prediction_id, user_id, bet_amount, prediction_data
    FROM prediction.predictions
    WHERE game_id = p_game_id AND is_active = true
  LOOP
    IF (v_prediction.prediction_data->>'selectedOptionId') = p_correct_option_id THEN
      v_reward := public.calculate_reward_amount(v_prediction.prediction_id, p_correct_option_id);
      PERFORM public.settle_prediction(v_prediction.prediction_id, true, v_reward);
      v_winners_count := v_winners_count + 1;
      v_total_reward := v_total_reward + v_reward;
    ELSE
      PERFORM public.settle_prediction(v_prediction.prediction_id, false, 0);
      v_losers_count := v_losers_count + 1;
    END IF;
  END LOOP;

  -- 순수 MoneyWave 발행 이력 기록 (지급된 v_total_reward 전액이 순수 MoneyWave 발행액)
  IF v_winners_count > 0 AND v_total_reward > 0 THEN
    INSERT INTO economy.money_wave_history (
      wave_id,
      wave_type,
      execution_date,
      status,
      ebit_amount,
      pmc_issued,
      affected_users_count,
      trigger_event,
      result_summary,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      'MONEY_WAVE_1',
      NOW(),
      'COMPLETED',
      v_ebit_amount,
      v_total_reward,
      v_winners_count,
      'prediction_settlement',
      jsonb_build_object(
        'game_id', p_game_id,
        'winners_count', v_winners_count,
        'losers_count', v_losers_count,
        'total_bet_pool_pmp', v_total_bet_pool,
        'total_reward_distributed_pmc', v_total_reward,
        'moneywave_issued_pmc', v_total_reward
      ),
      NOW(),
      NOW()
    );
  END IF;

  RETURN jsonb_build_object(
    'game_id', p_game_id,
    'correct_option_id', p_correct_option_id,
    'winners_count', v_winners_count,
    'losers_count', v_losers_count,
    'total_reward_distributed', v_total_reward,
    'moneywave_bonus_distributed', v_total_reward,
    'settled_at', NOW()
  );
END;
$function$
;

-- public.sync_user_email_verification()
CREATE OR REPLACE FUNCTION public.sync_user_email_verification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'user'
AS $function$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- DDD: user.profiles 스키마 사용
    UPDATE "user".profiles 
    SET email_verified = NEW.email_confirmed_at IS NOT NULL,
        updated_at = NOW()
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$function$
;

-- public.update_prediction_statistics()
CREATE OR REPLACE FUNCTION public.update_prediction_statistics()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'prediction'
AS $function$
BEGIN
    -- 예측 통계 업데이트 로직 - prediction 스키마 사용
    -- 참고: prediction_games에는 participant_count, total_stake 컬럼이 없을 수 있음
    -- 이 경우 metadata JSONB 필드를 사용하거나 무시
    RETURN COALESCE(NEW, OLD);
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Failed to update prediction statistics: %', SQLERRM;
    RETURN COALESCE(NEW, OLD);
END;
$function$
;

-- public.update_prediction_updated_at_column()
CREATE OR REPLACE FUNCTION public.update_prediction_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

-- public.update_updated_at_column()
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

-- public.update_user_prediction_stats()
CREATE OR REPLACE FUNCTION public.update_user_prediction_stats()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
    -- 사용자 예측 통계 업데이트 로직
    RETURN COALESCE(NEW, OLD);
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Failed to update user prediction stats: %', SQLERRM;
    RETURN COALESCE(NEW, OLD);
END;
$function$
;

-- public.validate_pmp_balance(p_user_id uuid, p_required_amount numeric)
CREATE OR REPLACE FUNCTION public.validate_pmp_balance(p_user_id uuid, p_required_amount numeric)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    current_balance DECIMAL;
BEGIN
    SELECT pmp_balance INTO current_balance
    FROM economy.pmp_pmc_accounts
    WHERE user_id = p_user_id;
    
    RETURN COALESCE(current_balance, 0) >= p_required_amount;
END;
$function$
;

-- public.void_challenge_refund_internal(p_challenge_id uuid, p_reason text)
CREATE OR REPLACE FUNCTION public.void_challenge_refund_internal(p_challenge_id uuid, p_reason text DEFAULT 'VOID_REFUND'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'prediction', 'economy'
AS $function$
DECLARE
  v_challenge RECORD;
  v_bet RECORD;
  v_refunded_count INT := 0;
  v_refunded_total BIGINT := 0;
BEGIN
  SELECT id, status INTO v_challenge
  FROM prediction.user_challenges
  WHERE id = p_challenge_id
  FOR UPDATE;

  IF v_challenge.id IS NULL THEN
    RAISE EXCEPTION 'CHALLENGE_NOT_FOUND';
  END IF;

  IF v_challenge.status IN ('VOID', 'SETTLED') THEN
    RETURN jsonb_build_object(
      'status', v_challenge.status,
      'reason', 'ALREADY_FINALIZED',
      'refunded_count', 0,
      'refunded_total_pmp', 0
    );
  END IF;

  FOR v_bet IN
    SELECT id, user_id, amount_pmp
    FROM prediction.user_challenge_bets
    WHERE challenge_id = p_challenge_id
      AND COALESCE(amount_pmp, 0) > 0
  LOOP
    INSERT INTO economy.pmp_pmc_accounts (user_id, pmp_balance, pmc_balance, created_at, updated_at, last_updated)
    VALUES (v_bet.user_id, v_bet.amount_pmp, 0, NOW(), NOW(), NOW())
    ON CONFLICT (user_id) DO UPDATE
      SET pmp_balance = economy.pmp_pmc_accounts.pmp_balance + EXCLUDED.pmp_balance,
          updated_at = NOW(),
          last_updated = NOW();

    INSERT INTO economy.pmp_pmc_transactions (
      transaction_id, user_id, transaction_type, pmp_amount, pmc_amount, description, timestamp, metadata, created_at
    ) VALUES (
      gen_random_uuid(), v_bet.user_id, 'PMP_REFUND', v_bet.amount_pmp, 0,
      format('맞짱/유저예측 무효 전액 환불 (%s)', p_reason), NOW(),
      jsonb_build_object('source', 'user_challenge_refund', 'challenge_id', p_challenge_id, 'reason', p_reason), NOW()
    );

    v_refunded_count := v_refunded_count + 1;
    v_refunded_total := v_refunded_total + v_bet.amount_pmp;
  END LOOP;

  UPDATE prediction.user_challenges
  SET status = 'VOID', settled_at = NOW(), updated_at = NOW(),
      payout_details = jsonb_build_object('mode', 'VOID_REFUND', 'reason', p_reason, 'refunded_count', v_refunded_count, 'refunded_total_pmp', v_refunded_total)
  WHERE id = p_challenge_id;

  RETURN jsonb_build_object('status', 'VOID', 'reason', p_reason, 'refunded_count', v_refunded_count, 'refunded_total_pmp', v_refunded_total);
END;
$function$
;

-- study_cycle.get_user_mfa_status(user_uuid uuid)
CREATE OR REPLACE FUNCTION study_cycle.get_user_mfa_status(user_uuid uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'study_cycle', 'public'
AS $function$
BEGIN
    -- 사용자의 MFA 등록 여부 확인
    RETURN EXISTS (
        SELECT 1 
        FROM auth.mfa_factors 
        WHERE user_id = user_uuid 
          AND status = 'verified'
    );
END;
$function$
;

-- study_cycle.is_secure_session()
CREATE OR REPLACE FUNCTION study_cycle.is_secure_session()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'study_cycle', 'public'
AS $function$
DECLARE
    session_aal TEXT;
    user_uuid UUID;
BEGIN
    -- 현재 사용자 ID 가져오기
    user_uuid := (SELECT auth.uid());
    
    IF user_uuid IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- JWT에서 AAL 레벨 확인
    session_aal := (SELECT auth.jwt() ->> 'aal');
    
    -- AAL2 (MFA 인증) 또는 MFA가 설정되지 않은 경우 허용
    RETURN (
        session_aal = 'aal2' OR 
        NOT study_cycle.get_user_mfa_status(user_uuid)
    );
END;
$function$
;

-- study_cycle.validate_sequential_reading()
CREATE OR REPLACE FUNCTION study_cycle.validate_sequential_reading()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'study_cycle', 'public'
AS $function$
BEGIN
  -- 1회차는 항상 허용
  IF NEW.round = 1 THEN
    RETURN NEW;
  END IF;
  
  -- 이전 회차가 완료되었는지 확인
  IF NOT EXISTS (
    SELECT 1 FROM study_cycle.sc_readings 
    WHERE user_id = NEW.user_id 
      AND textbook_id = NEW.textbook_id 
      AND round = NEW.round - 1 
      AND status = 'completed'
  ) THEN
    RAISE EXCEPTION 'Cannot start round % without completing round %', NEW.round, NEW.round - 1;
  END IF;
  
  RETURN NEW;
END;
$function$
;

-- user.prevent_profile_role_escalation()
CREATE OR REPLACE FUNCTION "user".prevent_profile_role_escalation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'user', 'pg_catalog'
AS $function$
DECLARE
  jwt_role text := NULLIF(current_setting('request.jwt.claim.role', true), '');
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.role IS DISTINCT FROM 'user' THEN
      IF current_user IN ('authenticated', 'anon')
         OR COALESCE(jwt_role, '') IN ('authenticated', 'anon') THEN
        RAISE EXCEPTION 'Insufficient privilege to set non-default role'
          USING ERRCODE = '42501';
      END IF;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      IF current_user IN ('authenticated', 'anon')
         OR COALESCE(jwt_role, '') IN ('authenticated', 'anon') THEN
        RAISE EXCEPTION 'Insufficient privilege to modify user role'
          USING ERRCODE = '42501';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$
;

-- user.update_profiles_updated_at()
CREATE OR REPLACE FUNCTION "user".update_profiles_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
;

-- -----------------------------------------------------------------------------
-- 10. Triggers
-- -----------------------------------------------------------------------------
CREATE TRIGGER update_investment_categories_updated_at BEFORE UPDATE ON consume.consume_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_investment_opportunities_updated_at BEFORE UPDATE ON consume.consume_opportunities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_investment_participations_updated_at BEFORE UPDATE ON consume.consume_participations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_touch_account_activity_stats_from_transaction AFTER INSERT ON economy.pmp_pmc_transactions FOR EACH ROW EXECUTE FUNCTION economy.tg_touch_account_activity_stats_from_transaction();
CREATE TRIGGER update_account_activity_stats_updated_at BEFORE UPDATE ON economy.account_activity_stats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_individual_utility_parameters_updated_at BEFORE UPDATE ON economy.individual_utility_parameters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_money_wave3_ventures_updated_at BEFORE UPDATE ON economy.money_wave3_ventures FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_money_wave_config_updated_at BEFORE UPDATE ON economy.money_wave_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_money_wave_history_updated_at BEFORE UPDATE ON economy.money_wave_history FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pmp_pmc_accounts_updated_at BEFORE UPDATE ON economy.pmp_pmc_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_update_prediction_statistics AFTER INSERT OR UPDATE ON prediction.predictions FOR EACH ROW EXECUTE FUNCTION prediction.update_prediction_statistics();
CREATE TRIGGER trg_user_prediction_stats_updated_at BEFORE UPDATE ON prediction.user_prediction_stats FOR EACH ROW EXECUTE FUNCTION prediction.touch_user_prediction_stats_updated_at();
CREATE TRIGGER trigger_auto_generate_slug BEFORE INSERT ON prediction.prediction_games FOR EACH ROW EXECUTE FUNCTION prediction.auto_generate_slug();
CREATE TRIGGER trigger_process_prediction_payment AFTER INSERT ON prediction.predictions FOR EACH ROW EXECUTE FUNCTION process_prediction_payment();
CREATE TRIGGER trigger_record_prediction_trend AFTER INSERT OR UPDATE ON prediction.predictions FOR EACH ROW EXECUTE FUNCTION record_prediction_trend();
CREATE TRIGGER update_prediction_games_updated_at BEFORE UPDATE ON prediction.prediction_games FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_predictions_updated_at BEFORE UPDATE ON prediction.predictions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER validate_sequential_reading_trigger BEFORE INSERT OR UPDATE ON study_cycle.sc_readings FOR EACH ROW EXECUTE FUNCTION study_cycle.validate_sequential_reading();
CREATE TRIGGER trg_prevent_profile_role_escalation BEFORE INSERT OR UPDATE ON "user".profiles FOR EACH ROW EXECUTE FUNCTION "user".prevent_profile_role_escalation();
CREATE TRIGGER trigger_update_profiles_updated_at BEFORE UPDATE ON "user".profiles FOR EACH ROW EXECUTE FUNCTION "user".update_profiles_updated_at();
CREATE TRIGGER update_behavioral_bias_profiles_updated_at BEFORE UPDATE ON "user".behavioral_bias_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER user_reputation_metrics_updated_at BEFORE UPDATE ON "user".user_reputation_metrics FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- -----------------------------------------------------------------------------
-- 11. Row Level Security (RLS) Activation & Policies
-- -----------------------------------------------------------------------------
ALTER TABLE "assessment"."assessments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "assessment"."questions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "assessment"."submissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "consume"."ad_campaigns" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "consume"."ad_views" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "consume"."consume_categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "consume"."consume_opportunities" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "consume"."consume_participations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "consume"."consume_performance_metrics" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "consume"."contributions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "consume"."daily_view_stats" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "consume"."funding_contributions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "consume"."funding_projects" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "consume"."local_stores" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "consume"."payments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "demographic_data"."data_sources" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "demographic_data"."prediction_stat_links" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "demographic_data"."statistics" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "donation"."direct_donation_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "donation"."direct_donation_progress" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "donation"."direct_donation_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "donation"."donation_activity_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "donation"."donation_certificates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "donation"."donation_institutes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "donation"."donation_recipients" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "donation"."donations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "donation"."funding_projects" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "donation"."funding_wishlist_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "donation"."opinion_leader_endorsements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "donation"."opinion_leader_followers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "donation"."opinion_leaders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "economy"."account_activity_stats" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "economy"."archived_orphan_account_activity_stats" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "economy"."archived_orphan_accounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "economy"."archived_orphan_transactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "economy"."individual_utility_parameters" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "economy"."money_wave1_ebit_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "economy"."money_wave2_redistribution_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "economy"."money_wave3_entrepreneur_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "economy"."money_wave3_ventures" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "economy"."money_wave_config" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "economy"."money_wave_daily_snapshots" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "economy"."money_wave_effectiveness" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "economy"."money_wave_history" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "economy"."money_wave_hourly_category_allocations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "economy"."money_wave_hourly_game_pools" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "economy"."pmp_pmc_accounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "economy"."pmp_pmc_transactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "economy"."prediction_category_multipliers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "economy"."social_welfare_parameters" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "economy"."system_statistics" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "economy"."transparency_reports" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "economy"."utility_estimation_inputs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "economy"."utility_predictions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "feed"."bills" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "feed"."items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "feed"."rss_sources" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "forum"."banned_ips" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "forum"."banned_words" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "forum"."forum_activity_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "forum"."forum_categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "forum"."forum_comments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "forum"."forum_post_tags" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "forum"."forum_posts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "forum"."forum_prediction_links" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "forum"."forum_regions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "forum"."forum_tags" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "forum"."forum_votes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "forum"."live_room_messages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "oauth_provider"."auth_codes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "oauth_provider"."clients" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "oauth_provider"."tokens" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "prediction"."game_snapshots" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "prediction"."prediction_games" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "prediction"."prediction_settlements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "prediction"."prediction_statistics" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "prediction"."prediction_trends" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "prediction"."predictions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "prediction"."scheduler_config" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "prediction"."settlement_history" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "prediction"."settlement_sources" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "prediction"."user_challenge_bets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "prediction"."user_challenge_comments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "prediction"."user_challenges" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "prediction"."user_prediction_stats" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."calendar_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."cloze_quizzes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."law_revisions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."live_study_sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."patrol_checklists" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."study_cheers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."study_schedules" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."wrong_answers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ranking"."ranking_history" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ranking"."user_scores" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "study_cycle"."sc_assessments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "study_cycle"."sc_chapters" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "study_cycle"."sc_questions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "study_cycle"."sc_reading_progress" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "study_cycle"."sc_readings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "study_cycle"."sc_study_sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "study_cycle"."sc_textbooks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "study_cycle"."sc_user_answers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "study_cycle"."sc_user_textbook_progress" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user"."behavioral_bias_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user"."healing_creation_resonances" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user"."healing_creations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user"."healing_room_bgm_tracks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user"."healing_room_guestbooks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user"."healing_rooms" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user"."healing_worldviews" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user"."opinion_leaders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user"."profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user"."user_cluster_assignments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user"."user_reputation_metrics" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user"."user_utility_clusters" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user"."users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "vertical_housing"."ai_scan_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "vertical_housing"."book_serials" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "vertical_housing"."exam_options" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "vertical_housing"."exam_questions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "vertical_housing"."legal_obligations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "vertical_housing"."option_clusters" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "vertical_housing"."option_mastery" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "vertical_housing"."study_cones" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "vertical_housing"."study_option_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "vertical_housing"."study_question_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "vertical_housing"."study_user_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "vertical_housing"."theory_sections" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can manage their own assessments" ON assessment.assessments AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = creator_id));
CREATE POLICY "Public can view published assessments" ON assessment.assessments AS PERMISSIVE FOR SELECT TO public USING ((status = 'published'::text));
CREATE POLICY "Creators can manage questions for their assessments" ON assessment.questions AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = ( SELECT assessments.creator_id
   FROM assessment.assessments
  WHERE (assessments.id = questions.assessment_id))));
CREATE POLICY "Users can view questions of published assessments" ON assessment.questions AS PERMISSIVE FOR SELECT TO public USING ((( SELECT assessments.status
   FROM assessment.assessments
  WHERE (assessments.id = questions.assessment_id)) = 'published'::text));
CREATE POLICY "Creators can view submissions for their assessments" ON assessment.submissions AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = ( SELECT assessments.creator_id
   FROM assessment.assessments
  WHERE (assessments.id = submissions.assessment_id))));
CREATE POLICY "Students can manage their own submissions" ON assessment.submissions AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = student_id));
CREATE POLICY "Anyone can view active campaigns" ON consume.ad_campaigns AS PERMISSIVE FOR SELECT TO public USING ((status = 'ACTIVE'::text));
CREATE POLICY "Users can insert own ad views" ON consume.ad_views AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update own ad views" ON consume.ad_views AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can view own ad views" ON consume.ad_views AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "카테고리 조회 정책" ON consume.consume_categories AS PERMISSIVE FOR SELECT TO public USING ((is_active = true));
CREATE POLICY "투자 기회 생성 정책" ON consume.consume_opportunities AS PERMISSIVE FOR INSERT TO public WITH CHECK ((( SELECT auth.uid() AS uid) = creator_id));
CREATE POLICY "투자 기회 수정 정책" ON consume.consume_opportunities AS PERMISSIVE FOR UPDATE TO public USING ((( SELECT auth.uid() AS uid) = creator_id));
CREATE POLICY "투자 기회 조회 정책" ON consume.consume_opportunities AS PERMISSIVE FOR SELECT TO public USING ((( SELECT auth.uid() AS uid) IS NOT NULL));
CREATE POLICY "투자 참여 생성 정책" ON consume.consume_participations AS PERMISSIVE FOR INSERT TO public WITH CHECK ((( SELECT auth.uid() AS uid) = investor_id));
CREATE POLICY "투자 참여 수정 정책" ON consume.consume_participations AS PERMISSIVE FOR UPDATE TO public USING ((( SELECT auth.uid() AS uid) = investor_id));
CREATE POLICY "투자 참여 조회 정책" ON consume.consume_participations AS PERMISSIVE FOR SELECT TO public USING ((( SELECT auth.uid() AS uid) = investor_id));
CREATE POLICY "성과 지표 생성 정책" ON consume.consume_performance_metrics AS PERMISSIVE FOR INSERT TO public WITH CHECK ((EXISTS ( SELECT 1
   FROM consume.consume_opportunities
  WHERE ((consume_opportunities.id = consume_performance_metrics.opportunity_id) AND (consume_opportunities.creator_id = ( SELECT auth.uid() AS uid))))));
CREATE POLICY "성과 지표 조회 정책" ON consume.consume_performance_metrics AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM consume.consume_opportunities
  WHERE ((consume_opportunities.id = consume_performance_metrics.opportunity_id) AND ((consume_opportunities.creator_id = ( SELECT auth.uid() AS uid)) OR (consume_opportunities.status = ANY (ARRAY['ACTIVE'::text, 'FUNDED'::text, 'IN_PROGRESS'::text, 'COMPLETED'::text])))))));
CREATE POLICY contributions_insert_auth ON consume.contributions AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
CREATE POLICY contributions_select_all ON consume.contributions AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Users can insert own daily stats" ON consume.daily_view_stats AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update own daily stats" ON consume.daily_view_stats AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can view own daily stats" ON consume.daily_view_stats AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can insert own contributions" ON consume.funding_contributions AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can view own contributions" ON consume.funding_contributions AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Anyone can view active projects" ON consume.funding_projects AS PERMISSIVE FOR SELECT TO public USING ((status = ANY (ARRAY['ACTIVE'::text, 'FUNDED'::text, 'COMPLETED'::text])));
CREATE POLICY "Creators can manage their projects" ON consume.funding_projects AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = creator_id));
CREATE POLICY "Anyone can view active stores" ON consume.local_stores AS PERMISSIVE FOR SELECT TO public USING ((is_active = true));
CREATE POLICY "Owners can manage their stores" ON consume.local_stores AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = owner_id));
CREATE POLICY "Users can insert own payments" ON consume.payments AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can view own payments" ON consume.payments AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Data sources are viewable by everyone" ON demographic_data.data_sources AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Prediction links are viewable by everyone" ON demographic_data.prediction_stat_links AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Statistics are viewable by everyone" ON demographic_data.statistics AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY direct_items_insert ON donation.direct_donation_items AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = donor_user_id));
CREATE POLICY direct_items_select ON donation.direct_donation_items AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY direct_items_update ON donation.direct_donation_items AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = donor_user_id));
CREATE POLICY progress_insert ON donation.direct_donation_progress AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
CREATE POLICY progress_select ON donation.direct_donation_progress AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY requests_insert ON donation.direct_donation_requests AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
CREATE POLICY requests_select ON donation.direct_donation_requests AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Users can view their donation activity logs" ON donation.donation_activity_logs AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM donation.donations d
  WHERE ((d.id = donation_activity_logs.donation_id) AND (d.donor_id = auth.uid())))));
CREATE POLICY "Users can view their own certificates" ON donation.donation_certificates AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = donor_id));
CREATE POLICY "Authenticated users can insert institutes" ON donation.donation_institutes AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Public can view active institutes" ON donation.donation_institutes AS PERMISSIVE FOR SELECT TO public USING ((is_active = true));
CREATE POLICY "Service role full access" ON donation.donation_institutes AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY recipients_insert ON donation.donation_recipients AS PERMISSIVE FOR INSERT TO public WITH CHECK (((auth.uid() = user_id) OR (user_id IS NULL)));
CREATE POLICY recipients_select ON donation.donation_recipients AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY recipients_update ON donation.donation_recipients AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Authenticated users can insert own donations" ON donation.donations AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = donor_id));
CREATE POLICY "Service role full access on donations" ON donation.donations AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Users can create donations" ON donation.donations AS PERMISSIVE FOR INSERT TO public WITH CHECK ((( SELECT auth.uid() AS uid) = donor_id));
CREATE POLICY "Users can update their own donations" ON donation.donations AS PERMISSIVE FOR UPDATE TO public USING ((( SELECT auth.uid() AS uid) = donor_id));
CREATE POLICY "Users can view own donations" ON donation.donations AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = donor_id));
CREATE POLICY "Users can view their own donations" ON donation.donations AS PERMISSIVE FOR SELECT TO public USING ((( SELECT auth.uid() AS uid) = donor_id));
CREATE POLICY "Enable read access for all users" ON donation.funding_projects AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert wishlist requests" ON donation.funding_wishlist_requests AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can update wishlist requests" ON donation.funding_wishlist_requests AS PERMISSIVE FOR UPDATE TO public USING (true);
CREATE POLICY "Anyone can view approved wishlist requests" ON donation.funding_wishlist_requests AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY endorsements_manage_leader ON donation.opinion_leader_endorsements AS PERMISSIVE FOR ALL TO public USING ((EXISTS ( SELECT 1
   FROM donation.opinion_leaders
  WHERE ((opinion_leaders.id = opinion_leader_endorsements.opinion_leader_id) AND (opinion_leaders.user_id = auth.uid())))));
CREATE POLICY endorsements_read_all ON donation.opinion_leader_endorsements AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY followers_manage_own ON donation.opinion_leader_followers AS PERMISSIVE FOR ALL TO public USING ((follower_user_id = auth.uid()));
CREATE POLICY followers_read_all ON donation.opinion_leader_followers AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY opinion_leaders_insert_own ON donation.opinion_leaders AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY opinion_leaders_read_all ON donation.opinion_leaders AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY opinion_leaders_update_own ON donation.opinion_leaders AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can update own activity stats" ON economy.account_activity_stats AS PERMISSIVE FOR UPDATE TO public USING ((( SELECT auth.uid() AS uid) = user_id));
CREATE POLICY "Users can view own activity stats" ON economy.account_activity_stats AS PERMISSIVE FOR SELECT TO public USING ((( SELECT auth.uid() AS uid) = user_id));
CREATE POLICY "Users can view own utility parameters" ON economy.individual_utility_parameters AS PERMISSIVE FOR ALL TO public USING ((( SELECT auth.uid() AS uid) = user_id)) WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));
CREATE POLICY "Authenticated users can view EBIT records" ON economy.money_wave1_ebit_records AS PERMISSIVE FOR SELECT TO public USING ((( SELECT auth.uid() AS uid) IS NOT NULL));
CREATE POLICY "Users can view related redistribution records" ON economy.money_wave2_redistribution_records AS PERMISSIVE FOR SELECT TO public USING (((( SELECT auth.uid() AS uid) = source_user_id) OR (( SELECT auth.uid() AS uid) = target_user_id)));
CREATE POLICY "Entrepreneurs can view own records" ON economy.money_wave3_entrepreneur_records AS PERMISSIVE FOR SELECT TO public USING ((( SELECT auth.uid() AS uid) = entrepreneur_id));
CREATE POLICY money_wave3_ventures_select_public ON economy.money_wave3_ventures AS PERMISSIVE FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY money_wave_config_select_public ON economy.money_wave_config AS PERMISSIVE FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public can view money wave daily snapshots" ON economy.money_wave_daily_snapshots AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated users can view effectiveness analysis" ON economy.money_wave_effectiveness AS PERMISSIVE FOR SELECT TO public USING ((( SELECT auth.uid() AS uid) IS NOT NULL));
CREATE POLICY "Authenticated users can view money wave history" ON economy.money_wave_history AS PERMISSIVE FOR SELECT TO public USING ((( SELECT auth.uid() AS uid) IS NOT NULL));
CREATE POLICY "Public can read allocations" ON economy.money_wave_hourly_category_allocations AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY read_money_wave_hourly_category_allocations ON economy.money_wave_hourly_category_allocations AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Public can read game pools" ON economy.money_wave_hourly_game_pools AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY money_wave_hourly_game_pools_select_all ON economy.money_wave_hourly_game_pools AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Users can view own account data" ON economy.pmp_pmc_accounts AS PERMISSIVE FOR SELECT TO public USING ((( SELECT auth.uid() AS uid) = user_id));
CREATE POLICY "Users can view own transactions" ON economy.pmp_pmc_transactions AS PERMISSIVE FOR SELECT TO public USING ((( SELECT auth.uid() AS uid) = user_id));
CREATE POLICY read_prediction_category_multipliers ON economy.prediction_category_multipliers AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated users can view social welfare parameters" ON economy.social_welfare_parameters AS PERMISSIVE FOR SELECT TO public USING ((auth.role() = 'authenticated'::text));
CREATE POLICY "Authenticated users can view system stats" ON economy.system_statistics AS PERMISSIVE FOR SELECT TO public USING ((auth.role() = 'authenticated'::text));
CREATE POLICY "Public can view transparency reports" ON economy.transparency_reports AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Users can insert own utility inputs" ON economy.utility_estimation_inputs AS PERMISSIVE FOR INSERT TO public WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));
CREATE POLICY "Users can view own utility inputs" ON economy.utility_estimation_inputs AS PERMISSIVE FOR SELECT TO public USING ((( SELECT auth.uid() AS uid) = user_id));
CREATE POLICY "System can insert utility predictions" ON economy.utility_predictions AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Users can view own predictions" ON economy.utility_predictions AS PERMISSIVE FOR SELECT TO public USING ((( SELECT auth.uid() AS uid) = user_id));
CREATE POLICY "Allow read access for authenticated users" ON feed.bills AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access for authenticated users" ON feed.items AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access for authenticated users" ON feed.rss_sources AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY banned_ips_service_role_only ON forum.banned_ips AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read banned_words" ON forum.banned_words AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Allow service role all banned_words" ON forum.banned_words AS PERMISSIVE FOR ALL TO service_role USING (true);
CREATE POLICY "Users can view their own activity logs" ON forum.forum_activity_logs AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Public can view active categories" ON forum.forum_categories AS PERMISSIVE FOR SELECT TO public USING ((is_active = true));
CREATE POLICY "Authors can update their comments" ON forum.forum_comments AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = author_id));
CREATE POLICY "Public can view published comments" ON forum.forum_comments AS PERMISSIVE FOR SELECT TO public USING ((status = 'published'::text));
CREATE POLICY "Users can create comments" ON forum.forum_comments AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = author_id));
CREATE POLICY "Public can view post tags" ON forum.forum_post_tags AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Authors can update their posts" ON forum.forum_posts AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = author_id));
CREATE POLICY "Public can view published posts" ON forum.forum_posts AS PERMISSIVE FOR SELECT TO public USING ((status = 'published'::text));
CREATE POLICY "Users can create posts" ON forum.forum_posts AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = author_id));
CREATE POLICY forum_prediction_links_select_public ON forum.forum_prediction_links AS PERMISSIVE FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY forum_regions_select_public ON forum.forum_regions AS PERMISSIVE FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public can view active tags" ON forum.forum_tags AS PERMISSIVE FOR SELECT TO public USING ((is_active = true));
CREATE POLICY "Users can create votes" ON forum.forum_votes AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update their votes" ON forum.forum_votes AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own votes" ON forum.forum_votes AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY live_room_messages_select_public ON forum.live_room_messages AS PERMISSIVE FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY game_snapshots_insert_service ON prediction.game_snapshots AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
CREATE POLICY game_snapshots_select_all ON prediction.game_snapshots AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Users can create games" ON prediction.prediction_games AS PERMISSIVE FOR INSERT TO public WITH CHECK ((( SELECT auth.uid() AS uid) = creator_id));
CREATE POLICY "Users can view all games" ON prediction.prediction_games AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY prediction_games_delete_policy ON prediction.prediction_games AS PERMISSIVE FOR DELETE TO authenticated USING ((( SELECT auth.uid() AS uid) = creator_id));
CREATE POLICY prediction_games_update_policy ON prediction.prediction_games AS PERMISSIVE FOR UPDATE TO authenticated USING ((( SELECT auth.uid() AS uid) = creator_id)) WITH CHECK ((( SELECT auth.uid() AS uid) = creator_id));
CREATE POLICY prediction_settlements_select_policy ON prediction.prediction_settlements AS PERMISSIVE FOR SELECT TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id));
CREATE POLICY prediction_statistics_select_policy ON prediction.prediction_statistics AS PERMISSIVE FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY prediction_trends_select_policy ON prediction.prediction_trends AS PERMISSIVE FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public can read prediction stats" ON prediction.predictions AS PERMISSIVE FOR SELECT TO public USING ((is_active = true));
CREATE POLICY "Users can create predictions" ON prediction.predictions AS PERMISSIVE FOR INSERT TO public WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));
CREATE POLICY "Users can view own predictions" ON prediction.predictions AS PERMISSIVE FOR SELECT TO public USING ((( SELECT auth.uid() AS uid) = user_id));
CREATE POLICY "Public can read settlement history" ON prediction.settlement_history AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Public can read settlement sources" ON prediction.settlement_sources AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY user_challenge_bets_select_public ON prediction.user_challenge_bets AS PERMISSIVE FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY user_challenge_comments_insert_own ON prediction.user_challenge_comments AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY user_challenge_comments_select_public ON prediction.user_challenge_comments AS PERMISSIVE FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY user_challenges_insert_own ON prediction.user_challenges AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = host_id));
CREATE POLICY user_challenges_select_public ON prediction.user_challenges AS PERMISSIVE FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read prediction user stats" ON prediction.user_prediction_stats AS PERMISSIVE FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public read cloze_quizzes" ON public.cloze_quizzes AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Allow public read law_revisions" ON public.law_revisions AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY ranking_history_select_all ON ranking.ranking_history AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY user_scores_select_all ON ranking.user_scores AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Users can manage their own study data" ON study_cycle.sc_assessments AS PERMISSIVE FOR ALL TO public USING ((( SELECT auth.uid() AS uid) = user_id));
CREATE POLICY "Allow public read access" ON study_cycle.sc_chapters AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Allow public read access" ON study_cycle.sc_questions AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Users can manage their reading progress" ON study_cycle.sc_reading_progress AS PERMISSIVE FOR ALL TO public USING ((EXISTS ( SELECT 1
   FROM study_cycle.sc_readings sr
  WHERE ((sr.id = sc_reading_progress.reading_id) AND (sr.user_id = auth.uid())))));
CREATE POLICY "Users can create their own readings" ON study_cycle.sc_readings AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update their own readings" ON study_cycle.sc_readings AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own readings" ON study_cycle.sc_readings AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can manage their own study data" ON study_cycle.sc_study_sessions AS PERMISSIVE FOR ALL TO public USING ((( SELECT auth.uid() AS uid) = user_id));
CREATE POLICY "Allow public read access" ON study_cycle.sc_textbooks AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Users can manage their own study data" ON study_cycle.sc_user_answers AS PERMISSIVE FOR ALL TO public USING ((( SELECT auth.uid() AS uid) = user_id));
CREATE POLICY "Users can manage their own study data" ON study_cycle.sc_user_textbook_progress AS PERMISSIVE FOR ALL TO public USING ((( SELECT auth.uid() AS uid) = user_id));
CREATE POLICY "Users can view own bias profiles" ON "user".behavioral_bias_profiles AS PERMISSIVE FOR ALL TO public USING ((( SELECT auth.uid() AS uid) = user_id)) WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));
CREATE POLICY healing_creation_resonances_public_read ON "user".healing_creation_resonances AS PERMISSIVE FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY healing_creations_public_read ON "user".healing_creations AS PERMISSIVE FOR SELECT TO public USING ((is_published = true));
CREATE POLICY "Anyone can view active healing room bgm tracks" ON "user".healing_room_bgm_tracks AS PERMISSIVE FOR SELECT TO public USING ((is_active = true));
CREATE POLICY healing_room_guestbooks_public_read ON "user".healing_room_guestbooks AS PERMISSIVE FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY healing_rooms_public_read ON "user".healing_rooms AS PERMISSIVE FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY healing_worldviews_public_read ON "user".healing_worldviews AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Public can view active opinion leaders" ON "user".opinion_leaders AS PERMISSIVE FOR SELECT TO public USING ((is_active = true));
CREATE POLICY "Public profiles are viewable" ON "user".profiles AS PERMISSIVE FOR SELECT TO public USING ((((privacy_settings ->> 'profile_public'::text))::boolean = true));
CREATE POLICY "Users can update own profile" ON "user".profiles AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = id));
CREATE POLICY "Users can view own profile" ON "user".profiles AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = id));
CREATE POLICY "Users can view own cluster assignments" ON "user".user_cluster_assignments AS PERMISSIVE FOR SELECT TO public USING ((( SELECT auth.uid() AS uid) = user_id));
CREATE POLICY "All authenticated users can view reputation metrics" ON "user".user_reputation_metrics AS PERMISSIVE FOR SELECT TO public USING ((auth.role() = 'authenticated'::text));
CREATE POLICY "Only system can update reputation metrics" ON "user".user_reputation_metrics AS PERMISSIVE FOR UPDATE TO public USING (false);
CREATE POLICY "Users can insert their initial reputation metrics" ON "user".user_reputation_metrics AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Authenticated users can view user clusters" ON "user".user_utility_clusters AS PERMISSIVE FOR SELECT TO public USING ((auth.role() = 'authenticated'::text));
CREATE POLICY "Users can update their own data" ON "user".users AS PERMISSIVE FOR UPDATE TO public USING ((( SELECT auth.uid() AS uid) = id)) WITH CHECK ((( SELECT auth.uid() AS uid) = id));
CREATE POLICY "Users can view their own data" ON "user".users AS PERMISSIVE FOR SELECT TO public USING ((( SELECT auth.uid() AS uid) = id));
CREATE POLICY "Users cannot delete their own accounts" ON "user".users AS PERMISSIVE FOR DELETE TO public USING (false);
CREATE POLICY ai_scan_logs_owner_read ON vertical_housing.ai_scan_logs AS PERMISSIVE FOR SELECT TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id));
CREATE POLICY book_serials_owner_read ON vertical_housing.book_serials AS PERMISSIVE FOR SELECT TO authenticated USING ((( SELECT auth.uid() AS uid) = registered_user_id));
CREATE POLICY exam_options_read ON vertical_housing.exam_options AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY exam_questions_read ON vertical_housing.exam_questions AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY legal_obligations_read ON vertical_housing.legal_obligations AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Public read option_clusters" ON vertical_housing.option_clusters AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY option_mastery_user_all ON vertical_housing.option_mastery AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY study_cones_owner_read ON vertical_housing.study_cones AS PERMISSIVE FOR SELECT TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id));
CREATE POLICY study_option_logs_owner_read ON vertical_housing.study_option_logs AS PERMISSIVE FOR SELECT TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id));
CREATE POLICY study_question_logs_owner_read ON vertical_housing.study_question_logs AS PERMISSIVE FOR SELECT TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id));
CREATE POLICY study_user_profiles_owner_all ON vertical_housing.study_user_profiles AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY theory_sections_public_read ON vertical_housing.theory_sections AS PERMISSIVE FOR SELECT TO anon, authenticated USING (true);
