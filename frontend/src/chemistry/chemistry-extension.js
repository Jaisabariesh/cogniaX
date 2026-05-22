import { Node, ReactNodeViewRenderer } from '@tiptap/react';
import ChemistryComponent from './ChemistryComponent';

export const ChemistryExtension = Node.create({
  name: 'chemistry',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      smiles: {
        default: '',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="chemistry"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', { 'data-type': 'chemistry', ...HTMLAttributes }];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ChemistryComponent);
  },

  ignoreMutation() {
    return true;
  },
});
