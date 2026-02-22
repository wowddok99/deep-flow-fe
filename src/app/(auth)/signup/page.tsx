"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { getApiErrorCode, getApiErrorMessage } from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    name: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Simple client-side validation
    if (formData.username.length < 6 || formData.username.length > 20) {
        setError("아이디는 6자 이상 20자 이하여야 합니다.");
        setLoading(false);
        return;
    }

    if (formData.password.length < 4) {
        setError("비밀번호는 최소 4자 이상이어야 합니다.");
        setLoading(false);
        return;
    }

    try {
      await signup(formData);
      // Optional: Auto-login or redirect to login. Implementation plan said redirect to login or auto-login.
      // Let's redirect to login for simplicity and clarity.
      router.push("/login?signup=success");
    } catch (err: unknown) {
      console.error(err);
      const code = getApiErrorCode(err);
      if (code === 'DUPLICATE_USERNAME') {
        setError("이미 존재하는 아이디입니다.");
      } else if (code === 'VALIDATION_ERROR') {
        setError(getApiErrorMessage(err, "입력값을 확인해주세요."));
      } else {
        setError("회원가입에 실패했습니다. 잠시 후 다시 시도해주세요.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">회원가입</h1>
        <p className="text-sm text-muted-foreground">
          Deep Flow와 함께 몰입을 시작하세요.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="space-y-2">
            <label
            htmlFor="name"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
            이름
            </label>
            <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="이름을 입력해주세요"
            className="flex h-10 w-full rounded-md border border-zinc-800 bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 transition-colors hover:border-zinc-700"
            value={formData.name}
            onChange={handleChange}
            />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="username"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            아이디
          </label>
          <input
            id="username"
            name="username"
            type="text"
            required
            minLength={6}
            maxLength={20}
            placeholder="아이디 입력(6~20자)"
            className="flex h-10 w-full rounded-md border border-zinc-800 bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 transition-colors hover:border-zinc-700"
            value={formData.username}
            onChange={handleChange}
          />
        </div>
        <div className="space-y-2">
          <label
            htmlFor="password"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            비밀번호
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            placeholder="비밀번호 입력"
            className="flex h-10 w-full rounded-md border border-zinc-800 bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 transition-colors hover:border-zinc-700"
            value={formData.password}
            onChange={handleChange}
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-500 animate-in fade-in slide-in-from-top-1">
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
             {error}
          </div>
        )}

        <Button type="submit" className="w-full cursor-pointer" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              가입 중...
            </>
          ) : (
            "회원가입"
          )}
        </Button>
      </form>

      <div className="text-center text-sm text-muted-foreground">
        이미 계정이 있으신가요?{" "}
        <Link
          href="/login"
          className="underline underline-offset-4 hover:text-primary transition-colors"
        >
          로그인
        </Link>
      </div>
    </div>
  );
}
