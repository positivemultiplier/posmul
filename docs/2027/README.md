# PosMul 2027 Edition 문서 아카이브 & 진화 인덱스

> **기준일**: 2026-11-17 (2027년 실행 버전 개편)  
> **원본 비교 대상**: [archive/2026-11-pre-v3/init/](file:///c:/G/posmul/docs/archive/2026-11-pre-v3/init) (2025-11 초기 기획 문서 7종)  
> **현재 정본 기준**: [POSMUL_WHITEPAPER.md](file:///c:/G/posmul/docs/POSMUL_WHITEPAPER.md) (v3.0), [DOMAIN_FLOW_AND_DECISIONS.md](file:///c:/G/posmul/docs/DOMAIN_FLOW_AND_DECISIONS.md) 및 `apps/posmul-web` · `apps/housing-pro` · `packages/auth-economy-sdk` · `supabase/migrations` 실구현 코드

---

## 1. 문서 매핑 (2025 `init` → 2027 버전)

| 2025 초기 문서 (`init/`) | 2027년 버전 새 문서 (`2027/`) | 핵심 진화 요약 |
| :--- | :--- | :--- |
| [economic_system_architecture.md](file:///c:/G/posmul/docs/archive/2026-11-pre-v3/init/economic_system_architecture.md) | **[economic_system_architecture_2027.md](file:///c:/G/posmul/docs/2027/economic_system_architecture_2027.md)** | `MoneyConsume`/`Other`의 PMC 직접 획득 폐기, **입구 단일화(오직 PMP)**, **`Prediction` 유일 PMC 생성**, **`EBIT` → `EAT(세후 순이익)`** 기반 `MoneyWave`, 버티컬(`Housing-Pro`) & P2P `Challenge` 순환 추가 |
| [project_diagram.md](file:///c:/G/posmul/docs/archive/2026-11-pre-v3/init/project_diagram.md) | **[project_diagram_2027.md](file:///c:/G/posmul/docs/2027/project_diagram_2027.md)** | `posmul-web` + `housing-pro` 멀티 앱 모노레포 및 `packages/auth-economy-sdk` SSO 아키텍처, `Live`/`Challenge`/`Healing Room`/`PosMul Friends` 및 DDD 9+ Bounded Context 반영 |
| [project_economy.md](file:///c:/G/posmul/docs/archive/2026-11-pre-v3/init/project_economy.md) | **[project_economy_2027.md](file:///c:/G/posmul/docs/2027/project_economy_2027.md)** | Python 가상 프로토타입 → TypeScript/Supabase RPC 실구현 정합화, **1단계 사실판단(Prediction) + 2단계 가치배분(Condorcet/Borda)** 이중 훈련 모델, `Social(IFRS S1)` & `Tied Aid` 승수 경제학 확장 |
| [project_features.md](file:///c:/G/posmul/docs/archive/2026-11-pre-v3/init/project_features.md) | **[project_features_2027.md](file:///c:/G/posmul/docs/2027/project_features_2027.md)** | 빈칸이던 `Gift Aid`/`PosMul Business`/`Other` 완성, AI 뉴스룸(`feed` 트랙 B RSS)·`Live`·`Challenge`·`Healing Room`·`Housing-Pro` 69단원 수험/소장Pro 실구현 및 2027 Phase 2·3 스펙 통합 |
| [project_vision_and_value.md](file:///c:/G/posmul/docs/archive/2026-11-pre-v3/init/project_vision_and_value.md) | **[project_vision_and_value_2027.md](file:///c:/G/posmul/docs/2027/project_vision_and_value_2027.md)** | 3대 현실 문제(도박화 탈피·기부 불신 극복·**`Social(IFRS S1)` 측정 지표**) 정립, Value Chain 재구축, 2026 기반 완성 → 2027 실증·B2B 확산 타임라인 재편 |
| [why_PMP_Rf.md](file:///c:/G/posmul/docs/archive/2026-11-pre-v3/init/why_PMP_Rf.md) | **[why_PMP_Rf_2027.md](file:///c:/G/posmul/docs/2027/why_PMP_Rf_2027.md)** | 일일 상한(Cap) 및 **승자독식 소멸** 규칙과 CAPM 무위험자산($R_f$) 가정의 정합성 재정립, `EAT` 기반 순수 `MoneyWave` 풀(무경쟁 가드·20,000 PMC 상한)에 따른 $\beta$ 추정 실무 개정 |
| [Direct Democracy.pdf](file:///c:/G/posmul/docs/archive/2026-11-pre-v3/init/Direct%20Democracy.pdf) | **[direct_democracy_posmul_synthesis_2027.md](file:///c:/G/posmul/docs/2027/direct_democracy_posmul_synthesis_2027.md)** | Rattanasevee et al.(2024) 논문의 디지털 직접민주주의 5대 한계 및 **유동적 민주주의(Liquid Democracy)** 제안을 PosMul 2027 아키텍처(`팔로잉 기부`·`콩도르세/보르다 투표`·`균형 브리핑`)와 대조·통합 |

---

## 2. 한눈에 보는 3세대 진화 비교 (2025 `init` vs 2026 현재 vs 2027 목표)

| 비교 항목 | 2025 초기 (`init/`) | 2026 현재 (`posmul` 실코드 + v3.0) | 2027 버전 (`2027/` 목표 아키텍처) |
| :--- | :--- | :--- | :--- |
| **통화 유입 규칙** | 시간 → `PMP`<br>돈(`MoneyConsume`/`CloudConsume`/`Other`) → **`PMC` 직접 지급** | **입구 단일화**: `Forum`, `Consume(Major)`, `Vertical(Housing-Pro)` 모두 **오직 `PMP`만 지급** (`WELCOME_BONUS_PMC = 0`, `Minor`/`Cloud` `403 PHASE_3_LOCKED`) | 유입 단일화 원칙 영구 유지 + **외부 버티컬 앱(다중 자격/실무) SDK 자동 상한 연동** |
| **`PMC` 생성처** | `Expect` 성공 + `MoneyConsume` + `CloudConsume` + `Other` | **오직 `Prediction` 예측 성공 시에만 유일하게 획득** (무경쟁 가드: 최소 2인 & 양측 풀 존재 시에만 발행) | **유일 생성 원칙 고수** + 실광고 `EAT` 및 버티컬 `EAT` 자동 연동 파이프라인 가동 |
| **`MoneyWave` 재원** | **`EBIT`** 기반 일일/시간별 발행 | **`EAT`(세후 순이익)** 기반 (`POSMUL_ANNUAL_EAT_POOL`, `money_wave_daily_snapshots`), `모두의창업` 마중물 + 광고/교재 마진 | **실시간 `EAT` 자동 정산 원장** + `MoneyWave2`(휴면 PMC 자동 회수·재분배) + `MoneyWave3`(기업 ESG 풀) |
| **도메인 범위** | 6대 카테고리 개념 설계 (`Consume`, `Expect`, `Donate`, `Forum`, `Other`, `Ranking`) | 6대 카테고리 실구현 + **`Live`(실시간 응원톡)** + **`Challenge`(P2P 맞짱)** + **`Healing Room` & `Friends 7인`** + **`Housing-Pro`(버티컬)** | 2단계 훈련(`팔로잉 기부`, `미래꿈기부` 콩도르세/보르다) 오픈 + **기업 B2B `Social(IFRS S1)` 리포트 상품화** + Phase 3 준비 |
| **기부 & 신뢰 인프라** | 직접/기관/오피니언 리더 나열, 향후 블록체인 언급 | `K-물품 직접기부`(위시리스트) + `기관기부`(에스크로) + 실제 `pmc_balance` 차감 완료 (`팔로잉` 잠금) | Phase 2(`팔로잉`·`미래꿈` 투표) 가동, 복지시설 증빙 Storage 및 **삼식부기(Triple-Entry) · 블록체인 앵커링** 착수 |
| **기술 아키텍처** | Python 이론 코드 예시 수준 | **Turborepo + Next.js 15 + React 19 + Supabase(Schema-per-Bounded-Context) + `auth-economy-sdk`** 프로덕션 가동 | 멀티 버티컬 모노레포 확장, `game.posmul.com`(매몰비용 환급형) 등 신규 `EAT` 엔진 준비, 계량경제 실증 대시보드 |
