/**
 * Supabase Utility Function Repository Implementation (MCP Version)
 *
 * 사용자 개별 효용함수와 사회후생함수 데이터 관리를 위한 Supabase MCP Repository 구현체
 * IUtilityFunctionRepository 인터페이스를 Supabase로 구현
 */

import { UserId } from "@posmul/auth-economy-sdk";

import { Result } from "@posmul/auth-economy-sdk";

import {
  BehavioralBiasProfile,
  IUtilityFunctionRepository,
  IndividualUtilityParameters,
  SocialWelfareMeasurement,
  SocialWelfareParameters,
  UtilityEstimationInput,
  UtilityPrediction,
} from "../../domain/repositories/utility-function.repository";
import { BaseMCPRepository } from "./base-mcp.repository";

// Helper Functions to map data from DB to Domain Objects
const toIndividualUtilityParameters = (
  data: any
): IndividualUtilityParameters => ({
  userId: data.user_id,
  alpha: data.alpha,
  beta: data.beta,
  gamma: data.gamma,
  delta: data.delta,
  epsilon: data.epsilon,
  theta: data.theta,
  rho: data.rho,
  sigma: data.sigma,
  lastUpdated: new Date(data.lastUpdated || data.updated_at),
  estimationConfidence: data.estimation_confidence,
  dataQuality: data.data_quality,
});

const toSocialWelfareParameters = (data: any): SocialWelfareParameters => ({
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
});

const toUtilityEstimationInput = (data: any): UtilityEstimationInput => ({
  inputId: data.id,
  userId: data.user_id,
  actionType: data.action_type,
  actionValue: data.action_value,
  contextData: JSON.parse(data.context_data),
  satisfactionScore: data.satisfaction_score,
  regretLevel: data.regret_level,
  timestamp: new Date(data.timestamp),
});

const toBehavioralBiasProfile = (data: any): BehavioralBiasProfile => ({
  userId: data.user_id,
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
});

// Other helpers for toUtilityPrediction, toSocialWelfareMeasurement can be added here

