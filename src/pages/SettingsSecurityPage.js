import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import TopNav from "../components/layout/TopNav";
import { useApp } from "../context/AppContext";
import * as authApi from "../api/auth";
import { ArrowLeft, Key, Save } from "lucide-react";
import "../styles/global.css";
import "../styles/pages.css";

export default function SettingsSecurityPage() {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage("All fields are required");
      return;
    }
    if (newPassword.length < 6) {
      setMessage("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage("New passwords do not match");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const result = await authApi.changePassword(currentPassword, newPassword);
      setMessage(result.message || "Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage(err.message || "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="app">
      <TopNav />
      <div className="main-content settings-sub-page">
        <button className="back-btn" onClick={() => navigate("/settings")}>
          <ArrowLeft size={16} strokeWidth={1.5} />
        </button>

        <div className="settings-header">
          <h1 className="settings-title">Password & Security</h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 4 }}>Manage password and account security</p>
        </div>

        <div className="profile-section">
          <div className="input-group" style={{ marginBottom: 16 }}>
            <label className="input-label">Current Password</label>
            <input
              type="password"
              className="input-field"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
            />
          </div>

          <div className="input-group" style={{ marginBottom: 16 }}>
            <label className="input-label">New Password</label>
            <input
              type="password"
              className="input-field"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password (min 6 characters)"
            />
          </div>

          <div className="input-group" style={{ marginBottom: 16 }}>
            <label className="input-label">Confirm New Password</label>
            <input
              type="password"
              className="input-field"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              onKeyDown={(e) => e.key === "Enter" && handleChangePassword()}
            />
          </div>

          {message && (
            <p style={{ fontSize: 13, color: message.includes("success") || message.includes("updated") ? "#10B981" : "#EF4444", marginBottom: 12 }}>
              {message}
            </p>
          )}

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button className="btn btn-secondary" onClick={() => navigate("/settings")}>Cancel</button>
            <button className="btn btn-primary" onClick={handleChangePassword} disabled={saving}>
              <Key size={14} strokeWidth={2} /> {saving ? "Updating..." : "Update Password"}
            </button>
          </div>
        </div>
        <div style={{ height: 20 }} />
      </div>
    </div>
  );
}