import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TipTap from './TipTap';
import Sidebar from './sidebar';
import './parent.css';

const ParentComponent = () => {
  const { uid, vaultId } = useParams();
  const navigate = useNavigate();

  const [selectedNote, setSelectedNote] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedNoteContent, setSelectedNoteContent] = useState({
    type: 'doc',
    content: [{ type: 'paragraph' }],
  });

  // Called whenever TipTap editor changes content
  const handleEditorChange = (newContent, newTitle) => {
    setSelectedNote((prev) => {
      if (!prev) return prev;
      return { 
        ...prev, 
        content: newContent,
        title: newTitle !== undefined ? newTitle : prev.title 
      };
    });
    setSelectedNoteContent(newContent);
  };

  return (
    <div className={`parent-layout ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <Sidebar
        uid={uid}
        selectedVaultId={parseInt(vaultId, 10)}
        selectedNote={selectedNote}
        setSelectedNote={setSelectedNote}
        setSelectedNoteContent={setSelectedNoteContent}
        editorContent={selectedNoteContent}
        isOpen={sidebarOpen}
      />
      <div className="editor-container">
        <button 
          className="sidebar-toggle-btn" 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          title={sidebarOpen ? "Close Sidebar" : "Open Sidebar"}
        >
          {sidebarOpen ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          )}
        </button>

        {selectedNote ? (
          <TipTap
            selectedNote={selectedNote}
            selectedNoteContent={selectedNoteContent}
            setEditorContent={handleEditorChange}
          />
        ) : (
          <div className="no-note-selected" style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)', color: 'var(--text-tertiary)', textAlign: 'center', padding: '2rem' }}>
            <div className="no-note-content" style={{ maxWidth: '400px' }}>
              <div style={{ width: '80px', height: '80px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem', boxShadow: 'var(--shadow-glow)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>
              <h2 style={{ color: 'var(--text-primary)', fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', letterSpacing: '-0.02em' }}>Your Workspace Awaits</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6' }}>Select a note from the sidebar or click "New Note" to begin your journey with COGNIA.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentComponent;
