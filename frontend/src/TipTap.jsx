import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { EditorContent, useEditor } from '@tiptap/react';

// Core Tiptap Extensions
import Document from '@tiptap/extension-document';
import Text from '@tiptap/extension-text';
import Paragraph from '@tiptap/extension-paragraph';
import Heading from '@tiptap/extension-heading';
import Blockquote from '@tiptap/extension-blockquote';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { ResizableImageExtension } from './image-resize/ResizableImageExtension.js';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import Dropcursor from '@tiptap/extension-dropcursor';
import Gapcursor from '@tiptap/extension-gapcursor';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import Strike from '@tiptap/extension-strike';
import Link from '@tiptap/extension-link';
import BubbleMenuExtension from '@tiptap/extension-bubble-menu';
import GlobalDragHandle from 'tiptap-extension-global-drag-handle';
import Placeholder from '@tiptap/extension-placeholder';

// Custom Extensions
import { SlashCommand } from './slash-command.js';
import { ChemistryExtension } from './chemistry/chemistry-extension.js';
import { P5jsExtension } from './p5js/p5js-extension.js';
import { KonvaExtension } from './konva/konva-extension.js';
import { FlowExtension } from './flow/flow-extension.js';
import { DesmosExtension } from './desmos/desmos-extension.js';
import { MathQuillExtension } from './mathquill/mathquill-extension.js';
import { BlockSafe } from './lib/block-safe.js';
import { tiptapToLLM } from './tiptaptollm.js';


// Syntax Highlighting
import { createLowlight, all } from 'lowlight';
import html from 'highlight.js/lib/languages/xml';

// Styles
import './note.scss';

const lowlight = createLowlight(all);
lowlight.register('html', html);



