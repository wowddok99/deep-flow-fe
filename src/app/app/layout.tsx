"use client";

import AuthGuard from "@/components/auth/AuthGuard";
import { AppNav } from "@/components/features/navigation/AppNav";
import { useCrewPresenceSSE } from "@/hooks/useCrewPresenceSSE";
import { NotificationBridge } from "@/components/features/notifications/NotificationBridge";
import { AchievementBridge } from "@/components/features/achievement/AchievementBridge";

function CrewPresenceBridge() {
  useCrewPresenceSSE();
  return null;
}

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthGuard>
      <CrewPresenceBridge />
      <NotificationBridge />
      <AchievementBridge />
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <AppNav />
        <main className="flex-1 min-w-0 overflow-hidden">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
