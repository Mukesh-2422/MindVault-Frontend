import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Brain, ArrowLeft } from "lucide-react";
import { resetPassword } from "../api/auth";
import "../styles/intro.css";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [validToken, setValidToken] = useState(true);

  useEffect(() => {
    if (!token) {
      setValidToken(false);
      setError("Invalid reset link. Please request a new password reset.");
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

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const response = await resetPassword(token, password);
      setSuccess(response.message || "Password has been reset successfully. You can now log in.");
      setPassword("");
      setConfirmPassword("");
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
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
            <h1>Preserving Life's<br />Meaningful Moments</h1>
            <p>
              Revisit your favorite memories, discover hidden patterns in your
              thoughts, and keep your most important ideas safe — all in one
              private, beautifully organized space.
            </p>
          </div>

          <svg className="showcase-waves" viewBox="0 0 800 360" preserveAspectRatio="none" aria-hidden="true">
            {Array.from({ length: 10 }, (_, index) => (
              <path
                key={index}
                d={`M -40 ${72 + index * 21} C 170 ${-10 + index * 26}, 280 ${160 + index * 8}, 455 ${112 + index * 18} S 680 ${105 + index * 22}, 850 ${42 + index * 26}`}
              />
            ))}
          </svg>
        </section>

        <section className="login-panel">
          <div className="login-form-wrap">
            <div className="login-heading">
              <h2>Invalid Link</h2>
              <p>This password reset link is invalid or has expired.</p>
            </div>

            {error && <p className="login-message error">{error}</p>}

            <div className="login-forgot">
              <button type="button" onClick={() => navigate("/forgot-password")}>
                Request a new reset link
              </button>
            </div>

            <footer className="login-footer">
              <p>Remember your password? <button onClick={() => navigate("/login")}>Back to login</button></p>
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
          <h1>Preserving Life's<br />Meaningful Moments</h1>
          <p>
            Revisit your favorite memories, discover hidden patterns in your
            thoughts, and keep your most important ideas safe — all in one
            private, beautifully organized space.
          </p>
        </div>

        <svg className="showcase-waves" viewBox="0 0 800 360" preserveAspectRatio="none" aria-hidden="true">
          {Array.from({ length: 10 }, (_, index) => (
            <path
              key={index}
              d={`M -40 ${72 + index * 21} C 170 ${-10 + index * 26}, 280 ${160 + index * 8}, 455 ${112 + index * 18} S 680 ${105 + index * 22}, 850 ${42 + index * 26}`}
            />
          ))}
        </svg>
      </section>

      <section className="login-panel">
        <div className="login-form-wrap">
          <div className="login-heading">
            <h2>Reset Password</h2>
            <p>Enter your new password below</p>
          </div>

          {success && <p className="login-message success">{success}</p>}

          <form className="login-form" onSubmit={onSubmit}>
            <div className="login-input-group">
              <label htmlFor="new-password">New Password</label>
              <input
                id="new-password"
                type="password"
                placeholder="Enter new password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                minLength="6"
              />
            </div>

            <div className="login-input-group">
              <label htmlFor="confirm-password">Confirm Password</label>
              <input
                id="confirm-password"
                type="password"
                placeholder="Confirm new password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                minLength="6"
              />
            </div>

            {error && <p className="login-message error">{error}</p>}

            <button type="submit" className="login-submit" disabled={loading}>
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>

          <div className="login-forgot">
            <button type="button" onClick={() => navigate("/login")}>
              <ArrowLeft size={16} style={{ marginRight: "6px", verticalAlign: "middle" }} />
              Back to login
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