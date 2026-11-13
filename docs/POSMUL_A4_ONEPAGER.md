# PosMul 한눈에 보는 전체 지도 (A4 출력용 요약본 · v3.0)

> **한 줄 철학**: *"시간과 참여를 소비해 `PMP`를 얻고, 근거 기반 예측 의사결정 훈련을 통해 `PMC`로 전환하며, 이를 투명하고 즐거운 기부에 사용함으로써 개인의 활동이 측정 가능한 사회적 가치(`Social`)로 전환된다."*
> *(인쇄용 레이아웃 파일: [POSMUL_A4_PRINT.html](file:///c:/G/posmul/docs/POSMUL_A4_PRINT.html) 을 브라우저로 열어 `Ctrl+P` 하시면 A4 2장에 딱 맞게 출력됩니다.)*

---

## 1. 전체 가치 순환 & 6대 도메인 지도

```mermaid
flowchart TD
    U(["시민 · 유저 유입"])

    subgraph IN["입구 · 트래픽 & 재원 (오직 PMP만 지급)"]
        direction LR
        F["1. Forum (광장)\n체류시간 · 트래픽 확보\n일일 한도 1,000 PMP\n글보다 추천(+20)·개념글(+100) 우대"]
        C_A["2-A. Consume 일반광고\nCPC · CPV · CPA\nPMP 지급 + 현금 연료(EAT)"]
        C_B["2-B. Consume 직접의뢰 (Phase 2)\n기업 ESG · 신제품 미션\nSocial(IFRS S1) 지표 생성"]
        V["2-C. Vertical 버티컬 (Housing-Pro)\n종이책 AI 스캔 마찰보상(+30~50)\n선지 O/X 복습 · 일일 300 PMP 캡\n교재/B2B 마진(EAT 기여)"]
    end

    subgraph SEED["재원 총량 엔진"]
        MW["3. Economy (PMP/PMC 원장 + MoneyWave)\n재원: 모두의창업 상금 + 광고 세후 순이익(EAT)\n원칙: EBIT 금지 · EAT 총량 안에서만 상금 배분"]
    end

    subgraph CORE["1단계 훈련 · 플랫폼의 심장"]
        P["4. Prediction (사실 · 확률 판단)\nPMP 참여 + 양쪽 균형 근거 + 공인 오라클\n유저 게임 제안 · 커뮤니티(미주갤)"]
        WIN{"예측 결과\n(승자독식)"}
        BURN["실패: 참여 PMP 소멸\n-> 포럼·광고로 재충전"]
        PMC["성공: 유일하게 PMC 획득!\n(MoneyWave 풀 배분)"]
    end

    subgraph OUT["2단계 훈련 · 결실 & 명예 순환"]
        direction LR
        D1["5-A. Donation (Phase 1 오픈)\n기관기부 · K-물품기부\n실원장 PMC 차감 + 전달·수혜 인증"]
        D2["5-B. Donation (Phase 2 확장)\n팔로잉 기부(위임)\n미래꿈기부(콩도르세·보르다 투표)"]
        R["6. Ranking (명예의 전당)\n읍면동 풀뿌리 · 직업군별 랭킹\nBrier Score 실력 + 기부 평판"]
    end

    L["Local 소상공인 · 블록체인 · 삼식부기\n(Phase 3 추후 확장)"]

    U --> F
    U --> C_A
    U --> V
    F -->|"PMP 적립 & 트래픽 광고"| C_A
    C_A -->|"세후 순이익(EAT)"| MW
    C_B -->|"EAT + Social(IFRS S1) 데이터"| MW
    V -->|"교재/B2B 마진 EAT 기여"| MW
    F -->|"PMP"| P
    C_A -->|"PMP"| P
    V -->|"PMP"| P
    MW -->|"일일·시간별 PMC 상금 풀"| P
    P --> WIN
    WIN -->|"오답"| BURN
    BURN -.->|"재도전 동력"| F
    WIN -->|"정답 (유일 경로)"| PMC
    PMC --> D1
    PMC -.->|"Phase 2"| D2
    F -->|"활동 점수"| R
    PMC -->|"적중·Brier 실력"| R
    D1 -->|"기부 평판"| R
    R -.->|"명예 · 재참여 동기"| U
    D1 -.-> L
```

---

## 2. 절대 경계 · 게임 상태 · 컨펌 작업 흐름

```mermaid
flowchart LR
    subgraph RULE["절대 경계 (헷갈릴 때 이것만 확인)"]
        R1["PMP 얻는 곳\nForum · Consume · 버티컬(AI스캔/복습)"]
        R2["PMC 얻는 곳\n오직 Prediction 성공만!"]
        R3["상금 풀 기준\nEBIT 금지 -> 세후 EAT"]
        R4["투표제 쓰는 곳\nPrediction(X) 오직 미래꿈기부(O)"]
    end

    subgraph STATE["Prediction 생애주기 (오라클 정산)"]
        S1["DRAFT\n준비"] --> S2["ACTIVE\nPMP 참여"]
        S2 --> S3["CLOSED\n마감"]
        S3 --> S4["SETTLING\n공인 오라클 판정"]
        S4 --> S5["SETTLED\n승자 PMC · 패자 PMP 소멸"]
    end

    subgraph COUNCIL["Swarm 없는 컨펌 개발 루프"]
        C1["1. 아이디어 / 수정 요청"] --> C2["2. 도메인 참모 상의\n(철학 · 금지선 · 타도메인 검사)"]
        C2 --> C3["3. 대표님 컨펌\n(A안/B안 선택)"]
        C3 --> C4["4. 구현 · 검증 + 기억 동기화\n(SKILL.md · 백서 갱신)"]
    end
```

---

## 3. 6대 도메인 헌법 초압축표

| 도메인 | 한 줄 철학 | 절대 원칙 (이것만은 지킨다) | 오픈 단계 |
| :--- | :--- | :--- | :---: |
| **Forum (광장)** | 트래픽 · 체류시간 확보 & 재도전 숨통 | 오직 `PMP`만 지급 / 일일 상한 `1,000 PMP` / 추천·개념글 우대 | **Phase 1** |
| **Consume (광고)** | 현금 `EAT` 공급 + 기업 `Social` 지표 | 유저는 `PMP`만 / 일반광고(`EAT`) vs 직접의뢰(`IFRS S1`) 분리 | **트랙A: P1 / 트랙B: P2 / 소상공인: P3** |
| **Economy (원장)** | 적자 없는 `PMP`/`PMC` 순환 통제 | `PMC`는 `Prediction` 성공만 생성 / `EAT` 총량 한도 / 원장 롤백 | **Phase 1** |
| **Prediction (심장)** | 도박이 아닌 1단계 사실 판단 훈련장 | 승자독식(`PMP` 소멸) / 양쪽 균형 근거 / 공인 오라클 정산 | **Phase 1** |
| **Donation (결실)** | 즐거운 기부 + 2단계 가치 배분 훈련 | `pmc_balance` 실차감 / 전달·수혜 인증 *(중복수령은 오픈이슈)* | **기관·물품: P1 / 팔로잉·미래꿈: P2** |
| **Ranking (명예)** | 돈이 아닌 실력·선한 영향력 평판 | 읍면동·직업군 명예의 전당 / `Brier Score` 실력 평판 | **Phase 1 (점수 v3 정렬 진행)** |

