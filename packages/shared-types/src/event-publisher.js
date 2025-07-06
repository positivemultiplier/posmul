/**
 * Domain Event Publisher Implementation
 *
 * @author PosMul Development Team
 * @since 2024-12
 */
/**
 * 이벤트 발행 오류
 */
export class PublishError extends Error {
    constructor(message, cause, eventType) {
        super(message);
        this.cause = cause;
        this.eventType = eventType;
        this.name = "PublishError";
    }
}
/**
 * 이벤트 핸들러 오류
 */
export class HandlerError extends Error {
    constructor(message, cause, subscriberId) {
        super(message);
        this.cause = cause;
        this.subscriberId = subscriberId;
        this.name = "HandlerError";
    }
}
