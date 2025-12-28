import { Timer } from "@/components/features/timer/Timer"
import { Sidebar } from "@/components/features/sidebar/Sidebar"

export default function Home() {
  return (
    <main className="flex h-screen w-full overflow-hidden bg-background relative selection:bg-primary/20">
      <div className="flex-1 flex flex-col items-center justify-center relative">
        <Timer />
        
        <footer className="absolute bottom-8 text-center opacity-30 text-xs">
            <p>Deep Flow &copy; 2025</p>
        </footer>
      </div>
      <Sidebar />
    </main>
  )
}
