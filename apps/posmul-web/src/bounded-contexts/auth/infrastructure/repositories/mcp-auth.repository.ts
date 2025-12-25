import { createDefaultMCPAdapter } from "../../../../shared/legacy-compatibility";
import { IAuthRepository } from '../../domain/repositories';
import { AuthSession, Permission, Role, UserCredentials } from '../../domain/entities';
import { Result, UserId } from '@posmul/auth-economy-sdk';

export class MCPAuthRepository implements IAuthRepository {
  private readonly mcpAdapter = createDefaultMCPAdapter();

  constructor(private readonly projectId: string) {
    void this.projectId;
  }

  async getSession(sessionId: string): Promise<Result<AuthSession | null, Error>> {
    try {
      const query = `
        SELECT 
          s.id, s.user_id, s.expires_at, s.created_at, s.updated_at,
          u.email, u.created_at as user_created_at
        FROM auth.sessions s
        LEFT JOIN auth.users u ON s.user_id = u.id
        WHERE s.id = '${sessionId}' AND s.expires_at > NOW()
      `;

      const result = await this.mcpAdapter.executeSQL(query);

      if (result.data.length === 0) {
        return { success: true, data: null };
      }

      const sessionData = result.data[0];
      const session: AuthSession = {
        id: sessionData.id,
        userId: sessionData.user_id as UserId,
        email: sessionData.email,
        accessToken: '', // Not stored in DB for security
        refreshToken: '', // Not stored in DB for security
        tokenType: 'bearer',
        expiresAt: new Date(sessionData.expires_at),
        createdAt: new Date(sessionData.created_at),
        updatedAt: new Date(sessionData.updated_at),
        isActive: new Date(sessionData.expires_at) > new Date(),
        lastSignInAt: new Date(sessionData.created_at),
        emailConfirmedAt: sessionData.email_confirmed_at ? new Date(sessionData.email_confirmed_at) : null
      };

      return { success: true, data: session };
    } catch (error) {
      void error;
      return { success: false, error: new Error("GET_SESSION_ERROR") };
    }
  }

  async getUserCredentials(userId: UserId): Promise<Result<UserCredentials | null, Error>> {
    try {
      const query = `
        SELECT 
          u.id, u.email, u.encrypted_password, u.email_confirmed_at,
          u.created_at, u.updated_at
        FROM auth.users u
        WHERE u.id = '${userId}'
      `;

      const result = await this.mcpAdapter.executeSQL(query);

      if (result.data.length === 0) {
        return { success: true, data: null };
      }

      const userData = result.data[0];
      const credentials: UserCredentials = {
        userId: userData.id as UserId,
        email: userData.email,
        emailConfirmed: !!userData.email_confirmed_at,
        provider: 'email',
        identityData: {},
        activeSessions: 0,
        lastSignInAt: null,
        createdAt: new Date(userData.created_at),
        updatedAt: new Date(userData.updated_at)
      };

      return { success: true, data: credentials };
    } catch (error) {
      if (error instanceof Error) {
        return { success: false, error };
      }
      return { success: false, error: new Error("Credential lookup failed") };
    }
  }

  async getActiveSessions(userId: UserId): Promise<Result<AuthSession[], Error>> {
    try {
      const query = `
        SELECT id, user_id, expires_at, created_at, updated_at
        FROM auth.sessions
        WHERE user_id = '${userId}' AND expires_at > NOW()
        ORDER BY created_at DESC
      `;

      const result = await this.mcpAdapter.executeSQL(query);

      const sessions = result.data.map(sessionData => ({
        id: sessionData.id,
        userId: sessionData.user_id as UserId,
        email: '',
        accessToken: '',
        refreshToken: '',
        tokenType: 'bearer',
        expiresAt: new Date(sessionData.expires_at),
        createdAt: new Date(sessionData.created_at),
        updatedAt: new Date(sessionData.updated_at),
        isActive: new Date(sessionData.expires_at) > new Date(),
        lastSignInAt: new Date(sessionData.created_at),
        emailConfirmedAt: null
      } as AuthSession));

      return { success: true, data: sessions };
    } catch (error) {
      return { success: false, error: new Error(`Failed to get active sessions: ${error}`) };
    }
  }

  async getUserPermissions(userId: UserId): Promise<Result<Permission[], Error>> {
    try {
      const query = `
        SELECT DISTINCT p.id, p.name, p.resource, p.action, p.created_at
        FROM auth.permissions p
        JOIN auth.role_permissions rp ON p.id = rp.permission_id
        JOIN auth.user_roles ur ON rp.role_id = ur.role_id
        WHERE ur.user_id = '${userId}'
      `;

      const result = await this.mcpAdapter.executeSQL(query);

      const permissions = result.data.map(permData => ({
        name: permData.name,
        resource: permData.resource,
        action: permData.action,
        description: permData.description
      } as Permission));

      return { success: true, data: permissions };
    } catch (error) {
      return { success: false, error: new Error(`Failed to get user permissions: ${error}`) };
    }
  }

  async getUserRoles(userId: UserId): Promise<Result<Role[], Error>> {
    try {
      const query = `
        SELECT r.id, r.name, r.description, r.created_at
        FROM auth.roles r
        JOIN auth.user_roles ur ON r.id = ur.role_id
        WHERE ur.user_id = '${userId}'
      `;

      const result = await this.mcpAdapter.executeSQL(query);

      const roles = result.data.map(roleData => ({
        id: roleData.id,
        name: roleData.name,
        description: roleData.description,
        hierarchyLevel: 1,
        isActive: true,
        assignedAt: new Date(roleData.created_at),
        createdAt: new Date(roleData.created_at)
      } as Role));

      return { success: true, data: roles };
    } catch (error) {
      return { success: false, error: new Error(`Failed to get user roles: ${error}`) };
    }
  }

  async invalidateSession(sessionId: string): Promise<Result<void, Error>> {
    try {
      const query = `
        UPDATE auth.sessions 
        SET expires_at = NOW() 
        WHERE id = '${sessionId}'
      `;

      await this.mcpAdapter.executeSQL(query);

      return { success: true, data: undefined };
    } catch (error) {
      if (error instanceof Error) {
        return { success: false, error };
      }
      return { success: false, error: new Error("Invalidation failed") };
    }
  }

  async invalidateAllUserSessions(userId: UserId): Promise<Result<void, Error>> {
    try {
      const query = `
        UPDATE auth.sessions 
        SET expires_at = NOW() 
        WHERE user_id = '${userId}' AND expires_at > NOW()
      `;

      await this.mcpAdapter.executeSQL(query);

      return { success: true, data: undefined };
    } catch (error) {
      return { success: false, error: new Error(`Failed to invalidate all user sessions: ${error}`) };
    }
  }

  async logAuthActivity(
    userId: UserId,
    activity: string,
    metadata?: Record<string, any>
  ): Promise<Result<void, Error>> {
    try {
      const query = `
        INSERT INTO auth.auth_activity_log (user_id, activity, metadata, created_at)
        VALUES ('${userId}', '${activity}', '${JSON.stringify(metadata || {})}', NOW())
      `;

      await this.mcpAdapter.executeSQL(query);

      return { success: true, data: undefined };
    } catch (error) {
      return { success: false, error: new Error(`Failed to log auth activity: ${error}`) };
    }
  }
}