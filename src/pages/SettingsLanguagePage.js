import React from "react";
import TopNav from "../components/layout/TopNav";
import { useApp } from "../context/AppContext";
import { useAppBackNavigation } from "../utils/useAppBackNavigation";
import { ArrowLeft, Check, Globe } from "lucide-react";
import "../styles/global.css";
import "../styles/pages.css";

const LANGUAGES = [
  { label: "English", value: "en" },
  { label: "தமிழ்", value: "ta" },
  { label: "हिन्दी", value: "hi" },
];

export default function SettingsLanguagePage() {
  const goBack = useAppBackNavigation("/settings");
  const { state, dispatch } = useApp();

  const handleSelect = (value) => {
    dispatch({ type: "SET_LANGUAGE", payload: value });
  };

  return (
    <div className="app">
      <TopNav />
      <div className="main-content settings-sub-page">
        <button className="back-btn" onClick={goBack} aria-label="Go back">
          <ArrowLeft size={16} strokeWidth={1.5} />
        </button>

        <div className="settings-header">
          <h1 className="settings-title">Language</h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 4 }}>Choose your MindVault language</p>
        </div>

        <div className="profile-section">
          {LANGUAGES.map((l) => (
            <div
              key={l.value}
              className={`lang-option ${state.language === l.value ? "active" : ""}`}
              onClick={() => handleSelect(l.value)}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Globe size={16} strokeWidth={1.5} />
                <span>{l.label}</span>
              </div>
              {state.language === l.value && <span className="lang-check"><Check size={18} strokeWidth={2} /></span>}
            </div>
          ))}
        </div>
        <div style={{ height: 20 }} />
      </div>
    </div>
  );
}