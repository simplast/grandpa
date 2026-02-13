# Grandpa CLI - Agent 上下文指南

本文件为 iFlow CLI Agent 提供项目上下文信息，帮助理解项目结构、开发流程和最佳实践。

## 项目概述

**Grandpa CLI** 是一个现代化的命令行应用程序，具有 AI 聊天功能和聊天记录管理，灵感来源于 [OpenCode](https://github.com/anomalyco/opencode) 架构。项目现在还包含一个 Web 聊天界面，支持热重载。

### 核心特性

- **现代架构**: Monorepo 结构，职责清晰分离
- **TypeScript 优先**: 完整的类型安全，严格的 TypeScript 配置
- **Bun 运行时**: 快速的包管理和执行
- **Turborepo**: 高效的 Monorepo 构建系统
- **命令模式**: 可扩展的清晰命令架构
- **配置管理**: 使用 Zod 验证的环境感知配置
- **交互式 CLI**: 用户友好的提示和加载动画
- **AI 聊天**: 集成 AI 聊天功能，支持历史记录管理
- **HTTP 服务器**: 可选的 HTTP 服务器，支持 SSE 流式响应
- **Web 界面**: 基于 Vite + React 的聊天界面，支持热重载
- **Vercel AI SDK**: 集成最新 Vercel AI SDK，支持流式响应

## 技术栈

| 工具 | 用途 |
|------|------|
| **Bun** | 包管理器和运行时 |
| **TypeScript** | 类型安全 |
| **Turborepo** | Monorepo 构建系统 |
| **Commander** | CLI 框架 |
| **Inquirer** | 交互式提示 |
| **Zod** | 模式验证 |
| **Chalk** | 终端样式 |
| **Ora** | 加载动画和进度 |
| **Hono** | HTTP 服务器框架 |
| **Vite** | Web 前端构建工具 |
| **React** | Web 前端框架 |
| **Vercel AI SDK** | AI 集成和流式响应 |
| **@ai-sdk/openai** | OpenAI 兼容 API 提供商 |
| **@ai-sdk/react** | React AI 集成 |

## 项目结构

```
grandpa/
├── apps/
│   └── cli/                    # CLI 应用程序入口
│       ├── src/
│       │   ├── commands/       # 命令实现
│       │   │   ├── chat.ts     # AI 聊天命令
│       │   │   ├── config.ts   # 配置管理命令
│       │   │   ├── history.ts  # 历史记录命令
│       │   │   ├── init.ts     # 初始化命令
│       │   │   └── version.ts  # 版本命令
│       │   ├── interactive/    # 交互式模式
│       │   │   ├── index.ts    # 交互式模式入口
│       │   │   └── input.ts    # 输入处理
│       │   ├── services/       # 服务层
│       │   │   └── http-client.ts  # HTTP 客户端
│       │   ├── __tests__/      # 测试文件
│       │   └── index.ts        # CLI 入口
│       ├── package.json
│       ├── tsconfig.json
│       └── tsup.config.ts      # 构建配置
├── packages/
│   ├── core/                   # 核心功能
│   │   └── src/
│   │       ├── index.ts        # 导出
│   │       ├── logger.ts       # 日志系统
│   │       ├── runner.ts       # 命令执行器
│   │       ├── spinner.ts      # 加载动画
│   │       └── types.ts        # 类型定义
│   ├── config/                 # 配置管理
│   │   └── src/
│   │       ├── index.ts        # 导出
│   │       ├── manager.ts      # 配置管理器
│   │       └── schema.ts       # Zod 验证模式
│   ├── ai/                     # AI 服务和历史管理
│   │   └── src/
│   │       ├── index.ts        # 导出
│   │       ├── ai-service.ts   # AI 服务
│   │       ├── history-manager.ts  # 历史记录管理
│   │       └── types.ts        # 类型定义
│   └── server/                 # HTTP 服务器
│       └── src/
│           ├── index.ts        # 导出
│           ├── cli.ts          # 服务器 CLI 入口
│           ├── server.ts       # 服务器主类
│           ├── router.ts       # 路由定义
│           ├── session.ts      # 会话处理
│           ├── llm.ts          # LLM 交互
│           ├── provider.ts     # 提供商配置
│           ├── types.ts        # 类型定义
│           └── routes/         # 路由目录
└── web/                        # Web 聊天界面
    ├── src/
    │   ├── App.tsx            # 主应用组件
    │   ├── App.css            # 样式文件
    │   ├── main.tsx           # 入口文件
    │   └── index.css          # 全局样式
    ├── package.json
    ├── vite.config.ts         # Vite 配置
    └── tsconfig.json
├── turbo.json                  # Turborepo 配置
├── bunfig.toml                 # Bun 配置
├── tsconfig.json               # TypeScript 配置
└── eslint.config.js            # ESLint 配置
```

## 常用开发命令

### 核心开发工作流

```bash
# 首次安装依赖
bun install

# 启动 CLI 开发模式（热重载）
bun run dev

# 启动服务器开发模式（默认端口 3478）
bun run dev:server

# 启动 Web 前端开发模式（默认端口 3000）
bun run dev:web

# 在指定端口启动服务器
bun run dev:server:port          # 端口 3478
bun run --cwd packages/server dev:8080    # 端口 8080

# 构建所有包（生产环境）
bun run build

# 运行测试
bun run test

# 代码检查
bun run lint

# 类型检查
bun run typecheck

# 格式化代码
bun run format

# 清理构建产物
bun run clean
```

### 包特定开发

```bash
# 开发特定包（监视模式）
bun run --cwd packages/core dev
bun run --cwd packages/config dev
bun run --cwd packages/server dev
bun run --cwd packages/ai dev

# 直接运行 CLI 命令
bun run cli --help
bun run cli init
bun run cli version
bun run cli config list
bun run cli history --list

# 构建并链接到全局使用
bun run build
cd apps/cli
bun link
# 添加到 PATH: export PATH="$HOME/.bun/bin:$PATH"
grandpa --help
```

### 测试各个组件

```bash
# 测试特定测试文件
bun test apps/cli/src/__tests__/version.test.ts

# 以监视模式运行测试
bun test --watch

# 测试服务器端点（启动服务器后）
curl http://localhost:3478/health
```

## 架构设计

### 1. 命令模式（CLI）

- **CommandRunner** (`packages/core/src/runner.ts`) - 执行命令
- **Command Interface** (`packages/core/src/types.ts`) - 标准化所有命令
- **CommandContext** 提供: logger、config、options、args 给每个命令
- **CommandResult** 标准化返回值

**流程**: CLI 入口 → CommandRunner → Command → Context → Result

### 2. 服务模式（Server）

- **GrandpaServer** (`packages/server/src/server.ts`) - 使用 Hono 的 HTTP 服务器
- **SessionPrompt** (`packages/server/src/session.ts`) - 处理基于会话的提示和消息保存
- **SessionLLM** (`packages/server/src/llm.ts`) - LLM 交互生成响应
- **HistoryManager** (`packages/ai/src/history-manager.ts`) - 消息持久化
- **后台处理队列** - 异步 AI 响应处理

**流程**: HTTP 请求 → GrandpaServer → SessionPrompt → SessionLLM → HistoryManager → 响应

**消息保存流程**:
- 用户消息由 `SessionPrompt.prompt()` 在调用 LLM 之前保存
- AI 响应在 LLM 完成后由 `SessionPrompt.prompt()` 保存
- 每次交互用户和助手消息各保存一次

### 3. 单例模式（Config）

- **ConfigManager** (`packages/config/src/manager.ts`) - 应用中的单例
- **Zod 模式验证** (`packages/config/src/schema.ts`) - 类型安全配置
- **环境感知** - 从用户配置目录 + 环境变量 + 默认值加载

### 4. 直接 TypeScript 导入（开发）

- **开发无需构建步骤** - 包直接导出 `.ts` 文件
- **package.json 中的 exports 字段**: `"./*": "./src/*.ts"`
- **TypeScript 路径映射** 支持开发中的 `@grandpa/*` 导入
- **生产环境**: 构建时使用 `dist/` 输出

## 数据流架构

### CLI 执行流程

```
用户输入 → Commander.js → CommandRunner → Command Action → 结果输出
     ↓           ↓              ↓              ↓              ↓
  参数/选项    解析命令      使用上下文     处理逻辑       返回给用户
                           执行命令       和副作用
```

### 服务器请求流程

```
HTTP 请求 → Hono 路由 → SessionPrompt → SessionLLM → HistoryManager → 响应
     ↓            ↓           ↓            ↓            ↓              ↓
  POST/GET    路由匹配     处理请求      生成响应      保存历史记录   JSON 响应
  /chat       /status      /health

消息保存（每次交互）:
  SessionPrompt.prompt() → 保存用户消息 → 调用 LLM → 保存 AI 响应
```

### 配置流程

```
环境变量 → 用户配置文件 → 默认值 → Zod 验证 → ConfigManager
  ↓           ↓            ↓         ↓              ↓
API_KEY   config.json   theme=auto  模式检查      单例实例
```

## 组件依赖关系

```
apps/cli/
├── @grandpa/core (workspace)
│   ├── CommandRunner
│   ├── Logger
│   ├── Spinner
│   └── Types
├── @grandpa/config (workspace)
│   └── ConfigManager
└── Commander.js (外部)

packages/server/
├── @grandpa/ai (workspace)
│   └── HistoryManager
├── @grandpa/config (workspace)
├── SessionPrompt (内部)
│   └── SessionLLM (内部)
├── Hono (外部)
└── @hono/node-server (外部)

packages/ai/
├── @grandpa/config (workspace)
└── OpenAI SDK (外部)
```

## 重要开发模式

### 1. 监视模式开发

- **CLI**: `bun run dev` 使用 `bun --watch run --cwd apps/cli src/index.ts`
- **服务器**: `bun run dev:server` 使用 `bun --watch run --cwd packages/server src/cli.ts`
- **热重载**: 文件更改时自动重启
- **无需手动重建**: 子包直接作为 `.ts` 文件导入

### 2. TypeScript 路径映射

```typescript
// 开发中，这些解析为源文件:
import { CommandRunner } from "@grandpa/core"; // → packages/core/src/index.ts
import { ConfigManager } from "@grandpa/config"; // → packages/config/src/index.ts
import { GrandpaServer } from "@grandpa/server"; // → packages/server/src/index.ts
import { AIService } from "@grandpa/ai"; // → packages/ai/src/index.ts
```

**配置**:
- 根目录 `tsconfig.json`: 定义 `@grandpa/*` 路径
- 包 `tsconfig.json`: 扩展根配置，添加包特定路径
- 包 `package.json`: `exports` 字段映射到源文件

### 3. 配置层次结构

配置值按以下顺序解析（从高到低优先级）:

1. **命令行参数** (例如 `--port=8080`)
2. **环境变量** (例如 `OPENAI_API_KEY=sk-...`)
3. **用户配置文件** (`~/Library/Application Support/grandpa-cli/config.json`)
4. **默认值** (定义在 `packages/config/src/schema.ts`)

### 4. 服务器架构详情

- **端口**: 默认 3478，可通过 `--port=` 参数配置
- **端点**:
  - `POST /chat` - 发送消息，流式响应（使用 Vercel AI SDK）
  - `POST /session/:sessionID/message` - 流式响应（旧版端点）
  - `POST /session/:sessionID/message/non-stream` - 非流式响应（旧版端点）
  - `GET /session/:sessionID/history` - 获取会话历史
  - `GET /status/:date` - 检查处理状态（旧版端点）
  - `GET /health` - 健康检查
  - `DELETE /session/:sessionID` - 清除会话
- **AI 集成**: 使用 Vercel AI SDK 的 `streamText` 和 `createOpenAI`
- **OpenAI 兼容**: 支持小米 MiMo API 等兼容 OpenAI 格式的提供商
- **流式响应**: 使用 `toUIMessageStreamResponse()` 返回 UI 消息流
- **后台处理**: 使用 `processingQueue` Map 跟踪异步 AI 响应（旧版端点）
- **历史记录**: 消息按日期保存到 `~/.config/grandpa-cli/history/` (YYYY-MM-DD)
- **消息保存**: 每条消息（用户 + AI 响应）由 `SessionPrompt.prompt()` 保存一次

### 5. CLI 架构详情

- **入口**: `apps/cli/src/index.ts` - 解析参数，注册命令
- **默认行为**: 如果没有提供命令，启动交互模式（需要 stdin）
- **命令**: `init`, `version`, `config`, `chat`, `history` 等
- **交互模式**: 使用 `process.stdin.setRawMode()` - 可能在某些环境中失败
  - **输入处理**: 输入消息，按 Enter 继续；在空行按 Enter 发送
  - **时间戳显示**: 显示带毫秒的时间 (例如 `12:36:00.123`)
- **历史管理**: `history` 命令按日期查看 `~/.config/grandpa-cli/history/` 的聊天记录
  - **时间戳格式**: 显示带毫秒的精确时间

### 6. 包开发与生产

- **开发**: 直接 `.ts` 导入，无需构建，监视模式
- **生产**: 使用 `tsup` 构建，输出到 `dist/`，使用编译后的 `.js` 文件
- **发布**: `bun run build` 然后 `npm publish`（针对包）

## 配置文件

### 根目录配置

- `bunfig.toml` - Bun 包管理器设置
- `tsconfig.json` - TypeScript 配置，带路径映射
- `turbo.json` - 构建管道配置
- `eslint.config.js` - 检查规则

### 核心包

- `packages/core/src/runner.ts` - 命令执行引擎
- `packages/core/src/logger.ts` - 结构化日志 (DEBUG/INFO/SUCCESS/WARN/ERROR)
- `packages/config/src/manager.ts` - 带环境支持的单例配置
- `packages/config/src/schema.ts` - Zod 验证模式

### CLI

- `apps/cli/src/index.ts` - CLI 入口，命令注册
- `apps/cli/src/commands/` - 独立命令实现
  - `init.ts` - 初始化项目配置
  - `version.ts` - 显示版本信息
  - `config.ts` - 管理配置设置
  - `chat.ts` - 与 AI 聊天
  - `history.ts` - 查看和管理聊天历史
- `apps/cli/src/interactive/` - 交互模式
- `apps/cli/tsup.config.ts` - 构建配置，带 shebang 用于全局使用

### 服务器

- `packages/server/src/cli.ts` - 服务器直接执行入口
- `packages/server/src/server.ts` - Hono 服务器和路由
- `packages/server/src/router.ts` - 路由定义和请求处理
- `packages/server/src/session.ts` - SessionPrompt 类，处理提示和消息保存
- `packages/server/src/llm.ts` - SessionLLM 类，LLM 交互
- `packages/ai/src/history-manager.ts` - 消息持久化

## 配置模式

```typescript
// packages/config/src/schema.ts
export const configSchema = z.object({
  // CLI 配置
  cli: z.object({
    theme: z.enum(["light", "dark", "auto"]).default("auto"),
    verbose: z.boolean().default(false),
    color: z.boolean().default(true),
  }).default({}),

  // AI 配置
  ai: z.object({
    provider: z.enum(["openai", "custom"]).default("custom"),
    model: z.string().default("gpt-4"),
    baseUrl: z.string().url().default("https://api.xiaomimimo.com/v1"),
    apiKey: z.string().default("sk-..."),
    temperature: z.number().min(0).max(2).default(0.7),
    maxTokens: z.number().positive().default(1000),
  }).default({}),

  // 服务器配置
  server: z.object({
    port: z.number().default(3478),
  }).default({}),

  // API 配置（旧版）
  api: z.object({
    baseUrl: z.string().url().default("https://api.example.com"),
    timeout: z.number().positive().default(30000),
    retries: z.number().nonnegative().default(3),
  }).default({}),

  // 用户偏好
  user: z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
    preferences: z.record(z.unknown()).default({}),
  }).default({}),

  // 功能标志
  features: z.object({
    experimental: z.boolean().default(false),
    beta: z.boolean().default(false),
  }).default({}),
});
```

## 常用开发场景

### 添加新命令

1. 在 `apps/cli/src/commands/my-command.ts` 创建文件
2. 实现 `@grandpa/core` 的 `Command` 接口
3. 在 `apps/cli/src/index.ts` 导入并注册（runner 和 Commander.js）
4. 使用 `bun run cli my-command` 测试
5. 使用 `bun run build` 和 `bun link` 重建并链接到全局

### 查看聊天记录

```bash
# 列出所有可用历史日期
grandpa history --list

# 查看特定日期的历史
grandpa history --date 2026-01-20

# 查看今天的历史
grandpa history

# 以 JSON 输出
grandpa history --json

# 清除特定日期的历史
grandpa history --clear 2026-01-20
```

### 修改服务器端点

1. 编辑 `packages/server/src/router.ts` 添加/修改路由
2. 如需更新 `packages/server/src/session.ts` 中的 `SessionPrompt`
3. 使用 `bun run dev:server` 重启服务器
4. 使用 curl 或浏览器测试

### 添加新服务器路由

1. 在 `packages/server/src/router.ts` 添加路由处理程序
2. 使用 `historyManager.appendMessage()` 保存消息
3. 对于 AI 响应，使用处理消息保存的 `SessionPrompt.prompt()`
4. 返回适当的 JSON 响应

### 更新配置模式

1. 编辑 `packages/config/src/schema.ts`
2. 添加新的 Zod 验证规则
3. 如需更新 ConfigManager
4. 运行 `bun run typecheck` 验证

## 调试

- **CLI**: 使用 `bun run cli --debug <command>` 获取详细日志
- **服务器**: 检查控制台的请求日志
- **两者**: 添加 `console.log()` 语句，监视模式将自动重启

## 重要注意事项

### 当前限制

1. **交互模式** 可能由于某些环境中的 `process.stdin.setRawMode` 问题而失败
2. **配置优先级** - 默认值覆盖持久化配置（潜在 bug）
3. **服务器依赖** - 需要 AI 服务和配置正确初始化
4. **双语项目** - 部分服务器代码有中文注释
5. **旧版端点** - `/chat` 端点使用后台处理队列，可能存在竞态条件

### 生产考虑

- **CLI**: 使用 `bun run build` 构建，二进制文件在 `apps/cli/dist/index.js`
- **服务器**: 可以直接使用 `bun packages/server/src/cli.ts` 运行或构建
- **环境**: 需要 `OPENAI_API_KEY` 或类似密钥用于 AI 功能

### 测试策略

- 单元测试在 `apps/cli/src/__tests__/`
- 集成测试需要同时运行 CLI 和服务器
- 使用实际命令和 API 调用进行手动测试

## 快速开始清单

1. ✅ 安装 Bun: `curl -fsSL https://bun.sh/install | bash`
2. ✅ 安装依赖: `bun install`
3. ✅ 测试 CLI: `bun run cli --help`
4. ✅ 启动 CLI 开发: `bun run dev`
5. ✅ 启动服务器开发: `bun run dev:server`
6. ✅ 启动 Web 前端: `bun run dev:web`
7. ✅ 阅读 `CLAUDE.md` 获取详细命令
8. ✅ 阅读 `README.md` 获取面向用户的文档

## 文件路径参考

- **CLI 入口**: `/Users/jack/code/aiproject/grandpa/apps/cli/src/index.ts`
- **CLI 命令**: `/Users/jack/code/aiproject/grandpa/apps/cli/src/commands/`
- **核心类型**: `/Users/jack/code/aiproject/grandpa/packages/core/src/types.ts`
- **配置模式**: `/Users/jack/code/aiproject/grandpa/packages/config/src/schema.ts`
- **配置管理器**: `/Users/jack/code/aiproject/grandpa/packages/config/src/manager.ts`
- **服务器主类**: `/Users/jack/code/aiproject/grandpa/packages/server/src/server.ts`
- **服务器路由**: `/Users/jack/code/aiproject/grandpa/packages/server/src/router.ts`
- **历史管理**: `/Users/jack/code/aiproject/grandpa/packages/ai/src/history-manager.ts`
- **Web 入口**: `/Users/jack/code/aiproject/grandpa/packages/web/src/App.tsx`
- **根配置**: `/Users/jack/code/aiproject/grandpa/package.json`
- **TS 配置**: `/Users/jack/code/aiproject/grandpa/tsconfig.json`
- **Turbo 配置**: `/Users/jack/code/aiproject/grandpa/turbo.json`
