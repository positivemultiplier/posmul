# Consume 도메인 UI/UX 전략 보고서
**부제: Prediction(예측)과 완벽하게 연동되는 경제 순환의 엔진**

> **작성일**: 2025-12-30
> **관련 문서**: `docs/domain_architecture_overview.md`, `consume/context.md`

---

## 1. 개요 및 분석

### 1.1 도메인 정체성
`Consume` 도메인은 PosMul 플랫폼의 **"경제 엔진(Engine Room)"**입니다.
- **Major League (광고)**: 예측 게임에 필요한 연료(**PMP**)를 공급합니다.
- **Local League (소비)**: 예측 게임 승리 보상(**PMC**)을 실제 로컬 경제에서 추가 획득(Reward)하는 공간입니다.
- **Crowd Funding (투자)**: 모은 **PMC**를 이웃의 꿈에 투자(Invest)하여 가치를 실현합니다.

### 1.2 Prediction과의 관계 (The Loop)
사용자에게 `Consume`은 독립적인 쇼핑몰이 아니라, **"예측 게임을 즐기기 위한 정거장"**이자 **"승리의 기쁨을 누리는 장소"**여야 합니다.

- **Loop A (연료 공급)**: `Prediction` (PMP 고갈) -> `Major League` (광고 시청) -> `PMP 획득` -> `Prediction`
- **Loop B (가치 증폭)**: `Prediction` (PMC 획득) + `Local League` (소비하고 PMC 추가 획득) -> `Crowd Funding` (이웃에게 투자)

---

## 2. UX 전략 (Core Strategy)

### 2.1 Contextual PMP Recharging (문맥 기반 PMP 충전)
사용자가 `Consume` 메뉴를 찾아가게 하지 말고, **필요한 순간에 `Consume`이 나타나야 합니다.**

- **Trigger**: 베팅 시 PMP 부족 상황 발생.
- **Action**: "PMP가 부족한가요?" 바텀 시트(Bottom Sheet) 호출.
- **Content**: 짧은 광고 영상(Shorts) 또는 미니 퀘스트 노출.
- **Reward**: 즉시 PMP 지급 후 **베팅 프로세스 자동 재개** (흐름 끊김 방지).

### 2.2 Gamified Ad-View (게임화된 광고 시청)
광고 시청을 지루한 작업(Labor)이 아닌, 게임의 일부(Quest)로 인식시킵니다.

- **"Betting Ticket" 메타포**: 단순 포인트 적립이 아니라, "베팅 티켓 충전" 느낌의 UI 디자인.
- **Prediction 연계 보너스**: "이번 예측 적중률 80% 이상이면 광고 보상 1.5배!" 등의 동적 보상.

### 2.3 Smart Spending Recommendation (가치 소비 제안)
예측 게임에서 승리하여 PMC가 쌓였을 때, 이를 가치 있게 쓸 수 있는 곳을 추천합니다.

- **승리 직후 넛지**: "획득한 5,000 PMC로 우리 동네 '착한 카페'를 후원(투자)해보세요."
- **투자 포트폴리오**: 내가 후원한 로컬 가게들의 성장을 시각화 (Prediction 통계와 유사한 UI 문법 사용).

---

## 3. UI 구조 제안 (Information Architecture)

`Consume`의 UI는 크게 **충전(Earn)**과 **소비(Spend)** 두 축으로 나뉩니다.

```mermaid
graph TD
    Dashboard[Consume Dashboard]
    
    subgraph Earn ["PMP 충전소 (Major League)"]
        DailyMission[일일 미션]
        AdReel[광고 숏폼 릴]
        Quiz[브랜드 퀴즈]
    end
    
    subgraph Spend ["가치 소비/투자 (Funding)"]
        CrowdList[소셜 펀딩 (Crowd)]
        InvestorDash[내 투자 현황]
    end

    subgraph Bonus ["추가 획득 (Local League)"]
        LocalMap[내 주변 가맹점]
        PaymentQR[결제하고 PMC 받기]
    end
    
    Dashboard --> Earn
    Dashboard --> Bonus
    Dashboard --> Spend
```

### 3.1 주요 컴포넌트 (Detailed Components)

#### A. `PmpStationWidget` (PMP 충전 위젯)
- **위치**: Prediction 상단 헤더, 베팅 모달 내부.
- **기능**: 현재 PMP 잔액 표시 + "무료 충전(광고)" 버튼.
- **디자인**: 주유소 게이지(Fuel Gauge) 모티프.

#### B. `AdShortsPlayer` (광고 플레이어)
- **형태**: 틱톡/릴스 스타일의 전체 화면 비디오 플레이어.
- **기능**: 스와이프로 넘기며 광고 시청 -> 시청 완료 시 코인 효과와 함께 PMP 적립.
- **연동**: 광고 하단에 "이 브랜드 퀴즈 풀고 추가 PMP 받기" 버튼.

#### C. `InvestmentOpportunityCard` (투자 기회 카드)
- **형태**: PredictionCard와 유사한 디자인 언어 사용 (일관성).
- **내용**: "수익률" 대신 **"사회적 가치(Impact)"**와 **"혜택(Perks)"** 강조.
- **액션**: [PMC로 펀딩 참여하기]

---

## 4. 제안하는 다음 단계 (Next Steps)

1.  **`PmpStationWidget` 프로토타이핑**:
    - `Prediction` 헤더에 들어갈 소형 위젯 디자인.
2.  **`AdShortsPlayer` UI 구현**:
    - `Consume` 메인 화면을 숏폼 피드 형태로 구성해볼 것 제안.
3.  **Local League 데이터 목업**:
    - 가상의 로컬 상점 데이터를 만들어 PMC 사용 흐름 테스트.
