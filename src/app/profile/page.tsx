"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { profileSchema } from "@/lib/validations";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { AppChrome } from "@/components/app-chrome";
import { Button } from "@/components/ui/button";
import { isUnlimited } from "@/lib/membership";
import { PhotoEditor } from "@/components/photo-editor";
import {
  GENDER_OPTIONS,
  INTO_OPTIONS,
  MAX_TRIBES,
  TRIBE_OPTIONS,
  formatList,
  parseList,
} from "@/lib/profile-options";
import { cn } from "@/lib/utils";

type ProfileFormValues = z.input<typeof profileSchema>;

const fieldClass =
  "w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none focus:border-[#ffc800]";

export default function ProfilePage() {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [into, setInto] = useState<string[]>([]);
  const [tribes, setTribes] = useState<string[]>([]);
  const [unlimited, setUnlimited] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({ resolver: zodResolver(profileSchema) });

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        reset({
          name: data.name ?? "",
          bio: data.bio ?? "",
          city: data.city ?? "",
          timezone: data.timezone ?? "",
          latitude: data.latitude ?? undefined,
          longitude: data.longitude ?? undefined,
          interests: data.interests ?? "",
          availability: data.availability ?? "",
          age: data.age ?? undefined,
          headline: data.headline ?? "",
          lookingFor: data.lookingFor ?? "",
          gender: data.gender ?? "",
          into: data.into ?? "",
          image: data.image ?? "",
        });
        setInto(parseList(data.into));
        setTribes(parseList(data.tribes));
        setUnlimited(isUnlimited(data.membershipTier, data.membershipExpiresAt));
        setIsAdmin(Boolean(data.isAdmin));
        const album = Array.isArray(data.photos)
          ? data.photos
          : data.image
            ? [data.image]
            : [];
        setPhotos(album);
      })
      .catch(() => undefined);
  }, [reset]);

  async function onSubmit(data: ProfileFormValues) {
    setStatus(null);
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        photos,
        image: photos[0] ?? data.image ?? "",
        into: formatList(into),
        tribes: formatList(tribes),
      }),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => null);
      setStatus(json?.error ?? "Could not save profile");
      return;
    }

    setStatus("Saved. You’re back on the grid.");
    router.push("/");
    router.refresh();
  }

  return (
    <AppChrome locationLabel="My profile" isUnlimited={unlimited}>
      <div className="mx-auto max-w-xl px-4 py-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#ffc800]">Profile</p>
        <h1 className="mt-2 text-3xl font-black">How you show up nearby</h1>
        <Link
          href="/membership"
          className="mt-4 flex items-center justify-between rounded-2xl border border-[#ffc800]/40 bg-[#161200] px-4 py-3"
        >
          <div>
            <p className="text-sm font-black text-[#ffc800]">
              {unlimited ? "Unlimited" : "Limited · with adverts"}
            </p>
            <p className="text-xs text-zinc-400">
              {unlimited ? "No ads. Full grid." : "Upgrade for £10 / month"}
            </p>
          </div>
          <span className="rounded-lg bg-[#ffc800] px-3 py-1.5 text-xs font-black text-black">
            {unlimited ? "Manage" : "Go Unlimited"}
          </span>
        </Link>
        {isAdmin ? (
          <Link
            href="/dashboard"
            className="mt-3 flex items-center justify-between rounded-2xl border border-white/15 bg-white/5 px-4 py-3"
          >
            <div>
              <p className="text-sm font-black text-white">Site overview</p>
              <p className="text-xs text-zinc-400">Traffic, engagement & moderation</p>
            </div>
            <span className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-black text-white">
              Open admin
            </span>
          </Link>
        ) : null}
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="name" className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
                Name
              </label>
              <input id="name" className={fieldClass} {...register("name")} />
            </div>
            <div className="space-y-1">
              <label htmlFor="age" className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
                Age
              </label>
              <input id="age" type="number" className={fieldClass} {...register("age")} />
              {errors.age && <p className="text-sm text-red-400">{errors.age.message}</p>}
            </div>
          </div>
          <div className="space-y-1">
            <label htmlFor="headline" className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
              Headline
            </label>
            <input id="headline" className={fieldClass} {...register("headline")} />
          </div>
          <div className="space-y-1">
            <label htmlFor="bio" className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
              Bio
            </label>
            <textarea id="bio" rows={4} className={fieldClass} {...register("bio")} />
            {errors.bio && <p className="text-sm text-red-400">{errors.bio.message}</p>}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="gender" className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
                Gender
              </label>
              <select id="gender" className={fieldClass} {...register("gender")}>
                <option value="">Select</option>
                {GENDER_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label htmlFor="lookingFor" className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
                Looking for
              </label>
              <select id="lookingFor" className={fieldClass} {...register("lookingFor")}>
                <option value="">Select</option>
                <option value="Dates">Dates</option>
                <option value="Chat">Chat</option>
                <option value="Friends">Friends</option>
                <option value="Right now">Right now</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">Into</p>
            <div className="flex flex-wrap gap-2">
              {INTO_OPTIONS.map((option) => {
                const selected = into.includes(option);
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      if (option === "Everyone") {
                        setInto(selected ? [] : ["Everyone"]);
                        return;
                      }
                      const next = selected
                        ? into.filter((item) => item !== option)
                        : [...into.filter((item) => item !== "Everyone"), option];
                      setInto(next);
                    }}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-sm font-semibold",
                      selected ? "bg-[#ffc800] text-black" : "bg-white/5 text-zinc-300",
                    )}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">Tribes</p>
              <span className="text-[11px] text-zinc-500">
                {tribes.length}/{MAX_TRIBES}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {TRIBE_OPTIONS.map((option) => {
                const selected = tribes.includes(option);
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      if (selected) {
                        setTribes(tribes.filter((item) => item !== option));
                        return;
                      }
                      if (tribes.length >= MAX_TRIBES) return;
                      setTribes([...tribes, option]);
                    }}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-sm font-semibold",
                      selected ? "bg-[#ffc800] text-black" : "bg-white/5 text-zinc-300",
                      !selected && tribes.length >= MAX_TRIBES && "opacity-40",
                    )}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="space-y-1">
            <label htmlFor="city" className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
              Neighborhood
            </label>
            <input id="city" className={fieldClass} {...register("city")} />
          </div>
          <div className="space-y-1">
            <label htmlFor="interests" className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
              Interests
            </label>
            <input id="interests" className={fieldClass} placeholder="coffee, gym, nights out" {...register("interests")} />
          </div>
          <PhotoEditor photos={photos} onChange={setPhotos} />
          <input type="hidden" {...register("latitude")} />
          <input type="hidden" {...register("longitude")} />
          {status && <p className="text-sm text-zinc-300">{status}</p>}
          <Button type="submit" variant="brand" size="full" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Save and return to grid"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="full"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="border-white/15 text-zinc-300"
          >
            Sign out
          </Button>
          <button
            type="button"
            onClick={async () => {
              if (!window.confirm("Delete your account and remove you from the grid?")) return;
              const res = await fetch("/api/account", { method: "DELETE" });
              if (res.ok) {
                await signOut({ callbackUrl: "/login" });
              }
            }}
            className="w-full py-3 text-sm font-semibold text-red-400"
          >
            Delete account
          </button>
        </form>
      </div>
    </AppChrome>
  );
}
