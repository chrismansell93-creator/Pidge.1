"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { loginSchema, type LoginInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(data: LoginInput) {
    setError(null);
    const res = await signIn("credentials", { ...data, redirect: false });
    if (res?.error) {
      setError("Invalid email or password");
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-[#ffc800] text-xl font-black text-black">
            P
          </span>
          <h1 className="mt-4 text-3xl font-black tracking-[0.2em]">PIDGE</h1>
          <p className="mt-2 text-sm text-zinc-400">People nearby. Right now.</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none focus:border-[#ffc800]"
              {...register("email")}
            />
            {errors.email && <p className="text-sm text-red-400">{errors.email.message}</p>}
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none focus:border-[#ffc800]"
              {...register("password")}
            />
            {errors.password && <p className="text-sm text-red-400">{errors.password.message}</p>}
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button type="submit" variant="brand" size="full" disabled={isSubmitting}>
            {isSubmitting ? "Opening grid…" : "See who’s nearby"}
          </Button>
        </form>
        <p className="text-center text-sm text-zinc-400">
          18+ only. No account?{" "}
          <Link href="/register" className="font-semibold text-[#ffc800]">
            Sign up
          </Link>
        </p>
        <p className="flex justify-center gap-3 text-center text-[11px] text-zinc-500">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/safety">Safety</Link>
        </p>
      </div>
    </main>
  );
}
