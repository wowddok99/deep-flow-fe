"use client"

import * as React from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Editor } from "./Editor"
import { useTimerStore } from "@/store/timer-store"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { Edit3, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { extractTextFromContent } from "@/lib/utils"

export function SessionEditorSheet({ trigger }: { trigger?: React.ReactNode }) {
  const { sessionId, isRunning } = useTimerStore()
  const queryClient = useQueryClient()
  const [isSaving, setIsSaving] = React.useState(false)

  // Fetch existing session data
  const { data: session, isLoading, refetch } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => api.sessions.get(sessionId!),
    enabled: !!sessionId,
    // staleTime removed to ensure fresh data fetch on mount
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

  // Actual save logic
  // Track title state
  const [title, setTitle] = React.useState("")
  const titleRef = React.useRef("") // Ref to access latest title in timeouts

  // Sync title from session
  React.useEffect(() => {
    if (session?.title) {
      setTitle(session.title)
      titleRef.current = session.title
    }
  }, [session?.title])

  const handleSave = async (content: any) => {
    if (!sessionId) return
    setIsSaving(true)
    try {
      const summary = extractTextFromContent(content);
      await api.logs.update(sessionId, {
        content,
        title: titleRef.current, // Use ref for latest value
        summary,
        tags: session?.tags || [],
        imageUrls: session?.imageUrls || []
      })
      isDirtyRef.current = false
      // Ensure next fetch gets fresh data
      await queryClient.invalidateQueries({ queryKey: ['session', sessionId] })
      await queryClient.invalidateQueries({ queryKey: ['sessions'] })
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

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Auto-save after 1s
    timeoutRef.current = setTimeout(() => {
      handleSave(content)
    }, 1000)
  }

  const onTitleChange = (newTitle: string) => {
    setTitle(newTitle)
    titleRef.current = newTitle // Update ref immediately
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

  // Controlled state for Sheet
  const [open, setOpen] = React.useState(false)

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
      setOpen(false)
      touchStart.current = null
    }
  }

  const handleTouchEnd = () => {
    touchStart.current = null
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button size="sm" className="w-full gap-2 cursor-pointer" variant="outline">
            <Edit3 className="h-3 w-3" />
            Open Editor
          </Button>
        )}
      </SheetTrigger>
      <SheetContent
        className="w-[400px] sm:w-[540px] flex flex-col h-full bg-background/95 dark:bg-zinc-950/95 border-l-0 shadow-2xl backdrop-blur-sm [&>button]:hidden outline-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <SheetHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
          <SheetTitle>Session Log</SheetTitle>
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
