/**
 * PosMul Prediction Economic Model (Pure Domain Formulas)
 *
 * 기존 PosMul 핵심 경제학 이론의 단일 진실 공급원(Single Source of Truth):
 * 1. CAPM (Sharpe-Lintner-Mossin): E[R] = Rf + β(Rm - Rf), Jensen's Alpha, 포트폴리오 리스크 비율
 * 2. Agency Theory (Jensen & Meckling 1976): 정보 품질, 집단지성 효과, 독점 정보 프리미엄, Agency Cost 절감
 * 3. Behavioral Economics (Kahneman-Tversky Prospect Theory): 무위험 PMP 손실회피(λ=2.25) 완화, Calibration 보너스/과신 페널티
 * 4. MoneyWave 유동성 풀 기반 예상 수령 PMC 시뮬레이션
 */

export type PortfolioRiskLevel = "LOW" | "MEDIUM" | "HIGH";

export interface PortfolioRiskAssessment {
  readonly riskLevel: PortfolioRiskLevel;
  readonly riskScore: number; // 0 ~ 1
  readonly riskRatio: number; // stake / balance
  readonly recommendation: string;
}

export interface ProspectConfidenceAdjustmentResult {
  /** 적정 확신도 보너스 (0 ~ 0.20) */
  readonly confidenceBonus: number;
  /** 과신 페널티 크기 */
  readonly overconfidencePenalty: number;
  /** 적정 교정 점수 (1 - |confidence - accuracy|) */
  readonly calibrationScore: number;
  /** 현금 베팅(λ=2.25) 대비 무위험 PMP 손실회피 제거 비율 (0~1) */
  readonly lossAversionShieldRate: number;
}

export interface AgencyTheoryAdjustmentInput {
  readonly accuracy: number; // 0 ~ 1
  readonly confidence: number; // 0 ~ 1
  readonly totalParticipants: number;
  readonly totalCorrectPredictions: number;
}

export interface AgencyTheoryMetricsResult {
  readonly informationQuality: number;
  readonly collectiveIntelligenceBonus: number;
  readonly exclusivityBonus: number;
  readonly totalAdjustmentRate: number;
  /** 시민 집단지성이 정보 비대칭을 완화한 비율 (0 ~ 100%) */
  readonly agencyCostReductionPct: number;
}

export interface PredictionEconomicOptionInput {
  readonly id: string;
  readonly label: string;
  readonly probability: number; // 베이지안 또는 시장 확률 (0 ~ 1)
  readonly volume: number; // 해당 옵션 참여 PMP
}

export interface PredictionOptionEconomicMetrics {
  readonly optionId: string;
  readonly label: string;
  /** 옵션 고유 CAPM 베타 (정배 < 1.0, 중립 ≈ 1.0, 역배 > 1.0) */
  readonly capmBeta: number;
  /** CAPM 요구 수익률 E[R] = Rf + β(Rm - Rf) (소수, 예: 0.095 = +9.5%) */
  readonly capmRequiredReturn: number;
  /** MoneyWave + Parimutuel 기반 예상 총 배율 (x) */
  readonly expectedMultiplier: number;
  /** 확률 가중 기대 수익률 R_expected = p * multiplier - 1 */
  readonly marketExpectedReturn: number;
  /** Jensen's Alpha (초과 기대수익률 = R_expected - E[R]) */
  readonly jensenAlpha: number;
  /** Sharpe 유사 위험 조정 매력도 점수 */
  readonly sharpeScore: number;
  /** Agency Theory 소수 정보/독점 보너스 비율 (예: 0.06 = +6.0%) */
  readonly agencyExclusivityBonus: number;
  /** CAPM 위험 프리미엄 가산율 */
  readonly capmRiskPremium: number;
}

