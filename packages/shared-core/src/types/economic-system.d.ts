/**
 * 경제 시스템 핵심 타입 정의
 * Jensen & Meckling Agency Theory 및 CAPM 모델 기반
 */
import type { AccuracyScore, InformationTransparency, PMC, PMP, RiskAversionCoefficient, SocialLearningIndex } from "./branded-types";
/**
 * 예측 결과 상태
 */
export declare enum PredictionResult {
    PENDING = "PENDING",// 결과 대기
    CORRECT = "CORRECT",// 정답
    INCORRECT = "INCORRECT",// 오답
    PARTIALLY_CORRECT = "PARTIALLY_CORRECT"
}
/**
 * MoneyWave 타입 (3단계 경제 순환)
 */
export declare enum MoneyWaveType {
    WAVE1 = "WAVE1",// EBIT 기반 PMC 발행
    WAVE2 = "WAVE2",// 미사용 PMC 재분배
    WAVE3 = "WAVE3"
}
/**
 * 투자 리그 타입
 */
export declare enum LeagueType {
    MAJOR = "MAJOR",// Major League (광고 시청)
    LOCAL = "LOCAL",// Local League (지역 소비)
    CLOUD = "CLOUD"
}
/**
 * CAPM 위험-수익 구조
 */
export interface CAPMParameters {
    riskFreeRate: number;
    marketRiskPremium: number;
    beta: number;
    expectedEBIT: number;
}
/**
 * Agency Cost 계산 파라미터
 */
export interface AgencyCostParams {
    predictionAccuracy: AccuracyScore;
    socialLearningIndex: SocialLearningIndex;
    informationTransparency: InformationTransparency;
}
/**
 * PMP-PMC 전환 결과
 */
export interface ConversionResult {
    conversionRate: number;
    agencyCostReduction: number;
    incentiveAlignment: number;
    socialWelfareGain: number;
}
/**
 * 사용자 포트폴리오
 */
export interface UserPortfolio {
    userId: string;
    pmpBalance: PMP;
    pmcBalance: PMC;
    riskTolerance: RiskAversionCoefficient;
    totalUtility: number;
    socialContribution: number;
}
/**
 * 효용함수 계수
 * U(x) = α·ln(PMP) + β·ln(PMC) + γ·S(Donate)
 */
export interface UtilityFunctionCoefficients {
    alpha: number;
    beta: number;
    gamma: number;
}
/**
 * 사회후생함수 파라미터
 */
export interface SocialWelfareParams {
    individualUtilities: number[];
    giniCoefficient: number;
    equityWeight: number;
}
/**
 * 네트워크 효과 측정
 */
export interface NetworkEffectMetrics {
    activeUsers: number;
    connectionDensity: number;
    metcalfeValue: number;
    reedValue: number;
    crossNetworkEffect: number;
}
/**
 * 예측 시장 데이터
 */
export interface PredictionMarketData {
    totalParticipants: number;
    totalPMPStaked: PMP;
    averageConfidence: number;
    consensusAccuracy: number;
    informationAggregation: number;
}
/**
 * Agency Cost 최적화 관련 타입들
 */
export interface OptimizationConfig {
    maxIterations?: number;
    convergenceThreshold?: number;
    maxIncentiveReward?: number;
    maxIncentiveCost?: number;
    optimizationMethod?: "monte_carlo" | "genetic_algorithm" | "gradient_descent";
}
export interface SocialWelfareMetrics {
    totalSocialWelfare: number;
    averageWelfare: number;
    efficiencyIndex: number;
    equityIndex: number;
    agencyCostIndex: number;
    paretoEfficiency: number;
    recommendations: string[];
}
export interface EfficiencyAnalysis {
    paretoEfficiency: number;
    allocativeEfficiency: number;
    technicalEfficiency: number;
    dynamicEfficiency: number;
    overallEfficiency: number;
    bottlenecks: string[];
    improvementPotential: number;
}
export interface IncentiveStructure {
    type: string;
    reward: number;
    cost: number;
    effectiveness: number;
    conditions: string[];
}
/**
 * Jensen & Meckling Agency Theory 관련 타입들
 */
export interface AgencyCostProfile {
    monitoringCost: number;
    bondingCost: number;
    residualLoss: number;
    totalAgencyCost: number;
    costEfficiency: number;
}
/**
 * Principal-Agent 관계 상세 정의
 */
export interface PrincipalAgentRelationship {
    principalId: string;
    agentId: string;
    relationshipType: "citizen_bureaucrat" | "citizen_politician" | "investor_manager";
    informationAsymmetryLevel: number;
    goalAlignment: number;
    trustLevel: number;
    monitoringDifficulty: number;
    principalKnowledge: number;
    communicationEfficiency: number;
    decisionMakingSpeed: number;
    expectedOutcome: number;
    currentIncentives?: IncentiveStructure[];
}
/**
 * 정보 비대칭 해결 방안
 */
export interface InformationAsymmetryResolution {
    transparencyLevel: InformationTransparency;
    disclosureRequirements: string[];
    monitoringMechanisms: string[];
    verificationProcesses: string[];
    socialLearningEffect: SocialLearningIndex;
}
/**
 * 역선택 문제 해결 방안
 */
export interface AdverseSelectionSolution {
    screening: {
        criteria: string[];
        process: string[];
        effectiveness: number;
    };
    signaling: {
        signals: string[];
        credibility: number;
        cost: number;
    };
    selfSelection: {
        mechanisms: string[];
        participation: number;
    };
}
/**
 * 도덕적 해이 방지 메커니즘
 */
export interface MoralHazardPrevention {
    monitoring: {
        frequency: "real_time" | "daily" | "weekly" | "monthly";
        methods: string[];
        coverage: number;
    };
    incentives: {
        structure: IncentiveStructure[];
        alignment: number;
        effectiveness: number;
    };
    penalties: {
        types: string[];
        severity: number;
        deterrentEffect: number;
    };
}
/**
 * Agency Cost 최적화 목표 설정
 */
export interface OptimizationTarget {
    minimizeAgencyCost: boolean;
    maximizeSocialWelfare: boolean;
    enhanceEfficiency: boolean;
    improveTrustLevel: boolean;
}
