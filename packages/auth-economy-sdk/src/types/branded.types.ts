/**
 * Branded Types for PosMul Domain Safety
 *
 * 🎯 Purpose: Provide compile-time type safety for domain-specific values
 * 🔗 Based on: Supabase database schema types
 *
 * These branded types prevent accidental mixing of different ID types
 * and ensure type safety across the entire application.
 */

// Base branded type utility
declare const brand: unique symbol;
type Brand<T, U> = T & { readonly [brand]: U };

// ========== USER DOMAIN ==========
export type UserId = Brand<string, "UserId">;
export type Username = Brand<string, "Username">;
export type DisplayName = Brand<string, "DisplayName">;

// User Profile Types (from user_profiles table)
export type AccountStatus = "ACTIVE" | "SUSPENDED" | "INACTIVE" | "PENDING";
export type AvatarUrl = Brand<string, "AvatarUrl">;
export type UserBio = Brand<string, "UserBio">;

// ========== ECONOMIC DOMAIN ==========
// PMP (Positive Multiplier Points) - Primary currency for predictions
export type PmpAmount = Brand<number, "PmpAmount">;
export type PmpBalance = Brand<number, "PmpBalance">;
export type PmpAvailable = Brand<number, "PmpAvailable">;
export type PmpLocked = Brand<number, "PmpLocked">;
export type PmpTotal = Brand<number, "PmpTotal">;
export type LifetimePmpEarned = Brand<number, "LifetimePmpEarned">;

// PMC (Positive Multiplier Coins) - Reward currency for accuracy
export type PmcAmount = Brand<number, "PmcAmount">;
export type PmcBalance = Brand<number, "PmcBalance">;
export type PmcAvailable = Brand<number, "PmcAvailable">;
export type PmcLocked = Brand<number, "PmcLocked">;
export type PmcTotal = Brand<number, "PmcTotal">;
export type LifetimePmcEarned = Brand<number, "LifetimePmcEarned">;

// Economic Balance IDs
export type EconomicBalanceId = Brand<string, "EconomicBalanceId">;
export type InvestmentBehaviorType =
  | "CONSERVATIVE"
  | "MODERATE"
  | "AGGRESSIVE"
  | "SPECULATIVE";
export type RiskToleranceScore = Brand<number, "RiskToleranceScore">; // 0.0 - 10.0

// ========== REPUTATION DOMAIN ==========
export type ReputationId = Brand<string, "ReputationId">;
export type AccuracyScore = Brand<number, "AccuracyScore">; // 0.0 - 1.0 (0-100%)
export type InvestmentSuccessRate = Brand<number, "InvestmentSuccessRate">; // 0.0 - 1.0
export type CommunityTrustLevel = Brand<number, "CommunityTrustLevel">; // 0.0 - 10.0
export type ForumContributionScore = Brand<number, "ForumContributionScore">;
export type OverallReputationScore = Brand<number, "OverallReputationScore">; // 0.0 - 1000.0
export type ReputationTier =
  | "BRONZE"
  | "SILVER"
  | "GOLD"
  | "PLATINUM"
  | "DIAMOND";
export type RoiAverage = Brand<number, "RoiAverage">; // Average ROI percentage

// Count Types
export type PredictionCount = Brand<number, "PredictionCount">;
export type SuccessfulPredictions = Brand<number, "SuccessfulPredictions">;
export type InvestmentCount = Brand<number, "InvestmentCount">;
export type HelpfulPostsCount = Brand<number, "HelpfulPostsCount">;

// ========== PREDICTION GAME DOMAIN ==========
export type PredictionGameId = Brand<string, "PredictionGameId">;
export type PredictionId = Brand<string, "PredictionId">;
export type ConfidenceLevel = Brand<number, "ConfidenceLevel">; // 0.0 - 1.0
export type StakeAmount = Brand<number, "StakeAmount">;
export type RewardAmount = Brand<number, "RewardAmount">;
export type ParticipantCount = Brand<number, "ParticipantCount">;
export type TotalStake = Brand<number, "TotalStake">;
export type OddsValue = Brand<number, "OddsValue">;
export type ProbabilityValue = Brand<number, "ProbabilityValue">; // 0.0 - 1.0

// Game Status from DB enum
export type GameStatus =
  | "DRAFT"
  | "ACTIVE"
  | "CLOSED"
  | "SETTLED"
  | "CANCELLED";

