import { mkdir, readFile, writeFile, readdir } from "fs/promises";
import { join, dirname } from "path";
import type { Message, Session } from "./types.js";

function getTodayDate(): string {
  const dateStr = new Date().toISOString();
  return dateStr.substring(0, 10);
}

export class HistoryManager {
  private configDir: string;

  constructor(configPath: string) {
    // configPath is like /path/to/config.json, we need the directory
    const configDir = dirname(configPath);
    this.configDir = join(configDir, "history");
  }

  private getSessionPath(date: string): string {
    return join(this.configDir, `${date}.json`);
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
}
