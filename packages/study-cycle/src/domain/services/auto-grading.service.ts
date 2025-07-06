import {
  DomainError,
  Result,
  failure,
  isFailure,
  success,
} from "@posmul/shared-types";
import {
  IGradedAnswer,
  Question,
  QuestionType,
  Submission,
} from "../entities/assessment.entity";

// Value Objects for Grading
export interface GradingCriteria {
  readonly rubric: RubricItem[];
  readonly maxScore: number;
  readonly partialCreditEnabled: boolean;
  readonly strictMode: boolean;
}

export interface RubricItem {
  readonly criterion: string;
  readonly weight: number; // 0-1
  readonly maxPoints: number;
  readonly description: string;
}

export interface GradingResult {
  readonly score: number;
  readonly maxScore: number;
  readonly percentage: number;
  readonly feedback: string;
  readonly detailedScoring: DetailedScore[];
  readonly confidence: number; // 0-1, for AI-based grading
  readonly gradingMethod: GradingMethod;
  readonly processingTime: number; // milliseconds
}

export interface DetailedScore {
  readonly criterion: string;
  readonly score: number;
  readonly maxScore: number;
  readonly feedback: string;
}

export enum GradingMethod {
  ExactMatch = "exact-match",
  FuzzyMatch = "fuzzy-match",
  SimilarityBased = "similarity-based",
  AIBased = "ai-based",
  CodeExecution = "code-execution",
  PartialCredit = "partial-credit",
}

// Configuration for different grading algorithms
export interface AutoGradingConfig {
  readonly similarityThreshold: number; // 0-1, for fuzzy matching
  readonly aiGradingEnabled: boolean;
  readonly codeExecutionTimeout: number; // milliseconds
  readonly maxPartialCreditRatio: number; // 0-1
  readonly strictCaseSensitive: boolean;
  readonly allowTypos: boolean;
  readonly typoTolerance: number; // 0-1
}

// Code execution context
export interface TestCase {
  readonly input: string;
  readonly expectedOutput: string;
  readonly weight: number; // 0-1
  readonly description: string;
}

export interface CodeExecutionResult {
  readonly passed: boolean;
  readonly output: string;
  readonly error?: string;
  readonly executionTime: number;
  readonly memoryUsed: number;
  readonly testResults: TestCaseResult[];
}

export interface TestCaseResult {
  readonly testCase: TestCase;
  readonly passed: boolean;
  readonly actualOutput: string;
  readonly score: number;
}

/**
 * AutoGrading Domain Service
 */
export class AutoGradingService {
  private readonly config: AutoGradingConfig;

  constructor(config?: Partial<AutoGradingConfig>) {
    this.config = {
      similarityThreshold: 0.8,
      aiGradingEnabled: true,
      codeExecutionTimeout: 30000, // 30 seconds
      maxPartialCreditRatio: 0.5,
      strictCaseSensitive: false,
      allowTypos: true,
      typoTolerance: 0.1,
      ...config,
    };
  }

  /**
   * Main grading method that routes to appropriate grading algorithm
   */
  public async gradeSubmission(
    question: Question,
    submission: Submission,
    criteria?: GradingCriteria
  ): Promise<Result<GradingResult, DomainError>> {
    const startTime = Date.now();

    try {
      let result: GradingResult;

      switch (question.type) {
        case QuestionType.MultipleChoice:
        case QuestionType.TrueFalse:
          result = await this.gradeMultipleChoice(question, submission);
          break;

        case QuestionType.MultipleSelect:
          result = this.gradeMultipleCorrectAnswers(question, submission);
          break;

        case QuestionType.ShortAnswer:
          result = await this.gradeShortAnswer(question, submission);
          break;

        case QuestionType.Essay:
          if (this.config.aiGradingEnabled && criteria) {
            result = await this.gradeEssayWithAI(
              question,
              submission,
              criteria
            );
          } else {
            result = this.createManualGradingResult(question, submission);
          }
          break;

        case QuestionType.Coding:
          result = await this.gradeCodingQuestion(question, submission);
          break;

        default:
          return failure(
            new DomainError(
              `지원하지 않는 문제 유형: ${question.type}`,
              "UNSUPPORTED_QUESTION_TYPE"
            )
          );
      }

      const processingTime = Date.now() - startTime;
      result = { ...result, processingTime };

      return success(result);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "알 수 없는 오류";
      return failure(
        new DomainError(
          `채점 중 오류가 발생했습니다: ${errorMessage}`,
          "GRADING_ERROR"
        )
      );
    }
  }

