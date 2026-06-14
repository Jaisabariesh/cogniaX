import React, { useRef, useEffect, useState, useCallback } from 'react';
import { NodeViewWrapper } from '@tiptap/react';

const KonvaComponent = ({ node, updateAttributes }) => {
  const { shapes: initialShapes, height: initialHeight } = node.attrs;
  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const layerRef = useRef(null);
  const transformerRef = useRef(null);
  
  const [height, setHeight] = useState(initialHeight || 400);

  const [isReady, setIsReady] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      const hostRect = containerRef.current.getBoundingClientRect();
      const newHeight = Math.max(100, e.clientY - hostRect.top);
      setHeight(newHeight);
    };

    const handleMouseUp = () => setIsResizing(false);

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const saveState = useCallback(() => {
    if (!layerRef.current) return;
    const children = layerRef.current.getChildren().filter(c => c.className !== 'Transformer');
    const newState = children.map(c => ({
      ...c.attrs,
      type: c.className.toLowerCase()
    }));

    updateAttributes({ 
        shapes: JSON.stringify(newState),
        height: height
    });
  }, [updateAttributes, height]);

  // Helper to add a shape object to the Konva layer
  const addShapeToLayer = useCallback((data, layer) => {
    const Konva = window.Konva;
    const targetLayer = layer || layerRef.current;
    if (!Konva || !targetLayer) return;

    let shape;
    if (data.type === 'rect') {
      shape = new Konva.Rect({ ...data, draggable: true });
    } else if (data.type === 'circle') {
      shape = new Konva.Circle({ ...data, draggable: true });
    } else if (data.type === 'ellipse') {
      shape = new Konva.Ellipse({ ...data, draggable: true });
    } else if (data.type === 'regularpolygon') {
      shape = new Konva.RegularPolygon({ ...data, draggable: true });
    } else if (data.type === 'line') {
      shape = new Konva.Line({ ...data, draggable: true, hitStrokeWidth: 15 });
    } else if (data.type === 'text') {
      shape = new Konva.Text({ ...data, draggable: true });
      shape.on('dblclick', () => {
        const text = prompt('Edit text:', shape.text());
        if (text !== null) {
          shape.text(text);
          saveState();
        }
      });
    }

    if (shape) {
      shape.on('dragend transformend', saveState);
      targetLayer.add(shape);
      targetLayer.draw();
    }
  }, [saveState]);

  // Logic to load Konva manually
  useEffect(() => {
    if (!window.Konva && !document.getElementById('konva-cdn-script')) {
      const script = document.createElement('script');
      script.id = 'konva-cdn-script';
      script.src = "https://unpkg.com/konva@9/konva.min.js";
      document.head.appendChild(script);
    }

    const initKonva = () => {
      if (!containerRef.current) return;
      if (!window.Konva) {
        setTimeout(initKonva, 100);
        return;
      }

      if (stageRef.current) return; // Already init

      // Prevent TipTap from intercepting Konva drag events
      const stopEvent = (e) => e.stopPropagation();
      containerRef.current.addEventListener('mousedown', stopEvent);
      containerRef.current.addEventListener('touchstart', stopEvent);
      containerRef.current.addEventListener('pointerdown', stopEvent);

      // Create Stage
      const stage = new window.Konva.Stage({
        container: containerRef.current,
        width: 800, // Fixed width for stability
        height: height,
      });

      const layer = new window.Konva.Layer();
      stage.add(layer);
      
      const transformer = new window.Konva.Transformer();
      layer.add(transformer);

      stageRef.current = stage;
      layerRef.current = layer;
      transformerRef.current = transformer;

      // Render initial shapes
      const parsedShapes = JSON.parse(initialShapes || '[]');
      parsedShapes.forEach(shapeData => {
        addShapeToLayer(shapeData, layer);
      });

      setIsReady(true);

      // Selection logic
      stage.on('mousedown touchstart', (e) => {
        if (e.target === stage) {
          transformerRef.current.nodes([]);
          layerRef.current.batchDraw();
          return;
        }
        
        // Prevent Transformer from trying to transform its own resize/rotate handles
        if (e.target.getParent() && e.target.getParent().className === 'Transformer') {
          return; 
        }

        transformerRef.current.nodes([e.target]);
        transformerRef.current.moveToTop();
        layerRef.current.batchDraw();
      });
    };

    const timer = setTimeout(initKonva, 200);
    return () => {
      clearTimeout(timer);
      if (stageRef.current) stageRef.current.destroy();
    };
  }, [height, initialShapes, addShapeToLayer]); // Only on mount/initial hydration



  const addNew = (type) => {
    let data;
    if (type === 'rect') {
      data = { type: 'rect', x: 50, y: 50, width: 100, height: 100, stroke: '#333', strokeWidth: 2 };
    } else if (type === 'circle') {
      data = { type: 'circle', x: 150, y: 150, radius: 50, stroke: '#333', strokeWidth: 2 };
    } else if (type === 'ellipse') {
      data = { type: 'ellipse', x: 200, y: 200, radiusX: 60, radiusY: 35, stroke: '#333', strokeWidth: 2 };
    } else if (type === 'triangle') {
      data = { type: 'regularpolygon', x: 250, y: 200, sides: 3, radius: 50, stroke: '#333', strokeWidth: 2 };
    } else if (type === 'line') {
      data = { type: 'line', x: 0, y: 0, points: [50, 50, 200, 50], stroke: '#333', strokeWidth: 2, tension: 0 };
    } else if (type === 'text') {
      data = { type: 'text', x: 200, y: 200, text: 'New Text', fontSize: 20, fill: '#333' };
    }
    
    if (data) {
        addShapeToLayer(data);
        saveState();
    }
  };

  // Handle height resizing
  useEffect(() => {
    if (stageRef.current) {
        stageRef.current.height(height);
        updateAttributes({ height });
    }
  }, [height, updateAttributes]);

  return (
    <NodeViewWrapper className="konva-block">
      <div className="konva-container">
        <div className="konva-toolbar">
          <button onClick={() => addNew('rect')} className="konva-btn">Rect</button>
          <button onClick={() => addNew('circle')} className="konva-btn">Circle</button>
          <button onClick={() => addNew('ellipse')} className="konva-btn">Ellipse</button>
          <button onClick={() => addNew('triangle')} className="konva-btn">Triangle</button>
          <button onClick={() => addNew('line')} className="konva-btn">Line</button>
          <button onClick={() => addNew('text')} className="konva-btn">Text</button>
          
          <div style={{ flexGrow: 1 }} />

          <button onClick={() => { 
                const selectedNodes = transformerRef.current.nodes();
                if (selectedNodes.length > 0) {
                    selectedNodes.forEach(node => node.destroy());
                    transformerRef.current.nodes([]);
                    layerRef.current.batchDraw();
                    saveState();
                }
            }} className="konva-btn delete">
                <span style={{ fontSize: '14px' }}>🗑️</span>
                Delete
            </button>
        </div>
        {!isReady && <div style={{ padding: '60px', textAlign: 'center', color: '#71717a', background: '#18181b', fontSize: '13px' }}>
            <div className="spinner" style={{ marginBottom: '10px' }}>⚡</div>
            Initializing Canvas...
        </div>}
        <div ref={containerRef} className="konva-host" style={{ display: isReady ? 'block' : 'none', minHeight: '100px' }}></div>
        <div 
          onMouseDown={(e) => { e.preventDefault(); setIsResizing(true); }}
          className="konva-resize-handle"
          style={{ 
            height: '16px', 
            background: '#27272a', 
            cursor: 'ns-resize', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            userSelect: 'none',
            transition: 'all 0.2s'
          }}
        >
          <div style={{ width: '40px', height: '4px', borderTop: '2px solid #52525b', borderBottom: '2px solid #52525b' }}></div>
        </div>
      </div>
    </NodeViewWrapper>
  );
};

export default KonvaComponent;
