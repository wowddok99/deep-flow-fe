"use client"

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { ResizableImage } from './ResizableImage'
import * as React from 'react'

interface ReadOnlyContentProps {
  content: object | null
}

/**
 * Tiptap content 를 읽기 전용으로 렌더 — 공유 세션 상세 페이지 본문용.
 * 같은 extension 셋을 사용해 작성자 시각과 동일하게 보이도록.
 */
export function ReadOnlyContent({ content }: ReadOnlyContentProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      ResizableImage.configure({ allowBase64: false }),
    ],
    content: content || '',
    editable: false,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'tiptap prose prose-zinc dark:prose-invert max-w-none [&>*:first-child]:mt-0 px-4 py-2',
      },
    },
  })

  React.useEffect(() => {
    if (editor && content) {
      editor.commands.setContent(content as object)
    }
  }, [editor, content])

  if (!content) return <p className="text-sm text-muted-foreground italic">본문이 비어있어요</p>

  return <EditorContent editor={editor} />
}
