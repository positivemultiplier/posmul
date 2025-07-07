/**
 * 브랜드 타입 정의
 * 타입 안전성을 위한 강타입 시스템 구현
 * Jensen & Meckling Agency Theory 기반 경제 모델 지원
 */
/**
 * 브랜드 타입 생성자 함수들
 */
export var createUserId = function (value) {
    if (!value || value.trim().length === 0) {
        throw new Error("UserId cannot be empty");
    }
    return value;
};
export var createPredictionGameId = function (value) {
    return value;
};
export var createPredictionId = function (value) {
    return value;
};
export var createTransactionId = function (value) {
    return value;
};
export var createPMP = function (value) {
    if (value < 0)
        throw new Error("PMP cannot be negative");
    return value;
};
export var createPMC = function (value) {
    if (value < 0)
        throw new Error("PMC cannot be negative");
    return value;
};
export var createAccuracyScore = function (value) {
    if (value < 0 || value > 1)
        throw new Error("AccuracyScore must be between 0 and 1");
    return value;
};
export var createSocialLearningIndex = function (value) {
    if (value < 0 || value > 1)
        throw new Error("SocialLearningIndex must be between 0 and 1");
    return value;
};
export var createInformationTransparency = function (value) {
    if (value < 0 || value > 1)
        throw new Error("InformationTransparency must be between 0 and 1");
    return value;
};
export var createAgencyCostScore = function (value) {
    if (value < 0 || value > 1)
        throw new Error("AgencyCostScore must be between 0 and 1");
    return value;
};
export var createRiskAversionCoefficient = function (value) {
    if (value < 0 || value > 1)
        throw new Error("RiskAversionCoefficient must be between 0 and 1");
    return value;
};
export var createEmail = function (email) {
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new Error("Invalid email format");
    }
    return email.toLowerCase();
};
export var createUserRole = function (role) {
    return role;
};
/**
 * 브랜드 타입 값 추출 함수들
 */
export var unwrapPMP = function (pmp) { return pmp; };
export var unwrapPMC = function (pmc) { return pmc; };
export var unwrapAccuracyScore = function (score) {
    return score;
};
export var unwrapSocialLearningIndex = function (index) {
    return index;
};
export var unwrapInformationTransparency = function (transparency) { return transparency; };
export var unwrapAgencyCostScore = function (score) {
    return score;
};
export var unwrapRiskAversionCoefficient = function (coefficient) { return coefficient; };
//# sourceMappingURL=branded-types.js.map