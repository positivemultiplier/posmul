/**
 * Prediction Domain - PredictionResult Value Objects
 *
 * 예측 결과와 관련된 값 객체들
 * 정확도 계산, 보상 결정, 결과 분석 로직 포함
 *
 * @author PosMul Development Team
 * @since 2024-12
 */
import { AccuracyScore } from "@posmul/auth-economy-sdk";
import { Result } from "@posmul/auth-economy-sdk";
import { ValidationError } from "@posmul/auth-economy-sdk";
import { PmcAmount, createPmcAmount } from "@posmul/auth-economy-sdk";

/**
 * 예측 결과 열거형
 */
export enum PredictionResultEnum {
  PENDING = "PENDING", // 결과 대기 중
  CORRECT = "CORRECT", // 완전 정답
  INCORRECT = "INCORRECT", // 완전 오답
  PARTIALLY_CORRECT = "PARTIALLY_CORRECT", // 부분 정답
}

/**
 * 예측 결과 Value Object
 * 예측의 정확성과 보상 계산을 담당
 */
export class PredictionResult {
  private constructor(
    private readonly _result: PredictionResultEnum,
    private readonly _accuracyScore: AccuracyScore,
    private readonly _explanation?: string
  ) {}

  // Static factory methods
  public static readonly PENDING = new PredictionResult(
    PredictionResultEnum.PENDING,
    0 as AccuracyScore
  );

  /**
   * 정확도 점수로부터 PredictionResult 생성
   */
  public static fromAccuracyScore(
    score: number,
    explanation?: string
  ): Result<PredictionResult, ValidationError> {
    if (score < 0 || score > 1) {
      return {
        success: false,
        error: new ValidationError(
          `Accuracy score must be between 0 and 1, got: ${score}`,
          { field: "accuracyScore" }
        ),
      };
    }

    if (isNaN(score) || !isFinite(score)) {
      return {
        success: false,
        error: new ValidationError(
          "Accuracy score must be a valid finite number",
          { field: "accuracyScore" }
        ),
      };
    }

    let resultType: PredictionResultEnum;
    if (score >= 0.9) {
      resultType = PredictionResultEnum.CORRECT;
    } else if (score >= 0.5) {
      resultType = PredictionResultEnum.PARTIALLY_CORRECT;
    } else {
      resultType = PredictionResultEnum.INCORRECT;
    }

    return {
      success: true,
      data: new PredictionResult(
        resultType,
        score as AccuracyScore,
        explanation
      ),
    };
  }

  /**
   * 수동으로 결과 생성 (관리자용)
   */
  public static create(
    result: PredictionResultEnum,
    accuracyScore: number,
    explanation?: string
  ): Result<PredictionResult, ValidationError> {
    if (accuracyScore < 0 || accuracyScore > 1) {
      return {
        success: false,
        error: new ValidationError(
          `Accuracy score must be between 0 and 1, got: ${accuracyScore}`,
          { field: "accuracyScore" }
        ),
      };
    }

    return {
      success: true,
      data: new PredictionResult(
        result,
        accuracyScore as AccuracyScore,
        explanation
      ),
    };
  }

  /**
   * Binary 예측 결과 생성 (정답/오답)
   */
  public static createBinary(
    isCorrect: boolean,
    explanation?: string
  ): PredictionResult {
    const score = isCorrect ? 1.0 : 0.0;
    const result = isCorrect
      ? PredictionResultEnum.CORRECT
      : PredictionResultEnum.INCORRECT;

    return new PredictionResult(result, score as AccuracyScore, explanation);
  }

  /**
   * 결과가 보상 대상인지 확인
   */
  public isRewardEligible(): boolean {
    return (
      this._result === PredictionResultEnum.CORRECT ||
      this._result === PredictionResultEnum.PARTIALLY_CORRECT
    );
  }

  /**
   * 완전한 정답인지 확인
   */
  public isCorrect(): boolean {
    return this._result === PredictionResultEnum.CORRECT;
  }

  /**
   * 부분 정답인지 확인
   */
  public isPartiallyCorrect(): boolean {
    return this._result === PredictionResultEnum.PARTIALLY_CORRECT;
  }

  /**
   * 완전한 오답인지 확인
   */
  public isIncorrect(): boolean {
    return this._result === PredictionResultEnum.INCORRECT;
  }

