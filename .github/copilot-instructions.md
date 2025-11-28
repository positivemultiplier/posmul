# PosMul AI-Era Direct Democracy Platform - Copilot Instructions

## Project Overview

PosMul is a **6-module integrated platform** for AI-era direct democracy, implementing Agency Theory, CAPM, and behavioral economics through Domain-Driven Design (DDD) and Clean Architecture in a monorepo structure.

### 🎯 Core Vision

- **시민 예산 집행 연습장**: Iron Triangle (관료-정치인-공급자) 극복
- **6개 모듈**: Invest, Expect, Donate, Forum, Others, Ranking
- **이중 토큰 경제**: PMP (위험프리) + PMC (위험자산)
- **MoneyWave 3단계 분배**: EAT 기반 자동 분배 + 미사용 재분배 + 기업가 생태계
- **auth-economy-sdk**: 생태계 확장을 위한 All-in-One SDK

## Architecture Principles

### Monorepo + DDD + Clean Architecture Stack

- **Package Manager**: pnpm@10.12.4 (NEVER npm/yarn) with workspace protocols
- **Build System**: turbo@2.0.4 for optimized builds and caching
- **Database Operations**: Supabase via MCP tools (`mcp_supabase_*`) - NOT Supabase CLI
- **Project Management**: GitHub via MCP tools (`mcp_github_*`) - NOT GitHub CLI
- **Development Environment**: Windows PowerShell, use `;` for command chaining
- **File Encoding**: UTF-8-sig for perfect Korean support
- **Response Language**: 한글 우선 (Korean first, English technical terms)

### Critical Architecture Pattern: Shared Economic Kernel

The **PMP/PMC economy system** spans ALL domains through a Shared Kernel pattern:

- All domains READ from Economy Kernel (direct access)
- All domains WRITE through Domain Events (`PmpSpentEvent`, `PmcEarnedEvent`)
- Economic transactions are handled by centralized Event Handlers
- **MoneyWave 3단계**: EAT 기반 PMC 발행 → 미사용 재분배 → 기업가 생태계

### 6개 모듈 경제 통합

```
📈 Invest: Major/Local/Cloud League → PMP/PMC 획득
🔮 Expect: PMP 투입 → 예측 게임 → PMC 획득
💝 Donate: PMC 전용 → 실제 기관 기부 (예산 집행 연습)
💬 Forum: 토론/브레인스토밍 참여 → PMP 획득
⚙️ Others: 전문 서비스 이용 → PMC 획득
🏆 Ranking: 모든 활동 추적 → 추가 보상
```

## Essential Development Commands

```powershell
# Monorepo root development (pnpm + turbo ONLY)
pnpm install                    # Install all workspace dependencies
turbo dev                       # Start all apps with hot reload
turbo build                     # Build all packages and apps
turbo test                      # Run all tests with turbo cache

# Package-specific commands
pnpm -F posmul-web dev         # Run specific app
pnpm -F auth-economy-sdk build # Build specific package
pnpm -F shared-types test      # Test specific package

# Add workspace dependencies (ALWAYS use workspace protocol)
pnpm -F posmul-web add shared-types@workspace:*
pnpm -F posmul-web add auth-economy-sdk@workspace:*

# MCP operations (Database ONLY via MCP tools)
# NEVER use Supabase CLI - ALWAYS use mcp_supabase_* tools
# NEVER use GitHub CLI - ALWAYS use mcp_github_* tools

# Encoding check (UTF-8-sig for Korean)
$OutputEncoding = [System.Text.Encoding]::UTF8; Get-Content "file.ts" -Encoding UTF8
```

## Project Structure Patterns

### Bounded Context Structure (DDD)

```
apps/posmul-web/src/bounded-contexts/[context]/
├── auth/              # 🔐 인증 도메인 (PosMul 계정 통합)
├── economy/           # 💰 경제 시스템 도메인 (Shared Kernel - PMP/PMC/MoneyWave)
├── prediction/        # 🔮 예측 게임 도메인 (Expect - Agency Theory 구현)
├── investment/        # 📈 투자 도메인 (Invest - Major/Local/Cloud Funding)
├── donation/          # 💝 기부 도메인 (Donate - PMC 전용 사용처)
├── forum/             # 💬 커뮤니티 도메인 (Forum - Public Choice Theory 구현)
└── user/              # 👤 사용자 관리 도메인 (Profile, Ranking 통합)

# 각 도메인 내부 구조:
├── domain/
│   ├── entities/           # Aggregate Roots with domain events
│   ├── value-objects/      # Immutable value types
│   ├── repositories/       # Interfaces only (impl in infrastructure)
│   ├── services/          # Domain services for complex business logic
│   └── events/            # Domain events for cross-context communication
├── application/
│   ├── use-cases/         # Business use cases
│   └── services/          # Application services
├── infrastructure/
│   └── repositories/      # MCP-based implementations
└── presentation/
    ├── components/        # React components
    └── hooks/            # Custom React hooks
```

