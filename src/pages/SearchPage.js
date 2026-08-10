import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import TopNav from "../components/layout/TopNav";
import FAB from "../components/layout/FAB";
import MemoryCard from "../components/memory/MemoryCard";
import { useApp } from "../context/AppContext";
import { Search, FileText, Mic, Image, Video, CheckSquare, Pin, X, SearchX, ArrowLeft } from "lucide-react";
import "../styles/global.css";
import "../styles/pages.css";

const FILTERS = [
  { label: "All", value: "all", icon: null },
  { label: "Text", value: "text", icon: FileText },
  { label: "Voice", value: "voice", icon: Mic },
  { label: "Image", value: "image", icon: Image },
  { label: "Video", value: "video", icon: Video },
  { label: "Checklist", value: "checklist", icon: CheckSquare },
  { label: "Pinned", value: "pinned", icon: Pin },
];

const EXAMPLE_QUERIES = [
  "Where did I keep my keys?",
  "When is my interview?",
  "Show memories about John",
  "What did I do last week?",
  "Find my project notes",
];

export default function SearchPage() {
  const navigate = useNavigate();
  const { state } = useApp();
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const results = useMemo(() => {
    let mems = state.memories.filter((m) => !m.deleted);

    if (activeFilter === "pinned") {
      mems = mems.filter((m) => m.pinned);
    } else if (activeFilter !== "all") {
      mems = mems.filter((m) => m.type === activeFilter);
    }

    if (!query.trim()) return mems;

    const q = query.toLowerCase();
    return mems.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.content.toLowerCase().includes(q) ||
        (m.tags && m.tags.some((t) => t.includes(q))) ||
        (m.category && m.category.toLowerCase().includes(q)) ||
        (m.relatedPerson && m.relatedPerson.toLowerCase().includes(q))
    );
  }, [state.memories, query, activeFilter]);

  const handleExample = (ex) => {
    setQuery(ex);
  };

  return (
    <div className="app">
      <TopNav />
      <div className="main-content search-page">
        <div className="page-header-row">
          <button className="back-btn" onClick={() => navigate("/home")}>
            <ArrowLeft size={16} strokeWidth={1.5} />
          </button>
          <h1 className="search-page-title">Ask MindVault</h1>
        </div>

        <div className="search-input-box">
          <Search size={18} strokeWidth={1.5} />
          <input
            className="search-input"
            placeholder="Ask about your memories..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {query && (
            <button
              style={{
                color: "var(--text-tertiary)",
                cursor: "pointer",
                background: "none",
                border: "none",
                display: "flex",
                alignItems: "center",
              }}
              onClick={() => setQuery("")}
            >
              <X size={18} strokeWidth={1.5} />
            </button>
          )}
          <button
            style={{
              color: "var(--text-secondary)",
              cursor: "pointer",
              background: "none",
              border: "none",
              display: "flex",
              alignItems: "center",
            }}
            title="Voice search"
          >
            <Mic size={18} strokeWidth={1.5} />
          </button>
        </div>

        <div className="search-filter-bar">
          {FILTERS.map((f) => {
            const Icon = f.icon;
            return (
              <button
                key={f.value}
                className={`filter-chip ${activeFilter === f.value ? "active" : ""}`}
                onClick={() => setActiveFilter(f.value)}
              >
                {Icon && <Icon size={14} strokeWidth={1.5} />}
                {f.label}
              </button>
            );
          })}
        </div>

        {!query && (
          <div className="search-examples">
            <p className="search-examples-label">Try asking</p>
            {EXAMPLE_QUERIES.map((ex) => (
              <button
                key={ex}
                className="example-query"
                onClick={() => handleExample(ex)}
              >
                <Search size={16} strokeWidth={1.5} />
                <span>{ex}</span>
              </button>
            ))}
          </div>
        )}

        {query && (
          <p className="search-results-count">
            {results.length} result{results.length !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
          </p>
        )}

        {results.length === 0 && query ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <SearchX size={48} strokeWidth={1.5} />
            </div>
            <p className="empty-state-title">Nothing found</p>
            <p className="empty-state-text">
              Try different keywords or add this as a new memory.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {results.map((m) => (
              <MemoryCard key={m.id} memory={m} />
            ))}
          </div>
        )}
      </div>
      <FAB />
    </div>
  );
}
