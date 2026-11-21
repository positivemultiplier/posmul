---
name: posmul-prediction
description: PosMul 예측(Prediction) 도메인 참모 및 백엔드/UI 개발 스킬. 1단계 사실 판단 훈련 철학, 승자독식(PMP 소멸)·PMC 유일 생성처 원칙, 오라클 판정 기준, MoneyWave(EAT) 정산, 프론트엔드 UI 표준을 기준으로 자문·구현할 때 사용한다.
---

# PosMul 예측(Prediction) 도메인 참모 & 개발 가이드

> **정본 근거**: [POSMUL_WHITEPAPER.md](file:///c:/G/posmul/docs/POSMUL_WHITEPAPER.md) · [DOMAIN_FLOW_AND_DECISIONS.md](file:///c:/G/posmul/docs/DOMAIN_FLOW_AND_DECISIONS.md)  
> **역할**: 플랫폼의 심장인 **1단계 사실·확률 판단 훈련장 + 살아있는 커뮤니티**와 **유일한 `PMC` 생성 게이트**를 지키는 수호자

---

## 1. 철학과 존재 이유
- **왜 `Prediction`이 플랫폼의 심장인가?**
  - 한국 사회에서 미래 예측은 도박으로만 취급되지만, PosMul은 유저가 **내 돈을 잃지 않고(`PMP` 무료 참여)** 양쪽 균형 근거를 비교하며 **정답 있는 사실·확률 판단을 훈련하는 장**을 만든다.
  - 동시에 미국주식 갤러리처럼 유저가 자발적으로 모여 토론하고 **직접 예측 게임을 제안·생성**하며 머무는 커뮤니티 공간이다.

---

## 2. 절대 불변 원칙 & 금지선 (Never Break)
1. **유일한 `PMC` 생성처**: `PMC`는 오직 `Prediction` 예측 성공 보상으로만 발행된다.
2. **승자독식(`PMP` 소멸)**: 예측 실패 시 참여한 `PMP`는 소멸되며, 유저는 다시 `Forum`/`Consume` 활동으로 `PMP`를 모아 재도전한다.
3. **양쪽 균형 근거 의무**: 한쪽 주장만 노출하지 않고 찬반 근거/AI 균형 브리핑을 함께 제공한다.
4. **주관적 투표 정산 금지**: 사실 판단 영역은 반드시 검증 가능한 **공식 공인 오라클**로 정산한다. *(정답 없는 가치 배분 투표는 `Donation` Phase 2 `미래꿈기부` 전용)*
5. **사행성 용어 금지**: UI에서 `베팅`, `배당`, `판돈` 대신 `예측 투표 참여`, `예상 리워드 배율`, `총 참여 PMP`를 사용한다.

---

## 3. 타 도메인 계약 (Input / Output)
- **수신(`Input`)**: `Forum`/`Consume` 에서 유저가 얻은 `PMP`, `Economy` 의 `MoneyWave(EAT)` 일일/시간별 `PMC` 상금 풀, `Feed(AI)` 의 양쪽 균형 브리핑.
- **송신(`Output`)**: 승자에게 **`PMC` 보상 발행 요청(`Economy`)**, `Ranking` 에 적중 `PMC`·`winRate`·`Brier Score` 제공, 유저에게 `Donation` 기부 재원 공급.

---

## 4. 상의 시 반드시 던질 확인 질문
> *"이 변경이 ① 양쪽 균형 근거·공식 오라클 원칙을 해치지 않는가? ② 승자독식 `PMP` 소멸과 `EAT` 기반 `PMC` 한도를 뚫는 우회로가 되지 않는가? ③ 도박성 용어/UX를 유발하지 않는가?"*

---

## 5. 상세 스펙 참조 (작업 영역에 따라 필요한 문서만 읽기)
- **백엔드 · DB · 오라클 · 정산 · 파이프라인 작업 시**:  
  [references/backend-oracle-settlement.md](./references/backend-oracle-settlement.md) (오라클 제약조건, 상태 전이 머신, 대문자 ENUM, RLS·원자적 철회, TDD/CI 규칙, 스케줄러 파이프라인)
- **프론트엔드 카드 · 게이지 · 스포트라이트 · 상세뷰 작업 시**:  
  [references/frontend-ui-cards.md](./references/frontend-ui-cards.md) (황금 모래시계, 4계층 카드 구조, 3열 그리드, 3대 분류 UI, 상세페이지 레이아웃)
