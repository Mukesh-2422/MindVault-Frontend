import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { togglePinMemory, deleteMemory, updateMemory, getMemory, moveMemoryToVault } from "../api/memories";
import { useAppBackNavigation } from "../utils/useAppBackNavigation";
import {
  formatFullDate, formatTime, getMemoryTypeIcon, truncate,
} from "../utils/helpers";
import {
  ArrowLeft, Pin, MoreHorizontal, Download, Lock, Trash2, Play, Pause, Folder, User, Search,
  FileText, Copy, Image as ImageIcon, Mic, Video as VideoIcon, CheckSquare, Save, X, Plus, Check
} from "lucide-react";
import jsPDF from "jspdf";
import { getMediaUrl } from "../api/voice";
import "../styles/global.css";
import "../styles/pages.css";

export default function MemoryViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const goBack = useAppBackNavigation("/collections");

  const memory = state.memories.find((m) => m.id === id);

  const [moreOpen, setMoreOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editTags, setEditTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [editChecklist, setEditChecklist] = useState([]);
  const [newChecklistText, setNewChecklistText] = useState("");
  const [saving, setSaving] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState("");

  const audioRef = useRef(null);
  const moreRef = useRef(null);
  const titleInputRef = useRef(null);
  const contentInputRef = useRef(null);
  const autoSaveTimerRef = useRef(null);

  // Sync state when memory is loaded or changed
  useEffect(() => {
    if (memory) {
      setEditTitle(memory.title || "");
      setEditContent(memory.content || "");
      setEditTags(memory.tags || []);
      setEditChecklist(memory.checklist || []);
      if (memory.duration) {
        setAudioDuration(memory.duration);
      }
    }
  }, [memory]);

  // Click outside to close 3-dots more menu
  useEffect(() => {
    const handleClick = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Auto-resize content textarea as user types
  useEffect(() => {
    if (contentInputRef.current) {
      const el = contentInputRef.current;
      el.style.height = "auto";
      el.style.height = Math.max(100, el.scrollHeight) + "px";
    }
  }, [editContent]);

  if (!memory) {
    return (
      <div className="new-memory-page">
        <nav className="memory-editor-nav">
          <div className="editor-nav-left">
            <button className="editor-nav-btn" onClick={goBack} aria-label="Go back">
              <ArrowLeft size={16} strokeWidth={1.5} />
            </button>
          </div>
          <div className="editor-nav-center">
            <span style={{ display: "flex" }}><FileText size={20} strokeWidth={1.5} /></span>
          </div>
          <div className="editor-nav-right" />
        </nav>
        <div className="memory-editor-content">
          <div className="empty-state">
            <div className="empty-state-icon"><Search size={48} strokeWidth={1.5} /></div>
            <p className="empty-state-title">Memory not found</p>
            <button className="btn btn-secondary btn-sm" style={{ marginTop: 16 }} onClick={goBack}>Go Back</button>
          </div>
        </div>
      </div>
    );
  }

  const handleDelete = async () => {
    try {
      await deleteMemory(memory.id);
      dispatch({ type: "DELETE_MEMORY", payload: memory.id });
      goBack();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handlePin = async () => {
    try {
      await togglePinMemory(memory.id);
      dispatch({ type: "TOGGLE_PIN", payload: memory.id });
    } catch (err) {
      console.error("Pin toggle failed:", err);
    }
  };

  const performSave = async () => {
    setSaving(true);
    setAutoSaveStatus("Saving...");
    try {
      const updatedPayload = {
        title: editTitle.trim() || memory.title || "Untitled Memory",
        content: editContent,
        tags: editTags,
        checklist: memory.type === "checklist" ? editChecklist : undefined,
        date: memory.date || new Date().toISOString(),
      };
      await updateMemory(memory.id, updatedPayload);
      const updated = await getMemory(memory.id);
      dispatch({ type: "UPDATE_MEMORY", payload: updated || { ...memory, ...updatedPayload } });
      setAutoSaveStatus("Saved");
      setTimeout(() => setAutoSaveStatus(""), 2000);
    } catch (err) {
      console.error("Update failed:", err);
      setAutoSaveStatus("Failed to save");
      setTimeout(() => setAutoSaveStatus(""), 2000);
    } finally {
      setSaving(false);
    }
  };

  const handleAddTag = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const cleanTag = tagInput.trim().replace(/^#/, "").toLowerCase();
      if (cleanTag && !editTags.includes(cleanTag)) {
        setEditTags([...editTags, cleanTag]);
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setEditTags(editTags.filter((t) => t !== tagToRemove));
  };

  const toggleChecklistItem = (itemId) => {
    const updated = editChecklist.map((item) =>
      item.id === itemId ? { ...item, done: !item.done } : item
    );
    setEditChecklist(updated);
  };

  const addChecklistItem = () => {
    if (!newChecklistText.trim()) return;
    const newItem = {
      id: `chk_${Date.now()}`,
      text: newChecklistText.trim(),
      done: false,
    };
    setEditChecklist([...editChecklist, newItem]);
    setNewChecklistText("");
  };

  const removeChecklistItem = (itemId) => {
    setEditChecklist(editChecklist.filter((item) => item.id !== itemId));
  };

  // Audio Playback Controls
  const toggleAudioPlay = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current && audioRef.current.duration) {
      setAudioDuration(audioRef.current.duration);
    }
  };

  const handleSeekWaveform = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = x / rect.width;
    if (audioRef.current && audioDuration > 0) {
      audioRef.current.currentTime = pct * audioDuration;
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const formatAudioTime = (seconds) => {
    if (!seconds || isNaN(seconds) || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Export as PDF
  const exportAsPDF = () => {
    setMoreOpen(false);
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - margin * 2;
    let y = 20;

    doc.setFontSize(20);
    doc.setFont(undefined, "bold");
    const titleLines = doc.splitTextToSize(editTitle || memory.title, maxWidth);
    doc.text(titleLines, margin, y);
    y += titleLines.length * 10 + 4;

    doc.setFontSize(10);
    doc.setFont(undefined, "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(`${formatFullDate(memory.date)} at ${formatTime(memory.date)}`, margin, y);
    y += 8;

    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    if (memory.type === "checklist" && editChecklist.length > 0) {
      editChecklist.forEach((item) => {
        const prefix = item.done ? "[x] " : "[ ] ";
        const lines = doc.splitTextToSize(prefix + item.text, maxWidth);
        doc.text(lines, margin, y);
        y += lines.length * 7;
      });
    } else if (editContent) {
      const contentLines = doc.splitTextToSize(editContent, maxWidth);
      doc.text(contentLines, margin, y);
      y += contentLines.length * 7;
    }

    if (editTags && editTags.length > 0) {
      y += 10;
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Tags: ${editTags.map((t) => `#${t}`).join(" ")}`, margin, y);
    }

    doc.save(`${(editTitle || memory.title || "memory").replace(/[^a-z0-9]/gi, "_")}.pdf`);
  };

  const copyTextToClipboard = () => {
    setMoreOpen(false);
    let text = `${editTitle || memory.title}\n\n`;
    if (editContent) text += `${editContent}\n\n`;
    if (editTags.length > 0) text += `Tags: ${editTags.map((t) => `#${t}`).join(" ")}`;
    navigator.clipboard.writeText(text);
    setAutoSaveStatus("Copied to clipboard!");
    setTimeout(() => setAutoSaveStatus(""), 2000);
  };

  return (
    <div className="new-memory-page">
      {/* Top Action Bar / Header */}
      <nav className="memory-editor-nav">
        <div className="editor-nav-left">
          <button className="editor-nav-btn" onClick={goBack} aria-label="Go back" title="Go back">
            <ArrowLeft size={16} strokeWidth={1.5} />
          </button>
        </div>

        <div className="editor-nav-center">
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {getMemoryTypeIcon(memory.type, 16)}
            <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              {formatFullDate(memory.date)} · {formatTime(memory.date)}
            </span>
          </span>
        </div>

        <div className="editor-nav-right">
          {/* More Options Dropdown */}
          <div className="dropdown" ref={moreRef}>
            <button
              className="editor-nav-btn"
              onClick={() => setMoreOpen(!moreOpen)}
              aria-label="More options"
              title="More options"
            >
              <MoreHorizontal size={16} strokeWidth={1.5} />
            </button>
            {moreOpen && (
              <div className="dropdown-menu" style={{ right: 0, top: "100%" }}>
                <button className="dropdown-item" onClick={copyTextToClipboard}>
                  <Copy size={16} strokeWidth={1.5} /> Copy Text
                </button>
                <button className="dropdown-item" onClick={exportAsPDF}>
                  <Download size={16} strokeWidth={1.5} /> Export as PDF
                </button>
                <button
                  className="dropdown-item"
                  onClick={async () => {
                    setMoreOpen(false);
                    try {
                      await moveMemoryToVault(memory.id);
                      dispatch({ type: "DELETE_MEMORY", payload: memory.id });
                      dispatch({ type: "UNLOCK_VAULT" });
                      navigate("/vault");
                    } catch {
                      alert("Failed to move memory to vault.");
                    }
                  }}
                >
                  <Lock size={16} strokeWidth={1.5} /> Move to Vault
                </button>
                <div className="dropdown-divider" />
                <button
                  className="dropdown-item danger"
                  onClick={() => {
                    handleDelete();
                    setMoreOpen(false);
                  }}
                >
                  <Trash2 size={16} strokeWidth={1.5} /> Delete Memory
                </button>
              </div>
            )}
          </div>

          {/* Pin Button */}
          <button
            className="editor-nav-btn"
            onClick={handlePin}
            aria-label={memory.pinned ? "Unpin memory" : "Pin memory"}
            title={memory.pinned ? "Unpin memory" : "Pin memory"}
            style={{ color: memory.pinned ? "#EAB308" : undefined }}
          >
            <Pin size={16} strokeWidth={1.5} />
          </button>

          {/* Save Button */}
          <button
            className="editor-nav-btn save-btn"
            onClick={performSave}
            disabled={saving}
            aria-label="Save changes"
            title="Save memory"
          >
            <Save size={15} strokeWidth={1.75} />
            <span>{saving ? "Saving..." : "Save"}</span>
          </button>
        </div>
      </nav>

      {/* Editor Content Area */}
      <div className="memory-editor-content memory-view-page">
        {/* Status indicator */}
        {autoSaveStatus && (
          <div style={{
            fontSize: 12,
            color: autoSaveStatus === "Saved" ? "#10B981" : autoSaveStatus === "Failed to save" ? "#EF4444" : "var(--text-tertiary)",
            marginBottom: 12,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}>
            {autoSaveStatus === "Saved" && <Check size={14} />}
            <span>{autoSaveStatus}</span>
          </div>
        )}

        {/* Title Input */}
        <input
          ref={titleInputRef}
          className="memory-title-input"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          placeholder="Untitled Memory"
          style={{ marginBottom: 16 }}
        />

        {/* Media Container: Image */}
        {memory.type === "image" && (
          <div className="memory-media-container" style={{ marginBottom: 20, textAlign: "center" }}>
            {(memory.mediaUrl || memory.mediaData || memory.imageUrl) ? (
              <img
                src={getMediaUrl(memory.mediaUrl || memory.mediaData || memory.imageUrl)}
                alt={editTitle || memory.title}
                style={{
                  width: "100%",
                  maxHeight: 450,
                  objectFit: "contain",
                  borderRadius: "16px",
                  backgroundColor: "#020617",
                  border: "1px solid var(--border-color)",
                }}
              />
            ) : (
              <div className="image-placeholder">{getMemoryTypeIcon("image", 48)}</div>
            )}
          </div>
        )}

        {/* Media Container: Audio / Voice */}
        {memory.type === "voice" && (
          <div className="voice-player" style={{ marginBottom: 20 }}>
            {(memory.mediaUrl || memory.mediaData || memory.audioUrl) ? (
              <>
                <audio
                  ref={audioRef}
                  src={getMediaUrl(memory.mediaUrl || memory.mediaData || memory.audioUrl)}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onEnded={() => setPlaying(false)}
                />
                <div className="voice-player-header">
                  <button
                    type="button"
                    className="voice-player-btn"
                    onClick={toggleAudioPlay}
                    title={playing ? "Pause" : "Play"}
                  >
                    {playing ? <Pause size={20} /> : <Play size={20} style={{ marginLeft: 2 }} />}
                  </button>
                  <div className="voice-player-info">
                    <div className="voice-player-title">{editTitle || memory.title || "Voice Recording"}</div>
                    <div className="voice-player-duration">
                      {formatAudioTime(currentTime)} / {formatAudioTime(audioDuration)}
                    </div>
                  </div>
                </div>
                <div
                  className="voice-waveform"
                  onClick={handleSeekWaveform}
                  style={{ cursor: "pointer" }}
                >
                  <div
                    className="voice-waveform-progress"
                    style={{ width: `${audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0}%` }}
                  />
                </div>
              </>
            ) : (
              <div style={{ padding: 20, textAlign: "center", color: "var(--text-tertiary)" }}>
                <Mic size={32} strokeWidth={1.5} style={{ marginBottom: 8 }} />
                <p>No audio file available</p>
              </div>
            )}
          </div>
        )}

        {/* Media Container: Video */}
        {memory.type === "video" && (
          <div className="memory-media-container" style={{ marginBottom: 20 }}>
            {(memory.mediaUrl || memory.mediaData || memory.videoUrl) ? (
              <video
                controls
                src={getMediaUrl(memory.mediaUrl || memory.mediaData || memory.videoUrl)}
                style={{
                  width: "100%",
                  maxHeight: 450,
                  borderRadius: "16px",
                  backgroundColor: "#020617",
                  border: "1px solid var(--border-color)",
                }}
              />
            ) : (
              <div className="image-placeholder" style={{ background: "#1e293b" }}>{getMemoryTypeIcon("video", 48)}</div>
            )}
          </div>
        )}

        {/* Media Container: Checklist */}
        {memory.type === "checklist" && (
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 13, color: "var(--text-tertiary)", marginBottom: 12 }}>
              {editChecklist.filter((c) => c.done).length}/{editChecklist.length} completed
            </p>
            {editChecklist.map((item) => (
              <div key={item.id} className="checklist-item" style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0" }}>
                <div
                  className={`checklist-checkbox ${item.done ? "checked" : ""}`}
                  onClick={() => toggleChecklistItem(item.id)}
                >
                  {item.done && <Check size={12} />}
                </div>
                <span
                  style={{
                    flex: 1,
                    fontSize: 14,
                    color: item.done ? "var(--text-tertiary)" : "var(--text-primary)",
                    textDecoration: item.done ? "line-through" : "none",
                  }}
                >
                  {item.text}
                </span>
                <button
                  type="button"
                  onClick={() => removeChecklistItem(item.id)}
                  style={{ background: "none", border: "none", color: "var(--text-tertiary)", cursor: "pointer" }}
                  title="Remove item"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <input
                type="text"
                className="checklist-item-input"
                placeholder="+ Add checklist item..."
                value={newChecklistText}
                onChange={(e) => setNewChecklistText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addChecklistItem();
                  }
                }}
                style={{
                  flex: 1,
                  background: "var(--card-bg)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--radius-sm)",
                  padding: "8px 12px",
                }}
              />
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={addChecklistItem}
              >
                Add
              </button>
            </div>
          </div>
        )}

        {/* Universal Content / Notes Area for ALL memory types */}
        <div className="memory-notes-section" style={{ marginBottom: 24 }}>
          <textarea
            ref={contentInputRef}
            className="memory-body-input"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            placeholder="Add notes, context, or thoughts about this memory..."
            rows={4}
          />
        </div>



        {/* Related Person Mention */}
        {memory.relatedPerson && (
          <div style={{ marginTop: 16 }}>
            <span
              className="tag"
              style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}
              onClick={() => {
                const person = state.people.find((p) => p.name === memory.relatedPerson);
                if (person) navigate(`/people/${person.id}`);
              }}
            >
              <User size={12} strokeWidth={1.5} />
              <span>{memory.relatedPerson}</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
