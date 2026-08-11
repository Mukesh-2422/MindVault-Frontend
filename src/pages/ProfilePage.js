import React from "react";
import { useNavigate } from "react-router-dom";
import TopNav from "../components/layout/TopNav";
import { useApp } from "../context/AppContext";
import { getInitials } from "../utils/helpers";
import { useAppBackNavigation } from "../utils/useAppBackNavigation";
import {
  User, Edit3, ChevronRight, FileText, Mic, Image, Video, CheckSquare,
  Settings, ArrowLeft,
} from "lucide-react";
import "../styles/global.css";
import "../styles/pages.css";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { state } = useApp();
  const goBack = useAppBackNavigation("/home");

  const memories = state.memories.filter((m) => !m.deleted);
  const stats = {
    total: memories.length,
    text: memories.filter((m) => m.type === "text").length,
    voice: memories.filter((m) => m.type === "voice").length,
    image: memories.filter((m) => m.type === "image").length,
    video: memories.filter((m) => m.type === "video").length,
    checklist: memories.filter((m) => m.type === "checklist").length,
  };

  const mostActiveType = Object.entries(stats)
    .filter(([key]) => key !== "total")
    .sort(([, a], [, b]) => b - a)
    .find(([, count]) => count > 0);

  const mostActiveTypeLabel = mostActiveType ? mostActiveType[0] : "text";

  const mostActiveTypeIconMap = { text: FileText, voice: Mic, image: Image, video: Video, checklist: CheckSquare };
  const MostActiveIcon = mostActiveTypeIconMap[mostActiveTypeLabel] || FileText;

  const thisMonth = memories.filter((m) => {
    const d = new Date(m.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const mostMentioned = state.people.reduce((acc, p) => {
    const count = memories.filter((m) => m.relatedPerson === p.name).length;
    return count > (acc.count || 0) ? { name: p.name, count } : acc;
  }, {});

  return (
    <div className="app">
      <TopNav />
      <div className="main-content profile-page">
        <button className="back-btn" onClick={goBack} aria-label="Go back">
          <ArrowLeft size={16} strokeWidth={1.5} />
        </button>
        <div className="profile-header">
          <div className="profile-avatar" onClick={() => navigate("/settings/profile")} title="Edit profile picture">
            {state.user?.avatar
              ? <img src={state.user.avatar} alt="avatar" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
              : getInitials(state.user?.name || "U")
            }
            <div className="profile-avatar-edit"><Edit3 size={12} strokeWidth={2} /></div>
          </div>
          <h1 className="profile-name">{state.user?.name || "User"}</h1>
          <p className="profile-email">{state.user?.email || ""}</p>
          <button className="btn btn-secondary btn-sm" style={{ marginTop: 12 }} onClick={() => navigate("/settings/profile")}>
            <Edit3 size={14} strokeWidth={2} /> Edit Profile
          </button>
        </div>

        <p className="section-label">Statistics</p>
        <div className="stats-grid">
          <div className="stat-card"><p className="stat-number">{stats.total}</p><p className="stat-label">Total</p></div>
          <div className="stat-card"><p className="stat-number">{stats.text}</p><p className="stat-label"><FileText size={12} strokeWidth={1.5} /> Text</p></div>
          <div className="stat-card"><p className="stat-number">{stats.voice}</p><p className="stat-label"><Mic size={12} strokeWidth={1.5} /> Voice</p></div>
          <div className="stat-card"><p className="stat-number">{stats.image}</p><p className="stat-label"><Image size={12} strokeWidth={1.5} /> Image</p></div>
          <div className="stat-card"><p className="stat-number">{stats.video}</p><p className="stat-label"><Video size={12} strokeWidth={1.5} /> Video</p></div>
          <div className="stat-card"><p className="stat-number">{stats.checklist}</p><p className="stat-label"><CheckSquare size={12} strokeWidth={1.5} /> Lists</p></div>
        </div>

        <p className="section-label">Memory Insights</p>
        <div className="insight-card">
          <div className="insight-row"><span className="insight-label">This month</span><span className="insight-value">{thisMonth.length} memories</span></div>
          <div className="insight-row"><span className="insight-label">Most active type</span><span className="insight-value"><MostActiveIcon size={14} strokeWidth={1.5} style={{ marginRight: 4 }} />{mostActiveTypeLabel.charAt(0).toUpperCase() + mostActiveTypeLabel.slice(1)}</span></div>
          {mostMentioned.name && <div className="insight-row"><span className="insight-label">Most mentioned</span><span className="insight-value"><User size={14} strokeWidth={1.5} style={{ marginRight: 4 }} />{mostMentioned.name}</span></div>}
          <div className="insight-row"><span className="insight-label">Pinned memories</span><span className="insight-value">{memories.filter((m) => m.pinned).length}</span></div>
        </div>

        <p className="section-label" style={{ marginTop: 24 }}>Settings</p>
        <div className="profile-section">
          <div className="profile-row" onClick={() => navigate("/settings")}>
            <div className="profile-row-left"><Settings size={18} strokeWidth={1.5} /><span className="profile-row-text">Settings</span></div>
            <span className="profile-row-arrow"><ChevronRight size={16} strokeWidth={1.5} /></span>
          </div>
          <div style={{ padding: "12px 16px", fontSize: 13, color: "var(--text-tertiary)" }}>
            Manage your MindVault preferences
          </div>
        </div>
        <div style={{ height: 20 }} />
      </div>
    </div>
  );
}