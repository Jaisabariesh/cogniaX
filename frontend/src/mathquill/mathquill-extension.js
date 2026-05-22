import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import MathQuillComponent from './MathQuillComponent.jsx';

export const MathQuillExtension = Node.create({
  name: 'mathquill',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      latex: {
        default: '',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'math-quill',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['math-quill', mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MathQuillComponent);
  },
});
