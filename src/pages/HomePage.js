import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import TopNav from "../components/layout/TopNav";
import FAB from "../components/layout/FAB";
import { useApp } from "../context/AppContext";
import { formatTime } from "../utils/helpers";
import { getOnThisDay } from "../data/dummyData";
import {
  Brain, Mic, Send, Search, Play, Pause, FileText, Image as ImageIcon,
  Video as VideoIcon, CheckSquare, Sparkles, ArrowDown, Plus, ArrowUpRight, X
} from "lucide-react";
import { getMediaUrl } from "../api/voice";
import "../styles/global.css";
import "../styles/dashboard.css";

const WAVEFORM_HEIGHTS = [
  6, 10, 14, 8, 18, 12, 22, 16, 24, 14, 10, 18, 20, 12, 8, 16,
  22, 14, 18, 24, 16, 10, 14, 20, 12, 18, 22, 16, 24, 14, 8, 12,
  18, 20, 14, 22, 16, 10, 14, 18, 12, 22, 16, 14, 10, 16, 12, 6
];

function getResolvedMemoryType(memory) {
  if (!memory) return "text";
  const explicitType = memory.type?.toLowerCase();

  // 1. Image
  if (
    explicitType === "image" ||
    memory.imageUrl ||
    (memory.mediaData && memory.mediaData.startsWith("data:image")) ||
    (memory.mediaUrl && memory.mediaUrl.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?.*)?$/i))
  ) {
    return "image";
  }

  // 2. Voice / Audio
  if (
    explicitType === "voice" ||
    explicitType === "audio" ||
    memory.audioUrl ||
    (memory.mediaData && memory.mediaData.startsWith("data:audio")) ||
    (memory.mediaUrl && memory.mediaUrl.match(/\.(mp3|wav|ogg|m4a|aac|weba)(\?.*)?$/i) && explicitType !== "video")
  ) {
    return "voice";
  }

  // 3. Video
  if (
    explicitType === "video" ||
    memory.videoUrl ||
    (memory.mediaUrl && memory.mediaUrl.match(/\.(mp4|webm|mov|mkv)(\?.*)?$/i))
  ) {
    return "video";
  }

  // 4. Checklist
  if (explicitType === "checklist" || Array.isArray(memory.checklist)) {
    return "checklist";
  }

  return explicitType || "text";
}

