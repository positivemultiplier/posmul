/**
 * Supabase ?¬ìš©??ë¦¬í¬ì§€? ë¦¬ êµ¬í˜„
 */

import type { Result } from "@posmul/auth-economy-sdk";
import { DomainError } from "@posmul/auth-economy-sdk"; // ExternalServiceErrorë¥?SDK??DomainErrorë¡??€ì²?

import { createClient, SupabaseClient } from "@supabase/supabase-js";
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

export class SupabaseUserRepository implements IUserRepository {
  private supabase: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase URL ?ëŠ” API ?¤ê? ?¤ì •?˜ì? ?Šì•˜?µë‹ˆ??");
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async save(user: User): Promise<Result<User, Error>> {
    try {
      const userData: Omit<UserTable, "created_at" | "updated_at"> = {
        id: user.id,
        email: user.email.value,
        display_name: user.displayName,
        role: user.role.value,
        pmc_balance: user.pmcBalance,
        pmp_balance: user.pmpBalance,
        is_active: user.isActive,
      };

      const { data, error } = await this.supabase
        .from("users")
        .insert(userData)
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: new DomainError(error.message, { code: "SUPABASE_ERROR", service: "Supabase" }),
        };
      }

      const savedUser = this.mapToUser(data);
      return { success: true, data: savedUser };
    } catch (error) {
      return {
        success: false,
        error: new DomainError(
          error instanceof Error
            ? error.message
            : "?¬ìš©???€??ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.",
          { code: "SUPABASE_ERROR", service: "Supabase" }
        ),
      };
    }
  }

  async findById(id: UserId): Promise<Result<User | null, Error>> {
    try {
      const { data, error } = await this.supabase
        .from("users")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No rows returned
          return { success: true, data: null };
        }
        return {
          success: false,
          error: new DomainError(error.message, { code: "SUPABASE_ERROR", service: "Supabase" }),
        };
      }

      const user = this.mapToUser(data);
      return { success: true, data: user };
    } catch (error) {
      return {
        success: false,
        error: new ExternalServiceError(
          "Supabase",
          error instanceof Error
            ? error.message
            : "?¬ìš©??ì¡°íšŒ ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤."
        ),
      };
    }
  }

  async findByEmail(email: Email): Promise<Result<User | null, Error>> {
    try {
      const { data, error } = await this.supabase
        .from("users")
        .select("*")
        .eq("email", email.value)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No rows returned
          return { success: true, data: null };
        }
        return {
          success: false,
          error: new DomainError(error.message, { code: "SUPABASE_ERROR", service: "Supabase" }),
        };
      }

      const user = this.mapToUser(data);
      return { success: true, data: user };
    } catch (error) {
      return {
        success: false,
        error: new ExternalServiceError(
          "Supabase",
          error instanceof Error
            ? error.message
            : "?¬ìš©??ì¡°íšŒ ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤."
        ),
      };
    }
  }

  async update(user: User): Promise<Result<User, Error>> {
    try {
      const userData = {
        email: user.email.value,
        display_name: user.displayName,
        role: user.role.value,
        pmc_balance: user.pmcBalance,
        pmp_balance: user.pmpBalance,
        is_active: user.isActive,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await this.supabase
        .from("users")
        .update(userData)
        .eq("id", user.id)
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: new DomainError(error.message, { code: "SUPABASE_ERROR", service: "Supabase" }),
        };
      }

      const updatedUser = this.mapToUser(data);
      return { success: true, data: updatedUser };
    } catch (error) {
      return {
        success: false,
        error: new ExternalServiceError(
          "Supabase",
          error instanceof Error
            ? error.message
            : "?¬ìš©???…ë°?´íŠ¸ ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤."
        ),
      };
    }
  }

  async existsByEmail(email: Email): Promise<Result<boolean, Error>> {
    try {
      const { data, error } = await this.supabase
        .from("users")
        .select("id")
        .eq("email", email.value)
        .limit(1);

      if (error) {
        return {
          success: false,
          error: new DomainError(error.message, { code: "SUPABASE_ERROR", service: "Supabase" }),
        };
      }

      return { success: true, data: data.length > 0 };
    } catch (error) {
      return {
        success: false,
        error: new ExternalServiceError(
          "Supabase",
          error instanceof Error
            ? error.message
            : "?´ë©”??ì¤‘ë³µ ?•ì¸ ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤."
        ),
      };
    }
  }

  async findAll(
    page: number = 1,
    limit: number = 20
  ): Promise<Result<User[], Error>> {
    try {
      const offset = (page - 1) * limit;

      const { data, error } = await this.supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        return {
          success: false,
          error: new DomainError(error.message, { code: "SUPABASE_ERROR", service: "Supabase" }),
        };
      }

      const users = data.map((userData) => this.mapToUser(userData));
      return { success: true, data: users };
    } catch (error) {
      return {
        success: false,
        error: new ExternalServiceError(
          "Supabase",
          error instanceof Error
            ? error.message
            : "?¬ìš©??ëª©ë¡ ì¡°íšŒ ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤."
        ),
      };
    }
  }

  async delete(id: UserId): Promise<Result<void, Error>> {
    try {
      // ?Œí”„???? œ êµ¬í˜„
      const { error } = await this.supabase
        .from("users")
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) {
        return {
          success: false,
          error: new DomainError(error.message, { code: "SUPABASE_ERROR", service: "Supabase" }),
        };
      }

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: new ExternalServiceError(
          "Supabase",
          error instanceof Error
            ? error.message
            : "?¬ìš©???? œ ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤."
        ),
      };
    }
  }

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