export interface PredictionMarketEconomySummary {
  /** 시장 대표(가중 평균) CAPM 베타 */
  readonly marketBeta: number;
  /** 무위험 수익률 Rf */
  readonly riskFreeRate: number;
  /** 시장 위험 프리미엄 (Rm - Rf) */
  readonly marketRiskPremium: number;
  /** 대표 CAPM 요구 수익률 */
  readonly averageRequiredReturn: number;
  /** Agency 정보 비대칭 해소율 (0 ~ 100%) */
  readonly agencyCostReductionPct: number;
  /** Prospect 손실회피(λ=2.25 → 1.0) 무위험 보호 활성화 */
  readonly prospectLossAversionMitigated: boolean;
  readonly options: readonly PredictionOptionEconomicMetrics[];
}

export interface ParticipationEconomySimulationInput {
  readonly selectedOptionId: string;
  readonly stakeAmount: number;
  readonly confidence: number; // 0 ~ 1
  readonly userPmpBalance: number;
  readonly totalVolume: number;
  readonly prizePool: number;
  readonly participantCount: number;
  readonly gameImportance?: number; // 1 ~ 5
  readonly marketEconomy: PredictionMarketEconomySummary;
}

export interface ParticipationEconomySimulationResult {
  readonly portfolioRisk: PortfolioRiskAssessment;
  readonly optionMetrics: PredictionOptionEconomicMetrics;
  readonly prospectAdjustment: ProspectConfidenceAdjustmentResult;
  readonly agencyMetrics: AgencyTheoryMetricsResult;
  /** 기본 MoneyWave + Parimutuel 예상 수령 PMC */
  readonly baseEstimatedPmc: number;
  /** Agency + Prospect Calibration + CAPM 프리미엄 최대 잠재 가산율 */
  readonly maxEconomicBonusRate: number;
  /** 경제학 모델 보너스 포함 최대 예상 수령 PMC */
  readonly maxPotentialPmc: number;
}

const DEFAULT_RISK_FREE_RATE = 0.03; // 무위험 수익률 3.0%
const DEFAULT_MARKET_RISK_PREMIUM = 0.06; // 시장 위험 프리미엄 6.0%

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

/**
 * CAPM 기반 포트폴리오 위험 평가
 * (PredictionEconomicService.calculateRiskAssessment 단일 진실 공급원)
 */
export function assessPortfolioRisk(
  currentBalance: number,
  requiredAmount: number
): PortfolioRiskAssessment {
  const safeBalance = Math.max(1, currentBalance);
  const safeStake = Math.max(0, requiredAmount);
  const riskRatio = safeStake / safeBalance;

  if (riskRatio <= 0.1) {
    return {
      riskLevel: "LOW",
      riskScore: Number((riskRatio * 5).toFixed(4)),
      riskRatio: Number(riskRatio.toFixed(4)),
      recommendation:
        "안정적인 참여 비중입니다. PMP 포트폴리오 분산이 양호합니다.",
    };
  }

  if (riskRatio <= 0.3) {
    return {
      riskLevel: "MEDIUM",
      riskScore: Number((0.5 + (riskRatio - 0.1) * 2.5).toFixed(4)),
      riskRatio: Number(riskRatio.toFixed(4)),
      recommendation:
        "중위험 참여 비중입니다. 확신도와 근거 데이터를 함께 점검하세요.",
    };
  }

  return {
    riskLevel: "HIGH",
    riskScore: Number(Math.min(1.0, 0.8 + (riskRatio - 0.3) * 0.5).toFixed(4)),
    riskRatio: Number(riskRatio.toFixed(4)),
    recommendation:
      "보유 PMP 대비 고위험 집중 참여입니다. 분산 참여를 권장합니다.",
  };
}

/**
 * Behavioral Economics (Kahneman-Tversky Prospect Theory) 확신도/과신 보정
 * (PredictionEconomicService.calculateConfidenceBonus 단일 진실 공급원)
 */
