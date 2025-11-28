/**
 * User Domain Events
 *
 * 사용자 인증 및 관리 도메인의 모든 이벤트들을 정의합니다.
 * Auth 시스템과 경제 시스템 연동을 위한 이벤트들을 포함합니다.
 *
 * @author PosMul Development Team
 * @since 2024-12
 */
import { BaseDomainEvent } from "@posmul/auth-economy-sdk";
import { UserId } from "@posmul/auth-economy-sdk";

/**
 * 사용자 생성 이벤트
 * 회원가입 완료 시 발생하며, 경제 계정 생성을 트리거합니다.
 */
export class UserCreatedEvent extends BaseDomainEvent {
  constructor(
    public readonly userId: UserId,
    public readonly email: string,
    public readonly username: string,
    public readonly profileComplete: boolean = false,
    public readonly referredBy?: UserId,
    public readonly createdAt: Date = new Date()
  ) {
    super("UserCreated", userId, {
      userId,
      email,
      username,
      profileComplete,
      referredBy,
      createdAt: createdAt.toISOString(),
    });
  }
}

/**
 * 사용자 프로필 업데이트 이벤트
 */
export class UserProfileUpdatedEvent extends BaseDomainEvent {
  constructor(
    public readonly userId: UserId,
    public readonly updatedFields: Record<string, unknown>,
    public readonly updatedAt: Date = new Date()
  ) {
    super("UserProfileUpdated", userId, {
      userId,
      updatedFields,
      updatedAt: updatedAt.toISOString(),
    });
  }
}

/**
 * 사용자 로그인 이벤트
 */
export class UserLoggedInEvent extends BaseDomainEvent {
  constructor(
    public readonly userId: UserId,
    public readonly loginMethod: "email" | "social" | "sms",
    public readonly ipAddress?: string,
    public readonly userAgent?: string,
    public readonly loggedInAt: Date = new Date()
  ) {
    super("UserLoggedIn", userId, {
      userId,
      loginMethod,
      ipAddress,
      userAgent,
      loggedInAt: loggedInAt.toISOString(),
    });
  }
}

/**
 * 사용자 계정 비활성화 이벤트
 */
export class UserDeactivatedEvent extends BaseDomainEvent {
  constructor(
    public readonly userId: UserId,
    public readonly reason: string,
    public readonly deactivatedBy: UserId,
    public readonly deactivatedAt: Date = new Date()
  ) {
    super("UserDeactivated", userId, {
      userId,
      reason,
      deactivatedBy,
      deactivatedAt: deactivatedAt.toISOString(),
    });
  }
}

/**
 * 사용자 이벤트 유틸리티
 */
export class UserEventUtils {
  static filterByUser(
    events: BaseDomainEvent[],
    userId: UserId
  ): BaseDomainEvent[] {
    return events.filter((event) => {
      return event.aggregateId === userId || event.data.userId === userId;
    });
  }
}
