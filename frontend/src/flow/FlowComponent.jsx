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
      <div className="flow-card-node" style={{ width: '100%', height: '100%', margin: 0 }}>
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

const FlowComponent = ({ node, updateAttributes, deleteNode }) => {
  const { nodes: initialNodes, edges: initialEdges, height: initialHeight } = node.attrs;
  
  const [nodes, setNodes] = useState(JSON.parse(initialNodes || '[]'));
  const [edges, setEdges] = useState(JSON.parse(initialEdges || '[]'));
  const [height, setHeight] = useState(initialHeight || 400);

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

  const addNode = () => {
    const id = `node-${Date.now()}`;
    const newNode = {
      id,
      type: 'card',
      data: { label: '', onChange: handleNodeTextChange },
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
  }, [nodes, edges, height]);

  // Inject the onChange handler into nodes after hydration
  useEffect(() => {
    setNodes(nds => nds.map(n => ({
      ...n,
      data: { ...n.data, onChange: handleNodeTextChange }
    })));
  }, [handleNodeTextChange]);

  return (
    <NodeViewWrapper className="flow-block">
      <div className="flow-container" style={{ background: '#f0f2f5', border: '1px solid #d1d5db', borderRadius: '12px', overflow: 'hidden' }}>
        <div className="flow-toolbar" style={{ padding: '10px', background: 'white', borderBottom: '1px solid #e5e7eb', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button onClick={addNode} className="flow-add-btn">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              Add Card
            </button>
            <button 
              onClick={() => window.confirm("Delete mindmap block?") && deleteNode()}
              title="Delete Entire Block"
              style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', fontSize: '14px' }}
            >
              🗑️
            </button>
          </div>
          
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button 
              onClick={() => window.confirm("Delete mindmap block?") && deleteNode()}
              title="Delete Entire Block"
              style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', fontSize: '14px', marginRight: '10px' }}
            >
              🗑️
            </button>
            <span style={{ fontSize: '12px', fontWeight: '500', color: '#6b7280' }}>Extend:</span>
            <input 
              type="range" min="300" max="1500" value={height} 
              onChange={(e) => setHeight(parseInt(e.target.value))} 
              style={{ accentColor: '#4f46e5' }}
            />
          </div>
        </div>

        <div style={{ height: `${height}px`, width: '100%', background: 'white' }}>
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
