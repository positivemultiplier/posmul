/**
 * Auth Domain Entities
 */

import { UserId } from "@posmul/auth-economy-sdk";


/**
 * Auth Session Entity
 */
export interface AuthSession {
  id: string;
  userId: UserId;
  email: string;
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  lastSignInAt: Date | null;
  emailConfirmedAt: Date | null;
}

/**
 * User Credentials Entity
 */
export interface UserCredentials {
  userId: UserId;
  email: string;
  emailConfirmed: boolean;
  provider: string;
  providerId?: string;
  identityData: Record<string, any>;
  activeSessions: number;
  lastSignInAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Permission Entity
 */
export interface Permission {
  name: string;
  resource: string;
  action: string;
  description?: string;
}

/**
 * Role Entity
 */
export interface Role {
  id: string;
  name: string;
  description?: string;
  hierarchyLevel: number;
  isActive: boolean;
  assignedAt: Date;
  assignedBy?: string;
  createdAt: Date;
}
