import { serve } from "@hono/node-server";
import { HistoryManager } from "@grandpa/ai";
import { createRouter } from "./router.js";

export class GrandpaServer {
  private historyManager: HistoryManager;
  private server: any;

  constructor(options: { historyManager: HistoryManager }) {
    this.historyManager = options.historyManager;
  }

  async start(port: number = 3478) {
    // Create router with all routes
    const app = createRouter(this.historyManager);

    this.server = serve({
      port,
      fetch: app.fetch,
    });

    console.log(`🚀 Server running on http://localhost:${port}`);
    console.log(`📍 Available endpoints:`);
    console.log(`   GET  /health`);
    console.log(`   POST /chat`);
    console.log(`   GET  /status/:date`);
    console.log(`   POST /session/:sessionID/message`);
    console.log(`   POST /session/:sessionID/message/non-stream`);
    console.log(`   GET  /session/:sessionID/history`);
    console.log(`   DELETE /session/:sessionID`);
    console.log(`🔧 LLM Provider: Custom (xiaomimimo.com)`);

    return this.server;
  }

  async stop() {
    if (this.server) {
      this.server.close();
    }
  }
}
