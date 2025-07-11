/**
 * Public Choice Engine - Domain Service
 * James Buchanan 노벨경제학상 수상 이론 "공공선택이론" 실제 구현
 *
 * 핵심 구현:
 * - Iron Triangle 극복 메커니즘
 * - Median Voter Theorem 기반 정책 결정
 * - Rent-Seeking 방지 시스템
 * - Constitutional Economics 프레임워크
 * - 직접민주주의 시뮬레이션
 */

import { Result } from "@posmul/auth-economy-sdk";

import {
  BudgetTransparencyScore,
  CitizenParticipationRate,
  createBudgetTransparencyScore,
  createCitizenParticipationRate,
  createDemocraticLegitimacyScore,
  createIronTriangleScore,
  DemocraticLegitimacyScore,
  IronTriangleScore,
} from "../value-objects";
import {
  ICheckAndBalance,
  IConstitutionalDesign,
  IDirectDemocracySimulation,
  IInstitutionalRule,
  IIronTriangleAnalysis,
  IMedianVoterAnalysis,
  IParticipationMechanism,
  IPolicyProposal,
  IPublicChoiceEngine,
  IPublicGoodsAllocation,
  IRentSeekingActivity,
  IRentSeekingDetection,
  ITransparencyRule,
  IVoterPreference,
  ParticipationType,
  PolicyCategory,
  RentSeekingType,
} from "./interfaces/public-choice-engine.interface";

/**
 * Public Choice Engine 설정
 */
export interface PublicChoiceEngineConfig {
  readonly medianVoterThreshold: number; // 중간 유권자 임계값
  readonly ironTriangleDetectionSensitivity: number; // Iron Triangle 탐지 민감도
  readonly rentSeekingThreshold: number; // Rent-Seeking 임계값
  readonly participationQuorum: number; // 참여 정족수
  readonly consensusThreshold: number; // 합의 임계값 (0.6 = 60%)
  readonly transparencyRequirement: number; // 투명성 요구 수준
}

/**
 * Public Choice Engine 구현체
 * Buchanan의 공공선택이론을 실제 코드로 구현
 */
export class PublicChoiceEngine implements IPublicChoiceEngine {
  private readonly config: PublicChoiceEngineConfig;

  constructor(config: PublicChoiceEngineConfig) {
    this.config = config;
    this.validateConfig();
  }

  /**
   * 중간 유권자 분석 (Median Voter Theorem)
   * 정책 지지도와 합의 가능성 예측
   */
  public async analyzeMedianVoter(
    voterPreferences: IVoterPreference[],
    policyProposal: IPolicyProposal
  ): Promise<Result<IMedianVoterAnalysis>> {
    try {
      if (voterPreferences.length === 0) {
        return {
          success: false,
          error: new Error("Voter preferences cannot be empty"),
        };
      }

      // 정책 카테고리별 선호도 계산
      const relevantPreferences = voterPreferences
        .map((voter) => ({
          voterId: voter.voterId,
          preference: voter.policyPreferences.get(policyProposal.category) || 0,
          riskTolerance: voter.riskTolerance,
        }))
        .sort((a, b) => a.preference - b.preference);

      // 중간 유권자 식별
      const medianIndex = Math.floor(relevantPreferences.length / 2);
      const medianVoter = relevantPreferences[medianIndex];

      // 중간 유권자의 전체 선호도 구성
      const medianVoterFull = voterPreferences.find(
        (v) => v.voterId === medianVoter.voterId
      );
      if (!medianVoterFull) {
        return {
          success: false,
          error: new Error("Median voter not found in full preferences"),
        };
      }

      // 분산 정도 계산
      const mean =
        relevantPreferences.reduce((sum, p) => sum + p.preference, 0) /
        relevantPreferences.length;
      const variance =
        relevantPreferences.reduce(
          (sum, p) => sum + Math.pow(p.preference - mean, 2),
          0
        ) / relevantPreferences.length;
      const distributionSpread = Math.sqrt(variance);

      // 양극화 지수 계산
      const polarizationIndex =
        this.calculatePolarizationIndex(relevantPreferences);

      // 합의 가능성 계산
      const consensusLikelihood = this.calculateConsensusLikelihood(
        relevantPreferences,
        medianVoter.preference
      );

      const analysis: IMedianVoterAnalysis = {
        medianVoterId: medianVoter.voterId,
        medianPreferences: medianVoterFull.policyPreferences,
        distributionSpread,
        polarizationIndex,
        consensusLikelihood,
      };

      return { success: true, data: analysis };
    } catch (error) {
      return {
        success: false,
        error: new Error("Invalid state"),
      };
    }
  }