function InlineVoicePlayer({ memory, onNavigate }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(memory.duration || 0);
  const audioRef = useRef(null);

  const audioSrc = getMediaUrl(memory.mediaUrl || memory.mediaData || memory.audioUrl);

  const togglePlay = (e) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current && audioRef.current.duration) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (e) => {
    e.stopPropagation();
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const formatAudioTime = (seconds) => {
    if (!seconds || isNaN(seconds) || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="inline-memory-bubble-card inline-voice-bubble-card">
      {/* Top Header Badge */}
      <div className="inline-memory-card-header">
        <span className="inline-memory-type-badge">
          <Mic size={13} strokeWidth={2.2} />
          <span>Voice Memo</span>
        </span>
        <span className="inline-memory-card-title">{memory.title || "Voice Note"}</span>
      </div>

      {/* Audio Player Controls */}
      <div className="inline-voice-player">
        {audioSrc && (
          <audio
            ref={audioRef}
            src={audioSrc}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleEnded}
            preload="metadata"
          />
        )}

        <button
          type="button"
          className={`inline-voice-play-btn ${isPlaying ? "playing" : ""}`}
          onClick={togglePlay}
          title={isPlaying ? "Pause" : "Play audio"}
          aria-label={isPlaying ? "Pause audio" : "Play audio"}
        >
          {isPlaying ? (
            <Pause size={15} strokeWidth={2.5} />
          ) : (
            <Play size={15} strokeWidth={2.5} style={{ marginLeft: "2px" }} />
          )}
        </button>

        <div className="inline-voice-progress-container">
          <div className="inline-voice-wave-bars">
            {WAVEFORM_HEIGHTS.map((h, i) => {
              const barPercent = (i / WAVEFORM_HEIGHTS.length) * 100;
              const isPassed = progressPercent >= barPercent;
              return (
                <span
                  key={i}
                  className={`inline-wave-bar ${isPassed ? "active" : ""}`}
                  style={{ height: `${h}px` }}
                />
              );
            })}
          </div>

          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            className="inline-voice-slider"
          />

          <div className="inline-voice-time">
            <span>{formatAudioTime(currentTime)}</span>
            <span>/</span>
            <span>{formatAudioTime(duration)}</span>
          </div>
        </div>
      </div>

      {/* Transcription Text */}
      {memory.content && (
        <div className="inline-voice-transcription">
          <span className="transcription-label">Transcription:</span>
          <span className="transcription-text">{memory.content}</span>
        </div>
      )}

      {/* Secondary Bottom Right Detail Link */}
      <div className="inline-memory-card-footer">
        <button
          type="button"
          className="inline-voice-detail-link"
          onClick={() => onNavigate(`/memory/${memory.id}`, { state: { from: "/home" } })}
        >
          <span>View details</span>
          <ArrowUpRight size={13} strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
}

function InlineImageCard({ memory, onNavigate }) {
  const imgSrc = getMediaUrl(memory.imageUrl || memory.mediaUrl || memory.mediaData);

  return (
    <div className="inline-memory-bubble-card inline-image-bubble-card">
      <div className="inline-memory-card-header">
        <span className="inline-memory-type-badge">
          <ImageIcon size={13} strokeWidth={2} />
          <span>Image Memory</span>
        </span>
        <span className="inline-memory-card-title">{memory.title || "Image"}</span>
      </div>

      {imgSrc && (
        <div className="inline-image-preview-container">
          <img
            src={imgSrc}
            alt={memory.title || "Image memory"}
            className="inline-image-preview"
          />
        </div>
      )}

      {memory.content && (
        <div className="inline-memory-caption">
          <span className="inline-memory-caption-text">{memory.content}</span>
        </div>
      )}

      <div className="inline-memory-card-footer">
        <button
          type="button"
          className="inline-voice-detail-link"
          onClick={() => onNavigate(`/memory/${memory.id}`, { state: { from: "/home" } })}
        >
          <span>View details</span>
          <ArrowUpRight size={13} strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
}

function InlineTextCard({ memory, onNavigate }) {
  const isChecklist = memory.type === "checklist" && Array.isArray(memory.checklist);

  return (
    <div className="inline-memory-bubble-card inline-text-bubble-card">
      <div className="inline-memory-card-header">
        <span className="inline-memory-type-badge">
          {isChecklist ? <CheckSquare size={13} strokeWidth={2} /> : <FileText size={13} strokeWidth={2} />}
          <span>{isChecklist ? "Checklist" : "Note"}</span>
        </span>
        <span className="inline-memory-card-title">{memory.title || "Note"}</span>
      </div>

      <div className="inline-text-preview-container">
        {isChecklist ? (
          <div className="inline-checklist-preview">
            {memory.checklist.slice(0, 4).map((item, idx) => (
              <div key={idx} className="inline-checklist-item">
                <span className={`inline-checklist-bullet ${item.done ? "done" : ""}`}>
                  {item.done ? "✓" : "○"}
                </span>
                <span className={`inline-checklist-text ${item.done ? "done" : ""}`}>
                  {item.text}
                </span>
              </div>
            ))}
            {memory.checklist.length > 4 && (
              <div className="inline-checklist-more">
                +{memory.checklist.length - 4} more items
              </div>
            )}
          </div>
        ) : (
          <div className="inline-text-content">
            {memory.content || "No preview available."}
          </div>
        )}
      </div>

      <div className="inline-memory-card-footer">
        <button
          type="button"
          className="inline-voice-detail-link"
          onClick={() => onNavigate(`/memory/${memory.id}`, { state: { from: "/home" } })}
        >
          <span>View details</span>
          <ArrowUpRight size={13} strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
}

function InlineMemoryRenderer({ memory, onNavigate }) {
  if (!memory) return null;
  const resolvedType = getResolvedMemoryType(memory);

  if (resolvedType === "voice") {
    return <InlineVoicePlayer memory={memory} onNavigate={onNavigate} />;
  }
  if (resolvedType === "image") {
    return <InlineImageCard memory={memory} onNavigate={onNavigate} />;
  }
  return <InlineTextCard memory={memory} onNavigate={onNavigate} />;
}

export default function HomePage() {
  const navigate = useNavigate();
  const { state, processChat, selectMemoryContext, dispatch } = useApp();
  const [loading, setLoading] = useState(!state.dataLoaded && state.loading);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [listening, setListening] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
  const [fileAccept, setFileAccept] = useState("*/*");
  const fileInputRef = useRef(null);
  const attachMenuRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const isSubmittingRef = useRef(false);
  const [chatError, setChatError] = useState(null);
  const [memorySearchResults, setMemorySearchResults] = useState([]);
  const [isSearchingMemories, setIsSearchingMemories] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState(null);
  const [selectedMemory, setSelectedMemory] = useState(null);
  const audioRefs = useRef({});

  // Sync loading state when data is loaded from context
  useEffect(() => {
    if (state.dataLoaded || !state.loading) {
      setLoading(false);
    }
  }, [state.dataLoaded, state.loading]);

  // Click outside to close attachment menu
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target)) {
        setAttachMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, isTyping]);

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
    if (playingAudioId === memoryId) {
      setPlayingAudioId(null);
    }
  };

  const triggerFileSelect = (acceptType) => {
    setFileAccept(acceptType);
    setAttachMenuOpen(false);
    setTimeout(() => {
      if (fileInputRef.current) {
        fileInputRef.current.accept = acceptType;
        fileInputRef.current.click();
      }
    }, 50);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let fileType = "document";
    if (file.type.startsWith("image/")) {
      fileType = "image";
    } else if (file.type.startsWith("audio/")) {
      fileType = "voice";
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAttachedFile({
        file,
        name: file.name,
        size: file.size,
        type: fileType,
        previewUrl: reader.result,
      });
      inputRef.current?.focus();
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Voice Input Setup
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setListening(false);
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setListening(false);
      };

      recognition.onend = () => {
        setListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setListening(true);
      } catch (err) {
        console.error("Failed to start speech recognition:", err);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = async () => {
    const msgText = input.trim();
    if (!msgText && !attachedFile) return;
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    const currentAttachment = attachedFile;
    const promptText = msgText || (currentAttachment ? `Search memories matching attached ${currentAttachment.type}: ${currentAttachment.name}` : "");

    setInput("");
    setAttachedFile(null);
    setChatError(null);
    setMemorySearchResults([]);

    const userMsg = {
      id: `local_${Date.now()}`,
      role: "user",
      content: promptText,
      attachment: currentAttachment,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const result = await processChat(promptText, selectedMemory, messages);
      if (result?.assistant) {
        setMessages((prev) => [...prev, result.assistant]);
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

    // Find the latest user query to ground the selection response
    const lastUserMsg = messages.slice().reverse().find((m) => m.role === "user");
    const userQuery = lastUserMsg?.content || "";

    try {
      const result = await selectMemoryContext(memoryId, userQuery);
      if (result?.assistant) {
        setMessages((prev) => [...prev, result.assistant]);
      } else if (result?.error) {
        setChatError(result.error);
      }
    } catch {
      setChatError("Failed to get response for selected memory.");
    } finally {
      setIsTyping(false);
      isSubmittingRef.current = false;
    }
  };

  const hasMemories = state.memories.some((m) => !m.deleted);
  const isInitialLoading = loading || (!state.dataLoaded && state.loading);
  const isEmptyState = !isInitialLoading && !hasMemories && messages.length === 0;

  return (
    <div className="app">
      <TopNav />
      <div className={`main-content home-page ${isEmptyState ? "is-empty-state" : ""}`}>
        {/* Skeleton Loader during initial data load */}
        {isInitialLoading && (
          <div className="dashboard-skeleton-container">
            <div className="skeleton-hero-icon" />
            <div className="skeleton-line skeleton-title" />
            <div className="skeleton-line skeleton-subtitle" />
            <div className="skeleton-cards-grid">
              <div className="skeleton-card" />
              <div className="skeleton-card" />
              <div className="skeleton-card" />
            </div>
          </div>
        )}

        {/* Memory Recall - On This Day (Only shown if memories exist) */}
        {!isInitialLoading && hasMemories && onThisDay && (
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
                          className={`memory-search-play-btn ${playingAudioId === m.id ? "playing" : ""}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleAudioPlay(m.id, m.mediaUrl || m.mediaData);
                          }}
                          title={playingAudioId === m.id ? "Pause" : "Play voice memory"}
                        >
                          {playingAudioId === m.id ? (
                            <span className="pause-icon">❚❚</span>
                          ) : (
                            <Play size={14} fill="currentColor" />
                          )}
                        </button>
                      )}
                      {m.type === "image" && (m.mediaUrl || m.mediaData) && (
                        <img
                          src={getMediaUrl(m.mediaUrl || m.mediaData)}
                          alt={m.title}
                          className="memory-search-thumb"
                        />
                      )}
                      {m.type === "video" && (m.mediaUrl || m.mediaData) && (
                        <div className="memory-search-video-badge">
                          <VideoIcon size={16} />
                        </div>
                      )}
                      {m.type === "checklist" && (
                        <div className="memory-search-checklist-badge">
                          <CheckSquare size={16} />
                        </div>
                      )}
                      {m.type === "text" && (
                        <div className="memory-search-text-badge">
                          <FileText size={16} />
                        </div>
                      )}
                    </div>
                    <div
                      className="memory-search-item-info"
                      onClick={() => navigate(`/memory/${m.id}`, { state: { from: "/home" } })}
                      style={{ cursor: "pointer", flex: 1 }}
                    >
                      <div className="memory-search-item-title">{m.title}</div>
                      <div className="memory-search-item-preview">
                        {m.content ? m.content.substring(0, 100) + (m.content.length > 100 ? "..." : "") : "No content"}
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
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State Onboarding View */}
        {isEmptyState && (
          <div className="empty-vault-onboarding">
            <div className="empty-vault-illustration-container">
              <svg
                className="empty-vault-illustration"
                viewBox="0 0 280 180"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <linearGradient id="vaultAura" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.14" />
                    <stop offset="100%" stopColor="#0F2F5B" stopOpacity="0.03" />
                  </linearGradient>
                  <linearGradient id="accentBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#2563eb" />
                    <stop offset="100%" stopColor="#0F2F5B" />
                  </linearGradient>
                  <linearGradient id="softBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#60a5fa" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>

                {/* Soft ambient backdrop glow */}
                <ellipse cx="140" cy="95" rx="85" ry="65" fill="url(#vaultAura)" />

                {/* Modern clean shelf platform */}
                <rect x="40" y="140" width="200" height="12" rx="6" fill="#e2e8f0" />
                <line x1="48" y1="140" x2="232" y2="140" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />

                {/* Stylized Book 1 (Left) */}
                <rect x="68" y="85" width="22" height="55" rx="4" fill="#0F2F5B" />
                <rect x="73" y="93" width="12" height="3" rx="1.5" fill="#60a5fa" />

                {/* Stylized Book 2 (Left-Mid) */}
                <rect x="94" y="95" width="18" height="45" rx="3" fill="#2563eb" />
                <rect x="98" y="102" width="10" height="3" rx="1.5" fill="#bfdbfe" />

                {/* Centerpiece: Clean Open Memory Canvas / Journal */}
                <rect x="118" y="65" width="84" height="75" rx="8" fill="#ffffff" stroke="#93c5fd" strokeWidth="2.5" />
                <line x1="160" y1="66" x2="160" y2="139" stroke="#bfdbfe" strokeWidth="1.5" strokeDasharray="3 3" />
                
                {/* Journal content lines */}
                <rect x="127" y="80" width="24" height="4" rx="2" fill="#bfdbfe" />
                <rect x="127" y="90" width="20" height="3" rx="1.5" fill="#dbeafe" />
                <rect x="127" y="98" width="22" height="3" rx="1.5" fill="#dbeafe" />

                <rect x="168" y="80" width="24" height="4" rx="2" fill="#bfdbfe" />
                <rect x="168" y="90" width="22" height="3" rx="1.5" fill="#dbeafe" />
                <rect x="168" y="98" width="18" height="3" rx="1.5" fill="#dbeafe" />

                {/* Stylized Leaning Book (Right) */}
                <g transform="translate(206, 92) rotate(16)">
                  <rect x="0" y="0" width="20" height="48" rx="4" fill="#3b82f6" />
                  <rect x="4" y="8" width="12" height="3" rx="1.5" fill="#dbeafe" />
                </g>

                {/* Stylized Floating Star / Sparkle Accents */}
                <g transform="translate(75, 48)">
                  <path d="M7 0L8.6 4.6L13.2 6.2L8.6 7.8L7 12.4L5.4 7.8L0.8 6.2L5.4 4.6L7 0Z" fill="#2563eb" />
                </g>
                <g transform="translate(210, 52)">
                  <path d="M5.5 0L6.7 3.6L10.3 4.8L6.7 6L5.5 9.6L4.3 6L0.7 4.8L4.3 3.6L5.5 0Z" fill="#60a5fa" />
                </g>
                <circle cx="138" cy="38" r="3" fill="#93c5fd" />
              </svg>
            </div>

            <h1 className="empty-vault-title">Your Vault is Empty</h1>
            <p className="empty-vault-subtitle">
              This is where your saved memories, thoughts, and ideas will live. Let's capture your first one right now!
            </p>

            {/* Illustrative Starting Point Cards */}
            <div className="empty-vault-cards">
              <button
                type="button"
                className="empty-vault-card"
                onClick={() => {
                  setInput("Remember that ");
                  inputRef.current?.focus();
                }}
              >
                <span className="empty-card-icon">💡</span>
                <span className="empty-card-text">Try a quick note</span>
              </button>

              <button
                type="button"
                className="empty-vault-card"
                onClick={() => {
                  setInput("Save link: ");
                  inputRef.current?.focus();
                }}
              >
                <span className="empty-card-icon">🔗</span>
                <span className="empty-card-text">Save a link</span>
              </button>

              <button
                type="button"
                className="empty-vault-card"
                onClick={() => {
                  toggleListening();
                }}
              >
                <span className="empty-card-icon">🎙️</span>
                <span className="empty-card-text">Record a voice thought</span>
              </button>
            </div>

            {/* Visual Downward Guide Arrow */}
            <div className="empty-vault-guide">
              <span className="guide-text">Type below or use voice to capture your first memory</span>
              <div className="guide-arrow-bounce">
                <ArrowDown size={18} strokeWidth={2.5} />
              </div>
            </div>
          </div>
        )}

        {/* Hero Section (Only shown when memories exist, no chat is active, and initial loading is complete) */}
        {!isInitialLoading && hasMemories && messages.length === 0 && (
          <div className="hero-section">
            <div className="hero-icon">
              <Brain size={48} strokeWidth={1.5} />
            </div>
            <h1 className="hero-title">MindVault</h1>
            <p className="hero-subtitle">Your Second Brain</p>
            <p className="hero-prompt">What would you like to remember today?</p>
          </div>
        )}

        {/* Chat Messages */}
        {messages.length > 0 && (
          <div className="chat-container">
            <div className="chat-messages">
              {messages.map((msg) => {
                const referencedMemId = msg.selectedMemory?.id || (msg.relatedMemories?.length === 1 ? msg.relatedMemories[0].id : null);
                const matchedMem = referencedMemId ? state.memories.find((m) => m.id === referencedMemId) : null;

                return (
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
                        {/* If user attached a file, show the preview inside user message */}
                        {msg.attachment && (
                          <div className="chat-user-attachment">
                            {msg.attachment.type === "image" ? (
                              <img src={msg.attachment.previewUrl} alt={msg.attachment.name} className="chat-user-attachment-img" />
                            ) : (
                              <div className="chat-user-attachment-file">
                                {msg.attachment.type === "voice" ? <Mic size={14} /> : <FileText size={14} />}
                                <span>{msg.attachment.name}</span>
                              </div>
                            )}
                          </div>
                        )}
                        {msg.content}
                      </div>

                      {/* Render Type-Based Inline Memory Card (Voice / Image / Note) */}
                      {matchedMem && (
                        <InlineMemoryRenderer
                          memory={matchedMem}
                          onNavigate={navigate}
                        />
                      )}

                      {/* If no single matched memory but multiple sources require selection */}
                      {!matchedMem && !msg.selectedMemory && msg.relatedMemories && msg.relatedMemories.length > 0 && (
                        msg.requiresSelection ? (
                          <div className="chat-sources">
                            <div className="chat-sources-label">Select a memory</div>
                            <div className="chat-sources-list">
                              {msg.relatedMemories.map((mem) => (
                                <button
                                  key={mem.id}
                                  className={`chat-source-card ${selectedMemory === mem.id ? "selected" : ""}`}
                                  onClick={() => handleSelectMemory(mem.id)}
                                  title={mem.title}
                                  aria-label={`Choose memory: ${mem.title}`}
                                >
                                  {mem.title}
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="chat-sources">
                            <div className="chat-sources-label">Sources</div>
                            <div className="chat-sources-list">
                              {msg.relatedMemories.map((mem) => (
                                <button
                                  key={mem.id}
                                  className={`chat-source-card ${selectedMemory === mem.id ? "selected" : ""}`}
                                  onClick={() => handleSelectMemory(mem.id)}
                                  title={mem.title}
                                  aria-label={`Use memory: ${mem.title}`}
                                >
                                  {mem.title}
                                </button>
                              ))}
                            </div>
                          </div>
                        )
                      )}
                      <div className="chat-time">{formatTime(msg.timestamp)}</div>
                    </div>
                  </div>
                );
              })}

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
          <input
            ref={fileInputRef}
            type="file"
            accept={fileAccept}
            style={{ display: "none" }}
            onChange={handleFileChange}
          />

          {/* Attachment Preview Chip */}
          {attachedFile && (
            <div className="chat-attachment-chip">
              {attachedFile.type === "image" ? (
                <img src={attachedFile.previewUrl} alt={attachedFile.name} className="attachment-chip-thumb" />
              ) : attachedFile.type === "voice" ? (
                <div className="attachment-chip-icon-box"><Mic size={14} /></div>
              ) : (
                <div className="attachment-chip-icon-box"><FileText size={14} /></div>
              )}
              <div className="attachment-chip-info">
                <span className="attachment-chip-name">{attachedFile.name}</span>
                <span className="attachment-chip-size">
                  {(attachedFile.size / 1024).toFixed(0)} KB
                </span>
              </div>
              <button
                type="button"
                className="attachment-chip-remove"
                onClick={() => setAttachedFile(null)}
                title="Remove attachment"
                aria-label="Remove attachment"
              >
                <X size={14} />
              </button>
            </div>
          )}

          <div className={`chat-input-box capsule-input-bar ${isEmptyState ? "empty-onboarding-input" : ""}`}>
            <div className="chat-add-btn-wrapper" ref={attachMenuRef}>
              <button
                type="button"
                className="chat-add-btn"
                onClick={() => setAttachMenuOpen((prev) => !prev)}
                title="Attach file or media to search"
                aria-label="Attach file or media to search"
              >
                <Plus size={18} strokeWidth={2.5} style={{ transform: attachMenuOpen ? "rotate(45deg)" : "none", transition: "transform 0.2s" }} />
              </button>

              {/* Attachment Options Popover */}
              {attachMenuOpen && (
                <div className="chat-attachment-popover">
                  <button
                    type="button"
                    className="attachment-popover-item"
                    onClick={() => triggerFileSelect("image/*")}
                  >
                    <span className="attachment-popover-icon"><ImageIcon size={16} /></span>
                    <span className="attachment-popover-text">Upload Image</span>
                  </button>
                  <button
                    type="button"
                    className="attachment-popover-item"
                    onClick={() => triggerFileSelect("audio/*")}
                  >
                    <span className="attachment-popover-icon"><Mic size={16} /></span>
                    <span className="attachment-popover-text">Upload Audio</span>
                  </button>
                  <button
                    type="button"
                    className="attachment-popover-item"
                    onClick={() => triggerFileSelect(".pdf,.doc,.docx,.txt,.md,application/pdf,text/*")}
                  >
                    <span className="attachment-popover-icon"><FileText size={16} /></span>
                    <span className="attachment-popover-text">Upload Document/File</span>
                  </button>
                </div>
              )}
            </div>

            <textarea
              ref={inputRef}
              className="chat-input"
              placeholder={attachedFile ? `Ask about "${attachedFile.name}"...` : "Type or speak your memory..."}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <div className="chat-input-actions-right">
              <button
                type="button"
                className={`chat-mic-btn ${listening ? "recording" : ""}`}
                title={listening ? "Stop listening" : "Start voice input"}
                onClick={toggleListening}
              >
                <Mic size={18} strokeWidth={1.75} />
              </button>
              <button
                type="button"
                className="chat-send-btn"
                onClick={handleSend}
                disabled={(!input.trim() && !attachedFile) || isTyping}
                title="Send"
              >
                <Send size={16} strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Button (Only present when memories exist to avoid competing triggers) */}
      {hasMemories && <FAB />}
    </div>
  );
}
