import { ConfigManager } from "@grandpa/config";
import { GrandpaServer } from "@grandpa/server";
import { HistoryManager } from "@grandpa/ai";
import { InteractiveInput } from "./input.js";
import { HttpClient } from "../services/http-client.js";

export async function startInteractiveMode() {
  const config = ConfigManager.getInstance();
  const aiConfig = config.get("ai");
  const serverConfig = config.get("server");

  // Check API key
  if (!aiConfig.apiKey) {
    console.error("\n❌ OpenAI API key is not configured.");
    console.error("Please set it using:");
    console.error("  grandpa config set ai.apiKey sk-...\n");
    process.exit(1);
  }

  // Initialize services
  const historyManager = new HistoryManager((config as any).path());
  const server = new GrandpaServer({ historyManager });

  // Start HTTP server
  const httpServer = await server.start(serverConfig.port);

  // Initialize client and input
  const client = new HttpClient(serverConfig.port);
  const input = new InteractiveInput();

  // Display welcome
  console.log("\n🤖 Grandpa Assistant Ready");
  console.log("   Today's session: " + new Date().toISOString().split("T")[0]);
  console.log("   Type your message and press Enter to send.");
  console.log("   Press Shift+Enter for a new line.");
  console.log("   Type 'exit' to quit.\n");

  // Interactive loop
  try {
    while (true) {
      const message = await input.prompt();

      if (!message) continue;

      try {
        // Send message and get immediate response
        const response = await client.sendMessage(message);

        // Show user message
        console.log(`\n👤 You: ${message}`);

        // Wait for AI response to be processed
        console.log(`\n⏳ Processing...`);

        // Poll for completion
        let maxAttempts = 60; // 60 seconds timeout
        let aiResponse = "";

        while (maxAttempts > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));

          try {
            const status = await client.getStatus(response.date);
            if (status.status === "done") {
              // Get the full session history to find AI response
              const session = await client.getSessionHistory(response.date);
              const lastMessage = session.messages[session.messages.length - 1];

              if (lastMessage && lastMessage.role === "assistant") {
                aiResponse = lastMessage.content;
                break;
              }
            }
          } catch (error: any) {
            // Ignore status check errors
          }

          maxAttempts--;
        }

        if (aiResponse) {
          console.log(`\n🤖 Assistant: ${aiResponse}\n`);
        } else {
          console.log(`\n⚠️  AI response not received yet. Check history with: grandpa history --date ${response.date}\n`);
        }

      } catch (error: any) {
        console.error(`\n❌ 发送失败: ${error.message}\n`);
      }
    }
  } finally {
    input.close();
    httpServer.close();
  }
}
