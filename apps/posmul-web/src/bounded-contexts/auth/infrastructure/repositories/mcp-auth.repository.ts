/**
 * MCP Auth Repository Implementation
 *
 * Clean Architecture Infrastructure 계층의 Repository 구현
 * IAuthRepository 인터페이스를 MCP Supabase로 구현
 */

import {
  MCPError,
  handleMCPError,
  createDefaultMCPAdapter,
  Result,
  CompatibleBaseError,
  adaptErrorToBaseError,
} from "../../../../shared/legacy-compatibility";
import { UserId } from "@posmul/auth-economy-sdk";

import {
  AuthSession,
  Permission,
  Role,
  UserCredentials,
} from "../../domain/entities";
import { IAuthRepository } from "../../domain/repositories";

/**
 * MCP 기반 Auth Repository 구현
 */
export class MCPAuthRepository implements IAuthRepository {
  private readonly mcpAdapter = createDefaultMCPAdapter();

  constructor(private readonly projectId: string) {}

  /**
   * 사용자 인증 세션 조회
   */
  async getSession(
    sessionId: string
  ): Promise<Result<AuthSession | null, CompatibleBaseError>> {
    try {
      const result = await this.mcpAdapter.executeSQL(
        `SELECT * FROM auth_sessions WHERE session_id = '${sessionId}'`
      );

      if (result.error || !result.data?.length) {
        return { success: true, data: null };
      }

      const sessionData = result.data[0];
      return {
        success: true,
        data: this.mapDatabaseToSession(sessionData),
      };
    } catch (error) {
      return {
        success: false,
        error: adaptErrorToBaseError(error),
      };
    }
  }

  async getUserCredentials(
    userId: UserId
  ): Promise<Result<UserCredentials | null, CompatibleBaseError>> {
    try {
      const result = await this.mcpAdapter.executeSQL(
        `SELECT * FROM user_credentials WHERE user_id = '${userId}'`
      );

      if (result.error || !result.data?.length) {
        return { success: true, data: null };
      }

      const data = result.data[0] as any;
      return {
        success: true,
        data: {
          userId: data.user_id as UserId,
          email: data.email as string,
          emailConfirmed: data.email_confirmed as boolean,
          provider: data.provider as string,
          providerId: data.provider_id as string,
          identityData: data.identity_data
            ? JSON.parse(data.identity_data)
            : {},
          activeSessions: data.active_sessions || 0,
          lastSignInAt: data.last_sign_in_at
            ? new Date(data.last_sign_in_at)
            : null,
          createdAt: new Date(data.created_at || Date.now()),
          updatedAt: new Date(data.updated_at || Date.now()),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: adaptErrorToBaseError(error),
      };
    }
  }

  async getActiveSessions(
    userId: UserId
  ): Promise<Result<AuthSession[], CompatibleBaseError>> {
    try {
      const result = await this.mcpAdapter.executeSQL(
        `SELECT * FROM auth_sessions WHERE user_id = '${userId}' AND is_active = true`
      );

      if (result.error) {
        return {
          success: false,
          error: adaptErrorToBaseError(result.error),
        };
      }

      const sessions = (result.data || []).map((data: any) =>
        this.mapDatabaseToSession(data)
      );
      return { success: true, data: sessions };
    } catch (error) {
      return {
        success: false,
        error: adaptErrorToBaseError(error),
      };
    }
  }

  async getUserPermissions(
    userId: UserId
  ): Promise<Result<Permission[], CompatibleBaseError>> {
    try {
      const result = await this.mcpAdapter.executeSQL(
        `SELECT p.* FROM permissions p
         JOIN user_permissions up ON p.id = up.permission_id
         WHERE up.user_id = '${userId}'`
      );

      if (result.error) {
        return {
          success: false,
          error: adaptErrorToBaseError(result.error),
        };
      }

      const permissions = (result.data || []).map((data: any) => ({
        id: data.id,
        name: data.name,
        resource: data.resource,
        action: data.action,
      }));
      return { success: true, data: permissions };
    } catch (error) {
      return {
        success: false,
        error: adaptErrorToBaseError(error),
      };
    }
  }

  async getUserRoles(
    userId: UserId
  ): Promise<Result<Role[], CompatibleBaseError>> {
    try {
      const result = await this.mcpAdapter.executeSQL(
        `SELECT r.* FROM roles r
         JOIN user_roles ur ON r.id = ur.role_id
         WHERE ur.user_id = '${userId}'`
      );

      if (result.error) {
        return {
          success: false,
          error: adaptErrorToBaseError(result.error),
        };
      }

      const roles = (result.data || []).map((data: any) => ({
        id: data.id,
        name: data.name,
        description: data.description,
        hierarchyLevel: data.hierarchy_level || 0,
        isActive: data.is_active || true,
        assignedAt: new Date(data.assigned_at || Date.now()),
        createdAt: new Date(data.created_at || Date.now()),
        permissions: [], // Permissions would be loaded separately if needed
      }));
      return { success: true, data: roles };
    } catch (error) {
      return {
        success: false,
        error: adaptErrorToBaseError(error),
      };
    }
  }

  async invalidateSession(
    sessionId: string
  ): Promise<Result<void, CompatibleBaseError>> {
    try {
      const result = await this.mcpAdapter.executeSQL(
        `UPDATE auth_sessions SET is_active = false WHERE session_id = '${sessionId}'`
      );

      if (result.error) {
        return {
          success: false,
          error: adaptErrorToBaseError(result.error),
        };
      }

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: adaptErrorToBaseError(error),
      };
    }
  }

  async invalidateAllUserSessions(
    userId: UserId
  ): Promise<Result<void, CompatibleBaseError>> {
    try {
      const result = await this.mcpAdapter.executeSQL(
        `UPDATE auth_sessions SET is_active = false WHERE user_id = '${userId}'`
      );

      if (result.error) {
        return {
          success: false,
          error: adaptErrorToBaseError(result.error),
        };
      }

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: adaptErrorToBaseError(error),
      };
    }
  }

  async logAuthActivity(
    userId: UserId,
    activity: string,
    metadata?: Record<string, any>
  ): Promise<Result<void, CompatibleBaseError>> {
    try {
      const metadataJson = JSON.stringify(metadata || {}).replace(/'/g, "''");
      const result = await this.mcpAdapter.executeSQL(
        `INSERT INTO auth_activity_log (user_id, activity, metadata, created_at)
         VALUES ('${userId}', '${activity}', '${metadataJson}', '${new Date().toISOString()}')`
      );

      if (result.error) {
        return {
          success: false,
          error: adaptErrorToBaseError(result.error),
        };
      }

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: adaptErrorToBaseError(error),
      };
    }
  }

  private mapDatabaseToSession(data: any): AuthSession {
    // 세션 데이터 매핑 로직
    return {
      id: data.id || data.session_id,
      userId: data.user_id as UserId,
      email: data.email || "",
      accessToken: data.access_token || "",
      refreshToken: data.refresh_token || "",
      tokenType: data.token_type || "bearer",
      expiresAt: new Date(data.expires_at),
      createdAt: new Date(data.created_at || Date.now()),
      updatedAt: new Date(data.updated_at || Date.now()),
      isActive: data.is_active,
      lastSignInAt: data.last_sign_in_at
        ? new Date(data.last_sign_in_at)
        : null,
      emailConfirmedAt: data.email_confirmed_at
        ? new Date(data.email_confirmed_at)
        : null,
    };
  }
}
