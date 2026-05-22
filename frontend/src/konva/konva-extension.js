import { Node, ReactNodeViewRenderer } from '@tiptap/react';
import KonvaComponent from './KonvaComponent';

export const KonvaExtension = Node.create({
  name: 'konvaDraw',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      shapes: {
        default: '[]',
      },
      height: {
        default: 400,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="konva-draw"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', { 'data-type': 'konva-draw', ...HTMLAttributes }];
  },

  addNodeView() {
    return ReactNodeViewRenderer(KonvaComponent);
  },

  ignoreMutation() {
    return true;
  },
});
