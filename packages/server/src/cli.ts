#!/usr/bin/env bun

import { GrandpaServer } from "./server.js";
import { HistoryManager } from "@grandpa/ai";
import { ConfigManager } from "@grandpa/config";

async function main() {
  // 获取命令行参数
  const args = process.argv.slice(2);
  const portArg = args.find(arg => arg.startsWith("--port="));
  const port = portArg ? parseInt(portArg.split("=")[1] || "3478") : 3478;

  console.log("🔧 Starting Grandpa Server...");
  console.log(`📍 Port: ${port}`);

  // 初始化依赖
  const config = ConfigManager.getInstance();
  const configPath = config.path() || "/tmp/grandpa-config.json";
  const historyManager = new HistoryManager(configPath);

  // 创建并启动服务器
  const server = new GrandpaServer({
    historyManager,
  });

  await server.start(port);

  // 处理优雅关闭
  process.on("SIGINT", async () => {
    console.log("\n🛑 Shutting down server...");
    await server.stop();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    console.log("\n🛑 Shutting down server...");
    await server.stop();
    process.exit(0);
  });
}

// 如果直接执行此文件
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main };