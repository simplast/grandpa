import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import type { Message } from "./types.js";

export interface AIServiceOptions {
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

export class AIService {
  private ai;
  private model: string;

  constructor(options: AIServiceOptions) {
    this.ai = createOpenAI({
      apiKey: options.apiKey,
      baseURL: options.baseUrl,
    });
    this.model = options.model || "gpt-4o";
  }

  /**
   * Generate complete response (non-streaming)
   */
  async generateResponse(messages: Message[]): Promise<string> {
    try {
      const result = await streamText({
        model: this.ai(this.model),
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      });

      let fullResponse = "";
      for await (const chunk of result.textStream) {
        fullResponse += chunk;
      }

      return fullResponse;
    } catch (error) {
      console.error("[AI Error]", error);
      return "抱歉，处理请求时出现错误。";
    }
  }

  /**
   * Stream response (returns async iterable)
   */
  async *streamResponse(messages: Message[]): AsyncIterable<string> {
    try {
      const result = await streamText({
        model: this.ai(this.model),
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      });

      for await (const chunk of result.textStream) {
        yield chunk;
      }
    } catch (error) {
      console.error("[AI Stream Error]", error);
      yield "抱歉，处理请求时出现错误。";
    }
  }

  /**
   * Get available models
   */
  getModels(): string[] {
    return [this.model];
  }
}
