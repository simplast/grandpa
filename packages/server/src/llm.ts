import { LLMProvider } from "./provider.js";
import type { Message } from "@grandpa/ai";

export interface LLMOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

export class SessionLLM {
  private provider: LLMProvider;

  constructor() {
    this.provider = new LLMProvider();
  }

  /**
   * Stream response from LLM
   * @param messages - Conversation history
   * @param options - LLM options
   * @returns AsyncIterable of response chunks
   */
  async *stream(messages: Message[], options: LLMOptions = {}): AsyncIterable<string> {
    const { temperature = 0.7, maxTokens = 1000, model } = options;

    // Call provider to get stream
    const stream = this.provider.stream(messages, {
      temperature,
      maxTokens,
      model,
    });

    // Yield chunks from provider
    for await (const chunk of stream) {
      yield chunk;
    }
  }

  /**
   * Generate complete response from LLM (non-streaming)
   * @param messages - Conversation history
   * @param options - LLM options
   * @returns Complete response string
   */
  async generate(messages: Message[], options: LLMOptions = {}): Promise<string> {
    const { temperature = 0.7, maxTokens = 1000, model } = options;

    // Call provider for complete response
    const response = await this.provider.generate(messages, {
      temperature,
      maxTokens,
      model,
    });

    return response;
  }

  /**
   * Get available models
   */
  async getModels(): Promise<string[]> {
    return this.provider.getModels();
  }
}
