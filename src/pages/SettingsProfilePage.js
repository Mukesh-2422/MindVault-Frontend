import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TopNav from "../components/layout/TopNav";
import { useApp } from "../context/AppContext";
import { useAppBackNavigation } from "../utils/useAppBackNavigation";
import { getInitials } from "../utils/helpers";
import * as authApi from "../api/auth";
import { User, ArrowLeft, Save, Camera } from "lucide-react";
import "../styles/global.css";
import "../styles/pages.css";

export default function SettingsProfilePage() {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const goBack = useAppBackNavigation("/settings");

  const [name, setName] = useState(state.user?.name || "");
  const [email] = useState(state.user?.email || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setName(state.user?.name || "");
    setMessage("");
  }, [state.user]);

  const handleSave = async () => {
    if (!name.trim()) {
      setMessage("Name is required");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const updated = await authApi.updateProfile({ name: name.trim() });
      dispatch({ type: "UPDATE_USER", payload: updated });
      setMessage("Profile updated successfully");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="app">
      <TopNav />
      <div className="main-content settings-sub-page">
        <button className="back-btn" onClick={goBack} aria-label="Go back">
          <ArrowLeft size={16} strokeWidth={1.5} />
        </button>

        <div className="settings-header">
          <h1 className="settings-title">Personal Information</h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 4 }}>Manage your name, email, profile picture and personal information</p>
        </div>

        <div className="profile-section">
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
            <div className="profile-avatar" style={{ cursor: "default" }}>
              {state.user?.avatar
                ? <img src={state.user.avatar} alt="avatar" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                : getInitials(state.user?.name || "U")
              }
            </div>
            <div>
              <p style={{ fontWeight: 600, color: "var(--text-primary)" }}>Profile Picture</p>
              <p style={{ fontSize: 12, color: "var(--text-tertiary)" }}>Profile picture updates are handled by your account provider</p>
            </div>
          </div>

          <div className="input-group" style={{ marginBottom: 16 }}>
            <label className="input-label">Name</label>
            <input
              type="text"
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>

          <div className="input-group" style={{ marginBottom: 16 }}>
            <label className="input-label">Email</label>
            <input
              type="email"
              className="input-field"
              value={email}
              disabled
              style={{ opacity: 0.6, cursor: "not-allowed" }}
            />
            <p style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 4 }}>Email cannot be changed</p>
          </div>

          {message && (
            <p style={{ fontSize: 13, color: message.includes("success") ? "#10B981" : "#EF4444", marginBottom: 12 }}>
              {message}
            </p>
          )}

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button className="btn btn-secondary" onClick={() => navigate("/settings")}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              <Save size={14} strokeWidth={2} /> {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
        <div style={{ height: 20 }} />
      </div>
    </div>
  );
}