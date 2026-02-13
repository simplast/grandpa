import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useRef, useEffect } from "react";
import "./App.css";

function App() {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
  });
  const [input, setInput] = useState("");
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 自动滚动到底部
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && status === "ready") {
      await sendMessage({ text: input });
      setInput("");
    }
  };

  return (
    <div className="chat-container">
      <header className="chat-header">
        <h1>🤖 Grandpa Chat</h1>
        <p>AI Assistant with hot reload support</p>
      </header>

      <div className="messages-container" ref={chatContainerRef}>
        {messages.length === 0 && (
          <div className="empty-state">
            <p>Start a conversation by typing below...</p>
          </div>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${message.role === "user" ? "user" : "assistant"}`}
          >
            <div className="message-avatar">
              {message.role === "user" ? "👤" : "🤖"}
            </div>
            <div className="message-content">
              <div className="message-text">
                {message.parts?.map((part, index) =>
                  part.type === "text" ? (
                    <span key={index}>{part.text}</span>
                  ) : null,
                )}
              </div>
            </div>
          </div>
        ))}
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
  );
}

export default App;

