"use client"

import * as React from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Mention from '@tiptap/extension-mention'
import { toast } from 'sonner'
import { Send, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { commentApi, commentKeys, type CommentNode, type MemberSuggestion } from '@/lib/api'
import { getApiErrorMessage } from '@/lib/axios'
import { useAuthStore } from '@/store/useAuthStore'
import { MentionAutocomplete } from './MentionAutocomplete'

interface CommentInputProps {
  sessionId: number
  crewId: number
  parentId?: number
  onSubmitted?: () => void
  onCancel?: () => void
  placeholder?: string
  autoFocus?: boolean
}

interface SuggestionState {
  open: boolean
  query: string
  // Tiptap Mention attrs 는 id 가 string 으로 정의돼 있어 string 으로 통일 — 추출 시 Number() 변환.
  command: ((item: { id: string; label: string }) => void) | null
}

export function CommentInput({
  sessionId,
  crewId,
  parentId,
  onSubmitted,
  onCancel,
  placeholder = '댓글 작성... (@ 입력 시 멤버 자동완성)',
  autoFocus,
}: CommentInputProps) {
  const queryClient = useQueryClient()

  // Tiptap suggestion 의 imperative 라이프사이클을 React 상태로 브리지.
  // open/onUpdate/onExit 콜백이 setSuggestion 으로 query/command 를 흘려보내고,
  // 화면의 MentionAutocomplete 가 그걸 보고 dropdown 을 띄운다.
  const [suggestion, setSuggestion] = React.useState<SuggestionState>({
    open: false,
    query: '',
    command: null,
  })

  // MentionAutocomplete 의 키보드 핸들러를 부착할 anchor — Tiptap 의 contentEditable DOM.
  const editorAnchorRef = React.useRef<HTMLElement | null>(null)

  // Tiptap v3 의 useEditor 는 shouldRerenderOnTransaction 기본값이 false 라 editor.isEmpty
  // 같은 파생값을 직접 읽으면 stale 함. onUpdate 로 React state 에 미러링해 등록 버튼 활성화에 사용.
  const [isEmpty, setIsEmpty] = React.useState(true)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // 댓글은 한 단락 평문 위주 — 단축키 등 기본 노드는 살리되 placeholder 를 별도로 적용.
        heading: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
      }),
      Placeholder.configure({ placeholder }),
      Mention.configure({
        HTMLAttributes: {
          class: 'mention rounded bg-primary/10 text-primary px-1 font-medium',
        },
        // BE 로 넘어가는 평문은 '@username' 형태가 되어야 함 (서버가 본문 + mentions[userId] 를 매칭).
        renderText({ node }) {
          return `@${node.attrs.label}`
        },
        suggestion: {
          char: '@',
          // items 는 직접 채우지 않는다 — MentionAutocomplete 가 자체 react-query 로 가져옴.
          items: () => [],
          // 기본 command 는 한글 IME 조합 타이밍에 range.to 가 stale 해 '@최' 의 '최' 가 chip 뒤에
          // 남는 문제가 있다. range.to 부터 현재 단락 끝까지 비공백 텍스트를 직접 스캔해
          // 함께 잘라낸 뒤 mention + 공백 으로 교체한다.
          command: ({ editor, range, props }) => {
            const { state } = editor
            const $to = state.doc.resolve(range.to)
            const parentEnd = $to.end()
            let endPos = range.to
            while (endPos < parentEnd) {
              const ch = state.doc.textBetween(endPos, endPos + 1, '\n', '\n')
              if (!ch || /\s/.test(ch)) break
              endPos++
            }
            editor
              .chain()
              .focus()
              .insertContentAt(
                { from: range.from, to: endPos },
                [
                  { type: 'mention', attrs: props },
                  { type: 'text', text: ' ' },
                ]
              )
              .run()
          },
          render: () => ({
            onStart: (props) => {
              setSuggestion({
                open: true,
                query: props.query,
                command: props.command as (item: { id: string; label: string }) => void,
              })
            },
            onUpdate: (props) => {
              setSuggestion({
                open: true,
                query: props.query,
                command: props.command as (item: { id: string; label: string }) => void,
              })
            },
            // 키 처리는 MentionAutocomplete 가 anchor 에 부착한 keydown 리스너가 가져감.
            onKeyDown: () => false,
            onExit: () => {
              setSuggestion({ open: false, query: '', command: null })
            },
          }),
        },
      }),
    ],
    autofocus: autoFocus,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      setIsEmpty(editor.isEmpty)
    },
    editorProps: {
      attributes: {
        // ProseMirror 가 자동으로 .ProseMirror 클래스를 부여 — globals.css 의 placeholder/mention 규칙이 매칭됨.
        // .tiptap 클래스는 의도적으로 빼서 globals.css 의 본문용 padding/min-height 영향을 받지 않게 함.
        class:
          'min-h-[64px] w-full rounded-md border border-input bg-transparent px-3 py-2 ' +
          'text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50 ' +
          'whitespace-pre-wrap break-words',
      },
    },
  })

  // editor view 의 DOM 을 anchor 로 등록. 마운트 후 한번만 처리.
  React.useEffect(() => {
    editorAnchorRef.current = (editor?.view.dom as HTMLElement) ?? null
  }, [editor])

  const handleMentionSelect = (m: MemberSuggestion) => {
    if (suggestion.command) {
      // Tiptap Mention attrs: id (string), label (렌더/저장용 username)
      suggestion.command({ id: String(m.userId), label: m.username })
    }
  }

  // 에디터에서 평문 + mention userId 추출.
  const extractContentAndMentions = (): { content: string; mentions: number[] } => {
    if (!editor) return { content: '', mentions: [] }
    const content = editor.getText().trim()
    const mentions: number[] = []
    editor.state.doc.descendants((node) => {
      if (node.type.name === 'mention') {
        const idAttr = node.attrs.id
        const id = typeof idAttr === 'number' ? idAttr : Number(idAttr)
        if (!Number.isNaN(id)) mentions.push(id)
      }
    })
    return { content, mentions: Array.from(new Set(mentions)) }
  }

  const createMutation = useMutation({
    mutationFn: () => {
      const { content, mentions } = extractContentAndMentions()
      return commentApi.create(sessionId, { parentId, content, mentions })
    },
    onMutate: async () => {
      const { content } = extractContentAndMentions()
      const myId = useAuthStore.getState().user?.id ?? -1
      const tmpId = -Date.now()
      const tmp: CommentNode = {
        id: tmpId,
        user: { id: myId, name: '나' },
        content,
        mentions: [],
        edited: false,
        deleted: false,
        createdAt: new Date().toISOString(),
        replies: [],
      }
      const prev = queryClient.getQueryData<CommentNode[]>(commentKeys.list(sessionId))
      queryClient.setQueryData<CommentNode[]>(commentKeys.list(sessionId), (old) => {
        const next = old ? [...old] : []
        if (parentId) {
          return next.map((c) => addReplyToTree(c, parentId, tmp))
        }
        return [...next, tmp]
      })
      return { prev, tmpId }
    },
    onError: (err, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(commentKeys.list(sessionId), ctx.prev)
      toast.error(getApiErrorMessage(err, '댓글 작성에 실패했어요'))
    },
    onSuccess: () => {
      editor?.commands.clearContent()
      setIsEmpty(true)
      setSuggestion({ open: false, query: '', command: null })
      onSubmitted?.()
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: commentKeys.list(sessionId) })
    },
  })

  const canSubmit = !isEmpty && !createMutation.isPending

  return (
    <div className="space-y-2 relative">
      <div className="relative">
        <EditorContent editor={editor} />
        <MentionAutocomplete
          crewId={crewId}
          query={suggestion.query}
          open={suggestion.open}
          onSelect={handleMentionSelect}
          anchorRef={editorAnchorRef}
        />
      </div>

      <div className="flex items-center justify-end gap-2">
        {onCancel && (
          <Button variant="ghost" size="sm" onClick={onCancel} className="cursor-pointer">
            <X className="h-3 w-3 mr-1" /> 취소
          </Button>
        )}
        <Button
          size="sm"
          onClick={() => createMutation.mutate()}
          disabled={!canSubmit}
          className="cursor-pointer"
        >
          <Send className="h-3 w-3 mr-1" /> 등록
        </Button>
      </div>
    </div>
  )
}

function addReplyToTree(node: CommentNode, parentId: number, reply: CommentNode): CommentNode {
  if (node.id === parentId) {
    return { ...node, replies: [...node.replies, reply] }
  }
  return { ...node, replies: node.replies.map((r) => addReplyToTree(r, parentId, reply)) }
}
