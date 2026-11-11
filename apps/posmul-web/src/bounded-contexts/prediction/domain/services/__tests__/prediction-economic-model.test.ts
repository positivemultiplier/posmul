import {
  analyzePredictionCapmAndEconomy,
  assessPortfolioRisk,
  calculateAgencyTheoryMetrics,
  calculateCapmRiskPremium,
  calculateProspectConfidenceAdjustment,
  evaluateOptionParticipationEconomics,
} from "../prediction-economic-model";

describe("prediction-economic-model (CAPM · Agency · Prospect)", () => {
  test("보유 PMP 대비 참여 비중에 따라 LOW / MEDIUM / HIGH 리스크를 정확히 판정한다", () => {
    expect(assessPortfolioRisk(10000, 1000).riskLevel).toBe("LOW");
    expect(assessPortfolioRisk(10000, 2500).riskLevel).toBe("MEDIUM");
    expect(assessPortfolioRisk(10000, 5000).riskLevel).toBe("HIGH");
  });

  test("Prospect Calibration은 적정 확신도에 보너스를 주고 과신에는 페널티를 부과한다", () => {
    const wellCalibrated = calculateProspectConfidenceAdjustment(0.7, 0.7);
    const overconfident = calculateProspectConfidenceAdjustment(0.4, 0.95);

    expect(wellCalibrated.confidenceBonus).toBeCloseTo(0.2, 4);
    expect(wellCalibrated.overconfidencePenalty).toBe(0);
    expect(overconfident.overconfidencePenalty).toBeCloseTo(0.55, 4);
    expect(overconfident.confidenceBonus).toBeLessThan(wellCalibrated.confidenceBonus);
    expect(wellCalibrated.lossAversionShieldRate).toBe(1.0);
  });

  test("Agency Theory는 소수 정답(역배팅)일수록 높은 독점 정보 보너스를 부여한다", () => {
    const minorityWin = calculateAgencyTheoryMetrics({
      accuracy: 1,
      confidence: 0.85,
      totalParticipants: 100,
      totalCorrectPredictions: 8,
    });
    const majorityWin = calculateAgencyTheoryMetrics({
      accuracy: 1,
      confidence: 0.85,
      totalParticipants: 100,
      totalCorrectPredictions: 80,
    });

    expect(minorityWin.exclusivityBonus).toBeGreaterThan(majorityWin.exclusivityBonus);
    expect(minorityWin.agencyCostReductionPct).toBeGreaterThan(50);
  });

  test("CAPM 시장 분석은 저확률·역배 옵션에 더 높은 베타(β)와 요구수익률을 배정한다", () => {
    const summary = analyzePredictionCapmAndEconomy({
      options: [
        { id: "fav", label: "정배", probability: 0.72, volume: 72000 },
        { id: "dog", label: "역배", probability: 0.28, volume: 28000 },
      ],
      totalVolume: 100000,
      participantCount: 80,
      prizePool: 30000,
      gameImportance: 4,
      normalizedEntropy: 0.85,
      userConfidence: 0.75,
    });

    const fav = summary.options.find((o) => o.optionId === "fav")!;
    const dog = summary.options.find((o) => o.optionId === "dog")!;

    expect(dog.capmBeta).toBeGreaterThan(fav.capmBeta);
    expect(dog.capmRequiredReturn).toBeGreaterThan(fav.capmRequiredReturn);
    expect(calculateCapmRiskPremium(4, 80, 0.7)).toBeGreaterThan(0);

    const sim = evaluateOptionParticipationEconomics({
      selectedOptionId: "dog",
      stakeAmount: 1000,
      confidence: 0.75,
      userPmpBalance: 10000,
      totalVolume: 100000,
      prizePool: 30000,
      participantCount: 80,
      gameImportance: 4,
      marketEconomy: summary,
    });

    expect(sim.portfolioRisk.riskLevel).toBe("LOW");
    expect(sim.baseEstimatedPmc).toBeGreaterThan(1000);
    expect(sim.maxPotentialPmc).toBeGreaterThanOrEqual(sim.baseEstimatedPmc);
  });
});

