// PosMul Shared Authentication Package
// Clean Architecture + DDD implementation for universal auth

// === Core Services ===
export { AuthenticationService } from './services/authentication.service';

// === Domain Layer ===
export { UserDomainService } from './domain/user-domain.service';

// === Use Cases ===
export {
  SignUpUseCase,
  SignInUseCase,
  UpdateProfileUseCase,
  GetCurrentUserUseCase,
  SignOutUseCase,
} from './use-cases/auth.use-cases';

// === Repository ===
export { SupabaseUserRepository } from './repository/supabase-user.repository';

// === Legacy Exports (for backward compatibility) ===
// Middleware exports
export { updateSession } from "./middleware";

// MCP helper functions - now located in this package
export { 
  SupabaseMCPClient,
  createSupabaseMCPClient,
  mcp_supabase_apply_migration,
  mcp_supabase_execute_sql,
  mcp_supabase_get_advisors,
  mcp_supabase_list_tables
} from "./supabase-client";

export { 
  SupabaseProjectService
} from "./supabase-project.service";

// MCP Error helpers
export {
  SupabaseMCPError as MCPError,
  handleMCPError,
} from "./mcp-errors";

// React Native client (includes supabaseNative and SupabaseNativeClient)
export * from "./react-native-client";
