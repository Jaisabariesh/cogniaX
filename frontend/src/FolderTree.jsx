import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import axios from 'axios';

const FolderRow = React.memo(({ folder, depth, isExpanded, onToggle, onAddNote, onAddFolder, onDragStart, onDragOver, onDrop, onDragEnd }) => {
  return (
    <div
      className="folder-item"
      onDragOver={(e) => onDragOver(e, { ...folder, type: 'folder' })}
      onDrop={(e) => onDrop(e, { ...folder, type: 'folder' })}
    >
      <div
        className="folder-row"
        draggable
        style={{ marginLeft: `${depth * 16}px` }}
        onDragStart={(e) => onDragStart(e, { ...folder, type: 'folder' })}
        onDragEnd={onDragEnd}
        onClick={() => onToggle(folder.id)}
      >
        <span className="folder-icon">{isExpanded ? '📂' : '📁'}</span>
        <span className="folder-name">{folder.name}</span>
        <div className="folder-actions">
          <button onClick={(e) => { e.stopPropagation(); onAddNote(folder.id) }} title="Add Note">+</button>
          <button onClick={(e) => { e.stopPropagation(); onAddFolder(folder.id) }} title="Add Subfolder">📁+</button>
        </div>
      </div>
    </div>
  );
});

const NoteRow = React.memo(({ note, depth, isActive, onSelect, onDelete, onDragStart, onDragOver, onDrop, onDragEnd }) => {
  return (
    <div
      onDragOver={(e) => onDragOver(e, { ...note, type: 'note' })}
      onDrop={(e) => onDrop(e, { ...note, type: 'note' })}
    >
      <div
        draggable
        style={{ marginLeft: `${depth * 16}px` }}
        onDragStart={(e) => onDragStart(e, { ...note, type: 'note' })}
        onDragEnd={onDragEnd}
        className={`note-row ${isActive ? 'active' : ''}`}
        onClick={(e) => { e.stopPropagation(); onSelect(note); }}
      >
        <span className="note-icon">📄</span>
        <span className="note-title">{note.title}</span>
        <button
          className="delete-note-btn"
          onClick={(e) => onDelete(note.id, e)}
        >✕</button>
      </div>
    </div>
  );
});

