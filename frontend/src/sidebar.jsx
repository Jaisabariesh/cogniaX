import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import { API_URL } from './config';
import FolderTree from './FolderTree';

import './sidebar.css';

const Sidebar = ({ uid, selectedVaultId, vaultName, setSelectedNoteContent, setSelectedNote, selectedNote, isOpen, onToggle, activeMode, saveNowRef }) => {
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
    // Don't re-fetch if the same note is already selected
    if (note.id === selectedNote?.id) return;

    // Flush any pending autosave for the current note BEFORE switching.
    // This guarantees the old note's latest content is persisted in the DB
    // so the fresh fetch for the new note reflects the correct state.
    if (saveNowRef?.current) {
      try { await saveNowRef.current(); } catch (_) { /* best-effort */ }
    }

    try {
      // Fetch fresh content from DB with auth — the cache-bust ?t= param prevents
      // browser caching, and the Authorization header satisfies the backend middleware.
      const token = Cookies.get('sb-access-token');
      const res = await axios.get(`${API_URL}/notes/${note.id}?t=${Date.now()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedNoteContent(res.data.content);
      setSelectedNote(res.data); // use server data so title/content are always in sync
    } catch (err) {
      console.error('Failed to fetch latest content, using cached version:', err);
      setSelectedNoteContent(note.content);
      setSelectedNote(note);
    }
  };


  if (!uid) return <div className={`sidebar ${!isOpen ? 'closed' : ''}`}>🔄 Loading...</div>;

  return (
    <div className={`sidebar ${!isOpen ? 'closed' : ''}`}>
      <div className="sidebar-vault-header">
        <div className="vault-name-rectangle">
          {vaultName?.toUpperCase() || 'WORKSPACE'}
        </div>
        <button className="sidebar-collapse-btn" onClick={onToggle}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>
      </div>

        

      {focusWarning && (
        <div className="focus-lock-warning">
          🔒 Exit focus mode first
        </div>
      )}

        

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
        selectedNote={selectedNote}
        searchQuery={searchQuery}
      />
      <div className="sidebar-footer">
        <div className="sidebar-back-row" onClick={() => {
          if (activeMode !== 'none') { showFocusWarning(); return; }
          navigate(`/${uid}`);
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          <span>BACK TO VAULTS</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
