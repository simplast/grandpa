import chalk from "chalk";
import { HistoryManager } from "@grandpa/ai";
import type { Command, CommandContext, CommandResult } from "@grandpa/core";

export const historyCommand: Command = {
  name: "history",
  description: "View and manage chat history",
  options: [
    {
      name: "--date <date>",
      description: "View history for specific date (YYYY-MM-DD)",
      short: "-d",
    },
    {
      name: "--list",
      description: "List all available history dates",
      short: "-l",
    },
    {
      name: "--clear <date>",
      description: "Clear history for specific date",
      short: "-c",
    },
    {
      name: "--clean-all",
      description: "Clear ALL chat history (irreversible)",
      short: "-a",
    },
    {
      name: "--json",
      description: "Output as JSON",
      short: "-j",
      default: false,
    },
  ],
  action: async (ctx: CommandContext): Promise<CommandResult> => {
    const { logger, config, options } = ctx;

    const historyManager = new HistoryManager((config as any).path());

    // List all available dates
    if (options.list) {
      const dates = await historyManager.getAllDates();
      if (dates.length === 0) {
        logger.info("No chat history found.");
        return { success: true, data: [] };
      }

      logger.info("Available chat history dates:");
      dates.forEach((date) => {
        logger.info(`  ${chalk.cyan(date)}`);
      });

      return { success: true, data: dates };
    }

    // Clear specific date
    if (options.clear) {
      const date = options.clear as string;
      await historyManager.clearSession(date);
      logger.success(`Cleared chat history for ${chalk.cyan(date)}`);
      return { success: true, message: `Cleared history for ${date}` };
    }

    // Clean all history
    if (options["clean-all"]) {
      const dates = await historyManager.getAllDates();
      if (dates.length === 0) {
        logger.info("No chat history found.");
        return { success: true, data: [] };
      }

      logger.warn(`⚠️  This will permanently delete ${dates.length} history file(s):`);
      dates.forEach((date) => {
        logger.warn(`  - ${chalk.red(date)}`);
      });
      logger.info("");

      // Confirm deletion
      const readline = await import("readline");
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      const answer = await new Promise<string>((resolve) => {
        rl.question("Are you sure you want to delete ALL history? Type 'YES' to confirm: ", resolve);
      });

      rl.close();

      if (answer === "YES") {
        for (const date of dates) {
          await historyManager.clearSession(date);
        }
        logger.success(`✅ Deleted ${dates.length} history file(s)`);
        return { success: true, message: `Deleted ${dates.length} history files` };
      } else {
        logger.info("Cancelled. No history was deleted.");
        return { success: true, message: "Deletion cancelled" };
      }
    }

    // View history for specific date (or today by default)
    const targetDate = (options.date as string) || new Date().toISOString().split("T")[0];
    const session = await historyManager.loadSession(targetDate);

    if (session.messages.length === 0) {
      logger.info(`No chat history found for ${chalk.cyan(targetDate)}`);
      return { success: true, data: { date: targetDate, messages: [] } };
    }

    if (options.json) {
      console.log(JSON.stringify(session, null, 2));
    } else {
      logger.info(`Chat history for ${chalk.cyan(targetDate)}:`);
      logger.info(`Total messages: ${session.messages.length}`);
      console.log("");

      // Display all messages without limit
      for (const msg of session.messages) {
        const date = new Date(msg.timestamp);
        const timestamp = date.toLocaleTimeString() + '.' + String(date.getMilliseconds()).padStart(3, '0');
        const role = msg.role === "user" ? "👤 You" : "🤖 Assistant";

        console.log(`${chalk.gray(`[${timestamp}]`)} ${chalk.bold(role)}:`);
        console.log(`  ${msg.content}`);
        console.log("");
      }
    }

    return { success: true, data: session };
  },
};