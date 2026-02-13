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
