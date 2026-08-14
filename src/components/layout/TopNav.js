import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { getInitials } from "../../utils/helpers";
import { Search, Users, Calendar, Layout, Brain } from "lucide-react";

export default function TopNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useApp();

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

        <button
          className="nav-avatar"
          onClick={() => navigate("/profile")}
          title="Profile"
        >
          {state.user?.avatar ? (
            <img src={state.user.avatar} alt={state.user?.name || "User"} />
          ) : (
            getInitials(state.user?.name || "M")
          )}
        </button>
      </div>
    </nav>
  );
}