const FolderTree = ({ vaultId, uid, onSelectNote, selectedNoteId, searchQuery = '' }) => {
  const [folders, setFolders] = useState([]);
  const [allNotes, setAllNotes] = useState([]);
  const [expandedFolders, setExpandedFolders] = useState({});

  const dragItemRef = useRef(null);
  const dragOverItemRef = useRef(null);
  const indicatorRef = useRef(null);
  const flatNodesRef = useRef([]);

  const fetchData = useCallback(async () => {
    if (!vaultId) return;
    try {
      const [fRes, nRes] = await Promise.all([
        axios.get(`http://localhost:3000/folders/${vaultId}`),
        axios.get(`http://localhost:3000/notes?uid=${uid}`)
      ]);
      setFolders(fRes.data);
      setAllNotes(nRes.data.filter(n => n.vault_id === vaultId));
    } catch (err) {
      console.error('Failed to fetch tree data:', err);
    }
  }, [vaultId, uid]);


  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleFolder = useCallback((id) => {
    setExpandedFolders(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const handleCreateFolder = useCallback(async (parentId = null) => {
    const name = window.prompt('Enter folder name:');
    if (!name) return;
    try {
      await axios.post(`http://localhost:3000/folders`, {
        vault_id: vaultId,
        parent_id: parentId,
        name,
        sort_order: Math.floor(Date.now() / 1000)
      });
      fetchData();
      if (parentId) setExpandedFolders(prev => ({ ...prev, [parentId]: true }));
    } catch (err) {
      console.error('Failed to create folder:', err);
    }
  }, [vaultId, fetchData]);

  const handleCreateNote = useCallback(async (folderId = null) => {
    const title = window.prompt('Enter note title:');
    if (!title) return;
    try {
      const res = await axios.post(`http://localhost:3000/notes`, {
        uid,
        vault_id: vaultId,
        folder_id: folderId,
        title,
        sort_order: Math.floor(Date.now() / 1000),
        content: { type: 'doc', content: [{ type: 'paragraph' }] }
      });
      fetchData();
      onSelectNote(res.data);
      if (folderId) setExpandedFolders(prev => ({ ...prev, [folderId]: true }));
    } catch (err) {
      console.error('Failed to create note:', err);
    }
  }, [uid, vaultId, onSelectNote, fetchData]);

  const handleDeleteNote = useCallback(async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this note?')) return;
    try {
      await axios.delete(`http://localhost:3000/notes/${id}`);
      fetchData();
    } catch (err) {
      console.error('Failed to delete note:', err);
    }
  }, [fetchData]);

  const clearIndicators = () => {
    if (indicatorRef.current) {
      indicatorRef.current.classList.remove('drop-target-top', 'drop-target-bottom', 'drop-target-inside');
      indicatorRef.current = null;
    }
  };

  const onDragStart = useCallback((e, item) => {
    e.stopPropagation();
    dragItemRef.current = item;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify({
      id: item.id,
      type: item.type,
      parentId: item.type === 'folder' ? item.parent_id : item.folder_id,
      sort_order: item.sort_order
    }));
  }, []);

  const onDragEnd = useCallback(() => {
    clearIndicators();
    dragItemRef.current = null;
    dragOverItemRef.current = null;
  }, []);

  const onDragOver = useCallback((e, targetItem) => {
    e.preventDefault();
    e.stopPropagation();

    if (!dragItemRef.current) return;
    if (dragItemRef.current.id === targetItem.id && dragItemRef.current.type === targetItem.type) return;

    // Prevent dropping folder into its own children implicitly
    if (dragItemRef.current.type === 'folder' && targetItem.parent_id === dragItemRef.current.id) return;

    const el = e.currentTarget;
    const y = e.clientY;

    requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect();
      const localY = y - rect.top;

      let dropZone = 'bottom';
      if (targetItem.type === 'folder') {
        if (localY < rect.height * 0.25) dropZone = 'top';
        else if (localY < rect.height * 0.75) dropZone = 'inside';
        else dropZone = 'bottom';
      } else {
        dropZone = localY < rect.height / 2 ? 'top' : 'bottom';
      }

      dragOverItemRef.current = { item: targetItem, dropZone };

      if (indicatorRef.current && indicatorRef.current !== el) {
        clearIndicators();
      }

      el.classList.remove('drop-target-top', 'drop-target-bottom', 'drop-target-inside');
      el.classList.add(`drop-target-${dropZone}`);
      indicatorRef.current = el;
    });
  }, []);

  const onDrop = useCallback(async (e, targetObjParam) => {
    e.preventDefault();
    e.stopPropagation();

    clearIndicators();

    const dragged = dragItemRef.current;
    const targetObj = dragOverItemRef.current;
    dragItemRef.current = null;
    dragOverItemRef.current = null;

    if (!dragged || !targetObj) return;
    if (dragged.id === targetObj.item.id && dragged.type === targetObj.item.type) return;

    let { dropZone, item: target } = targetObj;
    const flatNodesCurrent = flatNodesRef.current;

    try {
      if (dropZone === 'inside') {
        if (dragged.type === 'folder') {
          await axios.patch(`http://localhost:3000/folders/${dragged.id}/move`, { parent_id: target.id });
        } else {
          await axios.patch(`http://localhost:3000/notes/${dragged.id}/move`, { folder_id: target.id });
        }
      } else {
        const newContainerId = target.type === 'folder' ? target.parent_id : target.folder_id;

        let siblings = flatNodesCurrent.filter(n =>
          (n.type === 'folder' ? n.parent_id : n.folder_id) === newContainerId
        )
          .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

        siblings = siblings.filter(n => !(n.id === dragged.id && n.type === dragged.type));

        let tIndex = siblings.findIndex(n => n.id === target.id && n.type === target.type);
        if (tIndex === -1) tIndex = siblings.length;

        const insertIndex = dropZone === 'top' ? tIndex : tIndex + 1;

        siblings.splice(insertIndex, 0, dragged);

        const reorderPayload = siblings.map((sib, i) => {
          const newSortOrder = (i + 1) * 1000;
          return { id: sib.id, type: sib.type, sort_order: newSortOrder };
        });

        const oldContainerId = dragged.type === 'folder' ? dragged.parent_id : dragged.folder_id;
        if (oldContainerId !== newContainerId) {
          if (dragged.type === 'folder') {
            await axios.patch(`http://localhost:3000/folders/${dragged.id}/move`, { parent_id: newContainerId || null });
          } else {
            await axios.patch(`http://localhost:3000/notes/${dragged.id}/move`, { folder_id: newContainerId || null });
          }
        }

        await axios.post('http://localhost:3000/reorder', { items: reorderPayload });
      }

      fetchData();
    } catch (err) {
      console.error("Drop failed:", err);
    }
  }, [fetchData]);

  const flatNodes = useMemo(() => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const filteredFolders = folders.filter(f => f.name.toLowerCase().includes(q)).map(f => ({ ...f, type: 'folder', depth: 0 }));
      const filteredNotes = allNotes.filter(n => n.title && n.title.toLowerCase().includes(q)).map(n => ({ ...n, type: 'note', depth: 0 }));
      return [...filteredFolders, ...filteredNotes];
    }

    const flat = [];
    const rootFolders = folders.filter(f => !f.parent_id).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)).map(f => ({ ...f, type: 'folder' }));
    const topNotes = allNotes.filter(n => !n.folder_id).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)).map(n => ({ ...n, type: 'note' }));

    const traverse = (children, depth) => {
      children.forEach(item => {
        flat.push({ ...item, depth });
        if (item.type === 'folder' && expandedFolders[item.id]) {
          const sf = folders.filter(f => f.parent_id === item.id).map(f => ({ ...f, type: 'folder' }))
          const sn = allNotes.filter(n => n.folder_id === item.id).map(n => ({ ...n, type: 'note' }))
          traverse([...sf, ...sn].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)), depth + 1);
        }
      });
    }

    const startItems = [...rootFolders, ...topNotes].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    traverse(startItems, 0);
    return flat;
  }, [folders, allNotes, expandedFolders, searchQuery]);

  // Keep ref up to date avoiding dependency
  useEffect(() => {
    flatNodesRef.current = flatNodes;
  }, [flatNodes]);

  return (
    <div className="folder-tree-container">
      <div className="tree-header" style={{ justifyContent: searchQuery ? 'flex-start' : 'space-between' }}>
        <span>{searchQuery ? 'SEARCH RESULTS' : 'FAVORITES & EXPLORER'}</span>
        {!searchQuery && <button onClick={() => handleCreateFolder()} className="add-root-folder-btn">+</button>}
      </div>

      <div
        className="tree-scroll-area"
        onDragOver={(e) => {
          e.preventDefault();
        }}
        onDrop={async (e) => {
          e.preventDefault();
          clearIndicators();
          const dragged = dragItemRef.current;
          if (!dragged) return;
          try {
            if (dragged.type === 'folder') {
              await axios.patch(`http://localhost:3000/folders/${dragged.id}/move`, { parent_id: null });
            } else {
              await axios.patch(`http://localhost:3000/notes/${dragged.id}/move`, { folder_id: null });
            }
            fetchData();
          } catch (err) { }
        }}
      >
        {flatNodes.map(node => (
          node.type === 'folder'
            ? <FolderRow
              key={`folder-${node.id}`}
              folder={node}
              depth={node.depth}
              isExpanded={expandedFolders[node.id]}
              onToggle={toggleFolder}
              onAddNote={handleCreateNote}
              onAddFolder={handleCreateFolder}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDrop={onDrop}
              onDragEnd={onDragEnd}
            />
            : <NoteRow
              key={`note-${node.id}`}
              note={node}
              depth={node.depth}
              isActive={selectedNoteId === node.id}
              onSelect={onSelectNote}
              onDelete={handleDeleteNote}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDrop={onDrop}
              onDragEnd={onDragEnd}
            />
        ))}

        {flatNodes.length === 0 && searchQuery && (
          <div style={{ padding: '16px 10px', color: 'var(--text-dim)', fontSize: '0.85rem', textAlign: 'center' }}>No results found</div>
        )}

        {!searchQuery && (
          <button
            onClick={() => handleCreateNote()}
            className="new-note-btn"
          >
            + New Note at Root
          </button>
        )}
      </div>
    </div>
  );
};

export default FolderTree;
