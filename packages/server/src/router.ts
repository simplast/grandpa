import { Hono } from "hono";
import { stream } from "hono/streaming";
import { HistoryManager } from "@grandpa/ai";
import { SessionPrompt } from "./session.js";

function getTodayDate(): string {
  const dateStr = new Date().toISOString();
  return dateStr.substring(0, 10);
}

export function createRouter(historyManager: HistoryManager) {
  const router = new Hono();
  const processingQueue = new Map<string, Promise<void>>();

  // 健康检查
  router.get("/health", (c) => {
    return c.json({ status: "ok" });
  });

  // 接收用户消息 (旧接口 - 保持兼容)
  router.post("/chat", async (c) => {
    const { message } = await c.req.json();
    const date = getTodayDate();

    // 启动后台异步处理
    // SessionPrompt.prompt() 会自动保存用户消息和 AI 回复
    const processingPromise = processInBackground(date, message, historyManager);
    processingQueue.set(date, processingPromise);

    // 立即返回 "收到"
    return c.json({
      success: true,
      message: "收到2",
      date,
    });
  });

  // 查询处理状态 (旧接口 - 保持兼容)
  router.get("/status/:date", async (c) => {
    const date = c.req.param("date");
    const processing = processingQueue.get(date);

    if (!processing) {
      return c.json({ status: "idle" });
    }

    const isDone = await Promise.race([
      processing.then(() => true),
      new Promise((resolve) => setTimeout(() => resolve(false), 100)),
    ]);

    return c.json({ status: isDone ? "done" : "processing" });
  });

  // 新接口: POST /session/:sessionID/message - 流式响应
  router.post("/session/:sessionID/message", async (c) => {
    const sessionID = c.req.param("sessionID");
    const { message } = await c.req.json();

    if (!message) {
      return c.json({ error: "Message is required" }, 400);
    }

    // 创建 SessionPrompt 实例
    const sessionPrompt = new SessionPrompt(sessionID, historyManager);

    // 返回流式响应
    return stream(c, async (streamWriter) => {
      try {
        // 调用 SessionPrompt.prompt() 获取流
        const responseStream = await sessionPrompt.prompt(message);

        // 从 LLM 流中读取并写入 HTTP 响应
        for await (const chunk of responseStream) {
          streamWriter.write(chunk);
        }

        // 完成流
        await streamWriter.close();
      } catch (error: any) {
        console.error("[Stream Error]", error);
        streamWriter.write(`\n\n[Error: ${error.message}]`);
        await streamWriter.close();
      }
    });
  });

  // 新接口: POST /session/:sessionID/message (非流式版本 - 可选)
  router.post("/session/:sessionID/message/non-stream", async (c) => {
    const sessionID = c.req.param("sessionID");
    const { message } = await c.req.json();

    if (!message) {
      return c.json({ error: "Message is required" }, 400);
    }

    try {
      const sessionPrompt = new SessionPrompt(sessionID, historyManager);
      const response = await sessionPrompt.prompt(message, { stream: false });

      return c.json({
        success: true,
        sessionID,
        response,
      });
    } catch (error: any) {
      console.error("[Non-stream Error]", error);
      return c.json({ error: error.message }, 500);
    }
  });

  // 获取会话历史
  router.get("/session/:sessionID/history", async (c) => {
    const sessionID = c.req.param("sessionID");
    const session = await historyManager.loadSession(sessionID);

    return c.json({
      sessionID,
      messages: session.messages,
    });
  });

  // 清理会话
  router.delete("/session/:sessionID", async (c) => {
    const sessionID = c.req.param("sessionID");
    await historyManager.clearSession(sessionID);

    return c.json({
      success: true,
      message: `Session ${sessionID} cleared`,
    });
  });

  // Vercel AI SDK 兼容端点: POST /chat
  // 适配 useChat hook 的默认端点
  router.post("/chat", async (c) => {
    const { messages } = await c.req.json();
    const sessionID = getTodayDate();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return c.json({ error: "Messages are required" }, 400);
    }

    // 获取最后一条用户消息
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== "user") {
      return c.json({ error: "Last message must be from user" }, 400);
    }

    // 创建 SessionPrompt 实例
    const sessionPrompt = new SessionPrompt(sessionID, historyManager);

    // 返回流式响应（纯文本格式，适配 streamProtocol: 'text'）
    return stream(c, async (streamWriter) => {
      try {
        // 调用 SessionPrompt.prompt() 获取流
        const responseStream = await sessionPrompt.prompt(lastMessage.content);

        // 从 LLM 流中读取并写入 HTTP 响应
        for await (const chunk of responseStream) {
          streamWriter.write(chunk);
        }

        // 完成流
        await streamWriter.close();
      } catch (error: any) {
        console.error("[Chat Stream Error]", error);
        streamWriter.write(`\n\n[Error: ${error.message}]`);
        await streamWriter.close();
      }
    });
  });

  return router;
}

// 后台处理函数 (保持兼容)
// 注意：SessionPrompt.prompt() 已经会保存用户消息和 AI 回复，这里不再重复保存
async function processInBackground(
  date: string,
  userMessage: string,
  historyManager: HistoryManager
) {
  try {
    const sessionPrompt = new SessionPrompt(date, historyManager);

    // 使用非流式方式生成响应
    // SessionPrompt.prompt() 会自动保存用户消息和 AI 回复
    await sessionPrompt.prompt(userMessage, { stream: false });

    console.log(`[${date}] AI 回复已保存`);
  } catch (error) {
    console.error("[Background Processing Error]", error);
  }
}