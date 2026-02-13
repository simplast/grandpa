import chalk from "chalk";
import type { Command, CommandContext, CommandResult } from "@grandpa/core";

export const versionCommand: Command = {
  name: "version",
  description: "Display detailed version information",
  options: [
    {
      name: "--json",
      description: "Output as JSON",
      short: "-j",
      default: false,
    },
  ],
  action: (ctx: CommandContext): CommandResult => {
    const { logger, options } = ctx;

    const versionInfo = {
      cli: "0.1.0",
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      timestamp: new Date().toISOString(),
    };

    if (options.json) {
      console.log(JSON.stringify(versionInfo, null, 2));
    } else {
      logger.info(`${chalk.bold("CLI Version:")} ${versionInfo.cli}`);
      logger.info(`${chalk.bold("Node.js:")} ${versionInfo.node}`);
      logger.info(`${chalk.bold("Platform:")} ${versionInfo.platform}`);
      logger.info(`${chalk.bold("Architecture:")} ${versionInfo.arch}`);
      logger.info(`${chalk.bold("Built:")} ${versionInfo.timestamp}`);
    }

    return {
      success: true,
      data: versionInfo,
    };
  },
};