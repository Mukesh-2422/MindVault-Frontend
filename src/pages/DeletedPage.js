import React from "react";
import { useNavigate } from "react-router-dom";
import TopNav from "../components/layout/TopNav";
import { useApp } from "../context/AppContext";
import { restoreMemory, permanentDeleteMemory } from "../api/memories";
import { formatDate, getDaysUntilDelete, getMemoryTypeIcon, truncate } from "../utils/helpers";
import { Trash2, AlertTriangle, RotateCcw, XCircle, Trash, ArrowLeft } from "lucide-react";
import "../styles/global.css";
import "../styles/pages.css";

export default function DeletedPage() {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();

  const deletedMemories = state.memories
    .filter((m) => m.deleted)
    .sort((a, b) => new Date(b.deletedAt) - new Date(a.deletedAt));

  const handleRestore = async (id) => {
    try {
      await restoreMemory(id);
      dispatch({ type: "RESTORE_MEMORY", payload: id });
    } catch (err) {
      console.error("Restore failed:", err);
    }
  };

  const handlePermanentDelete = async (id) => {
    try {
      await permanentDeleteMemory(id);
      dispatch({ type: "PERMANENT_DELETE", payload: id });
    } catch (err) {
      console.error("Permanent delete failed:", err);
    }
  };

  const handleEmptyTrash = async () => {
    for (const m of deletedMemories) {
      await permanentDeleteMemory(m.id);
      dispatch({ type: "PERMANENT_DELETE", payload: m.id });
    }
  };

  return (
    <div className="app">
      <TopNav />
      <div className="main-content deleted-page">
        <button className="back-btn" onClick={() => navigate("/home")}>
          <ArrowLeft size={16} strokeWidth={1.5} />
        </button>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 12, marginBottom: 4 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
            <Trash2 size={22} strokeWidth={1.5} />
            Recently Deleted
          </h1>
          {deletedMemories.length > 0 && (
            <button className="btn btn-danger btn-sm" onClick={handleEmptyTrash}>
              <Trash size={14} strokeWidth={1.5} />
              Empty Trash
            </button>
          )}
        </div>

        <div className="deleted-warning">
          <AlertTriangle size={16} strokeWidth={1.5} />
          Memories are permanently deleted after 30 days.
        </div>

        {deletedMemories.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Trash2 size={48} strokeWidth={1.5} /></div>
            <p className="empty-state-title">Trash is empty</p>
            <p className="empty-state-text">Deleted memories appear here for 30 days before being permanently removed.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {deletedMemories.map((m) => {
              const daysLeft = getDaysUntilDelete(m.deletedAt);
              return (
                <div key={m.id} className="deleted-card">
                  <div className="deleted-card-header">
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ display: "flex" }}>{getMemoryTypeIcon(m.type, 16)}</span>
                      <p className="deleted-card-title">{m.title}</p>
                    </div>
                    <span className="deleted-card-days">{daysLeft}d left</span>
                  </div>
                  {m.content && <p className="deleted-card-content">{truncate(m.content, 100)}</p>}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>Deleted {formatDate(m.deletedAt)}</span>
                  </div>
                  <div className="deleted-card-actions">
                    <button className="btn btn-secondary btn-sm" onClick={() => handleRestore(m.id)}>
                      <RotateCcw size={14} strokeWidth={1.5} /> Restore
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => handlePermanentDelete(m.id)}>
                      <XCircle size={14} strokeWidth={1.5} /> Delete Permanently
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
