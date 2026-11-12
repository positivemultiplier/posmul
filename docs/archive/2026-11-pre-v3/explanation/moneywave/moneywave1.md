# MoneyWave1 (EBIT & 사회적 학습 기반 발행)

> **알고리즘 버전**: `v3_social_learning_time_weighted`  
> **운영 상태**: 일일 100,000 PMC 예산 기반 프로덕션 가동 중

---

## 1. 역할
- 플랫폼 연간 순이익(EBITDA)과 공론장 사회적 학습(토론·참여)을 기반으로, **일일 풀(100,000 PMC)과 시간당 가중치 풀**을 산출하여 예측 게임에 상금 유동성을 자동 공급합니다.
- 단순 일괄 배정이 아니라 **KST 활동 시간대 가중치**와 **사회적 학습 지수**에 비례하여 역동적으로 파도가 흐릅니다.

---

## 2. 일일 풀 산출 및 스냅샷 (`refresh_daily_money_wave_snapshot`)
- **연간 설정**: $\text{annual\_ebitda} = 36,500,000$ (원)
- **일일 총 발행량**:
  $$\text{Daily Total} = \frac{36,500,000}{365} = 100,000\text{ PMC}$$
- **기본 시간당 풀**:
  $$\text{Base Hourly} = \frac{100,000}{24} = 4,166.67\text{ PMC}$$
- **KST 활동 시간대 가중치**:
  - 새벽 (00~06시): $0.4\times$ ($1,667\text{ PMC/시간}$)
  - 주간 (06~18시): $1.0\times$ ($4,167\text{ PMC/시간}$)
  - 피크 (18~24시): $1.6\times$ ($6,667\text{ PMC/시간}$)

---

## 3. 게임별 배분 공식 (`compute_prediction_hourly_game_pools`)

$$\text{Weight}_g = \text{CategoryMult}_c \times \left(\frac{24}{H_g}\right)^{0.75} \times \text{UrgencyBoost}_g \times \Big( 0.40 + 0.30 P_g + 0.30 S_g \Big)$$

1. **기간 정규화 $(24 / H_g)^{0.75}$**: 진행 기간이 긴 게임이 아무 활동 없이 상금을 독식하지 않도록 단기 게임과 장기 게임 간 누적 균형 조정 (단일 게임 상한 $20,000\text{ PMC}$)
2. **카테고리 승수**: 정책/법안(POLITICS) 1.3x, 경제(ECONOMY) 1.2x, 시민제안(USER) 1.2x, 투자(INVEST) 1.1x, 스포츠/연예 1.0x
3. **사회적 학습 ($S_g$)**: 해당 예측 게임에 달린 토론 댓글 수 + 좋아요 수 + 최근 6시간 신규 댓글 수 비례 반영
4. **예측 참여도 ($P_g$)**: 누적 참여자 수 + 최근 6시간 신규 베팅 수 반영

---

## 4. 예측 정산 연계 (`calculate_reward_amount`)
- 게임 종료 정산 시 정답자에게 **베팅 풀 배당 + 누적 MoneyWave 상금 보너스**가 지급됩니다.
- **어뷰징 방지 캡**: 1인당 상금 보너스는 **본인 베팅 원금의 최대 $2.0\times$**로 제한되어, 소액 1인이 방 전체 상금을 독식하는 취약점을 방지합니다.

---

## 5. 관련 문서
- [MoneyWave v3 기술 명세서](MONEYWAVE_V3_SPECIFICATION.md)
- [MoneyWave 전체 개요](README.md)
- [경제 시스템 상세 문서](../../business/ECONOMY_SYSTEM_DETAIL.md)
