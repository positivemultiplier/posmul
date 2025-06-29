/**
 * Supabase 사용자 리포지토리 구현
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { IUserRepository } from '../../domain/repositories/user.repository';
import { User } from '../../domain/entities/user.entity';
import { UserId, Email, createUserId, createEmail, createUserRole } from '../../domain/value-objects/user-value-objects';
import { ExternalServiceError } from '@posmul/shared-ui';
import type { Result } from '@posmul/shared-types';

interface UserTable {
  id: string;
  email: string;
  display_name?: string;
  role: 'citizen' | 'merchant' | 'admin';
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
      throw new Error('Supabase URL 또는 API 키가 설정되지 않았습니다.');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async save(user: User): Promise<Result<User, Error>> {
    try {
      const userData: Omit<UserTable, 'created_at' | 'updated_at'> = {
        id: user.id,
        email: user.email.value,
        display_name: user.displayName,
        role: user.role.value,
        pmc_balance: user.pmcBalance,
        pmp_balance: user.pmpBalance,
        is_active: user.isActive
      };

      const { data, error } = await this.supabase
        .from('users')
        .insert(userData)
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: new ExternalServiceError('Supabase', error.message)
        };
      }

      const savedUser = this.mapToUser(data);
      return { success: true, data: savedUser };

    } catch (error) {
      return {
        success: false,
        error: new ExternalServiceError(
          'Supabase',
          error instanceof Error ? error.message : '사용자 저장 중 오류가 발생했습니다.'
        )
      };
    }
  }

  async findById(id: UserId): Promise<Result<User | null, Error>> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // No rows returned
          return { success: true, data: null };
        }
        return {
          success: false,
          error: new ExternalServiceError('Supabase', error.message)
        };
      }

      const user = this.mapToUser(data);
      return { success: true, data: user };

    } catch (error) {
      return {
        success: false,
        error: new ExternalServiceError(
          'Supabase',
          error instanceof Error ? error.message : '사용자 조회 중 오류가 발생했습니다.'
        )
      };
    }
  }

  async findByEmail(email: Email): Promise<Result<User | null, Error>> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('email', email.value)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // No rows returned
          return { success: true, data: null };
        }
        return {
          success: false,
          error: new ExternalServiceError('Supabase', error.message)
        };
      }

      const user = this.mapToUser(data);
      return { success: true, data: user };

    } catch (error) {
      return {
        success: false,
        error: new ExternalServiceError(
          'Supabase',
          error instanceof Error ? error.message : '사용자 조회 중 오류가 발생했습니다.'
        )
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
        updated_at: new Date().toISOString()
      };

      const { data, error } = await this.supabase
        .from('users')
        .update(userData)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: new ExternalServiceError('Supabase', error.message)
        };
      }

      const updatedUser = this.mapToUser(data);
      return { success: true, data: updatedUser };

    } catch (error) {
      return {
        success: false,
        error: new ExternalServiceError(
          'Supabase',
          error instanceof Error ? error.message : '사용자 업데이트 중 오류가 발생했습니다.'
        )
      };
    }
  }

  async existsByEmail(email: Email): Promise<Result<boolean, Error>> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('id')
        .eq('email', email.value)
        .limit(1);

      if (error) {
        return {
          success: false,
          error: new ExternalServiceError('Supabase', error.message)
        };
      }

      return { success: true, data: data.length > 0 };

    } catch (error) {
      return {
        success: false,
        error: new ExternalServiceError(
          'Supabase',
          error instanceof Error ? error.message : '이메일 중복 확인 중 오류가 발생했습니다.'
        )
      };
    }
  }

  async findAll(page: number = 1, limit: number = 20): Promise<Result<User[], Error>> {
    try {
      const offset = (page - 1) * limit;

      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        return {
          success: false,
          error: new ExternalServiceError('Supabase', error.message)
        };
      }

      const users = data.map(userData => this.mapToUser(userData));
      return { success: true, data: users };

    } catch (error) {
      return {
        success: false,
        error: new ExternalServiceError(
          'Supabase',
          error instanceof Error ? error.message : '사용자 목록 조회 중 오류가 발생했습니다.'
        )
      };
    }
  }

  async delete(id: UserId): Promise<Result<void, Error>> {
    try {
      // 소프트 삭제 구현
      const { error } = await this.supabase
        .from('users')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString() 
        })
        .eq('id', id);

      if (error) {
        return {
          success: false,
          error: new ExternalServiceError('Supabase', error.message)
        };
      }

      return { success: true, data: undefined };

    } catch (error) {
      return {
        success: false,
        error: new ExternalServiceError(
          'Supabase',
          error instanceof Error ? error.message : '사용자 삭제 중 오류가 발생했습니다.'
        )
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
      updatedAt: new Date(data.updated_at)
    });
  }
}
