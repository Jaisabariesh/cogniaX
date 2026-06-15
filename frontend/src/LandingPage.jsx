import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  useEffect(() => {
    // Force scrollability on the landing page
    // since other CSS files may apply overflow: hidden globally
    document.documentElement.classList.add('landing-page-active');
    document.body.classList.add('landing-page-active');

    return () => {
      document.documentElement.classList.remove('landing-page-active');
      document.body.classList.remove('landing-page-active');
    };
  }, []);

  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-active');
        }
      });
    }, observerOptions);

    const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-zoom');
    revealElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="landing-container">
      <nav className="landing-nav">
        <Link to="/" className="nav-logo">
          <div className="logo-icon">L</div>
          Luna
        </Link>
        <div className="nav-links">
          <a href="#tools" className="nav-link">Tools</a>
          <a href="#learning" className="nav-link">Learning</a>
          <Link to="/login" className="nav-link">Sign In</Link>
          <Link to="/login" className="nav-btn">Get Started</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero reveal-zoom">
        <div className="hero-content">
          <div className="hero-badge">Next-Gen Learning Workspace</div>
          <h1 className="hero-title">Luna — Interactive Learning Workspace</h1>
          <p className="hero-subtitle">
            Luna turns notes into interactive experiences. Visualize concepts through diagrams, graphs, animations, and simulations—all in one unified workspace.
          </p>
          <div className="hero-btns">
            <Link to="/login" className="btn-large btn-primary">Try Luna Now</Link>
            <a href="#tools" className="btn-large btn-secondary">Explore Toolkit</a>
          </div>
        </div>
        <div className="hero-visual">
          <div className="visual-orb"></div>
        </div>
        <div className="scroll-indicator">
          <span>SCROLL</span>
          <div className="mouse">
            <div className="wheel"></div>
          </div>
        </div>
      </section>

      {/* Core Tools Section */}
      <section id="tools" className="section tools-section reveal-left">
        <div className="section-header">
          <span className="badge">Precision Tools</span>
          <h2>A Unified Toolkit for STEM</h2>
          <p>Switch between code, math, chemistry, and art in one seamless flow.</p>
        </div>
        <div className="section-grid">
          {[
            { id: 1, title: 'Rich Text Editor', icon: <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>, desc: 'Advanced TiTap-based environment with structured headings, code blocks, and media support.' },
            { id: 2, title: 'Math Equation Editor', icon: <line x1="7" y1="12" x2="17" y2="12"></line>, desc: 'Write complex derivations and formulas with LaTeX-style precision that renders live.' },
            { id: 3, title: 'Molecular Visualizer', icon: <circle cx="12" cy="12" r="10"></circle>, desc: 'Built-in JSME editor to draw and analyze chemical structures and reaction mechanisms.' },
            { id: 4, title: 'Graph Plotter', icon: <path d="M3 3v18h18"></path>, desc: 'Interactive coordinate systems to plot functions and visualize mathematical relations.' },
            { id: 5, title: 'Drawing Canvas', icon: <circle cx="12" cy="19" r="3"></circle>, desc: 'Konva-powered sketching tool for diagrams, quick annotations, and freehand thinking.' },
            { id: 6, title: 'Mind Maps', icon: <line x1="12" y1="2" x2="12" y2="8"></line>, desc: 'Hierarchical flowcharts to connect concepts and visualize knowledge structures.' },
          ].map((item) => (
            <div key={item.id} className="tool-card reveal-item">
              <div className="tool-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {item.icon}
                  {item.id === 1 && <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>}
                  {item.id === 2 && <><line x1="7" y1="7" x2="17" y2="7"></line><line x1="7" y1="17" x2="17" y2="17"></line></>}
                  {item.id === 3 && <><path d="M8 12h8"></path><path d="M12 8v8"></path></>}
                  {item.id === 4 && <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"></path>}
                  {item.id === 5 && <path d="M5 19l2-14h10l2 14"></path>}
                  {item.id === 6 && <><line x1="12" y1="16" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="9.17" y2="9.17"></line><line x1="14.83" y1="14.83" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="8" y2="12"></line><line x1="16" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="9.17" y2="14.83"></line><line x1="14.83" y1="9.17" x2="19.07" y2="4.93"></line></>}
                </svg>
              </div>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Learning Features Section */}
      <section id="learning" className="section learning-section reveal-right">
        <div className="section-header">
          <span className="badge">Cognitive Science</span>
          <h2>Active Recall Mastery</h2>
          <p>Built-in features designed to help you remember what you learn.</p>
        </div>
        <div className="learning-grid">
          {[
            { id: 1, title: 'Blurting Mode', icon: <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"></path>, desc: 'Instantly hide your notes and attempt to reconstruct them. Luna highlights what you missed.' },
            { id: 2, title: 'Active Recall Layer', icon: <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>, desc: 'Spaced repetition and prompt-based testing integrated directly into your workspace.' },
            { id: 3, title: 'Contextual Connections', icon: <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>, desc: 'Link diagrams, text, and simulations together. Changes in one reflect in the others.' },
          ].map((item) => (
            <div key={item.id} className="learning-item reveal-item">
              <div className="learning-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {item.icon}
                  {item.id === 1 && <path d="M12 6v6l4 2"></path>}
                  {item.id === 2 && <><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></>}
                  {item.id === 3 && <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>}
                </svg>
              </div>
              <div className="learning-content">
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Target Audience Section */}
      <section className="audience-section reveal-zoom">
        <div className="built-grid">
          <div className="built-text">
            <h2>Built For High-Performance Learners</h2>
            <div className="users-list">
              {['Physics', 'Chemistry', 'Mathematics', 'Engineering', 'Research', 'Bio-Science'].map((u) => (
                <span key={u} className="reveal-item">{u}</span>
              ))}
            </div>
          </div>
          <div className="vision-box reveal-item">
            <div className="vision-label">OUR VISION</div>
            <p>"Luna turns notes into interactive learning experiences. We believe understanding comes from interaction, not just observation."</p>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="logo-icon small">L</div>
            Luna
          </div>
          <p>&copy; {new Date().getFullYear()} Luna Interactive. Redefining STEM workflows.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
