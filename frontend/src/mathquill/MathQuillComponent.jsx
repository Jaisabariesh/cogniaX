import React, { useState } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import { addStyles, EditableMathField } from 'react-mathquill';

// Pre-inject styles
addStyles();

const MathQuillComponent = ({ node, updateAttributes, deleteNode }) => {
  const { latex: initialLatex } = node.attrs;
  const [latex, setLatex] = useState(initialLatex || '');
  const [mathField, setMathField] = useState(null);

  const handleChange = (field) => {
    const newLatex = field.latex();
    setLatex(newLatex);
    updateAttributes({ latex: newLatex });
  };

  const insertSymbol = (symbol) => {
    if (mathField) {
      mathField.cmd(symbol);
      mathField.focus();
    }
  };



  const symbols = [
    { label: 'x²', cmd: '^2' },
    { label: 'xⁿ', cmd: '^' },
    { label: '√', cmd: '\\sqrt' },
    { label: '¾', cmd: '\\frac' },
    { label: 'π', cmd: '\\pi' },
    { label: 'θ', cmd: '\\theta' },
    { label: '∞', cmd: '\\infty' },
    { label: '±', cmd: '\\pm' },
    { label: '∫', cmd: '\\int' },
    { label: 'Δ', cmd: '\\Delta' },
  ];

  const deleteBlock = () => {
    if (window.confirm("Are you sure you want to delete this math block?")) {
      deleteNode();
    }
  };

  return (
    <NodeViewWrapper className="mathquill-block">
      <div className="mathquill-container" style={{ margin: '15px 0', padding: '20px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '12px', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ fontSize: '11px', color: '#888', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
               Mathematical Expression
            </div>
            <button 
              onClick={deleteBlock}
              title="Delete Block"
              style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0 4px', fontSize: '14px', opacity: 0.6 }}
              onMouseOver={(e) => e.target.style.opacity = 1}
              onMouseOut={(e) => e.target.style.opacity = 0.6}
            >
              🗑️
            </button>
          </div>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: '70%' }}>
            {symbols.map((s, i) => (
              <button
                key={i}
                onClick={() => insertSymbol(s.cmd)}
                style={{
                  padding: '4px 8px',
                  background: 'var(--bg-main)',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.target.style.background = 'var(--bg-hover)'}
                onMouseOut={(e) => e.target.style.background = 'var(--bg-main)'}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: '15px', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: '8px', minHeight: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <EditableMathField
            latex={latex}
            onChange={handleChange}
            mathquillDidMount={(field) => setMathField(field)}
            style={{ minWidth: '120px', width: '100%', border: 'none', fontSize: '1.6rem', color: 'var(--text-primary)' }}
          />
        </div>
        <div style={{ marginTop: '10px', fontSize: '10px', color: '#555', textAlign: 'right', fontStyle: 'italic' }}>
           Interactive MathQuill Editor
        </div>
      </div>
    </NodeViewWrapper>
  );
};

export default MathQuillComponent;
