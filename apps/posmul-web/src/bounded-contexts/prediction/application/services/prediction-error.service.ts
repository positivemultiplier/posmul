import { GameStatus } from "../../domain/value-objects/prediction-types";

export class PredictionValidationError extends Error {
  constructor(
    message: string,
    public readonly field?: string,
    public readonly code?: string
  ) {
    super(message);
    this.name = "PredictionValidationError";
  }
}

export class PredictionParticipationError extends Error {
  constructor(
    message: string,
    public readonly code?: string
  ) {
    super(message);
    this.name = "PredictionParticipationError";
  }
}

export class PredictionNetworkError extends Error {
  constructor(message: string = "네트워크 오류가 발생했습니다.") {
    super(message);
    this.name = "PredictionNetworkError";
  }
}

interface ValidationResult {
  isValid: boolean;
  error?: string;
  field?: string;
}

interface PredictionGame {
  id: string;
  status: GameStatus;
  minimumStake: number;
  maximumStake: number;
  maxParticipants?: number;
  currentParticipants: number;
  endTime: Date;
}

export class PredictionErrorService {
  /**
   * 베팅 참여 가능 여부 검증
   */
  static validateParticipation(
    game: PredictionGame,
    userId: string | undefined,
    selectedOption: string | null,
    stakeAmount: number
  ): ValidationResult {
    // 사용자 로그인 확인
    if (!userId) {
      return {
        isValid: false,
        error: "예측 게임 참여를 위해 로그인이 필요합니다.",
        field: "authentication",
      };
    }

    // 옵션 선택 확인
    if (!selectedOption) {
      return {
        isValid: false,
        error: "예측할 옵션을 선택해주세요.",
        field: "selectedOption",
      };
    }

    // 게임 상태 확인
    if (game.status !== GameStatus.ACTIVE) {
      const statusMessages = {
        [GameStatus.PENDING]: "아직 시작되지 않은 게임입니다.",
        [GameStatus.CREATED]: "아직 시작되지 않은 게임입니다.",
        [GameStatus.ENDED]: "이미 종료된 게임입니다.",
        [GameStatus.COMPLETED]: "이미 정산이 완료된 게임입니다.",
        [GameStatus.CANCELLED]: "취소된 게임입니다.",
      };
      
      return {
        isValid: false,
        error: statusMessages[game.status] || "참여할 수 없는 게임 상태입니다.",
        field: "gameStatus",
      };
    }

    // 게임 마감 시간 확인
    if (new Date() >= game.endTime) {
      return {
        isValid: false,
        error: "게임 참여 시간이 마감되었습니다.",
        field: "endTime",
      };
    }

    // 참여자 수 확인
    if (game.maxParticipants && game.currentParticipants >= game.maxParticipants) {
      return {
        isValid: false,
        error: "최대 참여자 수에 도달하여 더 이상 참여할 수 없습니다.",
        field: "maxParticipants",
      };
    }

    // 베팅 금액 검증
    const stakeValidation = this.validateStakeAmount(game, stakeAmount);
    if (!stakeValidation.isValid) {
      return stakeValidation;
    }

    return { isValid: true };
  }

  /**
   * 베팅 금액 검증
   */
  static validateStakeAmount(
    game: PredictionGame,
    stakeAmount: number
  ): ValidationResult {
    if (!stakeAmount || stakeAmount <= 0) {
      return {
        isValid: false,
        error: "베팅 금액을 입력해주세요.",
        field: "stakeAmount",
      };
    }

    if (stakeAmount < game.minimumStake) {
      return {
        isValid: false,
        error: `최소 베팅 금액은 ${this.formatCurrency(game.minimumStake)}원입니다.`,
        field: "stakeAmount",
      };
    }

    if (stakeAmount > game.maximumStake) {
      return {
        isValid: false,
        error: `최대 베팅 금액은 ${this.formatCurrency(game.maximumStake)}원입니다.`,
        field: "stakeAmount",
      };
    }

    // 정수 확인
    if (!Number.isInteger(stakeAmount)) {
      return {
        isValid: false,
        error: "베팅 금액은 정수로 입력해주세요.",
        field: "stakeAmount",
      };
    }

    return { isValid: true };
  }

  /**
   * 네트워크 에러 분류 및 사용자 친화적 메시지 반환
   */
  static handleNetworkError(error: any): string {
    if (!navigator.onLine) {
      return "인터넷 연결을 확인해주세요.";
    }

    if (error.status === 401) {
      return "인증이 만료되었습니다. 다시 로그인해주세요.";
    }

    if (error.status === 403) {
      return "이 작업을 수행할 권한이 없습니다.";
    }

    if (error.status === 404) {
      return "요청한 게임을 찾을 수 없습니다.";
    }

    if (error.status === 409) {
      return "이미 참여한 게임입니다.";
    }

    if (error.status === 429) {
      return "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.";
    }

    if (error.status >= 500) {
      return "서버에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.";
    }

    if (error.name === "TimeoutError") {
      return "요청 시간이 초과되었습니다. 다시 시도해주세요.";
    }

    return "네트워크 오류가 발생했습니다. 다시 시도해주세요.";
  }

  /**
   * 일반적인 에러를 사용자 친화적 메시지로 변환
   */
  static getUserFriendlyErrorMessage(error: Error): string {
    if (error instanceof PredictionValidationError) {
      return error.message;
    }

    if (error instanceof PredictionParticipationError) {
      return error.message;
    }

    if (error instanceof PredictionNetworkError) {
      return error.message;
    }

    // 알 수 없는 에러
    void error;
    return "예상치 못한 오류가 발생했습니다. 문제가 계속되면 고객센터에 문의해주세요.";
  }

  /**
   * 통화 형식 포맷팅
   */
  private static formatCurrency(amount: number): string {
    return new Intl.NumberFormat("ko-KR").format(amount);
  }
}

export default PredictionErrorService;