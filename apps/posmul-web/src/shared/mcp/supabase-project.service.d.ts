export declare class SupabaseProjectService {
    private static instance;
    private readonly projectId;
    private constructor();
    static getInstance(): SupabaseProjectService;
    getProjectId(): string;
}
