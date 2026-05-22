import React, { useRef, useEffect, useState } from 'react';
import { NodeViewWrapper } from '@tiptap/react';

const KonvaComponent = ({ node, updateAttributes, deleteNode }) => {
  const { shapes: initialShapes, height: initialHeight } = node.attrs;
  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const layerRef = useRef(null);
  const transformerRef = useRef(null);
  
  const [height, setHeight] = useState(initialHeight || 400);
  const [shapes, setShapes] = useState(JSON.parse(initialShapes || '[]'));

  const [isReady, setIsReady] = useState(false);

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

      // Create Stage
      const stage = new window.Konva.Stage({
        container: containerRef.current,
        width: 800, // Fixed width for stability
        height: height,
      });

      const layer = new window.Konva.Layer();
      stage.add(layer);
      
      const tr = new window.Konva.Transformer();
      layer.add(tr);

      stageRef.current = stage;
      layerRef.current = layer;
      transformerRef.current = tr;

      // Render initial shapes
      const parsedShapes = JSON.parse(initialShapes || '[]');
      parsedShapes.forEach(shapeData => {
        addShapeToLayer(shapeData, layer, tr);
      });

      setIsReady(true);

      // Selection logic
      stage.on('click tap', (e) => {
        if (e.target === stage) {
          tr.nodes([]);
          return;
        }
        tr.nodes([e.target]);
      });
    };

    const timer = setTimeout(initKonva, 200);
    return () => {
      clearTimeout(timer);
      if (stageRef.current) stageRef.current.destroy();
    };
  }, []); // Only on mount

  // Helper to add a shape object to the Konva layer
  const addShapeToLayer = (data, layer, tr) => {
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
      shape = new Konva.Line({ ...data, draggable: true, hitStrokeWidth: 15 }); // larger hit area for easier selecting
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
  };

  const saveState = () => {
    if (!layerRef.current) return;
    const children = layerRef.current.getChildren().filter(c => c.className !== 'Transformer');
    const newState = children.map(c => ({
      ...c.attrs,
      type: c.className.toLowerCase()
    }));
    setShapes(newState);
    updateAttributes({ 
        shapes: JSON.stringify(newState),
        height: height
    });
  };

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
  }, [height]);

  return (
    <NodeViewWrapper className="konva-block">
      <div className="konva-container" style={{ background: 'white', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden', minHeight: '300px' }}>
        <div className="konva-toolbar" style={{ padding: '8px', background: '#f5f5f5', borderBottom: '1px solid #ddd', display: 'flex', gap: '8px' }}>
          <button onClick={() => addNew('rect')} className="konva-btn">⬜ Rect</button>
          <button onClick={() => addNew('circle')} className="konva-btn">⭕ Circle</button>
          <button onClick={() => addNew('ellipse')} className="konva-btn">🥖 Ellipse</button>
          <button onClick={() => addNew('triangle')} className="konva-btn">🔺 Triangle</button>
          <button onClick={() => addNew('line')} className="konva-btn">➖ Line</button>
          <button onClick={() => addNew('text')} className="konva-btn">🔤 Text</button>
          <button onClick={() => { layerRef.current.destroyChildren(); layerRef.current.add(transformerRef.current); layerRef.current.draw(); saveState(); }} className="konva-btn delete">🧹 Clear</button>
          
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              onClick={() => window.confirm("Delete drawing board?") && deleteNode()}
              title="Delete Entire Block"
              style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', fontSize: '14px', marginRight: '10px' }}
            >
              🗑️
            </button>
            <span style={{ fontSize: '11px', color: '#666' }}>Extend:</span>
            <input 
              type="range" min="200" max="1200" value={height} 
              onChange={(e) => setHeight(parseInt(e.target.value))} 
            />
          </div>
        </div>
        {!isReady && <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>Initializing drawing board...</div>}
        <div ref={containerRef} className="konva-host" style={{ display: isReady ? 'block' : 'none' }}></div>
      </div>
    </NodeViewWrapper>
  );
};

export default KonvaComponent;
