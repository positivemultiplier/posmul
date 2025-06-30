// This file serves as the entry point for the @posmul/shared-auth package.
// Authentication-related exports will be added here.

export * from "./middleware";
// NOTE: `createSupabaseServerClient` is server-only (uses `next/headers`).
// To avoid bundling this into client/runtime, import from
// `@posmul/shared-auth/server` explicitly where needed.
// export * from "./server"; // removed from root barrel to prevent build errors

// Re-export Supabase MCP helper functions located in web app until they are migrated
export * from "../../../apps/posmul-web/src/shared/mcp/supabase-client";

// Temporary re-export from web app
export * from "../../../apps/posmul-web/src/shared/mcp/supabase-project.service";

// MCP Error helpers
export {
  SupabaseMCPError as MCPError,
  handleMCPError,
} from "../../../apps/posmul-web/src/shared/mcp/mcp-errors";

export * from "./react-native-client";
