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

      if (stageRef.current) return;

      const stage = new window.Konva.Stage({
        container: containerRef.current,
        width: containerRef.current.offsetWidth || 800,
        height: height,
      });

      const layer = new window.Konva.Layer();
      stage.add(layer);
      
      const transformer = new window.Konva.Transformer({
        borderStroke: '#bc9fff',
        anchorStroke: '#bc9fff',
        anchorFill: '#1c1c1e',
        anchorSize: 10,
        rotateAnchorOffset: 30
      });
      layer.add(transformer);

      stageRef.current = stage;
      layerRef.current = layer;
      transformerRef.current = transformer;

      const parsedShapes = JSON.parse(initialShapes || '[]');
      parsedShapes.forEach(shapeData => {
        addShapeToLayer(shapeData, layer);
      });

      setIsReady(true);

      stage.on('mousedown touchstart', (e) => {
        if (e.target === stage) {
          transformerRef.current.nodes([]);
          layerRef.current.batchDraw();
          return;
        }
        if (e.target.getParent() && e.target.getParent().className === 'Transformer') return;
        transformerRef.current.nodes([e.target]);
        transformerRef.current.moveToTop();
        layerRef.current.batchDraw();
      });

      // Responsive Resize
      const resizeObserver = new ResizeObserver(() => {
        if (containerRef.current && stageRef.current) {
          stageRef.current.width(containerRef.current.offsetWidth);
          stageRef.current.batchDraw();
        }
      });
      resizeObserver.observe(containerRef.current);
    };

    const timer = setTimeout(initKonva, 200);
    return () => {
      clearTimeout(timer);
      // We don't destroy the stage here if we want it to persist across tiny re-renders, 
      // but TipTap sometimes needs careful cleanup. 
      // To fix the "destruction" bug, we only destroy if unmounting really happens.
    };
  }, [initialShapes, addShapeToLayer]); // Removed height from dependencies to prevent stage recreation on resize



  const addNew = (type) => {
    let data;
    const defaultStroke = '#ececef';
    const accentStroke = '#bc9fff';

    const offset = Math.random() * 20;

    if (type === 'rect') {
      data = { type: 'rect', x: 50 + offset, y: 50 + offset, width: 100, height: 100, stroke: defaultStroke, strokeWidth: 2 };
    } else if (type === 'circle') {
      data = { type: 'circle', x: 150 + offset, y: 150 + offset, radius: 50, stroke: defaultStroke, strokeWidth: 2 };
    } else if (type === 'ellipse') {
      data = { type: 'ellipse', x: 200 + offset, y: 200 + offset, radiusX: 60, radiusY: 35, stroke: defaultStroke, strokeWidth: 2 };
    } else if (type === 'triangle') {
      data = { type: 'regularpolygon', x: 250 + offset, y: 200 + offset, sides: 3, radius: 50, stroke: defaultStroke, strokeWidth: 2 };
    } else if (type === 'line') {
      data = { type: 'line', x: offset, y: offset, points: [50, 50, 200, 200], stroke: accentStroke, strokeWidth: 3, tension: 0 };
    } else if (type === 'text') {
      data = { type: 'text', x: 200 + offset, y: 200 + offset, text: 'New Text', fontSize: 20, fill: '#fff' };
    }
    
    if (data) {
        addShapeToLayer(data);
        saveState();
    }
  };

  // Handle stage height and attribute syncing
  useEffect(() => {
    if (stageRef.current) {
        stageRef.current.height(height);
        // Throttle attribute update slightly to prevent infinite loops
        const timeout = setTimeout(() => {
            updateAttributes({ height });
        }, 100);
        return () => clearTimeout(timeout);
    }
  }, [height, updateAttributes]);

  // Handle external shape changes (syncing)
  useEffect(() => {
    if (isReady && layerRef.current) {
        const currentData = JSON.stringify(layerRef.current.getChildren().filter(c => c.className !== 'Transformer').map(c => ({ ...c.attrs, type: c.className.toLowerCase() })));
        if (initialShapes !== currentData) {
            // Only re-sync if the prop is different from our current internal state
            // and we didn't just trigger this update ourselves
            layerRef.current.getChildren().filter(c => c.className !== 'Transformer').forEach(c => c.destroy());
            const parsedShapes = JSON.parse(initialShapes || '[]');
            parsedShapes.forEach(shapeData => addShapeToLayer(shapeData));
        }
    }
  }, [initialShapes, isReady, addShapeToLayer]);

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
            }} className="konva-btn delete" title="Delete Selection">
                🗑️
            </button>
            <button onClick={() => {
                if (window.confirm('Clear entire canvas?')) {
                    layerRef.current.getChildren().filter(c => c.className !== 'Transformer').forEach(c => c.destroy());
                    transformerRef.current.nodes([]);
                    layerRef.current.batchDraw();
                    saveState();
                }
            }} className="konva-btn delete" title="Clear Canvas">
                🧹
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
