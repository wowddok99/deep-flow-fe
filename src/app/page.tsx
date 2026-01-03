"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      
      {/* Navigation */}
      <nav className="relative z-50 flex items-center justify-between px-8 py-6 max-w-6xl mx-auto w-full">
         <div className="font-bold text-xl tracking-tighter select-none cursor-default text-white">
            Deep Flow
         </div>
         <div className="flex items-center gap-5">
             <Link href="/login" className="text-[15px] font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer">
                로그인
             </Link>
             <Link href="/signup" className="text-[15px] font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer">
                회원가입
             </Link>
         </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 -mt-20 relative z-0">
        <motion.div
           initial={{ opacity: 0, y: 30 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }} // Soft refined ease
           className="flex flex-col items-center max-w-3xl mx-auto"
        >
           <h1 className="text-4xl sm:text-6xl font-bold tracking-tighter text-white leading-[1.1] word-keep-all mb-8">
              깊이 있는 <br />
              몰입의 시작
           </h1>
           
           <p className="text-base sm:text-lg text-zinc-400 font-light leading-relaxed max-w-xl mx-auto break-keep mb-12">
              Deep Flow와 함께 체계적인 집중 세션과<br /> 회고를 기록하며 진정한 딥워크를 경험하세요.
           </p>

           <div className="flex flex-col items-center justify-center gap-6">
              <Link href="/signup">
                <Button className="h-14 px-10 rounded-full text-lg font-medium bg-white text-black hover:bg-zinc-200 transition-colors cursor-pointer">
                   시작하기 <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/login" className="text-sm font-medium text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer">
                 이미 계정이 있으신가요?
              </Link>
           </div>
        </motion.div>
      </main>

      <footer className="py-8 text-center relative z-10">
         <p className="text-xs text-muted-foreground font-medium opacity-50">
            Deep Flow © 2025
         </p>
      </footer>
    </div>
  );
}
