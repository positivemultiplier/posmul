import { SupabaseProjectId } from "@/shared/types/branded-types";

/**
 * SupabaseProjectService
 * 환경 변수에서 Supabase 프로젝트 ID를 안전하게 관리하고 제공하는 싱글턴 서비스
 */
export class SupabaseProjectService {
  private static instance: SupabaseProjectService;
  private projectId: SupabaseProjectId;

  private constructor() {
    const projectId = process.env
      .NEXT_PUBLIC_SUPABASE_PROJECT_ID as SupabaseProjectId;
    if (!projectId) {
      // 서버 환경에서는 빌드 시점에 오류를 발생시켜 잘못된 설정을 방지합니다.
      // 클라이언트 환경에서는 동작 중 오류를 발생시킵니다.
      throw new Error(
        "Supabase Project ID is not configured. Please set NEXT_PUBLIC_SUPABASE_PROJECT_ID in your environment variables."
      );
    }
    this.projectId = projectId;
  }

  /**
   * 서비스의 싱글턴 인스턴스를 반환합니다.
   */
  public static getInstance(): SupabaseProjectService {
    if (!SupabaseProjectService.instance) {
      SupabaseProjectService.instance = new SupabaseProjectService();
    }
    return SupabaseProjectService.instance;
  }

  /**
   * 설정된 Supabase 프로젝트 ID를 반환합니다.
   */
  public getProjectId(): SupabaseProjectId {
    return this.projectId;
  }
}