// Prediction Category from DB enum
export type PredictionCategory =
  | "INVEST"
  | "SPORTS"
  | "ENTERTAINMENT"
  | "POLITICS"
  | "USER_PROPOSED";

// Prediction Type from DB enum
export type PredictionType = "BINARY" | "WIN_DRAW_LOSE" | "RANKING";

// Settlement Type from DB enum
export type SettlementType =
  | "WINNER_TAKE_ALL"
  | "PROPORTIONAL"
  | "CONFIDENCE_WEIGHTED"
  | "HYBRID";

// ========== MIGRATION STATUS DOMAIN ==========
export type MigrationStatusId = Brand<string, "MigrationStatusId">;
export type MigrationPhase = Brand<string, "MigrationPhase">;
export type MigrationStatus = Brand<string, "MigrationStatus">;
export type CompletionPercentage = Brand<number, "CompletionPercentage">; // 0-100
export type TypeScriptErrorsCount = Brand<number, "TypeScriptErrorsCount">;

// ========== COMMON TEMPORAL TYPES ==========
export type CreatedAt = Brand<string, "CreatedAt">; // ISO timestamp
export type UpdatedAt = Brand<string, "UpdatedAt">; // ISO timestamp
export type LastActiveAt = Brand<string, "LastActiveAt">; // ISO timestamp
export type EndTime = Brand<string, "EndTime">; // ISO timestamp

// ========== TYPE GUARDS ==========
// Helper functions to create branded types safely

export const createUserId = (id: string): UserId => {
  if (!id || typeof id !== "string") {
    throw new Error("Invalid UserId: must be a non-empty string");
  }
  return id as UserId;
};

export const createPmpAmount = (amount: number): PmpAmount => {
  if (typeof amount !== "number" || amount < 0) {
    throw new Error("Invalid PmpAmount: must be a non-negative number");
  }
  return amount as PmpAmount;
};

export const createPmcAmount = (amount: number): PmcAmount => {
  if (typeof amount !== "number" || amount < 0) {
    throw new Error("Invalid PmcAmount: must be a non-negative number");
  }
  return amount as PmcAmount;
};

export const createAccuracyScore = (score: number): AccuracyScore => {
  if (typeof score !== "number" || score < 0 || score > 1) {
    throw new Error("Invalid AccuracyScore: must be between 0.0 and 1.0");
  }
  return score as AccuracyScore;
};

export const createConfidenceLevel = (level: number): ConfidenceLevel => {
  if (typeof level !== "number" || level < 0 || level > 1) {
    throw new Error("Invalid ConfidenceLevel: must be between 0.0 and 1.0");
  }
  return level as ConfidenceLevel;
};

export const createRiskToleranceScore = (score: number): RiskToleranceScore => {
  if (typeof score !== "number" || score < 0 || score > 10) {
    throw new Error("Invalid RiskToleranceScore: must be between 0.0 and 10.0");
  }
  return score as RiskToleranceScore;
};

// ========== TYPE UTILITIES ==========
// Check if value is valid branded type
export const isValidUserId = (value: unknown): value is UserId => {
  return typeof value === "string" && value.length > 0;
};

export const isValidPmpAmount = (value: unknown): value is PmpAmount => {
  return typeof value === "number" && value >= 0;
};

export const isValidPmcAmount = (value: unknown): value is PmcAmount => {
  return typeof value === "number" && value >= 0;
};

export const isValidAccuracyScore = (
  value: unknown
): value is AccuracyScore => {
  return typeof value === "number" && value >= 0 && value <= 1;
};

// ========== CONVERSION UTILITIES ==========
// Safe conversion between related types
export const pmpToPmc = (
  pmp: PmpAmount,
  conversionRate: number = 0.1
): PmcAmount => {
  return createPmcAmount(pmp * conversionRate);
};

export const pmcToPmp = (
  pmc: PmcAmount,
  conversionRate: number = 10
): PmpAmount => {
  return createPmpAmount(pmc * conversionRate);
};

// Calculate total balance
export const calculateTotalPmp = (
  available: PmpAvailable,
  locked: PmpLocked
): PmpTotal => {
  return (available + locked) as PmpTotal;
};

export const calculateTotalPmc = (
  available: PmcAvailable,
  locked: PmcLocked
): PmcTotal => {
  return (available + locked) as PmcTotal;
};
