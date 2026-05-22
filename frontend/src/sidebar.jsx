import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { supabase } from './supabase';
import CreditManager from './CreditManager';
import FolderTree from './FolderTree';

import './sidebar.css';

const Sidebar = ({ uid, selectedVaultId, setSelectedNoteContent, editorContent, setSelectedNote, selectedNote, isOpen }) => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleSelectNote = async (note) => {
    // Optimistically set title, but wait for fresh content
    setSelectedNote(note);

    try {
      const res = await axios.get(`http://localhost:3000/notes/${note.id}`);
      setSelectedNoteContent(res.data.content);
    } catch (err) {
      console.error('Failed to fetch latest content, using cached version:', err);
      setSelectedNoteContent(note.content);
    }
  };

  const handleSaveNote = async () => {
    if (!selectedNote || !editorContent) return;
    try {
      await axios.patch(`http://localhost:3000/notes/${selectedNote.id}`, {
        content: editorContent
      });
      alert('Note saved!');
    } catch (err) {
      console.error('Failed to save:', err);
    }
  };

  if (!uid) return <div className={`sidebar ${!isOpen ? 'closed' : ''}`}>🔄 Loading...</div>;

  return (
    <div className={`sidebar ${!isOpen ? 'closed' : ''}`}>
      <div className="sidebar-header" onClick={() => navigate(`/${uid}`)} style={{ cursor: 'pointer', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, letterSpacing: '2px' }}>COGNIA</h2>
        <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>← Back to Vaults</span>
      </div>

      <CreditManager uid={uid} />

      <div className="sidebar-search">
        <input
          type="text"
          placeholder="Search files & folders..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      <FolderTree
        vaultId={selectedVaultId}
        uid={uid}
        onSelectNote={handleSelectNote}
        selectedNoteId={selectedNote?.id}
        searchQuery={searchQuery}
      />

      <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
        <button className="sidebar-btn" onClick={handleSaveNote}>Save Current Note</button>
        <button className="sidebar-btn" onClick={toggleTheme} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </button>
        <button className="sidebar-btn">Settings</button>
      </div>
    </div>
  );
};

export default Sidebar;
