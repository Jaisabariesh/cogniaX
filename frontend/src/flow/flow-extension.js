import { Node, ReactNodeViewRenderer } from '@tiptap/react';
import FlowComponent from './FlowComponent';

export const FlowExtension = Node.create({
  name: 'flowBlock',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      nodes: {
        default: '[]',
      },
      edges: {
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
        tag: 'div[data-type="flow-block"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', { 'data-type': 'flow-block', ...HTMLAttributes }];
  },

  addNodeView() {
    return ReactNodeViewRenderer(FlowComponent);
  },

  ignoreMutation() {
    return true;
  },
});
