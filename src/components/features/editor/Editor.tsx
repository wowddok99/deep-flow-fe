"use client"

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { ResizableImage } from './ResizableImage'
import { useEffect, useMemo, useRef, useCallback } from 'react'
import { ImagePlus, Loader2 } from 'lucide-react'
import { imagesApi } from '@/lib/api'
import { useAuthStore } from '@/store/useAuthStore'
import { useState } from 'react'

interface EditorProps {
  initialContent?: any
  title: string
  onChangeTitle: (title: string) => void
  onSave: (content: any) => void
}

export function Editor({ initialContent, title, onChangeTitle, onSave }: EditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

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
    ResizableImage.configure({
      allowBase64: false,
      HTMLAttributes: {
        class: 'editor-image',
      },
    }),
  ], [])

  const uploadAndInsertImages = useCallback(async (files: File[], editorInstance: any) => {
    if (!editorInstance || files.length === 0) return

    const imageFiles = files.filter(f => f.type.startsWith('image/'))
    if (imageFiles.length === 0) return

    setIsUploading(true)
    try {
      const urls = await imagesApi.upload(imageFiles, () => useAuthStore.getState().accessToken)
      urls.forEach(url => {
        editorInstance.chain().focus().setImage({ src: url }).run()
      })
    } catch (e) {
      console.error("이미지 업로드 실패", e)
    } finally {
      setIsUploading(false)
    }
  }, [])

  const editor = useEditor({
    extensions,
    content: initialContent || '',
    editorProps: {
      attributes: {
        class: 'tiptap prose prose-zinc dark:prose-invert focus:outline-none max-w-none min-h-[50vh] px-4 py-2 [&>*:first-child]:mt-0',
      },
      handleDrop: (view, event, _slice, moved) => {
        if (moved || !event.dataTransfer?.files?.length) return false
        const files = Array.from(event.dataTransfer.files)
        const imageFiles = files.filter(f => f.type.startsWith('image/'))
        if (imageFiles.length === 0) return false

        event.preventDefault()
        // Use setTimeout to access editor after it's set
        setTimeout(() => {
          const editorInstance = (view as any).dom?.closest('.tiptap')?.editor || editor
          uploadAndInsertImages(imageFiles, editor)
        }, 0)
        return true
      },
      handlePaste: (_view, event) => {
        const items = event.clipboardData?.items
        if (!items) return false

        const imageFiles: File[] = []
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.startsWith('image/')) {
            const file = items[i].getAsFile()
            if (file) imageFiles.push(file)
          }
        }

        if (imageFiles.length === 0) return false

        event.preventDefault()
        setTimeout(() => {
          uploadAndInsertImages(imageFiles, editor)
        }, 0)
        return true
      },
    },
    onUpdate: ({ editor }) => {
      onSave(editor.getJSON())
    },
    immediatelyRender: false
  })

  // Update content if initialContent changes from outside (e.g. switching sessions)
  useEffect(() => {
    if (editor && initialContent) {
      // Check if content is actually different
      const currentContent = editor.getJSON()
      const isSame = JSON.stringify(currentContent) === JSON.stringify(initialContent)

      if (!isSame) {
        // If content is different, we update it.
        // This resets cursor, but it's necessary if the document actually changed.
        editor.commands.setContent(initialContent)
      }
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

  const handleImageButtonClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || !editor) return
    uploadAndInsertImages(Array.from(files), editor)
    // Reset input so same file can be selected again
    e.target.value = ''
  }

  return (
    <div className="flex flex-col flex-1 w-full max-w-none">
      <div className="flex items-center gap-2 px-4">
        <input
          type="text"
          value={title}
          onChange={(e) => onChangeTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              editor?.commands.focus()
            }
          }}
          placeholder="Untitled"
          className="text-4xl font-bold bg-transparent border-none outline-none py-4 w-full placeholder:text-muted-foreground/50"
        />
        <button
          type="button"
          onClick={handleImageButtonClick}
          disabled={isUploading}
          className="flex-shrink-0 p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer disabled:opacity-50"
          title="이미지 추가"
        >
          {isUploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <ImagePlus className="h-5 w-5" />
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
      {/* Use onKeyDownCapture to handle event in capture phase */}
      <div onKeyDownCapture={handleKeyDownCapture} className="flex-1 w-full">
        <EditorContent editor={editor} className="h-full" />
      </div>
    </div>
  )
}
