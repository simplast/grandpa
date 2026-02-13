import { Command } from "commander";
import chalk from "chalk";
import { CommandRunner, Logger, LogLevel } from "@grandpa/core";
import { ConfigManager } from "@grandpa/config";
import { initCommand } from "./commands/init.js";
import { versionCommand } from "./commands/version.js";
import { configCommand } from "./commands/config.js";
import { chatCommand } from "./commands/chat.js";
import { historyCommand } from "./commands/history.js";

const program = new Command();
const logger = new Logger(LogLevel.INFO);
const config = ConfigManager.getInstance();
const runner = new CommandRunner(logger);

// Register commands
runner.register(initCommand);
runner.register(versionCommand);
runner.register(configCommand);
runner.register(chatCommand);
runner.register(historyCommand);

// Register commands with Commander.js
program
  .command("init")
  .description(initCommand.description)
  .action(async () => {
    const result = await runner.execute("init", [], {}, config);
    process.exit(result.exitCode || 0);
  });

program
  .command("version")
  .description(versionCommand.description)
  .option("-j, --json", "Output as JSON")
  .action(async (options) => {
    const result = await runner.execute("version", [], options, config);
    process.exit(result.exitCode || 0);
  });

program
  .command("config")
  .description(configCommand.description)
  .argument("[action]", "Config action: get, set, list, reset")
  .argument("[key]", "Config key")
  .argument("[value]", "Config value")
  .action(async (action, key, value, options) => {
    const args = [action, key, value].filter(Boolean);
    const result = await runner.execute("config", args, options, config);
    process.exit(result.exitCode || 0);
  });

program
  .command("chat")
  .description(chatCommand.description)
  .argument("[message]", "Message to send")
  .option("-s, --stream", "Stream response")
  .action(async (message, options) => {
    const args = message ? [message] : [];
    const result = await runner.execute("chat", args, options, config);
    process.exit(result.exitCode || 0);
  });

program
  .command("history")
  .description(historyCommand.description)
  .option("-d, --date <date>", "View history for specific date (YYYY-MM-DD)")
  .option("-l, --list", "List all available history dates")
  .option("-c, --clear <date>", "Clear history for specific date")
  .option("-a, --clean-all", "Clear ALL chat history (irreversible)")
  .option("-j, --json", "Output as JSON")
  .action(async (options) => {
    const result = await runner.execute("history", [], options, config);
    process.exit(result.exitCode || 0);
  });

// CLI setup
program
  .name("grandpa")
  .description("Modern CLI application template inspired by OpenCode")
  .version("0.1.0", "-v, --version", "Display version information")
  .option("-d, --debug", "Enable debug mode", false)
  .option("--no-color", "Disable colored output", false);

// Global options handler
program.on("option:debug", () => {
  logger.setLevel(LogLevel.DEBUG);
  logger.debug("Debug mode enabled");
});

program.on("option:no-color", () => {
  chalk.level = 0;
});

// Custom help
program.addHelpText("after", `
${chalk.blue("Examples:")}
  $ grandpa                    Start interactive chat
  $ grandpa init               Initialize project
  $ grandpa version            Show version
  $ grandpa config get ai.apiKey
  $ grandpa config set ai.apiKey sk-...
`);

// Add default command for interactive mode
program
  .argument("[message]", "Optional message to send")
  .description("Start interactive chat mode (default)")
  .action(async (message) => {
    if (message) {
      // If message provided, use chat command
      const result = await runner.execute("chat", [message], {}, config);
      process.exit(result.exitCode || 0);
    } else {
      // Start interactive mode
      const { startInteractiveMode } = await import("./interactive/index.js");
      await startInteractiveMode();
    }
  });

// Parse command line arguments
program.parse(process.argv);
