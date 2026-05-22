import React, { useRef, useState, useEffect } from 'react';
import { NodeViewWrapper } from '@tiptap/react';

const ResizableImage = ({ node, updateAttributes, selected }) => {
  const { src, width = 300 } = node.attrs;
  const containerRef = useRef(null);
  const [isResizing, setIsResizing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(width);

  const handleMouseDown = (event) => {
    setIsResizing(true);
    setStartX(event.clientX);
    setStartWidth(containerRef.current.offsetWidth);
    event.preventDefault();
  };

  const handleMouseMove = (event) => {
    if (!isResizing) return;
    const deltaX = event.clientX - startX;
    const newWidth = Math.max(50, startWidth + deltaX);
    updateAttributes({ width: newWidth });
  };

  const handleMouseUp = () => setIsResizing(false);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  return (
    <NodeViewWrapper
      ref={containerRef}
      style={{ display: 'inline-block', position: 'relative', width }}
      className="resizable-image-wrapper"
    >
      <img src={src} alt="" style={{ width: '100%', borderRadius: '6px' }} />
      {selected && (
        <div
          onMouseDown={handleMouseDown}
          style={{
            position: 'absolute',
            right: 0,
            bottom: 0,
            width: '12px',
            height: '12px',
            backgroundColor: '#888',
            cursor: 'nwse-resize',
            borderRadius: '2px',
          }}
        />
      )}
    </NodeViewWrapper>
  );
};

export default ResizableImage;
