import inquirer from "inquirer";
import chalk from "chalk";
import type { Command, CommandContext, CommandResult } from "@grandpa/core";

export const initCommand: Command = {
  name: "init",
  description: "Initialize a new project configuration",
  options: [
    {
      name: "--template",
      description: "Template to use (basic, advanced, custom)",
      short: "-t",
      default: "basic",
    },
    {
      name: "--yes",
      description: "Skip prompts and use defaults",
      short: "-y",
      default: false,
    },
  ],
  action: async (ctx: CommandContext): Promise<CommandResult> => {
    const { logger, config, options } = ctx;

    logger.info("Initializing project...");

    if (options.yes) {
      // Use defaults
      config.set("cli.theme", "auto");
      config.set("cli.verbose", false);
      logger.success("Project initialized with defaults");
      return {
        success: true,
        message: "Project initialized successfully",
        data: { template: "basic" },
      };
    }

    // Interactive setup
    const answers = await inquirer.prompt([
      {
        type: "list",
        name: "theme",
        message: "Choose a theme:",
        choices: ["light", "dark", "auto"],
        default: config.get("cli.theme") || "auto",
      },
      {
        type: "confirm",
        name: "verbose",
        message: "Enable verbose logging?",
        default: config.get("cli.verbose") || false,
      },
      {
        type: "input",
        name: "apiUrl",
        message: "API Base URL:",
        default: config.get("api.baseUrl") || "https://api.example.com",
      },
    ]);

    // Save configuration
    config.set("cli.theme", answers.theme);
    config.set("cli.verbose", answers.verbose);
    config.set("api.baseUrl", answers.apiUrl);

    logger.success("Project initialized successfully!");
    logger.info(`Theme: ${chalk.cyan(answers.theme)}`);
    logger.info(`Verbose: ${chalk.cyan(answers.verbose)}`);
    logger.info(`API URL: ${chalk.cyan(answers.apiUrl)}`);

    return {
      success: true,
      message: "Project initialized successfully",
      data: answers,
    };
  },
};