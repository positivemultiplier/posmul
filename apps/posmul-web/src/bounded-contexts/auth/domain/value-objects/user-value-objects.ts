import {
  UserId,
  Email,
  createUserId,
  createEmail,
} from "@posmul/auth-economy-sdk";

// Legacy compatibility exports
export type { UserId, Email };
export { createUserId, createEmail };

// Role 관련 타입들 (기존 코드 호환성)
export interface UserRoleObject {
  value: "USER" | "ADMIN" | "MODERATOR" | "citizen" | "merchant" | "admin";
  permissions: string[];
}

export function createUserRole(
  value: "USER" | "ADMIN" | "MODERATOR" | "citizen" | "merchant" | "admin"
): UserRoleObject {
  const permissions = {
    USER: ["read"],
    ADMIN: ["read", "write", "delete"],
    MODERATOR: ["read", "write"],
    citizen: ["read"], // 기본 시민 역할
    merchant: ["read", "write"],
    admin: ["read", "write", "delete"],
  };

  return {
    value,
    permissions: permissions[value] || ["read"],
  };
}
