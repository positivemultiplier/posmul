# Posmul 데이터베이스 DDD 구조 (Schema-per-Bounded-Context)

이 문서는 Posmul 프로젝트의 데이터베이스 스키마 구조를 설명합니다. 본 프로젝트는 애플리케이션 코드뿐만 아니라 데이터베이스 계층에서도 **도메인 주도 설계(DDD)** 원칙을 적용하여, 각 도메인(Bounded Context)별로 독립된 스키마를 사용합니다.

## 🏗️ 아키텍처 원칙: Schema-per-Bounded-Context

모든 테이블은 관련된 도메인 스키마 내에 격리되어 있으며, 도메인 간의 참조는 외래 키(Foreign Key)를 통해 명시적으로 관리됩니다.

```mermaid
erDiagram
    User ||--o{ Economy : "has wallet"
    User ||--o{ Prediction : "participates"
    User ||--o{ Investment : "invests"
    User ||--o{ Donation : "donates"
    User ||--o{ Forum : "posts/comments"

    %% Core Domains
    namespace Auth {
        users
    }
    namespace Economy {
        pmp_pmc_accounts
        individual_utility_parameters
        utility_predictions
    }
    namespace Prediction {
        prediction_games
        predictions
        prediction_settlements
    }
    namespace Investment {
        investment_opportunities
        investment_performance_metrics
    }
    namespace Donation {
        donations
        donation_certificates
    }
    namespace Forum {
        forum_posts
        forum_comments
    }
```

---

## 📂 스키마별 상세 구조

### 1. 💰 Economy (경제 도메인)
**핵심 역할**: PMP(위험프리 자산) 및 PMC(위험자산) 관리, 개인 효용 함수 모델링.

| 테이블명 | 설명 | 주요 컬럼 |
| :--- | :--- | :--- |
| `pmp_pmc_accounts` | 사용자 자산 지갑 (PMP/PMC 잔액) | `user_id`, `pmp_balance`, `pmc_balance` |
| `individual_utility_parameters` | 개인별 효용 함수 파라미터 (경제학 모델) | `alpha`, `beta`, `gamma` (위험/기부 성향) |
| `utility_predictions` | 효용 함수 기반 행동 예측 결과 | `predicted_utility`, `confidence_interval` |
| `account_activity_stats` | 활동 통계 (성능 최적화용 비정규화) | `total_pmp_earned`, `transaction_count` |

### 2. 🎯 Prediction (예측 도메인)
**핵심 역할**: 예측 게임 생성, 참여, 정산 및 배당금 분배.

| 테이블명 | 설명 | 주요 컬럼 |
| :--- | :--- | :--- |
| `prediction_games` | 예측 게임 정보 | `title`, `resolution_date`, `status` |
| `predictions` | 사용자 예측 참여 (베팅) | `bet_amount` (PMP), `expected_reward` (PMC) |
| `prediction_settlements` | 게임 결과 정산 내역 | `winning_option`, `payout_ratio` |

### 3. 📈 Investment (투자 도메인)
**핵심 역할**: 지역 경제 및 스타트업 투자 기회 제공, 성과 측정.

| 테이블명 | 설명 | 주요 컬럼 |
| :--- | :--- | :--- |
| `investment_opportunities` | 투자 모집 공고 | `target_amount`, `min_investment` |
| `investment_performance_metrics` | 투자 대상의 재무/사회적 성과 | `roi`, `social_impact_score`, `job_creation` |
| `investment_categories` | 투자 카테고리 및 위험도 설정 | `risk_multiplier`, `pmc_reward_multiplier` |

### 4. 💝 Donation (기부 도메인)
**핵심 역할**: PMC를 활용한 기부 집행 및 증명서 발급.

| 테이블명 | 설명 | 주요 컬럼 |
| :--- | :--- | :--- |
| `donations` | 기부 트랜잭션 | `amount` (PMC), `beneficiary_id` |
| `donation_certificates` | 기부 증명서 (세제 혜택 등) | `certificate_number`, `tax_deductible_amount` |
| `donation_activity_logs` | 기부 활동 이력 | `activity_type`, `metadata` |

### 5. 💬 Forum (포럼 도메인)
**핵심 역할**: 공론장 형성, 토론 참여 보상(PMP).

| 테이블명 | 설명 | 주요 컬럼 |
| :--- | :--- | :--- |
| `forum_posts` | 게시글 (토론/제안) | `category_id`, `upvotes`, `pmp_reward_pool` |
| `forum_comments` | 댓글 및 토론 | `is_solution`, `quality_score` |
| `forum_votes` | 투표 활동 | `vote_type` (up/down) |

### 6. 👤 User (사용자 도메인)
**핵심 역할**: 사용자 프로필 확장, 평판 및 그룹 관리.
*(기본 인증은 `auth.users` 사용)*

| 테이블명 | 설명 | 주요 컬럼 |
| :--- | :--- | :--- |
| `users` | 확장 프로필 정보 | `avatar_url`, `is_active` |
| `user_utility_clusters` | 성향이 유사한 사용자 그룹 (군집화) | `cluster_centroid`, `description` |
| `opinion_leaders` | 오피니언 리더 인증 및 영향력 | `influence_score`, `follower_count` |

---

## 🔐 보안 및 접근 제어 (RLS)
모든 테이블은 Supabase의 **Row Level Security (RLS)**가 활성화(`rls_enabled: true`)되어 있어, 데이터 접근 권한이 엄격하게 제어됩니다.

- **읽기 권한**: 본인 데이터 또는 공개 데이터(`is_public`)만 조회 가능.
- **쓰기 권한**: 서비스 로직(Edge Functions 또는 Backend API)을 통해서만 수정 가능하도록 제한.
