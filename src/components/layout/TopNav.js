import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { getInitials } from "../../utils/helpers";
import { Search, Users, Calendar, Layout, MoreHorizontal, Lock, Trash2, LogOut, MessageSquare, Brain } from "lucide-react";

export default function TopNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, dispatch, handleLogout } = useApp();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const isActive = (path) => location.pathname === path;

  // Only show the navigation bar on the main/home/dashboard page
  if (!isActive("/home")) {
    return null;
  }

  return (
    <nav className="top-nav">
      <div className="nav-left">
        <button
          className="nav-brand-btn"
          onClick={() => navigate("/home")}
          title="MindVault Home"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontWeight: "700",
            fontSize: "16px",
            color: "var(--accent)",
            background: "none",
            border: "none",
            cursor: "pointer",
            marginRight: "12px",
            padding: "4px 8px",
            borderRadius: "var(--radius-sm)",
          }}
        >
          <Brain size={22} strokeWidth={1.5} />
          <span>MindVault</span>
        </button>
        <button
          className={`nav-btn ${isActive("/search") ? "active" : ""}`}
          onClick={() => navigate("/search")}
        >
          <Search size={16} strokeWidth={1.5} />
          <span>Search</span>
        </button>
      </div>

      <div className="nav-center">
        <button
          className={`nav-btn ${isActive("/collections") ? "active" : ""}`}
          onClick={() => navigate("/collections")}
        >
          <Layout size={16} strokeWidth={1.5} />
          <span>Collections</span>
        </button>
        <button
          className={`nav-btn ${isActive("/people") ? "active" : ""}`}
          onClick={() => navigate("/people")}
        >
          <Users size={16} strokeWidth={1.5} />
          <span>People</span>
        </button>
      </div>

      <div className="nav-right">
        <button
          className={`nav-btn ${isActive("/timeline") ? "active" : ""}`}
          onClick={() => navigate("/timeline")}
        >
          <Calendar size={16} strokeWidth={1.5} />
          <span>Timeline</span>
        </button>

        <div className="dropdown" ref={moreRef}>
          <button
            className="nav-icon-btn"
            onClick={() => setMoreOpen(!moreOpen)}
            title="More"
          >
            <MoreHorizontal size={18} strokeWidth={1.5} />
          </button>
          {moreOpen && (
            <div className="dropdown-menu" style={{ right: 0 }}>
              <button
                className="dropdown-item"
                onClick={() => { navigate("/vault"); setMoreOpen(false); }}
              >
                <Lock size={16} strokeWidth={1.5} />
                Private Vault
              </button>
              <button
                className="dropdown-item"
                onClick={() => { navigate("/deleted"); setMoreOpen(false); }}
              >
                <Trash2 size={16} strokeWidth={1.5} />
                Recently Deleted
              </button>
              <button
                className="dropdown-item"
                onClick={() => { navigate("/chat-history"); setMoreOpen(false); }}
              >
                <MessageSquare size={16} strokeWidth={1.5} />
                Chat History
              </button>
              <div className="dropdown-divider" />
              <button
                className="dropdown-item"
                onClick={() => {
                  handleLogout();
                  navigate("/");
                  setMoreOpen(false);
                }}
              >
                <LogOut size={16} strokeWidth={1.5} />
                Sign Out
              </button>
            </div>
          )}
        </div>

        <button
          className="nav-avatar"
          onClick={() => navigate("/profile")}
          title="Profile"
        >
          {state.user?.avatar ? (
            <img src={state.user.avatar} alt={state.user?.name || "User"} />
          ) : (
            getInitials(state.user?.name || "U")
          )}
        </button>
      </div>
    </nav>
  );
}
