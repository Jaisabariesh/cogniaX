import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import { API_URL } from './config';
import TipTap from './TipTap';
import Sidebar from './sidebar';
import TopBar from './TopBar';
import './parent.css';

const ParentComponent = () => {
  const { uid, vaultId } = useParams();


  const [selectedNote, setSelectedNote] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [vaultName, setVaultName] = useState('Workspace');
  const [activeMode, setActiveMode] = useState('none');
  const [selectedNoteContent, setSelectedNoteContent] = useState({
    type: 'doc',
    content: [{ type: 'paragraph' }],
  });

  // TipTap registers an imperative save function here so we can flush
  // any pending autosave before switching notes.
  const saveNowRef = useRef(null);

  useEffect(() => {
    const fetchVaultInfo = async () => {
      try {
        const token = Cookies.get('sb-access-token');
        const res = await axios.get(`${API_URL}/vaults`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const currentVault = res.data.find(v => v.id === parseInt(vaultId, 10));
        if (currentVault) {
          setVaultName(currentVault.name);
        }
      } catch (err) {
        console.error('Failed to fetch vault info:', err);
      }
    };
    if (uid && vaultId) fetchVaultInfo();
  }, [uid, vaultId]);

  // Called whenever TipTap editor changes content.
  // NOTE: We intentionally do NOT call setSelectedNoteContent here.
  // selectedNoteContent is only used to initialize the editor when a note
  // is first selected. Feeding it back on every keystroke creates a
  // feedback loop that resets the editor mid-typing.
  const handleEditorChange = (newContent, newTitle) => {
    setSelectedNote((prev) => {
      if (!prev) return prev;
      return { 
        ...prev, 
        content: newContent,
        title: newTitle !== undefined ? newTitle : prev.title 
      };
    });
  };

  return (
    <div className={`parent-layout ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <Sidebar
        uid={uid}
        selectedVaultId={parseInt(vaultId, 10)}
        vaultName={vaultName}
        selectedNote={selectedNote}
        setSelectedNote={setSelectedNote}
        setSelectedNoteContent={setSelectedNoteContent}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        activeMode={activeMode}
        saveNowRef={saveNowRef}
      />
      <div className="editor-container">
        <TopBar 
          uid={uid} 
          vaultName={vaultName} 
          noteTitle={selectedNote?.title} 
          sidebarOpen={sidebarOpen}
          activeMode={activeMode}
          setActiveMode={setActiveMode}
          onToggleSidebar={() => setSidebarOpen(true)}
        />
        <div className="editor-content-area workspace-grid">
          {selectedNote ? (
            <TipTap
              key={selectedNote.id}
              selectedNote={selectedNote}
              selectedNoteContent={selectedNoteContent}
              setEditorContent={handleEditorChange}
              activeMode={activeMode}
              setActiveMode={setActiveMode}
              saveNowRef={saveNowRef}
            />
          ) : (
            <div className="empty-state-section">
              {/* Workspace intentionally left empty as requested */}
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
};

export default ParentComponent;