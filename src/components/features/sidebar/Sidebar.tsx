"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronRight, History, MoreVertical, Edit3, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SessionEditorSheet } from "@/components/features/editor/SessionEditorSheet"
import { SessionDetailSheet } from "@/components/features/editor/SessionDetailSheet"
import { Separator } from "@/components/ui/separator"
import { useTimerStore } from "@/store/timer-store"
import { useInfiniteQuery } from "@tanstack/react-query"
import { useInView } from "react-intersection-observer"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"
import { ModeToggle } from "@/components/mode-toggle"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export function Sidebar() {
  const [isOpen, setIsOpen] = React.useState(true)
  const [selectedSessionId, setSelectedSessionId] = React.useState<number | null>(null)
  const [sessionToDelete, setSessionToDelete] = React.useState<number | null>(null)

  const { isRunning, startTime } = useTimerStore()

  const { ref, inView } = useInView()

  const { 
    data: sessions, 
    isLoading, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage,
    refetch 
  } = useInfiniteQuery({
    queryKey: ['sessions'],
    queryFn: ({ pageParam }) => api.sessions.list(pageParam as number | undefined),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage: import("@/lib/api").CursorResponse<import("@/lib/api").SessionSummary>) => lastPage.hasNext ? lastPage.nextCursorId : undefined,
  })

  React.useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, fetchNextPage])

  // Refetch when timer status changes (to capture finished session)
  React.useEffect(() => {
    if (!isRunning) {
      refetch()
    }
  }, [isRunning, refetch])

  const handleDelete = async (id: number) => {
    try {
      await api.sessions.delete(id)
      setSessionToDelete(null)
      refetch()
    } catch (e) {
      console.error("Failed to delete session", e)
    }
  }

  return (
    <motion.aside
      className="relative h-full bg-card border-l border-border flex flex-col z-20 w-full max-w-[320px]"
      initial={{ width: 320 }}
      animate={{ width: isOpen ? "100%" : 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="absolute -left-12 top-6 z-30 flex flex-col gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <ChevronRight /> : <History />}
        </Button>
        <div className={cn("transition-opacity duration-300", isOpen ? "opacity-0 pointer-events-none" : "opacity-100")}>
          <ModeToggle />
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
          <h2 className="text-lg font-semibold tracking-tight">Focus Flow</h2>
          <div className="hidden sm:block -mr-2">
            <ModeToggle />
          </div>
        </div>

        <div className="px-2 sm:px-3 pb-2">
          {/* Active Session Card */}
          <AnimatePresence>
            {/* ... (Active Session Card logic same as before, omitted for brevity if mostly unchanged) ... */
              isRunning && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  className="bg-primary/5 border border-primary/20 rounded-xl p-3 sm:p-4 overflow-hidden mb-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-primary uppercase tracking-wider">Active</span>
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">You are in flow.</p>
                  <SessionEditorSheet />
                </motion.div>
              )}
          </AnimatePresence>
        </div>

        <Separator />

        <div className="py-4 px-2 sm:py-6 sm:px-3 flex-1 overflow-hidden">
          <div className="flex items-center justify-between mb-4 px-2 sm:px-3">
            <span className="text-sm font-medium text-muted-foreground">Recent History</span>
            <Button variant="ghost" size="icon" className="h-4 w-4 hidden sm:inline-flex" onClick={() => refetch()}>
              <History className="h-3 w-3" />
            </Button>
          </div>
          <ScrollArea className="h-full pr-3">
            <div className="space-y-4">
              {isLoading && <div className="text-xs text-muted-foreground text-center py-4">Loading history...</div>}

              {sessions?.pages.map((page, i) => (
                <React.Fragment key={i}>
                  {page.content.map((session) => (
                    <div key={session.id}
                      className="group flex flex-col gap-1 py-4 px-2 sm:px-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer border border-transparent hover:border-border/50 relative"
                      onClick={() => setSelectedSessionId(session.id)}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-2">
                        <span className="text-sm font-medium truncate w-full sm:flex-1 sm:min-w-0">
                          {session.title || `Session #${session.id}`}
                        </span>
                        <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto flex-shrink-0">
                          <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 sm:gap-0 flex-wrap sm:flex-nowrap">
                            <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">
                              {new Date(session.startTime).toLocaleDateString()}
                            </span>
                            <span className="text-[10px] text-muted-foreground/70 whitespace-nowrap">
                              {(() => {
                                const start = new Date(session.startTime);
                                const end = session.endTime
                                  ? new Date(session.endTime)
                                  : new Date(start.getTime() + session.durationSeconds * 1000);

                                const formatTime = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

                                if (session.status === 'ONGOING') {
                                  return "Now";
                                }

                                // Check if end date is different from start date
                                const isNextDay = start.getDate() !== end.getDate() ||
                                  start.getMonth() !== end.getMonth() ||
                                  start.getFullYear() !== end.getFullYear();

                                return `${formatTime(end)}${isNextDay ? ' (+1)' : ''}`;
                              })()}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSessionToDelete(session.id)
                            }}
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 break-words pr-6 mt-1">
                        {session.summary || "No summary"}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">
                          {Math.floor(session.durationSeconds / 60)}m
                        </span>
                      </div>
                    </div>
                  ))}
                </React.Fragment>
              ))}
              
              <div ref={ref} className="h-4 w-full" />
              {isFetchingNextPage && <div className="text-xs text-muted-foreground text-center py-2">Loading more...</div>}

              {!isLoading && sessions?.pages[0]?.content.length === 0 && (
                <div className="text-xs text-muted-foreground text-center py-4">No history yet</div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      <SessionDetailSheet
        sessionId={selectedSessionId}
        onClose={() => setSelectedSessionId(null)}
      />

      <AlertDialog open={!!sessionToDelete} onOpenChange={(open: boolean) => !open && setSessionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the session and its logs.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => sessionToDelete && handleDelete(sessionToDelete)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.aside>
  )
}
