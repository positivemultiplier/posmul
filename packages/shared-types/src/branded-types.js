/**
 * 브랜드 타입 정의
 * 타입 안전성을 위한 강타입 시스템 구현
 * Jensen & Meckling Agency Theory 기반 경제 모델 지원
 */
/**
 * 브랜드 타입 생성자 함수들
 */
export const createUserId = (value) => {
    if (!value || value.trim().length === 0) {
        throw new Error("UserId cannot be empty");
    }
    return value;
};
export const createPredictionGameId = (value) => value;
export const createPredictionId = (value) => value;
export const createTransactionId = (value) => value;
export const createPMP = (value) => {
    if (value < 0)
        throw new Error("PMP cannot be negative");
    return value;
};
export const createPMC = (value) => {
    if (value < 0)
        throw new Error("PMC cannot be negative");
    return value;
};
export const createAccuracyScore = (value) => {
    if (value < 0 || value > 1)
        throw new Error("AccuracyScore must be between 0 and 1");
    return value;
};
export const createSocialLearningIndex = (value) => {
    if (value < 0 || value > 1)
        throw new Error("SocialLearningIndex must be between 0 and 1");
    return value;
};
export const createInformationTransparency = (value) => {
    if (value < 0 || value > 1)
        throw new Error("InformationTransparency must be between 0 and 1");
    return value;
};
export const createAgencyCostScore = (value) => {
    if (value < 0 || value > 1)
        throw new Error("AgencyCostScore must be between 0 and 1");
    return value;
};
export const createRiskAversionCoefficient = (value) => {
    if (value < 0 || value > 1)
        throw new Error("RiskAversionCoefficient must be between 0 and 1");
    return value;
};
export const createEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new Error("Invalid email format");
    }
    return email.toLowerCase();
};
export const createUserRole = (role) => {
    return role;
};
/**
 * 브랜드 타입 값 추출 함수들
 */
export const unwrapPMP = (pmp) => pmp;
export const unwrapPMC = (pmc) => pmc;
export const unwrapAccuracyScore = (score) => score;
export const unwrapSocialLearningIndex = (index) => index;
export const unwrapInformationTransparency = (transparency) => transparency;
export const unwrapAgencyCostScore = (score) => score;
export const unwrapRiskAversionCoefficient = (coefficient) => coefficient;
