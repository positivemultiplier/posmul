/**
 * MCP Auth Repository Implementation
 *
 * Clean Architecture Infrastructure 계층의 Repository 구현체
 * IAuthRepository 인터페이스를 MCP Supabase로 구현
 */

import { mcp_supabase_execute_sql } from "@/shared/mcp/supabase-client";
import { UserId } from "@/shared/types/branded-types";
import { Result } from "@/shared/types/common";
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
  constructor(private readonly projectId: string) {}

  /**
   * 사용자 인증 세션 조회
   */
  async getSession(
    sessionId: string
  ): Promise<Result<AuthSession | null, Error>> {
    try {
      const result = await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: `
          SELECT s.*, u.email, u.email_confirmed_at, u.last_sign_in_at
          FROM auth.sessions s
          JOIN auth.users u ON s.user_id = u.id
          WHERE s.id = $1 AND s.not_after > NOW()
        `,
      });

      if (!result.data || result.data.length === 0) {
        return { success: true, data: null };
      }

      const sessionData = result.data[0];
      const session = this.mapDatabaseToAuthSession(sessionData);
      return { success: true, data: session };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * 사용자 인증 정보 조회
   */
  async getUserCredentials(
    userId: UserId
  ): Promise<Result<UserCredentials | null, Error>> {
    try {
      const result = await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: `
          SELECT u.*, 
                 i.provider, i.provider_id, i.identity_data,
                 COUNT(s.id) as active_sessions
          FROM auth.users u
          LEFT JOIN auth.identities i ON u.id = i.user_id
          LEFT JOIN auth.sessions s ON u.id = s.user_id AND s.not_after > NOW()
          WHERE u.id = $1
          GROUP BY u.id, i.provider, i.provider_id, i.identity_data
        `,
      });

      if (!result.data || result.data.length === 0) {
        return { success: true, data: null };
      }

      const credentialsData = result.data[0];
      const credentials = this.mapDatabaseToUserCredentials(credentialsData);
      return { success: true, data: credentials };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * 활성 세션 목록 조회
   */
  async getActiveSessions(
    userId: UserId
  ): Promise<Result<AuthSession[], Error>> {
    try {
      const result = await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: `
          SELECT s.*, u.email, u.email_confirmed_at, u.last_sign_in_at
          FROM auth.sessions s
          JOIN auth.users u ON s.user_id = u.id
          WHERE s.user_id = $1 AND s.not_after > NOW()
          ORDER BY s.created_at DESC
        `,
      });

      const sessions =
        result.data?.map((sessionData) =>
          this.mapDatabaseToAuthSession(sessionData)
        ) || [];
      return { success: true, data: sessions };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * 사용자 권한 조회
   */
  async getUserPermissions(
    userId: UserId
  ): Promise<Result<Permission[], Error>> {
    try {
      const result = await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: `
          SELECT DISTINCT p.permission_name, p.resource, p.action
          FROM user_roles ur
          JOIN role_permissions rp ON ur.role_id = rp.role_id
          JOIN permissions p ON rp.permission_id = p.id
          WHERE ur.user_id = $1 AND ur.is_active = true
        `,
      });

      const permissions =
        result.data?.map((permData) =>
          this.mapDatabaseToPermission(permData)
        ) || [];
      return { success: true, data: permissions };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * 사용자 역할 조회
   */
  async getUserRoles(userId: UserId): Promise<Result<Role[], Error>> {
    try {
      const result = await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: `
          SELECT r.*, ur.assigned_at, ur.assigned_by
          FROM user_roles ur
          JOIN roles r ON ur.role_id = r.id
          WHERE ur.user_id = $1 AND ur.is_active = true
          ORDER BY r.hierarchy_level DESC
        `,
      });

      const roles =
        result.data?.map((roleData) => this.mapDatabaseToRole(roleData)) || [];
      return { success: true, data: roles };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * 세션 무효화
   */
  async invalidateSession(sessionId: string): Promise<Result<void, Error>> {
    try {
      await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: `
          UPDATE auth.sessions 
          SET not_after = NOW() 
          WHERE id = $1
        `,
      });

      return { success: true, data: undefined };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * 모든 사용자 세션 무효화
   */
  async invalidateAllUserSessions(
    userId: UserId
  ): Promise<Result<void, Error>> {
    try {
      await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: `
          UPDATE auth.sessions 
          SET not_after = NOW() 
          WHERE user_id = $1 AND not_after > NOW()
        `,
      });

      return { success: true, data: undefined };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * 인증 활동 로그 기록
   */
  async logAuthActivity(
    userId: UserId,
    activity: string,
    metadata?: Record<string, any>
  ): Promise<Result<void, Error>> {
    try {
      await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: `
          INSERT INTO auth_activity_logs (user_id, activity_type, metadata, created_at)
          VALUES ($1, $2, $3, NOW())
        `,
      });

      return { success: true, data: undefined };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * 데이터베이스 결과를 AuthSession으로 매핑
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
   * 데이터베이스 결과를 UserCredentials로 매핑
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
   * 데이터베이스 결과를 Permission으로 매핑
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
   * 데이터베이스 결과를 Role로 매핑
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
