import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, { 
  addEdge, 
  Background, 
  Controls, 
  applyEdgeChanges, 
  applyNodeChanges,
  Handle,
  Position,
  ReactFlowProvider
} from 'reactflow';
import 'reactflow/dist/style.css';
import { NodeViewWrapper } from '@tiptap/react';

import { NodeResizer } from 'reactflow';

// Custom Node with editable text and resizer
const CustomNode = ({ data, id, selected }) => {
  return (
    <>
      <NodeResizer 
        minWidth={100} 
        minHeight={50} 
        isVisible={selected} 
        lineStyle={{ border: '2px solid #4f46e5' }}
        handleStyle={{ width: 8, height: 8, background: '#4f46e5', border: '1px solid white' }}
      />
      <div className="flow-card-node" style={{ width: '100%', height: '100%', margin: 0, position: 'relative' }}>
        {selected && (
            <button 
                onClick={(e) => { e.stopPropagation(); data.onDelete(id); }}
                style={{ 
                    position: 'absolute', 
                    top: '-15px', 
                    right: '-15px', 
                    background: '#ef4444', 
                    color: 'white', 
                    border: '2px solid white', 
                    borderRadius: '50%', 
                    width: '24px', 
                    height: '24px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 1000,
                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                }}
                title="Delete Card"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        )}
        <Handle type="target" position={Position.Top} />
        <div className="flow-card-content" style={{ height: '100%', display: 'flex' }}>
          <textarea 
            defaultValue={data.label} 
            onBlur={(e) => data.onChange(id, e.target.value)}
            placeholder="Type..."
            style={{ width: '100%', height: '100%' }}
          />
        </div>
        <Handle type="source" position={Position.Bottom} />
      </div>
    </>
  );
};

const nodeTypes = {
  card: CustomNode,
};

const FlowComponent = ({ node, updateAttributes }) => {
  const { nodes: initialNodes, edges: initialEdges, height: initialHeight } = node.attrs;
  
  const [nodes, setNodes] = useState(JSON.parse(initialNodes || '[]'));
  const [edges, setEdges] = useState(JSON.parse(initialEdges || '[]'));
  const [height] = useState(initialHeight || 400);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Esc key listener to exit full screen
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFullScreen) {
        setIsFullScreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreen]);

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );
  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );
  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    []
  );

  const handleNodeTextChange = useCallback((id, newLabel) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          return { ...node, data: { ...node.data, label: newLabel } };
        }
        return node;
      })
    );
  }, []);

  const handleNodeDelete = useCallback((id) => {
    setNodes((nds) => nds.filter((node) => node.id !== id));
    setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
  }, []);

  const addNode = () => {
    const id = `node-${Date.now()}`;
    const newNode = {
      id,
      type: 'card',
      data: { label: '', onChange: handleNodeTextChange, onDelete: handleNodeDelete },
      position: { x: Math.random() * 400, y: Math.random() * 200 },
    };
    setNodes((nds) => nds.concat(newNode));
  };

  // Sync to Tiptap
  useEffect(() => {
    updateAttributes({
      nodes: JSON.stringify(nodes),
      edges: JSON.stringify(edges),
      height: height
    });
  }, [nodes, edges, height, updateAttributes]);

  // Inject the onChange handler into nodes after hydration
  useEffect(() => {
    setNodes(nds => nds.map(n => ({
      ...n,
      data: { ...n.data, onChange: handleNodeTextChange, onDelete: handleNodeDelete }
    })));
  }, [handleNodeTextChange, handleNodeDelete]);

  return (
    <NodeViewWrapper className={`flow-block ${isFullScreen ? 'full-screen' : ''}`}>
      <div className={`flow-container ${isFullScreen ? 'is-expanded' : ''}`}>
        <div className="flow-toolbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button onClick={addNode} className="flow-add-btn">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              Add Card
            </button>
          </div>
          
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button 
                onClick={() => setIsFullScreen(!isFullScreen)}
                title={isFullScreen ? "Exit Full Screen" : "Full Screen Mode"}
                style={{ background: 'transparent', border: 'none', color: '#4f46e5', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center' }}
            >
                {isFullScreen ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7"/></svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
                )}
            </button>
          </div>
        </div>

        <div style={{ height: isFullScreen ? 'calc(100vh - 60px)' : `${height}px`, width: '100%' }}>
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              fitView
            >
              <Background color="#aaa" gap={16} />
              <Controls />
            </ReactFlow>
          </ReactFlowProvider>
        </div>
      </div>
    </NodeViewWrapper>
  );
};

export default FlowComponent;
