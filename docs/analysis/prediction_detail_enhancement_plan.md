# Prediction Game Detail UX 고도화 계획

> 작성일: 2025-12-30
> 목표: Prediction 디테일 페이지의 UX를 경쟁사(Polymarket, Kalshi) 수준으로 고도화하고, 3가지 게임 타입(Binary, Ranking, WinDrawLose)에 최적화된 인터페이스를 구축한다.

---

## 1. 경쟁사 분석 (UX 패턴)

### 1.1 Polymarket (탈중앙화 예측 시장)
*   **레이아웃**: 좌측 차트/이슈 설명, 우측 Trading 패널 (데스크탑 기준).
*   **핵심 UX**:
    *   **Yes/No 주식 개념**: 확률을 가격(¢)과 연동하여 직관적으로 표현.
    *   **실시간 차트**: 심플한 Line Chart로 시간에 따른 확률(가격) 변화 추적.
    *   **Order Book**: 주식 시장처럼 매수/매도 잔량 표시 (PosMul은 아직 불필요할 수 있으나 참고).

### 1.2 Kalshi (규제 준수 예측 시장)
*   **레이아웃**: 매우 깔끔하고 정보 중심적.
*   **핵심 UX**:
    *   **이벤트 중심**: "Will [Event] happen?" 형태의 질문이 헤드라인.
    *   **간편 배팅**: 복잡한 트레이딩 용어 대신 "Buy Yes", "Buy No"와 같이 직관적 버튼 사용.
    *   **모바일 최적화**: 하단 고정 배팅 바(Floating Action Button/Bar).

### 1.3 종합 인사이트 (Best Practices)
*   **그래프 시각화**: 확률 변화를 라인 차트로 보여주되, 복잡한 지표(MACD 등)는 제거하고 **'확률 추이'에 집중**.
*   **명확한 CTA**: '배팅하기'보다는 **'Yes 구매/No 구매'** 또는 **'예측 확정'** 같은 명확한 액션 버튼.
*   **내 포지션 가시성**: 현재 내가 건 돈, 예상 수익금, ROI를 배팅 패널 근처에 항상 표시.

---

## 2. PosMul UX 개선 제안

### 2.1 공통 레이아웃 (Layout Structure)

**Desktop**:
```
[ Header: Title, Category, Current Pool/Volume ]
--------------------------------------------------
[ Left Column: 65% ]           | [ Right Column: 35% ]
                               |
- Probability Chart (Recharts) | - Betting Panel (Sticky)
  (Time vs Probability)        |   - Input (Amount)
                               |   - Est. Return Display
- Game Description / Rules     |   - "Place Prediction" Btn
                               |
- Related News / Analysis      | - My Current Position
                               |   (If logged in & betted)
--------------------------------------------------
[ Bottom Section ]
- Comments (Forum System)
```

**Mobile**:
```
[ Header ]
[ Chart ]
[ Betting Actions (Fixed Bottom or Inline) ]
[ Description ]
[ Comments ]
```

### 2.2 기술 스택 (Tech Stack)
*   **Charting**: `Recharts` (React 친화적, 커스터마이징 용이, Context7 추천)
    *   `ReferenceLine`을 사용하여 50% 확률선 표시.
    *   `Tooltip`으로 특정 시점 확률 표시.
*   **UI Components**: `shared/ui` (기존 프리미티브 활용) + `Framer Motion` (전환 애니메이션).

---

## 3. 게임 타입별 상세 UI (Game Specifics)

### 3.1 Binary Game (양자택일)
> 예: "비트코인이 10만 달러를 돌파할까요?" (Yes / No)

*   **Chart**: 2개 라인 (Yes 확률, No 확률) 또는 Yes 확률 단일 라인(No는 100-Yes).
*   **Betting UI**:
    *   거대한 2분할 버튼: [ 🟩 YES 70% ] [ 🟥 NO 30% ]
    *   선택 시 하단에 슬라이더/인풋 등장하여 PMP 수량 조절.
    *   "예상 수익: 100 PMP → 142 PMP (+42%)" 실시간 계산 표시.

### 3.2 Ranking Game (순위 맞추기)
> 예: "다음 대통령은 누구일까요?" (후보 A, B, C, D...)

*   **Chart**: Multi-line Chart. 각 후보별 색상 구분.
    *   상위 3~5명만 기본 표시, 나머지는 'Others' 또는 토글.
*   **Betting UI**:
    *   **List View**: 후보 리스트와 현재 배당률/확률 Bar.
    *   각 행 우측에 [Bet] 버튼.
    *   클릭 시 모달 또는 하단 시트(Mobile)에서 수량 입력.

### 3.3 WinDrawLose (승무패)
> 예: "손흥민 출전 경기 결과는?" (승 / 무 / 패)

*   **Chart**: Stacked Area Chart 또는 3-Line Chart.
*   **Betting UI**:
    *   Segmented Control (3분할 토글):
        [ 홈팀 승 (1.8x) | 무승부 (3.2x) | 원정팀 승 (2.1x) ]
    *   선택된 옵션 강조 되며 아래 배팅 입력창 활성화.

---

## 4. 구현 단계 (Recommended Steps)

1.  **UI 컴포넌트 개발 (`shared/ui` or Local)**:
    *   `PredictionChart`: Recharts 기반 재사용 가능한 차트 컨테이너.
    *   `BettingWidget`: 게임 타입(type prop)에 따라 다른 Input UI 렌더링.
2.  **페이지 리팩토링**:
    *   `app/prediction/[id]/page.tsx` 레이아웃 개편.
    *   Desktop/Mobile Responsive Grid 적용.
3.  **데이터 연동**:
    *   Supabase에서 과거 확률 이력(History) 데이터 패칭 로직 추가 (없으면 Mocking 후 추후 구현).

## 5. 결론
PosMul의 강점인 "PMP(재미) → PMC(경제)" 순환을 위해, 배팅 과정 자체가 **'게임'처럼 느껴지도록 시각적 피드백(그래프, 인터랙티브 버튼)**을 강화해야 합니다. Recharts와 모듈화된 Betting Widget을 도입하여 이를 달성할 수 있습니다.