### Domain Event Pattern (Critical)

Domain entities emit events for economic transactions:

```typescript
// In domain entity
this.addDomainEvent(new PmpSpentEvent(userId, amount, "prediction_stake"));

// Event is handled by Economy Event Handlers in infrastructure
// This maintains economic consistency across all domains
```

### Repository Pattern Implementation

- **Domain**: Interfaces only (`IPredictionGameRepository`)
- **Infrastructure**: MCP implementations (`McpSupabasePredictionGameRepository`)
- **Always use Result pattern**: `Result<T, E>` for error handling
- **MCP Tools**: Use `mcp_supabase_execute_sql()` and `mcp_supabase_apply_migration()`

## Key Integration Points

### Auth-Economy SDK

Central package providing:

- Authentication services (Supabase-based)
- Economic types (PMP/PMC, branded types)
- Domain events infrastructure
- Result pattern utilities

Import pattern:

```typescript
import { createAuthEconomyClient, isFailure } from "@posmul/auth-economy-sdk";
import type { UserId, PmpAmount } from "@posmul/auth-economy-sdk";
```

### Cross-Context Communication

Use Domain Events for all cross-context operations:

- Economic transactions (PMP/PMC)
- User state changes
- Investment completions
- Prediction settlements

### Database Operations (MCP-Only)

NEVER use Supabase CLI. Always use MCP tools:

```typescript
// Schema changes (DDL operations)
await mcp_supabase_apply_migration({
  project_id: "fabyagohqqnusmnwekuc",
  name: "create_user_tables",
  query: "CREATE TABLE...",
});

// Data operations (DML/queries)
await mcp_supabase_execute_sql({
  project_id: "fabyagohqqnusmnwekuc",
  query: "SELECT * FROM user_profiles WHERE id = $1",
});

// Generate types (after schema changes)
await mcp_supabase_generate_typescript_types({
  project_id: "fabyagohqqnusmnwekuc",
});

// Security check (after schema changes)
await mcp_supabase_get_advisors({
  project_id: "fabyagohqqnusmnwekuc",
  type: "security",
});
```

## Development Workflow

### Adding New Features

1. Identify affected Bounded Context(s)
2. Define Domain Events for economic integration
3. Implement in Domain → Application → Infrastructure → Presentation order
4. Use MCP tools for all database operations
5. Ensure economic transactions use event-driven approach

### Testing Strategy

- Browser testing via `http://localhost:3000/auth-test`
- Integration testing with real Supabase database
- Economic integrity verification through event handlers

### File Naming & TypeScript

- Use branded types: `UserId`, `PredictionId`, `PmpAmount`
- Windows paths: `apps\posmul-web\src\bounded-contexts\`
- Repository interfaces: `I[Entity]Repository`
- MCP implementations: `McpSupabase[Entity]Repository`

## Critical Don'ts

- ❌ Never use npm/yarn (pnpm only)
- ❌ Never use Supabase CLI (MCP tools only)
- ❌ Never use GitHub CLI (MCP tools only)
- ❌ Never bypass turbo for builds
- ❌ Never direct database writes for economy (use Domain Events)
- ❌ Never violate Clean Architecture dependency rules (Domain → Application → Infrastructure)
- ❌ Never use non-UTF-8-sig encoding for Korean files
- ❌ Never mix English/Korean in domain entity names
- ❌ Never use bash commands (PowerShell only on Windows)
- ❌ Never hardcode project IDs (use environment variables)
- ❌ Never bypass Result pattern for error handling

## Economic System Integration

Every domain MUST integrate with PMP/PMC economy:

- Read economic data directly from Shared Kernel
- Write economic changes through Domain Events
- Display economic balance in relevant UI components
- Run `mcp_supabase_get_advisors` after schema changes for security verification
