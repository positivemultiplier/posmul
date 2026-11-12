# PosMul 도메인 연결 Flow & 의사결정 보드

> **상위 정본 문서**: [POSMUL_WHITEPAPER.md](file:///c:/G/posmul/docs/POSMUL_WHITEPAPER.md) (v3.0)
> **목적**: 각 도메인이 무엇을 받고 무엇을 내보내는지, 무엇이 확정되었고 무엇이 아직 미확정/숙제인지 한눈에 관리하는 작업 보드 (2026-11-12 기준)

---

## 1. 도메인 연결 매트릭스 (무엇이 들어오고 나가는가?)

| 단계 / 도메인 | 역할 | 들어오는 것 (Input) | 나가는 것 (Output) | 오픈 시점 |
| :--- | :--- | :--- | :--- | :--- |
| **Forum (광장)** | 트래픽 · 체류시간 확보 & `PMP` 공급원 | 유저의 글 작성 · 댓글 · 추천/공감 · 체류 | ① 유저에게 **`PMP`만 지급** (일일 한도)<br>② 트래픽 기반 `CPC/CPV` 광고 지면 | **Phase 1 (초기)** |
| **Consume (광고 2트랙)** | 현금 재원(`EAT`) + B2B `Social` 지표 | ① 일반 네트워크 광고(`CPC/CPV/CPA`)<br>② **기업 직접 광고 의뢰** | ① 유저에게 **`PMP`만 지급**<br>② `EAT` 현금 재원<br>③ (직접 의뢰 시) **`Social(IFRS S1)` 지표** | 트랙 A: **Phase 1**<br>트랙 B: **Phase 2** |
| **Consume (소상공인)** | 지역 소비-지역 기부 연계 (`Local League`) | - | - | **Phase 3 (`[추후 확장]`)** |
| **MoneyWave (분배 엔진)** | 적자 방지용 상금 풀 총량 제어 | `모두의창업 상금`(초기 시드) + 광고 수익의 **세후 순이익(`EAT`)** | `Prediction` 예측 성공 보상용 `PMC` 재원 한도 배분 | **Phase 1 (초기)** |
| **Prediction (심장 · 1단계 훈련)** | **정답 있는 사실/확률 판단** 훈련 + 커뮤니티 | 유저 `PMP` + 균형 잡힌 양쪽 뉴스/근거 + `MoneyWave` 풀 | ① 실패 시: **`PMP` 소멸 (승자독식)**<br>② 성공 시: **유일하게 `PMC` 획득** | **Phase 1 (초기)** |
| **Donation (결실 · 2단계 훈련)** | 즐거운 기부 + **정답 없는 가치 배분** 훈련 | 유저 `PMC` + 수혜기관 물품 요청 | ① **기관기부 · K-물품기부** (직접 선택)<br>② **팔로잉 기부** (매니저 위임)<br>③ **미래꿈기부** (**콩도르세·보르다 투표**)<br>④ 전달/수혜자 인증 기록 | ① **Phase 1 (초기)**<br>②③ **Phase 2 (`[추후 확장]`)** |

---

## 2. 결정 현황 보드 (`[확정]` vs `[추후 확장]` vs `[미해결/조율 필요]`)

### ✅ `[확정 코어]` — 지금 설계의 흔들리지 않는 규칙
1. **입구 단일화**: `Forum`, `Consume` 등 모든 활동에서는 **오직 `PMP`만 획득**한다. (활동 시 `PMC` 직접 지급 전면 제거)
2. **`PMC` 단일 생성 원칙**: `PMC`는 **오직 `Prediction` 예측 성공 보상으로만 유일하게 획득**한다.
3. **승자독식 순환**: `Prediction`에서 예측에 실패하면 참여 **`PMP`는 소멸**되며, 유저는 다시 포럼/광고 활동으로 `PMP`를 확보한다.
4. **`EAT` 원칙**: `EBIT`가 아니라 비용·세금을 제한 **세후 순이익(`EAT`)** 기준으로 `MoneyWave`를 가동한다. 초기 마중물은 **`모두의창업 상금`** + **`CPC/CPV/CPA` 광고 수익**이다.
5. **광고 2트랙**: 일반 네트워크 광고는 순수 현금 연료(`EAT`)용이고, **기업 직접 광고 의뢰만 `Social(IFRS S1)` 측정 지표를 생성**한다.
6. **단계적 기부 오픈**: 초기에는 **`기관기부`**와 **`K-물품기부`**만 먼저 연다.
7. **포럼 일일 상한**: 포럼 활동으로 획득하는 `PMP`에는 **하루 한도(일일 Cap)**를 둔다.

### 🗓️ `[추후 확장]` — 방향은 잡혔으나 시스템 완비 후 여는 기능
1. **`오피니언 리더 팔로잉 기부`**: 귀찮아하는 유저가 신뢰하는 매니저에게 기부를 위임하는 기능 (Phase 2).
2. **`미래꿈기부` + 콩도르세·보르다 투표**: 정답이 없는 개인들의 꿈에 공익 재원을 배분할 때만 투표제를 적용하는 가치 판단 훈련 (Phase 2).
3. **`블록체인` & `삼식부기(Triple Entity Accounting)`**: 내부 자금·물품 전달 기록의 위변조 방지 인프라 (Phase 3).
4. **`소상공인(Local League)`**: 지역 소비와 지역 기부를 엮는 로컬 생태계 (Phase 3).

### ❓ `[미해결 / 오픈 이슈 & 세부 조율]` — 결정·연구가 남은 숙제
| 번호 | 이슈 | 현재 상태 및 기획 메모 |
| :---: | :--- | :--- |
| **1** | **외부 중복 수령 방지 (어금니 아빠 리스크)** | 플랫폼 내부는 물품요청·전달인증·추후 삼식부기로 추적 가능하나, **수혜자/기관이 외부 타 기관에서 중복 수령하는 문제**는 아직 완전한 해답이 없음. |
| **2** | **`Forum` 보상 포인트 수치 조율** | `forum-pmp-policy.ts` 기본 기준 반영(`일일 총 상한 1,000 PMP` / 글 작성 `20~50`, 댓글 `10`, **추천 수령 `+20`, 개념글(3+) `+100`** + 자추·중복 차단). 운영 데이터 보며 수치 미세 조율 예정 |
| **3** | **초기 `모두의창업 상금` 운용 기준** | 광고 수익이 0에 가까운 오픈 극초기, 상금 중 얼마를 월별/회차별 `MoneyWave` 마중물로 풀지 기준 필요. |
| **4** | **기업 직접 광고 `Social(IFRS S1)` 리포트 표준** | 기업에 발급할 정량 지표 항목(예: 참여 인원, 의사결정 훈련 시간, 연결된 기부 물품 수량 등) 구체화 필요. |

---

## 3. 소스코드 vs v3.0 문서 정합성 대조 결과 (2026-11-12 실코드 점검)

실제 소스코드(`apps/posmul-web/src`, `supabase`)를 v3.0 정본 원칙과 대조한 결과입니다.

### 3-1. 도메인별 일치 현황

| 영역 | v3.0 문서 원칙 | 현재 소스코드 상태 | 판정 |
| :--- | :--- | :--- | :---: |
| **`Prediction`** | 승자독식(`PMP` 소멸), 성공 시 유일하게 `PMC` 보상, 유저 게임 생성, 양쪽 균형 근거 | 참여 시 트리거(`process_prediction_payment`)로 `PMP` 차감([participate-prediction.use-case.ts](file:///c:/G/posmul/apps/posmul-web/src/bounded-contexts/prediction/application/use-cases/participate-prediction.use-case.ts#L195-L198)), 정산 시 승자만 보상([20261111_fix_security_advisor_and_settlement_rpc.sql](file:///c:/G/posmul/supabase/migrations/20261111_fix_security_advisor_and_settlement_rpc.sql#L46-L60)), 유저 제안 API([user-proposed/route.ts](file:///c:/G/posmul/apps/posmul-web/src/app/api/prediction/user-proposed/route.ts#L85-L115)), 양쪽 브리핑([client.tsx](file:///c:/G/posmul/apps/posmul-web/src/app/prediction/%5Bslug%5D/client.tsx#L1463)) 구현됨 | **✅ 높음** |
| **`Forum`** | `PMP`만 지급, 일일 한도(Cap), 글·추천 포인트 수치 조율 필요 | `DAILY_MAX_PMP = 1350` 및 글/댓글별 일일 한도·고정 보상 존재([activity/route.ts](file:///c:/G/posmul/apps/posmul-web/src/app/api/forum/activity/route.ts#L9-L17), [posts/route.ts](file:///c:/G/posmul/apps/posmul-web/src/app/api/forum/posts/route.ts#L17-L31)). 단 **추천/공감 시 `PMP` 보상 로직은 아직 없음**([vote/route.ts](file:///c:/G/posmul/apps/posmul-web/src/app/api/forum/vote/route.ts#L8-L46)는 `PMG` 표결용) | **🟡 부분 일치** |
| **가입 & `PMC` 단일 생성** | **예측 성공 시에만** 유일하게 `PMC` 획득 | 가입 시 `WELCOME_BONUS_PMC = 1000` (개발 모드 `10000`)을 바로 지급 중([auth-helper.ts](file:///c:/G/posmul/apps/posmul-web/src/app/auth/auth-helper.ts#L5-L8)) | **🔴 충돌** |
| **`Consume`** | 초기: 광고 시청 `PMP`만 지급 / 소상공인 Phase 3 보류 / 직접 광고만 `Social(IFRS S1)` | 광고 시청은 `PMP`만 지급([time/view/[id]/route.ts](file:///c:/G/posmul/apps/posmul-web/src/app/api/consume/time/view/%5Bid%5D/route.ts#L132-L206), 단 L186 `supabase.rpc('increment_pmp')` 오용 버그 존재). **소상공인 결제(`money/payment`)와 크라우드펀딩(`cloud/contribute`)에서 `PMC` 직접 지급 코드가 살아있음**. 기업 직접 광고 `Social` 리포트 기능은 **미구현** | **🔴 충돌** |
| **`MoneyWave`** | `모두의창업` + 광고 수익의 **`EAT`(세후 순이익)** 연동 | 실제 광고 수익과 미연동이며 `expectedAnnualEbit = 36500000` 하드코딩([money-wave-calculator.service.ts](file:///c:/G/posmul/apps/posmul-web/src/shared/economy-kernel/services/money-wave-calculator.service.ts#L18-L36)) 또는 DB `annual_ebitda` 설정값 사용([moneywave-daily-snapshot/index.ts](file:///c:/G/posmul/supabase/functions/moneywave-daily-snapshot/index.ts#L133-L146)). UI도 `"EBIT 기반"` 표기([economy/page.tsx](file:///c:/G/posmul/apps/posmul-web/src/app/economy/page.tsx#L38)) | **🔴 충돌** |
| **`Donation`** | Phase 1: `기관`·`K-물품`만 오픈 / Phase 2: `팔로잉`·`미래꿈기부`(콩도르세·보르다 투표) | ① `opinion-leader` 카드가 메인에 노출됨([donation/page.tsx](file:///c:/G/posmul/apps/posmul-web/src/app/donation/page.tsx#L56-L68)), `support` API는 리더 개인 계좌로 `PMC` 이체([support/route.ts](file:///c:/G/posmul/apps/posmul-web/src/app/api/donation/opinion-leader/support/route.ts#L35-L61))<br>② **핵심 버그**: [donateToWishlist](file:///c:/G/posmul/apps/posmul-web/src/app/donation/direct/wishlist.actions.ts#L134-L168) 및 [donate/route.ts](file:///c:/G/posmul/apps/posmul-web/src/app/api/donation/donate/route.ts#L17-L36)에서 실제 유저의 `pmc_balance` 차감이 안 됨<br>③ **숨은 자산**: 콩도르세·보르다 함수(`analyzeSocialChoiceAggregation`)는 [collective-intelligence-engine.ts](file:///c:/G/posmul/apps/posmul-web/src/bounded-contexts/prediction/domain/services/collective-intelligence-engine.ts#L469-L786)에 구현·단위테스트 완료 상태이나 `Donation`과 미연결 | **🟡 괴리 + 미연동** |
| **신뢰 인프라** | Phase 3: 블록체인 · 삼식부기 | `apps/posmul-web/src` 내 실제 구현 코드 0건 (문서 로드맵과 일치) | **✅ 로드맵 일치** |

### 3-2. Phase 1 코드 정리 반영 현황
1. **`PMC` 새는 구멍 막기 (`✅ 반영 완료`)**:
   - `auth-helper.ts`의 `WELCOME_BONUS_PMC = 0`, `DEV_BONUS_PMC = 0` 으로 조정 완료
   - `consume/money/payment`, `consume/cloud/contribute` POST 요청에 Phase 3 잠금 가드(`ENABLE_PHASE3_CONSUME_PMC !== 'true'` → `403 PHASE_3_LOCKED`) 적용 및 `/consume` 화면에서 `Minor League`·`Cloud Funding` 비활성화 완료
2. **`Donation` 잔액 차감 연결 & Phase 2 메뉴 숨김 (`✅ 반영 완료`)**:
   - `wishlist.actions.ts` (`donateToWishlist`) 및 `/api/donation/donate`에 `economy.pmp_pmc_accounts` `pmc_balance` 검증·차감·롤백 및 `pmp_pmc_transactions`(`DONATION`) 원장 기록 연결 완료
   - `donation/direct/item/[id]/client.tsx` 및 `/donation` 메인 모달이 실제 서버 응답을 검증하도록 연결하고, `opinion-leader` 카드는 Phase 2 오픈 예정 잠금 처리 완료
   - *(추후 참고: [DONATION_SYSTEM_AUDIT_AND_NEXT_STEPS.md](file:///c:/G/posmul/docs/archive/2026-11-pre-v3/review/DONATION_SYSTEM_AUDIT_AND_NEXT_STEPS.md) 의 기타 세부 페이지 추가 감사 항목은 순차 점검)*
3. **`Consume` 광고 적립 버그 수정 (`✅ 반영 완료`)**:
   - `time/view/[id]/route.ts` 내 잘못된 `pmp_balance: supabase.rpc('increment_pmp', ...)` 호출을 기존 계정 조회 후 `update` / `insert` 방식으로 수정 완료
4. **추천/공감 `PMP` & `EAT` 표기 정리 (`✅ 기본 반영 / 🟡 실광고 연동 남음`)**:
   - `forum-pmp-policy.ts`·`forum-pmp-ledger.ts`·`gallery.actions.ts` 를 통해 **글·댓글(낮은 고정 보상) + 추천 수령(`+20 PMP`)·개념글(`+100 PMP`) + 자추/중복 방지 + 일일 총 상한(`1,000 PMP`)** 반영 완료 (`✅`)
   - `economy/page.tsx`·`CompactWidget.tsx`·`money-wave-calculator.service.ts`·`api/predictions/games/route.ts` 를 **세후 순이익(`EAT`) / `POSMUL_ANNUAL_EAT_POOL` 기준**으로 현행화 완료 (`✅`)
   - **남은 작업**: 실제 `CPC/CPV/CPA` 광고 정산 수익이 DB `EAT` 로 자동 집계되도록 연동 (`🟡`)

*(참고: 구문서 [PLATFORM_OVERVIEW.md](file:///c:/G/posmul/docs/archive/2026-11-pre-v3/business/PLATFORM_OVERVIEW.md) 등에 남아 있던 `Consume` 직접 `PMC` 획득 규칙은 v3.0에서 폐기되어 아카이브 처리되었습니다.)*

---

## 4. 문서(`docs/`) 아카이브 정리 현황 (완료)

- **최신 정본 (생각 정리 & 의사결정)**: [POSMUL_WHITEPAPER.md](file:///c:/G/posmul/docs/POSMUL_WHITEPAPER.md) + 본 문서(`DOMAIN_FLOW_AND_DECISIONS.md`)
- **개발 기술 스펙 (`docs/v2/`)**: `01~05_*_V2.md` 유지 (추후 v3.0 변경점에 맞춰 동기화 예정)
- **구버전 12개 폴더 아카이브 이동 완료**: `architecture`, `business`, `concepts`, `dev_guide`, `explanation`, `guides`, `init`, `reference`, `research`, `review`, `tutorials`, `ui-ux` 폴더는 유실 없이 [archive/2026-11-pre-v3/](file:///c:/G/posmul/docs/archive/2026-11-pre-v3) 하위로 일괄 이동했습니다.

