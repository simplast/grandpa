export interface ChatRequest {
  message: string;
}

export interface ChatResponse {
  success: boolean;
  message: string;
  date: string;
}

export interface StatusResponse {
  status: "idle" | "processing" | "done";
}

// ============================================
// Silent Mode Types
// ============================================

export interface SilentMessageRequest {
  message: string;
  sessionId?: string; // Optional, creates new session if not provided
}

export interface SilentMessageResponse {
  success: boolean;
  messageId: string;
  sessionId: string;
}

export interface SilentMessageItem {
  id: string;
  role: "user";
  content: string;
  timestamp: string;
  status: "pending" | "processed";
}

export interface SilentSession {
  id: string;
  messages: SilentMessageItem[];
  createdAt: string;
  lastUpdated: string;
}

export interface BulkProcessRequest {
  sessionId: string;
  mergeStrategy?: "concatenate" | "separate"; // Default: "concatenate"
}

export interface BulkProcessResponse {
  success: boolean;
  sessionId: string;
  processedCount: number;
}

export interface SilentSessionListResponse {
  sessions: {
    id: string;
    messageCount: number;
    pendingCount: number;
    createdAt: string;
    lastUpdated: string;
  }[];
}