export function calculateProspectConfidenceAdjustment(
  expectedAccuracy: number,
  confidence: number
): ProspectConfidenceAdjustmentResult {
  const safeAcc = clamp(expectedAccuracy, 0, 1);
  const safeConf = clamp(confidence, 0, 1);

  const overconfidencePenalty = Math.max(0, safeConf - safeAcc);
  const calibrationScore = 1 - Math.abs(safeConf - safeAcc);
  const confidenceBonus = Math.max(
    0,
    calibrationScore * 0.2 - overconfidencePenalty * 0.1
  );

  return {
    confidenceBonus: Number(confidenceBonus.toFixed(4)),
    overconfidencePenalty: Number(overconfidencePenalty.toFixed(4)),
    calibrationScore: Number(calibrationScore.toFixed(4)),
    // 무위험 PMP 자산은 현금 손실 회피 계수(λ=2.25)의 직접 자본 훼손을 차단함
    lossAversionShieldRate: 1.0,
  };
}

/**
 * Agency Theory (Jensen & Meckling 1976) 정보 품질 및 비대칭 해소 보너스
 * (PredictionEconomicService.calculateAgencyTheoryAdjustment 단일 진실 공급원)
 */
export function calculateAgencyTheoryMetrics(
  input: AgencyTheoryAdjustmentInput
): AgencyTheoryMetricsResult {
  const safeAcc = clamp(input.accuracy, 0, 1);
  const safeConf = clamp(input.confidence, 0, 1);
  const safeParticipants = Math.max(0, input.totalParticipants);
  const safeCorrect = Math.max(0, input.totalCorrectPredictions);

  const informationQuality = safeAcc * safeConf;
  const collectiveIntelligenceBonus = Math.min(0.1, safeParticipants / 1000);
  const exclusivityBonus = safeCorrect > 0 ? Math.min(0.15, 1 / safeCorrect) : 0;

  const totalAdjustmentRate =
    informationQuality * 0.1 + collectiveIntelligenceBonus + exclusivityBonus;

  // 참여자 수와 평균 정보 품질이 높을수록 Principal-Agent 정보 비대칭 비용 감소
  const participationFactor = Math.min(1, safeParticipants / 60);
  const agencyCostReductionPct = Math.round(
    clamp((0.25 + 0.45 * participationFactor + 0.25 * informationQuality) * 100, 15, 92)
  );

  return {
    informationQuality: Number(informationQuality.toFixed(4)),
    collectiveIntelligenceBonus: Number(collectiveIntelligenceBonus.toFixed(4)),
    exclusivityBonus: Number(exclusivityBonus.toFixed(4)),
    totalAdjustmentRate: Number(totalAdjustmentRate.toFixed(4)),
    agencyCostReductionPct,
  };
}

/**
 * CAPM 위험 프리미엄 계산 (Sharpe-Lintner-Mossin)
 * (PredictionEconomicService.calculateCapmRiskPremium 단일 진실 공급원)
 */
export function calculateCapmRiskPremium(
  gameImportance: number,
  totalParticipants: number,
  accuracy: number
): number {
  const safeImportance = clamp(gameImportance, 1, 5);
  const safeParticipants = Math.max(0, totalParticipants);
  const safeAcc = clamp(accuracy, 0, 1);

  const beta = (safeImportance / 5) * Math.min(1.5, safeParticipants / 100);
  const marketRiskPremium = 0.03;
  const individualRiskAdjustment = safeAcc * 0.02;

  return Number((beta * marketRiskPremium + individualRiskAdjustment).toFixed(4));
}

/**
 * 예상 배당 배율 (MoneyWave 유동성 시드 + Parimutuel 구조)
 */
export function calculateSeededMultiplier(
  targetOptionVolume: number,
  totalAllOptionsVolume: number,
  moneyWavePool: number = 5000,
  feeRate: number = 0.02
): number {
  const effectiveTarget = Math.max(targetOptionVolume, 1000);
  const otherStake = Math.max(0, totalAllOptionsVolume - targetOptionVolume);
  const distributablePool = otherStake + Math.max(0, moneyWavePool);
  const grossMultiplier = 1 + distributablePool / effectiveTarget;
  return Number(Math.max(1.01, grossMultiplier * (1 - feeRate)).toFixed(2));
}

