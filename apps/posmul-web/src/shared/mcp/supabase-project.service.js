const SupabaseProjectService = /** @class */ (function () {
  function SupabaseProjectService() {
    // TODO: 실제로는 process.env 등에서 가져와야 함
    this.projectId = "fabyagohqqnusmnwekuc";
    if (!this.projectId) {
      throw new Error("SUPABASE_PROJECT_ID is required");
    }
  }
  SupabaseProjectService.getInstance = function () {
    if (!SupabaseProjectService.instance) {
      SupabaseProjectService.instance = new SupabaseProjectService();
    }
    return SupabaseProjectService.instance;
  };
  SupabaseProjectService.prototype.getProjectId = function () {
    return this.projectId;
  };
  return SupabaseProjectService;
})();
export { SupabaseProjectService };
