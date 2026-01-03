export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-black p-4 relative overflow-hidden text-white">
      <div className="z-10 w-full max-w-md space-y-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 shadow-lg backdrop-blur-xl">
        {children}
      </div>
    </div>
  );
}
