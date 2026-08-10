import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import TopNav from "../components/layout/TopNav";
import { useApp } from "../context/AppContext";
import { togglePinMemory, deleteMemory, updateMemory, getMemory, moveMemoryToVault } from "../api/memories";
import {
  formatFullDate, formatTime, getMemoryTypeIcon, truncate,
} from "../utils/helpers";
import {
  ArrowLeft, Pin, MoreHorizontal, Download, Lock, Trash2, Play, Square, Folder, User, Search,
  FileText, Copy, Image as ImageIcon, Mic, Video as VideoIcon, CheckSquare,
} from "lucide-react";
import jsPDF from "jspdf";
import { getMediaUrl } from "../api/voice";
import "../styles/global.css";
import "../styles/pages.css";

export default function MemoryViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const [moreOpen, setMoreOpen] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState("");
  const audioRef = useRef(null);
  const moreRef = useRef(null);
  const titleInputRef = useRef(null);
  const contentInputRef = useRef(null);
  const autoSaveTimerRef = useRef(null);

  const memory = state.memories.find((m) => m.id === id);

  useEffect(() => {
    const handleClick = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (isEditing && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [isEditing]);

  // Auto-resize the content textarea to fit its content (no large empty box)
  useEffect(() => {
    if (isEditing && contentInputRef.current) {
      const el = contentInputRef.current;
      el.style.height = "auto";
      el.style.height = el.scrollHeight + "px";
    }
  }, [isEditing, editContent]);

  if (!memory) {
    return (
      <div className="app">
        <TopNav />
        <div className="main-content">
          <div className="empty-state">
            <div className="empty-state-icon"><Search size={48} strokeWidth={1.5} /></div>
            <p className="empty-state-title">Memory not found</p>
            <button className="btn btn-secondary btn-sm" style={{ marginTop: 16 }} onClick={() => navigate(-1)}>Go Back</button>
          </div>
        </div>
      </div>
    );
  }

  const relatedMemories = [];

  const handleDelete = async () => {
    try {
      await deleteMemory(memory.id);
      dispatch({ type: "DELETE_MEMORY", payload: memory.id });
      navigate(-1);
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handlePin = async () => {
    try {
      const updated = await togglePinMemory(memory.id);
      dispatch({ type: "TOGGLE_PIN", payload: memory.id });
    } catch (err) {
      console.error("Pin toggle failed:", err);
    }
  };

  const startEditing = () => {
    setEditTitle(memory.title);
    setEditContent(memory.content || "");
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditTitle("");
    setEditContent("");
    setAutoSaveStatus("");
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
  };

  const performSave = async () => {
    if (!editTitle.trim() && !editContent.trim()) {
      cancelEditing();
      return;
    }
    setSaving(true);
    setAutoSaveStatus("Saving...");
    try {
      await updateMemory(memory.id, {
        title: editTitle.trim() || memory.title,
        content: editContent.trim(),
        date: new Date().toISOString(),
      });
      // Fetch the updated memory to ensure we have the latest data
      const updated = await getMemory(memory.id);
      console.log("Updated memory:", updated);
      dispatch({ type: "UPDATE_MEMORY", payload: updated });
      setAutoSaveStatus("Saved");
      setTimeout(() => setAutoSaveStatus(""), 2000);
    } catch (err) {
      console.error("Update failed:", err);
      setAutoSaveStatus("Failed to save");
      alert("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const saveEdits = async () => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    await performSave();
    setIsEditing(false);
    setEditTitle("");
    setEditContent("");
  };

  const triggerAutoSave = () => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    autoSaveTimerRef.current = setTimeout(() => {
      performSave();
    }, 1500);
  };

  const handleTitleChange = (e) => {
    setEditTitle(e.target.value);
    triggerAutoSave();
  };

  const handleContentChange = (e) => {
    setEditContent(e.target.value);
    triggerAutoSave();
  };

  const togglePlay = async () => {
    if (!audioRef.current) {
      console.error("Audio ref not found");
      return;
    }
    
    try {
      if (playing) {
        audioRef.current.pause();
        setPlaying(false);
      } else {
        // Ensure audio is ready
        if (audioRef.current.readyState < 2) {
          await new Promise((resolve, reject) => {
            const onCanPlay = () => {
              audioRef.current.removeEventListener('canplay', onCanPlay);
              audioRef.current.removeEventListener('error', onError);
              resolve();
            };
            const onError = (err) => {
              audioRef.current.removeEventListener('canplay', onCanPlay);
              audioRef.current.removeEventListener('error', onError);
              reject(new Error('Audio failed to load'));
            };
            audioRef.current.addEventListener('canplay', onCanPlay);
            audioRef.current.addEventListener('error', onError);
          });
        }
        await audioRef.current.play();
        setPlaying(true);
      }
    } catch (err) {
      console.error("Playback error:", err);
      alert("Unable to play audio. The file may be corrupted or the browser blocked autoplay.");
      setPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    setAudioDuration(audioRef.current.duration);
  };

  const handleEnded = () => {
    setPlaying(false);
    setCurrentTime(0);
  };

  const formatAudioTime = (sec) => {
    if (!sec || isNaN(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const cycleSpeed = () => {
    const speeds = [0.5, 1, 1.5, 2];
    const next = speeds[(speeds.indexOf(speed) + 1) % speeds.length];
    setSpeed(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = x / rect.width;
    if (audioRef.current) {
      audioRef.current.currentTime = pct * audioDuration;
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  // ===== Export Functions =====

  const getMemoryTextContent = () => {
    let text = `${memory.title}\n`;
    text += `${formatFullDate(memory.date)} at ${formatTime(memory.date)}\n`;
    text += `${"=".repeat(40)}\n\n`;
    if (memory.type === "checklist" && memory.checklist) {
      memory.checklist.forEach((item) => {
        text += `${item.done ? "[x]" : "[ ]"} ${item.text}\n`;
      });
    } else {
      text += `${memory.content || ""}\n`;
    }
    if (memory.tags && memory.tags.length > 0) {
      text += `\n${"=".repeat(40)}\nTags: ${memory.tags.join(", ")}\n`;
    }
    return text;
  };

  const exportAsPDF = () => {
    setMoreOpen(false);
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - margin * 2;
    let y = 20;

    // Title
    doc.setFontSize(20);
    doc.setFont(undefined, "bold");
    const titleLines = doc.splitTextToSize(memory.title, maxWidth);
    doc.text(titleLines, margin, y);
    y += titleLines.length * 10 + 4;

    // Date
    doc.setFontSize(10);
    doc.setFont(undefined, "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(`${formatFullDate(memory.date)} at ${formatTime(memory.date)}`, margin, y);
    y += 8;

    // Divider
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    // Content
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    if (memory.type === "checklist" && memory.checklist) {
      memory.checklist.forEach((item) => {
        const prefix = item.done ? "[x] " : "[ ] ";
        const lines = doc.splitTextToSize(prefix + item.text, maxWidth);
        if (y + lines.length * 7 > doc.internal.pageSize.getHeight() - 20) {
          doc.addPage();
          y = 20;
        }
        doc.text(lines, margin, y);
        y += lines.length * 7 + 2;
      });
    } else {
      const contentLines = doc.splitTextToSize(memory.content || "", maxWidth);
      contentLines.forEach((line) => {
        if (y > doc.internal.pageSize.getHeight() - 20) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, margin, y);
        y += 7;
      });
    }

    // Tags
    if (memory.tags && memory.tags.length > 0) {
      y += 6;
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y, pageWidth - margin, y);
      y += 8;
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Tags: ${memory.tags.join(", ")}`, margin, y);
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text("MindVault - Your personal memory space", margin, doc.internal.pageSize.getHeight() - 10);
    }

    doc.save(`${memory.title.replace(/[^a-z0-9]/gi, "_")}.pdf`);
  };

  const exportAsDocument = () => {
    setMoreOpen(false);
    const content = getMemoryTextContent();
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${memory.title.replace(/[^a-z0-9]/gi, "_")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyAsText = async () => {
    setMoreOpen(false);
    const content = getMemoryTextContent();
    try {
      await navigator.clipboard.writeText(content);
      alert("Memory copied to clipboard!");
    } catch (err) {
      // Fallback
      const textarea = document.createElement("textarea");
      textarea.value = content;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      alert("Memory copied to clipboard!");
    }
  };

  const downloadMedia = () => {
    setMoreOpen(false);
    const mediaUrl = memory.mediaUrl || memory.mediaData;
    if (!mediaUrl) {
      alert("No media file available to download.");
      return;
    }
    const a = document.createElement("a");
    a.href = mediaUrl;
    const ext = memory.type === "image" ? "png" : memory.type === "voice" ? "mp3" : "mp4";
    a.download = `${memory.title.replace(/[^a-z0-9]/gi, "_")}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="app">
      <TopNav />
      <div className="main-content memory-view-page">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 16, paddingBottom: 8 }}>
          <button className="back-btn" onClick={() => navigate("/collections")}>
            <ArrowLeft size={16} strokeWidth={1.5} />
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button className="editor-nav-btn" onClick={handlePin} style={{ color: memory.pinned ? "#EAB308" : "var(--text-secondary)", padding: "6px 10px", borderRadius: "var(--radius-sm)", cursor: "pointer" }}>
              <Pin size={16} strokeWidth={1.5} />
            </button>
            {isEditing ? (
              <>
                <button className="editor-nav-btn" onClick={saveEdits} disabled={saving} style={{ padding: "6px 10px", borderRadius: "var(--radius-sm)", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", cursor: "pointer" }}>
                  {saving ? "Saving..." : "Save"}
                </button>
                <button className="editor-nav-btn" onClick={cancelEditing} style={{ padding: "6px 10px", borderRadius: "var(--radius-sm)", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", cursor: "pointer" }}>
                  Cancel
                </button>
              </>
            ) : null}
            <div style={{ position: "relative" }} ref={moreRef}>
              <button style={{ padding: "6px 10px", borderRadius: "var(--radius-sm)", color: "var(--text-secondary)", cursor: "pointer", display: "flex", alignItems: "center" }} onClick={() => setMoreOpen(!moreOpen)}>
                <MoreHorizontal size={18} strokeWidth={1.5} />
              </button>
              {moreOpen && (
                <div className="dropdown-menu" style={{ right: 0, minWidth: 200 }}>
                  {(memory.type === "text" || memory.type === "checklist") && (
                    <>
                      <button className="dropdown-item" onClick={exportAsPDF}>
                        <FileText size={16} strokeWidth={1.5} /> Export as PDF
                      </button>
                      <button className="dropdown-item" onClick={exportAsDocument}>
                        <Download size={16} strokeWidth={1.5} /> Export as Document
                      </button>
                      <button className="dropdown-item" onClick={copyAsText}>
                        <Copy size={16} strokeWidth={1.5} /> Copy as Text
                      </button>
                    </>
                  )}
                  {memory.type === "image" && (
                    <button className="dropdown-item" onClick={downloadMedia}>
                      <ImageIcon size={16} strokeWidth={1.5} /> Download Image
                    </button>
                  )}
                  {memory.type === "voice" && (
                    <button className="dropdown-item" onClick={downloadMedia}>
                      <Mic size={16} strokeWidth={1.5} /> Download Audio
                    </button>
                  )}
                  {memory.type === "video" && (
                    <button className="dropdown-item" onClick={downloadMedia}>
                      <VideoIcon size={16} strokeWidth={1.5} /> Download Video
                    </button>
                  )}
                  <div className="dropdown-divider" />
                  <button className="dropdown-item" onClick={async () => { setMoreOpen(false); try { await moveMemoryToVault(memory.id); dispatch({ type: "DELETE_MEMORY", payload: memory.id }); dispatch({ type: "UNLOCK_VAULT" }); navigate("/vault"); } catch (err) { alert("Failed to move memory to vault."); } }}><Lock size={16} strokeWidth={1.5} /> Move to Vault</button>
                  <div className="dropdown-divider" />
                  <button className="dropdown-item danger" onClick={() => { handleDelete(); setMoreOpen(false); }}>
                    <Trash2 size={16} strokeWidth={1.5} /> Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="memory-view-meta">
          <span className="memory-view-type">{getMemoryTypeIcon(memory.type, 20)}</span>
          <span className="memory-view-date">{formatFullDate(memory.date)} {"\u00b7"} {formatTime(memory.date)}</span>
          {memory.pinned && <span style={{ display: "flex" }}><Pin size={14} strokeWidth={2} /></span>}
        </div>

        {isEditing ? (
          <div>
            <input
              ref={titleInputRef}
              className="memory-title-input"
              value={editTitle}
              onChange={handleTitleChange}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  saveEdits();
                }
                if (e.key === "Escape") {
                  cancelEditing();
                }
              }}
            />
            {autoSaveStatus && (
              <span style={{ fontSize: 12, color: autoSaveStatus === "Saved" ? "#10B981" : autoSaveStatus === "Failed to save" ? "#EF4444" : "var(--text-tertiary)", marginTop: 4, display: "inline-block" }}>
                {autoSaveStatus}
              </span>
            )}
          </div>
        ) : (
          <h1 className="memory-view-title" onClick={startEditing} style={{ cursor: "pointer" }} title="Click to edit">
            {memory.title}
          </h1>
        )}

        {memory.tags?.length > 0 && (
          <div className="memory-view-tags">
            {memory.tags.map((tag) => <span key={tag} className="tag">{tag}</span>)}
          </div>
        )}

        {memory.type === "text" && (
          isEditing ? (
            <div>
              <textarea
                ref={contentInputRef}
                className="memory-body-input"
                value={editContent}
                onChange={handleContentChange}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    cancelEditing();
                  }
                }}
                autoFocus
              />
              {autoSaveStatus && (
                <span style={{ fontSize: 12, color: autoSaveStatus === "Saved" ? "#10B981" : autoSaveStatus === "Failed to save" ? "#EF4444" : "var(--text-tertiary)", marginTop: 4, display: "inline-block" }}>
                  {autoSaveStatus}
                </span>
              )}
            </div>
          ) : (
            <p className="memory-view-content" onClick={startEditing} style={{ cursor: "pointer" }} title="Click to edit">
              {memory.content}
            </p>
          )
        )}

        {memory.type === "voice" && (
          <div className="voice-player">
            {(memory.mediaUrl || memory.mediaData) ? (
              <audio
                ref={audioRef}
                src={getMediaUrl(memory.mediaUrl || memory.mediaData)}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={handleEnded}
                onError={(e) => {
                  console.error("Audio loading error:", e);
                  console.error("Audio src:", getMediaUrl(memory.mediaUrl || memory.mediaData));
                }}
                preload="auto"
                controls
                controlsList="nodownload"
                style={{ width: "100%", marginBottom: 16 }}
              />
            ) : (
              <div style={{ padding: 20, textAlign: "center", color: "var(--text-tertiary)" }}>
                <Mic size={32} strokeWidth={1.5} style={{ marginBottom: 8 }} />
                <p>No audio file available</p>
              </div>
            )}
            {memory.content && (
              isEditing ? (
                <div>
                  <textarea
                    ref={contentInputRef}
                    className="memory-body-input"
                    value={editContent}
                    onChange={handleContentChange}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        cancelEditing();
                      }
                    }}
                    autoFocus
                    style={{ marginTop: 14 }}
                  />
                  {autoSaveStatus && (
                    <span style={{ fontSize: 12, color: autoSaveStatus === "Saved" ? "#10B981" : autoSaveStatus === "Failed to save" ? "#EF4444" : "var(--text-tertiary)", marginTop: 4, display: "inline-block" }}>
                      {autoSaveStatus}
                    </span>
                  )}
                </div>
              ) : (
                <p style={{ marginTop: 14, fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6, cursor: "pointer" }} onClick={startEditing} title="Click to edit">
                  {memory.content}
                </p>
              )
            )}
          </div>
        )}

        {memory.type === "image" && (
          <div>
            {(memory.mediaUrl || memory.mediaData) ? (
              <img src={getMediaUrl(memory.mediaUrl || memory.mediaData)} alt={memory.title} style={{ width: "100%", maxHeight: 400, objectFit: "contain", borderRadius: "var(--radius)", marginBottom: 16 }} />
            ) : (
              <div className="image-placeholder">{getMemoryTypeIcon(memory.type, 48)}</div>
            )}
            {memory.content && (
              isEditing ? (
                <div>
                  <textarea
                    ref={contentInputRef}
                    className="memory-body-input"
                    value={editContent}
                    onChange={handleContentChange}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        cancelEditing();
                      }
                    }}
                    autoFocus
                  />
                  {autoSaveStatus && (
                    <span style={{ fontSize: 12, color: autoSaveStatus === "Saved" ? "#10B981" : autoSaveStatus === "Failed to save" ? "#EF4444" : "var(--text-tertiary)", marginTop: 4, display: "inline-block" }}>
                      {autoSaveStatus}
                    </span>
                  )}
                </div>
              ) : (
                <p className="memory-view-content" onClick={startEditing} style={{ cursor: "pointer" }} title="Click to edit">
                  {memory.content}
                </p>
              )
            )}
          </div>
        )}

        {memory.type === "video" && (
          <div>
            {(memory.mediaUrl || memory.mediaData) ? (
              <video controls src={getMediaUrl(memory.mediaUrl || memory.mediaData)} style={{ width: "100%", maxHeight: 400, borderRadius: "var(--radius)", marginBottom: 16 }} />
            ) : (
              <div className="image-placeholder" style={{ background: "#1e293b" }}>{getMemoryTypeIcon(memory.type, 48)}</div>
            )}
            {memory.content && (
              isEditing ? (
                <div>
                  <textarea
                    ref={contentInputRef}
                    className="memory-body-input"
                    value={editContent}
                    onChange={handleContentChange}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        cancelEditing();
                      }
                    }}
                    autoFocus
                  />
                  {autoSaveStatus && (
                    <span style={{ fontSize: 12, color: autoSaveStatus === "Saved" ? "#10B981" : autoSaveStatus === "Failed to save" ? "#EF4444" : "var(--text-tertiary)", marginTop: 4, display: "inline-block" }}>
                      {autoSaveStatus}
                    </span>
                  )}
                </div>
              ) : (
                <p className="memory-view-content" onClick={startEditing} style={{ cursor: "pointer" }} title="Click to edit">
                  {memory.content}
                </p>
              )
            )}
          </div>
        )}

        {memory.type === "checklist" && memory.checklist && (
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 13, color: "var(--text-tertiary)", marginBottom: 12 }}>
              {memory.checklist.filter((c) => c.done).length}/{memory.checklist.length} completed
            </p>
            {memory.checklist.map((item) => (
              <div key={item.id} className="checklist-item">
                <div className={`checklist-checkbox ${item.done ? "checked" : ""}`}>
                  {item.done && <span style={{ fontSize: 12 }}>&#x2713;</span>}
                </div>
                <span
                  style={{
                    fontSize: 14,
                    color: item.done ? "var(--text-tertiary)" : "var(--text-primary)",
                    textDecoration: item.done ? "line-through" : "none",
                  }}
                >
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
          {memory.relatedPerson && (
            <span className="tag" style={{ cursor: "pointer" }} onClick={() => {
              const person = state.people.find((p) => p.name === memory.relatedPerson);
              if (person) navigate(`/people/${person.id}`);
            }}>
              <User size={12} strokeWidth={1.5} style={{ marginRight: 4 }} />{memory.relatedPerson}
            </span>
          )}
        </div>

        {relatedMemories.length > 0 && (
          <div className="related-memories-section">
            <p className="related-title">Related Memories</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {relatedMemories.map((m) => (
                <div key={m.id} className="card card-interactive" onClick={() => navigate(`/memory/${m.id}`)}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ display: "flex" }}>{getMemoryTypeIcon(m.type, 16)}</span>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{m.title}</p>
                      <p style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{truncate(m.content, 60)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
