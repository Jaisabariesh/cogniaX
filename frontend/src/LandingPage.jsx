import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  return (
    <div className="landing-container">
      <nav className="landing-nav">
        <Link to="/" className="nav-logo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
          </svg>
          NoteBlurt
        </Link>
        <div className="nav-links">
          <a href="#features" className="nav-link">Features</a>
          <Link to="/login" className="nav-link">Sign In</Link>
          <Link to="/login" className="nav-btn">Get Started</Link>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-badge">AI-Powered Note Taking</div>
        <h1 className="hero-title">Capture ideas at the speed of thought.</h1>
        <p className="hero-subtitle">
          NoteBlurt combines the simplicity of a workspace with the power of artificial intelligence. Document, organize, and execute your best work.
        </p>
        <div className="hero-btns">
          <Link to="/login" className="btn-large btn-primary">Start Writing for Free</Link>
          <a href="#features" className="btn-large btn-secondary">Explore Features</a>
        </div>
      </section>

      <section id="features" className="features">
        <div className="section-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            </div>
            <h3>Intelligent Persistence</h3>
            <p>Your notes are saved instantly and synced across all your devices with robust database integration.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>
            </div>
            <h3>Structured Vaults</h3>
            <p>Organize your knowledge in deep nested folders and specialized vaults designed for mental clarity.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
            </div>
            <h3>Elite Performance</h3>
            <p>A high-speed TipTap-based editor that supports rich media, math, and interactive components.</p>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <p>&copy; {new Date().getFullYear()} NoteBlurt. Built for high-performance learners.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
