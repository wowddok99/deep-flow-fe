"use client"

import * as React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ErrorBoundary } from "@/components/ui/error-boundary"
import { Toaster } from "sonner"

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
      },
    },
  }))

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary>
          <TooltipProvider delayDuration={100}>
            {children}
            <Toaster
              position="top-center"
              theme="system"
              toastOptions={{
                classNames: {
                  toast: 'bg-card border border-border text-foreground shadow-lg rounded-lg',
                  title: 'text-sm font-medium',
                  description: 'text-xs text-muted-foreground',
                  closeButton:
                    'bg-transparent border-0 text-muted-foreground hover:text-foreground hover:bg-muted/60',
                  success: '[&>[data-icon]]:text-emerald-500',
                  error: '[&>[data-icon]]:text-destructive',
                  warning: '[&>[data-icon]]:text-amber-500',
                  info: '[&>[data-icon]]:text-foreground',
                },
              }}
            />
          </TooltipProvider>
        </ErrorBoundary>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
