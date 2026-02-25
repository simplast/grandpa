export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
}

export interface Session {
  date: string;
  messages: Message[];
}

// ============================================
// Silent Mode Types
// ============================================

export interface SilentMessageItem {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  status?: "pending" | "processed"; // Only for user messages
}

export interface SilentSession {
  id: string;
  messages: SilentMessageItem[];
  createdAt: string;
  lastUpdated: string;
}