  /**
   * Iron Triangle 분석
   * 정치인-관료-이익집단 간 결탁 구조 분석 및 극복 방안 제시
   */
  public async analyzeIronTriangle(
    policyArea: PolicyCategory,
    stakeholderInfluences: Map<string, number>
  ): Promise<Result<IIronTriangleAnalysis>> {
    try {
      // 이해관계자를 정치인, 관료, 이익집단으로 분류
      const politicians = Array.from(stakeholderInfluences.entries())
        .filter(([id]) => id.startsWith("pol_"))
        .map(([, influence]) => influence);

      const bureaucrats = Array.from(stakeholderInfluences.entries())
        .filter(([id]) => id.startsWith("bur_"))
        .map(([, influence]) => influence);

      const interestGroups = Array.from(stakeholderInfluences.entries())
        .filter(([id]) => id.startsWith("int_"))
        .map(([, influence]) => influence);

      // 각 그룹의 평균 영향력 계산
      const politicianInfluence =
        politicians.length > 0
          ? politicians.reduce((sum, inf) => sum + inf, 0) / politicians.length
          : 0;

      const bureaucratPower =
        bureaucrats.length > 0
          ? bureaucrats.reduce((sum, inf) => sum + inf, 0) / bureaucrats.length
          : 0;

      const interestGroupStrength =
        interestGroups.length > 0
          ? interestGroups.reduce((sum, inf) => sum + inf, 0) /
            interestGroups.length
          : 0;

      // Iron Triangle 강도 계산 (기하평균)
      const triangleStrength = Math.pow(
        politicianInfluence * bureaucratPower * interestGroupStrength,
        1 / 3
      );

      // 취약점 식별
      const vulnerablePoints = this.identifyVulnerablePoints(
        politicianInfluence,
        bureaucratPower,
        interestGroupStrength
      );

      // 개입 방안 추천
      const recommendedInterventions = this.recommendInterventions(
        triangleStrength,
        vulnerablePoints,
        policyArea
      );

      const analysis: IIronTriangleAnalysis = {
        politicianInfluence,
        bureaucratPower,
        interestGroupStrength,
        triangleStrength,
        vulnerablePoints,
        recommendedInterventions,
      };

      return { success: true, data: analysis };
    } catch (error) {
      return {
        success: false,
        error: new Error("Invalid state"),
      };
    }
  }

  /**
   * 직접민주주의 시뮬레이션
   * 다양한 참여 메커니즘의 효과 예측
   */
  public async simulateDirectDemocracy(
    policy: IPolicyProposal,
    voterPreferences: IVoterPreference[],
    participationMechanism: ParticipationType
  ): Promise<Result<IDirectDemocracySimulation>> {
    try {
      // 참여율 계산 (메커니즘별 차이 반영)
      const baseParticipationRate = this.calculateBaseParticipationRate(
        policy,
        voterPreferences
      );

      const mechanismMultiplier = this.getParticipationMultiplier(
        participationMechanism
      );
      const finalParticipationRate = Math.min(
        1.0,
        baseParticipationRate * mechanismMultiplier
      );

      // 민주적 정당성 점수 계산
      const legitimacyScore = this.calculateLegitimacyScore(
        finalParticipationRate,
        participationMechanism,
        policy
      );

      // 의사결정 품질 계산
      const decisionQuality = this.calculateDecisionQuality(
        voterPreferences,
        policy,
        participationMechanism
      );

      // 의사결정 소요시간 예측
      const timeToDecision = this.estimateDecisionTime(
        participationMechanism,
        voterPreferences.length,
        policy.urgencyLevel
      );

      // 시민 만족도 계산
      const satisfactionRate = this.calculateSatisfactionRate(
        voterPreferences,
        policy,
        decisionQuality
      );

      // 실행 가능성 평가
      const implementationFeasibility = this.assessImplementationFeasibility(
        policy,
        legitimacyScore,
        satisfactionRate
      );

      const simulation: IDirectDemocracySimulation = {
        participationRate: createCitizenParticipationRate(
          finalParticipationRate
        ),
        legitimacyScore: createDemocraticLegitimacyScore(legitimacyScore),
        decisionQuality,
        timeToDecision,
        satisfactionRate,
        implementationFeasibility,
      };

      return { success: true, data: simulation };
    } catch (error) {
      return {
        success: false,
        error: new Error("Invalid state"),
      };
    }
  }

