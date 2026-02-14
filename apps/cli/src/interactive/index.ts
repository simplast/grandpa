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

  // Get today's session ID
  const today = new Date().toISOString().split("T")[0];

  // Display welcome
  console.log("\n🤖 Grandpa Assistant Ready");
  console.log("   Today's session: " + today);
  console.log("   Type your message and press Enter to send.");
  console.log("   Press Shift+Enter for a new line.");
  console.log("   Type 'exit' to quit.\n");

  // Interactive loop
  try {
    while (true) {
      const message = await input.prompt();

      if (!message) continue;

      try {
        // Show user message
        console.log(`\n👤 You: ${message}`);
        console.log(`\n⏳ Processing...`);

        // Send message - this triggers streaming to the server
        await client.sendMessage(message, today);

        // Wait for AI response to be saved to history
        let maxAttempts = 60; // 60 seconds timeout
        let aiResponse = "";

        while (maxAttempts > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));

          try {
            // Get the full session history to find AI response
            const session = await client.getSessionHistory(today);
            const messages = session.messages;
            
            // Find the last assistant message
            const assistantMessages = messages.filter(m => m.role === "assistant");
            
            if (assistantMessages.length > 0) {
              const lastAssistant = assistantMessages[assistantMessages.length - 1];
              // Extract text from parts array
              const content = lastAssistant.parts
                ?.filter(p => p.type === "text")
                .map(p => p.text)
                .join('');
              
              if (content) {
                aiResponse = content;
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
          console.log(`\n⚠️  AI response not received yet. Check history with: grandpa history --date ${today}\n`);
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
