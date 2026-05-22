import { Node, ReactNodeViewRenderer } from '@tiptap/react';
import P5Component from './P5Component';

export const P5jsExtension = Node.create({
  name: 'p5js',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      code: {
        default: `function setup() {\n  createCanvas(400, 400);\n}\n\nfunction draw() {\n  background(220);\n  ellipse(50, 50, 80, 80);\n}`,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="p5js"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', { 'data-type': 'p5js', ...HTMLAttributes }];
  },

  addNodeView() {
    return ReactNodeViewRenderer(P5Component);
  },

  ignoreMutation() {
    return true;
  },
});
