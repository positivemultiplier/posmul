/**
 * Public Choice Engine Interface
 * James Buchanan의 공공선택이론(Public Choice Theory) 기반 의사결정 엔진
 *
 * 핵심 이론:
 * - Iron Triangle 극복 메커니즘
 * - Median Voter Theorem (중간 유권자 정리)
 * - Rent-Seeking 행동 방지
 * - Constitutional Economics
 */

import { Result } from "../../../../../shared/types/common";
import {
  BudgetTransparencyScore,
  CitizenParticipationRate,
  DemocraticLegitimacyScore,
  IronTriangleScore,
} from "../../value-objects";

/**
 * 정책 제안서
 */
export interface IPolicyProposal {
  readonly proposalId: string;
  readonly title: string;
  readonly description: string;
  readonly estimatedCost: number;
  readonly expectedBenefit: number;
  readonly affectedCitizens: number;
  readonly urgencyLevel: number; // 1-10
  readonly proposedBy: string;
  readonly category: PolicyCategory;
}

/**
 * 정책 카테고리
 */
export enum PolicyCategory {
  INFRASTRUCTURE = "INFRASTRUCTURE",
  HEALTHCARE = "HEALTHCARE",
  EDUCATION = "EDUCATION",
  WELFARE = "WELFARE",
  ENVIRONMENT = "ENVIRONMENT",
  ECONOMY = "ECONOMY",
  SECURITY = "SECURITY",
}

/**
 * 유권자 선호도
 */
export interface IVoterPreference {
  readonly voterId: string;
  readonly policyPreferences: Map<PolicyCategory, number>; // -1 to 1
  readonly riskTolerance: number; // 0 to 1
  readonly socialUtilityWeight: number; // 0 to 1
  readonly personalUtilityWeight: number; // 0 to 1
}

/**
 * 중간 유권자 분석 결과
 */
export interface IMedianVoterAnalysis {
  readonly medianVoterId: string;
  readonly medianPreferences: Map<PolicyCategory, number>;
  readonly distributionSpread: number; // 선호도 분산 정도
  readonly polarizationIndex: number; // 양극화 지수 (0-1)
  readonly consensusLikelihood: number; // 합의 가능성 (0-1)
}

/**
 * Iron Triangle 분석 결과
 */
export interface IIronTriangleAnalysis {
  readonly politicianInfluence: number; // 정치인 영향력 (0-1)
  readonly bureaucratPower: number; // 관료 권력 (0-1)
  readonly interestGroupStrength: number; // 이익집단 세력 (0-1)
  readonly triangleStrength: number; // 전체 삼각형 강도 (0-1)
  readonly vulnerablePoints: string[]; // 취약점들
  readonly recommendedInterventions: string[]; // 권장 개입 방안
}

/**
 * 직접민주주의 시뮬레이션 결과
 */
export interface IDirectDemocracySimulation {
  readonly participationRate: CitizenParticipationRate;
  readonly legitimacyScore: DemocraticLegitimacyScore;
  readonly decisionQuality: number; // 의사결정 품질 (0-1)
  readonly timeToDecision: number; // 의사결정 소요시간 (days)
  readonly satisfactionRate: number; // 시민 만족도 (0-1)
  readonly implementationFeasibility: number; // 실행 가능성 (0-1)
}

/**
 * 공공재 배분 최적화 결과
 */
export interface IPublicGoodsAllocation {
  readonly allocationMap: Map<PolicyCategory, number>; // 예산 배분
  readonly paretoEfficiency: number; // 파레토 효율성 (0-1)
  readonly socialWelfare: number; // 사회후생 점수
  readonly inequalityIndex: number; // 불평등 지수 (Gini)
  readonly sustainabilityScore: number; // 지속가능성 점수 (0-1)
}

/**
 * Rent-Seeking 탐지 결과
 */
export interface IRentSeekingDetection {
  readonly detectedActivities: IRentSeekingActivity[];
  readonly overallRiskScore: number; // 전체 위험도 (0-1)
  readonly affectedPolicies: string[]; // 영향받은 정책들
  readonly recommendedCountermeasures: string[]; // 권장 대응책
}

