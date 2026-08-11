import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { useAppBackNavigation } from "../utils/useAppBackNavigation";
import { ArrowLeft, MessageSquare, Brain, Send } from "lucide-react";
import "../styles/global.css";
import "../styles/pages.css";

export default function ConversationViewPage() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { state, loadConversation, processChat, selectMemoryContext, dispatch } = useApp();
  const goBack = useAppBackNavigation("/chat-history");
  const messagesEndRef = useRef(null);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  // Load the conversation when the page mounts or conversationId changes
  useEffect(() => {
    if (conversationId && state.isAuthenticated) {
      loadConversation(conversationId);
    }
  }, [conversationId, state.isAuthenticated, loadConversation]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.currentChat, isTyping]);

  const handleSend = async () => {
    const msg = input.trim();
    if (!msg) return;
    setInput("");

    const userMsg = {
      id: `local_${Date.now()}`,
      role: "user",
      content: msg,
      timestamp: new Date().toISOString(),
    };

    dispatch({ type: "ADD_CURRENT_CHAT_MESSAGE", payload: userMsg });
    setIsTyping(true);
    try {
      const result = await processChat(msg);
      if (result?.user) {
        // Replace the temporary local message with the backend message
        dispatch({ type: "REPLACE_CURRENT_CHAT_MESSAGE", payload: { localId: userMsg.id, message: result.user } });
      }
      if (result?.assistant) {
        dispatch({ type: "ADD_CURRENT_CHAT_MESSAGE", payload: result.assistant });
      } else if (result?.error) {
        dispatch({ type: "SET_ERROR", payload: result.error });
      }
    } catch {
      dispatch({ type: "SET_ERROR", payload: "Failed to get a response. Please try again." });
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const messages = state.currentChat;

  return (
    <div className="app">
      <div className="page-wrapper">
        <div className="main-content">
          <div className="page-header-row">
            <button className="back-btn" onClick={goBack} aria-label="Go back">
              <ArrowLeft size={16} strokeWidth={1.5} />
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <MessageSquare size={24} strokeWidth={1.5} />
              <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                Conversation
              </h1>
            </div>
          </div>

          {state.loading ? (
            <div className="empty-state">
              <div className="empty-state-text">Loading conversation...</div>
            </div>
          ) : messages.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <MessageSquare size={48} strokeWidth={1.5} />
              </div>
              <div className="empty-state-title">No messages</div>
              <div className="empty-state-text">
                This conversation is empty or could not be loaded.
              </div>
            </div>
          ) : (
            <div className="chat-container">
              <div className="chat-messages">
                {messages.map((msg) => (
                  <div key={msg.id} className={`chat-message ${msg.role}`}>
                    <div className="chat-avatar">
                      {msg.role === "user" ? (
                        state.user?.name?.charAt(0).toUpperCase() || "U"
                      ) : (
                        <Brain size={18} strokeWidth={1.5} />
                      )}
                    </div>
                    <div className="chat-content">
                      <div className="chat-bubble">{msg.content}</div>
                      {msg.selectedMemory && (
                        <div className="chat-memory-reference-list">
                          <button
                            className="chat-memory-reference"
                            onClick={() => navigate(`/memory/${msg.selectedMemory.id}`)}
                          >
                            {msg.selectedMemory.title}
                          </button>
                        </div>
                      )}
                      {msg.relatedMemories && msg.relatedMemories.length > 0 && (
                        <div className="chat-memory-reference-list">
                          {msg.relatedMemories.map((mem) => (
                            <button
                              key={mem.id}
                              className="chat-memory-reference"
                              onClick={() => navigate(`/memory/${mem.id}`)}
                            >
                              {mem.title}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input area - only allow new messages if viewing a historical conversation */}
              <div className="chat-input-area">
                <div className="chat-input-wrapper">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Continue this conversation..."
                    rows={1}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      borderRadius: "var(--radius-full)",
                      border: "1px solid var(--border-color)",
                      fontSize: 14,
                      color: "var(--text-primary)",
                      background: "var(--card-bg)",
                      outline: "none",
                      resize: "none",
                    }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || isTyping}
                    style={{
                      padding: "10px 16px",
                      borderRadius: "var(--radius-full)",
                      border: "none",
                      background: "var(--primary)",
                      color: "white",
                      cursor: input.trim() && !isTyping ? "pointer" : "not-allowed",
                      opacity: input.trim() && !isTyping ? 1 : 0.5,
                    }}
                  >
                    <Send size={18} strokeWidth={2} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
