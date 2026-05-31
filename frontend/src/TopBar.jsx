import React, { useState, useRef, useEffect } from 'react';
import CreditManager from './CreditManager';
import './TopBar.css';

const TopBar = ({ uid, activeMode, setActiveMode, sidebarOpen, onToggleSidebar }) => {
  const [modeMenuOpen, setModeMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setModeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getModeLabel = () => {
    // Force the button to always show 'Active Recall' as requested, 
    // or show the current mode if you prefer. 
    // To match "if i click active recall", it implies the button label is always Active Recall.
    return 'Active Recall';
  };

  return (
    <div className="top-bar">
      <div className="top-bar-left">
        {!sidebarOpen && (
          <button className="sidebar-toggle-trigger" onClick={onToggleSidebar} title="Open Sidebar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <line x1="9" y1="3" x2="9" y2="21"/>
            </svg>
          </button>
        )}
        
        <div className="mode-switcher-dropdown" ref={menuRef}>
          <button 
            className="mode-dropdown-btn" 
            onClick={() => setModeMenuOpen(!modeMenuOpen)}
          >
            <span className="material-symbols-outlined mode-icon">layers</span>
            <span className="mode-text">{getModeLabel()}</span>
            <span className="material-symbols-outlined mode-arrow">expand_more</span>
          </button>
          
          {modeMenuOpen && (
            <div className="mode-dropdown-menu">
              <button 
                className={`mode-dropdown-item ${activeMode === 'feynman' ? 'active' : ''}`} 
                onClick={() => { setActiveMode('feynman'); setModeMenuOpen(false); }}
              >
                🧠 Feynman Method
              </button>
              <button 
                className={`mode-dropdown-item ${activeMode === 'blurt' ? 'active' : ''}`} 
                onClick={() => { setActiveMode('blurt'); setModeMenuOpen(false); }}
              >
                🗣️ Blurt Session
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="top-bar-right">
        <CreditManager uid={uid} />
      </div>
    </div>

  );
};

export default TopBar;
