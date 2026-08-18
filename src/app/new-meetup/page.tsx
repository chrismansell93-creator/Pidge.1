"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { meetupSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";

type MeetupFormValues = z.input<typeof meetupSchema>;

export default function NewMeetupPage() {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MeetupFormValues>({
    resolver: zodResolver(meetupSchema),
    defaultValues: { type: "coffee" },
  });

  async function onSubmit(data: MeetupFormValues) {
    setStatus(null);
    const res = await fetch("/api/meetups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, type: data.type ?? "coffee" }),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => null);
      setStatus(json?.error ?? "Could not create meetup");
      return;
    }

    setStatus("Meetup created");
    router.push("/dashboard");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl items-center justify-center p-6">
      <div className="w-full space-y-6 rounded-xl border border-zinc-200 p-6 shadow-sm">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">New date idea</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Plan a low-pressure way to meet</h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="title" className="text-sm font-medium">Title</label>
            <input id="title" className="w-full rounded-md border border-zinc-300 p-3 text-sm" {...register("title")} />
            {errors.title && <p className="text-sm text-red-600">{errors.title.message}</p>}
          </div>

          <div className="space-y-1">
            <label htmlFor="summary" className="text-sm font-medium">Summary</label>
            <textarea id="summary" rows={4} className="w-full rounded-md border border-zinc-300 p-3 text-sm" {...register("summary")} />
            {errors.summary && <p className="text-sm text-red-600">{errors.summary.message}</p>}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <label htmlFor="date" className="text-sm font-medium">Date</label>
              <input id="date" type="date" className="w-full rounded-md border border-zinc-300 p-3 text-sm" {...register("date")} />
            </div>
            <div className="space-y-1">
              <label htmlFor="time" className="text-sm font-medium">Time</label>
              <input id="time" type="time" className="w-full rounded-md border border-zinc-300 p-3 text-sm" {...register("time")} />
            </div>
            <div className="space-y-1">
              <label htmlFor="type" className="text-sm font-medium">Type</label>
              <select id="type" className="w-full rounded-md border border-zinc-300 p-3 text-sm" {...register("type")}>
                <option value="coffee">Coffee</option>
                <option value="walk">Walk</option>
                <option value="virtual">Virtual</option>
                <option value="networking">Networking</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="location" className="text-sm font-medium">Location</label>
            <input id="location" className="w-full rounded-md border border-zinc-300 p-3 text-sm" placeholder="Central Library, Zoom, etc." {...register("location")} />
          </div>

          {status && <p className="text-sm text-zinc-700">{status}</p>}
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Creating…" : "Create date idea"}
          </Button>
        </form>
      </div>
    </main>
  );
}
