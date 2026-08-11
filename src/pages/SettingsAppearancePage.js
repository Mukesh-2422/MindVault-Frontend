import React from "react";
import TopNav from "../components/layout/TopNav";
import { useApp } from "../context/AppContext";
import { useAppBackNavigation } from "../utils/useAppBackNavigation";
import { ArrowLeft, Sun, Moon, Monitor, Check } from "lucide-react";
import "../styles/global.css";
import "../styles/pages.css";

const THEMES = [
  { label: "Light", value: "light", icon: Sun },
  { label: "Dark", value: "dark", icon: Moon },
  { label: "System", value: "system", icon: Monitor },
];

export default function SettingsAppearancePage() {
  const goBack = useAppBackNavigation("/settings");
  const { state, dispatch } = useApp();

  const handleSelect = (value) => {
    dispatch({ type: "SET_THEME", payload: value });
  };

  return (
    <div className="app">
      <TopNav />
      <div className="main-content settings-sub-page">
        <button className="back-btn" onClick={goBack} aria-label="Go back">
          <ArrowLeft size={16} strokeWidth={1.5} />
        </button>

        <div className="settings-header">
          <h1 className="settings-title">Appearance</h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 4 }}>Manage theme and display preferences</p>
        </div>

        <div className="profile-section">
          {THEMES.map((t) => {
            const Icon = t.icon;
            return (
              <div
                key={t.value}
                className={`lang-option ${state.theme === t.value ? "active" : ""}`}
                onClick={() => handleSelect(t.value)}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Icon size={16} strokeWidth={1.5} />
                  <span>{t.label}</span>
                </div>
                {state.theme === t.value && <span className="lang-check"><Check size={18} strokeWidth={2} /></span>}
              </div>
            );
          })}
        </div>
        <div style={{ height: 20 }} />
      </div>
    </div>
  );
}