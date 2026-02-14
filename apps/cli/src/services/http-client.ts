import type { StatusResponse } from "@grandpa/server";

export interface UIMessage {
  id: string;
  role: "user" | "assistant";
  parts: Array<{ type: "text"; text: string }>;
  createdAt?: Date;
}

export interface SessionHistoryResponse {
  sessionID: string;
  messages: UIMessage[];
}

export interface ChatResponse {
  date: string;
  status: string;
}

export class HttpClient {
  private baseUrl: string;

  constructor(port: number = 3478) {
    this.baseUrl = `http://localhost:${port}`;
  }

  async sendMessage(message: string, sessionId?: string): Promise<ChatResponse> {
    const id = sessionId || new Date().toISOString().substring(0, 10);
    
    // Send in the new format: { message: UIMessage, id: string }
    const response = await fetch(`${this.baseUrl}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          role: "user",
          parts: [{ type: "text", text: message }],
        },
        id,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
    }

    // The /chat endpoint returns a stream, so we just return the session info
    return { date: id, status: "processing" };
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
