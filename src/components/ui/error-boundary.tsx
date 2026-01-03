"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-4 text-center">
          <div className="rounded-full bg-red-100 p-3 text-red-600 dark:bg-red-900/30">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-semibold">Something went wrong</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            {this.state.error?.message || "An unexpected error occurred."}
          </p>
          <Button
            onClick={() => this.setState({ hasError: false, error: null })}
            variant="outline"
          >
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
