import chalk from "chalk";
import type { Command, CommandContext, CommandResult } from "@grandpa/core";

export const configCommand: Command = {
  name: "config",
  description: "Manage configuration settings",
  options: [
    {
      name: "get <key>",
      description: "Get a configuration value",
    },
    {
      name: "set <key> <value>",
      description: "Set a configuration value",
    },
    {
      name: "list",
      description: "List all configuration values",
    },
    {
      name: "reset",
      description: "Reset configuration to defaults",
    },
  ],
  action: (ctx: CommandContext): CommandResult => {
    const { logger, config, args } = ctx;

    if (args.length === 0) {
      return {
        success: false,
        message: "Please specify a config action: get, set, list, or reset",
        exitCode: 1,
      };
    }

    const action = args[0];

    switch (action) {
      case "get": {
        if (args.length < 2) {
          return {
            success: false,
            message: "Please specify a key to get",
            exitCode: 1,
          };
        }

        const key = args[1];
        const value = config.get(key as any);

        if (value === undefined) {
          logger.warn(`Key "${key}" not found`);
          return {
            success: false,
            message: `Key "${key}" not found`,
            exitCode: 1,
          };
        }

        logger.info(`${chalk.cyan(key)}: ${chalk.green(JSON.stringify(value))}`);
        return {
          success: true,
          data: { key, value },
        };
      }

      case "set": {
        if (args.length < 3) {
          return {
            success: false,
            message: "Please specify a key and value to set",
            exitCode: 1,
          };
        }

        const key = args[1];
        const value = args[2];

        // Try to parse JSON values
        let parsedValue: any = value;
        try {
          if (value) {
            parsedValue = JSON.parse(value);
          }
        } catch {
          // Keep as string if not valid JSON
        }

        config.set(key as any, parsedValue);
        logger.success(`Set ${chalk.cyan(key)} to ${chalk.green(JSON.stringify(parsedValue))}`);

        return {
          success: true,
          message: `Configuration updated: ${key}`,
          data: { key, value: parsedValue },
        };
      }

      case "list": {
        const allConfig = (config as any).all;
        logger.info("Current configuration:");
        console.log(JSON.stringify(allConfig, null, 2));
        return {
          success: true,
          data: allConfig,
        };
      }

      case "reset": {
        (config as any).reset();
        logger.success("Configuration reset to defaults");
        return {
          success: true,
          message: "Configuration reset successfully",
        };
      }

      default:
        return {
          success: false,
          message: `Unknown config action: ${action}`,
          exitCode: 1,
        };
    }
  },
};