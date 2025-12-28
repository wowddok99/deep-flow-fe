"use client"

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { useEffect } from 'react'

interface EditorProps {
  initialContent?: any
  onSave: (content: any) => void
}

export function Editor({ initialContent, onSave }: EditorProps) {
  const editor = useEditor({
    extensions: [
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
    ],
    content: initialContent || '',
    editorProps: {
      attributes: {
        class: 'tiptap prose prose-zinc dark:prose-invert focus:outline-none max-w-none min-h-[50vh] p-4',
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

  return <EditorContent editor={editor} className="flex-1 w-full" />
}
