import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { formatTime, formatDate } from "../utils/helpers";
import { ArrowLeft, MessageSquare, Search, Trash2, X } from "lucide-react";
import "../styles/global.css";
import "../styles/pages.css";

export default function ChatHistoryPage() {
  const navigate = useNavigate();
  const { state, loadChatHistory, deleteConversation } = useApp();
  const chatHistory = state.chatHistory;
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [showSearch, setShowSearch] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState(null);

  useEffect(() => {
    loadChatHistory();
  }, [loadChatHistory]);

  // Group messages into conversations
  const conversations = useMemo(() => {
    if (!chatHistory || chatHistory.length === 0) return [];

    const groups = [];
    let currentGroup = null;
    const GROUP_GAP_MS = 5 * 60 * 1000; // 5 minutes gap to start new conversation

    chatHistory.forEach((msg) => {
      const msgTime = new Date(msg.timestamp).getTime();

      if (!currentGroup || msgTime - currentGroup.lastTimestamp > GROUP_GAP_MS) {
        // Start new conversation
        currentGroup = {
          id: msg.id,
          messages: [msg],
          firstTimestamp: msgTime,
          lastTimestamp: msgTime,
          preview: msg.content,
        };
        groups.push(currentGroup);
      } else {
        // Add to existing conversation
        currentGroup.messages.push(msg);
        currentGroup.lastTimestamp = msgTime;
        // Update preview to last user message
        if (msg.role === "user") {
          currentGroup.preview = msg.content;
        }
      }
    });

    return groups.reverse(); // Newest first
  }, [chatHistory]);

  // Filter conversations by date
  const filteredConversations = useMemo(() => {
    if (dateFilter === "all") return conversations;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    return conversations.filter((conv) => {
      const convDate = new Date(conv.firstTimestamp);
      if (dateFilter === "today") return convDate >= today;
      if (dateFilter === "yesterday") return convDate >= yesterday && convDate < today;
      if (dateFilter === "week") return convDate >= weekAgo;
      return true;
    });
  }, [conversations, dateFilter]);

  // Filter by search query
  const searchedConversations = useMemo(() => {
    if (!searchQuery.trim()) return filteredConversations;

    const query = searchQuery.toLowerCase();
    return filteredConversations.filter((conv) => {
      // Search in conversation preview
      if (conv.preview.toLowerCase().includes(query)) return true;
      // Search in any message content
      return conv.messages.some((msg) => msg.content.toLowerCase().includes(query));
    });
  }, [filteredConversations, searchQuery]);

  const handleDeleteClick = (conv) => {
    if (!deletingId) {
      setConversationToDelete(conv);
      setShowDeleteModal(true);
    }
  };

  const handleDeleteConfirm = async () => {
    if (deletingId || !conversationToDelete) return;

    setDeletingId(conversationToDelete.id);
    setShowDeleteModal(false);

    // Extract all message IDs from the conversation
    const messageIds = conversationToDelete.messages.map(msg => msg.id);

    const result = await deleteConversation(conversationToDelete.id, messageIds);

    setDeletingId(null);
    setConversationToDelete(null);

    if (result.error) {
      alert("Sorry, we couldn't delete this conversation. Please try again.");
    }
  };

  const handleDeleteCancel = () => {
    if (!deletingId) {
      setShowDeleteModal(false);
      setConversationToDelete(null);
    }
  };

  return (
    <div className="app">
      <div className="page-wrapper">
        <div className="main-content">
          <div className="page-header-row">
            <button className="back-btn" onClick={() => navigate("/home")}>
              <ArrowLeft size={16} strokeWidth={1.5} />
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <MessageSquare size={24} strokeWidth={1.5} />
              <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                Chat History
              </h1>
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: 0 }}>
              Review your past conversations with MindVault
            </p>
          </div>

          {/* Search and Filter Bar */}
          <div style={{ marginBottom: 20, display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Search Toggle and Date Filter */}
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button
                className="filter-chip"
                onClick={() => setShowSearch(!showSearch)}
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                <Search size={14} strokeWidth={1.5} />
                Search
              </button>

              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                style={{
                  padding: "7px 12px",
                  borderRadius: "var(--radius-full)",
                  fontSize: 13,
                  fontWeight: 500,
                  border: "1px solid var(--border-color)",
                  color: "var(--text-secondary)",
                  background: "var(--card-bg)",
                  cursor: "pointer",
                }}
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="week">Past Week</option>
              </select>
            </div>

            {/* Search Input */}
            {showSearch && (
              <div style={{ position: "relative" }}>
                <Search
                  size={16}
                  strokeWidth={1.5}
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-tertiary)",
                  }}
                />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 36px 10px 36px",
                    borderRadius: "var(--radius-xl)",
                    border: "1.5px solid var(--border-color)",
                    fontSize: 14,
                    color: "var(--text-primary)",
                    background: "var(--card-bg)",
                    outline: "none",
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    style={{
                      position: "absolute",
                      right: 10,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: "var(--text-tertiary)",
                      cursor: "pointer",
                      padding: 4,
                    }}
                  >
                    <X size={16} strokeWidth={1.5} />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Results Count */}
          {(searchQuery || dateFilter !== "all") && (
            <div style={{ fontSize: 13, color: "var(--text-tertiary)", marginBottom: 16 }}>
              {searchedConversations.length} conversation{searchedConversations.length !== 1 ? "s" : ""} found
            </div>
          )}

          {/* Conversations List */}
          {searchedConversations.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <MessageSquare size={48} strokeWidth={1.5} />
              </div>
              <div className="empty-state-title">
                {chatHistory.length === 0 ? "No chat history yet" : "No conversations found"}
              </div>
              <div className="empty-state-text">
                {chatHistory.length === 0
                  ? "Start a conversation on the home page to see your chat history here."
                  : "Try adjusting your search or filters."}
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {searchedConversations.map((conv) => {
                const firstUserMsg = conv.messages.find((m) => m.role === "user");
                const assistantResponses = conv.messages.filter((m) => m.role === "assistant");
                const hasRelatedMemories = assistantResponses.some(
                  (m) => m.relatedMemories && m.relatedMemories.length > 0
                );

                return (
                  <div
                    key={conv.id}
                    className="card"
                    style={{
                      padding: 16,
                      cursor: "pointer",
                      transition: "all var(--transition-fast)",
                    }}
                    onClick={() => navigate("/home")}
                  >
                    {/* Conversation Header */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        marginBottom: 10,
                        gap: 12,
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: "var(--text-primary)",
                            marginBottom: 4,
                            lineHeight: 1.4,
                          }}
                        >
                          {firstUserMsg ? firstUserMsg.content : "Conversation"}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: "var(--text-tertiary)",
                          }}
                        >
                          {formatDate(conv.firstTimestamp)} · {conv.messages.length} message
                          {conv.messages.length !== 1 ? "s" : ""}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(conv);
                        }}
                        disabled={deletingId === conv.id}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--danger)",
                          cursor: deletingId === conv.id ? "not-allowed" : "pointer",
                          padding: 4,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          opacity: deletingId === conv.id ? 0.5 : 1,
                        }}
                        title="Delete conversation"
                      >
                        <Trash2 size={16} strokeWidth={1.5} />
                      </button>
                    </div>

                    {/* Preview */}
                    <div
                      style={{
                        fontSize: 13,
                        color: "var(--text-secondary)",
                        lineHeight: 1.5,
                        marginBottom: hasRelatedMemories ? 10 : 0,
                      }}
                    >
                      {conv.preview.length > 120
                        ? conv.preview.substring(0, 120) + "..."
                        : conv.preview}
                    </div>

                    {/* Related Memories */}
                    {hasRelatedMemories && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {assistantResponses
                          .filter((m) => m.relatedMemories && m.relatedMemories.length > 0)
                          .slice(0, 1) // Show memories from first response only
                          .flatMap((m) => m.relatedMemories)
                          .slice(0, 3)
                          .map((mem) => (
                            <button
                              key={mem.id}
                              className="related-memory-chip"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/memory/${mem.id}`);
                              }}
                              title={mem.preview}
                            >
                              {mem.title}
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {showDeleteModal && conversationToDelete && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0, 0, 0, 0.5)",
                backdropFilter: "blur(4px)",
                zIndex: 1000,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 16,
                animation: "fadeIn 0.2s ease",
              }}
              onClick={handleDeleteCancel}
            >
              <div
                style={{
                  background: "var(--card-bg)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--radius-lg)",
                  padding: "24px",
                  width: "100%",
                  maxWidth: "400px",
                  boxShadow: "var(--shadow-xl)",
                  animation: "modalSlideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  style={{
                    fontSize: "18px",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    marginBottom: "12px",
                  }}
                >
                  Delete this conversation?
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    color: "var(--text-secondary)",
                    lineHeight: 1.6,
                    marginBottom: "24px",
                  }}
                >
                  This conversation will be removed from your chat history. Your memories will not be affected.
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    justifyContent: "flex-end",
                  }}
                >
                  <button
                    onClick={handleDeleteCancel}
                    disabled={deletingId}
                    style={{
                      padding: "10px 20px",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "var(--text-secondary)",
                      background: "var(--bg-secondary)",
                      border: "1px solid var(--border-color)",
                      cursor: deletingId ? "not-allowed" : "pointer",
                      opacity: deletingId ? 0.5 : 1,
                      transition: "all var(--transition-fast)",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    disabled={deletingId}
                    style={{
                      padding: "10px 20px",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "white",
                      background: deletingId ? "var(--text-tertiary)" : "var(--danger)",
                      border: "none",
                      cursor: deletingId ? "not-allowed" : "pointer",
                      opacity: deletingId ? 0.5 : 1,
                      transition: "all var(--transition-fast)",
                    }}
                  >
                    {deletingId ? "Deleting..." : "Delete"}
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