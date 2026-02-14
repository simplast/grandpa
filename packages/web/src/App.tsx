import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { UIMessage } from "ai";
import { useState, useRef, useEffect, useCallback, memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./App.css";

// Memoized markdown component for better performance
const MemoizedMarkdown = memo(({ content }: { content: string }) => (
  <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
));

MemoizedMarkdown.displayName = "MemoizedMarkdown";

interface SessionInfo {
  id: string;
  date: string;
  messageCount: number;
  preview: string;
  lastMessage: string | null;
}

function App() {
  const [currentSessionId, setCurrentSessionId] = useState<string>(() => {
    const today = new Date().toISOString().substring(0, 10);
    return today;
  });
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const {
    messages,
    sendMessage,
    status,
    setMessages,
  } = useChat({
    id: currentSessionId,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      prepareSendMessagesRequest({ messages, id }) {
        // Only send the last message + session ID
        return { body: { message: messages[messages.length - 1], id } };
      },
    }),
  });

  const [input, setInput] = useState("");
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Fetch session list
  const fetchSessions = useCallback(async () => {
    try {
      const response = await fetch("/api/sessions");
      const data = await response.json();
      setSessions(data.sessions || []);
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
    }
  }, []);

  // Load session history
  const loadSessionHistory = useCallback(async (sessionId: string) => {
    setIsLoadingHistory(true);
    try {
      const response = await fetch(`/api/session/${sessionId}/history`);
      const data = await response.json();
      
      // Convert to UIMessage format if needed
      const uiMessages: UIMessage[] = (data.messages || []).map((msg: any) => ({
        id: msg.id || `${sessionId}-${Date.now()}-${Math.random()}`,
        role: msg.role,
        parts: msg.parts || [{ type: "text", text: msg.content }],
        createdAt: msg.createdAt ? new Date(msg.createdAt) : new Date(),
      }));
      
      setMessages(uiMessages);
    } catch (error) {
      console.error("Failed to load session history:", error);
      setMessages([]);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [setMessages]);

  // Load sessions on mount
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Refresh sessions when messages change (new session created)
  useEffect(() => {
    if (messages.length > 0 && status === "ready") {
      fetchSessions();
    }
  }, [messages.length, status, fetchSessions]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Switch session
  const handleSessionSwitch = async (sessionId: string) => {
    setCurrentSessionId(sessionId);
    await loadSessionHistory(sessionId);
  };

  // Create new session (today's date)
  const handleNewChat = () => {
    const today = new Date().toISOString().substring(0, 10);
    setCurrentSessionId(today);
    setMessages([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && status === "ready") {
      await sendMessage({ text: input });
      setInput("");
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateStr === today.toISOString().substring(0, 10)) {
      return "Today";
    } else if (dateStr === yesterday.toISOString().substring(0, 10)) {
      return "Yesterday";
    }
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
    });
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? "open" : "closed"}`}>
        <div className="sidebar-header">
          <h2>Chat History</h2>
          <button
            className="sidebar-toggle"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            title={isSidebarOpen ? "Hide sidebar" : "Show sidebar"}
          >
            {isSidebarOpen ? "◀" : "▶"}
          </button>
        </div>

        <button className="new-chat-btn" onClick={handleNewChat}>
          + New Chat
        </button>

        <div className="session-list">
          {sessions.length === 0 ? (
            <div className="no-sessions">No chat history yet</div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className={`session-item ${
                  session.id === currentSessionId ? "active" : ""
                }`}
                onClick={() => handleSessionSwitch(session.id)}
              >
                <div className="session-date">{formatDate(session.date)}</div>
                <div className="session-preview">{session.preview}</div>
                <div className="session-meta">
                  {session.messageCount} messages
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="chat-main">
        <div className="chat-container">
          <header className="chat-header">
            <div className="header-content">
              <h1>🤖 Grandpa Chat</h1>
              <p>AI Assistant with hot reload support</p>
            </div>
            {!isSidebarOpen && (
              <button
                className="sidebar-toggle-mobile"
                onClick={() => setIsSidebarOpen(true)}
              >
                ☰ History
              </button>
            )}
          </header>

          <div className="messages-container" ref={chatContainerRef}>
            {isLoadingHistory ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Loading chat history...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="empty-state">
                <p>Start a conversation by typing below...</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`message ${
                    message.role === "user" ? "user" : "assistant"
                  }`}
                >
                  <div className="message-avatar">
                    {message.role === "user" ? "👤" : "🤖"}
                  </div>
                  <div className="message-content">
                    <div className="message-text">
                      {message.parts?.map((part, index) =>
                        part.type === "text" ? (
                          message.role === "assistant" ? (
                            <MemoizedMarkdown key={index} content={part.text} />
                          ) : (
                            <span key={index}>{part.text}</span>
                          )
                        ) : null
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleSubmit} className="input-form">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="message-input"
              disabled={status !== "ready"}
            />
            <button type="submit" disabled={status !== "ready" || !input.trim()}>
              Send
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default App;