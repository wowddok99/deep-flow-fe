"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { Loader2 } from "lucide-react";


export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, checkAuth } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (!isAuthenticated) {
        await checkAuth();
      }
      setIsChecking(false);
    };
    initAuth();
  }, [checkAuth, isAuthenticated]);

  useEffect(() => {
    if (!isChecking && !isAuthenticated) {
        // Remember where they were trying to go?
        router.push("/login");
    }
  }, [isChecking, isAuthenticated, router]);

  if (isChecking) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4">
          {/* Re-applying the premium design but with standard size (h-12) */}
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-zinc-800 border-t-white" />
          <p className="text-lg font-medium text-white">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
      return null; // Will redirect via useEffect
  }

  return <>{children}</>;
}
