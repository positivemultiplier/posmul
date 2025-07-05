/**
 * 경제 시스템 핵심 타입 정의
 * Jensen & Meckling Agency Theory 및 CAPM 모델 기반
 */
/**
 * 예측 결과 상태
 */
export var PredictionResult;
(function (PredictionResult) {
    PredictionResult["PENDING"] = "PENDING";
    PredictionResult["CORRECT"] = "CORRECT";
    PredictionResult["INCORRECT"] = "INCORRECT";
    PredictionResult["PARTIALLY_CORRECT"] = "PARTIALLY_CORRECT";
})(PredictionResult || (PredictionResult = {}));
/**
 * MoneyWave 타입 (3단계 경제 순환)
 */
export var MoneyWaveType;
(function (MoneyWaveType) {
    MoneyWaveType["WAVE1"] = "WAVE1";
    MoneyWaveType["WAVE2"] = "WAVE2";
    MoneyWaveType["WAVE3"] = "WAVE3";
})(MoneyWaveType || (MoneyWaveType = {}));
/**
 * 투자 리그 타입
 */
export var LeagueType;
(function (LeagueType) {
    LeagueType["MAJOR"] = "MAJOR";
    LeagueType["LOCAL"] = "LOCAL";
    LeagueType["CLOUD"] = "CLOUD";
})(LeagueType || (LeagueType = {}));
