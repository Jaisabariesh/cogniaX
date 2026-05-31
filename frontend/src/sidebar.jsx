import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { supabase } from './supabase';
import FolderTree from './FolderTree';

import './sidebar.css';

const Sidebar = ({ uid, selectedVaultId, vaultName, setSelectedNoteContent, setSelectedNote, selectedNote, isOpen, onToggle, activeMode }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [focusWarning, setFocusWarning] = useState(false);

  const showFocusWarning = () => {
    setFocusWarning(true);
    setTimeout(() => setFocusWarning(false), 2500);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  }, []);

  const handleSelectNote = async (note) => {
    if (activeMode !== 'none') {
      showFocusWarning();
      return;
    }
    setSelectedNote(note);
    try {
      const res = await axios.get(`http://localhost:3000/notes/${note.id}`);
      setSelectedNoteContent(res.data.content);
    } catch (err) {
      console.error('Failed to fetch latest content, using cached version:', err);
      setSelectedNoteContent(note.content);
    }
  };


  if (!uid) return <div className={`sidebar ${!isOpen ? 'closed' : ''}`}>🔄 Loading...</div>;

  return (
    <div className={`sidebar ${!isOpen ? 'closed' : ''}`}>
      <div className="sidebar-brand-row">
        <div className="brand-logo-container">
          <img src="https://lh3.googleusercontent.com/aida/ADBb0uhEBaYWQoDGmomCK0dFmYeMQbaHG7MsqLibPP5ps16yfNmxZv-3EzqCREvCluP9J4B5se4dO3k_-w2y6Pu7AiyxJAr9BONsWu2jl2IknLq9UXtGV4urPeM7ttySzddFZl7aVjPe1Xmf1dUU_RvGFM6QFV7QfA2c34EBCRHsyR6YFvvDuMB3zYKbYo2CeFakUER4woKQzlsxIgOUTxWJ8PXMfJ6uhf0RBIXQq9MJn1bifARLTm1Q2RD-jg" alt="COGNIA" className="brand-logo" />
          <span className="brand-name">COGNIA</span>
        </div>
      </div>

      <div className="sidebar-back-row" onClick={() => {
        if (activeMode !== 'none') { showFocusWarning(); return; }
        navigate(`/${uid}`);
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
        <span>BACK TO VAULTS</span>
      </div>

      {focusWarning && (
        <div className="focus-lock-warning">
          🔒 Exit focus mode first
        </div>
      )}

      <div className="sidebar-active-vault">
        <div className="vault-indicator"></div>
        <div className="vault-context">
          <div className="vault-label">ACTIVE VAULT</div>
          <div className="vault-name">{vaultName?.toUpperCase() || 'WORKSPACE'}</div>
        </div>
        <button className="sidebar-collapse-btn" onClick={onToggle}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>
      </div>

      <div className="sidebar-search-container">
        <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input
          type="text"
          placeholder="Quick search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input-pill"
        />
      </div>

      <FolderTree
        vaultId={selectedVaultId}
        uid={uid}
        onSelectNote={handleSelectNote}
        selectedNoteId={selectedNote?.id}
        searchQuery={searchQuery}
      />

    </div>
  );
};

export default Sidebar;