export class SupabaseUtilityFunctionRepository
  extends BaseMCPRepository
  implements IUtilityFunctionRepository
{
  private async _handleError(error: unknown): Promise<Result<any, Error>> {
    console.error("Repository Error:", error);
    return { success: false, error: new Error(String(error)) };
  }

  async saveUtilityParameters(
    parameters: IndividualUtilityParameters
  ): Promise<Result<IndividualUtilityParameters>> {
    try {
      const p = parameters;
      const query = `
                INSERT INTO individual_utility_parameters (user_id, alpha, beta, gamma, delta, epsilon, theta, rho, sigma, estimation_confidence, data_quality, updated_at)
                VALUES ('${p.userId}', ${p.alpha}, ${p.beta}, ${p.gamma}, ${
        p.delta
      }, ${p.epsilon}, ${p.theta}, ${p.rho}, ${p.sigma}, ${
        p.estimationConfidence
      }, '${p.dataQuality}', '${p.lastUpdated.toISOString()}')
                ON CONFLICT (user_id) DO UPDATE SET
                    alpha = EXCLUDED.alpha, beta = EXCLUDED.beta, gamma = EXCLUDED.gamma, delta = EXCLUDED.delta,
                    epsilon = EXCLUDED.epsilon, theta = EXCLUDED.theta, rho = EXCLUDED.rho, sigma = EXCLUDED.sigma,
                    estimation_confidence = EXCLUDED.estimation_confidence, data_quality = EXCLUDED.data_quality, updated_at = EXCLUDED.updated_at
                RETURNING *;`;
      const result = await this.executeQuery(query);
      return {
        success: true,
        data: toIndividualUtilityParameters(result.data[0]),
      };
    } catch (error) {
      return this._handleError(error);
    }
  }

  async getUtilityParameters(
    userId: UserId
  ): Promise<Result<IndividualUtilityParameters>> {
    try {
      const query = `SELECT * FROM individual_utility_parameters WHERE user_id = '${userId}' ORDER BY updated_at DESC LIMIT 1;`;
      const result = await this.executeQuery(query);
      if (!result.data || result.data.length === 0) {
        const defaultParams: IndividualUtilityParameters = {
          userId,
          alpha: 1,
          beta: 1,
          gamma: 0,
          delta: 0,
          epsilon: 0,
          theta: 0.95,
          rho: 1,
          sigma: 1,
          lastUpdated: new Date(),
          estimationConfidence: 0,
          dataQuality: "LOW",
        };
        return { success: true, data: defaultParams };
      }
      return {
        success: true,
        data: toIndividualUtilityParameters(result.data[0]),
      };
    } catch (error) {
      return this._handleError(error);
    }
  }

  async getBatchUtilityParameters(
    userIds: UserId[]
  ): Promise<Result<IndividualUtilityParameters[]>> {
    if (userIds.length === 0) return { success: true, data: [] };
    try {
      const ids = userIds.map((id) => `'${id}'`).join(",");
      const query = `SELECT * FROM individual_utility_parameters WHERE user_id IN (${ids});`;
      const result = await this.executeQuery(query);
      return {
        success: true,
        data: result.data?.map(toIndividualUtilityParameters) || [],
      };
    } catch (error) {
      return this._handleError(error);
    }
  }

  async saveSocialWelfareParameters(
    parameters: Omit<SocialWelfareParameters, "parameterId">
  ): Promise<Result<SocialWelfareParameters>> {
    try {
      const p = parameters;
      const query = `
                INSERT INTO social_welfare_parameters (lambda, mu, nu, phi, psi, omega, calculation_date, total_population, sample_size, statistical_significance)
                VALUES (${p.lambda}, ${p.mu}, ${p.nu}, ${p.phi}, ${p.psi}, ${
        p.omega
      }, '${p.calculationDate.toISOString()}', ${p.totalPopulation}, ${
        p.sampleSize
      }, ${p.statisticalSignificance})
                RETURNING *;`;
      const result = await this.executeQuery(query);
      return { success: true, data: toSocialWelfareParameters(result.data[0]) };
    } catch (error) {
      return this._handleError(error);
    }
  }

  async getLatestSocialWelfareParameters(): Promise<
    Result<SocialWelfareParameters>
  > {
    try {
      const query = `SELECT * FROM social_welfare_parameters ORDER BY calculation_date DESC LIMIT 1;`;
      const result = await this.executeQuery(query);
      if (!result.data || result.data.length === 0) {
        return {
          success: false,
          error: new Error("Social welfare parameters not found."),
        };
      }
      return { success: true, data: toSocialWelfareParameters(result.data[0]) };
    } catch (error) {
      return this._handleError(error);
    }
  }

  async saveEstimationInput(
    input: Omit<UtilityEstimationInput, "inputId">
  ): Promise<Result<UtilityEstimationInput>> {
    try {
      const i = input;
      const contextDataString = JSON.stringify(i.contextData).replace(
        /'/g,
        "''"
      );
      const query = `
                INSERT INTO utility_estimation_inputs (user_id, action_type, action_value, context_data, satisfaction_score, regret_level, timestamp)
                VALUES ('${i.userId}', '${i.actionType}', ${
        i.actionValue
      }, '${contextDataString}', ${i.satisfactionScore}, ${
        i.regretLevel
      }, '${i.timestamp.toISOString()}')
                RETURNING *;`;
      const result = await this.executeQuery(query);
      return { success: true, data: toUtilityEstimationInput(result.data[0]) };
    } catch (error) {
      return this._handleError(error);
    }
  }

  async getEstimationInputs(
    userId: UserId,
    startDate?: Date,
    endDate?: Date,
    limit: number = 100
  ): Promise<Result<UtilityEstimationInput[]>> {
    try {
      let whereClauses = [`user_id = '${userId}'`];
      if (startDate)
        whereClauses.push(`timestamp >= '${startDate.toISOString()}'`);
      if (endDate) whereClauses.push(`timestamp <= '${endDate.toISOString()}'`);

      const query = `SELECT * FROM utility_estimation_inputs WHERE ${whereClauses.join(
        " AND "
      )} ORDER BY timestamp DESC LIMIT ${limit};`;
      const result = await this.executeQuery(query);
      return {
        success: true,
        data: result.data?.map(toUtilityEstimationInput) || [],
      };
    } catch (e) {
      return this._handleError(e);
    }
  }

  async saveBehavioralBiasProfile(
    profile: BehavioralBiasProfile
  ): Promise<Result<BehavioralBiasProfile>> {
    try {
      const p = profile;
      const query = `
                INSERT INTO behavioral_bias_profiles (user_id, loss_aversion, endowment_effect, mental_accounting, hyperbolic_discounting, overconfidence, anchoring, availability_heuristic, confirmation_bias, herding, recent_bias, profile_date, reliability_score)
                VALUES ('${p.userId}', ${p.lossAversion}, ${
        p.endowmentEffect
      }, ${p.mentalAccounting}, ${p.hyperbolicDiscounting}, ${
        p.overconfidence
      }, ${p.anchoring}, ${p.availabilityHeuristic}, ${p.confirmationBias}, ${
        p.herding
      }, ${p.recentBias}, '${p.profileDate.toISOString()}', ${
        p.reliabilityScore
      })
                ON CONFLICT (user_id) DO UPDATE SET
                    loss_aversion = EXCLUDED.loss_aversion, endowment_effect = EXCLUDED.endowment_effect, mental_accounting = EXCLUDED.mental_accounting,
                    hyperbolic_discounting = EXCLUDED.hyperbolic_discounting, overconfidence = EXCLUDED.overconfidence, anchoring = EXCLUDED.anchoring,
                    availability_heuristic = EXCLUDED.availability_heuristic, confirmation_bias = EXCLUDED.confirmation_bias, herding = EXCLUDED.herding,
                    recent_bias = EXCLUDED.recent_bias, profile_date = EXCLUDED.profile_date, reliability_score = EXCLUDED.reliability_score
                RETURNING *;`;
      const result = await this.executeQuery(query);
      return { success: true, data: toBehavioralBiasProfile(result.data[0]) };
    } catch (e) {
      return this._handleError(e);
    }
  }

  async getBehavioralBiasProfile(
    userId: UserId
  ): Promise<Result<BehavioralBiasProfile>> {
    try {
      const query = `SELECT * FROM behavioral_bias_profiles WHERE user_id = '${userId}';`;
      const result = await this.executeQuery(query);
      if (!result.data || result.data.length === 0) {
        return {
          success: false,
          error: new Error("Behavioral bias profile not found."),
        };
      }
      return { success: true, data: toBehavioralBiasProfile(result.data[0]) };
    } catch (e) {
      return this._handleError(e);
    }
  }

  // --- Placeholder for remaining complex methods ---
  // A full production implementation would require translating RPC calls or complex logic.

  async saveUtilityPrediction(
    prediction: Omit<UtilityPrediction, "predictionId">
  ): Promise<Result<UtilityPrediction>> {
    console.warn(
      "saveUtilityPrediction is a placeholder and not fully implemented."
    );
    const newPrediction = {
      ...prediction,
      predictionId: "pred-" + Math.random(),
    };
    return { success: true, data: newPrediction };
  }
  async getUtilityPredictions(
    userId: UserId,
    validOnly?: boolean
  ): Promise<Result<UtilityPrediction[]>> {
    console.warn(
      "getUtilityPredictions is a placeholder and not fully implemented."
    );
    return { success: true, data: [] };
  }
  async saveSocialWelfareMeasurement(
    measurement: Omit<SocialWelfareMeasurement, "measurementId">
  ): Promise<Result<SocialWelfareMeasurement>> {
    console.warn(
      "saveSocialWelfareMeasurement is a placeholder and not fully implemented."
    );
    const newMeasurement = {
      ...measurement,
      measurementId: "meas-" + Math.random(),
    };
    return { success: true, data: newMeasurement };
  }
  async getSocialWelfareMeasurements(
    startDate?: Date,
    endDate?: Date,
    limit?: number
  ): Promise<Result<SocialWelfareMeasurement[]>> {
    console.warn(
      "getSocialWelfareMeasurements is a placeholder and not fully implemented."
    );
    return { success: true, data: [] };
  }
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
    console.warn(
      "findSimilarUtilityProfiles is a placeholder and not fully implemented."
    );
    return { success: true, data: [] };
  }
  async getSegmentUtilityAnalysis(
    segmentCriteria: any
  ): Promise<Result<any[]>> {
    console.warn(
      "getSegmentUtilityAnalysis is a placeholder and not fully implemented."
    );
    return { success: true, data: [] };
  }
  async getUtilityTrends(
    userId: UserId,
    startDate: Date,
    endDate: Date
  ): Promise<Result<any[]>> {
    console.warn(
      "getUtilityTrends is a placeholder and not fully implemented."
    );
    return { success: true, data: [] };
  }
  async getUtilitySummaryStatistics(): Promise<Result<any>> {
    console.warn(
      "getUtilitySummaryStatistics is a placeholder and not fully implemented."
    );
    return { success: true, data: {} };
  }
}
