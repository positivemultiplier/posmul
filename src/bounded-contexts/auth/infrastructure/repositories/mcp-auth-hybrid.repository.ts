/**
 * MCP Auth Hybrid Repository Implementation
 *
 * Auth 기능은 기존 Supabase 클라이언트 유지
 * 데이터 조회는 MCP 패턴 사용
 *
 * 하이브리드 접근법으로 안전한 MCP 전환 달성
 */

import { mcp_supabase_execute_sql } from "@/shared/mcp/supabase-client";
import { SupabaseProjectService } from "@/shared/mcp/supabase-project.service";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Result } from "../../../../shared/types/common";
import { ExternalServiceError } from "../../../../shared/utils/errors";
import { User } from "../../domain/entities/user.entity";
import { IUserRepository } from "../../domain/repositories/user.repository";
import {
  createEmail,
  createUserId,
  createUserRole,
  Email,
  UserId,
} from "../../domain/value-objects/user-value-objects";

interface UserTable {
  id: string;
  email: string;
  display_name?: string;
  role: "citizen" | "merchant" | "admin";
  pmc_balance: number;
  pmp_balance: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * 하이브리드 Auth Repository
 * Auth 기능: 기존 Supabase 클라이언트
 * 데이터 조회: MCP 패턴
 */
export class MCPAuthHybridRepository implements IUserRepository {
  private readonly authClient: SupabaseClient; // Auth 전용 클라이언트
  private readonly projectId: string; // MCP 전용

  constructor() {
    // Auth 기능용 클라이언트 (기존 방식 유지)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase URL 또는 API 키가 설정되지 않았습니다.");
    }

    this.authClient = createClient(supabaseUrl, supabaseKey);

    // MCP 전용 프로젝트 ID
    this.projectId = SupabaseProjectService.getInstance().getProjectId();
  }

  /**
   * 사용자 저장 (MCP 패턴)
   */
  async save(user: User): Promise<Result<User, Error>> {
    try {
      const query = `
        INSERT INTO users (id, email, display_name, role, pmc_balance, pmp_balance, is_active)
        VALUES ('${user.id}', '${user.email.value}', '${user.displayName}', '${user.role.value}', 
                ${user.pmcBalance}, ${user.pmpBalance}, ${user.isActive})
        ON CONFLICT (id) DO UPDATE SET
          email = EXCLUDED.email,
          display_name = EXCLUDED.display_name,
          role = EXCLUDED.role,
          pmc_balance = EXCLUDED.pmc_balance,
          pmp_balance = EXCLUDED.pmp_balance,
          is_active = EXCLUDED.is_active,
          updated_at = NOW()
        RETURNING *;
      `;

      const result = await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: query,
      });

      if (!result?.data || result.data.length === 0) {
        return {
          success: false,
          error: new ExternalServiceError("MCP", "사용자 저장 실패"),
        };
      }

