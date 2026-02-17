# Grandpa CLI

A modern CLI application with AI chat capabilities and chat history management, inspired by [OpenCode](https://github.com/anomalyco/opencode) architecture.

## 🚀 Features

- **Modern Architecture**: Monorepo structure with clear separation of concerns
- **TypeScript First**: Full type safety with strict TypeScript configuration
- **Bun Runtime**: Fast package management and execution
- **Turborepo**: Efficient monorepo build system
- **Command Pattern**: Clean command architecture with extensible design
- **Configuration Management**: Environment-aware config with Zod validation
- **Interactive CLI**: User-friendly prompts and spinners
- **AI Chat**: Integrated AI chat functionality with history management
- **Chat History**: View and manage chat history by date
- **Web Interface**: Modern React-based chat UI with hot reload
- **History Sidebar**: Browse and switch between chat sessions
- **Markdown Rendering**: Full GFM support with syntax highlighting
- **Plugin System**: Easy to extend with new commands
- **Testing Ready**: Built-in test configuration

## 📁 Project Structure

```
grandpa/
├── apps/
│   └── cli/              # CLI application entry point
├── packages/
│   ├── core/             # Core functionality (commands, logging, etc.)
│   ├── config/           # Configuration management
│   ├── ai/               # AI service and history management
│   ├── server/           # HTTP server with Vercel AI SDK
│   └── web/              # React web interface
├── turbo.json            # Turborepo configuration
├── bunfig.toml          # Bun configuration
├── tsconfig.json         # TypeScript configuration
└── eslint.config.js      # ESLint configuration
```

## 🛠️ Tech Stack

| Tool | Version | Purpose |
|------|---------|---------|
| **Bun** | Latest | Package manager & runtime |
| **TypeScript** | Latest | Type safety |
| **Turborepo** | Latest | Monorepo build system |
| **Commander** | Latest | CLI framework |
| **Inquirer** | Latest | Interactive prompts |
| **Zod** | Latest | Schema validation |
| **Chalk** | Latest | Terminal styling |
| **Ora** | Latest | Spinners & progress |
| **Hono** | Latest | HTTP server framework |
| **Vite** | Latest | Web frontend build tool |
| **React** | Latest | Web frontend framework |
| **Vercel AI SDK** | Latest | AI integration and streaming |
| **react-markdown** | Latest | Markdown rendering |

## 📦 Installation

### Prerequisites

- Node.js 20.0+ or Bun 1.1+
- Git

### Quick Start

```bash
# Clone the template
git clone <your-repo> my-cli-app
cd my-cli-app

# Install dependencies
bun install

# Start development
bun run dev

# Build the project
bun run build

# Run the CLI
bun run cli --help
```

## 🚀 Usage

### Available Commands

```bash
# Start interactive chat mode (default)
grandpa

# Send a message directly
grandpa "Hello, how are you?"

# Chat with AI
grandpa chat "What is TypeScript?"

# Initialize a new project
grandpa init

# Get version information
grandpa version

# Get version as JSON
grandpa version --json

# Get configuration value
grandpa config get cli.theme

# Set configuration value
grandpa config set cli.theme dark

# List all configuration
grandpa config list

# Reset configuration
grandpa config reset

# View chat history
grandpa history

# List all history dates
grandpa history --list

# View history for specific date
grandpa history --date 2026-01-20

# Output history as JSON
grandpa history --json

# Enable debug mode
grandpa --debug <command>

# Disable colors
grandpa --no-color <command>
```

### Global Installation

To install globally for system-wide access:

```bash
# Build the project
bun run build

# Link globally
cd apps/cli
bun link

# Add bun's bin directory to PATH (add to ~/.zshrc or ~/.bashrc)
export PATH="$HOME/.bun/bin:$PATH"

# Now you can use from anywhere
grandpa --help
grandpa history --list
```

## 🔧 Development

### Development Workflow

```bash
# Install dependencies
bun install

# Start CLI development mode (watch mode)
bun run dev

# Start server development mode
bun run dev:server

# Start web frontend development mode
bun run dev:web

# Start both server and web frontend concurrently (recommended)
bun run dev:all

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

### Adding New Commands

1. Create a new command file in `apps/cli/src/commands/`:

```typescript
// apps/cli/src/commands/my-command.ts
import type { Command, CommandContext, CommandResult } from "@grandpa/core";

export const myCommand: Command = {
  name: "my-command",
  description: "My new command description",
  options: [
    {
      name: "--option",
      description: "An option description",
      short: "-o",
      default: "default-value",
    },
  ],
  action: async (ctx: CommandContext): Promise<CommandResult> => {
    const { logger, options, args } = ctx;

    logger.info("Executing my command...");

    return {
      success: true,
      message: "Command completed successfully",
      data: { option: options.option },
    };
  },
};
```

2. Register the command in `apps/cli/src/index.ts`:

```typescript
import { myCommand } from "./commands/my-command.js";

// Register commands
runner.register(myCommand);

// Register with Commander.js
program
  .command("my-command")
  .description(myCommand.description)
  .action(async () => {
    const result = await runner.execute("my-command", [], {}, config);
    process.exit(result.exitCode || 0);
  });
```

3. Rebuild and link for global usage:
```bash
bun run build
cd apps/cli
bun link
```

### Configuration Schema

The configuration uses Zod for schema validation. Update `packages/config/src/schema.ts` to add new configuration options:

```typescript
export const configSchema = z.object({
  // ... existing config
  myFeature: z.object({
    enabled: z.boolean().default(false),
    option: z.string().default("value"),
  }),
});
```

## 🏗️ Architecture

### Command Pattern

The template uses a clean command pattern:

- **Command**: Interface defining command structure
- **CommandRunner**: Executes commands with context
- **CommandContext**: Provides logger, config, and options to commands
- **CommandResult**: Standardized return type

### Configuration Management

- **Environment Variables**: Loaded via dotenv
- **User Config**: Stored in user's config directory
- **Schema Validation**: Zod validates all configuration
- **Type Safety**: Full TypeScript support

### Logging System

- **Levels**: DEBUG, INFO, SUCCESS, WARN, ERROR
- **Colors**: Chalk for terminal styling
- **Spinners**: Ora for progress indication

## 📝 Configuration

### Environment Variables

Create a `.env` file in the root:

```env
API_BASE_URL=https://api.example.com
API_TIMEOUT=30000
DEBUG=true
```

### User Configuration

Configuration is stored in:
- macOS: `~/Library/Application Support/grandpa-cli/config.json`
- Linux: `~/.config/grandpa-cli/config.json`
- Windows: `%APPDATA%\grandpa-cli\config.json`

## 🧪 Testing

```bash
# Run all tests
bun run test

# Run tests in watch mode
bun test --watch

# Run specific test file
bun test path/to/test.ts
```

## 📦 Publishing

```bash
# Build for production
bun run build

# Publish to npm
cd apps/cli
npm publish
```

## 🗄️ Chat History

Chat history is automatically saved when using interactive mode or chat commands. History files are stored in:

- macOS: `~/Library/Application Support/grandpa-cli/history/`
- Linux: `~/.config/grandpa-cli/history/`
- Windows: `%APPDATA%\grandpa-cli\history\`

### Managing History

```bash
# View today's chat history
grandpa history

# List all available history dates
grandpa history --list

# View history for specific date
grandpa history --date 2026-01-20

# Output history as JSON
grandpa history --json

# Clear history for specific date
grandpa history --clear 2026-01-20
```

## 🔧 Customization

### Theme Support

The template includes theme configuration. Extend in `packages/config/src/schema.ts`:

```typescript
cli: z.object({
  theme: z.enum(["light", "dark", "auto", "custom"]).default("auto"),
  // ... other theme options
}),
```

### Feature Flags

Enable experimental features:

```bash
bun run cli config set features.experimental true
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

MIT License - feel free to use this template for your projects.

## 🙏 Credits

Inspired by [OpenCode](https://github.com/anomalyco/opencode) - A powerful AI-powered coding assistant.

## 🐛 Troubleshooting

### Common Issues

**Command not found after installation:**
```bash
# Ensure the CLI is built
bun run build

# Re-link globally
cd apps/cli && bun link

# Add bun's bin directory to PATH
export PATH="$HOME/.bun/bin:$PATH"
```

**TypeScript errors:**
```bash
# Clean and reinstall
bun run clean
bun install
```

**Configuration issues:**
```bash
# Reset configuration
grandpa config reset
```

**History not found:**
```bash
# List available history dates
grandpa history --list

# Check history directory
ls ~/Library/Application Support/grandpa-cli/history/
```

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Check the [OpenCode documentation](https://github.com/anomalyco/opencode)

---

**Built with ❤️ using the OpenCode architecture pattern**