import React from "react";
import { useNavigate } from "react-router-dom";
import TopNav from "../components/layout/TopNav";
import { useApp } from "../context/AppContext";
import { useAppBackNavigation } from "../utils/useAppBackNavigation";
import {
  User, Lock, Globe, Sun, Trash2, MessageSquare, LogOut, ChevronRight,
  ArrowLeft,
} from "lucide-react";
import "../styles/global.css";
import "../styles/pages.css";

const SETTINGS_SECTIONS = [
  {
    title: "PREFERENCES",
    items: [
      { label: "Appearance", desc: "Manage theme and display preferences", icon: Sun, to: "/settings/appearance" },
      { label: "Language", desc: "Choose your MindVault language", icon: Globe, to: "/settings/language" },
    ],
  },
  {
    title: "ACCOUNT",
    items: [
      { label: "Personal Information", desc: "Manage your name, email and profile", icon: User, to: "/settings/profile" },
      { label: "Password & Security", desc: "Change password and manage security", icon: Lock, to: "/settings/security" },
    ],
  },
  {
    title: "DATA",
    items: [
      { label: "Recently Deleted", desc: "View and restore deleted memories", icon: Trash2, to: "/deleted" },
      { label: "Chat History", desc: "Manage your previous conversations", icon: MessageSquare, to: "/chat-history" },
    ],
  },
];

export default function SettingsPage() {
  const navigate = useNavigate();
  const { handleLogout } = useApp();
  const goBack = useAppBackNavigation("/profile");

  const onLogout = () => {
    handleLogout();
    navigate("/");
  };

  return (
    <div className="app">
      <TopNav />
      <div className="main-content settings-page">
        <button className="back-btn" onClick={goBack} aria-label="Go back">
          <ArrowLeft size={16} strokeWidth={1.5} />
        </button>

        <div className="settings-header">
          <h1 className="settings-title">Settings</h1>
        </div>

        {SETTINGS_SECTIONS.map((section) => (
          <div key={section.title} className="settings-section">
            <p className="section-label">{section.title}</p>
            <div className="profile-section">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="profile-row"
                    onClick={() => navigate(item.to)}
                  >
                    <div className="profile-row-left">
                      <Icon size={18} strokeWidth={1.5} />
                      <div>
                        <span className="profile-row-text">{item.label}</span>
                        <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 2 }}>{item.desc}</div>
                      </div>
                    </div>
                    <span className="profile-row-arrow"><ChevronRight size={16} strokeWidth={1.5} /></span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <p className="section-label" style={{ marginTop: 24 }}>ACCOUNT ACTIONS</p>
        <div className="profile-section">
          <div className="profile-row" onClick={onLogout}>
            <div className="profile-row-left"><LogOut size={18} strokeWidth={1.5} /><span className="profile-row-text" style={{ color: "#EF4444" }}>Log Out</span></div>
          </div>
        </div>
        <div style={{ height: 20 }} />
      </div>
    </div>
  );
}