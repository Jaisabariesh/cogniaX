import Image from '@tiptap/extension-image';
import ResizableImage from './ResizableImage';

export const ResizableImageExtension = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: 300,
        parseHTML: (el) => parseInt(el.getAttribute('width'), 10) || 300,
        renderHTML: (attrs) => ({ width: attrs.width }),
      },
    };
  },
  addNodeView() {
    return ResizableImage;
  },
});