  /**
   * Grade multiple choice questions with enhanced logic
   */
  private async gradeMultipleChoice(
    question: Question,
    submission: Submission
  ): Promise<GradingResult> {
    const userAnswer = this.findAnswerForQuestion(submission, question.id);
    if (!userAnswer || typeof userAnswer.userAnswer !== "string") {
      return this.createUnansweredGradingResult(question);
    }
    const answer = userAnswer.userAnswer;

    const correctOptions = question.options.filter((opt) => opt.isCorrect);

    // This method should only handle single-answer MCQs.
    // Let's assume the question is single-answer type.
    if (correctOptions.length !== 1) {
      // This could be an assertion error or a fallback to manual grading.
      return this.createManualGradingResult(question, submission);
    }

    const correctOption = correctOptions[0];
    const isCorrect = correctOption.id === answer;
    const score = isCorrect ? question.points : 0;

    const selectedOption = question.options.find((opt) => opt.id === answer);

    return {
      score,
      maxScore: question.points,
      percentage: (score / question.points) * 100,
      feedback: isCorrect
        ? `정답입니다! ${correctOption.explanation || ""}`
        : `오답입니다. 정답: ${correctOption.text}. ${correctOption.explanation || ""}`,
      detailedScoring: [
        {
          criterion: "정답 여부",
          score,
          maxScore: question.points,
          feedback: selectedOption
            ? `선택한 답: ${selectedOption.text}`
            : "답을 선택하지 않았습니다.",
        },
      ],
      confidence: 1.0, // Multiple choice has perfect confidence
      gradingMethod: GradingMethod.ExactMatch,
      processingTime: 0,
    };
  }

  /**
   * Grade multiple choice with multiple correct answers
   */
  private gradeMultipleCorrectAnswers(
    question: Question,
    submission: Submission
  ): GradingResult {
    const userAnswer = this.findAnswerForQuestion(submission, question.id);
    if (!userAnswer || !userAnswer.userAnswer) {
      return this.createUnansweredGradingResult(question);
    }

    const answers = Array.isArray(userAnswer.userAnswer)
      ? (userAnswer.userAnswer as string[])
      : [userAnswer.userAnswer as string];

    const correctOptionIds = question.options
      .filter((opt) => opt.isCorrect)
      .map((opt) => opt.id);

    const selectedCorrect = answers.filter((id) =>
      correctOptionIds.includes(id)
    );
    const selectedIncorrect = answers.filter(
      (id) => !correctOptionIds.includes(id)
    );

    // Partial credit calculation
    const correctRatio = selectedCorrect.length / correctOptionIds.length;
    const penaltyRatio = selectedIncorrect.length / question.options.length;

    const score = Math.max(0, (correctRatio - penaltyRatio) * question.points);

    return {
      score,
      maxScore: question.points,
      percentage: (score / question.points) * 100,
      feedback: `${selectedCorrect.length}/${correctOptionIds.length}개 정답 선택. ${selectedIncorrect.length > 0 ? `${selectedIncorrect.length}개 오답 포함.` : ""}`,
      detailedScoring: [
        {
          criterion: "부분 점수",
          score,
          maxScore: question.points,
          feedback: `정답률: ${(correctRatio * 100).toFixed(1)}%, 오답 페널티: ${(penaltyRatio * 100).toFixed(1)}%`,
        },
      ],
      confidence: 1.0,
      gradingMethod: GradingMethod.PartialCredit,
      processingTime: 0,
    };
  }

