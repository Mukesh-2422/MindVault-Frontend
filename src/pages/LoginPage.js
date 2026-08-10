import React, { useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { Brain, Eye, EyeOff } from "lucide-react";
import "../styles/intro.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { handleLogin } = useApp();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [success] = useState(
    location.state?.registered ? "Account created! Please sign in." :
    location.state?.resetSuccess ? "Password reset successful! You can now sign in with your new password." :
    ""
  );
  const [showPassword, setShowPassword] = useState(false);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError("Please fill in all fields.");
      return;
    }
    try {
      await handleLogin(form.email, form.password);
      navigate("/home");
    } catch (err) {
      setForm((prev) => ({ ...prev, password: "" }));
      setError(err.message || "Login failed");
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
            <h2>Welcome Back</h2>
            <p>Sign in to continue to MindVault</p>
          </div>

          {success && <p className="login-message success">{success}</p>}

          <form className="login-form" onSubmit={onSubmit}>
            <div className="login-input-group">
              <label htmlFor="login-email">Email Address</label>
              <input
                id="login-email"
                ref={emailRef}
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={form.email}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    passwordRef.current?.focus();
                  }
                }}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div className="login-input-group">
              <label htmlFor="login-password">Password</label>
              <div className="password-field">
                <input
                  id="login-password"
                  ref={passwordRef}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </div>

            {error && <p className="login-message error">{error}</p>}

            <button type="submit" className="login-submit">Sign In</button>
          </form>

          <div className="login-forgot">
            <button type="button" onClick={() => navigate("/forgot-password")}>Forgot password?</button>
          </div>

          <footer className="login-footer">
            <p>New to MindVault? <button onClick={() => navigate("/register")}>Create an account</button></p>
            <span>MindVault — Your personal memory space</span>
          </footer>
        </div>
      </section>
    </main>
  );
}
