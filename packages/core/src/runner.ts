import type { Command, CommandContext, CommandResult } from "./types.js";
import { Logger } from "./logger.js";

export class CommandRunner {
  private commands: Map<string, Command> = new Map();
  private logger: Logger;

  constructor(logger?: Logger) {
    this.logger = logger || new Logger();
  }

  register(command: Command): void {
    this.commands.set(command.name, command);
    this.logger.debug(`Registered command: ${command.name}`);
  }

  async execute(
    commandName: string,
    args: string[],
    options: Record<string, string | boolean>,
    config: any
  ): Promise<CommandResult> {
    const command = this.commands.get(commandName);

    if (!command) {
      return {
        success: false,
        message: `Unknown command: ${commandName}`,
        exitCode: 1,
      };
    }

    const context: CommandContext = {
      args,
      options,
      logger: this.logger,
      config,
    };

    try {
      const result = await command.action(context);
      return result;
    } catch (error) {
      this.logger.error(`Error executing command ${commandName}: ${error}`);
      return {
        success: false,
        message: `Command failed: ${error}`,
        exitCode: 1,
      };
    }
  }

  listCommands(): Command[] {
    return Array.from(this.commands.values());
  }
}