  /**
   * 공공재 배분 최적화
   * Pareto 효율성과 사회후생 극대화
   */
  public async optimizePublicGoodsAllocation(
    totalBudget: number,
    policyProposals: IPolicyProposal[],
    voterPreferences: IVoterPreference[]
  ): Promise<Result<IPublicGoodsAllocation>> {
    try {
      if (totalBudget <= 0) {
        return {
          success: false,
          error: new Error("Total budget must be positive"),
        };
      }

      // 각 정책의 사회적 가치 계산
      const policyValues = await Promise.all(
        policyProposals.map(async (policy) => {
          const socialValue = this.calculateSocialValue(
            policy,
            voterPreferences
          );
          const costEfficiency = policy.expectedBenefit / policy.estimatedCost;

          return {
            policy,
            socialValue,
            costEfficiency,
            score: socialValue * costEfficiency,
          };
        })
      );

      // 효율성 기준으로 정렬
      policyValues.sort((a, b) => b.score - a.score);

      // 배분 최적화 (Knapsack 문제 해결)
      const allocation = this.solveAllocationProblem(policyValues, totalBudget);

      // Pareto 효율성 계산
      const paretoEfficiency = this.calculateParetoEfficiency(
        allocation,
        voterPreferences
      );

      // 사회후생 계산
      const socialWelfare = this.calculateSocialWelfare(
        allocation,
        voterPreferences
      );

      // 불평등 지수 계산 (Gini 계수)
      const inequalityIndex = this.calculateGiniCoefficient(
        allocation,
        voterPreferences
      );

      // 지속가능성 점수
      const sustainabilityScore = this.calculateSustainabilityScore(allocation);

      const result: IPublicGoodsAllocation = {
        allocationMap: allocation,
        paretoEfficiency,
        socialWelfare,
        inequalityIndex,
        sustainabilityScore,
      };

      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: new Error("Invalid state"),
      };
    }
  }

  /**
   * Rent-Seeking 활동 탐지
   * 사회적 낭비 요소 식별 및 방지책 제시
   */
  public async detectRentSeeking(
    policyImplementation: IPolicyProposal,
    stakeholderBehaviors: Map<string, number[]>
  ): Promise<Result<IRentSeekingDetection>> {
    try {
      const detectedActivities: IRentSeekingActivity[] = [];

      // 각 이해관계자의 행동 패턴 분석
      for (const [stakeholderId, behaviors] of Array.from(
        stakeholderBehaviors.entries()
      )) {
        const activities = this.analyzeStakeholderBehavior(
          stakeholderId,
          behaviors,
          policyImplementation
        );
        detectedActivities.push(...activities);
      }

      // 전체 위험도 계산
      const overallRiskScore =
        detectedActivities.length > 0
          ? detectedActivities.reduce(
              (sum, activity) => sum + activity.severity,
              0
            ) / detectedActivities.length
          : 0;

      // 영향받은 정책들 식별
      const affectedPolicies = this.identifyAffectedPolicies(
        detectedActivities,
        policyImplementation
      );

      // 대응책 추천
      const recommendedCountermeasures =
        this.recommendCountermeasures(detectedActivities);

      const detection: IRentSeekingDetection = {
        detectedActivities,
        overallRiskScore,
        affectedPolicies,
        recommendedCountermeasures,
      };

      return { success: true, data: detection };
    } catch (error) {
      return {
        success: false,
        error: new Error("Invalid state"),
      };
    }
  }

  /**
   * Constitutional Economics 설계
   * 제도적 프레임워크 최적화
   */
  public async designConstitutionalFramework(
    objectives: string[],
    constraints: string[],
    stakeholders: string[]
  ): Promise<Result<IConstitutionalDesign>> {
    try {
      // 제도적 규칙 설계
      const institutionalFramework = this.designInstitutionalRules(
        objectives,
        constraints
      );

      // 견제와 균형 메커니즘 설계
      const checkAndBalances = this.designCheckAndBalances(stakeholders);

      // 참여 메커니즘 설계
      const participationMechanisms =
        this.designParticipationMechanisms(objectives);

      // 투명성 요구사항 설계
      const transparencyRequirements =
        this.designTransparencyRequirements(stakeholders);

      const design: IConstitutionalDesign = {
        institutionalFramework,
        checkAndBalances,
        participationMechanisms,
        transparencyRequirements,
      };

      return { success: true, data: design };
    } catch (error) {
      return {
        success: false,
        error: new Error("Invalid state"),
      };
    }
  }

  /**
   * 전체 공공선택 시스템 건전성 평가
   */
  public async evaluateSystemHealth(): Promise<
    Result<{
      ironTriangleScore: IronTriangleScore;
      participationRate: CitizenParticipationRate;
      legitimacyScore: DemocraticLegitimacyScore;
      transparencyScore: BudgetTransparencyScore;
      overallHealthScore: number;
    }>
  > {
    try {
      // 시스템 지표들 계산 (실제 구현에서는 실시간 데이터 사용)
      const ironTriangleScore = createIronTriangleScore(0.3); // 낮을수록 좋음
      const participationRate = createCitizenParticipationRate(0.75);
      const legitimacyScore = createDemocraticLegitimacyScore(0.8);
      const transparencyScore = createBudgetTransparencyScore(0.85);

      // 전체 건전성 점수 계산 (가중평균)
      const overallHealthScore =
        (1 - 0.3) * 0.2 + // Iron Triangle (역수)
        0.75 * 0.3 + // 참여율
        0.8 * 0.3 + // 정당성
        0.85 * 0.2; // 투명성

      return {
        success: true,
        data: {
          ironTriangleScore,
          participationRate,
          legitimacyScore,
          transparencyScore,
          overallHealthScore,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: new Error("Invalid state"),
      };
    }
  }

  // ===== 헬퍼 메서드들 =====

  private validateConfig(): void {
    if (
      this.config.medianVoterThreshold < 0 ||
      this.config.medianVoterThreshold > 1
    ) {
      throw new Error("Median voter threshold must be between 0 and 1");
    }
    if (
      this.config.consensusThreshold < 0.5 ||
      this.config.consensusThreshold > 1
    ) {
      throw new Error("Consensus threshold must be between 0.5 and 1");
    }
    if (
      this.config.participationQuorum < 0 ||
      this.config.participationQuorum > 1
    ) {
      throw new Error("Participation quorum must be between 0 and 1");
    }
  }

  private calculatePolarizationIndex(
    preferences: { preference: number }[]
  ): number {
    // 표준편차 기반 양극화 계산
    const mean =
      preferences.reduce((sum, p) => sum + p.preference, 0) /
      preferences.length;
    const variance =
      preferences.reduce(
        (sum, p) => sum + Math.pow(p.preference - mean, 2),
        0
      ) / preferences.length;
    return Math.min(1, Math.sqrt(variance) / 2); // 정규화
  }

  private calculateConsensusLikelihood(
    preferences: { preference: number }[],
    medianPreference: number
  ): number {
    // 중간값 기준 합의 가능성 계산
    const withinThreshold = preferences.filter(
      (p) =>
        Math.abs(p.preference - medianPreference) <=
        this.config.medianVoterThreshold
    ).length;

    return withinThreshold / preferences.length;
  }

  private identifyVulnerablePoints(
    politicianInfluence: number,
    bureaucratPower: number,
    interestGroupStrength: number
  ): string[] {
    const vulnerablePoints: string[] = [];

    if (politicianInfluence > 0.7) {
      vulnerablePoints.push("Excessive politician influence");
    }
    if (bureaucratPower > 0.7) {
      vulnerablePoints.push("Bureaucratic overreach");
    }
    if (interestGroupStrength > 0.7) {
      vulnerablePoints.push("Interest group capture");
    }
    if (Math.abs(politicianInfluence - bureaucratPower) < 0.1) {
      vulnerablePoints.push("Politician-bureaucrat collusion risk");
    }

    return vulnerablePoints;
  }

  private recommendInterventions(
    triangleStrength: number,
    vulnerablePoints: string[],
    policyArea: PolicyCategory
  ): string[] {
    const interventions: string[] = [];

    if (triangleStrength > 0.6) {
      interventions.push("Implement mandatory transparency measures");
      interventions.push("Establish independent oversight body");
    }

    if (vulnerablePoints.includes("Excessive politician influence")) {
      interventions.push("Strengthen civil service protection");
      interventions.push("Implement term limits for key positions");
    }

    if (vulnerablePoints.includes("Bureaucratic overreach")) {
      interventions.push("Enhance legislative oversight");
      interventions.push("Implement performance-based evaluations");
    }

    return interventions;
  }

  private calculateBaseParticipationRate(
    policy: IPolicyProposal,
    voterPreferences: IVoterPreference[]
  ): number {
    // 정책 관련성과 개인적 이해관계 기반 참여율 계산
    const relevantVoters = voterPreferences.filter(
      (voter) =>
        Math.abs(voter.policyPreferences.get(policy.category) || 0) > 0.3
    );

    const baseRate = relevantVoters.length / voterPreferences.length;
    const urgencyBonus = policy.urgencyLevel / 20; // 0-0.5 bonus

    return Math.min(1, baseRate + urgencyBonus);
  }

  private getParticipationMultiplier(mechanism: ParticipationType): number {
    switch (mechanism) {
      case ParticipationType.DIRECT_VOTING:
        return 0.8; // 전통적 투표는 참여율이 낮음
      case ParticipationType.CITIZEN_ASSEMBLY:
        return 1.2; // 시민의회는 참여율 높음
      case ParticipationType.PARTICIPATORY_BUDGETING:
        return 1.1; // 참여예산은 중간 수준
      case ParticipationType.DELIBERATIVE_POLLING:
        return 1.3; // 숙의여론조사는 가장 높음
      default:
        return 1.0;
    }
  }

  private calculateLegitimacyScore(
    participationRate: number,
    mechanism: ParticipationType,
    policy: IPolicyProposal
  ): number {
    const participationWeight = 0.4;
    const mechanismWeight = 0.3;
    const policyRelevanceWeight = 0.3;

    const mechanismScore = this.getMechanismLegitimacyScore(mechanism);
    const policyRelevanceScore = Math.min(1, policy.affectedCitizens / 100000); // 정규화

    return (
      participationRate * participationWeight +
      mechanismScore * mechanismWeight +
      policyRelevanceScore * policyRelevanceWeight
    );
  }

  private getMechanismLegitimacyScore(mechanism: ParticipationType): number {
    switch (mechanism) {
      case ParticipationType.DIRECT_VOTING:
        return 0.9; // 직접투표는 정당성 높음
      case ParticipationType.CITIZEN_ASSEMBLY:
        return 0.8; // 시민의회는 대표성 문제
      case ParticipationType.PARTICIPATORY_BUDGETING:
        return 0.85; // 참여예산은 중간-높음
      case ParticipationType.DELIBERATIVE_POLLING:
        return 0.75; // 숙의여론조사는 샘플링 한계
      default:
        return 0.5;
    }
  }

  private calculateDecisionQuality(
    voterPreferences: IVoterPreference[],
    policy: IPolicyProposal,
    mechanism: ParticipationType
  ): number {
    // 정보 수준과 숙의 과정을 고려한 의사결정 품질
    const informationLevel = this.getInformationLevel(mechanism);
    const deliberationQuality = this.getDeliberationQuality(mechanism);
    const expertiseRelevance = this.calculateExpertiseRelevance(
      voterPreferences,
      policy
    );

    return (informationLevel + deliberationQuality + expertiseRelevance) / 3;
  }

  private getInformationLevel(mechanism: ParticipationType): number {
    switch (mechanism) {
      case ParticipationType.DIRECT_VOTING:
        return 0.6; // 일반 투표는 정보 수준 낮음
      case ParticipationType.CITIZEN_ASSEMBLY:
        return 0.9; // 시민의회는 정보 제공 충분
      case ParticipationType.PARTICIPATORY_BUDGETING:
        return 0.8; // 참여예산은 관련 정보 제공
      case ParticipationType.DELIBERATIVE_POLLING:
        return 0.95; // 숙의여론조사는 정보 수준 최고
      default:
        return 0.5;
    }
  }

  private getDeliberationQuality(mechanism: ParticipationType): number {
    switch (mechanism) {
      case ParticipationType.DIRECT_VOTING:
        return 0.4; // 숙의 과정 부족
      case ParticipationType.CITIZEN_ASSEMBLY:
        return 0.9; // 충분한 숙의
      case ParticipationType.PARTICIPATORY_BUDGETING:
        return 0.7; // 중간 수준 숙의
      case ParticipationType.DELIBERATIVE_POLLING:
        return 0.95; // 최고 수준 숙의
      default:
        return 0.5;
    }
  }

  private calculateExpertiseRelevance(
    voterPreferences: IVoterPreference[],
    policy: IPolicyProposal
  ): number {
    // 유권자들의 해당 분야 전문성 정도 (단순화된 계산)
    const relevantVoters = voterPreferences.filter(
      (voter) => (voter.policyPreferences.get(policy.category) || 0) > 0.5
    );

    return relevantVoters.length / voterPreferences.length;
  }

  private estimateDecisionTime(
    mechanism: ParticipationType,
    voterCount: number,
    urgencyLevel: number
  ): number {
    let baseDays = 30; // 기본 30일

    switch (mechanism) {
      case ParticipationType.DIRECT_VOTING:
        baseDays = 14;
        break;
      case ParticipationType.CITIZEN_ASSEMBLY:
        baseDays = 60;
        break;
      case ParticipationType.PARTICIPATORY_BUDGETING:
        baseDays = 45;
        break;
      case ParticipationType.DELIBERATIVE_POLLING:
        baseDays = 21;
        break;
    }

    // 규모에 따른 조정
    const scaleMultiplier = Math.log10(voterCount) / 5;

    // 긴급성에 따른 조정
    const urgencyDivisor = urgencyLevel / 5;

    return Math.max(7, (baseDays * scaleMultiplier) / urgencyDivisor);
  }

  private calculateSatisfactionRate(
    voterPreferences: IVoterPreference[],
    policy: IPolicyProposal,
    decisionQuality: number
  ): number {
    // 정책에 대한 평균 만족도 + 의사결정 과정 품질
    const policySupport =
      voterPreferences
        .map((voter) => voter.policyPreferences.get(policy.category) || 0)
        .filter((pref) => pref > 0)
        .reduce((sum, pref) => sum + pref, 0) / voterPreferences.length;

    return (policySupport + decisionQuality) / 2;
  }

  private assessImplementationFeasibility(
    policy: IPolicyProposal,
    legitimacyScore: number,
    satisfactionRate: number
  ): number {
    const budgetFeasibility = Math.min(1, 1000000 / policy.estimatedCost); // 단순화
    const politicalFeasibility = (legitimacyScore + satisfactionRate) / 2;
    const technicalFeasibility = 0.8; // 단순화 (실제로는 복잡한 계산)

    return (
      (budgetFeasibility + politicalFeasibility + technicalFeasibility) / 3
    );
  }

  private calculateSocialValue(
    policy: IPolicyProposal,
    voterPreferences: IVoterPreference[]
  ): number {
    // 사회적 가치 = 기대 편익 × 시민 선호도 가중합
    const avgPreference =
      voterPreferences
        .map((voter) => voter.policyPreferences.get(policy.category) || 0)
        .reduce((sum, pref) => sum + pref, 0) / voterPreferences.length;

    return policy.expectedBenefit * (1 + avgPreference);
  }

  private solveAllocationProblem(
    policyValues: { policy: IPolicyProposal; score: number }[],
    totalBudget: number
  ): Map<PolicyCategory, number> {
    const allocation = new Map<PolicyCategory, number>();
    let remainingBudget = totalBudget;

    // 탐욕 알고리즘으로 해결 (단순화)
    for (const { policy } of policyValues) {
      if (policy.estimatedCost <= remainingBudget) {
        const currentAllocation = allocation.get(policy.category) || 0;
        allocation.set(
          policy.category,
          currentAllocation + policy.estimatedCost
        );
        remainingBudget -= policy.estimatedCost;
      }
    }

    return allocation;
  }
  private calculateParetoEfficiency(
    allocation: Map<PolicyCategory, number>,
    voterPreferences: IVoterPreference[]
  ): number {
    // 파레토 효율성 근사 계산 (실제로는 더 복잡)
    const totalUtility = Array.from(allocation.entries()).reduce(
      (sum, [category, amount]) => {
        const categoryUtility = voterPreferences
          .map(
            (voter) =>
              Math.abs(voter.policyPreferences.get(category) || 0) * amount
          )
          .reduce((catSum, util) => catSum + util, 0);
        return sum + categoryUtility;
      },
      0
    );

    const maxPossibleUtility =
      Array.from(allocation.values()).reduce((sum, amount) => sum + amount, 0) *
      voterPreferences.length;

    if (maxPossibleUtility === 0) return 0;
    return Math.max(0, Math.min(1, totalUtility / maxPossibleUtility));
  }
  private calculateSocialWelfare(
    allocation: Map<PolicyCategory, number>,
    voterPreferences: IVoterPreference[]
  ): number {
    // 사회후생함수 = Σ 개인효용 (음수 선호도 처리)
    const totalWelfare = voterPreferences
      .map((voter) => {
        return Array.from(allocation.entries()).reduce(
          (utility, [category, amount]) => {
            const preference = voter.policyPreferences.get(category) || 0;
            // 음수 선호도의 경우 절댓값 사용하고 부호 반영
            const absPreference = Math.abs(preference);
            const utilityValue = absPreference * Math.log(1 + amount);
            return utility + (preference >= 0 ? utilityValue : -utilityValue);
          },
          0
        );
      })
      .reduce((total, individual) => total + individual, 0);

    return Math.max(0, totalWelfare); // 음수 방지
  }

  private calculateGiniCoefficient(
    allocation: Map<PolicyCategory, number>,
    voterPreferences: IVoterPreference[]
  ): number {
    // 간소화된 Gini 계수 계산
    const utilities = voterPreferences
      .map((voter) => {
        return Array.from(allocation.entries()).reduce(
          (utility, [category, amount]) => {
            const preference = voter.policyPreferences.get(category) || 0;
            return utility + preference * amount;
          },
          0
        );
      })
      .sort((a, b) => a - b);

    const n = utilities.length;
    const mean = utilities.reduce((sum, u) => sum + u, 0) / n;

    let giniSum = 0;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        giniSum += Math.abs(utilities[i] - utilities[j]);
      }
    }

    return giniSum / (2 * n * n * mean);
  }

  private calculateSustainabilityScore(
    allocation: Map<PolicyCategory, number>
  ): number {
    // 지속가능성 점수 (환경, 사회, 경제 균형)
    const environmentWeight = allocation.get(PolicyCategory.ENVIRONMENT) || 0;
    const infrastructureWeight =
      allocation.get(PolicyCategory.INFRASTRUCTURE) || 0;
    const socialWeight =
      (allocation.get(PolicyCategory.HEALTHCARE) || 0) +
      (allocation.get(PolicyCategory.EDUCATION) || 0) +
      (allocation.get(PolicyCategory.WELFARE) || 0);

    const totalAllocation = Array.from(allocation.values()).reduce(
      (sum, amount) => sum + amount,
      0
    );

    if (totalAllocation === 0) return 0;

    const envRatio = environmentWeight / totalAllocation;
    const infraRatio = infrastructureWeight / totalAllocation;
    const socialRatio = socialWeight / totalAllocation;

    // 균형잡힌 배분일수록 높은 점수
    const balance =
      1 -
      Math.abs(envRatio - 0.2) -
      Math.abs(infraRatio - 0.3) -
      Math.abs(socialRatio - 0.4);
    return Math.max(0, balance);
  }

  private analyzeStakeholderBehavior(
    stakeholderId: string,
    behaviors: number[],
    policy: IPolicyProposal
  ): IRentSeekingActivity[] {
    const activities: IRentSeekingActivity[] = [];

    // 행동 패턴 분석
    if (behaviors.length >= 3) {
      const trend = this.calculateTrend(behaviors);
      const volatility = this.calculateVolatility(behaviors);

      // 이상 패턴 탐지
      if (trend > 0.8 && volatility < 0.1) {
        activities.push({
          activityId: `rent_${stakeholderId}_${Date.now()}`,
          type: RentSeekingType.LOBBYING_EXCESS,
          severity: trend,
          involvedParties: [stakeholderId],
          estimatedWaste: policy.estimatedCost * 0.1,
        });
      }

      if (volatility > 0.9) {
        activities.push({
          activityId: `rent_${stakeholderId}_${Date.now()}_volatile`,
          type: RentSeekingType.REGULATORY_CAPTURE,
          severity: volatility,
          involvedParties: [stakeholderId],
          estimatedWaste: policy.estimatedCost * 0.05,
        });
      }
    }

    return activities;
  }

  private calculateTrend(values: number[]): number {
    // 선형 회귀를 사용한 트렌드 계산 (단순화)
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const xMean = (n - 1) / 2;
    const yMean = values.reduce((sum, v) => sum + v, 0) / n;

    const numerator = x.reduce(
      (sum, xi, i) => sum + (xi - xMean) * (values[i] - yMean),
      0
    );
    const denominator = x.reduce((sum, xi) => sum + Math.pow(xi - xMean, 2), 0);

    return denominator !== 0 ? Math.abs(numerator / denominator) : 0;
  }

  private calculateVolatility(values: number[]): number {
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance =
      values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    return Math.sqrt(variance) / mean;
  }

  private identifyAffectedPolicies(
    activities: IRentSeekingActivity[],
    currentPolicy: IPolicyProposal
  ): string[] {
    // 현재 정책이 주로 영향받음 (실제로는 더 복잡한 분석)
    return activities.length > 0 ? [currentPolicy.proposalId] : [];
  }

  private recommendCountermeasures(
    activities: IRentSeekingActivity[]
  ): string[] {
    const countermeasures: string[] = [];

    const hasLobbying = activities.some(
      (a) => a.type === RentSeekingType.LOBBYING_EXCESS
    );
    const hasCapture = activities.some(
      (a) => a.type === RentSeekingType.REGULATORY_CAPTURE
    );

    if (hasLobbying) {
      countermeasures.push("Implement lobbying disclosure requirements");
      countermeasures.push("Establish cooling-off periods for officials");
    }

    if (hasCapture) {
      countermeasures.push("Rotate regulatory personnel");
      countermeasures.push("Increase external oversight");
    }

    return countermeasures;
  }
  private designInstitutionalRules(
    objectives: string[],
    constraints: string[]
  ): IInstitutionalRule[] {
    const rules: IInstitutionalRule[] = [
      {
        ruleId: "transparency_rule_001",
        description:
          "All policy decisions must be publicly documented with full transparency",
        enforcementMechanism: "Automatic publication system",
        violationPenalty: "Administrative sanctions",
      },
      {
        ruleId: "participation_rule_001",
        description: "Minimum 30 days public consultation for major policies",
        enforcementMechanism: "Mandatory consultation tracking",
        violationPenalty: "Policy invalidation",
      },
    ];

    // 목표에 따른 추가 규칙
    if (objectives.includes("Transparency")) {
      rules.push({
        ruleId: "enhanced_transparency_rule",
        description:
          "Enhanced transparency measures for all government operations",
        enforcementMechanism: "Real-time disclosure requirements",
        violationPenalty: "Public hearings and corrective action",
      });
    }

    return rules;
  }

  private designCheckAndBalances(stakeholders: string[]): ICheckAndBalance[] {
    return [
      {
        balanceId: "executive_legislative_001",
        powerSource: "Executive branch",
        counterPower: "Legislative oversight",
        mechanism: "Mandatory hearings and approvals",
      },
      {
        balanceId: "bureaucratic_civil_001",
        powerSource: "Bureaucratic agencies",
        counterPower: "Civil society monitoring",
        mechanism: "Citizen oversight committees",
      },
    ];
  }

  private designParticipationMechanisms(
    objectives: string[]
  ): IParticipationMechanism[] {
    return [
      {
        mechanismId: "citizen_assembly_001",
        type: ParticipationType.CITIZEN_ASSEMBLY,
        threshold: 0.1, // 10% 시민 요청 시 소집
        rewards: ["Public recognition", "Civic education credits"],
      },
      {
        mechanismId: "participatory_budget_001",
        type: ParticipationType.PARTICIPATORY_BUDGETING,
        threshold: 0.05, // 5% 예산 이상 시 참여절차
        rewards: ["Implementation priority", "Community benefits"],
      },
    ];
  }

  private designTransparencyRequirements(
    stakeholders: string[]
  ): ITransparencyRule[] {
    return [
      {
        ruleId: "decision_transparency_001",
        scope: "All policy decisions",
        disclosureRequirement: "Full decision rationale and supporting data",
        publicationMethod: "Online platform with search capabilities",
      },
      {
        ruleId: "stakeholder_transparency_001",
        scope: "Stakeholder interactions",
        disclosureRequirement: "Meeting logs and influence documentation",
        publicationMethod: "Quarterly transparency reports",
      },
    ];
  }
}
