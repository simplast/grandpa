import type { Command, CommandContext, CommandResult } from "@grandpa/core";

export const chatCommand: Command = {
  name: "chat",
  description: "Start interactive chat mode",
  action: async (ctx: CommandContext): Promise<CommandResult> => {
    ctx.logger.info("Starting interactive chat mode...");
    ctx.logger.info("Type your message and press Enter to send.");
    ctx.logger.info("Press Enter on empty line to submit.");
    ctx.logger.info("Type 'exit' to quit.");

    // Import and start interactive mode
    const { startInteractiveMode } = await import("../interactive/index.js");
    await startInteractiveMode();

    return {
      success: true,
      message: "Chat mode ended",
    };
  },
};
