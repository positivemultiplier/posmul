/**
 * User Domain Entities
 */

import { UserId } from "@posmul/shared-types";

/**
 * User Aggregate Root
 */
export interface User {
  id: UserId;
  email: string;
  username: string;
  fullName: string;
  avatarUrl?: string;
  isActive: boolean;
  pmpBalance: number;
  pmcBalance: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User Profile Entity
 */
export interface UserProfile {
  userId: UserId;
  username: string;
  fullName: string;
  avatarUrl?: string;
  totalPredictions: number;
  successfulPredictions: number;
  averageAccuracy: number;
  totalInvestments: number;
  totalInvested: number;
  totalReturns: number;
  reputationScore: number;
  userLevel: number;
  createdAt: Date;
}

/**
 * User Activity Entity
 */
export interface UserActivity {
  id: string;
  userId: UserId;
  activityType: "prediction" | "investment" | "forum" | "donation";
  description: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

/**
 * User Statistics Entity
 */
export interface UserStatistics {
  userId: UserId;
  totalPredictions: number;
  successfulPredictions: number;
  averageAccuracy: number;
  totalInvestments: number;
  totalInvested: number;
  totalReturns: number;
  pmpBalance: number;
  pmcBalance: number;
  totalTransactions: number;
  lastActivityAt: Date;
}