  /**
   * 결과가 아직 확정되지 않았는지 확인
   */
  public isPending(): boolean {
    return this._result === PredictionResultEnum.PENDING;
  }

  /**
   * 보상 배율 계산
   */
  public getRewardMultiplier(): number {
    switch (this._result) {
      case PredictionResultEnum.CORRECT:
        return 1.0;
      case PredictionResultEnum.PARTIALLY_CORRECT:
        return this._accuracyScore as number; // 정확도에 비례
      case PredictionResultEnum.INCORRECT:
      case PredictionResultEnum.PENDING:
      default:
        return 0.0;
    }
  }

  /**
   * 정확도 기반 세분화된 보상 배율
   */
  public getDetailedRewardMultiplier(): number {
    const score = this._accuracyScore as number;

    if (score >= 0.95) return 1.2; // 95% 이상: 보너스
    if (score >= 0.9) return 1.0; // 90% 이상: 기본 보상
    if (score >= 0.8) return 0.8; // 80% 이상: 80% 보상
    if (score >= 0.7) return 0.6; // 70% 이상: 60% 보상
    if (score >= 0.6) return 0.4; // 60% 이상: 40% 보상
    if (score >= 0.5) return 0.2; // 50% 이상: 20% 보상

    return 0.0; // 50% 미만: 보상 없음
  }

  /**
   * 보상 금액 계산
   */
  public calculateReward(baseReward: PmcAmount): PmcAmount {
    const multiplier = this.getRewardMultiplier();
    const amount = (baseReward as number) * multiplier;
    return createPmcAmount(Math.floor(amount));
  }

  /**
   * 정확도 등급 반환
   */
  public getAccuracyGrade(): "S" | "A" | "B" | "C" | "D" | "F" {
    const score = this._accuracyScore as number;

    if (score >= 0.95) return "S";
    if (score >= 0.9) return "A";
    if (score >= 0.8) return "B";
    if (score >= 0.7) return "C";
    if (score >= 0.6) return "D";
    return "F";
  }

  /**
   * 결과에 대한 사용자 친화적 메시지
   */
  public getResultMessage(): string {
    const grade = this.getAccuracyGrade();
    const percentage = ((this._accuracyScore as number) * 100).toFixed(1);

    switch (this._result) {
      case PredictionResultEnum.CORRECT:
        return `완벽한 예측입니다! (정확도: ${percentage}%, 등급: ${grade})`;
      case PredictionResultEnum.PARTIALLY_CORRECT:
        return `좋은 예측입니다! (정확도: ${percentage}%, 등급: ${grade})`;
      case PredictionResultEnum.INCORRECT:
        return `아쉽게도 틀렸습니다. (정확도: ${percentage}%, 등급: ${grade})`;
      case PredictionResultEnum.PENDING:
        return `결과를 기다리고 있습니다...`;
      default:
        return `알 수 없는 결과입니다.`;
    }
  }

  /**
   * 개선 제안 메시지
   */
  public getImprovementSuggestion(): string {
    const score = this._accuracyScore as number;

    if (score >= 0.9) {
      return "훌륭한 예측 실력입니다! 계속해서 높은 정확도를 유지해보세요.";
    } else if (score >= 0.7) {
      return "좋은 예측이지만, 더 신중한 분석으로 정확도를 높여보세요.";
    } else if (score >= 0.5) {
      return "예측 방법을 다시 검토해보세요. 더 많은 정보를 고려해보는 것이 좋겠습니다.";
    } else {
      return "예측 전략을 근본적으로 재검토해보세요. 과거 데이터와 트렌드를 더 분석해보세요.";
    }
  }

  // Getters
  public get result(): PredictionResultEnum {
    return this._result;
  }

  public get accuracyScore(): AccuracyScore {
    return this._accuracyScore;
  }

  public get explanation(): string | undefined {
    return this._explanation;
  }

  /**
   * 문자열 변환
   */
  public toString(): string {
    const percentage = ((this._accuracyScore as number) * 100).toFixed(1);
    return `${this._result} (${percentage}%)`;
  }

