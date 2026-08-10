import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { Brain, Eye, EyeOff } from "lucide-react";
import "../styles/intro.css";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { handleRegister } = useApp();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmRef = useRef(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || !form.confirm) {
      setError("Please fill in all fields.");
      return;
    }
    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    try {
      await handleRegister(form.name, form.email, form.password);
      navigate("/login", { state: { registered: true } });
    } catch (err) {
      setError(err.message || "Registration failed");
    }
  };

  return (
    <main className="login-page">
      <section className="login-showcase" aria-label="About MindVault">
        <button className="login-brand" type="button" onClick={() => navigate("/login")}>
          <Brain size={27} strokeWidth={1.7} />
          <span>MINDVAULT</span>
        </button>

        <div className="showcase-copy">
          <h1>Create Your<br />Digital Mind</h1>
          <p>
            Start building your second brain today. Store thoughts, track
            ideas, and organize your life's memories in a secure, personal
            space that grows with you.
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
            <h2>Create Your Vault</h2>
            <p>Your second brain starts here</p>
          </div>

          <form className="login-form" onSubmit={onSubmit}>
            <div className="login-input-group">
              <label htmlFor="reg-name">Name</label>
              <input
                id="reg-name"
                ref={nameRef}
                type="text"
                placeholder="Your name"
                autoComplete="name"
                value={form.name}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    emailRef.current?.focus();
                  }
                }}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="login-input-group">
              <label htmlFor="reg-email">Email Address</label>
              <input
                id="reg-email"
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
              <label htmlFor="reg-password">Password</label>
              <div className="password-field">
                <input
                  id="reg-password"
                  ref={passwordRef}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  value={form.password}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      confirmRef.current?.focus();
                    }
                  }}
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

            <div className="login-input-group">
              <label htmlFor="reg-confirm">Confirm Password</label>
              <div className="password-field">
                <input
                  id="reg-confirm"
                  ref={confirmRef}
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  value={form.confirm}
                  onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirmPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </div>

            {error && <p className="login-message error">{error}</p>}

            <button type="submit" className="login-submit">Create Account</button>
          </form>

          <footer className="login-footer">
            <p>Already have an account? <button onClick={() => navigate("/login")}>Sign In</button></p>
            <span>MindVault — Your personal memory space</span>
          </footer>
        </div>
      </section>
    </main>
  );
}