  /**
   * Grade short answer questions with similarity matching
   */
  private async gradeShortAnswer(
    question: Question,
    submission: Submission
  ): Promise<GradingResult> {
    const userAnswer = this.findAnswerForQuestion(submission, question.id);
    if (!userAnswer || typeof userAnswer.userAnswer !== "string") {
      return this.createUnansweredGradingResult(question);
    }
    const answer = (userAnswer.userAnswer as string).trim();
    const correctAnswer = question.correctAnswer?.trim();

    if (!correctAnswer) {
      return this.createManualGradingResult(question, submission);
    }

    // Exact match (case insensitive if configured)
    const normalizedAnswer = this.config.strictCaseSensitive
      ? answer
      : answer.toLowerCase();
    const normalizedCorrect = this.config.strictCaseSensitive
      ? correctAnswer
      : correctAnswer.toLowerCase();

    if (normalizedAnswer === normalizedCorrect) {
      return {
        score: question.points,
        maxScore: question.points,
        percentage: 100,
        feedback: "정답입니다!",
        detailedScoring: [
          {
            criterion: "정확한 답안",
            score: question.points,
            maxScore: question.points,
            feedback: "완전히 일치하는 답안입니다.",
          },
        ],
        confidence: 1.0,
        gradingMethod: GradingMethod.ExactMatch,
        processingTime: 0,
      };
    }

    // Similarity-based grading
    if (this.config.allowTypos) {
      const similarity = this.calculateSimilarity(
        normalizedAnswer,
        normalizedCorrect
      );

      if (similarity >= this.config.similarityThreshold) {
        const score = Math.round(similarity * question.points);

        return {
          score,
          maxScore: question.points,
          percentage: (score / question.points) * 100,
          feedback: `부분 정답입니다. 유사도: ${(similarity * 100).toFixed(1)}%`,
          detailedScoring: [
            {
              criterion: "유사도 기반 채점",
              score,
              maxScore: question.points,
              feedback: `답안이 정답과 ${(similarity * 100).toFixed(1)}% 유사합니다.`,
            },
          ],
          confidence: similarity,
          gradingMethod: GradingMethod.SimilarityBased,
          processingTime: 0,
        };
      }
    }

    // No match
    return {
      score: 0,
      maxScore: question.points,
      percentage: 0,
      feedback: `오답입니다. 정답: ${correctAnswer}`,
      detailedScoring: [
        {
          criterion: "답안 불일치",
          score: 0,
          maxScore: question.points,
          feedback: "제출한 답안이 정답과 일치하지 않습니다.",
        },
      ],
      confidence: 1.0,
      gradingMethod: GradingMethod.ExactMatch,
      processingTime: 0,
    };
  }

  /**
   * Grade essay questions using AI (mock implementation)
   */
  private async gradeEssayWithAI(
    question: Question,
    submission: Submission,
    criteria: GradingCriteria
  ): Promise<GradingResult> {
    const userAnswer = this.findAnswerForQuestion(submission, question.id);
    if (!userAnswer || typeof userAnswer.userAnswer !== "string") {
      return this.createUnansweredGradingResult(question);
    }
    const essay = userAnswer.userAnswer as string;

    // Mock AI grading implementation
    // In real implementation, this would call an AI service like OpenAI GPT-4

    const wordCount = essay.split(/\s+/).length;

    // Simple heuristic-based scoring for demonstration
    const scores = criteria.rubric.map((item) => {
      let score = 0;
      let feedback = "";

      switch (item.criterion.toLowerCase()) {
        case "length":
        case "word count":
          score = Math.min(wordCount / 100, 1) * item.maxPoints;
          feedback = `단어 수: ${wordCount}개`;
          break;

        case "grammar":
        case "spelling":
          // Mock grammar check
          score = Math.random() * 0.3 + 0.7; // 70-100% range
          score *= item.maxPoints;
          feedback = "문법 및 맞춤법 검사 완료";
          break;

        case "content":
        case "relevance":
          // Mock content analysis
          score = Math.random() * 0.4 + 0.6; // 60-100% range
          score *= item.maxPoints;
          feedback = "내용 관련성 분석 완료";
          break;

        default:
          score = Math.random() * 0.5 + 0.5; // 50-100% range
          score *= item.maxPoints;
          feedback = `${item.criterion} 평가 완료`;
      }

      return {
        criterion: item.criterion,
        score: Math.round(score * 100) / 100,
        maxScore: item.maxPoints,
        feedback,
      };
    });

    const totalScore = scores.reduce((sum, s) => sum + s.score, 0);
    const maxScore = criteria.maxScore;

    return {
      score: totalScore,
      maxScore,
      percentage: (totalScore / maxScore) * 100,
      feedback:
        "AI 기반 에세이 채점이 완료되었습니다. 상세한 피드백을 확인해주세요.",
      detailedScoring: scores,
      confidence: 0.85, // AI grading has lower confidence
      gradingMethod: GradingMethod.AIBased,
      processingTime: 0,
    };
  }

