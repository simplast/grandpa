# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Grandpa is a modern CLI application with an optional HTTP server, inspired by OpenCode architecture. It's a monorepo built with Bun, TypeScript, and Turborepo, featuring a clean separation between CLI and server components.

## Common Development Commands

### Core Development Workflow

```bash
# Install dependencies (first time)
bun install

# Start CLI in watch mode (hot reload)
bun run dev

# Start server in watch mode (default port 3478)
bun run dev:server

# Start server on specific port
bun run dev:server:port          # Port 3478
bun run --cwd packages/server dev:8080    # Port 8080
bun run --cwd packages/server dev:9000    # Port 9000

# Build all packages (for production)
bun run build

# Run tests
bun run test

# Lint code
bun run lint

# Type checking
bun run typecheck

# Format code
bun run format

# Clean build artifacts
bun run clean
```

### Package-Specific Development

```bash
# Develop specific package (watch mode)
bun run --cwd packages/core dev
bun run --cwd packages/config dev
bun run --cwd packages/server dev
bun run --cwd packages/ai dev

# Run CLI commands directly
bun run cli --help
bun run cli init
bun run cli version
bun run cli config list
bun run cli history --list

# Build and link for global usage
bun run build
cd apps/cli
bun link
# Add to PATH: export PATH="$HOME/.bun/bin:$PATH"
grandpa --help
```

### Testing Individual Components

```bash
# Test specific test file
bun test apps/cli/src/__tests__/version.test.ts

# Run tests in watch mode
bun test --watch

# Test server endpoints (after starting server)
curl http://localhost:3478/health
```

## High-Level Architecture

### Monorepo Structure

```
grandpa/
├── packages/                    # Shared packages (workspace)
│   ├── core/                   # Command runner, logger, spinner, types
│   ├── config/                 # Config management with Zod validation
│   ├── ai/                     # AI service and history management
│   └── server/                 # HTTP server (Hono) with SSE support
├── apps/
│   └── cli/                    # CLI application entry point
└── Configuration files
```

### Key Architectural Patterns

#### 1. **Command Pattern (CLI)**

- **CommandRunner** in `packages/core/src/runner.ts` - Executes commands with context
- **Command Interface** in `packages/core/src/types.ts` - Standardizes all commands
- **CommandContext** provides: logger, config, options, args to each command
- **CommandResult** standardizes return values with success/message/data/exitCode

**Flow**: CLI entry → CommandRunner → Command → Context → Result

#### 2. **Service Pattern (Server)**

- **GrandpaServer** in `packages/server/src/server.ts` - HTTP server using Hono
- **SessionPrompt** in `packages/server/src/session.ts` - Handles session-based prompts and message saving
- **SessionLLM** in `packages/server/src/llm.ts` - LLM interaction for generating responses
- **HistoryManager** in `packages/ai/src/history-manager.ts` - Message persistence
- **Background Processing Queue** - Async AI response handling with status tracking

**Flow**: HTTP Request → GrandpaServer → SessionPrompt → SessionLLM → HistoryManager → Response

**Message Saving Flow**:
- User message saved by `SessionPrompt.prompt()` before calling LLM
- AI response saved by `SessionPrompt.prompt()` after LLM completes
- Both user and assistant messages are saved once per interaction

#### 3. **Singleton Pattern (Config)**

- **ConfigManager** in `packages/config/src/manager.ts` - Single instance across app
- **Zod Schema Validation** in `packages/config/src/schema.ts` - Type-safe config
- **Environment-aware** - Loads from user config dir + env variables + defaults

#### 4. **Direct TypeScript Imports (Development)**

- **No build step required** for development - packages export `.ts` files directly
- **exports field** in package.json: `"./*": "./src/*.ts"`
- **TypeScript path mapping** enables `@grandpa/*` imports in development
- **Production**: Uses `dist/` output when built

### Data Flow Architecture

#### CLI Execution Flow

```
User Input → Commander.js → CommandRunner → Command Action → Result Output
     ↓           ↓              ↓              ↓              ↓
  args/options  Parse       Execute with   Process logic   Return to
                command     context        & side effects  user
```

#### Server Request Flow

```
HTTP Request → Hono Router → SessionPrompt → SessionLLM → HistoryManager → Response
     ↓            ↓             ↓              ↓           ↓              ↓
  POST/GET    Route match   Process request  Generate   Save history   JSON response
  /chat       /status       /health          response   & messages

Message Saving (per interaction):
  SessionPrompt.prompt() → Save user message → Call LLM → Save AI response
```

