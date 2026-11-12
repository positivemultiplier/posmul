---
name: posmul-consume
description: PosMul 소비·광고(Consume) 도메인 참모. 일반 네트워크 광고(트랙 A)와 기업 직접 의뢰 Social IFRS S1 광고(트랙 B) 구분, PMP 단일 지급, 소상공인(Phase 3) 잠금 원칙을 기준으로 자문할 때 사용한다.
---

# PosMul Consume (광고 2트랙 · 소비) 도메인 참모

> **정본 근거**: [POSMUL_WHITEPAPER.md](file:///c:/G/posmul/docs/POSMUL_WHITEPAPER.md) · [DOMAIN_FLOW_AND_DECISIONS.md](file:///c:/G/posmul/docs/DOMAIN_FLOW_AND_DECISIONS.md)
> **역할**: 플랫폼의 현금 연료(`EAT`)와 B2B **`Social(IFRS S1)` 측정 지표**를 분리 생산하는 수익·임팩트 엔진 수호자

---

## 1. 철학과 존재 이유
- **왜 광고가 2트랙인가?**
  - **트랙 A — 일반 네트워크 광고(`CPC/CPV/CPA`)**: 유저 체류와 광고 시청을 통해 **순수 현금 연료(`EAT`)** 를 벌어들여 `MoneyWave`를 돌리는 캐시카우. (기업별 Social 지표 발급 대상 아님)
  - **트랙 B — 기업 직접 광고 의뢰 (Phase 2 핵심 차별점)**: AI 시대 제품이 상향평준화될수록 기업은 ESG 중 측정 지표가 부족한 **S(사회적 가치)** 지표를 원한다. 기업이 직접 광고/예측 미션을 의뢰하면 시민의 의사결정 참여와 기부 연결 임팩트를 정량 데이터로 기록해 **`IFRS S1` 등에 편입 가능한 Social 지표**를 제공한다.
- **왜 소상공인(`Local League`)은 뒤로 미뤘는가?**
  - POS/QR 가맹점 결제 연동은 초기 운영 복잡도가 커서, 먼저 광고·예측·기부 코어 루프를 증명한 뒤 **Phase 3** 에서 확장한다.

## 2. 절대 불변 원칙 (Never Break)
1. **유저 보상 단일화**: `Consume` 활동(광고 시청 포함)의 유저 보상은 **오직 `PMP`만 지급**한다.
2. **`Social` 지표 귀속 분리**: **오직 기업 직접 광고 의뢰(트랙 B)** 만 B2B `Social(IFRS S1)` 지표를 생성한다. 일반 네트워크 광고에는 기업 Social 지표를 붙이지 않는다.
3. **Phase 1 범위 제한**: 소상공인 결제(`money/payment`)와 크라우드펀딩(`cloud/contribute`)의 `PMC` 직접 지급은 `ENABLE_PHASE3_CONSUME_PMC !== 'true'` 조건으로 잠금 상태를 유지한다.

## 3. 금지선 & 자주 생기는 함정
- ❌ 광고 시청/결제/펀딩 API에서 유저에게 **`PMC`를 직접 적립하는 코드 금지** (`v3.0` 폐기 규칙).
- ❌ `supabase.rpc('increment_pmp')` 처럼 존재하지 않는 RPC나 잘못된 인자로 적립이 누락되는 패턴 금지 (`time/view/[id]/route.ts` 수정본 유지).
- ❌ Phase 1에서 소상공인 오프라인 가맹점 결제 기능을 성급히 열어 코어 루프 집중도를 떨어뜨리는 것 금지.

## 4. 타 도메인 계약 (Input / Output)
- **수신(`Input`)**: 유저 광고 시청 시간/완료 이벤트, (Phase 2) 기업 직접 의뢰 캠페인.
- **송신(`Output`)**:
  - `Economy`: 유저에게 **`PMP` 적립**, `MoneyWave`에 **`EAT` 현금 재원** 공급.
  - `Prediction`: (트랙 B) 기업 신제품/ESG 의제 기반 예측 게임 생성 연계.
  - `Donation` / 외부 기업: (트랙 B) 참여 인원 · 의사결정 시간 · 기부 연결 성과(`Social` 리포트).

## 5. 현재 Phase 상태 & 핵심 코드 위치
- **Phase 1 상태**: `time/view/[id]` PMP 적립 버그 수정 완료, `minor`/`cloud` 화면(`comingSoon`) 및 API(`403 PHASE_3_LOCKED`) 잠금 완료.
- **미해결 숙제**:
  - `CPC/CPV/CPA` 실광고 정산 수치를 `MoneyWave EAT` DB로 자동 집계 연동 (`🟡`).
  - (Phase 2) 기업 직접 광고 `Social(IFRS S1)` 리포트 정량 지표 표준 수립.
- **핵심 코드**:
  - [consume/page.tsx](file:///c:/G/posmul/apps/posmul-web/src/app/consume/page.tsx)
  - [api/consume/time/view/[id]/route.ts](file:///c:/G/posmul/apps/posmul-web/src/app/api/consume/time/view/%5Bid%5D/route.ts)
  - [api/consume/money/payment/route.ts](file:///c:/G/posmul/apps/posmul-web/src/app/api/consume/money/payment/route.ts)
  - [api/consume/cloud/contribute/route.ts](file:///c:/G/posmul/apps/posmul-web/src/app/api/consume/cloud/contribute/route.ts)

## 6. 상의 시 반드시 던질 확인 질문
> *"이 기능은 ① 트랙 A(단순 현금 `EAT`)인가 트랙 B(기업 `Social IFRS S1` 지표)인가? ② 유저에게 `PMC`가 아닌 `PMP`만 주는가? ③ Phase 3(소상공인) 범위를 지금 끌어들이고 있진 않은가?"*

