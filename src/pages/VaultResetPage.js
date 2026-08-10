import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Brain, ArrowLeft, Eye, EyeOff, CheckCircle, XCircle, Lock } from "lucide-react";
import { resetVaultPassword } from "../api/vault";
import "../styles/intro.css";

export default function VaultResetPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [validToken, setValidToken] = useState(true);

  useEffect(() => {
    if (!token) {
      setValidToken(false);
      setError("Invalid reset link. Please request a new one.");
    }
  }, [token]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (password.length < 4) {
      setError("Password must be at least 4 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const response = await resetVaultPassword(token, password);
      setSuccess(response.message || "Vault password has been reset successfully! You can now access your vault.");
      setPassword("");
      setConfirmPassword("");
      setTimeout(() => navigate("/vault"), 3000);
    } catch (err) {
      const errMsg = err.message || "";
      setError(errMsg || "Failed to reset vault password. The link may have expired.");
      if (errMsg.includes("expired") || errMsg.includes("Invalid")) {
        setTimeout(() => navigate("/vault"), 4000);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!validToken) {
    return (
      <main className="login-page">
        <section className="login-showcase" aria-label="About MindVault">
          <button className="login-brand" type="button" onClick={() => navigate("/")}>
            <Brain size={27} strokeWidth={1.7} />
            <span>MINDVAULT</span>
          </button>
          <div className="showcase-copy">
            <h1>Private & Secure<br />Vault Reset</h1>
            <p>Reset your private vault password securely.</p>
          </div>
        </section>
        <section className="login-panel">
          <div className="login-form-wrap">
            <div className="login-heading">
              <h2>Invalid Link</h2>
              <p>This vault reset link is invalid or has expired.</p>
            </div>
            {error && <p className="login-message error">{error}</p>}
            <div className="login-forgot">
              <button type="button" onClick={() => navigate("/vault")}>Go to Vault</button>
            </div>
            <footer className="login-footer">
              <span>MindVault — Your personal memory space</span>
            </footer>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="login-page">
      <section className="login-showcase" aria-label="About MindVault">
        <button className="login-brand" type="button" onClick={() => navigate("/")}>
          <Brain size={27} strokeWidth={1.7} />
          <span>MINDVAULT</span>
        </button>
        <div className="showcase-copy">
          <h1>Reset Your<br />Private Vault</h1>
          <p>Create a new vault password to secure your most personal memories.</p>
        </div>
      </section>
      <section className="login-panel">
        <div className="login-form-wrap">
          <div className="login-heading">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {success ? <CheckCircle size={22} color="#22c55e" /> : (error && <XCircle size={22} color="#ef4444" />)}
              <h2>{success ? "Success!" : (error ? "Link Expired" : "Set Vault Password")}</h2>
            </div>
            <p>
              {success
                ? "Vault password reset! Redirecting to vault..."
                : (error
                  ? "This reset link is invalid or expired."
                  : "Enter a new password for your private vault.")}
            </p>
          </div>

          {!success && (
            <form className="login-form" onSubmit={onSubmit}>
              <div className="login-input-group">
                <label htmlFor="vault-new-password">New Vault Password</label>
                <div className="password-input-wrap">
                  <input
                    id="vault-new-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="At least 4 characters"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading || !!success}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="login-input-group">
                <label htmlFor="vault-confirm-password">Confirm New Password</label>
                <div className="password-input-wrap">
                  <input
                    id="vault-confirm-password"
                    type={showConfirm ? "text" : "password"}
                    placeholder="Re-enter new vault password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading || !!success}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirm(!showConfirm)}
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && !success && <p className="login-message error" style={{ fontSize: 13 }}>{error}</p>}

              <button type="submit" className="login-submit" disabled={loading || !!success}>
                {loading ? "Resetting..." : "Reset Vault Password"}
              </button>
            </form>
          )}

          <div className="login-forgot">
            <button type="button" onClick={() => navigate(error ? "/vault" : "/vault")}>
              <ArrowLeft size={16} style={{ marginRight: "6px", verticalAlign: "middle" }} />
              {error ? "Request a new reset link" : "Back to vault"}
            </button>
          </div>

          <footer className="login-footer">
            <p>Don't have an account? <button onClick={() => navigate("/register")}>Create an account</button></p>
            <span>MindVault — Your personal memory space</span>
          </footer>
        </div>
      </section>
    </main>
  );
}