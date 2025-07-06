/**
 * 도메인 이벤트 타입 정의
 *
 * @author PosMul Development Team
 * @since 2024-12
 */
export interface DomainEvent {
    readonly id: string;
    readonly type: string;
    readonly aggregateId: string;
    readonly data: Record<string, unknown>;
    readonly version: number;
    readonly timestamp: Date;
}
export declare abstract class BaseDomainEvent implements DomainEvent {
    readonly id: string;
    readonly type: string;
    readonly aggregateId: string;
    readonly data: Record<string, unknown>;
    readonly version: number;
    readonly timestamp: Date;
    constructor(type: string, aggregateId: string, data: Record<string, unknown>, version?: number);
}
export interface EventHandler<T extends DomainEvent> {
    handle(event: T): Promise<void>;
}
export interface EventBus {
    publish(event: DomainEvent): Promise<void>;
    subscribe<T extends DomainEvent>(eventType: string, handler: EventHandler<T>): void;
}
export declare const EventTypes: {
    readonly USER_CREATED: "USER_CREATED";
    readonly USER_UPDATED: "USER_UPDATED";
    readonly USER_DELETED: "USER_DELETED";
    readonly PREDICTION_GAME_CREATED: "PREDICTION_GAME_CREATED";
    readonly PREDICTION_GAME_STARTED: "PREDICTION_GAME_STARTED";
    readonly PREDICTION_GAME_ENDED: "PREDICTION_GAME_ENDED";
    readonly PREDICTION_CREATED: "PREDICTION_CREATED";
    readonly PREDICTION_UPDATED: "PREDICTION_UPDATED";
    readonly POINTS_EARNED: "POINTS_EARNED";
    readonly POINTS_SPENT: "POINTS_SPENT";
    readonly POINTS_TRANSFERRED: "POINTS_TRANSFERRED";
    readonly LOCAL_LEAGUE_TRANSACTION: "LOCAL_LEAGUE_TRANSACTION";
    readonly MAJOR_LEAGUE_VIEW: "MAJOR_LEAGUE_VIEW";
    readonly STORE_REGISTERED: "STORE_REGISTERED";
    readonly STORE_UPDATED: "STORE_UPDATED";
};
export declare class UserCreatedEvent extends BaseDomainEvent {
    constructor(userId: string, userData: Record<string, unknown>);
}
export declare class PointsEarnedEvent extends BaseDomainEvent {
    constructor(userId: string, pointData: {
        amount: number;
        type: "PMC" | "PMP";
        source: string;
        metadata?: Record<string, unknown>;
    });
}
export declare class PredictionGameCreatedEvent extends BaseDomainEvent {
    constructor(gameId: string, gameData: Record<string, unknown>);
}
export declare class PmpEarnedEvent extends BaseDomainEvent {
    readonly userId: string;
    readonly amount: number;
    readonly source: "major-league" | "brainstorming" | "debate";
    readonly sourceId: string;
    constructor(userId: string, amount: number, source: "major-league" | "brainstorming" | "debate", sourceId: string);
}
export declare class PmcEarnedEvent extends BaseDomainEvent {
    readonly userId: string;
    readonly amount: number;
    readonly source: "local-league" | "cloud-funding" | "prediction-success" | "gift-aid";
    readonly sourceId: string;
    constructor(userId: string, amount: number, source: "local-league" | "cloud-funding" | "prediction-success" | "gift-aid", sourceId: string);
}
export declare class PmpSpentEvent extends BaseDomainEvent {
    readonly userId: string;
    readonly amount: number;
    readonly purpose: "prediction-participation" | "investment-participation";
    readonly targetId: string;
    constructor(userId: string, amount: number, purpose: "prediction-participation" | "investment-participation", targetId: string);
}
export declare class PmcSpentEvent extends BaseDomainEvent {
    readonly userId: string;
    readonly amount: number;
    readonly purpose: "donation" | "local-investment" | "investment-participation";
    readonly targetId: string;
    constructor(userId: string, amount: number, purpose: "donation" | "local-investment" | "investment-participation", targetId: string);
}
