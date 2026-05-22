import { Node, ReactNodeViewRenderer } from '@tiptap/react';
import DesmosComponent from './DesmosComponent';

export const DesmosExtension = Node.create({
  name: 'desmosBlock', 
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      expressions: {
        default: [], // This will now store an array of just the math expressions, like ["y=\\sin(x)"]
      },
      height: {
        default: 450,
      }
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="desmos-block"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', { 'data-type': 'desmos-block', 'data-height': HTMLAttributes.height }];
  },

  addNodeView() {
    return ReactNodeViewRenderer(DesmosComponent)
  },
});
