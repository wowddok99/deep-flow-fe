"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login(formData);
      router.push("/app");
    } catch (err: any) {
      console.error(err);
      setError("로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">로그인</h1>
        <p className="text-sm text-muted-foreground">
          Deep Flow에 오신 것을 환영합니다.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
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
            placeholder="아이디를 입력해주세요"
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
            placeholder="비밀번호를 입력해주세요"
            className="flex h-10 w-full rounded-md border border-zinc-800 bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 transition-colors hover:border-zinc-700"
            value={formData.password}
            onChange={handleChange}
          />
        </div>

        {error && (
          <div className="text-sm text-red-500 bg-red-500/10 p-2 rounded">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full cursor-pointer" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              로그인 중...
            </>
          ) : (
            "로그인"
          )}
        </Button>
      </form>

      <div className="text-center text-sm text-muted-foreground">
        계정이 없으신가요?{" "}
        <Link
          href="/signup"
          className="underline underline-offset-4 hover:text-primary transition-colors"
        >
          회원가입
        </Link>
      </div>
    </div>
  );
}