  /**
   * Grade coding questions with test case execution
   */
  private async gradeCodingQuestion(
    question: Question,
    submission: Submission
  ): Promise<GradingResult> {
    const userAnswer = this.findAnswerForQuestion(submission, question.id);
    if (!userAnswer || typeof userAnswer.userAnswer !== "string") {
      return this.createUnansweredGradingResult(question);
    }
    const code = userAnswer.userAnswer as string;

    // Mock code execution (in real implementation, this would use a secure sandbox)
    const executionResult = await this.executeCode(code, question);

    if (!executionResult.passed) {
      return {
        score: 0,
        maxScore: question.points,
        percentage: 0,
        feedback: `코드 실행 실패: ${executionResult.error || "알 수 없는 오류"}`,
        detailedScoring: [
          {
            criterion: "코드 실행",
            score: 0,
            maxScore: question.points,
            feedback: executionResult.error || "코드가 실행되지 않았습니다.",
          },
        ],
        confidence: 1.0,
        gradingMethod: GradingMethod.CodeExecution,
        processingTime: 0,
      };
    }

    // Calculate score based on test case results
    const passedTests = executionResult.testResults.filter((t) => t.passed);
    const totalWeight = executionResult.testResults.reduce(
      (sum, t) => sum + t.testCase.weight,
      0
    );
    const passedWeight = passedTests.reduce(
      (sum, t) => sum + t.testCase.weight,
      0
    );

    const score = (passedWeight / totalWeight) * question.points;

    const detailedScoring = executionResult.testResults.map((result) => ({
      criterion: `테스트 케이스: ${result.testCase.description}`,
      score: result.passed
        ? (result.testCase.weight * question.points) / totalWeight
        : 0,
      maxScore: (result.testCase.weight * question.points) / totalWeight,
      feedback: result.passed
        ? "통과"
        : `실패 - 예상: ${result.testCase.expectedOutput}, 실제: ${result.actualOutput}`,
    }));

    return {
      score: Math.round(score * 100) / 100,
      maxScore: question.points,
      percentage: (score / question.points) * 100,
      feedback: `${passedTests.length}/${executionResult.testResults.length}개 테스트 케이스 통과`,
      detailedScoring,
      confidence: 1.0,
      gradingMethod: GradingMethod.CodeExecution,
      processingTime: 0,
    };
  }

  /**
   * Create result for manual grading
   */
  private createManualGradingResult(
    question: Question,
    submission: Submission
  ): GradingResult {
    return {
      score: 0,
      maxScore: question.points,
      percentage: 0,
      feedback: "이 문제는 수동 채점이 필요합니다.",
      detailedScoring: [
        {
          criterion: "수동 채점 필요",
          score: 0,
          maxScore: question.points,
          feedback: "강사가 직접 채점할 예정입니다.",
        },
      ],
      confidence: 0,
      gradingMethod: GradingMethod.AIBased,
      processingTime: 0,
    };
  }

  /**
   * Create result for unanswered questions
   */
  private createUnansweredGradingResult(question: Question): GradingResult {
    return {
      score: 0,
      maxScore: question.points,
      percentage: 0,
      feedback: "답변이 제출되지 않았습니다.",
      detailedScoring: [
        {
          criterion: "미응답",
          score: 0,
          maxScore: question.points,
          feedback: "이 문제에 대한 답변이 없습니다.",
        },
      ],
      confidence: 1.0,
      gradingMethod: GradingMethod.ExactMatch,
      processingTime: 0,
    };
  }

  /**
   * Find the relevant answer from a submission for a specific question
   */
  private findAnswerForQuestion(
    submission: Submission,
    questionId: string
  ): IGradedAnswer | undefined {
    return submission.answers.find((a) => a.questionId === questionId);
  }

