/**
 * 집단지성 · 사회선택 · 베이지안 학습 엔진 단위 테스트
 */
import {
  analyzeSocialChoiceAggregation,
  computeBayesianMarketPosterior,
  computeBayesianPosteriorTimeline,
  computeBrierLearningUpdate,
  evaluateExperienceBias,
  summarizeUserLearningProfile,
  type CollectiveOptionInput,
  type CollectiveParticipationSignal,
} from "../collective-intelligence-engine";

describe("CollectiveIntelligenceEngine", () => {
  describe("1. 베이지안 사후확률 업데이트 (Bayesian Updating)", () => {
    const options: CollectiveOptionInput[] = [
      { id: "opt-a", label: "인상", priorProbability: 0.5 },
      { id: "opt-b", label: "인하", priorProbability: 0.5 },
    ];

    it("소표본(1명 베팅) 시 확률이 100%로 폭주하지 않고 Prior로 안정화된다", () => {
      const result = computeBayesianMarketPosterior(options, [
        { selectedOptionId: "opt-a", stakeAmount: 1000, confidence: 0.9 },
      ]);

      const optA = result.options.find((o) => o.optionId === "opt-a")!;
      const optB = result.options.find((o) => o.optionId === "opt-b")!;

      expect(result.isLowSampleStabilized).toBe(true);
      expect(optA.rawVolumeProbability).toBe(0.99);
      expect(optA.bayesianProbability).toBeGreaterThan(0.5);
      expect(optA.bayesianProbability).toBeLessThan(0.8);
      expect(optA.bayesianProbability + optB.bayesianProbability).toBeCloseTo(
        1.0,
        2
      );
    });

    it("시간 감쇠와 예측자 스킬 가중치(skillWeight)가 사후 확률에 반영된다", () => {
      const now = new Date("2026-11-11T12:00:00Z");
      const oldSignal: CollectiveParticipationSignal = {
        selectedOptionId: "opt-a",
        stakeAmount: 1000,
        confidence: 0.7,
        skillWeight: 0.8,
        createdAt: new Date("2026-10-01T12:00:00Z"), // 41일 전 (시간 감쇠 크게 적용)
      };
      const recentSkilledSignal: CollectiveParticipationSignal = {
        selectedOptionId: "opt-b",
        stakeAmount: 1000,
        confidence: 0.85,
        skillWeight: 1.6,
        createdAt: new Date("2026-11-11T10:00:00Z"), // 2시간 전 + 고숙련자
      };

      const result = computeBayesianMarketPosterior(
        options,
        [oldSignal, recentSkilledSignal],
        { now }
      );

      const optA = result.options.find((o) => o.optionId === "opt-a")!;
      const optB = result.options.find((o) => o.optionId === "opt-b")!;

      expect(optB.bayesianProbability).toBeGreaterThan(optA.bayesianProbability);
    });

    it("시계열 베이지안 추이 궤적은 각 시점마다 합계 100%를 보존한다", () => {
      const timeline = computeBayesianPosteriorTimeline(options, [
        {
          selectedOptionId: "opt-a",
          stakeAmount: 500,
          confidence: 0.7,
          createdAt: "2026-11-11T09:00:00Z",
        },
        {
          selectedOptionId: "opt-b",
          stakeAmount: 1500,
          confidence: 0.8,
          createdAt: "2026-11-11T10:00:00Z",
        },
      ]);

      expect(timeline.length).toBe(3); // Prior + 2건
      for (const pt of timeline) {
        const sum = Number(pt["opt-a"]) + Number(pt["opt-b"]);
        expect(sum).toBe(100);
      }
    });
  });

  describe("2. 애로우 불가능성 · 콩도르세 · 보르다 투표 엔진", () => {
    const threeOptions: CollectiveOptionInput[] = [
      { id: "A", label: "후보 A (극단안)" },
      { id: "B", label: "후보 B (합의안)" },
      { id: "C", label: "후보 C (대안)" },
    ];

    it("단순 다수결 1위(A)를 다수가 최하위로 기피할 때 보르다·콩도르세가 합의 후보(B)를 찾아낸다", () => {
      // A 지지자 4명: A > B > C (C 기피)
      // B 지지자 3명: B > C > A (A 기피)
      // C 지지자 3명: C > B > A (A 기피)
      // => 단순 1순위 다수결: A(4표) > B(3표) = C(3표) -> A 승리
      // => 하지만 A는 6명에게 최하위(꼴찌)! 1:1 대결에서는 B가 A에 6:4 승, C에 7:3 승 => 콩도르세 & 보르다 모두 B 승리!
      const signals: CollectiveParticipationSignal[] = [
        ...Array.from({ length: 4 }, () => ({
          selectedOptionId: "A",
          rankedOptionIds: ["A", "B", "C"],
          avoidOptionId: "C",
          stakeAmount: 1000,
          confidence: 0.7,
        })),
        ...Array.from({ length: 3 }, () => ({
          selectedOptionId: "B",
          rankedOptionIds: ["B", "C", "A"],
          avoidOptionId: "A",
          stakeAmount: 1000,
          confidence: 0.7,
        })),
        ...Array.from({ length: 3 }, () => ({
          selectedOptionId: "C",
          rankedOptionIds: ["C", "B", "A"],
          avoidOptionId: "A",
          stakeAmount: 1000,
          confidence: 0.7,
        })),
      ];

      const analysis = analyzeSocialChoiceAggregation(threeOptions, signals);

      expect(analysis.pluralityWinnerId).toBe("A");
      expect(analysis.bordaWinnerId).toBe("B");
      expect(analysis.condorcetWinnerId).toBe("B");
      expect(analysis.hasCondorcetCycle).toBe(false);
      expect(analysis.arrowDivergenceAlert).toContain("엇갈렸습니다");
      expect(analysis.explicitRankedVoteCount).toBe(10);
    });

    it("A>B, B>C, C>A 콩도르세 순환 역설(Condorcet Cycle)을 정확히 탐지한다", () => {
      const cycleSignals: CollectiveParticipationSignal[] = [
        {
          selectedOptionId: "A",
          rankedOptionIds: ["A", "B", "C"],
          stakeAmount: 1000,
          confidence: 0.7,
        },
        {
          selectedOptionId: "B",
          rankedOptionIds: ["B", "C", "A"],
          stakeAmount: 1000,
          confidence: 0.7,
        },
        {
          selectedOptionId: "C",
          rankedOptionIds: ["C", "A", "B"],
          stakeAmount: 1000,
          confidence: 0.7,
        },
      ];

      const analysis = analyzeSocialChoiceAggregation(
        threeOptions,
        cycleSignals
      );

      expect(analysis.condorcetWinnerId).toBeNull();
      expect(analysis.hasCondorcetCycle).toBe(true);
      expect(analysis.arrowDivergenceAlert).toContain("순환 역설");
    });
  });

  describe("3. 경험의 편향 탐지 & Brier 지속 학습 루프", () => {
    it("소표본 환경에서 기저율·시장확률을 무시하고 과도한 확신(95%)을 입력하면 HIGH 편향 경고를 생성한다", () => {
      const report = evaluateExperienceBias({
        selectedOptionId: "opt-a",
        confidence: 0.95,
        stakeAmount: 2000,
        marketBayesianProbability: 0.35,
        optionPriorProbability: 0.3,
        totalParticipants: 4,
        recentOptionShare: 0.85,
        userCalibrationGap: 0.25,
        userPastSettledCount: 5,
      });

      expect(report.riskLevel).toBe("HIGH");
      expect(report.overconfidenceRisk).toBeGreaterThan(0.5);
      expect(report.baseRateNeglectRisk).toBeGreaterThan(0.5);
      expect(report.nudges.length).toBeGreaterThanOrEqual(2);
    });

    it("Brier Score와 EMA Skill Weight는 정확하고 교정된 예측자에게 높은 가중치(>1.0)를 부여한다", () => {
      const perfectBrier = computeBrierLearningUpdate({
        selectedOptionId: "A",
        correctOptionId: "A",
        confidence: 0.9,
        optionCount: 2,
      });
      const overconfidentMiss = computeBrierLearningUpdate({
        selectedOptionId: "A",
        correctOptionId: "B",
        confidence: 0.95,
        optionCount: 2,
      });

      expect(perfectBrier.brierScore).toBeLessThan(overconfidentMiss.brierScore);
      expect(perfectBrier.calibrationGap).toBeCloseTo(-0.1, 2);
      expect(overconfidentMiss.calibrationGap).toBeCloseTo(0.95, 2);

      // 꾸준히 80% 확신도로 5회 연속 적중한 사용자
      const expertProfile = summarizeUserLearningProfile(
        Array.from({ length: 6 }, (_, i) => ({
          selectedOptionId: "A",
          correctOptionId: i === 2 ? "B" : "A",
          confidence: 0.82,
          optionCount: 2,
          createdAt: new Date(2026, 10, i + 1),
        }))
      );

      // 95% 확신하고 계속 틀린 과신 사용자
      const biasedProfile = summarizeUserLearningProfile(
        Array.from({ length: 6 }, (_, i) => ({
          selectedOptionId: "A",
          correctOptionId: "B",
          confidence: 0.95,
          optionCount: 2,
          createdAt: new Date(2026, 10, i + 1),
        }))
      );

      expect(expertProfile.calibrationStatus).toBe("WELL_CALIBRATED");
      expect(expertProfile.skillWeight).toBeGreaterThan(1.0);
      expect(biasedProfile.calibrationStatus).toBe("OVERCONFIDENT");
      expect(biasedProfile.skillWeight).toBeLessThan(1.0);
      expect(expertProfile.skillWeight).toBeGreaterThan(biasedProfile.skillWeight);
    });
  });
});