  /**
   * 상세 정보를 포함한 문자열
   */
  public toDetailedString(): string {
    const grade = this.getAccuracyGrade();
    const percentage = ((this._accuracyScore as number) * 100).toFixed(1);
    const multiplier = (this.getRewardMultiplier() * 100).toFixed(0);

    return `${this._result} | 정확도: ${percentage}% | 등급: ${grade} | 보상배율: ${multiplier}%`;
  }

  /**
   * 다른 PredictionResult와 동일한지 확인
   */
  public equals(other: PredictionResult): boolean {
    return (
      this._result === other._result &&
      Math.abs(
        (this._accuracyScore as number) - (other._accuracyScore as number)
      ) < 0.001
    );
  }

  /**
   * 다른 결과보다 우수한지 비교
   */
  public isBetterThan(other: PredictionResult): boolean {
    return (this._accuracyScore as number) > (other._accuracyScore as number);
  }
}

/**
 * 예측 결과 통계 Value Object
 */
export class PredictionResultStats {
  private constructor(
    private readonly _totalPredictions: number,
    private readonly _correctPredictions: number,
    private readonly _partiallyCorrectPredictions: number,
    private readonly _incorrectPredictions: number,
    private readonly _averageAccuracy: number
  ) {}

  /**
   * 결과 배열로부터 통계 생성
   */
  public static fromResults(
    results: PredictionResult[]
  ): PredictionResultStats {
    const total = results.length;
    const correct = results.filter((r) => r.isCorrect()).length;
    const partiallyCorrect = results.filter((r) =>
      r.isPartiallyCorrect()
    ).length;
    const incorrect = results.filter((r) => r.isIncorrect()).length;

    const totalAccuracy = results.reduce(
      (sum, r) => sum + (r.accuracyScore as number),
      0
    );
    const averageAccuracy = total > 0 ? totalAccuracy / total : 0;

    return new PredictionResultStats(
      total,
      correct,
      partiallyCorrect,
      incorrect,
      averageAccuracy
    );
  }

  /**
   * 정확도 비율 계산
   */
  public getAccuracyRate(): number {
    if (this._totalPredictions === 0) return 0;
    return this._correctPredictions / this._totalPredictions;
  }

  /**
   * 성공률 계산 (정답 + 부분정답)
   */
  public getSuccessRate(): number {
    if (this._totalPredictions === 0) return 0;
    return (
      (this._correctPredictions + this._partiallyCorrectPredictions) /
      this._totalPredictions
    );
  }

  /**
   * 사용자 등급 결정
   */
  public getUserGrade():
    | "EXPERT"
    | "ADVANCED"
    | "INTERMEDIATE"
    | "BEGINNER"
    | "NOVICE" {
    const rate = this.getAccuracyRate();

    if (rate >= 0.8) return "EXPERT";
    if (rate >= 0.6) return "ADVANCED";
    if (rate >= 0.4) return "INTERMEDIATE";
    if (rate >= 0.2) return "BEGINNER";
    return "NOVICE";
  }

  // Getters
  public get totalPredictions(): number {
    return this._totalPredictions;
  }

  public get correctPredictions(): number {
    return this._correctPredictions;
  }

  public get partiallyCorrectPredictions(): number {
    return this._partiallyCorrectPredictions;
  }

  public get incorrectPredictions(): number {
    return this._incorrectPredictions;
  }

  public get averageAccuracy(): number {
    return this._averageAccuracy;
  }

  /**
   * 통계 요약
   */
  public getSummary(): string {
    const accuracyRate = (this.getAccuracyRate() * 100).toFixed(1);
    const successRate = (this.getSuccessRate() * 100).toFixed(1);
    const avgAccuracy = (this._averageAccuracy * 100).toFixed(1);
    const grade = this.getUserGrade();

    return `총 ${this._totalPredictions}건 | 정확도: ${accuracyRate}% | 성공률: ${successRate}% | 평균정확도: ${avgAccuracy}% | 등급: ${grade}`;
  }
}

// Helper functions
export const isValidPredictionResult = (
  value: string
): value is PredictionResultEnum => {
  return Object.values(PredictionResultEnum).includes(
    value.toUpperCase() as PredictionResultEnum
  );
};

export const getAllPredictionResults = (): PredictionResult[] => {
  return [
    PredictionResult.PENDING,
    PredictionResult.createBinary(true, "Perfect prediction"),
    PredictionResult.createBinary(false, "Incorrect prediction"),
  ];
};
