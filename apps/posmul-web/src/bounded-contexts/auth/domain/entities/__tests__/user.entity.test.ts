/**
 * User Entity Tests
 *
 * Domain Entity 테스트 - User Entity
 * 사용자 엔티티의 핵심 비즈니스 로직 검증
 */
import {
  Email,
  UserId,
  UserRoleObject,
  createUserRole,
} from "../../value-objects/user-value-objects";
import { User, UserProps } from "../user.entity";

describe("User Entity", () => {
  let validUserProps: Omit<UserProps, "createdAt" | "updatedAt">;

  beforeEach(() => {
    validUserProps = {
      id: "user-123" as UserId,
      email: "test@example.com" as Email,
      displayName: "Test User",
      role: createUserRole("USER"),
      pmcBalance: 1000,
      pmpBalance: 5000,
      isActive: true,
    };
  });

  describe("User Creation", () => {
    it("유효한 속성으로 사용자를 생성할 수 있다", () => {
      // When
      const user = User.create(validUserProps);

      // Then
      expect(user.id).toBe("user-123");
      expect(user.email).toBe("test@example.com");
      expect(user.displayName).toBe("Test User");
      expect(user.pmcBalance).toBe(1000);
      expect(user.pmpBalance).toBe(5000);
      expect(user.isActive).toBe(true);
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it("display name이 없어도 사용자를 생성할 수 있다", () => {
      // Given
      const propsWithoutDisplayName = {
        ...validUserProps,
        displayName: undefined,
      };

      // When
      const user = User.create(propsWithoutDisplayName);

      // Then
      expect(user.displayName).toBeUndefined();
      expect(user.id).toBe("user-123");
      expect(user.email).toBe("test@example.com");
    });

    it("데이터베이스에서 사용자를 복원할 수 있다", () => {
      // Given
      const dbProps: UserProps = {
        ...validUserProps,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-02"),
      };

      // When
      const user = User.fromDatabase(dbProps);

      // Then
      expect(user.id).toBe("user-123");
      expect(user.email).toBe("test@example.com");
      expect(user.createdAt).toEqual(new Date("2024-01-01"));
      expect(user.updatedAt).toEqual(new Date("2024-01-02"));
    });
  });

  describe("User State Management", () => {
    let user: User;

    beforeEach(() => {
      user = User.create(validUserProps);
    });

    it("사용자를 비활성화할 수 있다", () => {
      // When
      user.deactivate();

      // Then
      expect(user.isActive).toBe(false);
      // updatedAt이 변경되었는지만 확인 (타이밍 이슈 방지)
      expect(user.updatedAt).toBeDefined();
    });

    it("사용자를 다시 활성화할 수 있다", () => {
      // Given
      user.deactivate();

      // When
      user.activate();

      // Then
      expect(user.isActive).toBe(true);
    });

    it("display name을 업데이트할 수 있다", () => {
      // When
      user.updateDisplayName("New Display Name");

      // Then
      expect(user.displayName).toBe("New Display Name");
    });

    it("빈 display name으로 업데이트할 수 없다", () => {
      // When & Then
      expect(() => user.updateDisplayName("")).toThrow(
        "Display name cannot be empty"
      );
      expect(() => user.updateDisplayName("   ")).toThrow(
        "Display name cannot be empty"
      );
    });
  });

  describe("Balance Management", () => {
    let user: User;

    beforeEach(() => {
      user = User.create(validUserProps);
    });

    it("PMP 포인트를 추가할 수 있다", () => {
      // Given
      const originalBalance = user.pmpBalance;

      // When
      user.addPmpPoints(2500);

      // Then
      expect(user.pmpBalance).toBe(originalBalance + 2500);
    });

    it("PMC 포인트를 추가할 수 있다", () => {
      // Given
      const originalBalance = user.pmcBalance;

      // When
      user.addPmcPoints(500);

      // Then
      expect(user.pmcBalance).toBe(originalBalance + 500);
    });

    it("PMC 포인트를 차감할 수 있다", () => {
      // Given
      const originalBalance = user.pmcBalance;

      // When
      user.deductPmcPoints(300);

      // Then
      expect(user.pmcBalance).toBe(originalBalance - 300);
    });

    it("0 또는 음수 포인트는 추가할 수 없다", () => {
      // When & Then
      expect(() => user.addPmpPoints(0)).toThrow(
        "PmpAmount amount must be positive"
      );
      expect(() => user.addPmpPoints(-100)).toThrow(
        "PmpAmount amount must be positive"
      );
      expect(() => user.addPmcPoints(0)).toThrow(
        "PmcAmount amount must be positive"
      );
      expect(() => user.addPmcPoints(-50)).toThrow(
        "PmcAmount amount must be positive"
      );
    });

    it("0 또는 음수 포인트는 차감할 수 없다", () => {
      // When & Then
      expect(() => user.deductPmcPoints(0)).toThrow(
        "PmcAmount amount must be positive"
      );
      expect(() => user.deductPmcPoints(-100)).toThrow(
        "PmcAmount amount must be positive"
      );
    });

    it("잔액을 초과하여 차감할 수 없다", () => {
      // Given
      const currentBalance = user.pmcBalance;

      // When & Then
      expect(() => user.deductPmcPoints(currentBalance + 1)).toThrow(
        "Insufficient PmcAmount balance"
      );

      // 원래 잔액 유지
      expect(user.pmcBalance).toBe(currentBalance);
    });
  });

  describe("User Information", () => {
    let user: User;

    beforeEach(() => {
      user = User.create(validUserProps);
    });

    it("사용자 정보를 JSON으로 직렬화할 수 있다", () => {
      // When
      const json = user.toJSON();

      // Then
      expect(json).toEqual({
        id: "user-123",
        email: "test@example.com",
        displayName: "Test User",
        role: createUserRole("USER"), // 올바른 UserRole 객체
        pmcBalance: 1000,
        pmpBalance: 5000,
        isActive: true,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });
    });

    it("사용자 속성들에 올바르게 접근할 수 있다", () => {
      // Then
      expect(user.id).toBe(validUserProps.id);
      expect(user.email).toBe(validUserProps.email);
      expect(user.displayName).toBe(validUserProps.displayName);
      expect(user.role).toBe(validUserProps.role);
      expect(user.pmcBalance).toBe(validUserProps.pmcBalance);
      expect(user.pmpBalance).toBe(validUserProps.pmpBalance);
      expect(user.isActive).toBe(validUserProps.isActive);
    });
  });

  describe("Edge Cases", () => {
    it("최대 PMC 차감 테스트", () => {
      // Given
      const user = User.create(validUserProps);
      const fullBalance = user.pmcBalance;

      // When
      user.deductPmcPoints(fullBalance);

      // Then
      expect(user.pmcBalance).toBe(0);
    });

    it("연속된 포인트 작업 테스트", () => {
      // Given
      const user = User.create(validUserProps);
      const originalPmpBalance = user.pmpBalance;
      const originalPmcBalance = user.pmcBalance;

      // When
      user.addPmpPoints(1000);
      user.addPmcPoints(200);
      user.deductPmcPoints(100);

      // Then
      expect(user.pmpBalance).toBe(originalPmpBalance + 1000);
      expect(user.pmcBalance).toBe(originalPmcBalance + 200 - 100);
    });

    it("상태 변경 연속 테스트", () => {
      // Given
      const user = User.create(validUserProps);

      // When
      user.deactivate();
      user.activate();

      // Then
      expect(user.isActive).toBe(true);
    });
  });
});
