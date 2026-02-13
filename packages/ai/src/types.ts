export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
}

export interface Session {
  date: string;
  messages: Message[];
}
