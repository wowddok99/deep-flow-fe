"use client"

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Editor } from "./Editor"
import { api } from "@/lib/api"
import { Loader2 } from "lucide-react"
import { extractTextFromContent } from "@/lib/utils"

interface SessionDetailSheetProps {
  sessionId: number | null
  onClose: () => void
}

export function SessionDetailSheet({ sessionId, onClose }: SessionDetailSheetProps) {
  const queryClient = useQueryClient()
  const [isSaving, setIsSaving] = React.useState(false)

  const { data: session, isLoading } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => api.sessions.get(sessionId!),
    enabled: !!sessionId,
    staleTime: 0, // Ensure fresh data on every open
    refetchOnMount: true
  })

  // Parse content safely
  const initialContent = React.useMemo(() => {
    if (!session?.content) return null
    try {
      return JSON.parse(session.content)
    } catch (e) {
      console.error("Failed to parse content JSON", e)
      return null
    }
  }, [session?.content])

  // Ref to track latest content for unmount saving
  const contentRef = React.useRef<any>(null)
  const isDirtyRef = React.useRef(false)
  const timeoutRef = React.useRef<NodeJS.Timeout>(null)

  // Track title state
  const [title, setTitle] = React.useState("")
  const titleRef = React.useRef("")

  // Sync title from session
  React.useEffect(() => {
    if (session?.title) {
      setTitle(session.title)
      titleRef.current = session.title
    }
  }, [session?.title])

  // Save changes
  const handleSave = async (content: any) => {
    if (!sessionId) return
    setIsSaving(true)
    try {
      const summary = extractTextFromContent(content);
      await api.logs.update(sessionId, {
        content,
        title: titleRef.current, // Use ref
        summary,
        tags: session?.tags || [],
        imageUrls: session?.imageUrls || []
      })
      isDirtyRef.current = false
      // Refresh list AND detail
      await queryClient.invalidateQueries({ queryKey: ['sessions'] })
      await queryClient.invalidateQueries({ queryKey: ['session', sessionId] })
    } catch (e) {
      console.error("Save failed", e)
    } finally {
      setIsSaving(false)
    }
  }

  const onEditorUpdate = (content: any) => {
    contentRef.current = content
    isDirtyRef.current = true
    setIsSaving(true)

    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      handleSave(content)
    }, 1000)
  }

  const onTitleChange = (newTitle: string) => {
    setTitle(newTitle)
    titleRef.current = newTitle
    isDirtyRef.current = true

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Auto-save title change with content
    timeoutRef.current = setTimeout(() => {
      handleSave(contentRef.current || initialContent)
    }, 1000)
  }

  // Save on unmount (sheet close)
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (isDirtyRef.current && contentRef.current && sessionId) {
        // Optimistically update cache so immediate re-open shows data
        queryClient.setQueryData(['session', sessionId], (old: any) => {
          if (!old) return old;
          // Ensure we don't break the structure
          return {
            ...old,
            content: JSON.stringify(contentRef.current)
          }
        })

        // Fire save
        handleSave(contentRef.current)
      }
    }
  }, [sessionId, queryClient])

  // Swipe to close logic
  const touchStart = React.useRef<number | null>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.targetTouches[0].clientX
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart.current) return
    const currentX = e.targetTouches[0].clientX
    const diff = currentX - touchStart.current

    // If swiping right significantly
    if (diff > 100) {
      onClose()
      touchStart.current = null
    }
  }

  const handleTouchEnd = () => {
    touchStart.current = null
  }

  return (
    <Sheet open={!!sessionId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        className="w-full sm:w-[600px] flex flex-col h-full bg-background/95 dark:bg-zinc-950/95 border-l-0 shadow-2xl backdrop-blur-sm sm:max-w-[600px] [&>button]:hidden outline-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <SheetHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
          <SheetTitle>
            {isLoading ? "Loading..." : moment(session?.startTime)}
          </SheetTitle>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {isSaving ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Saving...
              </>
            ) : (
              <span>Saved</span>
            )}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Editor
              initialContent={initialContent}
              title={title}
              onChangeTitle={onTitleChange}
              onSave={onEditorUpdate}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function moment(dateStr?: string) {
  if (!dateStr) return "Session Log"
  return new Date(dateStr).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  })
}
