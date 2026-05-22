import Image from '@tiptap/extension-image';
import { ReactNodeViewRenderer, mergeAttributes } from '@tiptap/react';
import ResizableImageComponent from './ResizableImageComponent';

export const ResizableImageExtension = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: 'auto',
        renderHTML: (attributes) => {
          if (attributes.width === 'auto') {
             return {};
          }
          return {
            width: attributes.width,
          };
        },
      },
      height: {
        default: 'auto',
        renderHTML: (attributes) => {
          if (attributes.height === 'auto') {
             return {};
          }
          return {
            height: attributes.height,
          };
        },
      },
    };
  },

  renderHTML({ HTMLAttributes }) {
    // Merge standard image HTML formatting
    return ['img', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageComponent);
  },
}).configure({ draggable: true });
