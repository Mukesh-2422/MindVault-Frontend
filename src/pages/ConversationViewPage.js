import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { useAppBackNavigation } from "../utils/useAppBackNavigation";
import * as chatApi from "../api/chat";
import { ArrowLeft, MessageSquare, Brain, Send } from "lucide-react";
import "../styles/global.css";
import "../styles/pages.css";

export default function ConversationViewPage() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { state, processChat } = useApp();
  const goBack = useAppBackNavigation("/chat-history");
  const messagesEndRef = useRef(null);
  const isSubmittingRef = useRef(false);
  const convIdRef = useRef(conversationId);

  // Local conversation messages. SEPARATE from Home page currentChat so
  // viewing a history conversation never pollutes the active Home session.
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const loadConversation = useCallback(async (id) => {
    setLoading(true);
    setLoadError(null);
    try {
      const conversation = await chatApi.getConversation(id);
      convIdRef.current = conversation.id || id;
      setMessages(conversation.messages || []);
    } catch (err) {
      setLoadError(err.message || "Failed to load conversation.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (conversationId && state.isAuthenticated) {
      loadConversation(conversationId);
    }
  }, [conversationId, state.isAuthenticated, loadConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isTyping]);

  const handleSend = async () => {
    const msg = input.trim();
    if (!msg) return;
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setInput("");

    const userMsg = {
      id: `local_${Date.now()}`,
      role: "user",
      content: msg,
      timestamp: new Date().toISOString(),
    };
    const requestId = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);
    try {
      const result = await processChat(msg, null, convIdRef.current, requestId);
      if (result?.conversationId) convIdRef.current = result.conversationId;
      if (result?.user) {
        setMessages((prev) => prev.map((m) => (m.id === userMsg.id ? result.user : m)));
      }
      if (result?.assistant) {
        setMessages((prev) => [...prev, result.assistant]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: `local_err_${Date.now()}`, role: "assistant", content: "Failed to get a response. Please try again.", timestamp: new Date().toISOString() },
      ]);
    } finally {
      setIsTyping(false);
      isSubmittingRef.current = false;
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

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

          {loading ? (
            <div className="empty-state">
              <div className="empty-state-text">Loading conversation...</div>
            </div>
          ) : loadError ? (
            <div className="empty-state">
              <div className="empty-state-text">{loadError}</div>
            </div>
          ) : messages.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <MessageSquare size={48} strokeWidth={1.5} />
              </div>
              <div className="empty-state-title">No messages</div>
              <div className="empty-state-text">This conversation is empty or could not be loaded.</div>
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
                          <button className="chat-memory-reference" onClick={() => navigate(`/memory/${msg.selectedMemory.id}`)}>
                            {msg.selectedMemory.title}
                          </button>
                        </div>
                      )}
                      {msg.relatedMemories && msg.relatedMemories.length > 0 && (
                        <div className="chat-memory-reference-list">
                          {msg.relatedMemories.map((mem) => (
                            <button key={mem.id} className="chat-memory-reference" onClick={() => navigate(`/memory/${mem.id}`)}>
                              {mem.title}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="chat-message assistant">
                    <div className="chat-avatar"><Brain size={18} strokeWidth={1.5} /></div>
                    <div className="chat-bubble">
                      <div className="typing-indicator">
                        <div className="typing-dot" />
                        <div className="typing-dot" />
                        <div className="typing-dot" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              <div className="chat-input-area">
                <div className="chat-input-wrapper">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Continue this conversation..."
                    rows={1}
                    style={{
                      width: "100%", padding: "12px 16px", borderRadius: "var(--radius-full)",
                      border: "1px solid var(--border-color)", fontSize: 14, color: "var(--text-primary)",
                      background: "var(--card-bg)", outline: "none", resize: "none",
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!input.trim() || isTyping}
                    style={{
                      padding: "10px 16px", borderRadius: "var(--radius-full)", border: "none",
                      background: "var(--primary)", color: "white",
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
