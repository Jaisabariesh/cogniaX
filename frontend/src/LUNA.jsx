import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
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

  useEffect(() => {
    const fetchVaultInfo = async () => {
      try {
        const token = Cookies.get('sb-access-token');
        const res = await axios.get(`http://localhost:3000/vaults`, {
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
        vaultName={vaultName}
        selectedNote={selectedNote}
        setSelectedNote={setSelectedNote}
        setSelectedNoteContent={setSelectedNoteContent}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        activeMode={activeMode}
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
              selectedNote={selectedNote}
              selectedNoteContent={selectedNoteContent}
              setEditorContent={handleEditorChange}
              activeMode={activeMode}
              setActiveMode={setActiveMode}
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