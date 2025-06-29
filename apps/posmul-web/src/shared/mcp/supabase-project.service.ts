export * from "@posmul/shared-auth";

export class SupabaseProjectService {
  private static instance: SupabaseProjectService;
  private readonly projectId: string;

  private constructor() {
    // TODO: 실제로는 process.env 등에서 가져와야 함
    this.projectId = "fabyagohqqnusmnwekuc";
    if (!this.projectId) {
      throw new Error("SUPABASE_PROJECT_ID is required");
    }
  }

  public static getInstance(): SupabaseProjectService {
    if (!SupabaseProjectService.instance) {
      SupabaseProjectService.instance = new SupabaseProjectService();
    }
    return SupabaseProjectService.instance;
  }

  public getProjectId(): string {
    return this.projectId;
  }
}
