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

  // 获取所有会话列表（带预览）
  router.get("/sessions", async (c) => {
    const dates = await historyManager.getAllDates();
    
    // 只保留有效的日期格式 (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const validDates = dates.filter((date) => dateRegex.test(date));
    
    const sessions = await Promise.all(
      validDates.map(async (date) => {
        const session = await historyManager.loadSession(date);
        const firstUserMessage = session.messages.find(
          (m) => m.role === "user"
        );
        return {
          id: date,
          date,
          messageCount: session.messages.length,
          preview: firstUserMessage?.content?.substring(0, 50) || "Empty chat",
          lastMessage:
            session.messages.length > 0
              ? session.messages[session.messages.length - 1].timestamp
              : null,
        };
      })
    );

    // 按日期倒序排列（最新的在前）
    return c.json({
      sessions: sessions.sort((a, b) => (a.date > b.date ? -1 : 1)),
    });
  });

  // 获取会话历史
  router.get("/session/:sessionID/history", async (c) => {
    const sessionID = c.req.param("sessionID");
    const session = await historyManager.loadSession(sessionID);

    // 转换为 Vercel AI SDK UIMessage 格式
    const uiMessages = session.messages.map((msg) => ({
      id: `${sessionID}-${msg.timestamp}`,
      role: msg.role,
      parts: [{ type: "text", text: msg.content }],
      createdAt: new Date(msg.timestamp),
    }));

    return c.json({
      sessionID,
      messages: uiMessages,
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
  // 支持两种格式：
  // 1. { messages: UIMessage[] } - 完整消息数组（旧格式）
  // 2. { message: UIMessage, id: string } - 单条消息 + 会话ID（新格式，服务端加载历史）
  router.post("/chat", async (c) => {
    const body = await c.req.json();
    let messages: any[];

    // 检查是新格式还是旧格式
    if (body.message && body.id) {
      // 新格式：单条消息 + 会话ID，从存储加载历史
      const { message, id } = body;
      console.log("[Chat] Received single message for session:", id);

      // 加载历史消息
      const session = await historyManager.loadSession(id);
      const historyMessages = session.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // 转换新消息格式
      let newMessageContent = '';
      if (message.content !== undefined) {
        newMessageContent = message.content;
      } else if (message.parts && Array.isArray(message.parts)) {
        newMessageContent = message.parts
          .filter((part: any) => part.type === 'text')
          .map((part: any) => part.text)
          .join('');
      }

      // 合并历史和新消息
      messages = [...historyMessages, {
        role: message.role,
        content: newMessageContent,
      }];
    } else if (body.messages && Array.isArray(body.messages)) {
      // 旧格式：完整消息数组
      messages = body.messages;
      console.log("[Chat] Received messages array:", messages.length, "messages");
    } else {
      return c.json({ error: "Messages are required" }, 400);
    }

    console.log("[Chat] Processing messages:", messages.length);

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

    // 获取会话ID（用于保存历史）
    const sessionId = body.id || getTodayDate();

    // 保存用户消息（在调用 LLM 之前）
    if (body.message && body.id) {
      // 新格式：保存用户消息
      const userContent = formattedMessages[formattedMessages.length - 1].content;
      await historyManager.appendMessage({
        role: 'user',
        content: userContent,
        timestamp: new Date().toISOString(),
      }, sessionId);
    }

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
    // onFinish 只保存 AI 回复（用户消息已在上面保存）
    return result.toUIMessageStreamResponse({
      onFinish: async ({ messages: uiMessages }) => {
        try {
          // 只保存 AI 响应（用户消息已在调用前保存）
          for (const msg of uiMessages) {
            if (msg.role !== 'assistant') continue;
            
            const content = msg.parts
              ?.filter((p: any) => p.type === 'text')
              .map((p: any) => p.text)
              .join('') || '';
            
            await historyManager.appendMessage({
              role: 'assistant',
              content,
              timestamp: new Date().toISOString(),
            }, sessionId);
          }
          console.log(`[Chat] Saved AI response to session ${sessionId}`);
        } catch (error) {
          console.error("[Chat] Failed to save messages:", error);
        }
      },
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