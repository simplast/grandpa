import { AIService } from "@grandpa/ai";
import type { Message } from "@grandpa/ai";
import { ConfigManager } from "@grandpa/config";

export interface ProviderOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

export class LLMProvider {
  private config: ConfigManager;
  private aiService: AIService | null = null;

  constructor() {
    this.config = ConfigManager.getInstance();
  }

  /**
   * Get or create AIService instance
   */
  private getAIService(): AIService {
    if (!this.aiService) {
      const llmConfig = this.config.get("ai");
      this.aiService = new AIService({
        apiKey: llmConfig.apiKey,
        baseUrl: llmConfig.baseUrl,
        model: llmConfig.model,
      });
    }
    return this.aiService;
  }

  /**
   * Stream response from LLM provider using AI SDK
   */
  async *stream(messages: Message[], _options: ProviderOptions = {}): AsyncIterable<string> {
    try {
      const aiService = this.getAIService();

      // Note: AIService.streamResponse() doesn't support temperature/maxTokens options directly
      // For full control, you would need to modify AIService to accept these options
      for await (const chunk of aiService.streamResponse(messages)) {
        yield chunk;
      }
    } catch (error) {
      console.error("[LLM Provider Stream Error]", error);
      throw error;
    }
  }

  /**
   * Generate complete response from LLM provider
   */
  async generate(messages: Message[], _options: ProviderOptions = {}): Promise<string> {
    try {
      const aiService = this.getAIService();

      // Note: For temperature/maxTokens, you would need to modify AIService
      const response = await aiService.generateResponse(messages);
      return response;
    } catch (error) {
      console.error("[LLM Provider Generate Error]", error);
      throw error;
    }
  }

  /**
   * Get available models
   */
  async getModels(): Promise<string[]> {
    const aiService = this.getAIService();
    return aiService.getModels();
  }
}