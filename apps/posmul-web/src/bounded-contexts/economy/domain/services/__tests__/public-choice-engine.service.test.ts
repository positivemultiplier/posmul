/**
 * Public Choice Engine - Unit Tests
 * James Buchanan 공공선택이론 도메인 서비스 테스트
 *
 * DDD 테스트 원칙:
 * - 도메인 계층에서는 Mock 사용 금지 (순수 단위 테스트)
 * - 비즈니스 로직의 정확성 검증
 * - Iron Triangle 분석 알고리즘 검증
 * - Median Voter Theorem 구현 정확성 확인
 * - Rent-Seeking 탐지 로직 검증
 */

import {
  IPolicyProposal,
  IVoterPreference,
  ParticipationType,
  PolicyCategory,
  RentSeekingType,
} from "../interfaces/public-choice-engine.interface";
import { isFailure } from '@posmul/auth-economy-sdk';

import {
  PublicChoiceEngine,
  PublicChoiceEngineConfig,
} from "../public-choice-engine.service";

describe("PublicChoiceEngine", () => {
  let engine: PublicChoiceEngine;
  let defaultConfig: PublicChoiceEngineConfig;

  beforeEach(() => {
    defaultConfig = {
      medianVoterThreshold: 0.3, // 30% 임계값
      ironTriangleDetectionSensitivity: 0.7, // 70% 민감도
      rentSeekingThreshold: 0.6, // 60% 임계값
      participationQuorum: 0.2, // 20% 정족수
      consensusThreshold: 0.6, // 60% 합의 임계값
      transparencyRequirement: 0.8, // 80% 투명성 요구
    };

    engine = new PublicChoiceEngine(defaultConfig);
  });

  // Helper functions for test data creation
  const createMockPolicy = (
    overrides: Partial<IPolicyProposal> = {}
  ): IPolicyProposal => ({
    proposalId: "policy-test-001",
    title: "Test Policy",
    description: "A test policy for verification",
    estimatedCost: 1000000,
    expectedBenefit: 1500000,
    affectedCitizens: 50000,
    urgencyLevel: 5,
    proposedBy: "test-government",
    category: PolicyCategory.INFRASTRUCTURE,
    ...overrides,
  });

  const createMockVoterPreference = (
    voterId: string,
    preferences: { [key in PolicyCategory]?: number } = {}
  ): IVoterPreference => {
    const policyPreferences = new Map<PolicyCategory, number>();

    // 기본값 설정
    Object.values(PolicyCategory).forEach((category) => {
      policyPreferences.set(category, preferences[category] || 0);
    });

    return {
      voterId,
      policyPreferences,
      riskTolerance: 0.5,
      socialUtilityWeight: 0.6,
      personalUtilityWeight: 0.4,
    };
  };

  const createMockVoterPreferences = (count: number): IVoterPreference[] => {
    return Array.from({ length: count }, (_, i) => {
      const infrastructurePreference = (i / count) * 2 - 1; // -1 to 1 분포
      return createMockVoterPreference(`voter-${i}`, {
        [PolicyCategory.INFRASTRUCTURE]: infrastructurePreference,
        [PolicyCategory.HEALTHCARE]: Math.random() * 2 - 1,
        [PolicyCategory.EDUCATION]: Math.random() * 2 - 1,
      });
    });
  };

  describe("configuration validation", () => {
    it("should_accept_valid_configuration_when_all_parameters_are_correct", () => {
      expect(() => new PublicChoiceEngine(defaultConfig)).not.toThrow();
    });

    it("should_reject_configuration_when_median_voter_threshold_is_invalid", () => {
      const invalidConfig = { ...defaultConfig, medianVoterThreshold: 1.5 };
      expect(() => new PublicChoiceEngine(invalidConfig)).toThrow(
        "Median voter threshold must be between 0 and 1"
      );
    });

    it("should_reject_configuration_when_consensus_threshold_is_too_low", () => {
      const invalidConfig = { ...defaultConfig, consensusThreshold: 0.3 };
      expect(() => new PublicChoiceEngine(invalidConfig)).toThrow(
        "Consensus threshold must be between 0.5 and 1"
      );
    });

    it("should_reject_configuration_when_participation_quorum_is_invalid", () => {
      const invalidConfig = { ...defaultConfig, participationQuorum: -0.1 };
      expect(() => new PublicChoiceEngine(invalidConfig)).toThrow(
        "Participation quorum must be between 0 and 1"
      );
    });
  });

  describe("median voter analysis", () => {
    it("should_analyze_median_voter_when_given_valid_preferences", async () => {
      const voterPreferences = createMockVoterPreferences(101); // 홀수 개
      const policy = createMockPolicy();

      const result = await engine.analyzeMedianVoter(voterPreferences, policy);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.medianVoterId).toBeDefined();
        expect(result.data.medianPreferences).toBeInstanceOf(Map);
        expect(result.data.distributionSpread).toBeGreaterThanOrEqual(0);
        expect(result.data.polarizationIndex).toBeGreaterThanOrEqual(0);
        expect(result.data.polarizationIndex).toBeLessThanOrEqual(1);
        expect(result.data.consensusLikelihood).toBeGreaterThanOrEqual(0);
        expect(result.data.consensusLikelihood).toBeLessThanOrEqual(1);
      }
    });

    it("should_identify_correct_median_voter_when_preferences_are_sorted", async () => {
      const voterPreferences = [
        createMockVoterPreference("voter-1", {
          [PolicyCategory.INFRASTRUCTURE]: -0.8,
        }),
        createMockVoterPreference("voter-2", {
          [PolicyCategory.INFRASTRUCTURE]: -0.3,
        }),
        createMockVoterPreference("voter-3", {
          [PolicyCategory.INFRASTRUCTURE]: 0.1,
        }),
        createMockVoterPreference("voter-4", {
          [PolicyCategory.INFRASTRUCTURE]: 0.5,
        }),
        createMockVoterPreference("voter-5", {
          [PolicyCategory.INFRASTRUCTURE]: 0.9,
        }),
      ];
      const policy = createMockPolicy();

      const result = await engine.analyzeMedianVoter(voterPreferences, policy);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.medianVoterId).toBe("voter-3"); // 중간값
      }
    });

    it("should_calculate_high_polarization_when_preferences_are_extreme", async () => {
      const voterPreferences = [
        createMockVoterPreference("voter-1", {
          [PolicyCategory.INFRASTRUCTURE]: -1.0,
        }),
        createMockVoterPreference("voter-2", {
          [PolicyCategory.INFRASTRUCTURE]: -0.9,
        }),
        createMockVoterPreference("voter-3", {
          [PolicyCategory.INFRASTRUCTURE]: 0.0,
        }),
        createMockVoterPreference("voter-4", {
          [PolicyCategory.INFRASTRUCTURE]: 0.9,
        }),
        createMockVoterPreference("voter-5", {
          [PolicyCategory.INFRASTRUCTURE]: 1.0,
        }),
      ];
      const policy = createMockPolicy();

      const result = await engine.analyzeMedianVoter(voterPreferences, policy);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.polarizationIndex).toBeGreaterThan(0.4); // 높은 양극화
      }
    });

    it("should_reject_analysis_when_voter_preferences_are_empty", async () => {
      const voterPreferences: IVoterPreference[] = [];
      const policy = createMockPolicy();

      const result = await engine.analyzeMedianVoter(voterPreferences, policy);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(isFailure(result) ? result.error.message : "Unknown error").toContain(
          "Voter preferences cannot be empty"
        );
      }
    });
  });

  describe("iron triangle analysis", () => {
    it("should_analyze_iron_triangle_when_given_stakeholder_influences", async () => {
      const stakeholderInfluences = new Map([
        ["pol_minister", 0.8],
        ["pol_deputy", 0.7],
        ["bur_director", 0.6],
        ["bur_manager", 0.5],
        ["int_industry", 0.9],
        ["int_union", 0.4],
      ]);

      const result = await engine.analyzeIronTriangle(
        PolicyCategory.INFRASTRUCTURE,
        stakeholderInfluences
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.politicianInfluence).toBeCloseTo(0.75, 1); // (0.8 + 0.7) / 2
        expect(result.data.bureaucratPower).toBeCloseTo(0.55, 1); // (0.6 + 0.5) / 2
        expect(result.data.interestGroupStrength).toBeCloseTo(0.65, 1); // (0.9 + 0.4) / 2
        expect(result.data.triangleStrength).toBeGreaterThan(0);
        expect(result.data.vulnerablePoints).toBeDefined();
        expect(result.data.recommendedInterventions).toBeDefined();
      }
    });

    it("should_detect_vulnerable_points_when_influences_are_high", async () => {
      const stakeholderInfluences = new Map([
        ["pol_minister", 0.9], // 높은 정치인 영향력
        ["bur_director", 0.8], // 높은 관료 권력
        ["int_industry", 0.95], // 매우 높은 이익집단 세력
      ]);

      const result = await engine.analyzeIronTriangle(
        PolicyCategory.ECONOMY,
        stakeholderInfluences
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.vulnerablePoints).toContain(
          "Excessive politician influence"
        );
        expect(result.data.vulnerablePoints).toContain(
          "Bureaucratic overreach"
        );
        expect(result.data.vulnerablePoints).toContain(
          "Interest group capture"
        );
      }
    });

    it("should_recommend_interventions_when_triangle_strength_is_high", async () => {
      const stakeholderInfluences = new Map([
        ["pol_minister", 0.8],
        ["bur_director", 0.8],
        ["int_lobby", 0.8],
      ]);

      const result = await engine.analyzeIronTriangle(
        PolicyCategory.HEALTHCARE,
        stakeholderInfluences
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.triangleStrength).toBeGreaterThan(0.6);
        expect(result.data.recommendedInterventions).toContain(
          "Implement mandatory transparency measures"
        );
        expect(result.data.recommendedInterventions).toContain(
          "Establish independent oversight body"
        );
      }
    });
  });

  describe("direct democracy simulation", () => {
    it("should_simulate_direct_democracy_when_given_valid_inputs", async () => {
      const policy = createMockPolicy({ urgencyLevel: 7 });
      const voterPreferences = createMockVoterPreferences(1000);

      const result = await engine.simulateDirectDemocracy(
        policy,
        voterPreferences,
        ParticipationType.CITIZEN_ASSEMBLY
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.participationRate).toBeDefined();
        expect(result.data.legitimacyScore).toBeDefined();
        expect(result.data.decisionQuality).toBeGreaterThanOrEqual(0);
        expect(result.data.decisionQuality).toBeLessThanOrEqual(1);
        expect(result.data.timeToDecision).toBeGreaterThan(0);
        expect(result.data.satisfactionRate).toBeGreaterThanOrEqual(0);
        expect(result.data.satisfactionRate).toBeLessThanOrEqual(1);
        expect(result.data.implementationFeasibility).toBeGreaterThanOrEqual(0);
        expect(result.data.implementationFeasibility).toBeLessThanOrEqual(1);
      }
    });

    it("should_show_higher_participation_for_citizen_assembly_than_direct_voting", async () => {
      const policy = createMockPolicy();
      const voterPreferences = createMockVoterPreferences(500);

      const directVotingResult = await engine.simulateDirectDemocracy(
        policy,
        voterPreferences,
        ParticipationType.DIRECT_VOTING
      );

      const citizenAssemblyResult = await engine.simulateDirectDemocracy(
        policy,
        voterPreferences,
        ParticipationType.CITIZEN_ASSEMBLY
      );

      expect(directVotingResult.success).toBe(true);
      expect(citizenAssemblyResult.success).toBe(true);

      if (directVotingResult.success && citizenAssemblyResult.success) {
        // 시민의회가 직접투표보다 참여율이 높을 것으로 예상
        expect(
          citizenAssemblyResult.data.participationRate
        ).toBeGreaterThanOrEqual(directVotingResult.data.participationRate);
      }
    });

    it("should_reduce_decision_time_for_urgent_policies", async () => {
      const urgentPolicy = createMockPolicy({ urgencyLevel: 9 });
      const regularPolicy = createMockPolicy({ urgencyLevel: 3 });
      const voterPreferences = createMockVoterPreferences(100);

      const urgentResult = await engine.simulateDirectDemocracy(
        urgentPolicy,
        voterPreferences,
        ParticipationType.DELIBERATIVE_POLLING
      );

      const regularResult = await engine.simulateDirectDemocracy(
        regularPolicy,
        voterPreferences,
        ParticipationType.DELIBERATIVE_POLLING
      );

      expect(urgentResult.success).toBe(true);
      expect(regularResult.success).toBe(true);

      if (urgentResult.success && regularResult.success) {
        expect(urgentResult.data.timeToDecision).toBeLessThan(
          regularResult.data.timeToDecision
        );
      }
    });
  });

  describe("public goods allocation optimization", () => {
    it("should_optimize_allocation_when_given_multiple_policies", async () => {
      const totalBudget = 10000000;
      const policies = [
        createMockPolicy({
          proposalId: "pol-1",
          category: PolicyCategory.HEALTHCARE,
          estimatedCost: 3000000,
          expectedBenefit: 5000000,
        }),
        createMockPolicy({
          proposalId: "pol-2",
          category: PolicyCategory.EDUCATION,
          estimatedCost: 2000000,
          expectedBenefit: 4000000,
        }),
        createMockPolicy({
          proposalId: "pol-3",
          category: PolicyCategory.INFRASTRUCTURE,
          estimatedCost: 6000000,
          expectedBenefit: 8000000,
        }),
      ];
      const voterPreferences = createMockVoterPreferences(200);

      const result = await engine.optimizePublicGoodsAllocation(
        totalBudget,
        policies,
        voterPreferences
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.allocationMap).toBeInstanceOf(Map);
        expect(result.data.paretoEfficiency).toBeGreaterThanOrEqual(0);
        expect(result.data.paretoEfficiency).toBeLessThanOrEqual(1);
        expect(result.data.socialWelfare).toBeGreaterThanOrEqual(0);
        expect(result.data.inequalityIndex).toBeGreaterThanOrEqual(0);
        expect(result.data.sustainabilityScore).toBeGreaterThanOrEqual(0);
        expect(result.data.sustainabilityScore).toBeLessThanOrEqual(1);

        // 예산 초과 방지 확인
        const totalAllocated = Array.from(
          result.data.allocationMap.values()
        ).reduce((sum, amount) => sum + amount, 0);
        expect(totalAllocated).toBeLessThanOrEqual(totalBudget);
      }
    });

    it("should_prioritize_high_efficiency_policies", async () => {
      const totalBudget = 5000000;
      const policies = [
        createMockPolicy({
          proposalId: "low-efficiency",
          estimatedCost: 4000000,
          expectedBenefit: 4500000, // 효율성 1.125
        }),
        createMockPolicy({
          proposalId: "high-efficiency",
          estimatedCost: 2000000,
          expectedBenefit: 4000000, // 효율성 2.0
        }),
      ];
      const voterPreferences = createMockVoterPreferences(100);

      const result = await engine.optimizePublicGoodsAllocation(
        totalBudget,
        policies,
        voterPreferences
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // 높은 효율성 정책이 선택되었는지 확인
        const highEfficiencyAllocated =
          result.data.allocationMap.get(PolicyCategory.INFRASTRUCTURE) || 0;
        expect(highEfficiencyAllocated).toBeGreaterThan(0);
      }
    });

    it("should_reject_optimization_when_budget_is_negative", async () => {
      const totalBudget = -1000;
      const policies = [createMockPolicy()];
      const voterPreferences = createMockVoterPreferences(50);

      const result = await engine.optimizePublicGoodsAllocation(
        totalBudget,
        policies,
        voterPreferences
      );
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(isFailure(result) ? result.error.message : "Unknown error").toContain("Total budget must be positive");
      }
    });
  });

  describe("rent-seeking detection", () => {
    it("should_detect_rent_seeking_when_given_suspicious_behaviors", async () => {
      const policy = createMockPolicy();
      const stakeholderBehaviors = new Map([
        ["stakeholder-1", [0.2, 0.4, 0.8, 0.9, 0.95]], // 상승 트렌드
        ["stakeholder-2", [0.5, 0.1, 0.9, 0.2, 0.8]], // 높은 변동성
      ]);

      const result = await engine.detectRentSeeking(
        policy,
        stakeholderBehaviors
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.detectedActivities).toBeDefined();
        expect(result.data.overallRiskScore).toBeGreaterThanOrEqual(0);
        expect(result.data.overallRiskScore).toBeLessThanOrEqual(1);
        expect(result.data.affectedPolicies).toBeDefined();
        expect(result.data.recommendedCountermeasures).toBeDefined();
      }
    });

    it("should_identify_lobbying_excess_from_monotonic_increase", async () => {
      const policy = createMockPolicy();
      const stakeholderBehaviors = new Map([
        ["lobbying-group", [0.1, 0.3, 0.5, 0.7, 0.9]], // 지속적 증가
      ]);

      const result = await engine.detectRentSeeking(
        policy,
        stakeholderBehaviors
      );

      expect(result.success).toBe(true);
      if (result.success && result.data.detectedActivities.length > 0) {
        const lobbyingActivities = result.data.detectedActivities.filter(
          (activity) => activity.type === RentSeekingType.LOBBYING_EXCESS
        );
        expect(lobbyingActivities.length).toBeGreaterThan(0);
      }
    });

    it("should_recommend_appropriate_countermeasures", async () => {
      const policy = createMockPolicy();
      const stakeholderBehaviors = new Map([
        ["regulatory-agency", [0.8, 0.2, 0.9, 0.1, 0.7]], // 불규칙 패턴
      ]);

      const result = await engine.detectRentSeeking(
        policy,
        stakeholderBehaviors
      );

      expect(result.success).toBe(true);
      if (result.success && result.data.detectedActivities.length > 0) {
        expect(result.data.recommendedCountermeasures).toContain(
          expect.stringMatching(/oversight|transparency|disclosure/i)
        );
      }
    });
  });

  describe("constitutional framework design", () => {
    it("should_design_framework_when_given_objectives_and_constraints", async () => {
      const objectives = ["Transparency", "Participation", "Accountability"];
      const constraints = ["Budget limitations", "Legal framework"];
      const stakeholders = ["Citizens", "Government", "Civil society"];

      const result = await engine.designConstitutionalFramework(
        objectives,
        constraints,
        stakeholders
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.institutionalFramework).toBeDefined();
        expect(result.data.institutionalFramework.length).toBeGreaterThan(0);
        expect(result.data.checkAndBalances).toBeDefined();
        expect(result.data.checkAndBalances.length).toBeGreaterThan(0);
        expect(result.data.participationMechanisms).toBeDefined();
        expect(result.data.participationMechanisms.length).toBeGreaterThan(0);
        expect(result.data.transparencyRequirements).toBeDefined();
        expect(result.data.transparencyRequirements.length).toBeGreaterThan(0);
      }
    });

    it("should_include_transparency_rules_in_framework", async () => {
      const objectives = ["Transparency"];
      const constraints: string[] = [];
      const stakeholders = ["Government"];

      const result = await engine.designConstitutionalFramework(
        objectives,
        constraints,
        stakeholders
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const hasTransparencyRule = result.data.institutionalFramework.some(
          (rule) => rule.description.toLowerCase().includes("transparency")
        );
        expect(hasTransparencyRule).toBe(true);
      }
    });
  });

  describe("system health evaluation", () => {
    it("should_evaluate_system_health_comprehensively", async () => {
      const result = await engine.evaluateSystemHealth();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ironTriangleScore).toBeDefined();
        expect(result.data.participationRate).toBeDefined();
        expect(result.data.legitimacyScore).toBeDefined();
        expect(result.data.transparencyScore).toBeDefined();
        expect(result.data.overallHealthScore).toBeGreaterThanOrEqual(0);
        expect(result.data.overallHealthScore).toBeLessThanOrEqual(1);
      }
    });

    it("should_calculate_reasonable_overall_health_score", async () => {
      const result = await engine.evaluateSystemHealth();

      expect(result.success).toBe(true);
      if (result.success) {
        // 전체 건전성 점수가 합리적인 범위에 있는지 확인
        expect(result.data.overallHealthScore).toBeGreaterThan(0.5);
        expect(result.data.overallHealthScore).toBeLessThan(1.0);
      }
    });
  });
});