const TipTap = ({ selectedNote, selectedNoteContent, setEditorContent }) => {
  const [isEditable, setIsEditable] = useState(true);
  const [editorState, setEditorState] = useState('notEditing');
  const [activeMode, setActiveMode] = useState('none');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [deleteMenu, setDeleteMenu] = useState(null); // { top, left, pos }
  const prevContentRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  const lastSavedJsonRef = useRef(null);
  const [lastSavedTitleRef] = [useRef(null)];
  const [evaluationResults, setEvaluationResults] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  // Bug fix: keep selectedNote in a ref so debounced callbacks always read the latest value
  const selectedNoteRef = useRef(null);
  const requestIdRef = useRef(0);

  useEffect(() => { 
    if (selectedNote?.id !== selectedNoteRef.current?.id) {
      lastSavedJsonRef.current = selectedNote ? JSON.stringify(selectedNote.content) : null;
      lastSavedTitleRef.current = selectedNote?.title || null;
      requestIdRef.current++;
    }
    selectedNoteRef.current = selectedNote; 
  }, [selectedNote]);

  const setEditorContentRef = useRef(setEditorContent);
  useEffect(() => { setEditorContentRef.current = setEditorContent; }, [setEditorContent]);

  const editor = useEditor({
    extensions: [
      BlockSafe,
      Document,
      Text,
      Paragraph,
      Heading.configure({ levels: [1, 2, 3] }),
      Blockquote,
      BulletList,
      OrderedList,
      ListItem,
      TaskList,
      TaskItem,
      CodeBlockLowlight.configure({ lowlight }),
      ResizableImageExtension,
      HorizontalRule,
      Dropcursor.configure({ color: '#00d2ff', width: 2 }),
      Gapcursor,
      Bold,
      Italic,
      Strike,
      Link.configure({ openOnClick: false }),
      BubbleMenuExtension,
      SlashCommand,
      ChemistryExtension,
      P5jsExtension,
      KonvaExtension,
      FlowExtension,
      DesmosExtension,
      MathQuillExtension,
      GlobalDragHandle.configure({
        dragHandleWidth: 20,
        scrollTreshold: 100,
      }),
      Placeholder.configure({
        placeholder: "Type '/' for commands…",
      }),
    ],
    content: selectedNoteContent,
    editable: isEditable,
  });

  const focusEditor = useEditor({
    extensions: [
      BlockSafe,
      Document,
      Text,
      Paragraph,
      Heading.configure({ levels: [1, 2, 3] }),
      Blockquote,
      BulletList,
      OrderedList,
      ListItem,
      TaskList,
      TaskItem,
      CodeBlockLowlight.configure({ lowlight }),
      ResizableImageExtension,
      HorizontalRule,
      Dropcursor.configure({ color: '#00d2ff', width: 2 }),
      Gapcursor,
      Bold,
      Italic,
      Strike,
      Link.configure({ openOnClick: false }),
      BubbleMenuExtension,
      SlashCommand,
      ChemistryExtension,
      P5jsExtension,
      KonvaExtension,
      FlowExtension,
      DesmosExtension,
      MathQuillExtension,
      GlobalDragHandle.configure({
        dragHandleWidth: 20,
        scrollTreshold: 100,
      }),
      Placeholder.configure({
        placeholder: "Write your session notes here...",
      }),
    ],
    content: '',
  });

  const handleAutoSave = async (contentJson, titleText, savedRequestId) => {
    const note = selectedNoteRef.current;
    if (!note) return;

    const currentJsonStr = JSON.stringify(contentJson);
    if (lastSavedJsonRef.current === currentJsonStr && lastSavedTitleRef.current === titleText) {
      if (savedRequestId === requestIdRef.current) setEditorState('notEditing');
      return;
    }

    setEditorState('saving');
    try {
      await axios.patch(`http://localhost:3000/notes/${note.id}`, {
        title: titleText,
        content: contentJson
      });
      if (savedRequestId === requestIdRef.current) {
        lastSavedJsonRef.current = currentJsonStr;
        lastSavedTitleRef.current = titleText;
        setEditorState('notEditing');
      }
    } catch (err) {
      if (savedRequestId === requestIdRef.current) setEditorState('error');
    }
  };

  useEffect(() => {
    if (!editor || !selectedNoteContent) return;
    const currentContent = JSON.stringify(editor.getJSON());
    const incomingContent = JSON.stringify(selectedNoteContent);
    if (incomingContent !== currentContent && incomingContent !== prevContentRef.current) {
      editor.commands.setContent(selectedNoteContent);
      prevContentRef.current = incomingContent;
    }
  }, [selectedNoteContent, editor]);

  useEffect(() => {
    if (editor) editor.setEditable(activeMode === 'none' && isEditable);
  }, [isEditable, editor, activeMode]);

  useEffect(() => {
    if (editor?.storage['slash-command']) {
      editor.storage['slash-command'].activeMode = activeMode;
    }
  }, [activeMode, editor]);

  useEffect(() => {
    if (!editor) return;
    const triggerSave = (jsonOverride) => {
      setEditorState('editing');
      const newRequestId = ++requestIdRef.current;
      const json = jsonOverride || editor.getJSON();
      const title = selectedNoteRef.current?.title || '';
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => handleAutoSave(json, title, newRequestId), 500);
    };
    const updateHandler = () => {
      const json = editor.getJSON();
      setEditorContentRef.current(json);
      triggerSave(json);
    };
    editor.on('update', updateHandler);
    editor.on('focus', () => setEditorState('editing'));
    return () => {
      editor.off('update', updateHandler);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [editor]);

  useEffect(() => {
    if (activeMode !== 'none' && focusEditor) {
      focusEditor.commands.setContent('');
      setEvaluationResults(null);
    }
  }, [activeMode, focusEditor]);

  const handleEvaluate = async () => {
    if (!selectedNoteContent || !focusEditor) return;
    setIsEvaluating(true);
    setEvaluationResults(null);
    try {
      const llmSource = tiptapToLLM(selectedNoteContent);
      const llmRecall = tiptapToLLM(focusEditor.getJSON());
      const response = await axios.post('http://localhost:3000/evaluate-session', {
        originalText: JSON.stringify(llmSource, null, 2),
        recallText: JSON.stringify(llmRecall, null, 2),
        mode: activeMode
      });
      setEvaluationResults(response.data);
    } catch (err) {
      setEvaluationResults({
        summary: "Evaluation failed. Please check your connection.",
        accuracy_score: 0,
        strengths: [],
        weaknesses: [],
        recommendation: "Try again later."
      });
    } finally {
      setIsEvaluating(false);
    }
  };

  useEffect(() => {
    const handleDragHandleDoubleClick = (e) => {
      const handle = e.target.closest('.drag-handle');
      if (!handle || !editor?.view) return;
      e.preventDefault();
      const rect = handle.getBoundingClientRect();
      const docPos = editor.view.posAtCoords({ left: rect.left + rect.width + 8, top: rect.top + rect.height / 2 });
      if (!docPos) return;
      const resolvedPos = editor.view.state.doc.resolve(docPos.pos);
      let nodePos = docPos.pos;
      let depth = resolvedPos.depth;
      while (depth > 0) {
        if (resolvedPos.node(depth).isBlock) {
          nodePos = resolvedPos.before(depth);
          break;
        }
        depth--;
      }
      setDeleteMenu({ top: rect.top + window.scrollY, left: rect.right + 8, pos: nodePos });
    };
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.drag-delete-btn') && !e.target.closest('.drag-handle')) setDeleteMenu(null);
    };
    document.addEventListener('dblclick', handleDragHandleDoubleClick, true);
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('dblclick', handleDragHandleDoubleClick, true);
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [editor]);

  const handleDeleteAtPos = () => {
    if (!editor || deleteMenu === null) return;
    const { pos } = deleteMenu;
    const node = editor.view.state.doc.nodeAt(pos);
    if (node) editor.chain().focus().deleteRange({ from: pos, to: pos + node.nodeSize }).run();
    setDeleteMenu(null);
  };

  const status = (() => {
    switch(editorState) {
      case 'editing': return { text: 'Editing...', class: 'status-editing' };
      case 'saving': return { text: 'Saving...', class: 'status-saving' };
      case 'error': return { text: 'Save Error!', class: 'status-error' };
      default: return { text: 'Saved', class: 'status-saved' };
    }
  })();

  if (!editor) return null;

  return (
    <>
      {deleteMenu && (
        <button
          className="drag-delete-btn"
          style={{ top: deleteMenu.top, left: deleteMenu.left }}
          onClick={handleDeleteAtPos}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
          Delete
        </button>
      )}
      {activeMode !== 'none' && (
        <>
          <div className="focus-overlay"></div>
          <div className="focus-banner">
            <span>{activeMode === 'feynman' ? '🧠 Feynman Mode Active' : '🗣️ Blurt Mode Active'}</span>
            <div className="focus-banner-actions">
              <button 
                className={`evaluate-btn ${isEvaluating ? 'loading' : ''}`} 
                onClick={handleEvaluate}
                disabled={isEvaluating}
              >
                {isEvaluating ? 'Evaluating...' : 'Compare & Analyze'}
              </button>
              <button className="exit-btn" onClick={() => setActiveMode('none')}>Exit</button>
            </div>
          </div>

          {evaluationResults && (
            <div className="evaluation-results-panel">
              <div className="results-header">
                <div className="score-badges-row">
                  <div className="score-badge">
                    <span className="score-value">{evaluationResults.accuracy_score ?? 0}/10</span>
                    <span className="score-label">Accuracy</span>
                  </div>
                  {evaluationResults.learning_effectiveness_score !== undefined && (
                    <div className="score-badge secondary">
                      <span className="score-value">{evaluationResults.learning_effectiveness_score}/10</span>
                      <span className="score-label">Effectiveness</span>
                    </div>
                  )}
                </div>
                <button className="close-results" onClick={() => setEvaluationResults(null)}>×</button>
              </div>
              <div className="results-body">
                <div className="feedback-section">
                  <h4>💡 Comparison Summary</h4>
                  <p>{evaluationResults.summary || 'No summary available.'}</p>
                </div>
                {Array.isArray(evaluationResults.strengths) && evaluationResults.strengths.length > 0 && (
                  <div className="highlights-section">
                    <h4>✅ Key Strengths</h4>
                    <ul>{evaluationResults.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
                  </div>
                )}
                {Array.isArray(evaluationResults.weaknesses) && evaluationResults.weaknesses.length > 0 && (
                  <div className="highlights-section">
                    <h4>⚠️ Missing/Incorrect</h4>
                    <ul>{evaluationResults.weaknesses.map((w, i) => <li key={i}>{w}</li>)}</ul>
                  </div>
                )}
                <div className="suggestions-section">
                  <h4>🚀 Final Recommendation</h4>
                  <p>{evaluationResults.recommendation || 'No recommendation available.'}</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      <div className={`editor-wrapper ${activeMode !== 'none' ? 'focus-active' : ''}`}>
        <div className="note-header">
          <div className="breadcrumbs">
              <span className="breadcrumb-path">Workspace</span>
              <span className="breadcrumb-separator">›</span>
              <span className="breadcrumb-current">{selectedNote?.title || 'Untitled'}</span>
          </div>
          <div className="header-actions">
            <div className={`save-status ${status.class}`}>{status.text}</div>
            {activeMode === 'none' && (
              <div className="header-actions-group">
                <div className="focus-menu-container">
                  <button className="kebab-btn" onClick={() => setIsMenuOpen(!isMenuOpen)}>&#x22EE;</button>
                  {isMenuOpen && (
                    <div className="focus-dropdown">
                      <button onClick={() => { setActiveMode('feynman'); setIsMenuOpen(false); }}>🧠 Feynman Mode</button>
                      <button onClick={() => { setActiveMode('blurt'); setIsMenuOpen(false); }}>🗣️ Blurt Mode</button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="note-body-container">
          <input 
            type="text"
            className="static-note-title"
            value={activeMode === 'none' ? (selectedNote?.title || '') : (activeMode === 'feynman' ? '🧠 Feynman' : '🗣️ Blurt')}
            placeholder="Untitled"
            readOnly={activeMode !== 'none'}
            onChange={(e) => {
              if (activeMode !== 'none') return;
              setEditorContentRef.current(editor.getJSON(), e.target.value);
            }}
          />
          <EditorContent editor={activeMode === 'none' ? editor : focusEditor} />
        </div>
      </div>
    </>
  );
};

export default TipTap;