  /**
   * Calculate string similarity using Levenshtein distance
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1)
      .fill(null)
      .map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) {
      matrix[0][i] = i;
    }

    for (let j = 0; j <= str2.length; j++) {
      matrix[j][0] = j;
    }

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    const maxLength = Math.max(str1.length, str2.length);
    return maxLength === 0
      ? 1
      : (maxLength - matrix[str2.length][str1.length]) / maxLength;
  }

  /**
   * Mock code execution (in real implementation, use secure sandbox)
   */
  private async executeCode(
    code: string,
    question: Question
  ): Promise<CodeExecutionResult> {
    // Mock implementation - in reality, this would use Docker or similar sandboxing

    // Simulate some basic test cases
    const mockTestCases: TestCase[] = [
      {
        input: "1 2",
        expectedOutput: "3",
        weight: 0.5,
        description: "기본 케이스",
      },
      {
        input: "10 20",
        expectedOutput: "30",
        weight: 0.5,
        description: "큰 수 케이스",
      },
    ];

    const testResults: TestCaseResult[] = mockTestCases.map((testCase) => {
      // Simple mock: assume code works if it contains certain keywords
      const passed =
        code.includes("+") || code.includes("add") || code.includes("sum");

      return {
        testCase,
        passed,
        actualOutput: passed ? testCase.expectedOutput : "0",
        score: passed ? testCase.weight : 0,
      };
    });

    const allPassed = testResults.every((r) => r.passed);

    return {
      passed: allPassed,
      output: allPassed ? "실행 성공" : "일부 테스트 실패",
      executionTime: Math.random() * 1000, // Mock execution time
      memoryUsed: Math.random() * 50, // Mock memory usage
      testResults,
    };
  }

  /**
   * Batch grade multiple submissions
   */
  public async gradeSubmissions(
    question: Question,
    submissions: Submission[],
    criteria?: GradingCriteria
  ): Promise<Result<GradingResult[], DomainError>> {
    const results: GradingResult[] = [];

    for (const submission of submissions) {
      const result = await this.gradeSubmission(question, submission, criteria);

      if (!result.success) {
        if (isFailure(result)) {
          return failure(result.error);
        } else {
          return failure(new DomainError("Unknown error", "UNKNOWN_ERROR"));
        }
      }

      results.push(result.data);
    }

    return success(results);
  }

  /**
   * Get grading statistics for a question
   */
  public calculateGradingStatistics(results: GradingResult[]): {
    averageScore: number;
    medianScore: number;
    standardDeviation: number;
    passRate: number;
    distribution: { range: string; count: number }[];
  } {
    if (results.length === 0) {
      return {
        averageScore: 0,
        medianScore: 0,
        standardDeviation: 0,
        passRate: 0,
        distribution: [],
      };
    }

    const scores = results.map((r) => r.percentage);
    const average =
      scores.reduce((sum, score) => sum + score, 0) / scores.length;

    const sortedScores = [...scores].sort((a, b) => a - b);
    const median =
      sortedScores.length % 2 === 0
        ? (sortedScores[sortedScores.length / 2 - 1] +
            sortedScores[sortedScores.length / 2]) /
          2
        : sortedScores[Math.floor(sortedScores.length / 2)];

    const variance =
      scores.reduce((sum, score) => sum + Math.pow(score - average, 2), 0) /
      scores.length;
    const standardDeviation = Math.sqrt(variance);

    const passRate =
      (scores.filter((score) => score >= 60).length / scores.length) * 100;

    const distribution = [
      { range: "0-20%", count: scores.filter((s) => s < 20).length },
      {
        range: "20-40%",
        count: scores.filter((s) => s >= 20 && s < 40).length,
      },
      {
        range: "40-60%",
        count: scores.filter((s) => s >= 40 && s < 60).length,
      },
      {
        range: "60-80%",
        count: scores.filter((s) => s >= 60 && s < 80).length,
      },
      { range: "80-100%", count: scores.filter((s) => s >= 80).length },
    ];

    return {
      averageScore: Math.round(average * 100) / 100,
      medianScore: Math.round(median * 100) / 100,
      standardDeviation: Math.round(standardDeviation * 100) / 100,
      passRate: Math.round(passRate * 100) / 100,
      distribution,
    };
  }
}
