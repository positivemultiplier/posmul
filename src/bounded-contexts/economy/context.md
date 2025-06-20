# Economy Bounded Context

## 📋 **Context 개요**

Economy Bounded Context는 PosMul Platform의 **핵심 경제 시스템**으로, 노벨경제학상 수상자들의 검증된 이론을 바탕으로 한 **PMP/PMC 이중 화폐 시스템**을 관리합니다. 이는 Jensen & Meckling의 Agency Theory, Buchanan의 공공선택이론, Kahneman-Tversky의 Prospect Theory 등을 실제 코드로 구현한 **AI 시대 직접민주주의 실험장**입니다.

## 🎯 **도메인 책임**

### 1. 핵심 책임 (Core Responsibilities)

- **PMP/PMC 이중 화폐 시스템** 운영 및 관리
- **MoneyWave 1-2-3 메커니즘** 구현 및 최적화
- **Agency Theory 기반** 정보 비대칭 극복 시스템
- **행동경제학적 사용자 경험** 설계 및 제공
- **네트워크 경제학** 기반 플랫폼 가치 극대화
- **실증분석 및 계량경제학적** 성과 측정

### 2. 지원 책임 (Supporting Responsibilities)

- 사용자 **효용함수 실시간 추정** 및 개인화
- **거시경제 연계 분석** 및 승수효과 측정
- **리스크 관리** (유동성, 인플레이션, 버블 방지)
- **경제 데이터 시각화** 및 모니터링

## 🏛️ **유비쿼터스 언어 (Ubiquitous Language)**

### **핵심 화폐 개념**

#### **PMP (Positive Multiplier Point)**

- **정의**: 사용자 활동을 통해 획득하는 위험프리 자산 (Risk-Free Asset)
- **특성**: CAPM 모델의 무위험수익률 역할
- **획득방식**: Major League 광고시청, Forum 참여, Local League 활동
- **사용처**: 예측 게임 참여비, 플랫폼 내 활동 투자
- **경제학적 근거**: 무위험자산으로서 안정적 가치 보장

#### **PMC (Positive Multiplier Coin)**

- **정의**: EBIT 기반으로 발행되는 위험자산 (Risky Asset)
- **특성**: CAPM 모델의 위험프리미엄 반영
- **획득방식**: 예측 게임 성공, Local League 참여, Cloud Funding
- **사용처**: 기부 전용 (직접기부, 기관기부, 오피니언리더 후원)
- **경제학적 근거**: 기업 실적과 연동된 변동성 자산

#### **EBIT (Earnings Before Interest and Tax)**

- **정의**: PosMul 3LC의 세전영업이익
- **공식**: EBIT = Revenue - COGS - SG&A
- **역할**: PMC 발행량 결정의 기준점
- **계산**: 예상EBIT - 예상Tax(최고법인세율) - 예상Interest

### **MoneyWave 시스템**

#### **MoneyWave1: EBIT 기반 PMC 발행**

- **메커니즘**: 예상Return을 365일로 분할하여 일일 PMC 배분
- **공식**: 일일 PMC 발행량 = (위험조정수익률 × 자본총액) / 365
- **배분방식**: 당일 생성된 예측 게임별 성과에 따라 PMC 분배
- **경제학적 근거**: Efficient Market Hypothesis 적용

#### **MoneyWave2: 미사용 PMC 재분배**

- **메커니즘**: 일정기간 미사용 PMC를 재분배 풀로 전환
- **트리거**: Kahneman-Tversky Loss Aversion 활용한 사용 유인
- **재분배 방식**: 새로운 예측 게임 생성을 통한 재배분
- **경제학적 근거**: Endowment Effect 극복 메커니즘

#### **MoneyWave3: 기업가 생태계**

- **참여자**: 기업가 (ESG 마케팅 + 데이터 수집 목적)
- **제공 서비스**: 홍보서비스(Invest/MajorLeague), PMC 일정기간 제공
- **대가**: 일정 금액 지불
- **네트워크 효과**: Metcalfe's Law (네트워크 가치 = n²) 적용

### **경제학 이론 구현**

#### **Agency Theory (Jensen & Meckling, 1976)**

- **Principal**: 국민/시민
- **Agent**: 관료/정치인
- **문제**: 정보 비대칭 (Asymmetric Information)
- **해결책**: 예측 게임을 통한 집단지성 활용
- **측정지표**: Agency Cost Reduction Score

#### **CAPM (Capital Asset Pricing Model)**

- **공식**: E[R_PMC] = R_f + β(E[R_m] - R_f)
- **위험프리자산**: PMP
- **위험자산**: PMC
- **베타**: 플랫폼 리스크 계수
- **포트폴리오 최적화**: Markowitz Theory 적용

#### **공공선택이론 (Buchanan)**

- **Iron Triangle**: 관료-정치인-공급자 담합구조
- **극복 메커니즘**: PMC 시스템을 통한 예산 투명화
- **Median Voter Theorem**: 중위투표자 정리 기반 의사결정
- **직접민주주의**: 순수공공재 제외 영역에서 시민 직접 참여

#### **Prospect Theory (Kahneman-Tversky)**

