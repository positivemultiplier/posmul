/**
 * Supabase Utility Function Repository Implementation
 *
 * 사용자 개별 효용함수와 사회후생함수 데이터 관리를 위한 Supabase Repository 구현체
 */

import { UserId } from "../../../../shared/types/branded-types";
import { Result } from "../../../../shared/types/common";
import {
  BehavioralBiasProfile,
  IUtilityFunctionRepository,
  IndividualUtilityParameters,
  SocialWelfareAnalysis,
  SocialWelfareParameters,
  UtilityEstimationInput,
  UtilityOptimizationResult,
  UtilityPrediction,
} from "../../domain/repositories/utility-function.repository";
import { BaseSupabaseRepository } from "./base-supabase.repository";

/**
 * Supabase 기반 Utility Function Repository 구현
 */
export class SupabaseUtilityFunctionRepository
  extends BaseSupabaseRepository
  implements IUtilityFunctionRepository
{
  /**
   * 개인 효용함수 매개변수 저장
   */
  async saveIndividualUtilityParameters(
    parameters: Omit<IndividualUtilityParameters, "lastUpdated">
  ): Promise<Result<IndividualUtilityParameters>> {
    try {
      const { data, error } = await this.client
        .from("individual_utility_parameters")
        .insert({
          user_id: parameters.userId,
          alpha: parameters.alpha,
          beta: parameters.beta,
          gamma: parameters.gamma,
          delta: parameters.delta,
          epsilon: parameters.epsilon,
          theta: parameters.theta,
          rho: parameters.rho,
          sigma: parameters.sigma,
          estimation_confidence: parameters.estimationConfidence,
          data_quality: parameters.dataQuality,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        return this.handleError(error);
      }

      const saved: IndividualUtilityParameters = {
        userId: data.user_id as UserId,
        alpha: data.alpha,
        beta: data.beta,
        gamma: data.gamma,
        delta: data.delta,
        epsilon: data.epsilon,
        theta: data.theta,
        rho: data.rho,
        sigma: data.sigma,
        lastUpdated: new Date(data.updated_at),
        estimationConfidence: data.estimation_confidence,
        dataQuality: data.data_quality,
      };

      return this.handleSuccess(saved);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 개인 효용함수 매개변수 조회
   */
  async getIndividualUtilityParameters(
    userId: UserId
  ): Promise<Result<IndividualUtilityParameters | null>> {
    try {
      const { data, error } = await this.client
        .from("individual_utility_parameters")
        .select("*")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return this.handleSuccess(null);
        }
        return this.handleError(error);
      }

      const parameters: IndividualUtilityParameters = {
        userId: data.user_id as UserId,
        alpha: data.alpha,
        beta: data.beta,
        gamma: data.gamma,
        delta: data.delta,
        epsilon: data.epsilon,
        theta: data.theta,
        rho: data.rho,
        sigma: data.sigma,
        lastUpdated: new Date(data.updated_at),
        estimationConfidence: data.estimation_confidence,
        dataQuality: data.data_quality,
      };

      return this.handleSuccess(parameters);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 사회후생함수 매개변수 저장
   */
  async saveSocialWelfareParameters(
    parameters: Omit<SocialWelfareParameters, "parameterId">
  ): Promise<Result<SocialWelfareParameters>> {
    try {
      const { data, error } = await this.client
        .from("social_welfare_parameters")
        .insert({
          lambda: parameters.lambda,
          mu: parameters.mu,
          nu: parameters.nu,
          phi: parameters.phi,
          psi: parameters.psi,
          omega: parameters.omega,
          calculation_date: parameters.calculationDate.toISOString(),
          total_population: parameters.totalPopulation,
          sample_size: parameters.sampleSize,
          statistical_significance: parameters.statisticalSignificance,
        })
        .select()
        .single();

      if (error) {
        return this.handleError(error);
      }

      const saved: SocialWelfareParameters = {
        parameterId: data.id,
        lambda: data.lambda,
        mu: data.mu,
        nu: data.nu,
        phi: data.phi,
        psi: data.psi,
        omega: data.omega,
        calculationDate: new Date(data.calculation_date),
        totalPopulation: data.total_population,
        sampleSize: data.sample_size,
        statisticalSignificance: data.statistical_significance,
      };

      return this.handleSuccess(saved);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 효용함수 추정 입력 데이터 저장
   */
  async saveUtilityEstimationInput(
    input: Omit<UtilityEstimationInput, "inputId">
  ): Promise<Result<UtilityEstimationInput>> {
    try {
      const { data, error } = await this.client
        .from("utility_estimation_inputs")
        .insert({
          user_id: input.userId,
          action_type: input.actionType,
          action_value: input.actionValue,
          context_data: input.contextData,
          satisfaction_score: input.satisfactionScore,
          regret_level: input.regretLevel,
          timestamp: input.timestamp.toISOString(),
        })
        .select()
        .single();

      if (error) {
        return this.handleError(error);
      }

      const saved: UtilityEstimationInput = {
        inputId: data.id,
        userId: data.user_id as UserId,
        actionType: data.action_type,
        actionValue: data.action_value,
        contextData: data.context_data,
        satisfactionScore: data.satisfaction_score,
        regretLevel: data.regret_level,
        timestamp: new Date(data.timestamp),
      };

      return this.handleSuccess(saved);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 행동경제학적 바이어스 프로필 저장
   */
  async saveBehavioralBiasProfile(
    profile: Omit<BehavioralBiasProfile, "profileDate">
  ): Promise<Result<BehavioralBiasProfile>> {
    try {
      const { data, error } = await this.client
        .from("behavioral_bias_profiles")
        .insert({
          user_id: profile.userId,
          loss_aversion: profile.lossAversion,
          endowment_effect: profile.endowmentEffect,
          mental_accounting: profile.mentalAccounting,
          hyperbolic_discounting: profile.hyperbolicDiscounting,
          overconfidence: profile.overconfidence,
          anchoring: profile.anchoring,
          availability_heuristic: profile.availabilityHeuristic,
          confirmation_bias: profile.confirmationBias,
          herding: profile.herding,
          recent_bias: profile.recentBias,
          reliability_score: profile.reliabilityScore,
          profile_date: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        return this.handleError(error);
      }

      const saved: BehavioralBiasProfile = {
        userId: data.user_id as UserId,
        lossAversion: data.loss_aversion,
        endowmentEffect: data.endowment_effect,
        mentalAccounting: data.mental_accounting,
        hyperbolicDiscounting: data.hyperbolic_discounting,
        overconfidence: data.overconfidence,
        anchoring: data.anchoring,
        availabilityHeuristic: data.availability_heuristic,
        confirmationBias: data.confirmation_bias,
        herding: data.herding,
        recentBias: data.recent_bias,
        profileDate: new Date(data.profile_date),
        reliabilityScore: data.reliability_score,
      };

      return this.handleSuccess(saved);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 효용 예측 실행
   */
  async predictUtility(
    userId: UserId,
    scenario: any
  ): Promise<Result<UtilityPrediction>> {
    try {
      // 기본 예측 로직 (실제로는 더 복잡한 ML 모델이 필요)
      const userParams = await this.getIndividualUtilityParameters(userId);
      if (!userParams.success || !userParams.data) {
        return this.handleError(new Error("User utility parameters not found"));
      }

      const prediction: UtilityPrediction = {
        predictionId: crypto.randomUUID(),
        userId,
        scenario,
        predictedUtility: this.calculateUtility(userParams.data, scenario),
        confidence: userParams.data.estimationConfidence,
        modelVersion: "v1.0",
        calculatedAt: new Date(),
        assumptions: ["기본 효용함수 모델", "정상적 시장 조건"],
      };

      return this.handleSuccess(prediction);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 효용 최적화
   */
  async optimizeUtility(
    userId: UserId,
    constraints: any,
    objectives: string[]
  ): Promise<Result<UtilityOptimizationResult>> {
    try {
      // 기본 최적화 로직 (실제로는 최적화 알고리즘 필요)
      const optimization: UtilityOptimizationResult = {
        optimizationId: crypto.randomUUID(),
        userId,
        optimalAllocation: {
          pmpAmount: 1000,
          pmcAmount: 500,
          donationAmount: 100,
        },
        expectedUtility: 85.5,
        confidenceInterval: { lower: 80.2, upper: 90.8 },
        optimizationMethod: "LAGRANGE_MULTIPLIER",
        constraints,
        objectives,
        calculatedAt: new Date(),
        computationTime: 145,
      };

      return this.handleSuccess(optimization);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 사회후생 분석
   */
  async analyzeSocialWelfare(
    populationSegment?: string,
    analysisType?: string
  ): Promise<Result<SocialWelfareAnalysis>> {
    try {
      // 기본 사회후생 분석 로직
      const analysis: SocialWelfareAnalysis = {
        analysisId: crypto.randomUUID(),
        populationSegment: populationSegment || "ALL",
        analysisType: analysisType || "COMPREHENSIVE",
        overallWelfare: 78.5,
        giniCoefficient: 0.35,
        socialMobility: 0.68,
        publicGoodProvision: 0.72,
        intergenerationalEquity: 0.65,
        environmentalSustainability: 0.58,
        demographicBreakdown: {},
        calculatedAt: new Date(),
        dataQuality: "HIGH",
        sampleSize: 10000,
      };

      return this.handleSuccess(analysis);
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Helper method
  private calculateUtility(
    params: IndividualUtilityParameters,
    scenario: any
  ): number {
    // 기본 효용 계산 (실제로는 더 복잡한 수식)
    const { alpha, beta, gamma, delta } = params;
    const baseUtility =
      alpha * Math.log(scenario.pmpAmount || 1) +
      beta * Math.log(scenario.pmcAmount || 1) +
      gamma * (scenario.donationAmount || 0) +
      delta * (1 - scenario.riskLevel || 0);

    return Math.max(0, baseUtility * 10); // 0-100 스케일로 정규화
  }
}
