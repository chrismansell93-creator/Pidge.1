"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { acceptedTerms: false },
  });

  async function onSubmit(data: RegisterInput) {
    setError(null);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => null);
      setError(json?.error ?? "Something went wrong");
      return;
    }
    router.push("/login");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-[#ffc800] text-xl font-black text-black">
            P
          </span>
          <h1 className="mt-4 text-3xl font-black">Get on the grid</h1>
          <p className="mt-2 text-sm text-zinc-400">Show up to people around you.</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400" htmlFor="name">
              Name
            </label>
            <input
              id="name"
              autoComplete="name"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none focus:border-[#ffc800]"
              {...register("name")}
            />
            {errors.name && <p className="text-sm text-red-400">{errors.name.message}</p>}
          </div>
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
              autoComplete="new-password"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none focus:border-[#ffc800]"
              {...register("password")}
            />
            {errors.password && <p className="text-sm text-red-400">{errors.password.message}</p>}
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400" htmlFor="dateOfBirth">
              Date of birth
            </label>
            <input
              id="dateOfBirth"
              type="date"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none focus:border-[#ffc800]"
              {...register("dateOfBirth")}
            />
            {errors.dateOfBirth && <p className="text-sm text-red-400">{errors.dateOfBirth.message}</p>}
            <p className="text-[11px] text-zinc-500">You must be 18 or older. We use this to keep minors off Pidge.</p>
          </div>
          <label className="flex items-start gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              className="mt-1"
              {...register("acceptedTerms")}
            />
            <span>
              I am 18+ and I accept the{" "}
              <Link href="/terms" className="text-[#ffc800]">Terms</Link>,{" "}
              <Link href="/privacy" className="text-[#ffc800]">Privacy Policy</Link>, and{" "}
              <Link href="/community" className="text-[#ffc800]">Community Guidelines</Link>.
            </span>
          </label>
          {errors.acceptedTerms && <p className="text-sm text-red-400">{errors.acceptedTerms.message}</p>}
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button type="submit" variant="brand" size="full" disabled={isSubmitting}>
            {isSubmitting ? "Creating…" : "Create account"}
          </Button>
        </form>
        <p className="text-center text-sm text-zinc-400">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-[#ffc800]">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
