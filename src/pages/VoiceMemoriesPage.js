import React, { useState, useEffect } from "react";
import TopNav from "../components/layout/TopNav";
import { useApp } from "../context/AppContext";
import { useAppBackNavigation } from "../utils/useAppBackNavigation";
import { getVoiceMemories, deleteVoiceMemory } from "../api/voice";
import VoicePlayer from "../components/voice/VoicePlayer";
import VoiceRecorder from "../components/voice/VoiceRecorder";
import { Mic, Plus, ArrowLeft } from "lucide-react";
import "../styles/global.css";
import "../styles/pages.css";

export default function VoiceMemoriesPage() {
  const { state, dispatch } = useApp();
  const goBack = useAppBackNavigation("/home");
  const [voiceMemories, setVoiceMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRecorder, setShowRecorder] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadVoiceMemories();
  }, []);

  const loadVoiceMemories = async () => {
    try {
      setLoading(true);
      const data = await getVoiceMemories();
      setVoiceMemories(data.data || []);
    } catch (err) {
      console.error("Error loading voice memories:", err);
      setError("Failed to load voice memories");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSuccess = (newMemory) => {
    setVoiceMemories([newMemory, ...voiceMemories]);
    setShowRecorder(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this voice memory?")) {
      return;
    }

    try {
      await deleteVoiceMemory(id);
      setVoiceMemories(voiceMemories.filter((vm) => vm.id !== id));
    } catch (err) {
      console.error("Error deleting voice memory:", err);
      alert("Failed to delete voice memory");
    }
  };

  return (
    <div className="app">
      <TopNav />
      <div className="main-content">
        <div className="page-header-row">
          <button className="back-btn" onClick={goBack} aria-label="Go back">
            <ArrowLeft size={16} strokeWidth={1.5} />
          </button>
        </div>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: "var(--text-primary)" }}>
                🎙 Voice Memories
              </h1>
              <p style={{ margin: "8px 0 0 0", fontSize: 14, color: "var(--text-secondary)" }}>
                Record and manage your voice notes
              </p>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => setShowRecorder(!showRecorder)}
              style={{ display: "flex", alignItems: "center", gap: 8 }}
            >
              <Plus size={18} />
              New Recording
            </button>
          </div>

          {error && (
            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid #EF4444", color: "#EF4444", padding: "12px 16px", borderRadius: "var(--radius-sm)", marginBottom: 16 }}>
              {error}
            </div>
          )}

          {showRecorder && (
            <div style={{ marginBottom: 32 }}>
              <VoiceRecorder
                onSaveSuccess={handleSaveSuccess}
                onCancel={() => setShowRecorder(false)}
              />
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-secondary)" }}>
              Loading voice memories...
            </div>
          ) : voiceMemories.length === 0 ? (
            <div className="empty-state" style={{ padding: "60px 20px" }}>
              <div className="empty-state-icon"><Mic size={48} strokeWidth={1.5} /></div>
              <p className="empty-state-title">No voice memories yet</p>
              <p className="empty-state-description">
                Click the "New Recording" button to create your first voice memory
              </p>
            </div>
          ) : (
            <div className="voice-list">
              {voiceMemories.map((voiceMemory) => (
                <VoicePlayer
                  key={voiceMemory.id}
                  voiceMemory={voiceMemory}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}