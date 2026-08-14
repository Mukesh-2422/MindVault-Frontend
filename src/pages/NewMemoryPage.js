import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { formatFullDate, formatTime, formatMemoryDateTime } from "../utils/helpers";
import { useAppBackNavigation } from "../utils/useAppBackNavigation";
import { createMemory, updateMemory } from "../api/memories";
import { uploadFile } from "../api/client";
import { uploadVoiceMemory } from "../api/voice";
import {
  Check,
  Plus,
  X,
  Mic,
  Image,
  Video,
  CheckSquare,
  Download,
  Trash2,
  Square,
  Upload,
  Lock,
  ArrowLeft,
  MoreHorizontal,
  Pin,
  Save,
  FileText,
} from "lucide-react";
import "../styles/global.css";
import "../styles/pages.css";

export default function NewMemoryPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { state, dispatch } = useApp();
  const goBack = useAppBackNavigation("/home");

  const memType = searchParams.get("type") || "text";
  const editId = searchParams.get("edit");
  const existingMemory = editId ? state.memories.find((m) => m.id === editId) : null;

  const [title, setTitle] = useState(existingMemory?.title || "");
  const [content, setContent] = useState(existingMemory?.content || "");
  const [type, setType] = useState(existingMemory?.type || memType);
  const [pinned, setPinned] = useState(existingMemory?.pinned || false);
  const [checklist, setChecklist] = useState(
    existingMemory?.type === "checklist" && existingMemory?.checklist
      ? existingMemory.checklist
      : [{ id: "cl_1", text: "", done: false }]
  );
  const [draftSaved, setDraftSaved] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mediaData, setMediaData] = useState(existingMemory?.mediaData || null);
  const [mediaUrl, setMediaUrl] = useState(existingMemory?.mediaUrl || null);
  const [mediaName, setMediaName] = useState(existingMemory?.mediaUrl ? existingMemory.title : "");
  const [selectedFile, setSelectedFile] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(existingMemory?.mediaUrl || null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [saveToVault, setSaveToVault] = useState(existingMemory?.vaultId === "vault");
  const [saveError, setSaveError] = useState("");
  const moreRef = useRef(null);
  const titleRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  const now = new Date();

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (title || content) {
        setDraftSaved(true);
        setTimeout(() => setDraftSaved(false), 2000);
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [title, content]);

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    };
  }, [audioUrl]);


  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaName(file.name);
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setMediaData(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const triggerFileUpload = (mimePrefix) => {
    fileInputRef.current.accept = mimePrefix;
    fileInputRef.current.value = "";
    fileInputRef.current.click();
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      setRecording(true);
      setRecordingDuration(0);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        setRecording(false);
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.onerror = (event) => {
        console.error("Recording error:", event.error);
        setRecording(false);
        stream.getTracks().forEach((t) => t.stop());
        alert("Recording error occurred. Please try again.");
      };

      recorder.start();
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((d) => d + 1);
      }, 1000);
    } catch (err) {
      console.error("Error starting recording:", err);
      if (err.name === "NotAllowedError") {
        alert("Microphone access denied. Please allow microphone permissions.");
      } else if (err.name === "NotFoundError") {
        alert("No microphone found. Please connect a microphone and try again.");
      } else {
        alert("Failed to start recording. Please try again.");
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  };

  const formatDuration = (sec) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }
    return `${mins}:${s.toString().padStart(2, "0")}`;
  };

  const handleVaultToggle = () => {
    setMoreOpen(false);
    if (saveToVault) {
      // Make Public — no password needed
      setSaveToVault(false);
    } else {
      // Make it Private
      if (!state.vaultPasswordSet || state.vaultLocked) {
        // Vault not created or locked — navigate to vault page for password setup
        navigate("/vault");
      } else {
        // Vault already unlocked — just toggle
        setSaveToVault(true);
      }
    }
  };

  const handleSave = async () => {
    if (!title && !content && !selectedFile && !audioBlob && checklist.every((c) => !c.text)) return;
    if (saving) return;
    setSaving(true);
    setSaveError("");

    try {
      let finalMediaUrl = mediaUrl;
      let finalDuration = null;
      let uploadedMedia = null;

      // Voice: record or uploaded audio file
      if (type === "voice") {
        if (audioBlob) {
          // Recorded audio
          const formData = new FormData();
          formData.append("audio", audioBlob, `recording_${Date.now()}.webm`);
          formData.append("title", title || "Voice Memory");
          formData.append("description", content || "");
          formData.append("duration", recordingDuration.toString());

          const result = await uploadVoiceMemory(formData);
          dispatch({ type: "ADD_MEMORY", payload: result.memory });
          navigate("/home");
          return;
        } else if (selectedFile) {
          // Uploaded audio file — use general upload, set duration if available
          uploadedMedia = await uploadFile(selectedFile);
          finalMediaUrl = uploadedMedia.url;
          finalDuration = recordingDuration > 0 ? formatDuration(recordingDuration) : null;
        }
      }

      // All other types: upload file if needed, then create/update memory
      if (!uploadedMedia && selectedFile) {
        uploadedMedia = await uploadFile(selectedFile);
        finalMediaUrl = uploadedMedia.url;
      }

      const memoryData = {
        title: title || content?.substring(0, 50) || "Untitled",
        content,
        type,
        pinned,
        vaultId: saveToVault ? "vault" : null,
        checklist: type === "checklist" ? checklist.filter((c) => c.text) : undefined,
        mediaData: mediaData || null,
        mediaUrl: finalMediaUrl,
        mediaName: uploadedMedia?.name || mediaName || null,
        mediaType: uploadedMedia?.mimetype || null,
        mediaSize: uploadedMedia?.size || null,
        duration: finalDuration,
      };

      if (editId && existingMemory) {
        const saved = await updateMemory(editId, memoryData);
        dispatch({ type: "UPDATE_MEMORY", payload: { id: editId, ...saved } });
        navigate(`/memory/${editId}`);
      } else {
        const saved = await createMemory(memoryData);
        dispatch({ type: "ADD_MEMORY", payload: saved });
        navigate("/home");
      }
    } catch (err) {
      console.error("Failed to save memory:", err);
      setSaveError(err.message || "Failed to save. File may be too large.");
      setSaving(false);
    }
  };


  const addChecklistItem = () => {
    setChecklist([...checklist, { id: `cl_${Date.now()}`, text: "", done: false }]);
  };

  const updateChecklistItem = (id, key, val) => {
    setChecklist(checklist.map((c) => (c.id === id ? { ...c, [key]: val } : c)));
  };

  const removeChecklistItem = (id) => {
    setChecklist(checklist.filter((c) => c.id !== id));
  };

  const getTypeIcon = (t = type) => {
    const props = { size: 20, strokeWidth: 1.5 };
    switch (t) {
      case "voice": return <Mic {...props} />;
      case "image": return <Image {...props} />;
      case "video": return <Video {...props} />;
      case "checklist": return <CheckSquare {...props} />;
      default: return <FileText {...props} />;
    }
  };

  return (
    <div className="new-memory-page">
      <nav className="memory-editor-nav">
        <div className="editor-nav-left">
          <button className="editor-nav-btn" onClick={goBack} aria-label="Go back">
            <ArrowLeft size={16} strokeWidth={1.5} />
          </button>
        </div>

        <div className="editor-nav-center">
          {draftSaved ? (
            <span className="draft-status">
              <Check size={14} strokeWidth={2} />
              Draft Saved
            </span>
          ) : (
            <span style={{ display: "flex" }}>{getTypeIcon()}</span>
          )}
        </div>

        <div className="editor-nav-right">
          <div style={{ position: "relative" }} ref={moreRef}>
            <button className="editor-nav-btn" onClick={() => setMoreOpen(!moreOpen)}>
              <MoreHorizontal size={16} strokeWidth={1.5} />
            </button>
            {moreOpen && (
              <div className="dropdown-menu" style={{ right: 0, top: "calc(100% + 4px)", minWidth: 200 }}>
                <button className="dropdown-item" onClick={() => { setPinned(!pinned); setMoreOpen(false); }}>
                  <Pin size={16} strokeWidth={1.5} />
                  {pinned ? "Unpin" : "Pin"}
                </button>
                <button className="dropdown-item" onClick={handleVaultToggle}>
                  <Lock size={16} strokeWidth={1.5} />
                  {saveToVault ? "Make Public" : "Make it Private"}
                </button>
                <button className="dropdown-item">
                  <Download size={16} strokeWidth={1.5} />
                  Export
                </button>
                <button className="dropdown-item danger" onClick={goBack}>
                  <Trash2 size={16} strokeWidth={1.5} />
                  Delete Draft
                </button>
              </div>
            )}
          </div>

          <button className="editor-nav-btn" onClick={() => setPinned(!pinned)} title="Pin" style={{ color: pinned ? "#EAB308" : undefined }}>
            <Pin size={16} strokeWidth={1.5} />
          </button>

          <button className="editor-nav-btn save-btn" onClick={handleSave} disabled={saving}>
            <Save size={16} strokeWidth={1.5} />
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </nav>


      <div className="memory-editor-content">
        {saveError && (
          <p style={{ color: "#EF4444", fontSize: 13, marginBottom: 12, padding: "8px 12px", background: "rgba(239,68,68,0.1)", borderRadius: "var(--radius-sm)" }}>
            {saveError}
          </p>
        )}
        <div>
          <input
            ref={titleRef}
            className="memory-title-input"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const next = document.querySelector(".memory-body-input, textarea.memory-body-input");
                if (next) next.focus();
              }
            }}
            style={{ width: "100%" }}
          />
        </div>

        <div
          className="memory-editor-meta-row"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: "13px",
            color: "var(--text-tertiary, #94a3b8)",
            marginBottom: "24px",
            marginTop: "4px",
            fontWeight: 400,
          }}
        >
          <span>{formatMemoryDateTime(now.toISOString())}</span>
          <span style={{ opacity: 0.5 }}>|</span>
          <span>{content ? content.length : 0} {content?.length === 1 ? "character" : "characters"}</span>
        </div>

        {type === "text" && (
          <textarea
            className="memory-body-input"
            placeholder="Start typing your memory..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        )}

        {type === "checklist" && (
          <div>
            {checklist.map((item, idx) => (
              <div key={item.id} className="checklist-item">
                <div className={`checklist-checkbox ${item.done ? "checked" : ""}`} onClick={() => updateChecklistItem(item.id, "done", !item.done)}>
                  {item.done && <Check size={12} strokeWidth={3} />}
                </div>
                <input
                  className={`checklist-item-input ${item.done ? "done" : ""}`}
                  placeholder={`Item ${idx + 1}`}
                  value={item.text}
                  onChange={(e) => updateChecklistItem(item.id, "text", e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addChecklistItem();
                    if (e.key === "Backspace" && !item.text && checklist.length > 1) removeChecklistItem(item.id);
                  }}
                />
                {checklist.length > 1 && (
                  <button style={{ color: "var(--text-tertiary)", background: "none", border: "none", cursor: "pointer", display: "flex" }} onClick={() => removeChecklistItem(item.id)}>
                    <X size={16} strokeWidth={1.5} />
                  </button>
                )}
              </div>
            ))}
            <button onClick={addChecklistItem} className="btn btn-ghost btn-sm" style={{ marginTop: 8 }}>
              <Plus size={14} strokeWidth={2} />
              Add item
            </button>
          </div>
        )}

        {type === "voice" && (
          <div className="voice-player" style={{ marginTop: 16 }}>
            <input ref={fileInputRef} type="file" style={{ display: "none" }} accept="audio/*" onChange={handleFileSelect} />
            {!audioUrl && !selectedFile && !mediaData ? (
              <>
                <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 16 }}>
                  Tap the mic to record or upload an audio file.
                </p>
                <div style={{ display: "flex", gap: 16, justifyContent: "center", marginBottom: 16 }}>
                  <button
                    className="voice-play-btn"
                    style={{
                      width: 60, height: 60, display: "flex",
                      alignItems: "center", justifyContent: "center",
                      background: recording ? "#EF4444" : undefined,
                    }}
                    onClick={recording ? stopRecording : startRecording}
                    title={recording ? "Stop recording" : "Start recording"}
                  >
                    {recording ? <Square size={24} strokeWidth={1.5} /> : <Mic size={24} strokeWidth={1.5} />}
                  </button>
                </div>
                <div
                  className="image-placeholder"
                  style={{ cursor: "pointer", border: "2px dashed var(--border)", background: "var(--accent-subtle)", flexDirection: "column", gap: 8, margin: 0 }}
                  onClick={() => {
                    fileInputRef.current.accept = "audio/*";
                    fileInputRef.current.value = "";
                    fileInputRef.current.click();
                  }}
                >
                  <Upload size={32} strokeWidth={1.5} />
                  <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                    Upload an audio file
                  </span>
                </div>
                {recording && (
                  <p style={{ textAlign: "center", color: "#EF4444", fontSize: 13, marginTop: 10, animation: "pulse 1s infinite" }}>
                    Recording... {formatDuration(recordingDuration)}
                  </p>
                )}
              </>
            ) : (
              <>
                <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 12 }}>
                  {audioBlob ? `Recording complete (${formatDuration(recordingDuration)})` : `Audio file: ${mediaName || "Attached"}`}
                </p>
                <audio controls src={audioUrl || mediaData} style={{ width: "100%", marginBottom: 12 }} />
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => { setAudioBlob(null); setAudioUrl(null); setRecordingDuration(0); setSelectedFile(null); setMediaName(""); setMediaData(null); }}>
                    Remove
                  </button>
                </div>
                <textarea className="memory-body-input" placeholder="Add a caption..." value={content} onChange={(e) => setContent(e.target.value)} style={{ marginTop: 12 }} />
              </>
            )}
          </div>
        )}

        {(type === "image" || type === "video") && (
          <div>
            <input ref={fileInputRef} type="file" style={{ display: "none" }} onChange={handleFileSelect} />
            {!mediaData ? (
              <div
                className="image-placeholder"
                style={{ cursor: "pointer", border: "2px dashed var(--border)", background: "var(--accent-subtle)", flexDirection: "column", gap: 8 }}
                onClick={() => triggerFileUpload(type === "image" ? "image/*" : "video/*")}
              >
                <Upload size={32} strokeWidth={1.5} />
                <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                  Upload {type === "image" ? "an image" : "a video"}
                </span>
              </div>
            ) : (
              <div>
                {type === "image" ? (
                  <img src={mediaData} alt="Preview" style={{ width: "100%", maxHeight: 300, objectFit: "contain", borderRadius: "var(--radius)", marginBottom: 8 }} />
                ) : (
                  <video controls src={mediaData} style={{ width: "100%", maxHeight: 300, borderRadius: "var(--radius)", marginBottom: 8 }} />
                )}
                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => { setMediaData(null); setMediaName(""); setSelectedFile(null); }}>
                  <Upload size={14} strokeWidth={1.5} /> Change
                </button>
                  {mediaName && <span style={{ fontSize: 12, color: "var(--text-tertiary)", alignSelf: "center" }}>{mediaName}</span>}
                </div>
              </div>
            )}
            <textarea className="memory-body-input" placeholder="Add a caption..." value={content} onChange={(e) => setContent(e.target.value)} style={{ marginTop: type === "image" || type === "video" ? (mediaData ? 0 : 12) : 12 }} />
          </div>
        )}
      </div>

      <div className="memory-bottom-toolbar">
        <button className="toolbar-btn" onClick={() => setType("voice")}>
          <Mic size={20} strokeWidth={1.5} />
          <span>Voice</span>
        </button>
        <button className="toolbar-btn" onClick={() => setType("image")}>
          <Image size={20} strokeWidth={1.5} />
          <span>Image</span>
        </button>
        <button className="toolbar-btn" onClick={() => setType("video")}>
          <Video size={20} strokeWidth={1.5} />
          <span>Video</span>
        </button>
        <button className="toolbar-btn" onClick={() => setType("checklist")}>
          <CheckSquare size={20} strokeWidth={1.5} />
          <span>Checklist</span>
        </button>
      </div>
    </div>
  );
}