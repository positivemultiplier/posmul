/**
 * Supabase Base Repository
 *
 * 모든 Supabase Repository의 기본 클래스
 * Clean Architecture의 Infrastructure 계층에서 공통 기능 제공
 */

import { Result } from "@/shared/types/common";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase 클라이언트 설정
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export abstract class BaseSupabaseRepository {
  protected readonly client: SupabaseClient;

  constructor() {
    this.client = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * 에러를 Result 타입으로 래핑하는 헬퍼 함수
   */
  protected handleError<T>(error: unknown): Result<T> {
    console.error("Supabase Repository Error:", error);

    const message =
      error instanceof Error ? error.message : "Unknown database error";

    return {
      success: false,
      error: new Error(`Database operation failed: ${message}`),
    };
  }

  /**
   * 성공 결과를 Result 타입으로 래핑하는 헬퍼 함수
   */
  protected handleSuccess<T>(data: T): Result<T> {
    return {
      success: true,
      data,
    };
  }

  /**
   * Supabase 응답을 Result 타입으로 변환하는 헬퍼 함수
   */
  protected async handleSupabaseResponse<T>(
    promise: Promise<{ data: T | null; error: any }>
  ): Promise<Result<T>> {
    try {
      const { data, error } = await promise;

      if (error) {
        return this.handleError<T>(error);
      }

      if (data === null) {
        return this.handleError<T>(new Error("No data returned"));
      }

      return this.handleSuccess(data);
    } catch (error) {
      return this.handleError<T>(error);
    }
  }

  /**
   * 배열 결과를 위한 Supabase 응답 처리
   */
  protected async handleSupabaseArrayResponse<T>(
    promise: Promise<{ data: T[] | null; error: any }>
  ): Promise<Result<T[]>> {
    try {
      const { data, error } = await promise;

      if (error) {
        return this.handleError<T[]>(error);
      }

      return this.handleSuccess(data || []);
    } catch (error) {
      return this.handleError<T[]>(error);
    }
  }

  /**
   * 현재 인증된 사용자 ID 가져오기
   */
  protected async getCurrentUserId(): Promise<string | null> {
    const {
      data: { user },
    } = await this.client.auth.getUser();
    return user?.id || null;
  }
  /**
   * 트랜잭션 실행을 위한 헬퍼 함수
   * Supabase는 아직 트랜잭션을 완전히 지원하지 않으므로 RPC 함수 사용
   */
  protected async executeTransaction<T>(
    transactionFunction: string,
    parameters: Record<string, any>
  ): Promise<Result<T>> {
    try {
      const { data, error } = await this.client.rpc(
        transactionFunction,
        parameters
      );

      if (error) {
        return this.handleError<T>(error);
      }

      return this.handleSuccess(data as T);
    } catch (error) {
      return this.handleError<T>(error);
    }
  }

  /**
   * 페이지네이션을 위한 헬퍼 함수
   */
  protected getPaginationParams(page: number = 1, limit: number = 20) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    return { from, to };
  }

  /**
   * 실시간 구독 설정을 위한 헬퍼 함수
   */
  protected subscribeToTable<T>(
    table: string,
    callback: (payload: T) => void,
    filter?: string
  ) {
    const subscription = this.client
      .channel(`${table}_changes`)
      .on(
        "postgres_changes" as any,
        {
          event: "*",
          schema: "public",
          table: table,
          filter: filter,
        },
        callback
      )
      .subscribe();

    return subscription;
  }
}
