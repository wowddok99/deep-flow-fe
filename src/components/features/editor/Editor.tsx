"use client"

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { useEffect, useMemo } from 'react'

interface EditorProps {
  initialContent?: any
  title: string
  onChangeTitle: (title: string) => void
  onSave: (content: any) => void
}

export function Editor({ initialContent, title, onChangeTitle, onSave }: EditorProps) {
  
  const extensions = useMemo(() => [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Placeholder.configure({
        placeholder: 'What are you working on? Capture your flow...',
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
  ], [])

  const editor = useEditor({
    extensions,
    content: initialContent || '',
    editorProps: {
      attributes: {
        class: 'tiptap prose prose-zinc dark:prose-invert focus:outline-none max-w-none min-h-[50vh] px-4 py-2 [&>*:first-child]:mt-0',
      },
       // Ensure markdown shortcuts are enabled (StarterKit default)
    },
    onUpdate: ({ editor }) => {
      onSave(editor.getJSON())
    },
    immediatelyRender: false
  })

  // Update content if initialContent changes from outside (e.g. switching sessions)
  useEffect(() => {
    if (editor && initialContent) {
       // Only set content if it's different to prevent cursor jumps or strict loops
       // But for simple "view" or "load", setting it once is fine.
       // Here we check if editor is empty or if we are switching sessions (implicit by initialContent change)
       // A simple check is to compare JSON stringified, but that's expensive.
       // For now, trust the parent to only change initialContent when switching sessions.
       editor.commands.setContent(initialContent)
    }
  }, [initialContent, editor])

  // Custom Key handler to override Focus Trap
  // Using Capture phase to ensure we intercept before Radix UI Focus Trap
  const handleKeyDownCapture = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault(); 
      e.stopPropagation(); // Stop bubbling immediately
      
      if (!editor) return;

      if (e.shiftKey) {
        // Shift+Tab: Outdent / Lift
        if (editor.can().liftListItem('listItem')) {
          editor.commands.liftListItem('listItem')
          return;
        }
        if (editor.can().liftListItem('taskItem')) {
          editor.commands.liftListItem('taskItem')
          return;
        }
        return;
      }

      // Tab: Indent / Sink
      if (editor.can().sinkListItem('listItem')) {
        editor.commands.sinkListItem('listItem')
        return;
      }
      if (editor.can().sinkListItem('taskItem')) {
        editor.commands.sinkListItem('taskItem')
        return;
      }
      
      // 2. Insert spaces only if selection is empty (cursor)
      // This prevents overwriting selected text with spaces
      if (editor.state.selection.empty) {
        editor.commands.insertContent('    ')
      }
    }
  }

  return (
    <div className="flex flex-col flex-1 w-full max-w-none">
        <input
            type="text"
            value={title}
            onChange={(e) => onChangeTitle(e.target.value)}
            placeholder="Untitled"
            className="text-4xl font-bold bg-transparent border-none outline-none px-4 py-4 w-full placeholder:text-muted-foreground/50"
        />
        {/* Use onKeyDownCapture to handle event in capture phase */}
        <div onKeyDownCapture={handleKeyDownCapture} className="flex-1 w-full">
            <EditorContent editor={editor} className="h-full" />
        </div>
    </div>
  )
}
