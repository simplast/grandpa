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

interface SilentSessionInfo {
  id: string;
  messageCount: number;
  pendingCount: number;
  createdAt: string;
  lastUpdated: string;
}

interface SilentMessageItem {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  status?: "pending" | "processed"; // Only for user messages
}

type ChatMode = "realtime" | "silent";

function App() {
  const [currentSessionId, setCurrentSessionId] = useState<string>(() => {
    const today = new Date().toISOString().substring(0, 10);
    return today;
  });
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Theme state
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    const saved = localStorage.getItem("grandpa-theme");
    return (saved as "dark" | "light") || "dark";
  });

  // Silent mode state
  const [chatMode, setChatMode] = useState<ChatMode>("realtime");
  const [silentSessions, setSilentSessions] = useState<SilentSessionInfo[]>([]);
  const [currentSilentSessionId, setCurrentSilentSessionId] = useState<
    string | null
  >(null);
  const [silentMessages, setSilentMessages] = useState<SilentMessageItem[]>([]);
  const [showNewChatDropdown, setShowNewChatDropdown] = useState(false);

  // Real-time chat hook
  const { messages, sendMessage, status, setMessages } = useChat({
    id: currentSessionId,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      prepareSendMessagesRequest({ messages, id }) {
        // Only send the last message + session ID
        return { body: { message: messages[messages.length - 1], id } };
      },
    }),
  });

  // Silent mode processing hook - uses ref to get current session ID
  const silentSessionIdRef = useRef<string | null>(null);
  silentSessionIdRef.current = currentSilentSessionId;

  const {
    messages: silentAiMessages,
    sendMessage: sendSilentProcess,
    status: silentStatus,
    setMessages: setSilentAiMessages,
  } = useChat({
    id: `silent-process`,
    transport: new DefaultChatTransport({
      api: "/api/silent/process",
      prepareSendMessagesRequest() {
        // Send sessionId in body - the message content is ignored
        return {
          body: {
            sessionId: silentSessionIdRef.current,
            mergeStrategy: "concatenate",
          },
        };
      },
    }),
    onFinish: async () => {
      // Clear streaming messages first
      setSilentAiMessages([]);
      // Reload the session after processing completes
      if (silentSessionIdRef.current) {
        await loadSilentSession(silentSessionIdRef.current);
        fetchSilentSessions();
      }
    },
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

  // Fetch silent sessions
  const fetchSilentSessions = useCallback(async () => {
    try {
      const response = await fetch("/api/silent/sessions");
      const data = await response.json();
      setSilentSessions(data.sessions || []);
    } catch (error) {
      console.error("Failed to fetch silent sessions:", error);
    }
  }, []);

  // Load session history
  const loadSessionHistory = useCallback(
    async (sessionId: string) => {
      setIsLoadingHistory(true);
      try {
        const response = await fetch(`/api/session/${sessionId}/history`);
        const data = await response.json();

        // Convert to UIMessage format if needed
        const uiMessages: UIMessage[] = (data.messages || []).map(
          (msg: any) => ({
            id: msg.id || `${sessionId}-${Date.now()}-${Math.random()}`,
            role: msg.role,
            parts: msg.parts || [{ type: "text", text: msg.content }],
            createdAt: msg.createdAt ? new Date(msg.createdAt) : new Date(),
          }),
        );

        setMessages(uiMessages);
      } catch (error) {
        console.error("Failed to load session history:", error);
        setMessages([]);
      } finally {
        setIsLoadingHistory(false);
      }
    },
    [setMessages],
  );

  // Load silent session messages
  const loadSilentSession = useCallback(async (sessionId: string) => {
    setIsLoadingHistory(true);
    try {
      const response = await fetch(`/api/silent/session/${sessionId}`);
      const data = await response.json();
      if (data.success && data.session) {
        setSilentMessages(data.session.messages || []);
      }
    } catch (error) {
      console.error("Failed to load silent session:", error);
      setSilentMessages([]);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  // Load sessions on mount
  useEffect(() => {
    fetchSessions();
    fetchSilentSessions();
  }, [fetchSessions, fetchSilentSessions]);

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
  }, [messages, silentMessages]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (showNewChatDropdown) {
        setShowNewChatDropdown(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showNewChatDropdown]);

  // Switch session
  const handleSessionSwitch = async (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setChatMode("realtime");
    setCurrentSilentSessionId(null);
    setSilentMessages([]);
    setSilentAiMessages([]);
    await loadSessionHistory(sessionId);
  };

  // Switch to silent session
  const handleSilentSessionSwitch = async (sessionId: string) => {
    setCurrentSilentSessionId(sessionId);
    setChatMode("silent");
    setCurrentSessionId("");
    setMessages([]);
    setSilentAiMessages([]);
    await loadSilentSession(sessionId);
  };

  // Create new real-time session
  const handleNewRealtimeChat = () => {
    const today = new Date().toISOString().substring(0, 10);
    setCurrentSessionId(today);
    setChatMode("realtime");
    setCurrentSilentSessionId(null);
    setSilentMessages([]);
    setMessages([]);
    setSilentAiMessages([]);
    setShowNewChatDropdown(false);
  };

  // Create new silent session
  const handleNewSilentChat = async () => {
    try {
      const response = await fetch("/api/silent/session", {
        method: "POST",
      });
      const data = await response.json();
      if (data.success) {
        setCurrentSilentSessionId(data.sessionId);
        setChatMode("silent");
        setCurrentSessionId("");
        setMessages([]);
        setSilentMessages([]);
        setSilentAiMessages([]);
        fetchSilentSessions();
      }
    } catch (error) {
      console.error("Failed to create silent session:", error);
    }
    setShowNewChatDropdown(false);
  };

  // Add message to silent session
  const handleSilentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !currentSilentSessionId) return;

    try {
      const response = await fetch("/api/silent/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          sessionId: currentSilentSessionId,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setSilentMessages((prev) => [
          ...prev,
          {
            id: data.messageId,
            role: "user" as const,
            content: input,
            timestamp: data.timestamp,
            status: "pending",
          },
        ]);
        setInput("");
        fetchSilentSessions();
      }
    } catch (error) {
      console.error("Failed to add silent message:", error);
    }
  };

  // Process all pending messages using useChat hook
  const handleProcessMessages = async () => {
    if (!currentSilentSessionId) return;
    // Clear previous AI messages
    setSilentAiMessages([]);
    // Trigger the silent process - the useChat hook will handle streaming
    await sendSilentProcess({ text: "" });
  };

  // Delete silent message
  const handleDeleteSilentMessage = async (messageId: string) => {
    if (!currentSilentSessionId) return;

    try {
      await fetch(
        `/api/silent/session/${currentSilentSessionId}/message/${messageId}`,
        { method: "DELETE" },
      );
      setSilentMessages((prev) => prev.filter((m) => m.id !== messageId));
      fetchSilentSessions();
    } catch (error) {
      console.error("Failed to delete message:", error);
    }
  };

  // Delete silent session
  const handleDeleteSilentSession = async (sessionId: string) => {
    try {
      await fetch(`/api/silent/session/${sessionId}`, { method: "DELETE" });
      if (currentSilentSessionId === sessionId) {
        setCurrentSilentSessionId(null);
        setSilentMessages([]);
        setChatMode("realtime");
      }
      fetchSilentSessions();
    } catch (error) {
      console.error("Failed to delete silent session:", error);
    }
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

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const pendingCount = silentMessages.filter(
    (m) => m.status === "pending",
  ).length;

  return (
    <div className={`app-container ${theme}`}>
      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? "open" : "closed"}`}>
        <div className="sidebar-header">
          <h2>LOGS</h2>
          <button
            className="sidebar-toggle"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            title={isSidebarOpen ? "Hide sidebar" : "Show sidebar"}
          >
            {isSidebarOpen ? "◀" : "▶"}
          </button>
        </div>

        {/* New Chat Dropdown */}
        <div className="new-chat-container">
          <button
            className="new-chat-btn"
            onClick={(e) => {
              e.stopPropagation();
              setShowNewChatDropdown(!showNewChatDropdown);
            }}
          >
            [+] NEW SESSION
          </button>
          {showNewChatDropdown && (
            <div
              className="new-chat-dropdown"
              onClick={(e) => e.stopPropagation()}
            >
              <button className="dropdown-item" onClick={handleNewRealtimeChat}>
                <span className="dropdown-icon">&gt;</span>
                <span className="dropdown-text">
                  <span className="dropdown-title">REALTIME</span>
                  <span className="dropdown-desc">Instant response</span>
                </span>
              </button>
              <button className="dropdown-item" onClick={handleNewSilentChat}>
                <span className="dropdown-icon">#</span>
                <span className="dropdown-text">
                  <span className="dropdown-title">SILENT</span>
                  <span className="dropdown-desc">Batch process</span>
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Real-time Sessions */}
        <div className="session-section">
          <h3 className="section-title">Realtime</h3>
          <div className="session-list">
            {sessions.length === 0 ? (
              <div className="no-sessions">No chat history yet</div>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  className={`session-item ${
                    session.id === currentSessionId && chatMode === "realtime"
                      ? "active"
                      : ""
                  }`}
                  onClick={() => handleSessionSwitch(session.id)}
                >
                  <div className="session-date">{formatDate(session.date)}</div>
                  <div className="session-preview">{session.preview}</div>
                  <div className="session-meta">
                    {session.messageCount} msgs
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Silent Sessions */}
        <div className="session-section">
          <h3 className="section-title">Silent</h3>
          <div className="session-list">
            {silentSessions.length === 0 ? (
              <div className="no-sessions">No silent sessions</div>
            ) : (
              silentSessions.map((session) => (
                <div
                  key={session.id}
                  className={`session-item silent-session ${
                    session.id === currentSilentSessionId &&
                    chatMode === "silent"
                      ? "active"
                      : ""
                  }`}
                  onClick={() => handleSilentSessionSwitch(session.id)}
                >
                  <div className="session-date">
                    {formatDateTime(session.createdAt)}
                    {session.pendingCount > 0 && (
                      <span className="pending-badge">
                        {session.pendingCount}P
                      </span>
                    )}
                  </div>
                  <div className="session-preview">
                    {session.messageCount} msgs stored
                  </div>
                  <button
                    className="delete-session-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSilentSession(session.id);
                    }}
                    title="Delete session"
                  >
                    X
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="chat-main">
        <div className="chat-container">
          <header className="chat-header">
            <div className="header-content">
              <h1>GRANDPA</h1>
              <p>
                {chatMode === "realtime" ? "[REALTIME MODE]" : "[SILENT MODE]"}
              </p>
            </div>
            <div className="header-actions">
              <button
                className="theme-toggle"
                onClick={() => {
                  const newTheme = theme === "dark" ? "light" : "dark";
                  setTheme(newTheme);
                  localStorage.setItem("grandpa-theme", newTheme);
                }}
                title={
                  theme === "dark"
                    ? "Switch to light mode"
                    : "Switch to dark mode"
                }
              >
                {theme === "dark" ? "[LIGHT]" : "[DARK]"}
              </button>
              {!isSidebarOpen && (
                <button
                  className="sidebar-toggle-mobile"
                  onClick={() => setIsSidebarOpen(true)}
                >
                  [LOGS]
                </button>
              )}
            </div>
          </header>

          <div className="messages-container" ref={chatContainerRef}>
            {isLoadingHistory ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>LOADING_</p>
              </div>
            ) : chatMode === "realtime" ? (
              // Real-time mode messages
              messages.length === 0 ? (
                <div className="empty-state">
                  <p>{"> "}AWAITING INPUT_</p>
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
                              <MemoizedMarkdown
                                key={index}
                                content={part.text}
                              />
                            ) : (
                              <span key={index}>{part.text}</span>
                            )
                          ) : null,
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )
            ) : // Silent mode messages
            silentMessages.length === 0 ? (
              <div className="empty-state">
                <p>{"> "}NO MESSAGES_</p>
                <p className="hint">
                  Messages saved locally for batch processing
                </p>
              </div>
            ) : (
              <div className="silent-messages">
                {silentMessages.map((message) => {
                  if (message.role === "user") {
                    return (
                      <div
                        key={message.id}
                        className={`message user ${message.status || ""}`}
                      >
                        <div className="message-avatar">[#]</div>
                        <div className="message-content">
                          <div className="message-text">{message.content}</div>
                          <div className="message-status">
                            <span className={`status-badge ${message.status}`}>
                              {message.status}
                            </span>
                            <span className="message-time">
                              {new Date(message.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                        {message.status === "pending" && (
                          <button
                            className="delete-message-btn"
                            onClick={() =>
                              handleDeleteSilentMessage(message.id)
                            }
                            title="Remove message"
                          >
                            X
                          </button>
                        )}
                      </div>
                    );
                  } else {
                    return (
                      <div
                        key={message.id}
                        className="message assistant silent-ai-response"
                      >
                        <div className="message-avatar">🤖</div>
                        <div className="message-content">
                          <div className="message-text">
                            <MemoizedMarkdown content={message.content} />
                          </div>
                        </div>
                      </div>
                    );
                  }
                })}

                {/* Show typing indicator while processing */}
                {silentStatus === "streaming" &&
                  silentAiMessages.length === 0 && (
                    <div className="message assistant silent-ai-response">
                      <div className="message-avatar">🤖</div>
                      <div className="message-content">
                        <div className="message-text">
                          <div className="typing-indicator">
                            <span></span>
                            <span></span>
                            <span></span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                {/* Show streaming AI response during processing */}
                {silentAiMessages
                  .filter((msg) => {
                    const hasText = msg.parts?.some(
                      (part) => part.type === "text" && part.text.trim(),
                    );
                    return hasText;
                  })
                  .map((message) => (
                    <div
                      key={message.id}
                      className="message assistant silent-ai-response streaming"
                    >
                      <div className="message-avatar">🤖</div>
                      <div className="message-content">
                        <div className="message-text">
                          {message.parts?.map((part, index) =>
                            part.type === "text" && part.text.trim() ? (
                              <MemoizedMarkdown
                                key={index}
                                content={part.text}
                              />
                            ) : null,
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          <form
            onSubmit={
              chatMode === "realtime" ? handleSubmit : handleSilentSubmit
            }
            className="input-form"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={chatMode === "realtime" ? "> input_" : "> add task_"}
              className="message-input"
              disabled={status !== "ready" && chatMode === "realtime"}
            />
            {chatMode === "realtime" ? (
              <button
                type="submit"
                disabled={status !== "ready" || !input.trim()}
              >
                EXEC
              </button>
            ) : (
              <>
                <button type="submit" disabled={!input.trim()}>
                  SAVE
                </button>
                {pendingCount > 0 && (
                  <button
                    type="button"
                    className="process-btn"
                    onClick={handleProcessMessages}
                    disabled={
                      silentStatus === "streaming" ||
                      silentStatus === "submitted"
                    }
                  >
                    {silentStatus === "streaming" ||
                    silentStatus === "submitted"
                      ? "PROCESSING..."
                      : `RUN [${pendingCount}]`}
                  </button>
                )}
              </>
            )}
          </form>
        </div>
      </main>
    </div>
  );
}

export default App;
