/**
 * 브랜드 타입 정의
 * 타입 안전성을 위한 강타입 시스템 구현
 * Jensen & Meckling Agency Theory 기반 경제 모델 지원
 */
declare const __brand: unique symbol;
/**
 * 브랜드 타입 생성 유틸리티
 */
export type Brand<T, TBrand> = T & {
    [__brand]: TBrand;
};
/**
 * 사용자 식별자
 */
export type UserId = Brand<string, "UserId">;
/**
 * 예측 게임 식별자
 */
export type PredictionGameId = string & {
    readonly brand: "PredictionGameId";
};
/**
 * 예측 식별자
 */
export type PredictionId = string & {
    readonly brand: "PredictionId";
};
/**
 * 거래 식별자
 */
export type TransactionId = string & {
    readonly brand: "TransactionId";
};
/**
 * PMP (PosMul Point) - Risk-Free Asset
 * CAPM 모델에서 무위험 자산 역할
 */
export type PMP = Brand<number, "PMP">;
/**
 * PMC (PosMul Coin) - Risky Asset
 * EBIT 기반 발행, 위험프리미엄 반영
 */
export type PMC = Brand<number, "PMC">;
/**
 * 예측 정확도 (0-1 범위)
 */
export type AccuracyScore = Brand<number, "AccuracyScore">;
/**
 * 사회적 학습 지수 (0-1 범위)
 */
export type SocialLearningIndex = Brand<number, "SocialLearningIndex">;
/**
 * 정보 투명성 지수 (0-1 범위)
 */
export type InformationTransparency = Brand<number, "InformationTransparency">;
/**
 * Agency Cost 점수 (0-1 범위, 낮을수록 좋음)
 */
export type AgencyCostScore = Brand<number, "AgencyCostScore">;
/**
 * 위험 회피도 (0-1 범위)
 */
export type RiskAversionCoefficient = Brand<number, "RiskAversionCoefficient">;
/**
 * Economy Domain
 */
export type PmpAmount = number & {
    readonly brand: "PmpAmount";
};
export type PmcAmount = number & {
    readonly brand: "PmcAmount";
};
/**
 * Investment Domain
 */
export type InvestmentId = string & {
    readonly brand: "InvestmentId";
};
export type FundId = string & {
    readonly brand: "FundId";
};
/**
 * MCP / Shared
 */
export type SupabaseProjectId = string & {
    readonly brand: "SupabaseProjectId";
};
export type Email = Brand<string, "Email">;
export type UserRole = "citizen" | "merchant" | "admin";
/**
 * 브랜드 타입 생성자 함수들
 */
export declare const createUserId: (value: string) => UserId;
export declare const createPredictionGameId: (value: string) => PredictionGameId;
export declare const createPredictionId: (value: string) => PredictionId;
export declare const createTransactionId: (value: string) => TransactionId;
export declare const createPMP: (value: number) => PMP;
export declare const createPMC: (value: number) => PMC;
export declare const createAccuracyScore: (value: number) => AccuracyScore;
export declare const createSocialLearningIndex: (value: number) => SocialLearningIndex;
export declare const createInformationTransparency: (value: number) => InformationTransparency;
export declare const createAgencyCostScore: (value: number) => AgencyCostScore;
export declare const createRiskAversionCoefficient: (value: number) => RiskAversionCoefficient;
export declare const createEmail: (email: string) => Email;
export declare const createUserRole: (role: UserRole) => UserRole;
/**
 * 브랜드 타입 값 추출 함수들
 */
export declare const unwrapPMP: (pmp: PMP) => number;
export declare const unwrapPMC: (pmc: PMC) => number;
export declare const unwrapAccuracyScore: (score: AccuracyScore) => number;
export declare const unwrapSocialLearningIndex: (index: SocialLearningIndex) => number;
export declare const unwrapInformationTransparency: (transparency: InformationTransparency) => number;
export declare const unwrapAgencyCostScore: (score: AgencyCostScore) => number;
export declare const unwrapRiskAversionCoefficient: (coefficient: RiskAversionCoefficient) => number;
export {};
