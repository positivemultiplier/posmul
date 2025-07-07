/**
 * MCP Auth Repository Implementation
 *
 * Clean Architecture Infrastructure 계층??Repository 구현�?
 * IAuthRepository ?�터?�이?��? MCP Supabase�?구현
 */

import { 
  MCPError, 
  handleMCPError,
  createDefaultMCPAdapter,
  Result,
  CompatibleBaseError,
  adaptErrorToBaseError
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
   * ?�용???�증 ?�션 조회
   */
  async getSession(
    sessionId: string
  ): Promise<Result<AuthSession | null, CompatibleBaseError>> {
    try {
      const result = await this.mcpAdapter.executeSQL(`
        SELECT s.*, u.email, u.email_confirmed_at, u.last_sign_in_at
        FROM auth.sessions s
        JOIN auth.users u ON s.user_id = u.id
        WHERE s.id = '${sessionId}' AND s.not_after > NOW()
      `);

      if (!result.data || result.data.length === 0) {
        return { success: true, data: null };
      }

      const sessionData = result.data[0];
      const session = this.mapDatabaseToAuthSession(sessionData);
      return { success: true, data: session };
    } catch (error) {
      const compatibleError = adaptErrorToBaseError(error, 'getSession');
      return { success: false, error: compatibleError };
    }
  }

  /**
   * ?�용???�증 ?�보 조회
   */
  async getUserCredentials(
    userId: UserId
  ): Promise<Result<UserCredentials | null, CompatibleBaseError>> {
    try {
      const result = await this.mcpAdapter.executeSQL(`
        SELECT u.*, 
               i.provider, i.provider_id, i.identity_data,
               COUNT(s.id) as active_sessions
        FROM auth.users u
        LEFT JOIN auth.identities i ON u.id = i.user_id
        LEFT JOIN auth.sessions s ON u.id = s.user_id AND s.not_after > NOW()
        WHERE u.id = '${userId}'
        GROUP BY u.id, i.provider, i.provider_id, i.identity_data
      `);

      if (!result.data || result.data.length === 0) {
        return { success: true, data: null };
      }

      const credentialsData = result.data[0];
      const credentials = this.mapDatabaseToUserCredentials(credentialsData);
      return { success: true, data: credentials };
    } catch (error) {
      const compatibleError = adaptErrorToBaseError(error, 'getUserCredentials');
      return { success: false, error: compatibleError };
    }
  }

  /**
   * ?�성 ?�션 목록 조회
   */
  async getActiveSessions(
    userId: UserId
  ): Promise<Result<AuthSession[], CompatibleBaseError>> {
    try {
      const result = await this.mcpAdapter.executeSQL(`
        SELECT s.*, u.email, u.email_confirmed_at, u.last_sign_in_at
        FROM auth.sessions s
        JOIN auth.users u ON s.user_id = u.id
        WHERE s.user_id = '${userId}' AND s.not_after > NOW()
        ORDER BY s.created_at DESC
      `);

      const sessions =
        result.data?.map((sessionData) =>
          this.mapDatabaseToAuthSession(sessionData)
        ) || [];
      return { success: true, data: sessions };
    } catch (error) {
      const compatibleError = adaptErrorToBaseError(error, 'getActiveSessions');
      return { success: false, error: compatibleError };
    }
  }

  /**
   * ?�용??권한 조회
   */
  async getUserPermissions(
    userId: UserId
  ): Promise<Result<Permission[], CompatibleBaseError>> {
    try {
      const result = await this.mcpAdapter.executeSQL(`
        SELECT DISTINCT p.permission_name, p.resource, p.action
        FROM user_roles ur
        JOIN role_permissions rp ON ur.role_id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = '${userId}' AND ur.is_active = true
      `);

      const permissions =
        result.data?.map((permData) =>
          this.mapDatabaseToPermission(permData)
        ) || [];
      return { success: true, data: permissions };
    } catch (error) {
      const compatibleError = adaptErrorToBaseError(error, 'getUserPermissions');
      return { success: false, error: compatibleError };
    }
  }

  /**
   * ?�용????�� 조회
   */
  async getUserRoles(userId: UserId): Promise<Result<Role[], CompatibleBaseError>> {
    try {
      const result = await this.mcpAdapter.executeSQL(`
        SELECT r.*, ur.assigned_at, ur.assigned_by
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = '${userId}' AND ur.is_active = true
        ORDER BY r.hierarchy_level DESC
      `);

      const roles =
        result.data?.map((roleData) => this.mapDatabaseToRole(roleData)) || [];
      return { success: true, data: roles };
    } catch (error) {
      const compatibleError = adaptErrorToBaseError(error, 'getUserRoles');
      return { success: false, error: compatibleError };
    }
  }

  /**
   * ?�션 무효??
   */
  async invalidateSession(sessionId: string): Promise<Result<void, CompatibleBaseError>> {
    try {
      await this.mcpAdapter.executeSQL(`
        UPDATE auth.sessions 
        SET not_after = NOW() 
        WHERE id = '${sessionId}'
      `);

      return { success: true, data: undefined };
    } catch (error) {
      const compatibleError = adaptErrorToBaseError(error, 'invalidateSession');
      return { success: false, error: compatibleError };
    }
  }

  /**
   * 모든 ?�용???�션 무효??
   */
  async invalidateAllUserSessions(
    userId: UserId
  ): Promise<Result<void, CompatibleBaseError>> {
    try {
      await this.mcpAdapter.executeSQL(`
        UPDATE auth.sessions 
        SET not_after = NOW() 
        WHERE user_id = '${userId}' AND not_after > NOW()
      `);

      return { success: true, data: undefined };
    } catch (error) {
      const compatibleError = adaptErrorToBaseError(error, 'invalidateAllUserSessions');
      return { success: false, error: compatibleError };
    }
  }

  /**
   * ?�증 ?�동 로그 기록
   */
  async logAuthActivity(
    userId: UserId,
    activity: string,
    metadata?: Record<string, any>
  ): Promise<Result<void, CompatibleBaseError>> {
    try {
      await this.mcpAdapter.executeSQL(`
        INSERT INTO auth_activity_logs (user_id, activity_type, metadata, created_at)
        VALUES ('${userId}', '${activity}', '${JSON.stringify(metadata || {})}', NOW())
      `);

      return { success: true, data: undefined };
    } catch (error) {
      const compatibleError = adaptErrorToBaseError(error, 'logAuthActivity');
      return { success: false, error: compatibleError };
    }
  }

  /**
   * ?�이?�베?�스 결과�?AuthSession?�로 매핑
   */
  private mapDatabaseToAuthSession(data: any): AuthSession {
    return {
      id: data.id,
      userId: data.user_id as UserId,
      email: data.email,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      tokenType: data.token_type || "bearer",
      expiresAt: new Date(data.not_after),
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      isActive: new Date(data.not_after) > new Date(),
      lastSignInAt: data.last_sign_in_at
        ? new Date(data.last_sign_in_at)
        : null,
      emailConfirmedAt: data.email_confirmed_at
        ? new Date(data.email_confirmed_at)
        : null,
    };
  }

  /**
   * ?�이?�베?�스 결과�?UserCredentials�?매핑
   */
  private mapDatabaseToUserCredentials(data: any): UserCredentials {
    return {
      userId: data.id as UserId,
      email: data.email,
      emailConfirmed: !!data.email_confirmed_at,
      provider: data.provider || "email",
      providerId: data.provider_id,
      identityData: data.identity_data ? JSON.parse(data.identity_data) : {},
      activeSessions: parseInt(data.active_sessions) || 0,
      lastSignInAt: data.last_sign_in_at
        ? new Date(data.last_sign_in_at)
        : null,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  /**
   * ?�이?�베?�스 결과�?Permission?�로 매핑
   */
  private mapDatabaseToPermission(data: any): Permission {
    return {
      name: data.permission_name,
      resource: data.resource,
      action: data.action,
      description: data.description,
    };
  }

  /**
   * ?�이?�베?�스 결과�?Role�?매핑
   */
  private mapDatabaseToRole(data: any): Role {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      hierarchyLevel: data.hierarchy_level,
      isActive: data.is_active,
      assignedAt: data.assigned_at ? new Date(data.assigned_at) : new Date(),
      assignedBy: data.assigned_by,
      createdAt: new Date(data.created_at),
    };
  }
}
