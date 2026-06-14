import React, { useState, useRef, useEffect } from 'react';
import { NodeViewWrapper } from '@tiptap/react';

const ResizableImageComponent = ({ node, updateAttributes, selected }) => {
  const containerRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [initialWidth, setInitialWidth] = useState(0);
  const [startX, setStartX] = useState(0);
  const [aspectRatio, setAspectRatio] = useState(1);
  const [resizeDir, setResizeDir] = useState(''); // 'nw', 'ne', 'sw', 'se'

  const { src, alt, title, width, height } = node.attrs;

  const handleMouseDown = (e, dir) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setStartX(e.clientX);
    setResizeDir(dir);

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      setInitialWidth(w);
      if (h > 0) setAspectRatio(w / h);
    }
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e) => {
      e.preventDefault();
      e.stopPropagation();
      let newWidth = initialWidth;
      
      const dx = e.clientX - startX;
      // const dy = e.clientY - startY;

      if (resizeDir === 'e' || resizeDir === 'ne' || resizeDir === 'se') {
        newWidth = initialWidth + dx;
      } else if (resizeDir === 'w' || resizeDir === 'nw' || resizeDir === 'sw') {
        newWidth = initialWidth - dx;
      }

      // maintain aspect ratio
      if (newWidth < 50) newWidth = 50; // min width
      const newHeight = newWidth / aspectRatio;

      updateAttributes({ width: Math.round(newWidth), height: Math.round(newHeight) });
    };

    const handleMouseUp = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, initialWidth, startX, resizeDir, aspectRatio, updateAttributes]);

  return (
    <NodeViewWrapper
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`resizable-image-wrapper ${selected ? 'ProseMirror-selectednode' : ''}`}
      style={{ display: 'inline-block', position: 'relative', width: width === 'auto' ? 'auto' : `${width}px`, height: height === 'auto' ? 'auto' : `${height}px` }}
    >
      <img
        ref={containerRef}
        src={src}
        alt={alt}
        title={title}
        style={{ width: '100%', height: '100%', display: 'block', borderRadius: '6px' }}
      />
      {(selected || isHovered || isResizing) && (
        <>
          <div
            onMouseDown={(e) => handleMouseDown(e, 'nw')}
            style={{ position: 'absolute', top: -5, left: -5, width: 10, height: 10, background: 'var(--accent)', border: '1px solid white', borderRadius: '50%', cursor: 'nwse-resize', zIndex: 10 }}
          />
          <div
            onMouseDown={(e) => handleMouseDown(e, 'ne')}
            style={{ position: 'absolute', top: -5, right: -5, width: 10, height: 10, background: 'var(--accent)', border: '1px solid white', borderRadius: '50%', cursor: 'nesw-resize', zIndex: 10 }}
          />
          <div
            onMouseDown={(e) => handleMouseDown(e, 'sw')}
            style={{ position: 'absolute', bottom: -5, left: -5, width: 10, height: 10, background: 'var(--accent)', border: '1px solid white', borderRadius: '50%', cursor: 'nesw-resize', zIndex: 10 }}
          />
          <div
            onMouseDown={(e) => handleMouseDown(e, 'se')}
            style={{ position: 'absolute', bottom: -5, right: -5, width: 10, height: 10, background: 'var(--accent)', border: '1px solid white', borderRadius: '50%', cursor: 'nwse-resize', zIndex: 10 }}
          />
        </>
      )}
    </NodeViewWrapper>
  );
};

export default ResizableImageComponent;
