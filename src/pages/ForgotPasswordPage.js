import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Brain, ArrowLeft } from "lucide-react";
import { forgotPassword } from "../api/auth";
import "../styles/intro.css";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const response = await forgotPassword(email.trim());
      setSuccess(response.message || "Check your email for a password reset link.");
      setEmail("");
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
            <p>Enter your email and we'll send you instructions</p>
          </div>

          {success && <p className="login-message success">{success}</p>}

          <form className="login-form" onSubmit={onSubmit}>
            <div className="login-input-group">
              <label htmlFor="reset-email">Email Address</label>
              <input
                id="reset-email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            {error && <p className="login-message error">{error}</p>}

            <button type="submit" className="login-submit" disabled={loading}>
              {loading ? "Sending..." : "Send Reset Link"}
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