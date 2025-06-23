import { SupabaseProjectId } from "@/shared/types/branded-types";

export class SupabaseProjectService {
  private static instance: SupabaseProjectService;
  private projectId: SupabaseProjectId;

  private constructor() {
    this.projectId = (process.env.SUPABASE_PROJECT_ID ||
      "fabyagohqqnusmnwekuc") as SupabaseProjectId;
    if (!this.projectId) {
      throw new Error("SUPABASE_PROJECT_ID environment variable is required");
    }
  }

  static getInstance(): SupabaseProjectService {
    if (!SupabaseProjectService.instance) {
      SupabaseProjectService.instance = new SupabaseProjectService();
    }
    return SupabaseProjectService.instance;
  }

  getProjectId(): SupabaseProjectId {
    return this.projectId;
  }
}
