import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import TopNav from "../components/layout/TopNav";
import FAB from "../components/layout/FAB";
import { useApp } from "../context/AppContext";
import { formatTime } from "../utils/helpers";
import { getOnThisDay } from "../data/dummyData";
import {
  Brain, Mic, Send, Search, Play, FileText, Image as ImageIcon,
  Video as VideoIcon, CheckSquare, Sparkles
} from "lucide-react";
import { getMediaUrl } from "../api/voice";
import "../styles/global.css";
import "../styles/dashboard.css";

export default function HomePage() {
  const navigate = useNavigate();
  const { state, processChat, selectMemoryContext, dispatch } = useApp();
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [listening, setListening] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const isSubmittingRef = useRef(false);
  // Use state.currentChat from context instead of local state
  // const [localChat, setLocalChat] = useState([]);
  const [chatError, setChatError] = useState(null);
  const [memorySearchResults, setMemorySearchResults] = useState([]);
  const [isSearchingMemories, setIsSearchingMemories] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState(null);
  const [selectedMemory, setSelectedMemory] = useState(null);
  const audioRefs = useRef({});
  const prevAuthRef = useRef(state.isAuthenticated);

  useEffect(() => {
    const wasAuthenticated = prevAuthRef.current;
    const isAuthenticated = state.isAuthenticated;
    // Clear current chat when auth state changes (login/logout)
    if (wasAuthenticated !== isAuthenticated) {
      dispatch({ type: "CLEAR_CURRENT_CHAT" });
      setMemorySearchResults([]);
    }
    prevAuthRef.current = isAuthenticated;
  }, [state.isAuthenticated, dispatch]);

  // Keep the Home chat positioned at the latest message (not the first).
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [state.currentChat, isTyping]);

  const onThisDay = getOnThisDay(state.memories);

  const searchMemories = useCallback((query) => {
    if (!query.trim()) {
      setMemorySearchResults([]);
      dispatch({ type: "SET_MEMORY_SEARCH_RESULTS", payload: [] });
      return;
    }

    setIsSearchingMemories(true);
    const q = query.toLowerCase();

    const results = state.memories
      .filter((m) => !m.deleted)
      .filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.content.toLowerCase().includes(q) ||
          (m.tags && m.tags.some((t) => t.toLowerCase().includes(q))) ||
          (m.category && m.category.toLowerCase().includes(q)) ||
          (m.relatedPerson && m.relatedPerson.toLowerCase().includes(q))
      );

    setMemorySearchResults(results);
    dispatch({ type: "SET_MEMORY_SEARCH_RESULTS", payload: results });
    setIsSearchingMemories(false);
  }, [state.memories, dispatch]);

  const toggleAudioPlay = (memoryId, audioUrl) => {
    if (playingAudioId === memoryId) {
      if (audioRefs.current[memoryId]) {
        audioRefs.current[memoryId].pause();
      }
      setPlayingAudioId(null);
    } else {
      if (playingAudioId && audioRefs.current[playingAudioId]) {
        audioRefs.current[playingAudioId].pause();
      }
      if (audioRefs.current[memoryId]) {
        audioRefs.current[memoryId].play();
        setPlayingAudioId(memoryId);
      }
    }
  };

  const handleAudioEnded = (memoryId) => {
    setPlayingAudioId(null);
  };

  // NOTE: Do NOT load chatHistory into Home chat.
  // Home page shows ONLY the current active chat session.
  // Chat History is accessed separately via /chat-history route.


  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  const toggleListening = async () => {
    if (listening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current.abort();
      }
      setListening(false);
      return;
    }

    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in your browser. Please use Chrome or Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInput(transcript);
    };

    recognition.onend = () => {
      setListening(false);
      const currentInput = inputRef.current?.value;
      if (currentInput && currentInput.trim()) {
        setInput(currentInput);
        handleSendWithText(currentInput);
      }
    };

    recognition.onerror = (event) => {
      setListening(false);
      if (event.error === "not-allowed") {
        alert("Microphone access was denied. Please allow microphone access in your browser settings.");
      } else if (event.error !== "aborted") {
        console.error("Speech recognition error:", event.error);
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setListening(true);
    } catch (error) {
      console.error("Failed to start speech recognition:", error);
      alert("Failed to start voice input. Please try again.");
    }
  };

  const handleSendWithText = async (text) => {
    if (!text.trim()) return;
    // Guard against duplicate submissions from voice/text paths.
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setInput("");
    setChatError(null);
    setMemorySearchResults([]);

    const userMsg = {
      id: `local_${Date.now()}`,
      role: "user",
      content: text.trim(),
      timestamp: new Date().toISOString(),
    };
    dispatch({ type: "ADD_CURRENT_CHAT_MESSAGE", payload: userMsg });
    setIsTyping(true);
    const requestId = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    try {
      const result = await processChat(text, selectedMemory, state.activeConversationId, requestId);
      if (result?.conversationId) {
        dispatch({ type: "SET_ACTIVE_CONVERSATION_ID", payload: result.conversationId });
      }
      if (result?.user) {
        // Replace the temporary local message with the backend message
        dispatch({ type: "REPLACE_CURRENT_CHAT_MESSAGE", payload: { localId: userMsg.id, message: result.user } });
      }
      if (result?.assistant) {
        dispatch({ type: "ADD_CURRENT_CHAT_MESSAGE", payload: result.assistant });
      } else if (result?.error) {
        setChatError(result.error);
      }
    } catch {
      setChatError("Failed to get a response. Please try again.");
    } finally {
      setIsTyping(false);
      isSubmittingRef.current = false;
    }
  };

  const handleVoiceSearch = async (text) => {
    if (!text.trim()) return;
    setInput("");
    setChatError(null);
    setMemorySearchResults([]);

    const userMsg = {
      id: `local_${Date.now()}`,
      role: "user",
      content: text.trim(),
      timestamp: new Date().toISOString(),
    };
    dispatch({ type: "ADD_CURRENT_CHAT_MESSAGE", payload: userMsg });
    searchMemories(text.trim());
  };

  const handleSend = async () => {
    const msg = input.trim();
    if (!msg) return;
    // Guard against duplicate submissions (e.g. rapid Enter presses).
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setInput("");
    setChatError(null);
    setMemorySearchResults([]);

    const userMsg = {
      id: `local_${Date.now()}`,
      role: "user",
      content: msg,
      timestamp: new Date().toISOString(),
    };
    const requestId = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    dispatch({ type: "ADD_CURRENT_CHAT_MESSAGE", payload: userMsg });
    setIsTyping(true);
    try {
      const result = await processChat(msg, selectedMemory, state.activeConversationId, requestId);
      if (result?.conversationId) {
        dispatch({ type: "SET_ACTIVE_CONVERSATION_ID", payload: result.conversationId });
      }
      if (result?.user) {
        // Replace the temporary local message with the backend message
        dispatch({ type: "REPLACE_CURRENT_CHAT_MESSAGE", payload: { localId: userMsg.id, message: result.user } });
      }
      if (result?.assistant) {
        dispatch({ type: "ADD_CURRENT_CHAT_MESSAGE", payload: result.assistant });
      } else if (result?.error) {
        setChatError(result.error);
      }
    } catch {
      setChatError("Failed to get a response. Please try again.");
    } finally {
      setIsTyping(false);
      isSubmittingRef.current = false;
    }
  };

  const handleSelectMemory = async (memoryId) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setMemorySearchResults([]);
    setIsTyping(true);
    try {
      const result = await selectMemoryContext(memoryId, state.activeConversationId);
      if (result?.conversationId) {
        dispatch({ type: "SET_ACTIVE_CONVERSATION_ID", payload: result.conversationId });
      }
      if (result?.assistant) {
        dispatch({ type: "ADD_CURRENT_CHAT_MESSAGE", payload: result.assistant });
        setSelectedMemory(memoryId);
      } else if (result?.error) {
        setChatError(result.error);
      }
    } catch {
      setChatError("Failed to select memory. Please try again.");
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
      <TopNav />
      <div className="main-content home-page">
        {/* Memory Recall - On This Day */}
        {onThisDay && (
          <div className="memory-recall-card" onClick={() => navigate(`/memory/${onThisDay.id}`, { state: { from: "/home" } })}>
            <div className="recall-header">
              <Sparkles size={16} strokeWidth={2} />
              <span className="recall-label">On This Day</span>
            </div>
            <div className="recall-content">
              <div className="recall-title">{onThisDay.title}</div>
              <div className="recall-text">1 year ago today, you saved this memory.</div>
            </div>
            <div className="recall-action">View Memory →</div>
          </div>
        )}

        {/* Memory Search Results */}
        {memorySearchResults.length > 0 && (
          <div className="memory-search-results">
            <div className="search-results-header">
              <Search size={18} strokeWidth={1.5} />
              <span>Found {memorySearchResults.length} memory{memorySearchResults.length !== 1 ? "ies" : "y"}</span>
            </div>
            <div className="memory-search-list">
              {memorySearchResults.map((m) => (
                <div
                  key={m.id}
                  className="memory-search-item"
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <div className="memory-search-media">
                      {m.type === "voice" && (m.mediaUrl || m.mediaData) && (
                        <button
                          className="media-play-btn"
                          onClick={() => toggleAudioPlay(m.id, m.mediaUrl || m.mediaData)}
                          title={playingAudioId === m.id ? "Pause" : "Play audio"}
                        >
                          {playingAudioId === m.id ? (
                            <div className="audio-wave">
                              <span></span><span></span><span></span>
                            </div>
                          ) : (
                            <Play size={16} strokeWidth={2} fill="white" />
                          )}
                        </button>
                      )}
                      {m.type === "image" && (m.mediaUrl || m.mediaData) && (
                        <img src={getMediaUrl(m.mediaUrl || m.mediaData)} alt={m.title} className="memory-search-thumb" />
                      )}
                      {m.type === "video" && (m.mediaUrl || m.mediaData) && (
                        <div className="memory-search-thumb video-thumb">
                          <VideoIcon size={20} strokeWidth={1.5} />
                        </div>
                      )}
                      {m.type === "text" && (
                        <div className="memory-search-thumb text-thumb">
                          <FileText size={20} strokeWidth={1.5} />
                        </div>
                      )}
                      {m.type === "checklist" && (
                        <div className="memory-search-thumb checklist-thumb">
                          <CheckSquare size={20} strokeWidth={1.5} />
                        </div>
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }} onClick={() => handleSelectMemory(m.id)}>
                      <div className="memory-search-item-title">{m.title}</div>
                      <div className="memory-search-item-preview">
                        {m.content ? m.content.substring(0, 100) + (m.content.length > 100 ? "..." : "") : "No content"}
                      </div>
                    </div>
                  </div>

                  {m.type === "voice" && (m.mediaUrl || m.mediaData) && (
                    <audio
                      ref={(el) => {
                        if (el) audioRefs.current[m.id] = el;
                      }}
                      src={getMediaUrl(m.mediaUrl || m.mediaData)}
                      onEnded={() => handleAudioEnded(m.id)}
                      style={{ display: "none" }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hero Section */}
        <div className="hero-section">
          <div className="hero-icon">
            <Brain size={48} strokeWidth={1.5} />
          </div>
          <h1 className="hero-title">MindVault</h1>
          <p className="hero-subtitle">Your Second Brain</p>
          <p className="hero-prompt">What would you like to remember today?</p>
        </div>

        {/* Chat Messages */}
        {state.currentChat.length > 0 && (
          <div className="chat-container">
            <div className="chat-messages">
              {state.currentChat.map((msg) => (
                <div key={msg.id} className={`chat-message ${msg.role}`}>
                  <div className="chat-avatar">
                    {msg.role === "user" ? (
                      state.user?.name?.charAt(0).toUpperCase() || "U"
                    ) : (
                      <Brain size={18} strokeWidth={1.5} />
                    )}
                  </div>
                  <div className="chat-content">
                    <div className="chat-bubble">
                      {msg.content}
                    </div>
                    {msg.selectedMemory && (
                      <div className="chat-memory-reference-list">
                        <button
                          className="chat-memory-reference"
                          onClick={() => navigate(`/memory/${msg.selectedMemory.id}`, { state: { from: "/home" } })}
                          aria-label={`Open memory: ${msg.selectedMemory.title}`}
                          title={`Open memory: ${msg.selectedMemory.title}`}
                        >
                          {msg.selectedMemory.title}
                        </button>
                      </div>
                    )}
                    {!msg.selectedMemory && msg.relatedMemories && msg.relatedMemories.length > 0 && (
                      <div className="chat-sources">
                        <div className="chat-sources-label">Sources</div>
                        <div className="chat-sources-list">
                          {msg.relatedMemories.map((mem) => (
                            <button
                              key={mem.id}
                              className={`chat-source-card ${selectedMemory === mem.id ? "selected" : ""}`}
                              onClick={() => navigate(`/memory/${mem.id}`, { state: { from: "/home" } })}
                              title={mem.title}
                              aria-label={`Open memory: ${mem.title}`}
                            >
                              {mem.title}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="chat-time">{formatTime(msg.timestamp)}</div>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="chat-message assistant">
                  <div className="chat-avatar">
                    <Brain size={18} strokeWidth={1.5} />
                  </div>
                  <div className="chat-bubble">
                    <div className="typing-indicator">
                      <div className="typing-dot" />
                      <div className="typing-dot" />
                      <div className="typing-dot" />
                    </div>
                  </div>
                </div>
              )}

              {chatError && (
                <div className="chat-message assistant">
                  <div className="chat-avatar">
                    <Brain size={18} strokeWidth={1.5} />
                  </div>
                  <div className="chat-bubble chat-error">
                    {chatError}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        {/* Input Bar */}
        <div className="chat-input-wrapper">
          <div className="chat-input-box">
            <textarea
              ref={inputRef}
              className="chat-input"
              placeholder="Type or speak your memory..."
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              className={`chat-mic-btn ${listening ? "recording" : ""}`}
              title={listening ? "Stop listening" : "Start voice input"}
              onClick={toggleListening}
            >
              <Mic size={18} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              className="chat-send-btn"
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              title="Send"
            >
              <Send size={16} strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>
      <FAB />
    </div>
  );
}

