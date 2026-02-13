import { Hono } from "hono";
import { stream } from "hono/streaming";
import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { HistoryManager } from "@grandpa/ai";
import { SessionPrompt } from "./session.js";
import { ConfigManager } from "@grandpa/config";

function getTodayDate(): string {
  const dateStr = new Date().toISOString();
  return dateStr.substring(0, 10);
}

export function createRouter(historyManager: HistoryManager) {
  const router = new Hono();
  const processingQueue = new Map<string, Promise<void>>();

  // 获取配置（使用 get 方法以支持环境变量覆盖）
  const aiConfig = ConfigManager.getInstance().get('ai');
  
  console.log("[Config] AI Config:", JSON.stringify(aiConfig));
  console.log("[Config] API Key:", aiConfig?.apiKey);
  console.log("[Config] Base URL:", aiConfig?.baseUrl);
  console.log("[Config] Model:", aiConfig?.model);
  console.log("[Config] Full ai object:", aiConfig);

  // 健康检查
  router.get("/health", (c) => {
    return c.json({ status: "ok" });
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
  // 适配 useChat hook 的 DefaultChatTransport
  router.post("/chat", async (c) => {
    const { messages } = await c.req.json();

    console.log("[Chat] Received messages:", JSON.stringify(messages, null, 2));

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return c.json({ error: "Messages are required" }, 400);
    }

    // 转换消息格式，确保每条消息都有 content 字段
    const formattedMessages = messages.map((msg: any) => {
      // 如果消息已经有 content，直接返回
      if (msg.content !== undefined) {
        return {
          role: msg.role,
          content: msg.content,
        };
      }

      // 如果消息有 parts 数组，从中提取 text 内容
      if (msg.parts && Array.isArray(msg.parts)) {
        const textParts = msg.parts
          .filter((part: any) => part.type === 'text')
          .map((part: any) => part.text)
          .join('');
        return {
          role: msg.role,
          content: textParts,
        };
      }

      // 如果都没有，返回空字符串
      return {
        role: msg.role,
        content: '',
      };
    });

    console.log("[Chat] Formatted messages:", JSON.stringify(formattedMessages, null, 2));

    // 使用 Vercel AI SDK 的 streamText，从配置中获取 API 信息
    // 使用 .chat() 强制使用传统的 chat/completions 端点
    // 小米 API 使用 api-key header 而不是 Authorization
    const result = await streamText({
      model: createOpenAI({
        apiKey: aiConfig.apiKey,
        baseURL: aiConfig.baseUrl,
        headers: {
          'api-key': aiConfig.apiKey,
        },
      }).chat(aiConfig.model),
      messages: formattedMessages,
    });

    // 返回 Vercel AI SDK 兼容的 UI 消息流响应
    return result.toUIMessageStreamResponse();
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