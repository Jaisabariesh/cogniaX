import { Extension } from '@tiptap/core'
import Suggestion from '@tiptap/suggestion'

export const SlashCommand = Extension.create({
  name: 'slash-command',
  
  addStorage() {
    return {
      activeMode: 'none',
    }
  },


  addOptions() {
    return {
      suggestion: {
        char: '/',
        startOfLine: false,
        command: ({ editor, props }) => {
          props.command(editor)
        },
        allow: ({ editor }) => {
          return !editor.isActive('codeBlock') && 
                 !editor.isActive('code_block') && 
                 !editor.isActive('blockquote') &&
                 !editor.isActive('p5js') &&
                 !editor.isActive('chemistry') &&
                 !editor.isActive('konvaDraw') &&
                 !editor.isActive('flowBlock') &&
                 !editor.isActive('desmosBlock') &&
                 !editor.isActive('mathquill')
        },
        items: ({ query, editor }) => {
          const activeMode = editor.storage['slash-command']?.activeMode || 'none';
          
          let items = [
            {
              title: 'Graph Plot',
              command: editor => editor.chain().focus().insertContent({ type: 'desmosBlock' }).run(),
            },
            {
              title: 'Math Block',
              command: editor => editor.chain().focus().insertContent({ type: 'mathquill' }).run(),
            },
            {
              title: 'Mindmap / Flow',
              command: editor => editor.chain().focus().insertContent({ type: 'flowBlock' }).run(),
            },
            {
              title: 'Drawing Board',
              command: editor => editor.chain().focus().insertContent({ type: 'konvaDraw' }).run(),
            },
            {
              title: 'p5.js Sketch',
              command: editor => editor.chain().focus().insertContent({ type: 'p5js' }).run(),
            },
            {
              title: 'Chemistry Block',
              command: editor => editor.chain().focus().insertContent({ type: 'chemistry' }).run(),
            },
            {
              title: 'Heading 1',
              command: editor => editor.chain().focus().toggleHeading({ level: 1 }).run(),
            },
            {
              title: 'Heading 2',
              command: editor => editor.chain().focus().toggleHeading({ level: 2 }).run(),
            },
            {
              title: 'Heading 3',
              command: editor => editor.chain().focus().toggleHeading({ level: 3 }).run(),
            },
            {
              title: 'Bullet List',
              command: editor => editor.chain().focus().toggleBulletList().run(),
            },
            {
              title: 'Ordered List',
              command: editor => editor.chain().focus().toggleOrderedList().run(),
            },
            {
              title: 'Task List',
              command: editor => editor.chain().focus().toggleTaskList().run(),
            },
            {
              title: 'Code Block',
              command: editor => editor.chain().focus().toggleCodeBlock().run(),
            },
            {
              title: 'Blockquote',
              command: editor => editor.chain().focus().toggleBlockquote().run(),
            },
            {
              title: 'Horizontal Rule',
              command: editor => editor.chain().focus().setHorizontalRule().run(),
            },
          ];

          // Filter out p5.js Sketch if in a focus mode
          if (activeMode !== 'none') {
            items = items.filter(item => item.title !== 'p5.js Sketch');
          }

          return items.filter(item =>
            item.title.toLowerCase().includes(query.toLowerCase())
          )
        },
        render: () => {
          let component
          let popup

          return {
            onStart: props => {
              component = document.createElement('div')
              component.classList.add('slash-menu')
              
              // Premium styles
              Object.assign(component.style, {
                position: 'fixed', // Use fixed to avoid scroll math issues
                zIndex: '5000',
                background: 'rgba(28, 28, 30, 0.95)',
                backdropFilter: 'blur(16px)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                padding: '6px',
                maxHeight: '320px',
                overflowY: 'auto',
                minWidth: '220px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                opacity: '0',
                transform: 'translateY(10px)',
                transition: 'opacity 0.2s, transform 0.2s',
                fontFamily: "'Inter', sans-serif"
              })

              popup = document.body.appendChild(component)
              renderItems(props, component)
              positionMenu(props, component)
              
              // Lock scroll
              const scrollContainer = document.querySelector('.note-body-container')
              if (scrollContainer) scrollContainer.style.overflow = 'hidden'

              // Trigger animation clip
              requestAnimationFrame(() => {
                component.style.opacity = '1'
                component.style.transform = 'translateY(0)'
              })
            },
            onUpdate: props => {
              renderItems(props, component)
              positionMenu(props, component)
            },
            onKeyDown: props => {
              if (props.event.key === 'Escape') {
                if (popup) popup.remove()
                return true
              }
              return false
            },
            onExit: () => {
              if (popup) {
                // Restore scroll
                const scrollContainer = document.querySelector('.note-body-container')
                if (scrollContainer) scrollContainer.style.overflow = 'auto'
                popup.remove()
              }
            }
          }
        }
      }
    }
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ]
  },
})

function renderItems({ items, command }, container) {
  container.innerHTML = ''
  if (items.length === 0) {
    container.innerHTML = '<div style="padding: 12px; color: #888; font-size: 0.9rem;">No results found...</div>'
    return
  }

  items.forEach(item => {
    const div = document.createElement('div')
    div.classList.add('slash-item')
    div.style.padding = '10px 14px'
    div.style.cursor = 'pointer'
    div.style.borderRadius = '8px'
    div.style.transition = 'all 0.15s ease'
    div.style.fontSize = '0.9rem'
    div.style.display = 'flex'
    div.style.alignItems = 'center'
    div.style.gap = '10px'
    
    // Add an icon placeholder or title
    div.innerHTML = `
      <span style="opacity: 0.8">${item.title}</span>
    `
    
    div.onmouseover = () => {
      div.style.background = 'rgba(255,255,255,0.08)'
      div.style.transform = 'translateX(4px)'
    }
    div.onmouseout = () => {
      div.style.background = 'transparent'
      div.style.transform = 'translateX(0)'
    }
    
    div.onclick = () => {
      command(item)
    }
    container.appendChild(div)
  })
}

function positionMenu(_props, element) {
  const selection = window.getSelection()
  if (!selection.rangeCount) return
  
  const range = selection.getRangeAt(0)
  const rect = range.getBoundingClientRect()
  const menuHeight = element.offsetHeight || 250 // Estimate if not rendered yet
  const viewportHeight = window.innerHeight

  let top = rect.bottom + 10
  let left = rect.left

  // SMART FLIP LOGIC
  if (top + menuHeight > viewportHeight - 20) {
    // Upside down!
    top = rect.top - menuHeight - 10
    element.style.transformOrigin = 'bottom left'
  } else {
    element.style.transformOrigin = 'top left'
  }

  // Horizontal bounds check
  if (left + 220 > window.innerWidth) {
    left = window.innerWidth - 240
  }

  element.style.top = `${top}px`
  element.style.left = `${left}px`
}
