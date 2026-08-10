import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import TopNav from "../components/layout/TopNav";
import FAB from "../components/layout/FAB";
import MemoryCard from "../components/memory/MemoryCard";
import { useApp } from "../context/AppContext";
import { Layout, FileText, Mic, Image, Video, CheckSquare, ArrowLeft, AlertCircle, Plus } from "lucide-react";
import "../styles/global.css";
import "../styles/pages.css";

const TYPE_ORDER = ["text", "voice", "image", "video", "checklist"];
const TYPE_LABELS = { text: "Text", voice: "Voice", image: "Image", video: "Video", checklist: "Checklist" };
const TYPE_ICONS = { text: FileText, voice: Mic, image: Image, video: Video, checklist: CheckSquare };

export default function CollectionsPage() {
  const navigate = useNavigate();
  const { state } = useApp();
  const [selectedType, setSelectedType] = useState(null);

  const activeMemories = state.memories.filter((m) => !m.deleted);

  const getTypeCount = (type) => activeMemories.filter((m) => m.type === type).length;

  const filteredByType = selectedType
    ? activeMemories.filter((m) => m.type === selectedType)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
    : [];

  return (
    <div className="app">
      <TopNav />
      <div className="main-content collections-page">
        {!selectedType ? (
          <>
            <div className="page-header-row">
              <button className="back-btn" onClick={() => navigate("/home")}>
                <ArrowLeft size={16} strokeWidth={1.5} />
              </button>
            </div>
            <div className="section-header">
              <h1 className="collections-title">
                <Layout size={22} strokeWidth={1.5} />
                Collections
              </h1>
            </div>
            <button
              className="btn btn-primary"
              style={{ width: "100%", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
              onClick={() => navigate("/new?type=text")}
            >
              <Plus size={18} strokeWidth={1.5} />
              New Memory
            </button>
            <div className="collection-segments">
              {TYPE_ORDER.map((type) => {
                const count = getTypeCount(type);
                const Icon = TYPE_ICONS[type];
                return (
                  <button
                    key={type}
                    className="collection-segment"
                    onClick={() => setSelectedType(type)}
                  >
                    <div className="collection-segment-left">
                      <span className="collection-segment-icon">
                        {Icon && <Icon size={22} strokeWidth={1.5} />}
                      </span>
                      <div>
                        <p className="collection-segment-label">{TYPE_LABELS[type]}</p>
                        <p className="collection-segment-count">{count} {count === 1 ? "memory" : "memories"}</p>
                      </div>
                    </div>
                    <ArrowLeft size={18} strokeWidth={1.5} className="collection-segment-arrow" />
                  </button>
                );
              })}
              {TYPE_ORDER.every((t) => getTypeCount(t) === 0) && (
                <div className="empty-state">
                  <div className="empty-state-icon"><Layout size={48} strokeWidth={1.5} /></div>
                  <p className="empty-state-title">No memories yet</p>
                  <p className="empty-state-text">Add memories to see them organized here.</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="page-header-row">
              <button className="back-btn" onClick={() => setSelectedType(null)}>
                <ArrowLeft size={16} strokeWidth={1.5} />
              </button>
              <div className="collection-detail-title">
                {(() => {
                  const Icon = TYPE_ICONS[selectedType];
                  return Icon ? <Icon size={20} strokeWidth={1.5} /> : null;
                })()}
                <span>{TYPE_LABELS[selectedType]}</span>
                <span className="collection-count">{filteredByType.length}</span>
              </div>
            </div>
            {filteredByType.length > 0 ? (
              <div className="collection-items">
                {filteredByType.map((m) => (
                  <MemoryCard key={m.id} memory={m} />
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ marginTop: 40 }}>
                <div className="empty-state-icon"><AlertCircle size={48} strokeWidth={1.5} /></div>
                <p className="empty-state-title">No {TYPE_LABELS[selectedType].toLowerCase()} memories</p>
                <p className="empty-state-text">Create a new {TYPE_LABELS[selectedType].toLowerCase()} memory to get started.</p>
              </div>
            )}
          </>
        )}
      </div>
      <FAB />
    </div>
  );
}