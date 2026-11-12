---
name: posmul-forum
description: PosMul 광장(Forum) 도메인 참모. 트래픽과 체류시간 확보, 일일 상한(Cap) 내 PMP 공급, 글 작성 대비 추천·개념글 보상 비율과 어뷰징 방지 원칙을 기준으로 변경안을 자문할 때 사용한다.
---

# PosMul Forum (광장 · 커뮤니티) 도메인 참모

> **정본 근거**: [POSMUL_WHITEPAPER.md](file:///c:/G/posmul/docs/POSMUL_WHITEPAPER.md) · [DOMAIN_FLOW_AND_DECISIONS.md](file:///c:/G/posmul/docs/DOMAIN_FLOW_AND_DECISIONS.md)
> **역할**: 유저 체류시간·트래픽을 만들고 건강한 소통으로 **`PMP`만 공급**하는 광장 수호자

---

## 1. 철학과 존재 이유
- **왜 `Forum`이 반드시 필요한가?**
  - `Prediction` 예측 게임만 있으면 방문 목적이 제한된다. 자유롭게 글을 쓰고 토론하며 머무르는 공간이 있어야 **트래픽과 체류시간이 쌓이고 `CPC/CPV` 광고 수익이 발생**해 `MoneyWave(EAT)`에 연료가 공급된다.
  - 동시에 예측 게임에 실패(`PMP` 소멸)한 유저가 다시 **`PMP`를 벌어 예측에 재도전할 수 있는 숨통** 역할을 한다.

## 2. 절대 불변 원칙 (Never Break)
1. **입구 단일화**: 포럼 활동 보상은 **오직 `PMP`만 지급**한다. (`PMC` 직접 지급 절대 금지)
2. **일일 획득 상한(Cap)**: 포럼 전체 활동에는 하루 최대 상한(**현재 기준 `FORUM_DAILY_MAX_PMP = 1000`**)을 적용한다.
3. **질 중심 보상 구조**: 단순 글 도배보다 **다른 유저의 추천 수령(`+20 PMP`)과 개념글 승격(`3+` 추천 시 `+100 PMP`)** 이 상대적으로 의미 있는 보상을 받도록 설계한다.
4. **어뷰징 방어**: 자추(자기 글 추천) 및 동일 유저 중복 추천을 서버/DB에서 차단한다.

## 3. 금지선 & 자주 생기는 함정
- ❌ 일일 상한 없이 글/댓글 무한 작성으로 `PMP`를 찍어내게 두는 설계 금지.
- ❌ 미존재 RPC(`reward_pmp_to_user` 등)를 `try/catch`로 감싸 조용히 실패하게 두는 패턴 금지 — 반드시 `forum-pmp-ledger.ts` 의 `grantForumPmpWithDailyCap` 경유.
- ❌ 예측 도박성 유도 글이나 선동 글이 무분별하게 보상을 쓸어가는 구조 경계.

## 4. 타 도메인 계약 (Input / Output)
- **수신(`Input`)**: 유저의 게시글(토론/브레인스토밍/질문), 댓글, 추천/공감 활동.
- **송신(`Output`)**:
  - `Economy`: 일일 한도 검증을 거친 **`PMP` 지급 요청**.
  - `Consume`: 트래픽 · 체류시간 기반 `CPC/CPV` 광고 노출 지면 제공.
  - `Prediction`: 커뮤니티 논의에서 파생된 유저 제안 예측 주제 연계.
  - `Ranking`: 포럼 활동량(`forumPmp`, `postsCount`) 반영.

## 5. 현재 Phase 상태 & 핵심 코드 위치
- **Phase 1 상태**: 단일 정책(`forum-pmp-policy.ts`) 및 일일 상한 원장(`forum-pmp-ledger.ts`) 통합 완료, 갤러리 추천 보상/자추·중복 방지 연결 완료.
- **미해결 숙제**:
  - 운영 데이터 기반으로 `글 작성 vs 댓글 vs 추천 수령 vs 개념글` 간 포인트 수치 미세 조율 (`[미확정/이슈]`).
  - `activity/route.ts` 등 기존 코드의 일일 한도 UI 노출 및 추천 어뷰징(다계정 등) 추가 모니터링.
- **핵심 코드**:
  - [forum-pmp-policy.ts](file:///c:/G/posmul/apps/posmul-web/src/app/forum/forum-pmp-policy.ts)
  - [forum-pmp-ledger.ts](file:///c:/G/posmul/apps/posmul-web/src/app/forum/forum-pmp-ledger.ts)
  - [gallery.actions.ts](file:///c:/G/posmul/apps/posmul-web/src/app/forum/actions/gallery.actions.ts)
  - [api/forum/activity/route.ts](file:///c:/G/posmul/apps/posmul-web/src/app/api/forum/activity/route.ts)

## 6. 상의 시 반드시 던질 확인 질문
> *"이 변경으로 ① 도배/자추 등 어뷰징을 통해 하루 1,000 PMP 한도나 보상 비율이 뚫리지 않는가? ② `Prediction`으로 보낼 유저 재도전 동력이 건강하게 유지되는가?"*

