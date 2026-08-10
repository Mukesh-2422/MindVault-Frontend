import React from "react";
import { useNavigate } from "react-router-dom";
import { Brain, ArrowRight } from "lucide-react";
import "../styles/intro.css";

export default function IntroPage() {
  const navigate = useNavigate();

  return (
    <main className="login-page">
      <section className="login-showcase" aria-label="About MindVault">
        <button className="login-brand" type="button" onClick={() => navigate("/login")}>
          <Brain size={27} strokeWidth={1.7} />
          <span>MINDVAULT</span>
        </button>

        <div className="showcase-copy">
          <h1>Welcome to<br />MindVault</h1>
          <p>
            A private space designed for your thoughts, memories, and ideas.
            Begin your journey to a sharper, more organized mind.
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
        <div className="login-form-wrap intro-form-wrap">
          <div className="login-heading">
            <h2>Your Second Brain</h2>
            <p>A friend that never forgets</p>
          </div>

          <div className="intro-quote-block">
            <p className="intro-quote-text">"Talk. Remember. Recall."</p>
            <div className="intro-keywords">
              <span className="intro-keyword">Organize</span>
              <span className="intro-sep" />
              <span className="intro-keyword">Revisit</span>
              <span className="intro-sep" />
              <span className="intro-keyword">Share</span>
            </div>
          </div>

          <button className="login-submit intro-submit" onClick={() => navigate("/login")}>
            Get Started
            <ArrowRight size={18} strokeWidth={2} />
          </button>

          <footer className="login-footer">
            <p>Ready to sign in? <button onClick={() => navigate("/login")}>Log In</button></p>
            <span>MindVault — Your personal memory space</span>
          </footer>
        </div>
      </section>
    </main>
  );
}