/**
 * 예측 게임 전체 및 옵션별 CAPM · Agency · Prospect 경제학 분석
 */
export function analyzePredictionCapmAndEconomy(input: {
  readonly options: readonly PredictionEconomicOptionInput[];
  readonly totalVolume: number;
  readonly participantCount: number;
  readonly prizePool: number;
  readonly gameImportance?: number;
  readonly normalizedEntropy?: number;
  readonly userConfidence?: number;
}): PredictionMarketEconomySummary {
  const optionCount = Math.max(2, input.options.length);
  const safeImportance = clamp(input.gameImportance ?? (optionCount >= 4 ? 4 : 3), 1, 5);
  const safeParticipants = Math.max(1, input.participantCount);
  const safeEntropy = clamp(input.normalizedEntropy ?? 0.65, 0.05, 1.0);
  const safeConf = clamp(input.userConfidence ?? 0.7, 0.1, 0.99);

  // 게임 거시 베타: 중요도, 시장 엔트로피(불확실성), 참여 깊이 결합
  const baseGameBeta = clamp(
    0.55 + (safeImportance / 5) * 0.45 + safeEntropy * 0.35 - Math.min(0.2, safeParticipants / 500),
    0.5,
    1.8
  );

  const optionMetrics: PredictionOptionEconomicMetrics[] = input.options.map((opt) => {
    const p = clamp(opt.probability, 0.02, 0.98);
    // 역배/소수 옵션(p가 낮을수록) 체계적 위험 변동성(Beta)이 높음
    const relativeDispersion = (1 - p) / (1 - 1 / optionCount);
    const capmBeta = Number(clamp(baseGameBeta * (0.65 + 0.55 * relativeDispersion), 0.4, 2.4).toFixed(2));
    const capmRequiredReturn = Number(
      (DEFAULT_RISK_FREE_RATE + capmBeta * DEFAULT_MARKET_RISK_PREMIUM).toFixed(4)
    );

    const expectedMultiplier = calculateSeededMultiplier(
      opt.volume,
      input.totalVolume,
      Math.max(5000, input.prizePool),
      0.02
    );

    // 실질 위험 중립 대비 기대 수익률: p * multiplier - 1
    const marketExpectedReturn = Number(clamp(p * expectedMultiplier - 1, -0.5, 4.0).toFixed(4));
    const jensenAlpha = Number((marketExpectedReturn - capmRequiredReturn).toFixed(4));

    // 옵션의 이항 표준편차 sqrt(p*(1-p)) 대비 초과수익률(Sharpe 유사 지수)
    const sigma = Math.max(0.12, Math.sqrt(p * (1 - p)) * 1.4);
    const sharpeScore = Number(((marketExpectedReturn - DEFAULT_RISK_FREE_RATE) / sigma).toFixed(2));

    const estCorrectCount = Math.max(1, Math.round(safeParticipants * p));
    const agency = calculateAgencyTheoryMetrics({
      accuracy: p,
      confidence: safeConf,
      totalParticipants: safeParticipants,
      totalCorrectPredictions: estCorrectCount,
    });

    const capmRiskPremium = calculateCapmRiskPremium(
      safeImportance,
      safeParticipants,
      p
    );

    return {
      optionId: opt.id,
      label: opt.label,
      capmBeta,
      capmRequiredReturn,
      expectedMultiplier,
      marketExpectedReturn,
      jensenAlpha,
      sharpeScore,
      agencyExclusivityBonus: agency.exclusivityBonus,
      capmRiskPremium,
    };
  });

  // 시장 가중 평균 CAPM 베타 & 요구수익률
  let weightedBetaSum = 0;
  let probSum = 0;
  optionMetrics.forEach((m, idx) => {
    const p = clamp(input.options[idx]?.probability ?? 1 / optionCount, 0.01, 0.99);
    weightedBetaSum += m.capmBeta * p;
    probSum += p;
  });
  const marketBeta = Number((probSum > 0 ? weightedBetaSum / probSum : baseGameBeta).toFixed(2));
  const averageRequiredReturn = Number(
    (DEFAULT_RISK_FREE_RATE + marketBeta * DEFAULT_MARKET_RISK_PREMIUM).toFixed(4)
  );

  const marketAgency = calculateAgencyTheoryMetrics({
    accuracy: clamp(1 - safeEntropy * 0.4, 0.35, 0.9),
    confidence: safeConf,
    totalParticipants: safeParticipants,
    totalCorrectPredictions: Math.max(1, Math.round(safeParticipants * 0.45)),
  });

  return {
    marketBeta,
    riskFreeRate: DEFAULT_RISK_FREE_RATE,
    marketRiskPremium: DEFAULT_MARKET_RISK_PREMIUM,
    averageRequiredReturn,
    agencyCostReductionPct: marketAgency.agencyCostReductionPct,
    prospectLossAversionMitigated: true,
    options: optionMetrics,
  };
}

