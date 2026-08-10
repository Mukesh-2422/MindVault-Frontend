import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TopNav from "../components/layout/TopNav";
import FAB from "../components/layout/FAB";
import MemoryCard from "../components/memory/MemoryCard";
import { useApp } from "../context/AppContext";
import {
  createVault,
  unlockVault,
  lockVault,
  getVaultMemories,
  getVaultStatus,
  changeVaultPassword,
  resetVault,
  forgotVaultPassword,
} from "../api/vault";
import {
  Lock,
  Unlock,
  FileText,
  Mic,
  Image,
  Video,
  User,
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Camera,
  Settings,
  Key,
  X,
  Shield,
  ShieldCheck,
  Trash2,
  AlertOctagon,
} from "lucide-react";
import "../styles/global.css";
import "../styles/pages.css";

export default function VaultPage() {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();

  // Primary form states
  const [passwordInput, setPasswordInput] = useState("");
  const [confirmInput, setConfirmInput] = useState("");
  const [error, setError] = useState("");
  const [vaultMemories, setVaultMemories] = useState([]);
  const [loadingMemories, setLoadingMemories] = useState(false);

  // Forgot password state
  const [showForgotConfirm, setShowForgotConfirm] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotStep, setForgotStep] = useState("email"); // "email" or "reset"
  const [forgotConfirmInput, setForgotConfirmInput] = useState("");
  const [resetting, setResetting] = useState(false);

  // Vault Settings Modal & Change Password states
  const [showSettings, setShowSettings] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [changeError, setChangeError] = useState("");
  const [changeSuccess, setChangeSuccess] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Always lock vault on mount so user must enter password every time
  useEffect(() => {
    dispatch({ type: "LOCK_VAULT" });
    // Check if vault password is set on server (don't use locked state from server)
    const checkVault = async () => {
      try {
        const status = await getVaultStatus();
        // Only update passwordSet flag, always keep locked=true
        if (status.passwordSet) {
          dispatch({ type: "SET_VAULT_STATUS", payload: { locked: true, passwordSet: true } });
        }
      } catch (err) {
        console.error("Error checking vault status:", err);
      }
    };
    checkVault();
  }, []);

  useEffect(() => {
    if (!state.vaultLocked) {
      loadVaultMemories();
    }
  }, [state.vaultLocked]);

  const loadVaultMemories = async () => {
    setLoadingMemories(true);
    try {
      const memories = await getVaultMemories();
      setVaultMemories(memories);
    } catch (err) {
      console.error("Failed to load vault memories:", err);
    } finally {
      setLoadingMemories(false);
    }
  };

  const handleCreate = async () => {
    setError("");
    if (passwordInput.length < 4) {
      setError("Password must be at least 4 characters.");
      return;
    }
    if (passwordInput !== confirmInput) {
      setError("Passwords do not match.");
      return;
    }
    try {
      const result = await createVault(passwordInput);
      dispatch({ type: "SET_VAULT_STATUS", payload: result });
      setError("");
      setPasswordInput("");
      setConfirmInput("");
    } catch (err) {
      setError(err.message || "Failed to create vault.");
    }
  };

  const handleUnlock = async () => {
    setError("");
    try {
      const result = await unlockVault(passwordInput);
      dispatch({ type: "SET_VAULT_STATUS", payload: result });
      setError("");
      setPasswordInput("");
    } catch (err) {
      setError(err.message || "Incorrect password.");
    }
  };

  const handleLockVault = async () => {
    try {
      const result = await lockVault();
      dispatch({ type: "SET_VAULT_STATUS", payload: result });
      setShowSettings(false);
      setPasswordInput("");
    } catch (err) {
      console.error("Error locking vault:", err);
    }
  };

  const handleSendResetEmail = async () => {
    if (!forgotEmail) {
      setError("Please enter your email address.");
      return;
    }
    setResetting(true);
    try {
      const response = await forgotVaultPassword(forgotEmail);
      setError("");
      setForgotStep("reset");
      // Show success message (you could add a success state if needed)
      console.log(response.message);
    } catch (err) {
      setError(err.message || "Failed to send reset email.");
    } finally {
      setResetting(false);
    }
  };

  const handleResetVault = async () => {
    if (forgotConfirmInput !== "RESET") {
      setError('Type "RESET" to confirm.');
      return;
    }
    setResetting(true);
    try {
      await resetVault();
      dispatch({ type: "SET_VAULT_STATUS", payload: { locked: true, passwordSet: false } });
      setShowForgotConfirm(false);
      setForgotConfirmInput("");
      setForgotEmail("");
      setForgotStep("email");
      setError("");
      setPasswordInput("");
    } catch (err) {
      setError(err.message || "Failed to reset vault.");
    } finally {
      setResetting(false);
    }
  };

  const handleChangePassword = async () => {
    setChangeError("");
    setChangeSuccess("");
    if (!currentPassword) {
      setChangeError("Please enter your current password.");
      return;
    }
    if (newPassword.length < 4) {
      setChangeError("New password must be at least 4 characters.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setChangeError("New passwords do not match.");
      return;
    }

    setUpdatingPassword(true);
    try {
      const res = await changeVaultPassword(currentPassword, newPassword);
      setChangeSuccess(res.message || "Vault password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err) {
      setChangeError(err.message || "Failed to change password.");
    } finally {
      setUpdatingPassword(false);
    }
  };

  // 1. Password Not Set Yet (First Time Setup)
  if (!state.vaultPasswordSet) {
    return (
      <div className="app">
        <TopNav />
        <div className="main-content vault-page">
          <div className="page-header-row">
            <button className="back-btn" onClick={() => navigate("/home")}>
              <ArrowLeft size={16} strokeWidth={1.5} />
            </button>
          </div>
          <div className="vault-header">
            <ShieldCheck size={56} strokeWidth={1.2} style={{ color: "var(--accent)" }} />
            <h1 className="vault-title">Setup Private Vault</h1>
            <p className="vault-subtitle">First, set a password to initialize your secure vault.</p>
          </div>
          <div className="vault-lock-box">
            <p className="vault-lock-title">Create Vault Password</p>
            <div className="vault-settings-badge" style={{ width: "100%", boxSizing: "border-box", justifyContent: "center" }}>
              <Shield size={14} /> Password protects all your vault memories
            </div>
            <div className="input-group" style={{ marginBottom: 12 }}>
              <label className="input-label">Master Password</label>
              <input
                type="password"
                className="input-field"
                placeholder="Enter password (min 4 chars)"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    document.querySelector(".vault-confirm-input")?.focus();
                  }
                }}
              />
            </div>
            <div className="input-group" style={{ marginBottom: 20 }}>
              <label className="input-label">Confirm Password</label>
              <input
                type="password"
                className="input-field vault-confirm-input"
                placeholder="Confirm master password"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleCreate();
                  }
                }}
              />
            </div>
            {error && <p style={{ color: "#EF4444", fontSize: 13, marginBottom: 12 }}>{error}</p>}
            <button className="btn btn-primary btn-full" onClick={handleCreate}>
              <CheckCircle size={16} strokeWidth={2} /> Create Vault & Set Password
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Vault Is Locked
  if (state.vaultLocked) {
    return (
      <div className="app">
        <TopNav />
        <div className="main-content vault-page">
          <div className="page-header-row">
            <button className="back-btn" onClick={() => navigate("/home")}>
              <ArrowLeft size={16} strokeWidth={1.5} />
            </button>
          </div>
          <div className="vault-header">
            <Lock size={56} strokeWidth={1.2} />
            <h1 className="vault-title">Private Vault</h1>
            <p className="vault-subtitle">Enter your password to access your vault.</p>
          </div>
          <div className="vault-lock-box">
            <p className="vault-lock-title">Unlock Vault</p>
            <div className="input-group" style={{ marginBottom: 16 }}>
              <label className="input-label">Password</label>
              <input
                type="password"
                className="input-field"
                placeholder="Enter vault password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
              />
            </div>
            {error && <p style={{ color: "#EF4444", fontSize: 13, marginBottom: 12 }}>{error}</p>}
            <button className="btn btn-primary btn-full" onClick={handleUnlock} style={{ marginBottom: 16 }}>
              <Unlock size={16} strokeWidth={2} /> Unlock Vault
            </button>
            <div className="vault-or">or</div>
            <button className="vault-face-btn" style={{ marginTop: 16 }}>
              <Camera size={18} strokeWidth={1.5} /> Use Face Lock
            </button>
            <div style={{ textAlign: "center", marginTop: 16 }}>
              <button
                onClick={() => { setShowForgotConfirm(true); setError(""); setForgotConfirmInput(""); }}
                style={{ background: "none", border: "none", color: "var(--text-tertiary)", fontSize: 13, cursor: "pointer", textDecoration: "underline", padding: 4 }}
              >
                Forgot Password?
              </button>
            </div>
          </div>

          {/* Forgot Password Confirmation Modal */}
          {showForgotConfirm && (
            <div className="vault-modal-overlay" onClick={() => { setShowForgotConfirm(false); setForgotStep("email"); }}>
              <div className="vault-lock-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400, margin: "20vh auto 0", position: "relative" }}>
                <button
                  onClick={() => { setShowForgotConfirm(false); setForgotStep("email"); }}
                  style={{ position: "absolute", top: 12, right: 12, background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", padding: 4 }}
                >
                  <X size={18} strokeWidth={1.5} />
                </button>
                
                {forgotStep === "email" ? (
                  <>
                    <div style={{ textAlign: "center", marginBottom: 20 }}>
                      <AlertOctagon size={40} strokeWidth={1.2} style={{ color: "#EF4444", marginBottom: 8 }} />
                      <p className="vault-lock-title" style={{ fontSize: 18, color: "#EF4444" }}>Forgot Vault Password?</p>
                      <p style={{ fontSize: 13, color: "var(--text-tertiary)", marginTop: 4, lineHeight: 1.5 }}>
                        Enter your email address and we'll send you a password reset link.
                      </p>
                    </div>
                    <div className="input-group" style={{ marginBottom: 16 }}>
                      <label className="input-label">Email Address</label>
                      <input
                        type="email"
                        className="input-field"
                        placeholder="you@example.com"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSendResetEmail()}
                      />
                    </div>
                    {error && <p style={{ color: "#EF4444", fontSize: 13, marginBottom: 12 }}>{error}</p>}
                    <button 
                      className="btn btn-primary btn-full" 
                      onClick={handleSendResetEmail} 
                      disabled={resetting}
                      style={{ marginBottom: 12 }}
                    >
                      {resetting ? "Sending..." : "Send Reset Link"}
                    </button>
                    <div style={{ textAlign: "center", marginTop: 12 }}>
                      <button
                        onClick={() => setForgotStep("reset")}
                        style={{ background: "none", border: "none", color: "var(--text-tertiary)", fontSize: 13, cursor: "pointer", textDecoration: "underline", padding: 4 }}
                      >
                        Or reset vault manually (deletes all memories)
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ textAlign: "center", marginBottom: 20 }}>
                      <AlertOctagon size={40} strokeWidth={1.2} style={{ color: "#EF4444", marginBottom: 8 }} />
                      <p className="vault-lock-title" style={{ fontSize: 18, color: "#EF4444" }}>Reset Vault?</p>
                      <p style={{ fontSize: 13, color: "var(--text-tertiary)", marginTop: 4, lineHeight: 1.5 }}>
                        This will permanently delete all vault memories and allow you to set a new password.
                        <br />
                        <strong>This action cannot be undone!</strong>
                      </p>
                    </div>
                    <div className="input-group" style={{ marginBottom: 16 }}>
                      <label className="input-label">Type <strong>RESET</strong> to confirm</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder='Type "RESET"'
                        value={forgotConfirmInput}
                        onChange={(e) => setForgotConfirmInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleResetVault()}
                      />
                    </div>
                    {error && !error.includes("Incorrect") && <p style={{ color: "#EF4444", fontSize: 13, marginBottom: 12 }}>{error}</p>}
                    <button className="btn btn-danger btn-full" onClick={handleResetVault} disabled={resetting}>
                      <Trash2 size={16} strokeWidth={2} /> {resetting ? "Resetting..." : "Reset Vault"}
                    </button>
                    <div style={{ textAlign: "center", marginTop: 12 }}>
                      <button
                        onClick={() => setForgotStep("email")}
                        style={{ background: "none", border: "none", color: "var(--text-tertiary)", fontSize: 13, cursor: "pointer", textDecoration: "underline", padding: 4 }}
                      >
                        ← Back to email option
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 3. Vault Unlocked
  return (
    <div className="app">
      <TopNav />
      <div className="main-content vault-page">
        <div className="page-header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button className="back-btn" onClick={() => navigate("/home")}>
            <ArrowLeft size={16} strokeWidth={1.5} />
          </button>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              className="btn btn-secondary"
              onClick={handleLockVault}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", fontSize: 13 }}
            >
              <Lock size={14} strokeWidth={1.5} /> Lock Vault
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setShowSettings(true);
                setChangeError("");
                setChangeSuccess("");
              }}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", fontSize: 13 }}
            >
              <Settings size={14} strokeWidth={1.5} /> Vault Settings
            </button>
          </div>
        </div>

        <div className="vault-header">
          <Unlock size={56} strokeWidth={1.2} />
          <h1 className="vault-title">Private Vault</h1>
          <p className="vault-subtitle">Your most personal memories, secured.</p>
        </div>

        {loadingMemories ? (
          <p style={{ textAlign: "center", color: "var(--text-tertiary)", marginTop: 24 }}>Loading vault memories...</p>
        ) : vaultMemories.length === 0 ? (
          <div className="empty-state" style={{ marginTop: 16 }}>
            <div className="empty-state-icon">
              <Lock size={48} strokeWidth={1.5} />
            </div>
            <p className="empty-state-title">No vault memories yet</p>
            <p className="empty-state-text">Move memories to the vault to keep them private.</p>
          </div>
        ) : (
          <div className="collection-items">
            {vaultMemories.map((m) => (
              <MemoryCard key={m.id} memory={m} />
            ))}
          </div>
        )}

        {/* Vault Settings Modal */}
        {showSettings && (
          <div className="vault-modal-overlay" onClick={() => setShowSettings(false)}>
            <div className="vault-modal-card" onClick={(e) => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Shield size={20} style={{ color: "var(--accent)" }} />
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: "var(--text-primary)" }}>
                    Vault Settings & Password
                  </h3>
                </div>
                <button
                  className="icon-btn"
                  onClick={() => setShowSettings(false)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="vault-settings-badge">
                <Key size={14} /> Password Change Option
              </div>

              <div className="input-group" style={{ marginBottom: 12 }}>
                <label className="input-label">Current Password</label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>

              <div className="input-group" style={{ marginBottom: 12 }}>
                <label className="input-label">New Password</label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="Enter new password (min 4 chars)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div className="input-group" style={{ marginBottom: 16 }}>
                <label className="input-label">Confirm New Password</label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="Confirm new password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleChangePassword()}
                />
              </div>

              {changeError && <p style={{ color: "#EF4444", fontSize: 13, marginBottom: 12 }}>{changeError}</p>}
              {changeSuccess && <p style={{ color: "#10B981", fontSize: 13, marginBottom: 12 }}>{changeSuccess}</p>}

              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  onClick={handleChangePassword}
                  disabled={updatingPassword}
                >
                  <Key size={15} style={{ marginRight: 6 }} />{" "}
                  {updatingPassword ? "Updating..." : "Update Password"}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={handleLockVault}
                  style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
                >
                  <Lock size={14} /> Lock Vault
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <FAB />
    </div>
  );
}