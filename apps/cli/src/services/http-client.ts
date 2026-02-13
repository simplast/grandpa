import type { ChatResponse, StatusResponse } from "@grandpa/server";

export interface SessionHistoryResponse {
  sessionID: string;
  messages: Array<{
    role: "user" | "assistant";
    content: string;
    timestamp: string;
  }>;
}

export class HttpClient {
  private baseUrl: string;

  constructor(port: number = 3478) {
    this.baseUrl = `http://localhost:${port}`;
  }

  async sendMessage(message: string): Promise<ChatResponse> {
    const response = await fetch(`${this.baseUrl}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json() as Promise<ChatResponse>;
  }

  async getStatus(date: string): Promise<StatusResponse> {
    const response = await fetch(`${this.baseUrl}/status/${date}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json() as Promise<StatusResponse>;
  }

  async getSessionHistory(date: string): Promise<SessionHistoryResponse> {
    const response = await fetch(`${this.baseUrl}/session/${date}/history`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json() as Promise<SessionHistoryResponse>;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
}
