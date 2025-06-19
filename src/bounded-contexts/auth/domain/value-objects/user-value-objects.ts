// User ID 브랜드 타입 정의
export type UserId = string & { readonly __brand: 'UserId' };

export const createUserId = (id: string): UserId => {
  if (!id || id.trim().length === 0) {
    throw new Error('UserId cannot be empty');
  }
  return id as UserId;
};

// Email Value Object
export interface Email {
  readonly value: string;
}

export const createEmail = (email: string): Email => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format');
  }
  return { value: email.toLowerCase() };
};

// User Role Value Object
export type UserRole = 'citizen' | 'merchant' | 'admin';

export interface UserRoleObject {
  readonly value: UserRole;
}

export const createUserRole = (role: UserRole): UserRoleObject => {
  return { value: role };
};
