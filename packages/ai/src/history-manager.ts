import { mkdir, readFile, writeFile, readdir } from "fs/promises";
import { join, dirname } from "path";
import type {
  Message,
  Session,
  SilentMessageItem,
  SilentSession,
} from "./types.js";

function getTodayDate(): string {
  const dateStr = new Date().toISOString();
  return dateStr.substring(0, 10);
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export class HistoryManager {
  private configDir: string;
  private silentDir: string;

  constructor(configPath: string) {
    // configPath is like /path/to/config.json, we need the directory
    const configDir = dirname(configPath);
    this.configDir = join(configDir, "history");
    this.silentDir = join(configDir, "silent");
  }

  private getSessionPath(date: string): string {
    return join(this.configDir, `${date}.json`);
  }

  private getSilentSessionPath(sessionId: string): string {
    return join(this.silentDir, `${sessionId}.json`);
  }

  async appendMessage(message: Message, date?: string): Promise<void> {
    const targetDate = date || getTodayDate();
    const sessionPath = this.getSessionPath(targetDate);
    const session = await this.loadSession(targetDate);

    session.messages.push(message);

    await mkdir(this.configDir, { recursive: true });
    await writeFile(sessionPath, JSON.stringify(session, null, 2));
  }

  async loadSession(date?: string): Promise<Session> {
    const targetDate = date || getTodayDate();
    const sessionPath = this.getSessionPath(targetDate);

    try {
      const content = await readFile(sessionPath, "utf-8");
      return JSON.parse(content);
    } catch {
      return {
        date: targetDate,
        messages: [],
      };
    }
  }

  async getAllDates(): Promise<string[]> {
    try {
      const files = await readdir(this.configDir);
      return files
        .filter((f) => f.endsWith(".json"))
        .map((f) => f.replace(".json", ""))
        .sort();
    } catch {
      return [];
    }
  }

  async clearSession(date: string): Promise<void> {
    const sessionPath = this.getSessionPath(date);
    const emptySession: Session = {
      date,
      messages: [],
    };

    await mkdir(this.configDir, { recursive: true });
    await writeFile(sessionPath, JSON.stringify(emptySession, null, 2));
  }

  // ============================================
  // Silent Mode Methods
  // ============================================

  /**
   * Create a new silent session
   */
  async createSilentSession(): Promise<SilentSession> {
    const sessionId = generateId();
    const now = new Date().toISOString();
    const session: SilentSession = {
      id: sessionId,
      messages: [],
      createdAt: now,
      lastUpdated: now,
    };

    await mkdir(this.silentDir, { recursive: true });
    await writeFile(
      this.getSilentSessionPath(sessionId),
      JSON.stringify(session, null, 2),
    );

    return session;
  }

  /**
   * Append a message to a silent session without calling LLM
   */
  async appendSilentMessage(
    sessionId: string,
    content: string,
  ): Promise<SilentMessageItem> {
    const session = await this.loadSilentSession(sessionId);
    const message: SilentMessageItem = {
      id: generateId(),
      role: "user",
      content,
      timestamp: new Date().toISOString(),
      status: "pending",
    };

    session.messages.push(message);
    session.lastUpdated = new Date().toISOString();

    await mkdir(this.silentDir, { recursive: true });
    await writeFile(
      this.getSilentSessionPath(sessionId),
      JSON.stringify(session, null, 2),
    );

    return message;
  }

  /**
   * Load a silent session by ID
   */
  async loadSilentSession(sessionId: string): Promise<SilentSession> {
    const sessionPath = this.getSilentSessionPath(sessionId);

    try {
      const content = await readFile(sessionPath, "utf-8");
      return JSON.parse(content);
    } catch {
      throw new Error(`Silent session not found: ${sessionId}`);
    }
  }

  /**
   * Get all pending messages from a silent session
   */
  async getPendingMessages(sessionId: string): Promise<SilentMessageItem[]> {
    const session = await this.loadSilentSession(sessionId);
    return session.messages.filter((m) => m.status === "pending");
  }

  /**
   * Mark messages as processed and save AI response
   */
  async markMessagesProcessed(
    sessionId: string,
    messageIds: string[],
    aiResponse?: string,
  ): Promise<void> {
    const session = await this.loadSilentSession(sessionId);
    session.messages = session.messages.map((m) =>
      messageIds.includes(m.id) ? { ...m, status: "processed" as const } : m,
    );

    // Add AI response if provided
    if (aiResponse) {
      const aiMessage: SilentMessageItem = {
        id: generateId(),
        role: "assistant" as const,
        content: aiResponse,
        timestamp: new Date().toISOString(),
      };
      session.messages.push(aiMessage);
    }

    session.lastUpdated = new Date().toISOString();

    await mkdir(this.silentDir, { recursive: true });
    await writeFile(
      this.getSilentSessionPath(sessionId),
      JSON.stringify(session, null, 2),
    );
  }

  /**
   * Get all silent session IDs
   */
  async getAllSilentSessions(): Promise<string[]> {
    try {
      const files = await readdir(this.silentDir);
      return files
        .filter((f) => f.endsWith(".json"))
        .map((f) => f.replace(".json", ""))
        .sort();
    } catch {
      return [];
    }
  }

  /**
   * Delete a silent session
   */
  async deleteSilentSession(sessionId: string): Promise<void> {
    const sessionPath = this.getSilentSessionPath(sessionId);
    try {
      const { unlink } = await import("fs/promises");
      await unlink(sessionPath);
    } catch {
      // Session doesn't exist, ignore
    }
  }

  /**
   * Delete a specific message from a silent session
   */
  async deleteSilentMessage(
    sessionId: string,
    messageId: string,
  ): Promise<void> {
    const session = await this.loadSilentSession(sessionId);
    session.messages = session.messages.filter((m) => m.id !== messageId);
    session.lastUpdated = new Date().toISOString();

    await mkdir(this.silentDir, { recursive: true });
    await writeFile(
      this.getSilentSessionPath(sessionId),
      JSON.stringify(session, null, 2),
    );
  }
}
