import React, { useRef, useEffect, useState } from 'react';
import { NodeViewWrapper } from '@tiptap/react';

const P5Component = ({ node, updateAttributes, deleteNode }) => {
  const { code } = node.attrs;
  const containerRef = useRef(null);
  const p5InstanceRef = useRef(null);
  const [localCode, setLocalCode] = useState(code || `function setup() {\n  createCanvas(400, 400);\n}\n\nfunction draw() {\n  background(220);\n  ellipse(50, 50, 80, 80);\n}`);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('code');

  const [runId, setRunId] = useState(0);

  const initSketch = () => {
    if (!containerRef.current) return;
    if (!window.p5) {
      setTimeout(initSketch, 200);
      return;
    }

    // Cleanup previous instance
    if (p5InstanceRef.current) {
      p5InstanceRef.current.remove();
      p5InstanceRef.current = null;
    }

    // Clear DOM container to prevent stacking canvases
    containerRef.current.innerHTML = '';

    try {
      const sketch = (p) => {
        try {
          const userFunction = new Function('p', `
            with (p) {
              ${localCode}
              return { 
                setup: typeof setup !== 'undefined' ? setup : null, 
                draw: typeof draw !== 'undefined' ? draw : null,
                mousePressed: typeof mousePressed !== 'undefined' ? mousePressed : null
              };
            }
          `);
          
          const callbacks = userFunction(p);
          if (callbacks.setup) p.setup = callbacks.setup;
          if (callbacks.draw) p.draw = callbacks.draw;
          if (callbacks.mousePressed) p.mousePressed = callbacks.mousePressed;
          
        } catch (e) {
          setError(e.message);
        }
      };

      p5InstanceRef.current = new window.p5(sketch, containerRef.current);
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    // Load CDN script once
    if (!window.p5 && !document.getElementById('p5-cdn-script')) {
      const script = document.createElement('script');
      script.id = 'p5-cdn-script';
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.10.0/p5.min.js";
      document.head.appendChild(script);
    }
    
    const timer = setTimeout(initSketch, 200);
    return () => {
      clearTimeout(timer);
      if (p5InstanceRef.current) {
        p5InstanceRef.current.remove();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId]); // Re-run whenever runId changes (initSketch depends on localCode which is captured at call time)

  const handleRun = () => {
    setError(null);
    updateAttributes({ code: localCode });
    setRunId(prev => prev + 1);
  };

  return (
    <NodeViewWrapper className="p5js-block">
      <div className="p5-editor-container">
        <div className="p5-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 15px', background: '#27272a', borderBottom: '1px solid #333' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: '#fff', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>p5.js Visual Sketch</span>
            <button 
              onClick={() => window.confirm("Delete p5.js block?") && deleteNode()}
              title="Delete Block"
              style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0 4px', fontSize: '14px', opacity: 0.6 }}
              onMouseOver={(e) => e.target.style.opacity = 1}
              onMouseOut={(e) => e.target.style.opacity = 0.6}
            >
              🗑️
            </button>
          </div>
          <div style={{ display: 'flex', background: '#111', borderRadius: '6px', padding: '3px' }}>
            <button
              onClick={() => setActiveTab('code')}
              style={{ background: activeTab === 'code' ? '#444' : 'transparent', color: activeTab === 'code' ? '#fff' : '#888', border: 'none', borderRadius: '4px', padding: '4px 16px', fontSize: '12px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              Code
            </button>
            <button
              onClick={() => { handleRun(); setActiveTab('run'); }}
              style={{ background: activeTab === 'run' ? '#2ecc71' : 'transparent', color: activeTab === 'run' ? '#fff' : '#888', border: 'none', borderRadius: '4px', padding: '4px 16px', fontSize: '12px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              Run
            </button>
          </div>
        </div>
        
        <div className="p5-content">
          <textarea
            className="p5-textarea"
            style={{ display: activeTab === 'code' ? 'block' : 'none' }}
            value={localCode}
            onChange={(e) => setLocalCode(e.target.value)}
            spellCheck="false"
          />
          
          <div className="p5-preview" style={{ display: activeTab === 'run' ? 'flex' : 'none', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '200px', backgroundColor: '#000', padding: '20px' }}>
             <div ref={containerRef} className="p5-canvas-host"></div>
             {error && <div className="p5-error" style={{ color: '#ff4444', marginTop: '10px', fontSize: '12px', fontFamily: 'monospace', textAlign: 'center' }}>{error}</div>}
          </div>
        </div>
      </div>
    </NodeViewWrapper>
  );
};

export default P5Component;
