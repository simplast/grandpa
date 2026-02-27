# Grandpa CLI - Agent Development Guide

Development guide for AI agents working in this monorepo.

## Build/Lint/Test Commands

```bash
# Install dependencies
bun install

# Development (hot reload)
bun run dev              # CLI
bun run dev:server       # Server (port 3478)
bun run dev:web          # Web frontend (port 3000)
bun run dev:all          # Server + Web concurrently

# Build
bun run build            # Build all packages

# Lint & TypeCheck
bun run lint             # ESLint check
bun run typecheck        # TypeScript check

# Test
bun run test             # Run all tests via turbo
bun test <file>          # Run single test file
bun test --watch         # Watch mode

# Format
bun run format           # Prettier format all files
```

## Code Style Guidelines

### Imports

```typescript
// External packages first
import { Hono } from "hono";
import { streamText } from "ai";

// Internal workspace packages (use @grandpa/* alias)
import { CommandRunner } from "@grandpa/core";
import { ConfigManager } from "@grandpa/config";
import { HistoryManager } from "@grandpa/ai";

// Relative imports last (use .js extension for ESM)
import { versionCommand } from "./commands/version.js";
```

### Types & Naming

- **Strict TypeScript** enabled (`strict: true`, `noUncheckedIndexedAccess: true`)
- Avoid `any` - use `unknown` and type guards
- Files: kebab-case (`history-manager.ts`)
- Classes: PascalCase (`CommandRunner`)
- Functions: camelCase (`sendMessage`)
- No comments unless explicitly requested

### Error Handling

```typescript
// Command error pattern
try {
  const result = await operation();
  return { success: true, data: result };
} catch (error) {
  logger.error(`Operation failed: ${error}`);
  return { success: false, message: String(error), exitCode: 1 };
}

// API error pattern
router.post("/endpoint", async (c) => {
  try {
    return c.json({ success: true, data });
  } catch (error: any) {
    console.error("[Endpoint] Error:", error);
    return c.json({ error: error.message }, 500);
  }
});
```

## Project Structure

```
grandpa/
├── apps/cli/               # CLI entry point
│   └── src/
│       ├── commands/       # Command implementations
│       └── index.ts        # CLI registration
├── packages/
│   ├── core/               # CommandRunner, Logger, types
│   ├── config/             # ConfigManager, Zod schema
│   ├── ai/                 # HistoryManager, AI service
│   ├── server/             # Hono server, router, session
│   └── web/                # React chat UI (App.tsx, App.css)
├── turbo.json
├── tsconfig.json
└── eslint.config.js
```

## Architecture Patterns

### Command (CLI)

```typescript
export const myCommand: Command = {
  name: "my-command",
  description: "Does something",
  action: async (ctx: CommandContext): Promise<CommandResult> => {
    return { success: true, message: "Done" };
  },
};
```

### API Route (Server)

- Routes in `packages/server/src/router.ts`
- Use `historyManager.appendMessage()` to save messages
- Return `c.json({ success: true, ... })`

### Web UI

- React components in `packages/web/src/App.tsx`
- Styles in `packages/web/src/App.css` (dark/light themes)
- Theme state: `localStorage.getItem("grandpa-theme")`

## Server Endpoints

| Method | Endpoint               | Description                      |
| ------ | ---------------------- | -------------------------------- |
| POST   | `/chat`                | Send message, streaming response |
| GET    | `/sessions`            | List all chat sessions           |
| GET    | `/session/:id/history` | Get session messages             |
| POST   | `/silent/session`      | Create silent session            |
| POST   | `/silent/message`      | Save message (no LLM)            |
| POST   | `/silent/process`      | Batch process messages           |
| GET    | `/health`              | Health check                     |

## Key Files

- CLI: `apps/cli/src/index.ts`
- Commands: `apps/cli/src/commands/*.ts`
- Server: `packages/server/src/router.ts`
- Config: `packages/config/src/schema.ts`
- Web UI: `packages/web/src/App.tsx`

## Environment

- **Runtime**: Bun (ESM modules)
- **Config priority**: CLI args > env vars > config file > defaults
- **Data storage**: `~/.config/grandpa-cli/`