      const savedUser = this.mapToUser(result.data[0]);
      return { success: true, data: savedUser };
    } catch (error) {
      return {
        success: false,
        error: new ExternalServiceError(
          "MCP",
          error instanceof Error
            ? error.message
            : "사용자 저장 중 오류가 발생했습니다."
        ),
      };
    }
  }

  /**
   * ID로 사용자 조회 (MCP 패턴)
   */
  async findById(id: UserId): Promise<Result<User | null, Error>> {
    try {
      const query = `SELECT * FROM users WHERE id = '${id}'`;

      const result = await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: query,
      });

      if (!result?.data || result.data.length === 0) {
        return { success: true, data: null };
      }

      const user = this.mapToUser(result.data[0]);
      return { success: true, data: user };
    } catch (error) {
      return {
        success: false,
        error: new ExternalServiceError(
          "MCP",
          error instanceof Error
            ? error.message
            : "사용자 조회 중 오류가 발생했습니다."
        ),
      };
    }
  }

  /**
   * 이메일로 사용자 조회 (MCP 패턴)
   */
  async findByEmail(email: Email): Promise<Result<User | null, Error>> {
    try {
      const query = `SELECT * FROM users WHERE email = '${email.value}'`;

      const result = await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: query,
      });

      if (!result?.data || result.data.length === 0) {
        return { success: true, data: null };
      }

      const user = this.mapToUser(result.data[0]);
      return { success: true, data: user };
    } catch (error) {
      return {
        success: false,
        error: new ExternalServiceError(
          "MCP",
          error instanceof Error
            ? error.message
            : "사용자 조회 중 오류가 발생했습니다."
        ),
      };
    }
  }

  /**
   * 사용자 업데이트 (MCP 패턴)
   */
  async update(user: User): Promise<Result<User, Error>> {
    try {
      const query = `
        UPDATE users SET
          email = '${user.email.value}',
          display_name = '${user.displayName}',
          role = '${user.role.value}',
          pmc_balance = ${user.pmcBalance},
          pmp_balance = ${user.pmpBalance},
          is_active = ${user.isActive},
          updated_at = NOW()
        WHERE id = '${user.id}'
        RETURNING *;
      `;

      const result = await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: query,
      });

      if (!result?.data || result.data.length === 0) {
        return {
          success: false,
          error: new ExternalServiceError("MCP", "사용자 업데이트 실패"),
        };
      }

      const updatedUser = this.mapToUser(result.data[0]);
      return { success: true, data: updatedUser };
    } catch (error) {
      return {
        success: false,
        error: new ExternalServiceError(
          "MCP",
          error instanceof Error
            ? error.message
            : "사용자 업데이트 중 오류가 발생했습니다."
        ),
      };
    }
  }

  /**
   * 이메일 중복 확인 (MCP 패턴)
   */
  async existsByEmail(email: Email): Promise<Result<boolean, Error>> {
    try {
      const query = `SELECT id FROM users WHERE email = '${email.value}' LIMIT 1`;

      const result = await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: query,
      });

      return { success: true, data: (result?.data?.length || 0) > 0 };
    } catch (error) {
      return {
        success: false,
        error: new ExternalServiceError(
          "MCP",
          error instanceof Error
            ? error.message
            : "이메일 중복 확인 중 오류가 발생했습니다."
        ),
      };
    }
  }

  /**
   * 사용자 목록 조회 (MCP 패턴)
   */
  async findAll(
    page: number = 1,
    limit: number = 20
  ): Promise<Result<User[], Error>> {
    try {
      const offset = (page - 1) * limit;
      const query = `
        SELECT * FROM users 
        ORDER BY created_at DESC 
        LIMIT ${limit} OFFSET ${offset}
      `;

      const result = await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: query,
      });

      const users = (result?.data || []).map((userData: any) =>
        this.mapToUser(userData)
      );
      return { success: true, data: users };
    } catch (error) {
      return {
        success: false,
        error: new ExternalServiceError(
          "MCP",
          error instanceof Error
            ? error.message
            : "사용자 목록 조회 중 오류가 발생했습니다."
        ),
      };
    }
  }

  /**
   * 사용자 삭제 (소프트 삭제, MCP 패턴)
   */
  async delete(id: UserId): Promise<Result<void, Error>> {
    try {
      const query = `
        UPDATE users SET 
          is_active = false,
          updated_at = NOW()
        WHERE id = '${id}'
      `;

      await mcp_supabase_execute_sql({
        project_id: this.projectId,
        query: query,
      });

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: new ExternalServiceError(
          "MCP",
          error instanceof Error
            ? error.message
            : "사용자 삭제 중 오류가 발생했습니다."
        ),
      };
    }
  }

  /**
   * Auth 기능 (기존 Supabase 클라이언트 사용)
   */
  async signIn(email: string, password: string) {
    return await this.authClient.auth.signInWithPassword({ email, password });
  }

  async signUp(email: string, password: string) {
    return await this.authClient.auth.signUp({ email, password });
  }

  async signOut() {
    return await this.authClient.auth.signOut();
  }

  async getCurrentSession() {
    return await this.authClient.auth.getSession();
  }

  /**
   * 데이터베이스 행을 도메인 객체로 매핑
   */
  private mapToUser(data: UserTable): User {
    return User.fromDatabase({
      id: createUserId(data.id),
      email: createEmail(data.email),
      displayName: data.display_name,
      role: createUserRole(data.role),
      pmcBalance: data.pmc_balance,
      pmpBalance: data.pmp_balance,
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    });
  }
}
