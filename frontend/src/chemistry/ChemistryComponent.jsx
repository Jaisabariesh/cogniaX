import React, { useRef, useEffect } from 'react';
import { NodeViewWrapper } from '@tiptap/react';

const ChemistryComponent = ({ node, updateAttributes, deleteNode }) => {
  const { smiles } = node.attrs;
  const containerRef = useRef(null);
  const jsmeAppletRef = useRef(null);
  // Persistent reference to the unique ID for this instance
  const jsmeId = useRef(`jsme-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    const initJsme = () => {
      if (!containerRef.current) return;

      // 1. Clear any existing content
      containerRef.current.innerHTML = '';
      
      // 2. Create the target div for JSME
      const jsmeHost = document.createElement('div');
      jsmeHost.id = jsmeId.current;
      containerRef.current.appendChild(jsmeHost);

      // 3. Initialize JSME if window.JSApplet is ready
      if (window.JSApplet) {
        try {
          const applet = new window.JSApplet.JSME(
            jsmeId.current, 
            "100%", 
            "300px",
            { options: "oldlook" }
          );
          
          jsmeAppletRef.current = applet;

          // Set initial value
          if (smiles) {
            applet.readGenericMolecularInput(smiles);
          }

          // Handle changes
          applet.setCallBack("AfterStructureModified", (event) => {
            const newSmiles = event.src.smiles();
            // Avoid circular updates
            if (newSmiles !== node.attrs.smiles) {
              updateAttributes({ smiles: newSmiles });
            }
          });
        } catch (err) {
          console.error("JSME manual init failed:", err);
        }
      } else {
        // If not loaded yet, wait and retry once
        setTimeout(initJsme, 500);
      }
    };

    // Load JSME library if not present
    if (!window.JSApplet && !document.getElementById('jsme-script')) {
      const script = document.createElement('script');
      script.id = 'jsme-script';
      script.src = "https://jsme.cloud.douglasconnect.com/JSME_2017-02-26/jsme/jsme.nocache.js";
      document.head.appendChild(script);
    }

    // Small delay to ensure Tiptap has placed the NodeViewWrapper in its final DOM position
    const timer = setTimeout(initJsme, 100);

    const currentContainer = containerRef.current;
    return () => {
      clearTimeout(timer);
      if (currentContainer) {
        currentContainer.innerHTML = '';
      }
      jsmeAppletRef.current = null;
    };
  }, [node.attrs.smiles, smiles, updateAttributes]); // Dependencies added to resolve lint warnings

  // External updates (Undo/Redo)
  useEffect(() => {
    if (jsmeAppletRef.current && smiles !== jsmeAppletRef.current.smiles()) {
      jsmeAppletRef.current.readGenericMolecularInput(smiles);
    }
  }, [smiles]);

  return (
    <NodeViewWrapper className="chemistry-block">
      <div className="chemistry-toolbar" style={{ padding: '8px 12px', background: '#1c1c1e', border: '1px solid #333', borderBottom: 'none', borderRadius: '12px 12px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', color: '#888', fontWeight: 'bold', textTransform: 'uppercase' }}>Structure Editor</span>
        <button 
          onClick={() => window.confirm("Delete chemistry block?") && deleteNode()}
          style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.6 }}
          onMouseOver={(e) => e.target.style.opacity = 1}
          onMouseOut={(e) => e.target.style.opacity = 0.6}
        >
          🗑️
        </button>
      </div>
      <div 
        ref={containerRef}
        className="jsme-container" 
        style={{ border: '1px solid #333', borderRadius: '0 0 12px 12px', overflow: 'hidden', background: 'white', minHeight: '300px' }}
      >
        <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
          Preparing molecule editor...
        </div>
      </div>
    </NodeViewWrapper>
  );
};

export default ChemistryComponent;
