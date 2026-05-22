import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'

/**
 * Extension to prevent accidental deletion of specialized blocks
 * when backspacing from the line below.
 */
export const BlockSafe = Extension.create({
  name: 'blockSafe',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('blockSafe'),
        props: {
          handleKeyDown(view, event) {
            const { state } = view
            const { selection } = state

            // Expanded list to match both user logic and actual component names
            const protectedNodes = [
              'chemistry',
              'graph',
              'flowBlock',    // Mindmap
              'desmosBlock',  // Graph Plot
              'p5',
              'p5js',         // p5.js Sketch
              'whiteboard',
              'konvaDraw',    // Drawing Board
              'electrical',
              'circuitBlock', // Electric Circuit
              'mathquill',
              'image',
              'horizontalRule',
            ]

            // Case 1: If a protected node is directly selected (NodeSelection), 
            // block typing over it AND Backspace/Delete to force intentional removal via Trash button.
            if (selection.node && protectedNodes.includes(selection.node.type.name)) {
              if (
                event.key === 'Backspace' ||
                event.key === 'Delete' ||
                event.key === 'Enter' ||
                (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey)
              ) {
                return true
              }
            }

            // Case 2: Prevent Backspace from merging a top-level block into a protected block above.
            if (event.key === 'Backspace') {
              const { $from, empty } = selection
              if (!empty || $from.parentOffset !== 0) return false

              // CRITICAL: Only act on top-level blocks (depth 1).
              // This prevents interference with list items, tables, etc.
              if ($from.depth !== 1) return false

              const posBefore = $from.before(1)
              if (posBefore <= 0) return false

              const $posBefore = state.doc.resolve(posBefore)
              const nodeBefore = $posBefore.nodeBefore
              
              if (nodeBefore && protectedNodes.includes(nodeBefore.type.name)) {
                return true
              }
            }

            // Case 3: Prevent 'Delete' from above from merging into a protected top-level block below.
            if (event.key === 'Delete') {
              const { $from, empty } = selection
              if (!empty || $from.parentOffset < $from.parent.content.size) return false
              
              if ($from.depth !== 1) return false

              const posAfter = $from.after(1)
              if (posAfter >= state.doc.content.size) return false
              
              const $posAfter = state.doc.resolve(posAfter)
              const nodeAfter = $posAfter.nodeAfter
              
              if (nodeAfter && protectedNodes.includes(nodeAfter.type.name)) {
                return true
              }
            }

            return false
          },
        },
      }),
    ]
  },
})
