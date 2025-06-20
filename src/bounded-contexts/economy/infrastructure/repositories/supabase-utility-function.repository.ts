/**
 * Supabase Utility Function Repository Implementation
 *
 * 사용자 개별 효용함수와 사회후생함수 데이터 관리를 위한 Supabase Repository 구현체
 * IUtilityFunctionRepository 인터페이스를 Supabase로 구현
 */

import { UserId } from "@/shared/types/branded-types";
import { Result } from "@/shared/types/common";
import {
  BehavioralBiasProfile,
  IUtilityFunctionRepository,
  IndividualUtilityParameters,
  SocialWelfareMeasurement,
  SocialWelfareParameters,
  UtilityEstimationInput,
  UtilityPrediction,
} from "../../domain/repositories/utility-function.repository";
import { PMC, createPMC, createPMP } from "../../domain/value-objects";
import { BaseSupabaseRepository } from "./base-supabase.repository";

/**
 * Supabase 기반 Utility Function Repository 구현
 */
export class SupabaseUtilityFunctionRepository
  extends BaseSupabaseRepository
  implements IUtilityFunctionRepository
{
  /**
   * 개인 효용함수 매개변수 저장/업데이트
   */
  async saveUtilityParameters(
    parameters: IndividualUtilityParameters
  ): Promise<Result<IndividualUtilityParameters>> {
    try {
      const { data, error } = await this.client
        .from("individual_utility_parameters")
        .upsert({
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
          updated_at: parameters.lastUpdated.toISOString(),
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
  async getUtilityParameters(
    userId: UserId
  ): Promise<Result<IndividualUtilityParameters>> {
    try {
      const { data, error } = await this.client
        .from("individual_utility_parameters")
        .select("*")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .single();

      if (error) {
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
   * 여러 사용자 효용함수 매개변수 조회
   */
  async getBatchUtilityParameters(
    userIds: UserId[]
  ): Promise<Result<IndividualUtilityParameters[]>> {
    try {
      const { data, error } = await this.client
        .from("individual_utility_parameters")
        .select("*")
        .in("user_id", userIds);

      if (error) {
        return this.handleError(error);
      }

      const parameters = data.map(
        (row): IndividualUtilityParameters => ({
          userId: row.user_id as UserId,
          alpha: row.alpha,
          beta: row.beta,
          gamma: row.gamma,
          delta: row.delta,
          epsilon: row.epsilon,
          theta: row.theta,
          rho: row.rho,
          sigma: row.sigma,
          lastUpdated: new Date(row.updated_at),
          estimationConfidence: row.estimation_confidence,
          dataQuality: row.data_quality,
        })
      );

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
   * 최신 사회후생함수 매개변수 조회
   */
  async getLatestSocialWelfareParameters(): Promise<
    Result<SocialWelfareParameters>
  > {
    try {
      const { data, error } = await this.client
        .from("social_welfare_parameters")
        .select("*")
        .order("calculation_date", { ascending: false })
        .limit(1)
        .single();

      if (error) {
        return this.handleError(error);
      }

      const parameters: SocialWelfareParameters = {
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

      return this.handleSuccess(parameters);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 효용함수 추정 입력 데이터 저장
   */
  async saveEstimationInput(
    input: Omit<UtilityEstimationInput, "inputId">
  ): Promise<Result<UtilityEstimationInput>> {
    try {
      const { data, error } = await this.client
        .from("utility_estimation_inputs")
        .insert({
          user_id: input.userId,
          action_type: input.actionType,
          action_value: input.actionValue,
          context_data: {
            pmp_balance: input.contextData.pmpBalance,
            pmc_balance: input.contextData.pmcBalance,
            market_condition: input.contextData.marketCondition,
            social_context: input.contextData.socialContext,
            time_of_day: input.contextData.timeOfDay,
            weekday: input.contextData.weekday,
          },
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
        contextData: {
          pmpBalance: createPMP(data.context_data.pmp_balance),
          pmcBalance: createPMC(data.context_data.pmc_balance),
          marketCondition: data.context_data.market_condition,
          socialContext: data.context_data.social_context,
          timeOfDay: data.context_data.time_of_day,
          weekday: data.context_data.weekday,
        },
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
   * 사용자 행동 데이터 조회 (효용함수 추정용)
   */
  async getEstimationInputs(
    userId: UserId,
    startDate?: Date,
    endDate?: Date,
    limit?: number
  ): Promise<Result<UtilityEstimationInput[]>> {
    try {
      let query = this.client
        .from("utility_estimation_inputs")
        .select("*")
        .eq("user_id", userId)
        .order("timestamp", { ascending: false });

      if (startDate) {
        query = query.gte("timestamp", startDate.toISOString());
      }
      if (endDate) {
        query = query.lte("timestamp", endDate.toISOString());
      }
      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        return this.handleError(error);
      }

      const inputs = data.map(
        (row): UtilityEstimationInput => ({
          inputId: row.id,
          userId: row.user_id as UserId,
          actionType: row.action_type,
          actionValue: row.action_value,
          contextData: {
            pmpBalance: createPMP(row.context_data.pmp_balance),
            pmcBalance: createPMC(row.context_data.pmc_balance),
            marketCondition: row.context_data.market_condition,
            socialContext: row.context_data.social_context,
            timeOfDay: row.context_data.time_of_day,
            weekday: row.context_data.weekday,
          },
          satisfactionScore: row.satisfaction_score,
          regretLevel: row.regret_level,
          timestamp: new Date(row.timestamp),
        })
      );

      return this.handleSuccess(inputs);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 행동경제학적 바이어스 프로필 저장
   */
  async saveBehavioralBiasProfile(
    profile: BehavioralBiasProfile
  ): Promise<Result<BehavioralBiasProfile>> {
    try {
      const { data, error } = await this.client
        .from("behavioral_bias_profiles")
        .upsert({
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
          profile_date: profile.profileDate.toISOString(),
          reliability_score: profile.reliabilityScore,
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
   * 행동경제학적 바이어스 프로필 조회
   */
  async getBehavioralBiasProfile(
    userId: UserId
  ): Promise<Result<BehavioralBiasProfile>> {
    try {
      const { data, error } = await this.client
        .from("behavioral_bias_profiles")
        .select("*")
        .eq("user_id", userId)
        .order("profile_date", { ascending: false })
        .limit(1)
        .single();

      if (error) {
        return this.handleError(error);
      }

      const profile: BehavioralBiasProfile = {
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

      return this.handleSuccess(profile);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 효용함수 예측 저장
   */
  async saveUtilityPrediction(
    prediction: Omit<UtilityPrediction, "predictionId">
  ): Promise<Result<UtilityPrediction>> {
    try {
      const { data, error } = await this.client
        .from("utility_predictions")
        .insert({
          user_id: prediction.userId,
          scenario: prediction.scenario,
          predicted_utility: prediction.predictedUtility,
          confidence: prediction.confidence,
          confidence_interval: prediction.confidenceInterval,
          marginal_utilities: prediction.marginalUtilities,
          prediction_date: prediction.predictionDate.toISOString(),
          valid_until: prediction.validUntil.toISOString(),
        })
        .select()
        .single();

      if (error) {
        return this.handleError(error);
      }

      const saved: UtilityPrediction = {
        predictionId: data.id,
        userId: data.user_id as UserId,
        scenario: data.scenario,
        predictedUtility: data.predicted_utility,
        confidence: data.confidence,
        confidenceInterval: data.confidence_interval,
        marginalUtilities: data.marginal_utilities,
        predictionDate: new Date(data.prediction_date),
        validUntil: new Date(data.valid_until),
      };

      return this.handleSuccess(saved);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 효용함수 예측 조회
   */
  async getUtilityPredictions(
    userId: UserId,
    validOnly?: boolean
  ): Promise<Result<UtilityPrediction[]>> {
    try {
      let query = this.client
        .from("utility_predictions")
        .select("*")
        .eq("user_id", userId)
        .order("prediction_date", { ascending: false });

      if (validOnly) {
        query = query.gte("valid_until", new Date().toISOString());
      }

      const { data, error } = await query;

      if (error) {
        return this.handleError(error);
      }

      const predictions = data.map(
        (row): UtilityPrediction => ({
          predictionId: row.id,
          userId: row.user_id as UserId,
          scenario: row.scenario,
          predictedUtility: row.predicted_utility,
          confidence: row.confidence,
          confidenceInterval: row.confidence_interval,
          marginalUtilities: row.marginal_utilities,
          predictionDate: new Date(row.prediction_date),
          validUntil: new Date(row.valid_until),
        })
      );

      return this.handleSuccess(predictions);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 사회후생 측정 결과 저장
   */
  async saveSocialWelfareMeasurement(
    measurement: Omit<SocialWelfareMeasurement, "measurementId">
  ): Promise<Result<SocialWelfareMeasurement>> {
    try {
      const { data, error } = await this.client
        .from("social_welfare_measurements")
        .insert({
          measurement_date: measurement.measurementDate.toISOString(),
          aggregate_utility: measurement.aggregateUtility,
          gini_coefficient: measurement.giniCoefficient,
          social_mobility_index: measurement.socialMobilityIndex,
          public_good_contribution: measurement.publicGoodContribution,
          inequality_adjusted_welfare: measurement.inequalityAdjustedWelfare,
          rawlsian_maximin: measurement.rawlsianMaximin,
          utilitarian_sum: measurement.utilitarianSum,
          prioritarian_weighted: measurement.prioritarianWeighted,
          sample_size: measurement.sampleSize,
          statistical_power: measurement.staticticalPower,
        })
        .select()
        .single();

      if (error) {
        return this.handleError(error);
      }

      const saved: SocialWelfareMeasurement = {
        measurementId: data.id,
        measurementDate: new Date(data.measurement_date),
        aggregateUtility: data.aggregate_utility,
        giniCoefficient: data.gini_coefficient,
        socialMobilityIndex: data.social_mobility_index,
        publicGoodContribution: data.public_good_contribution,
        inequalityAdjustedWelfare: data.inequality_adjusted_welfare,
        rawlsianMaximin: data.rawlsian_maximin,
        utilitarianSum: data.utilitarian_sum,
        prioritarianWeighted: data.prioritarian_weighted,
        sampleSize: data.sample_size,
        staticticalPower: data.statistical_power,
      };

      return this.handleSuccess(saved);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 사회후생 측정 결과 조회
   */
  async getSocialWelfareMeasurements(
    startDate?: Date,
    endDate?: Date,
    limit?: number
  ): Promise<Result<SocialWelfareMeasurement[]>> {
    try {
      let query = this.client
        .from("social_welfare_measurements")
        .select("*")
        .order("measurement_date", { ascending: false });

      if (startDate) {
        query = query.gte("measurement_date", startDate.toISOString());
      }
      if (endDate) {
        query = query.lte("measurement_date", endDate.toISOString());
      }
      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        return this.handleError(error);
      }

      const measurements = data.map(
        (row): SocialWelfareMeasurement => ({
          measurementId: row.id,
          measurementDate: new Date(row.measurement_date),
          aggregateUtility: row.aggregate_utility,
          giniCoefficient: row.gini_coefficient,
          socialMobilityIndex: row.social_mobility_index,
          publicGoodContribution: row.public_good_contribution,
          inequalityAdjustedWelfare: row.inequality_adjusted_welfare,
          rawlsianMaximin: row.rawlsian_maximin,
          utilitarianSum: row.utilitarian_sum,
          prioritarianWeighted: row.prioritarian_weighted,
          sampleSize: row.sample_size,
          staticticalPower: row.statistical_power,
        })
      );

      return this.handleSuccess(measurements);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 효용함수 유사도 기반 사용자 클러스터링
   */
  async findSimilarUtilityProfiles(
    userId: UserId,
    threshold: number = 0.8,
    limit: number = 10
  ): Promise<
    Result<
      {
        similarUserId: UserId;
        similarity: number;
        parameters: IndividualUtilityParameters;
      }[]
    >
  > {
    try {
      // RPC 함수를 사용하여 복잡한 유사도 계산 수행
      const { data, error } = await this.client.rpc(
        "find_similar_utility_profiles",
        {
          target_user_id: userId,
          similarity_threshold: threshold,
          result_limit: limit,
        }
      );

      if (error) {
        return this.handleError(error);
      }

      const similarProfiles = data.map((row: any) => ({
        similarUserId: row.user_id as UserId,
        similarity: row.similarity,
        parameters: {
          userId: row.user_id as UserId,
          alpha: row.alpha,
          beta: row.beta,
          gamma: row.gamma,
          delta: row.delta,
          epsilon: row.epsilon,
          theta: row.theta,
          rho: row.rho,
          sigma: row.sigma,
          lastUpdated: new Date(row.updated_at),
          estimationConfidence: row.estimation_confidence,
          dataQuality: row.data_quality,
        },
      }));

      return this.handleSuccess(similarProfiles);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 집단 효용함수 분석 (세그먼트별)
   */
  async getSegmentUtilityAnalysis(segmentCriteria: {
    ageRange?: [number, number];
    pmcBalanceRange?: [PMC, PMC];
    activityLevel?: "HIGH" | "MEDIUM" | "LOW";
    behavioralType?: string;
  }): Promise<
    Result<
      {
        segmentId: string;
        userCount: number;
        avgParameters: Omit<
          IndividualUtilityParameters,
          "userId" | "lastUpdated"
        >;
        parameterVariance: Record<string, number>;
        distinctiveness: number;
      }[]
    >
  > {
    try {
      const { data, error } = await this.client.rpc(
        "analyze_utility_segments",
        {
          criteria: segmentCriteria,
        }
      );

      if (error) {
        return this.handleError(error);
      }

      return this.handleSuccess(data);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 효용함수 변화 추이 분석
   */
  async getUtilityTrends(
    userId: UserId,
    startDate: Date,
    endDate: Date
  ): Promise<
    Result<
      {
        timestamp: Date;
        parameters: IndividualUtilityParameters;
        changeRate: Record<string, number>;
      }[]
    >
  > {
    try {
      const { data, error } = await this.client.rpc("analyze_utility_trends", {
        target_user_id: userId,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
      });

      if (error) {
        return this.handleError(error);
      }

      const trends = data.map((row: any) => ({
        timestamp: new Date(row.timestamp),
        parameters: {
          userId: row.user_id as UserId,
          alpha: row.alpha,
          beta: row.beta,
          gamma: row.gamma,
          delta: row.delta,
          epsilon: row.epsilon,
          theta: row.theta,
          rho: row.rho,
          sigma: row.sigma,
          lastUpdated: new Date(row.updated_at),
          estimationConfidence: row.estimation_confidence,
          dataQuality: row.data_quality,
        },
        changeRate: row.change_rate,
      }));

      return this.handleSuccess(trends);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 대시보드용 효용함수 요약 통계
   */
  async getUtilitySummaryStatistics(): Promise<
    Result<{
      totalUsersWithUtility: number;
      averageConfidence: number;
      mostVolatileParameter: string;
      mostStableParameter: string;
      correlationMatrix: Record<string, Record<string, number>>;
      lastCalculationDate: Date;
    }>
  > {
    try {
      const { data, error } = await this.client.rpc("get_utility_statistics");

      if (error) {
        return this.handleError(error);
      }

      const statistics = {
        totalUsersWithUtility: data.total_users_with_utility,
        averageConfidence: data.average_confidence,
        mostVolatileParameter: data.most_volatile_parameter,
        mostStableParameter: data.most_stable_parameter,
        correlationMatrix: data.correlation_matrix,
        lastCalculationDate: new Date(data.last_calculation_date),
      };

      return this.handleSuccess(statistics);
    } catch (error) {
      return this.handleError(error);
    }
  }
}
