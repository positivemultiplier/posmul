/**
 * Agency Theory Engine - Unit Tests
 * Jensen & Meckling (1976) Agency Theory 도메인 서비스 테스트
 *
 * DDD 테스트 원칙:
 * - 도메인 계층에서는 Mock 사용 금지 (순수 단위 테스트)
 * - 비즈니스 로직의 정확성 검증
 * - Value Object의 불변성 확인
 * - 도메인 규칙 준수 검증
 */
import {
  createPmpAmount,
  createPredictionAccuracy,
  unwrapPmcAmount,
} from "../../value-objects";
import {
  AgencyTheoryConfig,
  AgencyTheoryEngine,
} from "../agency-theory.service";
import {
  IAgencyMetrics,
  IPredictionData,
  IPredictionParticipant,
} from "../interfaces/agency-theory.interface";

describe("AgencyTheoryEngine", () => {
  let engine: AgencyTheoryEngine;
  let defaultConfig: AgencyTheoryConfig;

  // Helper functions for test data creation
  const createMockPredictionData = (
    overrides: Partial<IPredictionData> = {}
  ): IPredictionData => ({
    predictionAccuracy: createPredictionAccuracy(0.8),
    socialLearningIndex: 0.7,
    informationTransparency: 0.6,
    ...overrides,
  });

  const createMockParticipant = (
    overrides: Partial<IPredictionParticipant> = {}
  ): IPredictionParticipant => ({
    userId: "user-123",
    predictionAccuracy: createPredictionAccuracy(0.75),
    participationCount: 10,
    consensusContribution: 0.8,
    reputationScore: 0.9,
    ...overrides,
  });

  beforeEach(() => {
    defaultConfig = {
      baseConversionRate: 0.5,
      maxConversionRate: 1.0,
      socialLearningWeight: 0.3,
      accuracyWeight: 0.4,
      transparencyWeight: 0.3,
      agencyCostThreshold: 0.7,
    };

    engine = new AgencyTheoryEngine(defaultConfig);
  });

  describe("configuration validation", () => {
    it("should_accept_valid_configuration_when_all_parameters_are_correct", () => {
      expect(() => new AgencyTheoryEngine(defaultConfig)).not.toThrow();
    });

    it("should_reject_configuration_when_base_rate_exceeds_max_rate", () => {
      const invalidConfig = {
        ...defaultConfig,
        baseConversionRate: 1.5,
        maxConversionRate: 1.0,
      };

      expect(() => new AgencyTheoryEngine(invalidConfig)).toThrow(
        "Invalid baseConversionRate"
      );
    });

    it("should_reject_configuration_when_max_rate_exceeds_limit", () => {
      const invalidConfig = {
        ...defaultConfig,
        maxConversionRate: 2.5,
      };

      expect(() => new AgencyTheoryEngine(invalidConfig)).toThrow(
        "maxConversionRate should not exceed 2.0"
      );
    });

    it("should_reject_configuration_when_weights_do_not_sum_to_one", () => {
      const invalidConfig = {
        ...defaultConfig,
        socialLearningWeight: 0.4,
        accuracyWeight: 0.4,
        transparencyWeight: 0.4, // Sum = 1.2
      };

      expect(() => new AgencyTheoryEngine(invalidConfig)).toThrow(
        "Weight sum should equal 1.0"
      );
    });
  });

  describe("PmpAmount to PmcAmount conversion", () => {
    const createMockPredictionData = (
      overrides: Partial<IPredictionData> = {}
    ): IPredictionData => ({
      predictionAccuracy: createPredictionAccuracy(0.8),
      socialLearningIndex: 0.7,
      informationTransparency: 0.6,
      ...overrides,
    });

    const createMockParticipant = (
      overrides: Partial<IPredictionParticipant> = {}
    ): IPredictionParticipant => ({
      userId: "user-123",
      predictionAccuracy: createPredictionAccuracy(0.75),
      participationCount: 10,
      consensusContribution: 0.8,
      reputationScore: 0.9,
      ...overrides,
    });

    it("should_convert_PmpAmount_to_PmcAmount_when_high_quality_prediction_data_provided", async () => {
      // Arrange
      const pmpInput = createPmpAmount(100);
      const predictionData = createMockPredictionData({
        predictionAccuracy: createPredictionAccuracy(0.9),
        socialLearningIndex: 0.8,
        informationTransparency: 0.9,
      });
      const participants = [
        createMockParticipant({
          predictionAccuracy: createPredictionAccuracy(0.85),
        }),
        createMockParticipant({
          predictionAccuracy: createPredictionAccuracy(0.9),
        }),
      ];

      // Act
      const result = await engine.convertPmpAmountToPmcAmount(
        pmpInput,
        predictionData,
        participants
      );

      // Assert
      expect(result.success).toBe(true);

      if (result.success) {
        const conversion = result.data;
        expect(conversion.pmpInput).toBe(pmpInput);
        expect(unwrapPmcAmount(conversion.pmcOutput)).toBeGreaterThan(50); // 기본 전환율 이상
        expect(conversion.conversionRate).toBeGreaterThan(0.5);
        expect(conversion.bonusMultiplier).toBeGreaterThan(1.0);
        expect(conversion.agencyMetrics).toBeDefined();
        expect(conversion.timestamp).toBeInstanceOf(Date);
      }
    });

    it("should_apply_lower_conversion_rate_when_poor_agency_metrics", async () => {
      // Arrange
      const pmpInput = createPmpAmount(100);
      const predictionData = createMockPredictionData({
        predictionAccuracy: createPredictionAccuracy(0.3), // 낮은 정확도
        socialLearningIndex: 0.2, // 낮은 사회적 학습
        informationTransparency: 0.3, // 낮은 투명성
      });
      const participants = [
        createMockParticipant({
          predictionAccuracy: createPredictionAccuracy(0.3),
          reputationScore: 0.2,
        }),
      ];

      // Act
      const result = await engine.convertPmpAmountToPmcAmount(
        pmpInput,
        predictionData,
        participants
      );

      // Assert
      expect(result.success).toBe(true);

      if (result.success) {
        const conversion = result.data;
        expect(conversion.conversionRate).toBeLessThan(0.6); // 낮은 전환율
        expect(conversion.bonusMultiplier).toBeLessThan(1.5); // 낮은 보너스
        expect(conversion.agencyMetrics.informationAsymmetry).toBeGreaterThan(
          0.5
        );
        expect(conversion.agencyMetrics.agentAlignment).toBeLessThan(0.5);
      }
    });

    it("should_calculate_social_learning_bonus_based_on_participant_quality", async () => {
      // Arrange
      const pmpInput = createPmpAmount(100);
      const predictionData = createMockPredictionData();

      const highQualityParticipants = Array.from({ length: 10 }, (_, i) =>
        createMockParticipant({
          userId: `high-quality-${i}`,
          predictionAccuracy: createPredictionAccuracy(0.9),
          reputationScore: 0.9,
        })
      );

      const lowQualityParticipants = [
        createMockParticipant({
          predictionAccuracy: createPredictionAccuracy(0.3),
          reputationScore: 0.2,
        }),
      ];

      // Act
      const highQualityResult = await engine.convertPmpAmountToPmcAmount(
        pmpInput,
        predictionData,
        highQualityParticipants
      );
      const lowQualityResult = await engine.convertPmpAmountToPmcAmount(
        pmpInput,
        predictionData,
        lowQualityParticipants
      );

      // Assert
      expect(highQualityResult.success && lowQualityResult.success).toBe(true);

      if (highQualityResult.success && lowQualityResult.success) {
        expect(highQualityResult.data.bonusMultiplier).toBeGreaterThan(
          lowQualityResult.data.bonusMultiplier
        );
      }
    });
  });

  describe("agency metrics calculation", () => {
    it("should_calculate_correct_agency_metrics_when_given_prediction_data", async () => {
      // Arrange
      const pmpInput = createPmpAmount(100);
      const predictionData = createMockPredictionData({
        predictionAccuracy: createPredictionAccuracy(0.8),
        socialLearningIndex: 0.7,
        informationTransparency: 0.9,
      });
      const participants = [
        createMockParticipant({
          predictionAccuracy: createPredictionAccuracy(0.8),
        }),
      ];

      // Act
      const result = await engine.convertPmpAmountToPmcAmount(
        pmpInput,
        predictionData,
        participants
      );

      // Assert
      expect(result.success).toBe(true);

      if (result.success) {
        const metrics = result.data.agencyMetrics;

        expect(metrics.informationAsymmetry).toBeGreaterThanOrEqual(0);
        expect(metrics.informationAsymmetry).toBeLessThanOrEqual(1);

        expect(metrics.agentAlignment).toBeGreaterThanOrEqual(0);
        expect(metrics.agentAlignment).toBeLessThanOrEqual(1);

        expect(metrics.agencyCostReduction).toBeGreaterThanOrEqual(0);
        expect(metrics.agencyCostReduction).toBeLessThanOrEqual(1);

        expect(metrics.predictionAccuracy).toBe(0.8);
        expect(metrics.socialLearningIndex).toBe(0.7);
        expect(metrics.informationTransparency).toBe(0.9);
      }
    });

    it("should_have_lower_information_asymmetry_when_high_transparency_and_accuracy", async () => {
      // Arrange
      const pmpInput = createPmpAmount(100);
      const highTransparencyData = createMockPredictionData({
        predictionAccuracy: createPredictionAccuracy(0.9),
        informationTransparency: 0.9,
      });
      const lowTransparencyData = createMockPredictionData({
        predictionAccuracy: createPredictionAccuracy(0.3),
        informationTransparency: 0.3,
      });
      const participants = [createMockParticipant()];

      // Act
      const highResult = await engine.convertPmpAmountToPmcAmount(
        pmpInput,
        highTransparencyData,
        participants
      );
      const lowResult = await engine.convertPmpAmountToPmcAmount(
        pmpInput,
        lowTransparencyData,
        participants
      );

      // Assert
      expect(highResult.success && lowResult.success).toBe(true);

      if (highResult.success && lowResult.success) {
        expect(highResult.data.agencyMetrics.informationAsymmetry).toBeLessThan(
          lowResult.data.agencyMetrics.informationAsymmetry
        );
      }
    });
  });

  describe("improvement recommendations", () => {
    it("should_generate_recommendations_when_metrics_need_improvement", () => {
      // Arrange
      const poorMetrics: IAgencyMetrics = {
        informationAsymmetry: 0.8, // 높은 정보 비대칭
        agentAlignment: 0.3, // 낮은 정렬
        agencyCostReduction: 0.4, // 낮은 비용 감소
        predictionAccuracy: 0.5,
        socialLearningIndex: 0.4,
        informationTransparency: 0.3,
      };

      // Act
      const recommendations =
        engine.generateImprovementRecommendations(poorMetrics);

      // Assert
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.some((rec) => rec.includes("투명성"))).toBe(true);
      expect(recommendations.some((rec) => rec.includes("참여"))).toBe(true);
      expect(recommendations.some((rec) => rec.includes("인센티브"))).toBe(
        true
      );
    });

    it("should_generate_fewer_recommendations_when_metrics_are_good", () => {
      // Arrange
      const goodMetrics: IAgencyMetrics = {
        informationAsymmetry: 0.2, // 낮은 정보 비대칭
        agentAlignment: 0.8, // 높은 정렬
        agencyCostReduction: 0.9, // 높은 비용 감소
        predictionAccuracy: 0.9,
        socialLearningIndex: 0.8,
        informationTransparency: 0.9,
      };

      // Act
      const recommendations =
        engine.generateImprovementRecommendations(goodMetrics);

      // Assert
      expect(recommendations.length).toBeLessThan(3); // 적은 수의 권장사항
    });
  });

  describe("effectiveness measurement", () => {
    it("should_measure_effectiveness_when_given_historical_metrics", () => {
      // Arrange
      const createMetrics = (
        agencyCostReduction: number,
        informationAsymmetry: number
      ): IAgencyMetrics => ({
        informationAsymmetry,
        agentAlignment: 0.7,
        agencyCostReduction,
        predictionAccuracy: 0.8,
        socialLearningIndex: 0.6,
        informationTransparency: 0.7,
      });

      const historicalMetrics = [
        // 초기 상태 (낮은 성능)
        ...Array(10)
          .fill(null)
          .map(() => createMetrics(0.4, 0.8)),
        // 개선된 상태 (높은 성능)
        ...Array(10)
          .fill(null)
          .map(() => createMetrics(0.8, 0.3)),
      ];

      // Act
      const effectiveness = engine.measureEffectiveness(historicalMetrics, 10);

      // Assert
      expect(effectiveness.agencyCostTrend).toBeGreaterThan(0); // 개선 추세
      expect(effectiveness.informationSymmetryImprovement).toBeGreaterThan(0); // 정보 대칭성 개선
      expect(effectiveness.overallEffectiveness).toBeGreaterThan(0.5); // 전반적 개선
    });

    it("should_return_neutral_effectiveness_when_insufficient_data", () => {
      // Arrange
      const singleMetric: IAgencyMetrics = {
        informationAsymmetry: 0.5,
        agentAlignment: 0.5,
        agencyCostReduction: 0.5,
        predictionAccuracy: 0.5,
        socialLearningIndex: 0.5,
        informationTransparency: 0.5,
      };

      // Act
      const effectiveness = engine.measureEffectiveness([singleMetric]);

      // Assert
      expect(effectiveness.agencyCostTrend).toBe(0);
      expect(effectiveness.informationSymmetryImprovement).toBe(0);
      expect(effectiveness.participationGrowthRate).toBe(0);
      expect(effectiveness.overallEffectiveness).toBe(0.5);
    });
  });
});