#### Configuration Flow

```
Env Vars → User Config File → Defaults → Zod Validation → ConfigManager
  ↓           ↓               ↓         ↓                 ↓
API_KEY   config.json     theme=auto  Schema check    Singleton instance
```

### Component Dependencies

```
apps/cli/
├── @grandpa/core (workspace)
│   ├── CommandRunner
│   ├── Logger
│   ├── Spinner
│   └── Types
├── @grandpa/config (workspace)
│   └── ConfigManager
└── Commander.js (external)

packages/server/
├── @grandpa/ai (workspace)
│   └── HistoryManager
├── @grandpa/config (workspace)
├── SessionPrompt (internal)
│   └── SessionLLM (internal)
├── Hono (external)
└── @hono/node-server (external)

packages/ai/
├── @grandpa/config (workspace)
└── OpenAI SDK (external)
```

## Important Development Patterns

### 1. **Watch-Mode Development**

- **CLI**: `bun run dev` uses `bun --watch run --cwd apps/cli src/index.ts`
- **Server**: `bun run dev:server` uses `bun --watch run --cwd packages/server src/cli.ts`
- **Hot reload**: Both automatically restart on file changes
- **No manual rebuild**: Subpackages are imported as `.ts` files directly

### 2. **TypeScript Path Mapping**

```typescript
// In development, these resolve to source files:
import { CommandRunner } from "@grandpa/core"; // → packages/core/src/index.ts
import { ConfigManager } from "@grandpa/config"; // → packages/config/src/index.ts
import { GrandpaServer } from "@grandpa/server"; // → packages/server/src/index.ts
import { AIService } from "@grandpa/ai"; // → packages/ai/src/index.ts
```

**Configuration**:

- Root `tsconfig.json`: Defines `@grandpa/*` paths
- Package `tsconfig.json`: Extends root with package-specific paths
- Package `package.json`: `exports` field maps to source files

### 3. **Configuration Hierarchy**

Config values are resolved in this order (highest to lowest priority):

1. **Command line arguments** (e.g., `--port=8080`)
2. **Environment variables** (e.g., `OPENAI_API_KEY=sk-...`)
3. **User config file** (`~/Library/Application Support/grandpa-cli/config.json`)
4. **Default values** (defined in `packages/config/src/schema.ts`)

**Note**: Current implementation has a quirk where defaults override persisted config due to `getDefaults()` being called in ConfigManager constructor.

### 4. **Server Architecture Details**

- **Port**: Default 3478, configurable via `--port=` argument
- **Endpoints**:
  - `POST /chat` - Send message, returns immediately, processes async (legacy endpoint)
  - `POST /session/:sessionID/message` - Stream response (new endpoint)
  - `POST /session/:sessionID/message/non-stream` - Non-stream response (new endpoint)
  - `GET /session/:sessionID/history` - Get session history
  - `GET /status/:date` - Check processing status (legacy endpoint)
  - `GET /health` - Health check
  - `DELETE /session/:sessionID` - Clear session
- **Background Processing**: Uses `processingQueue` Map to track async AI responses (legacy endpoint)
- **History**: Messages saved to `~/.config/grandpa-cli/history/` by date (YYYY-MM-DD)
- **Message Saving**: Each message (user + AI response) is saved exactly once by `SessionPrompt.prompt()`

### 5. **CLI Architecture Details**

- **Entry Point**: `apps/cli/src/index.ts` - Parses args, registers commands
- **Default Behavior**: If no command provided, starts interactive mode (requires stdin)
- **Commands**: `init`, `version`, `config`, `chat`, `history` (and more)
- **Interactive Mode**: Uses `process.stdin.setRawMode()` - may fail in some environments
  - **Input handling**: Type message, press Enter to continue; press Enter on empty line to send
  - **Timestamp display**: Shows time with milliseconds (e.g., `12:36:00.123`)
- **History Management**: `history` command views chat history by date from `~/.config/grandpa-cli/history/`
  - **Timestamp format**: Displays time with milliseconds for precision

### 6. **Package Development vs Production**

- **Development**: Direct `.ts` imports, no build step, watch mode
- **Production**: Build with `tsup`, outputs to `dist/`, uses compiled `.js` files
- **Publishing**: `bun run build` then `npm publish` (for packages)