- **가치함수**: v(x) = x^α (이득), -λ(-x)^β (손실)
- **손실회피 계수**: λ = 2.25 (실험 검증값)
- **적용영역**: PMP→PMC 전환 시 사용자 의사결정
- **Mental Accounting**: 포인트 계정별 분리 관리

#### **Network Economics (Metcalfe's Law)**

- **기본 공식**: 네트워크 가치 = n²
- **Reed's Law**: 부분집합 가치 = 2^n
- **Cross-Network Effect**: 다양한 사용자 그룹 간 상호작용
- **측정대상**: Local League, Major League, Cloud Funding 참여자

### **경제 활동 (Economic Activities)**

#### **PMP 획득 활동**

- **Major League**: 광고 시청, 브랜드 체험
- **Forum**: 뉴스 토론, 브레인스토밍, 예산 참여
- **Local League**: 지역 비즈니스 참여
- **Other**: 전문서비스 이용

#### **PMC 전환 활동**

- **예측 게임**: PMP 투입 → 예측 정확도에 따른 PMC 보상
- **사회적 학습**: 집단지성을 통한 정보 품질 향상
- **리스크 테이킹**: 불확실성 하에서의 의사결정

#### **PMC 사용 활동**

- **직접 기부**: 개인/단체에 직접 기부
- **기관 기부**: 공인된 기관을 통한 기부
- **오피니언리더 후원**: 영향력 있는 개인 지원
- **Ranking 시스템**: 기부 실적에 따른 사회적 지위

### **수리경제학 모델**

#### **개인 효용함수**

```
U(x) = α·ln(PMP) + β·ln(PMC) + γ·S(Donate)
```

- **α, β**: 포인트/코인에 대한 한계효용
- **γ**: 이타적 선호 (사회적 효용 가중치)
- **S(Donate)**: 기부로 인한 사회적 효용

#### **사회후생함수**

```
W = Σᵢ Uᵢ(x) + λ·Gini(distribution)
```

- **Σᵢ Uᵢ(x)**: 개인효용의 합
- **λ**: 사회적 형평성 가중치
- **Gini**: 분배 형평성 지수

#### **시장청산조건**

```
∑PMP_demand = ∑PMP_supply
∑PMC_demand = ∑PMC_supply + MoneyWave_total
```

#### **효율성 조건 (Pareto Optimality)**

```
MRS_PMP,PMC = MRT_PMP,PMC
```

## 🔄 **다른 Bounded Context와의 관계**

### **상류 (Upstream) Context**

- **User Context**: 사용자 프로필 및 선호도 데이터 수신
- **Auth Context**: 인증된 사용자 정보 수신

### **하류 (Downstream) Context**

- **Prediction Context**: 예측 게임 결과 → PMP/PMC 보상 계산
- **Donation Context**: PMC 기부 실행 및 Ranking 업데이트
- **Investment Context**: Local/Major League 활동 → PMP/PMC 획득

### **협력 (Partnership) Context**

- **Forum Context**: 토론 참여 → PMP 획득
- **Payment Context**: 실제 결제와 PMC 전환 연계

## 📊 **주요 메트릭 및 KPI**

### **경제 지표**

- **PMP/PMC 유통량**: 실시간 모니터링
- **전환율**: PMP → PMC 변환 성공률
- **Gini 계수**: 부의 분배 형평성
- **Social Welfare Score**: 사회후생 수준

### **Agency Theory 지표**

- **Information Asymmetry Score**: 정보 비대칭 개선도
- **Participation Rate**: 예측 게임 참여율
- **Accuracy Improvement**: 집단지성 효과

### **Network Effect 지표**

- **Metcalfe Value**: 네트워크 가치 측정
- **Connection Density**: 사용자 간 연결도
- **Cross-Network Multiplier**: 다중 네트워크 효과

### **Behavioral Economics 지표**

- **Loss Aversion Coefficient**: 개인별 손실회피도
- **Endowment Attachment**: 보유 효과 강도
- **Prospect Value**: 의사결정 만족도

## 🛡️ **리스크 관리**

### **시스템 리스크**

- **유동성 위험**: PMC 유통량 급변 대응
- **인플레이션 위험**: 과도한 PMC 발행 방지
- **버블 방지**: Shiller 지표 기반 조기 경보

### **행동경제학적 리스크**

- **게이밍 방지**: Mechanism Design Theory 적용
- **Incentive Compatibility**: 인센티브 호환성 확보
- **Moral Hazard**: 도덕적 해이 방지

## 🔮 **미래 확장 계획**

### **단기 (3-6개월)**

- 기본 PMP/PMC 시스템 구현
- MoneyWave1 메커니즘 완성
- 기초 효용함수 추정 시스템

### **중기 (6-12개월)**

- MoneyWave2/3 고도화
- 실증분석 프레임워크 완성
- 리스크 관리 시스템 고도화

### **장기 (12개월+)**

- 국가 경제 연계 실험
- 글로벌 네트워크 확장
- 학술 연구 결과 발표

---

이 Context는 PosMul Platform의 **경제적 실험**을 통해 기존 민주주의 시스템의 한계를 극복하고, **시민 직접 참여**를 통한 새로운 거버넌스 모델을 제시합니다. 모든 경제학적 설계는 **노벨경제학상 수상자들의 검증된 이론**을 바탕으로 하여 학술적 신뢰성을 확보했습니다.
