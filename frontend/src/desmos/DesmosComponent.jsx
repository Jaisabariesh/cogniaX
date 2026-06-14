import React, { useEffect, useRef, useState } from 'react';
import { NodeViewWrapper } from '@tiptap/react';

// Load Desmos API from CDN safely
const loadDesmos = (callback) => {
  if (window.Desmos && window.Desmos.GraphingCalculator) {
    callback();
    return;
  }
  
  if (!window._desmosCallbacks) {
    window._desmosCallbacks = [];
    
    const script = document.createElement("script");
    script.src = "https://www.desmos.com/api/v1.9/calculator.js?apiKey=dcb31709b452b1cf9dc26972add0fda6";
    script.onload = () => {
      window._desmosCallbacks.forEach(cb => cb());
      window._desmosCallbacks = []; // clear
    };
    document.head.appendChild(script);
  }
  window._desmosCallbacks.push(callback);
};

export default function DesmosComponent(props) {
  const containerRef = useRef(null);
  const calculatorInstance = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const initialDataLoaded = useRef(false);

  useEffect(() => {
    loadDesmos(() => {
      setIsLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (isLoaded && containerRef.current && !calculatorInstance.current) {
        try {
            calculatorInstance.current = window.Desmos.GraphingCalculator(containerRef.current, {
                expressions: true,
                settingsMenu: false,
                zoomButtons: false,
                keypad: false,
                border: false,
                autosize: true,
                images: false,
                folders: false
            });
            
            // Restore existing expressions if they exist
            if (props.node.attrs.expressions && props.node.attrs.expressions.length > 0) {
                // Loop through the saved equations and add them to Desmos
                props.node.attrs.expressions.forEach((latexEq, index) => {
                    calculatorInstance.current.setExpression({ id: `graph${index}`, latex: latexEq });
                });
                initialDataLoaded.current = true;
            } else {
                // Default empty equations
                calculatorInstance.current.setExpression({ id: 'graph0', latex: '' });
                initialDataLoaded.current = true;
            }
            
            // Save state changes
            calculatorInstance.current.observeEvent('change', () => {
                if (calculatorInstance.current && initialDataLoaded.current) {
                   const state = calculatorInstance.current.getState();
                   const exprList = state.expressions.list || [];
                   
                   // Extract ONLY the latex equations (e.g., "y=sin(x)")
                   const expressionsArr = exprList
                     .filter(e => e.latex && e.latex.trim() !== '')
                     .map(e => e.latex);
                   
                   props.updateAttributes({ expressions: expressionsArr });
                }
            });
        } catch (err) {
            console.error("Desmos Initialization failed:", err);
        }
    }
    
    // Cleanup on unmount
    return () => {
        if (calculatorInstance.current) {
            if (typeof calculatorInstance.current.destroy === 'function') {
                calculatorInstance.current.destroy();
            }
            calculatorInstance.current = null;
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]);

  return (
    <NodeViewWrapper 
      className="desmos-block" 
      contentEditable={false}
      style={{ width: '100%', margin: '2rem 0', padding: '0', border: 'none', borderRadius: '0', background: 'transparent', boxShadow: 'none' }}
      onKeyDown={(e) => {
        if (e.key === 'Backspace' || e.key === 'Delete') {
          e.stopPropagation();
        }
      }}
    >
      <div contentEditable={false}>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
             <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#888', textTransform: 'uppercase' }}>MATH PLOT</span>
         </div>
         <div ref={containerRef} style={{ 
            width: '100%', 
            height: `${props.node.attrs.height || 450}px`, 
            backgroundColor: '#fff', 
            borderRadius: '12px', 
            overflow: 'hidden',
            filter: 'invert(1) hue-rotate(180deg) brightness(0.95) contrast(1.1)',
            border: '1px solid #333'
         }}>
            {!isLoaded && <p style={{ color: '#333', padding: '20px', textAlign: 'center' }}>Loading Desmos Graph...</p>}
         </div>
      </div>
    </NodeViewWrapper>
  );
};