/**
 * 참여 패널 실시간 경제학 시뮬레이션 (CAPM + Agency + Prospect + MoneyWave)
 */
export function evaluateOptionParticipationEconomics(
  input: ParticipationEconomySimulationInput
): ParticipationEconomySimulationResult {
  const safeStake = Math.max(0, input.stakeAmount);
  const safeConf = clamp(input.confidence, 0.1, 0.99);

  const portfolioRisk = assessPortfolioRisk(input.userPmpBalance, safeStake);
  const optionMetrics =
    input.marketEconomy.options.find((o) => o.optionId === input.selectedOptionId) ??
    input.marketEconomy.options[0] ?? {
      optionId: input.selectedOptionId,
      label: "선택 옵션",
      capmBeta: 1.0,
      capmRequiredReturn: DEFAULT_RISK_FREE_RATE + DEFAULT_MARKET_RISK_PREMIUM,
      expectedMultiplier: 1.8,
      marketExpectedReturn: 0.15,
      jensenAlpha: 0.06,
      sharpeScore: 0.5,
      agencyExclusivityBonus: 0.04,
      capmRiskPremium: 0.03,
    };

  // 현재 시장 확률을 1차 기대 정확도로 간주해 과신 vs 적정 보너스 계산
  const impliedProb = clamp(
    (optionMetrics.marketExpectedReturn + 1) / Math.max(1.01, optionMetrics.expectedMultiplier),
    0.05,
    0.95
  );

  const prospectAdjustment = calculateProspectConfidenceAdjustment(impliedProb, safeConf);
  const estCorrectCount = Math.max(1, Math.round(Math.max(1, input.participantCount) * impliedProb));
  const agencyMetrics = calculateAgencyTheoryMetrics({
    accuracy: impliedProb,
    confidence: safeConf,
    totalParticipants: Math.max(1, input.participantCount),
    totalCorrectPredictions: estCorrectCount,
  });

  const baseEstimatedPmc = Math.round(safeStake * optionMetrics.expectedMultiplier);
  const maxEconomicBonusRate = Number(
    clamp(
      prospectAdjustment.confidenceBonus +
        agencyMetrics.exclusivityBonus * 0.5 +
        optionMetrics.capmRiskPremium * 0.5,
      0,
      0.35
    ).toFixed(4)
  );
  const maxPotentialPmc = Math.round(baseEstimatedPmc * (1 + maxEconomicBonusRate));

  return {
    portfolioRisk,
    optionMetrics,
    prospectAdjustment,
    agencyMetrics,
    baseEstimatedPmc,
    maxEconomicBonusRate,
    maxPotentialPmc,
  };
}

