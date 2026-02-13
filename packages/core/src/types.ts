/**
 * Command interface for CLI operations
 */
export interface Command {
  name: string;
  description: string;
  options?: CommandOption[];
  action: (ctx: CommandContext) => Promise<CommandResult> | CommandResult;
}

export interface CommandOption {
  name: string;
  description: string;
  short?: string;
  required?: boolean;
  default?: string | boolean;
}

/**
 * Command execution context
 */
export interface CommandContext {
  args: string[];
  options: Record<string, string | boolean>;
  logger: Logger;
  config: Config;
}

/**
 * Command execution result
 */
export interface CommandResult {
  success: boolean;
  message?: string;
  data?: unknown;
  exitCode?: number;
}

/**
 * Logger interface
 */
export interface Logger {
  info(message: string): void;
  success(message: string): void;
  warn(message: string): void;
  error(message: string): void;
  debug(message: string): void;
}

/**
 * Config interface
 */
export interface Config {
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T): void;
  delete(key: string): void;
  has(key: string): boolean;
}