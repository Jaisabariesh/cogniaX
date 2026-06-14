import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
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
