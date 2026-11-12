---
description: Swarm 없이 도메인 참모들과 먼저 상의하고 대표님 컨펌을 받은 뒤 실행·동기화하는 PosMul 컨펌 기반 오케스트레이션 워크플로우
---

# Domain Council (도메인 참모 회의 & 컨펌 오케스트레이션)

> **목적**: 방대해진 프로젝트에서 각 도메인의 철학과 금지선을 잊지 않도록, **코드 수정 전에 관련 도메인 참모(`SKILL.md`)와 상의 → 대표님 컨펌 → 실행 → 기억(문서) 동기화** 순서로 안전하게 작업한다.
> **원칙**: 무거운 Swarm 병렬 실행을 쓰지 않고, 대표님과 1:1 의사결정을 호흡하며 진행한다.

---

## 도메인 참모 라인업 (`.agent/skills/`)
1. **[posmul-prediction](file:///c:/G/posmul/.agent/skills/posmul-prediction/SKILL.md)** — 플랫폼 심장 · 1단계 사실 판단 훈련 · 오라클 · 승자독식
2. **[posmul-economy](file:///c:/G/posmul/.agent/skills/posmul-economy/SKILL.md)** — `PMP`/`PMC` 이중 화폐 핵심 원장 · `MoneyWave(EAT)` 총량 제어
3. **[posmul-forum](file:///c:/G/posmul/.agent/skills/posmul-forum/SKILL.md)** — 트래픽 광장 · 일일 한도 내 `PMP` 공급 · 추천/개념글 보상
4. **[posmul-consume](file:///c:/G/posmul/.agent/skills/posmul-consume/SKILL.md)** — 광고 2트랙(현금 `EAT` vs 직접의뢰 `Social IFRS S1`) · 소상공인 Phase 3 잠금
5. **[posmul-donation](file:///c:/G/posmul/.agent/skills/posmul-donation/SKILL.md)** — 2단계 가치 배분 훈련(Phase 1 기관·K-물품 vs Phase 2 팔로잉·미래꿈 투표)
6. **[posmul-ranking](file:///c:/G/posmul/.agent/skills/posmul-ranking/SKILL.md)** — 읍면동 풀뿌리 랭킹 · 직업군 명예의 전당 · `Brier Score` 실력 평판

---

## 실행 절차 (4단계)

### Step 1. 영향 도메인 식별 (코디네이터)
- 대표님의 아이디어, 기능 요청, 수정 요청을 받으면 **즉시 코드를 수정하지 않는다.**
- 요청이 맞닿아 있는 도메인 1~3개를 특정한다.
  - 예: *"예측 실패 유저에게 위로 포인트 줄까?"* → **`posmul-prediction`** + **`posmul-economy`** + **`posmul-forum`** 소환

### Step 2. 도메인 참모 소환 & 상의 (코드 수정 금지)
- 관련 도메인 참모의 `SKILL.md`를 읽는다. (도메인 간 충돌 우려가 큰 경우 읽기 전용 `invoke_subagent` 로 교차 검토)
- 각 참모 관점에서 아래 **4가지 질문**에 답을 뽑는다:
  1. **철학 부합 여부**: 이 도메인의 존재 이유에 맞는가?
  2. **금지선 / 불변식 충돌 여부**: `PMC` 누수, `EBIT` 오용, Phase 2/3 조기 개방, 원장 미연동 등을 건드리지 않는가?
  3. **타 도메인 입출력 영향**: 앞/뒤 도메인 계약(`PMP`/`PMC`/`EAT`/`Ranking` 점수)이 어긋나지 않는가?
  4. **현 코드 현황**: 지금 실제 코드/DB와 어떤 차이가 있는가?

### Step 3. 대표님 컨펌 브리핑 (Decision Gate)
- 아래 형식으로 **짧고 명확한 상의 결과**를 보고하고 대표님의 컨펌을 기다린다:
  - **참모별 핵심 의견 요약** (예: Prediction 담당 찬성/우려, Economy 담당 주의점)
  - **쟁점 & 선택지** (`A안 [추천]` vs `B안` — 각각 장단점과 부작용)
  - **변경 예정 범위** (건드릴 파일, 테스트 범위)
- 필요 시 `ask_question` 으로 핵심 결정을 선택받는다. **컨펌 전에는 코드를 수정하지 않는다.**

### Step 4. 컨펌 후 실행 & 기억 동기화 (Execute & Sync)
- 대표님이 선택한 안으로 코드를 구현하고 `tsc` / `jest` / `eslint` (및 필요 시 `/browser`) 검증을 마친다.
- **기억 동기화(중요)**: 이번 컨펌에서 새로운 원칙이나 수치가 확정되었다면, 작업 종료 전 반드시 아래 문서도 함께 갱신한다:
  - 해당 도메인 참모 `SKILL.md` (불변식 · 숙제 갱신)
  - [DOMAIN_FLOW_AND_DECISIONS.md](file:///c:/G/posmul/docs/DOMAIN_FLOW_AND_DECISIONS.md) (결정 현황 보드 갱신)