## Key Files to Understand

### Configuration

- `bunfig.toml` - Bun package manager settings
- `tsconfig.json` - TypeScript config with path mapping
- `turbo.json` - Build pipeline configuration
- `eslint.config.js` - Linting rules

### Core Packages

- `packages/core/src/runner.ts` - Command execution engine
- `packages/core/src/logger.ts` - Structured logging (DEBUG/INFO/SUCCESS/WARN/ERROR)
- `packages/config/src/manager.ts` - Config singleton with env support
- `packages/config/src/schema.ts` - Zod validation schema

### CLI

- `apps/cli/src/index.ts` - CLI entry point, command registration
- `apps/cli/src/commands/` - Individual command implementations
  - `init.ts` - Initialize project configuration
  - `version.ts` - Display version information
  - `config.ts` - Manage configuration settings
  - `chat.ts` - Chat with AI
  - `history.ts` - View and manage chat history
- `apps/cli/src/interactive/` - Interactive mode (may have issues)
- `apps/cli/tsup.config.ts` - Build configuration with shebang for global usage

### Server

- `packages/server/src/cli.ts` - Server entry point for direct execution
- `packages/server/src/server.ts` - Hono server with routes
- `packages/server/src/router.ts` - Route definitions and request handling
- `packages/server/src/session.ts` - SessionPrompt class for handling prompts and message saving
- `packages/server/src/llm.ts` - SessionLLM class for LLM interaction
- `packages/ai/src/history-manager.ts` - Message persistence

## Common Development Scenarios

### Adding a New Command

1. Create file in `apps/cli/src/commands/my-command.ts`
2. Implement `Command` interface from `@grandpa/core`
3. Import and register in `apps/cli/src/index.ts` (both runner and Commander.js)
4. Test with `bun run cli my-command`
5. Rebuild with `bun run build` and `bun link` for global usage

### Viewing Chat History

```bash
# List all available history dates
grandpa history --list

# View history for specific date
grandpa history --date 2026-01-20

# View today's history
grandpa history

# Output as JSON
grandpa history --json

# Clear history for specific date
grandpa history --clear 2026-01-20
```

### Modifying Server Endpoints

1. Edit `packages/server/src/router.ts` to add/modify routes
2. If needed, update `SessionPrompt` in `packages/server/src/session.ts`
3. Restart server with `bun run dev:server`
4. Test with curl or browser

### Adding New Server Routes

1. Add route handler in `packages/server/src/router.ts`
2. Use `historyManager.appendMessage()` to save messages
3. For AI responses, use `SessionPrompt.prompt()` which handles message saving
4. Return appropriate JSON response

### Updating Configuration Schema

1. Edit `packages/config/src/schema.ts`
2. Add new Zod validation rules
3. Update ConfigManager if needed
4. Run `bun run typecheck` to verify

### Debugging

- **CLI**: Use `bun run cli --debug <command>` for verbose logging
- **Server**: Check console output for request logs
- **Both**: Add `console.log()` statements, watch mode will restart automatically

## Important Notes

### Current Limitations

1. **Interactive mode** may fail due to `process.stdin.setRawMode` issues in some environments
2. **Config priority** - defaults override persisted config (potential bug)
3. **Server dependencies** - requires AI service and config to be properly initialized
4. **Chinese comments** - Some server code has Chinese comments (bilingual project)
5. **Legacy endpoint** - `/chat` endpoint uses background processing queue which may have race conditions

### Production Considerations

- **CLI**: Build with `bun run build`, binary at `apps/cli/dist/index.js`
- **Server**: Can be run directly with `bun packages/server/src/cli.ts` or built
- **Environment**: Requires `OPENAI_API_KEY` or similar for AI functionality

### Testing Strategy

- Unit tests in `apps/cli/src/__tests__/`
- Integration testing requires running both CLI and server
- Manual testing with actual commands and API calls

## Getting Started Checklist

1. ✅ Install Bun: `curl -fsSL https://bun.sh/install | bash`
2. ✅ Install dependencies: `bun install`
3. ✅ Test CLI: `bun run cli --help`
4. ✅ Start CLI dev: `bun run dev`
5. ✅ Start server dev: `bun run dev:server`
6. ✅ Read `DEV_COMMANDS.md` for detailed commands
7. ✅ Read `README.md` for user-facing documentation

