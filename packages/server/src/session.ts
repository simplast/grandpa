import { HistoryManager } from "@grandpa/ai";
import type { Message } from "@grandpa/ai";
import { SessionLLM } from "./llm.js";

export interface SessionPromptOptions {
  stream?: boolean;
  temperature?: number;
  maxTokens?: number;
}

export class SessionPrompt {
  private sessionID: string;
  private historyManager: HistoryManager;
  private sessionLLM: SessionLLM;

  constructor(sessionID: string, historyManager: HistoryManager) {
    this.sessionID = sessionID;
    this.historyManager = historyManager;
    this.sessionLLM = new SessionLLM();
  }

  /**
   * Process a prompt and return the response
   * @param message - User message
   * @param options - Prompt options
   * @returns AsyncIterable of response chunks (stream) or full response string
   */
  async prompt(
    message: string,
    options: SessionPromptOptions = { stream: true }
  ): Promise<AsyncIterable<string> | string> {
    // Save user message to history
    const userMessage: Message = {
      role: "user",
      content: message,
      timestamp: new Date().toISOString(),
    };

    await this.historyManager.appendMessage(userMessage, this.sessionID);

    // Load session history
    const session = await this.historyManager.loadSession(this.sessionID);

    // Use LLM instance
    const llm = this.sessionLLM;

    // Generate response
    if (options.stream) {
      // Return stream
      const stream = await llm.stream(session.messages, {
        temperature: options.temperature,
        maxTokens: options.maxTokens,
      });

      // Save assistant message after stream completes
      const fullResponse: string[] = [];
      const historyManager = this.historyManager;
      const sessionID = this.sessionID;

      const wrappedStream = async function* () {
        for await (const chunk of stream) {
          fullResponse.push(chunk);
          yield chunk;
        }

        // Save complete response to history
        const assistantMessage: Message = {
          role: "assistant",
          content: fullResponse.join(""),
          timestamp: new Date().toISOString(),
        };

        await historyManager.appendMessage(assistantMessage, sessionID);
        console.log(`[${sessionID}] AI response saved (stream)`);
      };

      return wrappedStream();
    } else {
      // Return full response
      const response = await llm.generate(session.messages, {
        temperature: options.temperature,
        maxTokens: options.maxTokens,
      });

      // Save assistant message
      const assistantMessage: Message = {
        role: "assistant",
        content: response,
        timestamp: new Date().toISOString(),
      };

      await this.historyManager.appendMessage(assistantMessage, this.sessionID);
      console.log(`[${this.sessionID}] AI response saved (non-stream)`);

      return response;
    }
  }

  /**
   * Get session history
   */
  async getHistory(): Promise<Message[]> {
    const session = await this.historyManager.loadSession(this.sessionID);
    return session.messages;
  }

  /**
   * Clear session history
   */
  async clearHistory(): Promise<void> {
    await this.historyManager.clearSession(this.sessionID);
    console.log(`[${this.sessionID}] Session cleared`);
  }
}