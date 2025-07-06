import { BaseError } from "./base.error";
import { ERROR_CODES } from "./error-codes";
// 게임 관련 에러
export class GameNotFoundError extends BaseError {
    constructor(message = "게임을 찾을 수 없습니다.") {
        super(message, ERROR_CODES.GAME_NOT_FOUND, 404);
    }
}
export class GameAlreadyEndedError extends BaseError {
    constructor(message = "이미 종료된 게임입니다.") {
        super(message, ERROR_CODES.GAME_ALREADY_ENDED, 400);
    }
}
export class PredictionDeadlinePassedError extends BaseError {
    constructor(message = "예측 마감 시간이 지났습니다.") {
        super(message, ERROR_CODES.PREDICTION_DEADLINE_PASSED, 400);
    }
}
