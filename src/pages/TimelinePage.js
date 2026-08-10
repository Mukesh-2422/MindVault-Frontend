import React from "react";
import { useNavigate } from "react-router-dom";
import TopNav from "../components/layout/TopNav";
import FAB from "../components/layout/FAB";
import { useApp } from "../context/AppContext";
import {
  groupMemoriesByDate,
  getMemoryTypeIcon,
  formatTime,
  truncate,
} from "../utils/helpers";
import { Calendar, Pin, ArrowLeft } from "lucide-react";
import "../styles/global.css";
import "../styles/pages.css";

export default function TimelinePage() {
  const navigate = useNavigate();
  const { state } = useApp();

  const activeMemories = state.memories.filter((m) => !m.deleted);
  const sorted = [...activeMemories].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );
  const groups = groupMemoriesByDate(sorted);

  return (
    <div className="app">
      <TopNav />
      <div className="main-content timeline-page">
        <button className="back-btn" onClick={() => navigate("/home")}>
          <ArrowLeft size={16} strokeWidth={1.5} />
        </button>
        <div className="timeline-header">
          <h1 className="timeline-title">
            <Calendar size={22} strokeWidth={1.5} />
            Timeline
          </h1>
        </div>

        {activeMemories.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Calendar size={48} strokeWidth={1.5} />
            </div>
            <p className="empty-state-title">No memories yet</p>
            <p className="empty-state-text">
              Start adding memories to see them here.
            </p>
          </div>
        ) : (
          Object.entries(groups).map(([label, mems]) => {
            if (mems.length === 0) return null;
            return (
              <div key={label} className="timeline-group">
                <p className="timeline-group-label">{label}</p>
                <div className="timeline-items">
                  {mems.map((m) => (
                    <div key={m.id} className="timeline-item">
                      <div className="timeline-dot" />
                      <div
                        className="timeline-card"
                        onClick={() => navigate(`/memory/${m.id}`)}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            marginBottom: 4,
                          }}
                        >
                          <span style={{ display: "flex" }}>
                            {getMemoryTypeIcon(m.type, 14)}
                          </span>
                          <p className="timeline-card-title">{m.title}</p>
                          {m.pinned && (
                            <span style={{ marginLeft: "auto", display: "flex", alignItems: "center" }}>
                              <Pin size={14} strokeWidth={2} />
                            </span>
                          )}
                        </div>
                        {(m.content || m.type === "checklist") && (
                          <p className="timeline-card-preview">
                            {m.type === "checklist" && m.checklist
                              ? `${m.checklist.filter((c) => c.done).length}/${m.checklist.length} completed`
                              : truncate(m.content, 90)}
                          </p>
                        )}
                        <div className="timeline-card-meta">
                          <span className="timeline-card-date">
                            {formatTime(m.date)}
                          </span>
                          {m.tags && m.tags.length > 0 && (
                            <span className="tag">{m.tags[0]}</span>
                          )}
                          {m.category && (
                            <span
                              style={{
                                fontSize: 11,
                                color: "var(--text-tertiary)",
                              }}
                            >
                              {m.category}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
      <FAB />
    </div>
  );
}