export interface IRentSeekingActivity {
  readonly activityId: string;
  readonly type: RentSeekingType;
  readonly severity: number; // 심각도 (0-1)
  readonly involvedParties: string[];
  readonly estimatedWaste: number; // 추정 사회적 낭비
}

export enum RentSeekingType {
  LOBBYING_EXCESS = "LOBBYING_EXCESS",
  REGULATORY_CAPTURE = "REGULATORY_CAPTURE",
  BUREAUCRATIC_EXPANSION = "BUREAUCRATIC_EXPANSION",
  INTEREST_GROUP_MONOPOLY = "INTEREST_GROUP_MONOPOLY",
}

/**
 * Constitutional Economics 설계
 */
export interface IConstitutionalDesign {
  readonly institutionalFramework: IInstitutionalRule[];
  readonly checkAndBalances: ICheckAndBalance[];
  readonly participationMechanisms: IParticipationMechanism[];
  readonly transparencyRequirements: ITransparencyRule[];
}

export interface IInstitutionalRule {
  readonly ruleId: string;
  readonly description: string;
  readonly enforcementMechanism: string;
  readonly violationPenalty: string;
}

export interface ICheckAndBalance {
  readonly balanceId: string;
  readonly powerSource: string;
  readonly counterPower: string;
  readonly mechanism: string;
}

export interface IParticipationMechanism {
  readonly mechanismId: string;
  readonly type: ParticipationType;
  readonly threshold: number;
  readonly rewards: string[];
}

export enum ParticipationType {
  DIRECT_VOTING = "DIRECT_VOTING",
  CITIZEN_ASSEMBLY = "CITIZEN_ASSEMBLY",
  PARTICIPATORY_BUDGETING = "PARTICIPATORY_BUDGETING",
  DELIBERATIVE_POLLING = "DELIBERATIVE_POLLING",
}

export interface ITransparencyRule {
  readonly ruleId: string;
  readonly scope: string;
  readonly disclosureRequirement: string;
  readonly publicationMethod: string;
}

/**
 * 공공선택이론 엔진 메인 인터페이스
 */
export interface IPublicChoiceEngine {
  /**
   * 중간 유권자 분석
   * Median Voter Theorem 적용하여 정책 지지도 예측
   */
  analyzeMedianVoter(
    voterPreferences: IVoterPreference[],
    policyProposal: IPolicyProposal
  ): Promise<Result<IMedianVoterAnalysis>>;

  /**
   * Iron Triangle 강도 분석 및 극복 방안 제시
   */
  analyzeIronTriangle(
    policyArea: PolicyCategory,
    stakeholderInfluences: Map<string, number>
  ): Promise<Result<IIronTriangleAnalysis>>;

  /**
   * 직접민주주의 시뮬레이션
   * 다양한 참여 메커니즘의 효과 예측
   */
  simulateDirectDemocracy(
    policy: IPolicyProposal,
    voterPreferences: IVoterPreference[],
    participationMechanism: ParticipationType
  ): Promise<Result<IDirectDemocracySimulation>>;

  /**
   * 공공재 배분 최적화
   * Pareto 효율성과 사회후생 극대화
   */
  optimizePublicGoodsAllocation(
    totalBudget: number,
    policyProposals: IPolicyProposal[],
    voterPreferences: IVoterPreference[]
  ): Promise<Result<IPublicGoodsAllocation>>;

  /**
   * Rent-Seeking 활동 탐지
   * 사회적 낭비 요소 식별 및 방지책 제시
   */
  detectRentSeeking(
    policyImplementation: IPolicyProposal,
    stakeholderBehaviors: Map<string, number[]>
  ): Promise<Result<IRentSeekingDetection>>;

  /**
   * Constitutional Economics 설계
   * 제도적 프레임워크 최적화
   */
  designConstitutionalFramework(
    objectives: string[],
    constraints: string[],
    stakeholders: string[]
  ): Promise<Result<IConstitutionalDesign>>;

  /**
   * 전체 공공선택 시스템 건전성 평가
   */
  evaluateSystemHealth(): Promise<
    Result<{
      ironTriangleScore: IronTriangleScore;
      participationRate: CitizenParticipationRate;
      legitimacyScore: DemocraticLegitimacyScore;
      transparencyScore: BudgetTransparencyScore;
      overallHealthScore: number;
    }>
  >;
}
